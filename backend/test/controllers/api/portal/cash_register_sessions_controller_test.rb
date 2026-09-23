require "test_helper"

class Api::Portal::CashRegisterSessionsControllerTest < ActionDispatch::IntegrationTest
  include ActiveSupport::Testing::TimeHelpers

  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      legal_name: "Ferreteria El Tornillo S.A. de C.V.",
      rfc: "FET240814AB1",
      primary_contact_name: "Ana Martinez",
      phone: "555-010-1000",
      email: "contacto@eltornillo.example",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(business: @business, name: "Sucursal Centro", code: "TOL", address: "Av. Principal 100")
    @cash_register = CashRegister.create!(business: @business, branch: @branch, name: "Caja 1", code: "001")
    @user = User.create!(name: "Ana Martinez", email: "ana@example.test", password: "password123")
    Membership.create!(business: @business, user: @user, role: "manager")
    unit = Unit.create!(business: @business, name: "Pieza", abbreviation: "pza")
    category = ProductCategory.create!(business: @business, name: "General")
    Supplier.create!(business: @business, commercial_name: "Proveedor base", active: true)
    product = Product.create!(
      business: @business,
      category: category,
      base_unit: unit,
      name: "Producto base",
      sku: "BASE-001",
      sale_price_cents: 1_000,
      tax_mode: "included",
      tax_rate: 16,
      minimum_stock: 0,
      active: true
    )
    InventoryBalance.create!(business: @business, branch: @branch, product: product, quantity: 1)
    sign_in_as @user
  end

  test "opens current and closes cash register session" do
    post api_portal_business_cash_register_session_url(@business), params: {
      cash_register_session: {
        branch_id: @branch.id,
        cash_register_id: @cash_register.id,
        opened_by_id: @user.id,
        opening_amount_cents: 350_000
      }
    }

    assert_response :created
    session_id = response.parsed_body["id"]
    assert_equal "open", response.parsed_body["status"]
    assert_equal 350_000, response.parsed_body["expected_cash_cents"]

    get current_api_portal_business_cash_register_session_url(@business), params: {
      cash_register_id: @cash_register.id
    }

    assert_response :success
    assert_equal session_id, response.parsed_body["id"]

    post close_api_portal_business_cash_register_session_url(@business), params: {
      cash_register_session: {
        cash_register_id: @cash_register.id,
        closed_by_id: @user.id,
        counted_cash_cents: 350_500,
        closing_notes: "Sobrante menor"
      }
    }

    assert_response :success
    assert_equal "closed", response.parsed_body["status"]
    assert_equal 500, response.parsed_body["difference_cents"]
  end

  test "prevents opening same cash register twice" do
    ::Cash::SessionOpener.call(
      business: @business,
      branch: @branch,
      cash_register: @cash_register,
      opened_by: @user,
      opening_amount_cents: 100_000
    )

    post api_portal_business_cash_register_session_url(@business), params: {
      cash_register_session: {
        branch_id: @branch.id,
        cash_register_id: @cash_register.id,
        opened_by_id: @user.id,
        opening_amount_cents: 100_000
      }
    }

    assert_response :unprocessable_entity
  end

  test "rejects opening cash before the branch operation is configured" do
    @branch.update!(address: nil)

    assert_no_difference -> { CashRegisterSession.count } do
      post api_portal_business_cash_register_session_url(@business), params: {
        cash_register_session: {
          branch_id: @branch.id,
          cash_register_id: @cash_register.id,
          opening_amount_cents: 100_000
        }
      }
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Completa la configuracion operativa"
    assert_includes response.parsed_body["missing"], "branch_address"
  end

  test "marks stale open session as pending close when current is requested" do
    @branch.update!(operational_day_start_minute: 360)
    travel_to Time.zone.local(2026, 8, 27, 10, 0, 0) do
      ::Cash::SessionOpener.call(
        business: @business,
        branch: @branch,
        cash_register: @cash_register,
        opened_by: @user,
        opening_amount_cents: 100_000
      )
    end

    travel_to Time.zone.local(2026, 8, 28, 7, 0, 0) do
      get current_api_portal_business_cash_register_session_url(@business), params: {
        cash_register_id: @cash_register.id
      }
    end

    assert_response :success
    assert_equal "pending_close", response.parsed_body["status"]
    assert CashRegisterSession.last.pending_close_at.present?
  end

  test "force closes pending cash register session and records audit movement" do
    session = ::Cash::SessionOpener.call(
      business: @business,
      branch: @branch,
      cash_register: @cash_register,
      opened_by: @user,
      opening_amount_cents: 100_000
    )
    session.update!(status: "pending_close", pending_close_at: Time.current)

    assert_difference -> { CashMovement.where(movement_type: "forced_closure").count }, 1 do
      post force_close_api_portal_business_cash_register_session_url(@business), params: {
        cash_register_session: {
          cash_register_id: @cash_register.id,
          closed_by_id: @user.id,
          counted_cash_cents: 100_000,
          force_close_reason: "Responsable no realizo cierre al terminar turno"
        }
      }
    end

    assert_response :success
    assert_equal "closed", response.parsed_body["status"]
    assert_equal true, response.parsed_body["forced_closed"]
    assert_equal "Responsable no realizo cierre al terminar turno", response.parsed_body["force_close_reason"]
    audit_movement = CashMovement.find_by!(cash_register_session: session, movement_type: "forced_closure")
    assert_equal "Responsable no realizo cierre al terminar turno", audit_movement.reason
  end

  test "requires reason to force close cash register session" do
    ::Cash::SessionOpener.call(
      business: @business,
      branch: @branch,
      cash_register: @cash_register,
      opened_by: @user,
      opening_amount_cents: 100_000
    )

    post force_close_api_portal_business_cash_register_session_url(@business), params: {
      cash_register_session: {
        cash_register_id: @cash_register.id,
        closed_by_id: @user.id,
        counted_cash_cents: 100_000,
        force_close_reason: ""
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "motivo"
  end

  test "rejects closing cash register without permission" do
    cashier = User.create!(name: "Cajero", email: "cajero-close@example.test", password: "password123")
    Membership.create!(business: @business, user: cashier, role: "cashier")
    sign_in_as cashier

    session = Cash::SessionOpener.call(
      business: @business,
      branch: @branch,
      cash_register: @cash_register,
      opened_by: cashier,
      opening_amount_cents: 100_000
    )

    post close_api_portal_business_cash_register_session_url(@business), params: {
      cash_register_session: {
        cash_register_id: @cash_register.id,
        counted_cash_cents: session.expected_cash_cents
      }
    }

    assert_response :forbidden
    assert_includes response.parsed_body["errors"].join(" "), "No tienes permiso"
  end
end
