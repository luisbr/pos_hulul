require "test_helper"

class Api::Portal::CashMovementsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(business: @business, name: "Sucursal Centro", code: "TOL")
    @cash_register = CashRegister.create!(business: @business, branch: @branch, name: "Caja 1", code: "001")
    @user = User.create!(name: "Ana Martinez", email: "ana@example.test", password: "password123")
    Membership.create!(business: @business, user: @user, role: "manager")
    sign_in_as @user
    @session = ::Cash::SessionOpener.call(
      business: @business,
      branch: @branch,
      cash_register: @cash_register,
      opened_by: @user,
      opening_amount_cents: 100_000
    )
  end

  test "creates cash movement and updates expected cash" do
    post api_portal_business_cash_movements_url(@business), params: {
      cash_movement: {
        cash_register_session_id: @session.id,
        movement_type: "sale_cash_payment",
        amount_cents: 25_000,
        created_by_id: @user.id
      }
    }

    assert_response :created
    assert_equal "sale_cash_payment", response.parsed_body["movement_type"]
    assert_equal 125_000, @session.reload.expected_cash_cents
  end

  test "requires reason for cash out" do
    post api_portal_business_cash_movements_url(@business), params: {
      cash_movement: {
        cash_register_session_id: @session.id,
        movement_type: "cash_out",
        amount_cents: -5_000,
        created_by_id: @user.id
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Reason"
  end

  test "lists movements" do
    get api_portal_business_cash_movements_url(@business), params: {
      cash_register_session_id: @session.id
    }

    assert_response :success
    assert_equal "opening", response.parsed_body.first["movement_type"]
  end
end
