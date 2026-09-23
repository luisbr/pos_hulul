module Cash
  class SessionCloser
    def self.call(...)
      new(...).call
    end

    def initialize(cash_register_session:, counted_cash_cents:, closed_by:, closing_notes: nil, forced: false, force_close_reason: nil)
      @session = cash_register_session
      @counted_cash_cents = counted_cash_cents.to_i
      @closed_by = closed_by
      @closing_notes = closing_notes
      @forced = forced
      @force_close_reason = force_close_reason
    end

    def call
      ActiveRecord::Base.transaction do
        raise ActiveRecord::RecordInvalid, @session unless @session.active?
        raise ArgumentError, "Captura un motivo para el cierre forzado" if @forced && @force_close_reason.blank?

        @session.recalculate_expected_cash!
        record_forced_closure! if @forced

        @session.update!(
          counted_cash_cents: @counted_cash_cents,
          difference_cents: @counted_cash_cents - @session.expected_cash_cents,
          closed_by: @closed_by,
          closed_at: Time.current,
          closing_notes: @closing_notes,
          forced_closed: @forced,
          force_close_reason: @force_close_reason,
          status: "closed"
        )
        @session
      end
    end

    private

    def record_forced_closure!
      CashMovement.create!(
        business: @session.business,
        branch: @session.branch,
        cash_register_session: @session,
        movement_type: "forced_closure",
        amount_cents: 0,
        reason: @force_close_reason,
        created_by: @closed_by
      )
    end
  end
end
