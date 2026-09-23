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
      role: "owner"
    )
    @admin = User.create!(
      name: "Admin Hulul",
      email: "admin@hulul.example",
      password: "password123"
    )
    Membership.create!(
      business: @business,
      user: @admin,
      role: "hulul_admin"
    )
    @support = User.create!(
      name: "Soporte Hulul",
      email: "soporte@hulul.example",
      password: "password123"
    )
    Membership.create!(
      business: @business,
      user: @support,
      role: "hulul_support"
    )
  end

  test "requires session for admin businesses" do
    get api_admin_businesses_url

    assert_response :unauthorized
  end

  test "rejects business owner without hulul admin role" do
    sign_in_as @user

    get api_admin_businesses_url

    assert_response :forbidden
  end

  test "lists businesses for admin" do
    sign_in_as @admin

    get api_admin_businesses_url

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal @business.id, response.parsed_body.first["id"]
  end

  test "shows business detail" do
    sign_in_as @support

    get api_admin_business_url(@business)

    assert_response :success
    assert_equal @business.id, response.parsed_body["id"]
    assert_equal "Sucursal Centro", response.parsed_body["branches"].first["name"]
    assert_equal "Ana Martinez", response.parsed_body["users"].first["name"]
  end

  test "admin creates business" do
    sign_in_as @admin

    assert_difference -> { Business.count }, 1 do
      assert_difference -> { AuditEvent.where(event_type: "business.created").count }, 1 do
        post api_admin_businesses_url, params: {
          business: {
            commercial_name: "Ferreteria La Nueva",
            legal_name: "Ferreteria La Nueva S.A. de C.V.",
            rfc: "FLN260918AB1",
            primary_contact_name: "Maria Lopez",
            phone: "555-010-4455",
            email: "maria@nueva.example",
            status: "active",
            license_status: "trial"
          }
        }, as: :json
      end
    end

    assert_response :created
    assert_equal "Ferreteria La Nueva", response.parsed_body["commercial_name"]
    assert_equal "trial", response.parsed_body["license_status"]
  end

  test "support cannot create business" do
    sign_in_as @support

    assert_no_difference -> { Business.count } do
      post api_admin_businesses_url, params: {
        business: { commercial_name: "Empresa no autorizada" }
      }, as: :json
    end

    assert_response :forbidden
  end

  test "admin updates business details" do
    sign_in_as @admin

    assert_difference -> { AuditEvent.where(event_type: "business.updated").count }, 1 do
      patch api_admin_business_url(@business), params: {
        business: {
          commercial_name: "Ferreteria El Tornillo Norte",
          email: "norte@tornillo.example",
          license_status: "active"
        }
      }, as: :json
    end

    assert_response :success
    assert_equal "Ferreteria El Tornillo Norte", @business.reload.commercial_name
    assert_equal "norte@tornillo.example", @business.email
    assert_equal "active", @business.license_status
  end

  test "admin creates branch with cash register" do
    sign_in_as @admin

    assert_difference -> { @business.branches.count }, 1 do
      assert_difference -> { @business.cash_registers.count }, 1 do
        post api_admin_business_branches_url(@business), params: {
          branch: {
            name: "Sucursal Norte",
            code: "NTE",
            address: "Av. Norte 10",
            timezone: "America/Mexico_City",
            currency: "MXN"
          },
          cash_register: {
            name: "Caja Norte 1",
            code: "001",
            ticket_size: "80mm"
          }
        }, as: :json
      end
    end

    assert_response :created
    assert_equal "Sucursal Norte", response.parsed_body["name"]
    assert_equal "Caja Norte 1", response.parsed_body["cash_registers"].first["name"]
  end

  test "admin creates business user assigned to branches" do
    sign_in_as @admin

    assert_difference -> { @business.memberships.where(role: "member").count }, 1 do
      post api_admin_business_users_url(@business), params: {
        user: {
          name: "Cajero Norte",
          email: "cajero.norte@example.test",
          password: "password123"
        },
        membership: {
          role: "member",
          active: true,
          branch_assignments: [
            { branch_id: @branch.id, role: "cashier", active: true }
          ]
        }
      }, as: :json
    end

    assert_response :created
    assert_equal "member", response.parsed_body["role"]
    assert_equal @branch.id, response.parsed_body["branch_assignments"].first["branch_id"]
  end

  test "support cannot create branch or business user" do
    sign_in_as @support

    post api_admin_business_branches_url(@business), params: {
      branch: { name: "No autorizada", code: "NOA" }
    }, as: :json
    assert_response :forbidden

    post api_admin_business_users_url(@business), params: {
      user: { name: "No autorizado", email: "no@example.test", password: "password123" },
      membership: { role: "cashier", active: true }
    }, as: :json
    assert_response :forbidden
  end

  test "admin updates business status" do
    sign_in_as @admin

    assert_difference -> { AuditEvent.where(event_type: "business.status_updated").count }, 1 do
      patch api_admin_business_url(@business), params: {
        business: {
          status: "suspended"
        }
      }, as: :json
    end

    assert_response :success
    assert_equal "suspended", response.parsed_body["status"]
    assert_equal "suspended", @business.reload.status

    event = AuditEvent.recent.first
    assert_equal @business, event.business
    assert_equal @admin, event.actor
    assert_equal "active", event.metadata["previous_status"]
    assert_equal "suspended", event.metadata["status"]
  end

  test "support cannot update business status" do
    sign_in_as @support

    patch api_admin_business_url(@business), params: {
      business: {
        status: "suspended"
      }
    }, as: :json

    assert_response :forbidden
    assert_equal "active", @business.reload.status
  end

  test "shows portal context" do
    sign_in_as @user

    get context_api_portal_business_url(@business)

    assert_response :success
    assert_equal @business.id, response.parsed_body["business"]["id"]
    assert_equal @branch.id, response.parsed_body["branch"]["id"]
    assert_equal @cash_register.id, response.parsed_body["cash_register"]["id"]
    assert_equal @user.id, response.parsed_body["operator"]["id"]
    assert_equal "active", response.parsed_body["business"]["status"]
    assert_equal false, response.parsed_body["setup"]["complete"]
  end

  test "shows logged in user as operator in portal context" do
    sign_in_as @user

    get context_api_portal_business_url(@business)

    assert_response :success
    assert_equal @user.id, response.parsed_body["operator"]["id"]
    assert_equal @user.email, response.parsed_body["operator"]["email"]
  end

  test "updates business settings from portal" do
    sign_in_as @user

    patch settings_api_portal_business_url(@business), params: {
      business: {
        commercial_name: "Ferreteria La Central",
        legal_name: "Ferreteria La Central S.A. de C.V.",
        rfc: "FLC260816AB1",
        primary_contact_name: "Ana Martinez",
        phone: "555-010-2222",
        whatsapp: "555-010-3333",
        email: "admin@central.example"
      }
    }, as: :json

    assert_response :success
    assert_equal "Ferreteria La Central", response.parsed_body["business"]["commercial_name"]
    assert_equal "Sucursal Centro", response.parsed_body["branch"]["name"]
    assert_equal true, response.parsed_body["company_setup"]["complete"]
  end

  test "updates only the assigned branch settings from portal" do
    sign_in_as @user

    patch branch_settings_api_portal_business_url(@business), params: {
      branch_id: @branch.id,
      branch: {
        name: "Sucursal Matriz",
        address: "Av. Principal 100"
      }
    }, as: :json

    assert_response :success
    assert_equal "Ferreteria El Tornillo", response.parsed_body["business"]["commercial_name"]
    assert_equal "Sucursal Matriz", response.parsed_body["branch"]["name"]
    assert_equal true, response.parsed_body["branch_setup"]["complete"]
  end

  test "manager edits a branch but cannot edit the company" do
    membership = @business.memberships.find_by!(user: @user)
    membership.update!(role: "manager")
    BranchAssignment.create!(membership: membership, branch: @branch, role: "manager")
    sign_in_as @user

    patch settings_api_portal_business_url(@business), params: {
      business: { commercial_name: "Cambio no permitido" }
    }, as: :json
    assert_response :forbidden

    patch branch_settings_api_portal_business_url(@business), params: {
      branch_id: @branch.id,
      branch: { name: "Sucursal Gerencia", address: "Calle 10" }
    }, as: :json
    assert_response :success
    assert_equal "Ferreteria El Tornillo", @business.reload.commercial_name
    assert_equal "Sucursal Gerencia", @branch.reload.name
  end

  test "blocks portal writes when business is suspended" do
    sign_in_as @user
    @business.update!(status: "suspended")

    patch settings_api_portal_business_url(@business), params: {
      business: {
        commercial_name: "Ferreteria La Central"
      }
    }, as: :json

    assert_response :forbidden
    assert_equal "Ferreteria El Tornillo", @business.reload.commercial_name
  end

  test "lists audit events for authorized portal user" do
    sign_in_as @user
    AuditEvent.create!(
      business: @business,
      actor: @admin,
      event_type: "business.status_updated",
      auditable: @business,
      metadata: {
        previous_status: "suspended",
        status: "active"
      }
    )

    get api_portal_business_audit_events_url(@business)

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal "business.status_updated", response.parsed_body.first["event_type"]
    assert_equal @admin.id, response.parsed_body.first["actor"]["id"]
  end
end
