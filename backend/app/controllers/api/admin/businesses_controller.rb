class Api::Admin::BusinessesController < ApplicationController
  before_action :require_admin_access!
  before_action :require_hulul_admin!, only: %i[create update]

  def index
    businesses = Business.includes(:branches).order(:commercial_name)

    render json: businesses.map { |business| business_summary(business) }
  end

  def show
    business = Business.includes(branches: [ :cash_registers, :inventory_balances ], memberships: [ :user, { branch_assignments: :branch } ]).find(params[:id])

    render json: business_detail(business)
  end

  def create
    business = Business.create!(business_params)
    record_audit_event!(
      business: business,
      event_type: "business.created",
      auditable: business,
      metadata: { status: business.status, license_status: business.license_status }
    )

    render json: business_detail(business), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    business = Business.includes(:branches, :cash_registers, memberships: :user).find(params[:id])
    previous_status = business.status
    business.update!(business_params)
    record_audit_event!(
      business: business,
      event_type: previous_status == business.status ? "business.updated" : "business.status_updated",
      auditable: business,
      metadata: {
        previous_status: previous_status,
        status: business.status,
        changed_fields: business.previous_changes.except("updated_at").keys
      }
    )

    render json: business_detail(business.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def business_params
    params.require(:business).permit(
      :commercial_name,
      :legal_name,
      :rfc,
      :primary_contact_name,
      :phone,
      :whatsapp,
      :email,
      :status,
      :license_status,
      :trial_ends_at,
      :license_expires_at
    )
  end

  def business_summary(business)
    {
      id: business.id,
      commercial_name: business.commercial_name,
      legal_name: business.legal_name,
      rfc: business.rfc,
      status: business.status,
      license_status: business.license_status,
      branches_count: business.branches.size,
      primary_contact_name: business.primary_contact_name,
      phone: business.phone,
      whatsapp: business.whatsapp,
      email: business.email,
      trial_ends_at: business.trial_ends_at,
      license_expires_at: business.license_expires_at
    }
  end

  def business_detail(business)
    business_summary(business).merge(
      whatsapp: business.whatsapp,
      trial_ends_at: business.trial_ends_at,
      license_expires_at: business.license_expires_at,
      branches: business.branches.map do |branch|
        {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          address: branch.address,
          timezone: branch.timezone,
          currency: branch.currency,
          active: branch.active,
          operational_day_start_minute: branch.operational_day_start_minute,
          inventory_products_count: branch.inventory_balances.count { |balance| balance.quantity != 0 },
          cash_registers: branch.cash_registers.sort_by(&:code).map do |cash_register|
            {
              id: cash_register.id,
              name: cash_register.name,
              code: cash_register.code,
              active: cash_register.active,
              ticket_size: cash_register.ticket_size
            }
          end
        }
      end,
      users: business.memberships.reject { |membership| %w[hulul_admin hulul_support].include?(membership.role) }.map do |membership|
        {
          membership_id: membership.id,
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          role: membership.role,
          active: membership.active && membership.user.active,
          membership_active: membership.active,
          branch_assignments: membership.branch_assignments.map do |assignment|
            {
              id: assignment.id,
              branch_id: assignment.branch_id,
              branch_name: assignment.branch.name,
              role: assignment.role,
              active: assignment.active
            }
          end
        }
      end
    )
  end
end
