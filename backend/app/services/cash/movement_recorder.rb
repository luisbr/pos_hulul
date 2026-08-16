module Cash
  class MovementRecorder
    def self.call(...)
      new(...).call
    end

    def initialize(cash_register_session:, movement_type:, amount_cents:, reference_type: nil, reference_id: nil, reason: nil, created_by: nil)
      @session = cash_register_session
      @movement_type = movement_type
      @amount_cents = amount_cents.to_i
      @reference_type = reference_type
      @reference_id = reference_id
      @reason = reason
      @created_by = created_by
    end

    def call
      ActiveRecord::Base.transaction do
        raise ActiveRecord::RecordInvalid, @session unless @session.open?

        movement = CashMovement.create!(
          business: @session.business,
          branch: @session.branch,
          cash_register_session: @session,
          movement_type: @movement_type,
          amount_cents: @amount_cents,
          reference_type: @reference_type,
          reference_id: @reference_id,
          reason: @reason,
          created_by: @created_by
        )

        @session.recalculate_expected_cash!
        movement
      end
    end
  end
end
