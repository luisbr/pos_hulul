require "test_helper"

class Api::Portal::SuppliersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @user = User.create!(name: "Ana Martinez", email: "ana-suppliers@example.test", password: "password123")
    Membership.create!(business: @business, user: @user, role: "owner")
    sign_in_as @user
    @supplier = Supplier.create!(
      business: @business,
      commercial_name: "Aceros del Centro",
      legal_name: "Aceros del Centro S.A. de C.V.",
      rfc: "ACE240815AB1",
      phone: "555-010-7700",
      email: "ventas@aceroscentro.mx",
      contact_name: "Mario Salas",
      active: true
    )
  end

  test "lists suppliers" do
    get api_portal_business_suppliers_url(@business)

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal @supplier.id, response.parsed_body.first["id"]
  end

  test "searches suppliers" do
    get api_portal_business_suppliers_url(@business), params: { q: "aceros" }

    assert_response :success
    assert_equal 1, response.parsed_body.length
  end

  test "shows supplier detail" do
    get api_portal_business_supplier_url(@business, @supplier)

    assert_response :success
    assert_equal "Aceros del Centro", response.parsed_body["commercial_name"]
  end

  test "creates supplier" do
    assert_difference -> { Supplier.count }, 1 do
      post api_portal_business_suppliers_url(@business), params: {
        supplier: {
          commercial_name: "Cables y Conductores",
          phone: "555-010-9911",
          email: "compras@cables.example",
          delivery_days: "Lun-Mie-Vie",
          payment_terms: "Contado",
          active: true
        }
      }
    end

    assert_response :created
    assert_equal "Cables y Conductores", response.parsed_body["commercial_name"]
  end

  test "updates supplier" do
    patch api_portal_business_supplier_url(@business, @supplier), params: {
      supplier: {
        phone: "555-010-8899",
        active: false,
        notes: "Pausado temporalmente"
      }
    }

    assert_response :success
    assert_equal "555-010-8899", response.parsed_body["phone"]
    assert_equal false, response.parsed_body["active"]
  end

  test "rejects duplicate email in business" do
    post api_portal_business_suppliers_url(@business), params: {
      supplier: {
        commercial_name: "Aceros Norte",
        email: @supplier.email
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Email"
  end
end
