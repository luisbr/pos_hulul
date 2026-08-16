require "test_helper"

class Api::HealthControllerTest < ActionDispatch::IntegrationTest
  test "returns api health" do
    get api_health_url

    assert_response :success
    assert_equal "ok", response.parsed_body["status"]
    assert_equal "hulul-pos-api", response.parsed_body["app"]
  end
end
