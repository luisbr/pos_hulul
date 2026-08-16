class Api::Portal::BusinessesController < ApplicationController
  def context
    render_context(portal_business)
  end

  def settings
    return render json: { errors: [ "Sesion requerida" ] }, status: :unauthorized unless current_user

    business = current_user.businesses.find(params[:id])
    branch = business.branches.find_by!(active: true)

    business.update!(business_params)
    branch.update!(branch_params)

    render_context(business.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def portal_business
    Business.includes(:branches, :cash_registers, :users).find(params[:id])
  end

  def active_branch_for(business)
    business.branches.find(&:active)
  end

  def render_context(business)
    branch = active_branch_for(business)
    cash_register = branch && business.cash_registers.find { |register| register.branch_id == branch.id && register.active }
    cash_register_session = cash_register&.current_session
    operator = business.users.find_by(id: current_user&.id) || cash_register_session&.opened_by || business.users.order(:created_at).first
    cash_register_session&.recalculate_expected_cash!

    render json: {
      business: {
        id: business.id,
        commercial_name: business.commercial_name,
        legal_name: business.legal_name,
        rfc: business.rfc,
        primary_contact_name: business.primary_contact_name,
        phone: business.phone,
        whatsapp: business.whatsapp,
        email: business.email,
        license_status: business.license_status
      },
      setup: {
        complete: business.setup_complete?(branch),
        missing: business.setup_missing_fields(branch)
      },
      branch: branch && {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        timezone: branch.timezone,
        currency: branch.currency
      },
      cash_register: cash_register && {
        id: cash_register.id,
        name: cash_register.name,
        code: cash_register.code,
        current_folio_number: cash_register.current_folio_number,
        ticket_size: cash_register.ticket_size
      },
      operator: operator && {
        id: operator.id,
        name: operator.name,
        email: operator.email
      },
      cash_register_session: cash_register_session && {
        id: cash_register_session.id,
        status: cash_register_session.status,
        opened_at: cash_register_session.opened_at.iso8601,
        opening_amount_cents: cash_register_session.opening_amount_cents,
        expected_cash_cents: cash_register_session.expected_cash_cents,
        opened_by: {
          id: cash_register_session.opened_by.id,
          name: cash_register_session.opened_by.name
        }
      }
    }
  end

  def business_params
    params.require(:business).permit(
      :commercial_name,
      :legal_name,
      :rfc,
      :primary_contact_name,
      :phone,
      :whatsapp,
      :email
    )
  end

  def branch_params
    params.require(:branch).permit(:name, :address)
  end
end
