require "test_helper"

class Api::Portal::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @user = User.create!(name: "Ana Martinez", email: "ana-users@example.test", password: "password123")
    @membership = Membership.create!(business: @business, user: @user, role: "owner")
    @branch = Branch.create!(business: @business, name: "Sucursal Centro", code: "TOL")
    sign_in_as @user
  end

  test "lists business users" do
    get api_portal_business_users_url(@business)

    assert_response :success
    assert_equal 1, response.parsed_body.length
    assert_equal @user.id, response.parsed_body.first["id"]
    assert_equal "owner", response.parsed_body.first["role"]
  end

  test "creates user and membership" do
    assert_difference -> { User.count }, 1 do
      assert_difference -> { Membership.count }, 1 do
        post api_portal_business_users_url(@business), params: {
          user: {
            name: "Luis Ramirez",
            email: "luis-users@example.test",
            password: "password123"
          },
          membership: {
            role: "member",
            active: true,
            branch_assignments: [ { branch_id: @branch.id, role: "manager", active: true } ]
          }
        }
      end
    end

    assert_response :created
    assert_equal "Luis Ramirez", response.parsed_body["name"]
    assert_equal "member", response.parsed_body["role"]
    assert_equal "manager", response.parsed_body["branch_assignments"].first["role"]
  end

  test "attaches existing user to business" do
    existing = User.create!(name: "Maria Lopez", email: "maria-users@example.test", password: "password123")

    assert_no_difference -> { User.count } do
      assert_difference -> { Membership.count }, 1 do
        post api_portal_business_users_url(@business), params: {
          user: {
            name: "Maria Lopez",
            email: existing.email,
            password: ""
          },
          membership: {
            role: "member",
            active: true,
            branch_assignments: [ { branch_id: @branch.id, role: "warehouse", active: true } ]
          }
        }
      end
    end

    assert_response :created
    assert_equal existing.id, response.parsed_body["id"]
    assert_equal "member", response.parsed_body["role"]
    assert_equal "warehouse", response.parsed_body["branch_assignments"].first["role"]
  end

  test "updates user role and active status" do
    patch api_portal_business_user_url(@business, @user), params: {
      user: {
        name: "Ana Caja"
      },
      membership: {
        role: "member",
        active: false,
        branch_assignments: [ { branch_id: @branch.id, role: "manager", active: true } ]
      }
    }

    assert_response :success
    assert_equal "Ana Caja", response.parsed_body["name"]
    assert_equal "member", response.parsed_body["role"]
    assert_equal "manager", response.parsed_body["branch_assignments"].first["role"]
    assert_equal false, response.parsed_body["membership_active"]
  end

  test "rejects invalid role" do
    post api_portal_business_users_url(@business), params: {
      user: {
        name: "Rol Malo",
        email: "rol-malo@example.test",
        password: "password123"
      },
      membership: {
        role: "invalid",
        active: true
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Role"
  end

  test "rejects user without business membership" do
    other_business = Business.create!(
      commercial_name: "Ferreteria Ajena",
      status: "active",
      license_status: "trial"
    )

    get api_portal_business_users_url(other_business)

    assert_response :forbidden
    assert_includes response.parsed_body["errors"].join(" "), "No tienes acceso"
  end

  test "rejects user management without permission" do
    cashier = User.create!(name: "Cajero", email: "cajero-users@example.test", password: "password123")
    Membership.create!(business: @business, user: cashier, role: "cashier")
    sign_in_as cashier

    post api_portal_business_users_url(@business), params: {
      user: {
        name: "Sin Permiso",
        email: "sin-permiso@example.test",
        password: "password123"
      },
      membership: {
        role: "cashier",
        active: true
      }
    }

    assert_response :forbidden
    assert_includes response.parsed_body["errors"].join(" "), "No tienes permiso"
  end
end
