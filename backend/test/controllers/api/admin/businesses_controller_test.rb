require "test_helper"

class Api::Admin::BusinessesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(
      business: @business,
      name: "Sucursal Centro",
      code: "TOL"
    )
    @cash_register = CashRegister.create!(
      business: @business,
      branch: @branch,
      name: "Caja 1",
      code: "001"
    )
    @user = User.create!(
      name: "Ana Martinez",
      email: "ana@example.test",
      password: "password123"
    )
    Membership.create!(
      business: @business,
      user: @user,
      role: "cashier"
    )
  end

  test "lists businesses for admin" do
    get api_admin_businesses_url

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal @business.id, response.parsed_body.first["id"]
  end

  test "shows business detail" do
    get api_admin_business_url(@business)

    assert_response :success
    assert_equal @business.id, response.parsed_body["id"]
    assert_equal "Sucursal Centro", response.parsed_body["branches"].first["name"]
    assert_equal "Ana Martinez", response.parsed_body["users"].first["name"]
  end

  test "shows portal context" do
    get context_api_portal_business_url(@business)

    assert_response :success
    assert_equal @business.id, response.parsed_body["business"]["id"]
    assert_equal @branch.id, response.parsed_body["branch"]["id"]
    assert_equal @cash_register.id, response.parsed_body["cash_register"]["id"]
    assert_equal @user.id, response.parsed_body["operator"]["id"]
    assert_equal false, response.parsed_body["setup"]["complete"]
  end

  test "shows logged in user as operator in portal context" do
    token = @user.signed_id(purpose: "portal_session", expires_in: 30.days)

    get context_api_portal_business_url(@business), headers: {
      "Authorization" => "Bearer #{token}"
    }

    assert_response :success
    assert_equal @user.id, response.parsed_body["operator"]["id"]
    assert_equal @user.email, response.parsed_body["operator"]["email"]
  end

  test "updates business settings from portal" do
    token = @user.signed_id(purpose: "portal_session", expires_in: 30.days)

    patch settings_api_portal_business_url(@business), params: {
      business: {
        commercial_name: "Ferreteria La Central",
        legal_name: "Ferreteria La Central S.A. de C.V.",
        rfc: "FLC260816AB1",
        primary_contact_name: "Ana Martinez",
        phone: "555-010-2222",
        whatsapp: "555-010-3333",
        email: "admin@central.example"
      },
      branch: {
        name: "Sucursal Matriz",
        address: "Av. Principal 100"
      }
    }, headers: {
      "Authorization" => "Bearer #{token}"
    }, as: :json

    assert_response :success
    assert_equal "Ferreteria La Central", response.parsed_body["business"]["commercial_name"]
    assert_equal "Sucursal Matriz", response.parsed_body["branch"]["name"]
    assert_equal true, response.parsed_body["setup"]["complete"]
  end
end
