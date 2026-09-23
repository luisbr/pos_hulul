class Api::Portal::InventoryMovementsController < ApplicationController
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: :create
  before_action -> { require_permission!("adjust_inventory") }, only: :create

  def index
    movements = business.inventory_movements
      .includes(:branch, :product, :unit, :created_by)
      .where(branch_id: accessible_portal_branches.select(:id))
      .recent
      .limit(100)
    movements = movements.where(branch_id: params[:branch_id]) if params[:branch_id].present?
    movements = movements.where(product_id: params[:product_id]) if params[:product_id].present?

    render json: movements.map { |movement| movement_json(movement) }
  end

  def create
    product = business.products.find(inventory_movement_params[:product_id])
    branch = portal_branch(inventory_movement_params[:branch_id])
    unit = inventory_movement_params[:unit_id].present? ? business.units.find(inventory_movement_params[:unit_id]) : product.base_unit
    created_by = portal_actor

    movement = ::Inventory::MovementRecorder.call(
      business:,
      branch:,
      product:,
      movement_type: inventory_movement_params[:movement_type],
      quantity: inventory_movement_params[:quantity],
      unit:,
      unit_cost_cents: inventory_movement_params[:unit_cost_cents],
      reference_type: inventory_movement_params[:reference_type],
      reference_id: inventory_movement_params[:reference_id],
      reason: inventory_movement_params[:reason],
      created_by:
    )

    render json: movement_json(movement), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def business
    portal_business
  end

  def inventory_movement_params
    params.require(:inventory_movement).permit(
      :branch_id,
      :product_id,
      :movement_type,
      :quantity,
      :unit_id,
      :unit_cost_cents,
      :reference_type,
      :reference_id,
      :reason,
      :created_by_id
    )
  end

  def movement_json(movement)
    {
      id: movement.id,
      movement_type: movement.movement_type,
      quantity: movement.quantity.to_s,
      base_quantity: movement.base_quantity.to_s,
      signed_base_quantity: movement.signed_base_quantity.to_s,
      unit_cost_cents: movement.unit_cost_cents,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      reason: movement.reason,
      created_at: movement.created_at.iso8601,
      branch: {
        id: movement.branch.id,
        name: movement.branch.name,
        code: movement.branch.code
      },
      product: {
        id: movement.product.id,
        sku: movement.product.sku,
        name: movement.product.name
      },
      unit: {
        id: movement.unit.id,
        name: movement.unit.name,
        abbreviation: movement.unit.abbreviation
      },
      created_by: movement.created_by && {
        id: movement.created_by.id,
        name: movement.created_by.name
      }
    }
  end
end
