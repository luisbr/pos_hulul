class Api::Admin::BranchesController < ApplicationController
  before_action :require_admin_access!
  before_action :require_hulul_admin!

  def create
    business = Business.find(params[:business_id])
    branch = nil

    ActiveRecord::Base.transaction do
      branch = business.branches.create!(branch_params)
      if cash_register_params[:name].present? && cash_register_params[:code].present?
        business.cash_registers.create!(cash_register_params.merge(branch: branch))
      end
    end

    record_audit_event!(
      business: business,
      event_type: "branch.created",
      auditable: branch,
      metadata: { code: branch.code }
    )
    render json: branch_json(branch.reload), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    business = Business.find(params[:business_id])
    branch = business.branches.find(params[:id])
    branch.update!(branch_params)
    record_audit_event!(
      business: business,
      event_type: "branch.updated",
      auditable: branch,
      metadata: { changed_fields: branch.previous_changes.except("updated_at").keys }
    )
    render json: branch_json(branch)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def branch_params
    params.require(:branch).permit(:name, :code, :address, :timezone, :currency, :active, :operational_day_start_minute)
  end

  def cash_register_params
    params.fetch(:cash_register, {}).permit(:name, :code, :printer_name, :ticket_size, :active)
  end

  def branch_json(branch)
    {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      timezone: branch.timezone,
      currency: branch.currency,
      active: branch.active,
      operational_day_start_minute: branch.operational_day_start_minute,
      inventory_products_count: branch.inventory_balances.where.not(quantity: 0).count,
      cash_registers: branch.cash_registers.order(:code).map do |register|
        {
          id: register.id,
          name: register.name,
          code: register.code,
          active: register.active,
          ticket_size: register.ticket_size
        }
      end
    }
  end
end
