require "test_helper"

class Api::Portal::CatalogsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
  end

  test "lists catalogs by business" do
    ProductCategory.create!(business: @business, name: "Plomeria")
    Brand.create!(business: @business, name: "Truper")
    Unit.create!(business: @business, name: "Pieza", abbreviation: "pza")

    get api_portal_business_catalogs_url(@business)

    assert_response :success
    assert_equal "Plomeria", response.parsed_body["categories"].first["name"]
    assert_equal "Truper", response.parsed_body["brands"].first["name"]
    assert_equal "pza", response.parsed_body["units"].first["abbreviation"]
  end

  test "creates and updates category" do
    post "/api/portal/businesses/#{@business.id}/catalogs/categories", params: {
      catalog: {
        name: "Tornilleria",
        active: true
      }
    }

    assert_response :created
    category_id = response.parsed_body["id"]
    assert_equal "Tornilleria", response.parsed_body["name"]

    patch "/api/portal/businesses/#{@business.id}/catalogs/categories/#{category_id}", params: {
      catalog: {
        name: "Tornilleria general",
        active: false
      }
    }

    assert_response :success
    assert_equal "Tornilleria general", response.parsed_body["name"]
    assert_equal false, response.parsed_body["active"]
  end

  test "creates and updates brand" do
    post "/api/portal/businesses/#{@business.id}/catalogs/brands", params: {
      catalog: {
        name: "Fandeli",
        active: true
      }
    }

    assert_response :created
    brand_id = response.parsed_body["id"]

    patch "/api/portal/businesses/#{@business.id}/catalogs/brands/#{brand_id}", params: {
      catalog: {
        name: "Fandeli Pro",
        active: false
      }
    }

    assert_response :success
    assert_equal "Fandeli Pro", response.parsed_body["name"]
    assert_equal false, response.parsed_body["active"]
  end

  test "creates and updates unit" do
    post "/api/portal/businesses/#{@business.id}/catalogs/units", params: {
      catalog: {
        name: "Caja",
        abbreviation: "caja",
        active: true
      }
    }

    assert_response :created
    unit_id = response.parsed_body["id"]
    assert_equal "caja", response.parsed_body["abbreviation"]

    patch "/api/portal/businesses/#{@business.id}/catalogs/units/#{unit_id}", params: {
      catalog: {
        name: "Caja cerrada",
        abbreviation: "cj",
        active: false
      }
    }

    assert_response :success
    assert_equal "Caja cerrada", response.parsed_body["name"]
    assert_equal "cj", response.parsed_body["abbreviation"]
    assert_equal false, response.parsed_body["active"]
  end
end
