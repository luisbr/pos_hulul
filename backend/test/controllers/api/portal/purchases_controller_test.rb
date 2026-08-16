require "test_helper"

class Api::Portal::PurchasesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(business: @business, name: "Sucursal Centro", code: "TOL")
    @user = User.create!(name: "Luis Buendia", email: "luis-purchase@example.test", password: "password123")
    Membership.create!(business: @business, user: @user, role: "owner")
    @supplier = Supplier.create!(business: @business, commercial_name: "Aceros del Centro")
    @category = ProductCategory.create!(business: @business, name: "Acero")
    @unit = Unit.create!(business: @business, name: "Pieza", abbreviation: "pza")
    @product = Product.create!(
      business: @business,
      category: @category,
      base_unit: @unit,
      name: "Varilla corrugada 3/8",
      sku: "VAR-001",
      sale_price_cents: 16_000,
      current_cost_cents: 12_500,
      tax_mode: "included",
      tax_rate: 16,
      minimum_stock: 25
    )
  end

  test "lists purchases" do
    purchase = Purchases::Recorder.call(
      business: @business,
      branch: @branch,
      supplier: @supplier,
      created_by: @user,
      purchased_at: Time.current,
      items: [ { product_id: @product.id, quantity: "3", unit_cost_cents: 10_000 } ]
    )

    get api_portal_business_purchases_url(@business)

    assert_response :success
    assert_equal purchase.id, response.parsed_body.first["id"]
  end

  test "creates purchase and updates inventory and cost" do
    assert_difference -> { Purchase.count }, 1 do
      assert_difference -> { PurchaseItem.count }, 2 do
        assert_difference -> { InventoryMovement.where(movement_type: "purchase_receipt").count }, 2 do
          post api_portal_business_purchases_url(@business), params: {
            purchase: {
              branch_id: @branch.id,
              supplier_id: @supplier.id,
              created_by_id: @user.id,
              purchased_at: Time.current.iso8601,
              invoice_reference: "FAC-001",
              notes: "Compra semanal",
              items: [
                { product_id: @product.id, quantity: "5", unit_cost_cents: 11_500 },
                { product_id: @product.id, quantity: "2", unit_cost_cents: 12_000 }
              ]
            }
          }, as: :json
        end
      end
    end

    assert_response :created
    body = response.parsed_body
    assert_equal "received", body["status"]
    assert_equal 81_500, body["total_cents"]
    assert_equal "Aceros del Centro", body["supplier"]["commercial_name"]

    balance = InventoryBalance.find_by!(business: @business, branch: @branch, product: @product)
    assert_equal 7, balance.quantity
    assert_equal 12_000, @product.reload.current_cost_cents
  end
end
