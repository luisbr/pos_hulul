require "test_helper"

class Api::Portal::InventoryMovementsControllerTest < ActionDispatch::IntegrationTest
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
    @category = ProductCategory.create!(
      business: @business,
      name: "Construccion"
    )
    @unit = Unit.create!(
      business: @business,
      name: "Pieza",
      abbreviation: "pza"
    )
    @product = Product.create!(
      business: @business,
      category: @category,
      base_unit: @unit,
      name: "Varilla corrugada 3/8",
      sku: "VAR-001",
      sale_price_cents: 16_000,
      tax_mode: "included",
      tax_rate: 16,
      minimum_stock: 25
    )
    @user = User.create!(
      name: "Luis Ramirez",
      email: "luis@example.test",
      password: "password123"
    )
    @membership = Membership.create!(
      business: @business,
      user: @user,
      role: "warehouse"
    )
    sign_in_as @user
  end

  test "creates movement and updates balance" do
    assert_difference -> { InventoryMovement.count }, 1 do
      post api_portal_business_inventory_movements_url(@business), params: {
        inventory_movement: {
          branch_id: @branch.id,
          product_id: @product.id,
          movement_type: "initial_stock",
          quantity: "10",
          unit_id: @unit.id,
          unit_cost_cents: 12_500,
          reason: "Stock inicial",
          created_by_id: @user.id
        }
      }
    end

    assert_response :created
    balance = InventoryBalance.find_by!(business: @business, branch: @branch, product: @product)
    assert_equal 10, balance.quantity
  end

  test "requires reason for negative adjustment" do
    post api_portal_business_inventory_movements_url(@business), params: {
      inventory_movement: {
        branch_id: @branch.id,
        product_id: @product.id,
        movement_type: "negative_adjustment",
        quantity: "2",
        unit_id: @unit.id
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Reason"
  end

  test "lists recent movements" do
    Inventory::MovementRecorder.call(
      business: @business,
      branch: @branch,
      product: @product,
      movement_type: "initial_stock",
      quantity: 5,
      unit: @unit,
      reason: "Stock inicial",
      created_by: @user
    )

    get api_portal_business_inventory_movements_url(@business)

    assert_response :success
    assert_equal @product.sku, response.parsed_body.first["product"]["sku"]
  end

  test "uses the assigned branch role for a member" do
    @membership.update!(role: "member")
    BranchAssignment.create!(membership: @membership, branch: @branch, role: "warehouse")

    assert_difference -> { InventoryMovement.count }, 1 do
      post api_portal_business_inventory_movements_url(@business), params: {
        inventory_movement: {
          branch_id: @branch.id,
          product_id: @product.id,
          movement_type: "initial_stock",
          quantity: "3",
          unit_id: @unit.id,
          reason: "Recepcion de almacen"
        }
      }
    end

    assert_response :created
  end

  test "rejects an action forbidden by the assigned branch role" do
    @membership.update!(role: "member")
    BranchAssignment.create!(membership: @membership, branch: @branch, role: "cashier")

    assert_no_difference -> { InventoryMovement.count } do
      post api_portal_business_inventory_movements_url(@business), params: {
        inventory_movement: {
          branch_id: @branch.id,
          product_id: @product.id,
          movement_type: "initial_stock",
          quantity: "3",
          unit_id: @unit.id,
          reason: "Intento sin permiso"
        }
      }
    end

    assert_response :forbidden
  end
end
