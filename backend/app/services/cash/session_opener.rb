module Cash
  class SessionOpener
    def self.call(...)
      new(...).call
    end

    def initialize(business:, branch:, cash_register:, opened_by:, opening_amount_cents:)
      @business = business
      @branch = branch
      @cash_register = cash_register
      @opened_by = opened_by
      @opening_amount_cents = opening_amount_cents.to_i
    end

    def call
      ActiveRecord::Base.transaction do
        raise ActiveRecord::RecordInvalid, @cash_register.current_session if @cash_register.current_session

        session = CashRegisterSession.create!(
          business: @business,
          branch: @branch,
          cash_register: @cash_register,
          opened_by: @opened_by,
          opened_at: Time.current,
          opening_amount_cents: @opening_amount_cents,
          expected_cash_cents: @opening_amount_cents,
          status: "open"
        )

        CashMovement.create!(
          business: @business,
          branch: @branch,
          cash_register_session: session,
          movement_type: "opening",
          amount_cents: @opening_amount_cents,
          reason: "Apertura de caja",
          created_by: @opened_by
        )

        session
      end
    end
  end
end
