class Api::Portal::BusinessesController < ApplicationController
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: %i[settings branch_settings]
  before_action -> { require_permission!("manage_business_settings") }, only: :settings
  before_action -> { require_permission!("manage_branch_settings") }, only: :branch_settings

  def context
    render_context(portal_business)
  end

  def settings
    business = portal_business
    business.update!(business_params)
    record_audit_event!(
      business: business,
      event_type: "business.settings_updated",
      auditable: business,
      metadata: {
        changed_business_fields: business.previous_changes.keys - %w[updated_at]
      }
    )

    render_context(business.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end


  def branch_settings
    business = portal_business
    branch = portal_branch(params[:branch_id])
    branch.update!(branch_params)
    record_audit_event!(
      business: business,
      event_type: "branch.settings_updated",
      auditable: branch,
      metadata: {
        branch_id: branch.id,
        changed_branch_fields: branch.previous_changes.keys - %w[updated_at]
      }
    )

    render_context(business.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def active_branch_for(business)
    portal_branch(params[:branch_id])
  end

  def render_context(business)
    branch = active_branch_for(business)
    cash_register = branch && business.cash_registers.find { |register| register.branch_id == branch.id && register.active }
    cash_register_session = cash_register&.current_session
    cash_register_session&.mark_pending_close_if_expired!
    operator = business.users.find_by(id: current_user&.id) || cash_register_session&.opened_by || business.users.order(:created_at).first
    cash_register_session&.recalculate_expected_cash! if cash_register_session&.active?

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
        status: business.status,
        license_status: business.license_status
      },
      setup: {
        complete: business.setup_complete?(branch),
        missing: business.setup_missing_fields(branch)
      },
      company_setup: {
        complete: business.company_setup_missing_fields.empty?,
        missing: business.company_setup_missing_fields
      },
      branch_setup: {
        complete: business.branch_setup_missing_fields(branch).empty?,
        missing: business.branch_setup_missing_fields(branch)
      },
      membership: {
        role: current_membership.role_for_branch(branch),
        base_role: current_membership.role,
        permissions: current_membership.permissions_for(branch)
      },
      branches: accessible_portal_branches.order(:name).map do |available_branch|
        {
          id: available_branch.id,
          name: available_branch.name,
          code: available_branch.code,
          address: available_branch.address,
          timezone: available_branch.timezone,
          currency: available_branch.currency
        }
      end,
      branch: branch && {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        timezone: branch.timezone,
        currency: branch.currency,
        operational_day_start_minute: branch.operational_day_start_minute
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
        closed_at: cash_register_session.closed_at&.iso8601,
        pending_close_at: cash_register_session.pending_close_at&.iso8601,
        opening_amount_cents: cash_register_session.opening_amount_cents,
        expected_cash_cents: cash_register_session.expected_cash_cents,
        counted_cash_cents: cash_register_session.counted_cash_cents,
        difference_cents: cash_register_session.difference_cents,
        closing_notes: cash_register_session.closing_notes,
        forced_closed: cash_register_session.forced_closed,
        force_close_reason: cash_register_session.force_close_reason,
        opened_by: {
          id: cash_register_session.opened_by.id,
          name: cash_register_session.opened_by.name
        },
        closed_by: cash_register_session.closed_by && {
          id: cash_register_session.closed_by.id,
          name: cash_register_session.closed_by.name
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
    params.require(:branch).permit(:name, :address, :operational_day_start_minute)
  end
end
