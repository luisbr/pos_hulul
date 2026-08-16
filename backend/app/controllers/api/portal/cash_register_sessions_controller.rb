class Api::Portal::CashRegisterSessionsController < ApplicationController
  def current
    business = Business.find(params[:business_id])
    cash_register = business.cash_registers.find(current_params[:cash_register_id])
    session = cash_register.current_session

    render json: session ? session_json(session) : { status: "closed", cash_register_id: cash_register.id }
  end

  def create
    business = Business.find(params[:business_id])
    cash_register = business.cash_registers.find(session_params[:cash_register_id])
    branch = business.branches.find(session_params[:branch_id])
    opened_by = business.users.find(session_params[:opened_by_id])

    session = ::Cash::SessionOpener.call(
      business:,
      branch:,
      cash_register:,
      opened_by:,
      opening_amount_cents: session_params[:opening_amount_cents]
    )

    render json: session_json(session), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages.presence || [ "La caja ya esta abierta" ] }, status: :unprocessable_entity
  end

  def close
    business = Business.find(params[:business_id])
    cash_register = business.cash_registers.find(close_params[:cash_register_id])
    session = cash_register.current_session
    return render json: { errors: [ "No hay caja abierta" ] }, status: :unprocessable_entity unless session

    closed_by = business.users.find(close_params[:closed_by_id])
    closed_session = ::Cash::SessionCloser.call(
      cash_register_session: session,
      counted_cash_cents: close_params[:counted_cash_cents],
      closed_by:,
      closing_notes: close_params[:closing_notes]
    )

    render json: session_json(closed_session)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages.presence || [ "No se pudo cerrar caja" ] }, status: :unprocessable_entity
  end

  private

  def current_params
    params.permit(:cash_register_id)
  end

  def session_params
    params.require(:cash_register_session).permit(:branch_id, :cash_register_id, :opened_by_id, :opening_amount_cents)
  end

  def close_params
    params.require(:cash_register_session).permit(:cash_register_id, :closed_by_id, :counted_cash_cents, :closing_notes)
  end

  def session_json(session)
    session.recalculate_expected_cash! if session.open?

    {
      id: session.id,
      status: session.status,
      opened_at: session.opened_at.iso8601,
      closed_at: session.closed_at&.iso8601,
      opening_amount_cents: session.opening_amount_cents,
      expected_cash_cents: session.expected_cash_cents,
      counted_cash_cents: session.counted_cash_cents,
      difference_cents: session.difference_cents,
      closing_notes: session.closing_notes,
      business_id: session.business_id,
      branch: {
        id: session.branch.id,
        name: session.branch.name,
        code: session.branch.code
      },
      cash_register: {
        id: session.cash_register.id,
        name: session.cash_register.name,
        code: session.cash_register.code
      },
      opened_by: {
        id: session.opened_by.id,
        name: session.opened_by.name
      },
      closed_by: session.closed_by && {
        id: session.closed_by.id,
        name: session.closed_by.name
      }
    }
  end
end
