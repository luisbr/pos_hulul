class Api::Admin::BusinessesController < ApplicationController
  def index
    businesses = Business.includes(:branches).order(:commercial_name)

    render json: businesses.map { |business| business_summary(business) }
  end

  def show
    business = Business.includes(:branches, :cash_registers, memberships: :user).find(params[:id])

    render json: business_detail(business)
  end

  private

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
      email: business.email
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
          active: branch.active
        }
      end,
      cash_registers: business.cash_registers.map do |cash_register|
        {
          id: cash_register.id,
          branch_id: cash_register.branch_id,
          name: cash_register.name,
          code: cash_register.code,
          active: cash_register.active,
          current_folio_number: cash_register.current_folio_number,
          ticket_size: cash_register.ticket_size
        }
      end,
      users: business.memberships.map do |membership|
        {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          role: membership.role,
          active: membership.active
        }
      end
    )
  end
end
