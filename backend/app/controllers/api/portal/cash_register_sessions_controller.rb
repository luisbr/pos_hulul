class Api::Portal::CashRegisterSessionsController < ApplicationController
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: :create
  before_action -> { require_permission!("open_cash_register") }, only: :create
  before_action -> { require_permission!("close_cash_register") }, only: %i[close force_close]

  def current
    cash_register = business.cash_registers.find(current_params[:cash_register_id])
    ensure_portal_branch_access!(cash_register.branch)
    session = cash_register.current_session
    session&.mark_pending_close_if_expired!

    render json: session ? session_json(session) : { status: "closed", cash_register_id: cash_register.id }
  end

  def create
    cash_register = business.cash_registers.find(session_params[:cash_register_id])
    branch = portal_branch(session_params[:branch_id])
    raise ActiveRecord::RecordNotFound unless cash_register.branch_id == branch.id
    unless business.cash_setup_ready?(branch)
      return render json: {
        errors: [ "Completa la configuracion operativa de la sucursal antes de abrir caja" ],
        missing: business.cash_setup_missing_fields(branch)
      }, status: :unprocessable_entity
    end
    opened_by = portal_actor

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
    cash_register = business.cash_registers.find(close_params[:cash_register_id])
    ensure_portal_branch_access!(cash_register.branch)
    session = cash_register.current_session
    return render json: { errors: [ "No hay caja abierta" ] }, status: :unprocessable_entity unless session

    closed_by = portal_actor
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

  def force_close
    cash_register = business.cash_registers.find(force_close_params[:cash_register_id])
    ensure_portal_branch_access!(cash_register.branch)
    session = cash_register.current_session
    return render json: { errors: [ "No hay caja abierta o pendiente de cierre" ] }, status: :unprocessable_entity unless session

    closed_by = portal_actor
    closed_session = ::Cash::SessionCloser.call(
      cash_register_session: session,
      counted_cash_cents: force_close_params[:counted_cash_cents],
      closed_by:,
      closing_notes: force_close_params[:closing_notes],
      forced: true,
      force_close_reason: force_close_params[:force_close_reason]
    )
    record_audit_event!(
      business: business,
      event_type: "cash_register_session.force_closed",
      auditable: closed_session,
      metadata: {
        cash_register_id: cash_register.id,
        reason: force_close_params[:force_close_reason]
      }
    )

    render json: session_json(closed_session)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages.presence || [ "No se pudo forzar cierre de caja" ] }, status: :unprocessable_entity
  rescue ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  private

  def business
    portal_business
  end

  def current_params
    params.permit(:cash_register_id)
  end

  def session_params
    params.require(:cash_register_session).permit(:branch_id, :cash_register_id, :opened_by_id, :opening_amount_cents)
  end

  def close_params
    params.require(:cash_register_session).permit(:cash_register_id, :closed_by_id, :counted_cash_cents, :closing_notes)
  end

  def force_close_params
    params.require(:cash_register_session).permit(:cash_register_id, :closed_by_id, :counted_cash_cents, :closing_notes, :force_close_reason)
  end

  def session_json(session)
    session.mark_pending_close_if_expired!
    session.recalculate_expected_cash! if session.active?

    {
      id: session.id,
      status: session.status,
      opened_at: session.opened_at.iso8601,
      closed_at: session.closed_at&.iso8601,
      pending_close_at: session.pending_close_at&.iso8601,
      opening_amount_cents: session.opening_amount_cents,
      expected_cash_cents: session.expected_cash_cents,
      counted_cash_cents: session.counted_cash_cents,
      difference_cents: session.difference_cents,
      closing_notes: session.closing_notes,
      forced_closed: session.forced_closed,
      force_close_reason: session.force_close_reason,
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
