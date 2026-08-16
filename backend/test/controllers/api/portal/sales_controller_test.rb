require "test_helper"

class Api::Portal::SalesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(business: @business, name: "Sucursal Centro", code: "TOL")
    @cash_register = CashRegister.create!(
      business: @business,
      branch: @branch,
      name: "Caja 1",
      code: "001",
      current_folio_number: 43
    )
    @unit = Unit.create!(business: @business, name: "Pieza", abbreviation: "pza")
    @category = ProductCategory.create!(business: @business, name: "Acero")
    @product = Product.create!(
      business: @business,
      category: @category,
      base_unit: @unit,
      name: "Varilla corrugada 3/8",
      sku: "VAR-001",
      sale_price_cents: 16_000,
      tax_mode: "included",
      tax_rate: 16,
      minimum_stock: 2
    )
    @cashier = User.create!(name: "Ana Martinez", email: "ana-sales@example.test", password: "password123")
    Membership.create!(business: @business, user: @cashier, role: "cashier")
    @customer = Customer.create!(business: @business, customer_type: "person", commercial_name: "Publico en general", public_customer: true)

    Inventory::MovementRecorder.call(
      business: @business,
      branch: @branch,
      product: @product,
      movement_type: "initial_stock",
      quantity: 10,
      unit: @unit,
      reason: "Stock inicial",
      created_by: @cashier
    )
    @session = Cash::SessionOpener.call(
      business: @business,
      branch: @branch,
      cash_register: @cash_register,
      opened_by: @cashier,
      opening_amount_cents: 100_000
    )
  end

  test "creates paid sale and updates stock and expected cash" do
    assert_difference -> { Sale.count }, 1 do
      assert_difference -> { SaleItem.count }, 1 do
        assert_difference -> { Payment.count }, 1 do
          assert_difference -> { InventoryMovement.where(movement_type: "sale").count }, 1 do
            assert_difference -> { CashMovement.where(movement_type: "sale_cash_payment").count }, 1 do
              post api_portal_business_sales_url(@business), params: sale_params
            end
          end
        end
      end
    end

    assert_response :created
    body = response.parsed_body
    assert_equal "TOL-001-000043", body["folio"]
    assert_equal "paid", body["status"]
    assert_equal 32_000, body["total_cents"]
    assert_equal @customer.id, body["customer"]["id"]
    assert_equal 32_000, body["payments"].first["amount_cents"]
    assert_equal 68_000, body["payments"].first["change_amount_cents"]

    balance = InventoryBalance.find_by!(business: @business, branch: @branch, product: @product)
    assert_equal 8, balance.quantity
    assert_equal 132_000, @session.reload.expected_cash_cents
    assert_equal 44, @cash_register.reload.current_folio_number
  end

  test "does not create duplicate sale when request is retried" do
    post api_portal_business_sales_url(@business), params: sale_params(idempotency_key: "retry-001")
    assert_response :created

    assert_no_difference -> { Sale.count } do
      post api_portal_business_sales_url(@business), params: sale_params(idempotency_key: "retry-001")
    end

    assert_response :created
    assert_equal "retry-001", Sale.last.idempotency_key
  end

  test "rejects sale when cash register has no open session" do
    Cash::SessionCloser.call(
      cash_register_session: @session,
      counted_cash_cents: @session.expected_cash_cents,
      closed_by: @cashier
    )

    post api_portal_business_sales_url(@business), params: sale_params

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "caja"
  end

  test "rejects sale when stock is insufficient" do
    post api_portal_business_sales_url(@business), params: sale_params(quantity: "12", amount_cents: 192_000)

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Stock insuficiente"
    assert_equal 10, InventoryBalance.find_by!(business: @business, branch: @branch, product: @product).quantity
  end

  test "lists sales" do
    post api_portal_business_sales_url(@business), params: sale_params(idempotency_key: "list-001")
    get api_portal_business_sales_url(@business)

    assert_response :success
    assert_equal "TOL-001-000043", response.parsed_body.first["folio"]
  end

  test "cancels paid sale and reverts stock and cash" do
    post api_portal_business_sales_url(@business), params: sale_params(idempotency_key: "cancel-001")
    sale_id = response.parsed_body["id"]

    assert_difference -> { InventoryMovement.where(movement_type: "sale_cancellation").count }, 1 do
      assert_difference -> { CashMovement.where(movement_type: "refund").count }, 1 do
        post cancel_api_portal_business_sale_url(@business, sale_id), params: {
          sale: {
            cancelled_by_id: @cashier.id,
            cash_register_session_id: @session.id,
            cancellation_reason: "Cliente se equivoco"
          }
        }
      end
    end

    assert_response :success
    body = response.parsed_body
    assert_equal "cancelled", body["status"]
    assert_equal "Cliente se equivoco", body["cancellation_reason"]
    assert_equal @cashier.id, body["cancelled_by"]["id"]
    assert_equal 10, InventoryBalance.find_by!(business: @business, branch: @branch, product: @product).quantity
    assert_equal 100_000, @session.reload.expected_cash_cents
  end

  test "blocks double cancellation" do
    post api_portal_business_sales_url(@business), params: sale_params(idempotency_key: "cancel-002")
    sale_id = response.parsed_body["id"]

    post cancel_api_portal_business_sale_url(@business, sale_id), params: {
      sale: {
        cancelled_by_id: @cashier.id,
        cash_register_session_id: @session.id,
        cancellation_reason: "Cancelacion inicial"
      }
    }
    assert_response :success

    post cancel_api_portal_business_sale_url(@business, sale_id), params: {
      sale: {
        cancelled_by_id: @cashier.id,
        cash_register_session_id: @session.id,
        cancellation_reason: "Segundo intento"
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "ya esta cancelada"
  end

  test "requires open cash session to refund cash sale" do
    post api_portal_business_sales_url(@business), params: sale_params(idempotency_key: "cancel-003")
    sale_id = response.parsed_body["id"]

    Cash::SessionCloser.call(
      cash_register_session: @session,
      counted_cash_cents: @session.expected_cash_cents,
      closed_by: @cashier
    )

    post cancel_api_portal_business_sale_url(@business, sale_id), params: {
      sale: {
        cancelled_by_id: @cashier.id,
        cancellation_reason: "Cliente cancelo"
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Abre una caja"
  end

  private

  def sale_params(idempotency_key: "sale-test-001", quantity: "2", amount_cents: 32_000)
    {
      sale: {
        branch_id: @branch.id,
        cash_register_id: @cash_register.id,
        cashier_id: @cashier.id,
        customer_id: @customer.id,
        idempotency_key: idempotency_key,
        items: [
          {
            product_id: @product.id,
            quantity: quantity
          }
        ],
        payments: [
          {
            payment_method: "cash",
            amount_cents: amount_cents,
            received_amount_cents: 100_000
          }
        ]
      }
    }
  end
end
