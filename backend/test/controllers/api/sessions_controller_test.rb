require "test_helper"

class Api::SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @user = User.create!(
      name: "Luis Buendia",
      email: "luis.buendia@hulul.com.mx",
      password: "Abc123456"
    )
    Membership.create!(
      business: @business,
      user: @user,
      role: "owner",
      active: true
    )
  end

  test "creates session with valid credentials" do
    post api_session_url, params: {
      email: "luis.buendia@hulul.com.mx",
      password: "Abc123456"
    }, as: :json

    assert_response :success
    assert response.parsed_body["token"].present?
    assert_equal @user.id, response.parsed_body["user"]["id"]
    assert_equal @business.id, response.parsed_body["default_business_id"]
  end

  test "rejects invalid credentials" do
    post api_session_url, params: {
      email: "luis.buendia@hulul.com.mx",
      password: "incorrecta"
    }, as: :json

    assert_response :unauthorized
    assert_equal [ "Correo o contrasena incorrectos" ], response.parsed_body["errors"]
  end
end
