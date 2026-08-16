require "test_helper"

class Api::Portal::CashRegisterSessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(business: @business, name: "Sucursal Centro", code: "TOL")
    @cash_register = CashRegister.create!(business: @business, branch: @branch, name: "Caja 1", code: "001")
    @user = User.create!(name: "Ana Martinez", email: "ana@example.test", password: "password123")
    Membership.create!(business: @business, user: @user, role: "cashier")
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
end
