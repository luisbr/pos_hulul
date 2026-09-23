require "test_helper"

class Api::Portal::CustomersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @user = User.create!(name: "Ana Martinez", email: "ana-customers@example.test", password: "password123")
    Membership.create!(business: @business, user: @user, role: "owner")
    sign_in_as @user
    @customer = Customer.create!(
      business: @business,
      customer_type: "company",
      commercial_name: "Constructora Norte",
      legal_name: "Constructora Norte S.A. de C.V.",
      rfc: "CNO240815AB1",
      phone: "555-010-2200",
      email: "compras@constructoranorte.mx",
      contact_name: "Laura Gomez",
      active: true
    )
    @public_customer = Customer.create!(
      business: @business,
      customer_type: "person",
      commercial_name: "Publico en general",
      active: true,
      public_customer: true
    )
  end

  test "lists customers" do
    get api_portal_business_customers_url(@business)

    assert_response :success
    assert_equal 2, response.parsed_body.length
    assert_equal @public_customer.id, response.parsed_body.first["id"]
  end

  test "searches customers" do
    get api_portal_business_customers_url(@business), params: { q: "norte" }

    assert_response :success
    assert_equal 1, response.parsed_body.length
  end

  test "shows customer detail" do
    get api_portal_business_customer_url(@business, @customer)

    assert_response :success
    assert_equal "Constructora Norte", response.parsed_body["commercial_name"]
    assert_equal "company", response.parsed_body["customer_type"]
  end

  test "creates customer" do
    assert_difference -> { Customer.count }, 1 do
      post api_portal_business_customers_url(@business), params: {
        customer: {
          customer_type: "person",
          commercial_name: "Miguel Herrera",
          phone: "555-010-4488",
          email: "miguel@example.test",
          notes: "Compra frecuente",
          active: true
        }
      }
    end

    assert_response :created
    assert_equal "Miguel Herrera", response.parsed_body["commercial_name"]
    assert_equal "person", response.parsed_body["customer_type"]
  end

  test "updates customer" do
    patch api_portal_business_customer_url(@business, @customer), params: {
      customer: {
        phone: "555-010-8899",
        active: false,
        notes: "Cliente pausado"
      }
    }

    assert_response :success
    assert_equal "555-010-8899", response.parsed_body["phone"]
    assert_equal false, response.parsed_body["active"]
    assert_equal "Cliente pausado", response.parsed_body["notes"]
  end

  test "rejects deactivating public customer" do
    patch api_portal_business_customer_url(@business, @public_customer), params: {
      customer: {
        active: false
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Publico en general"
  end

  test "rejects duplicate email in business" do
    post api_portal_business_customers_url(@business), params: {
      customer: {
        customer_type: "company",
        commercial_name: "Norte Dos",
        email: @customer.email
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Email"
  end
end
