class Api::Portal::CashMovementsController < ApplicationController
  def index
    business = Business.find(params[:business_id])
    movements = business.cash_movements.includes(:branch, :cash_register_session, :created_by).recent.limit(100)
    movements = movements.where(cash_register_session_id: params[:cash_register_session_id]) if params[:cash_register_session_id].present?

    render json: movements.map { |movement| movement_json(movement) }
  end

  def create
    business = Business.find(params[:business_id])
    session = business.cash_register_sessions.open.find(cash_movement_params[:cash_register_session_id])
    created_by = cash_movement_params[:created_by_id].present? ? business.users.find(cash_movement_params[:created_by_id]) : nil

    movement = ::Cash::MovementRecorder.call(
      cash_register_session: session,
      movement_type: cash_movement_params[:movement_type],
      amount_cents: cash_movement_params[:amount_cents],
      reference_type: cash_movement_params[:reference_type],
      reference_id: cash_movement_params[:reference_id],
      reason: cash_movement_params[:reason],
      created_by:
    )

    render json: movement_json(movement), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages.presence || [ "No se pudo registrar movimiento de caja" ] }, status: :unprocessable_entity
  end

  private

  def cash_movement_params
    params.require(:cash_movement).permit(
      :cash_register_session_id,
      :movement_type,
      :amount_cents,
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
      amount_cents: movement.amount_cents,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      reason: movement.reason,
      created_at: movement.created_at.iso8601,
      cash_register_session_id: movement.cash_register_session_id,
      branch: {
        id: movement.branch.id,
        name: movement.branch.name,
        code: movement.branch.code
      },
      created_by: movement.created_by && {
        id: movement.created_by.id,
        name: movement.created_by.name
      }
    }
  end
end
