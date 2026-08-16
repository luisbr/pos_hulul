module Cash
  class SessionCloser
    def self.call(...)
      new(...).call
    end

    def initialize(cash_register_session:, counted_cash_cents:, closed_by:, closing_notes: nil)
      @session = cash_register_session
      @counted_cash_cents = counted_cash_cents.to_i
      @closed_by = closed_by
      @closing_notes = closing_notes
    end

    def call
      ActiveRecord::Base.transaction do
        raise ActiveRecord::RecordInvalid, @session unless @session.open?

        @session.recalculate_expected_cash!
        @session.update!(
          counted_cash_cents: @counted_cash_cents,
          difference_cents: @counted_cash_cents - @session.expected_cash_cents,
          closed_by: @closed_by,
          closed_at: Time.current,
          closing_notes: @closing_notes,
          status: "closed"
        )
        @session
      end
    end
  end
end
