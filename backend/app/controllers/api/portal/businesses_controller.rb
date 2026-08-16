class Api::Portal::BusinessesController < ApplicationController
  def context
    business = Business.includes(:branches, :cash_registers, :users).find(params[:id])
    branch = business.branches.find(&:active)
    cash_register = branch && business.cash_registers.find { |register| register.branch_id == branch.id && register.active }
    cash_register_session = cash_register&.current_session
    operator = business.users.find_by(id: current_user&.id) || cash_register_session&.opened_by || business.users.order(:created_at).first
    cash_register_session&.recalculate_expected_cash!

    render json: {
      business: {
        id: business.id,
        commercial_name: business.commercial_name,
        license_status: business.license_status
      },
      branch: branch && {
        id: branch.id,
        name: branch.name,
        code: branch.code,
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
end
