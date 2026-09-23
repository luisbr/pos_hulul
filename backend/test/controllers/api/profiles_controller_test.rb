require "test_helper"

class Api::ProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Hulul",
      status: "active",
      license_status: "trial"
    )
    @user = User.create!(
      name: "Administrador Hulul",
      email: "admin@hulul.com.mx",
      password: "Abc123456"
    )
    Membership.create!(
      business: @business,
      user: @user,
      role: "hulul_admin",
      active: true
    )
  end

  test "requires authentication" do
    get api_profile_url

    assert_response :unauthorized
  end

  test "shows current profile" do
    sign_in_as @user

    get api_profile_url

    assert_response :success
    assert_equal @user.id, response.parsed_body.dig("user", "id")
    assert_equal "admin@hulul.com.mx", response.parsed_body.dig("user", "email")
  end

  test "updates profile identity" do
    sign_in_as @user

    patch api_profile_url, params: {
      profile: {
        name: "Admin Principal",
        email: "principal@hulul.com.mx"
      }
    }, as: :json

    assert_response :success
    assert_equal "Admin Principal", @user.reload.name
    assert_equal "principal@hulul.com.mx", @user.email
    assert response.parsed_body["token"].present?
  end

  test "changes password when current password is valid" do
    sign_in_as @user

    patch api_profile_url, params: {
      profile: {
        name: @user.name,
        email: @user.email,
        current_password: "Abc123456",
        password: "Nueva123456",
        password_confirmation: "Nueva123456"
      }
    }, as: :json

    assert_response :success
    assert @user.reload.authenticate("Nueva123456")
    assert_not @user.authenticate("Abc123456")
  end

  test "rejects incorrect current password" do
    sign_in_as @user

    patch api_profile_url, params: {
      profile: {
        current_password: "incorrecta",
        password: "Nueva123456",
        password_confirmation: "Nueva123456"
      }
    }, as: :json

    assert_response :unprocessable_entity
    assert_equal [ "La contrasena actual es incorrecta" ], response.parsed_body["errors"]
    assert @user.reload.authenticate("Abc123456")
  end

  test "rejects password confirmation mismatch" do
    sign_in_as @user

    patch api_profile_url, params: {
      profile: {
        current_password: "Abc123456",
        password: "Nueva123456",
        password_confirmation: "Otra123456"
      }
    }, as: :json

    assert_response :unprocessable_entity
    assert_equal [ "La confirmacion de contrasena no coincide" ], response.parsed_body["errors"]
  end
end
