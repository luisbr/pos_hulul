module Sales
  class Canceller
    def self.call(...)
      new(...).call
    end

    def initialize(sale:, cancelled_by:, reason:, refund_session: nil)
      @sale = sale
      @business = sale.business
      @cancelled_by = cancelled_by
      @reason = reason.to_s.strip
      @refund_session = refund_session
    end

    def call
      raise ArgumentError, "La venta ya esta cancelada" if @sale.status == "cancelled"
      raise ArgumentError, "Captura motivo de cancelacion" if @reason.blank?

      cash_refund_cents = @sale.payments.where(payment_method: "cash").sum(:amount_cents)
      if cash_refund_cents.positive?
        raise ArgumentError, "Abre una caja para devolver efectivo" unless @refund_session&.open?
      end

      ActiveRecord::Base.transaction do
        @sale.sale_items.includes(:product, :unit).find_each do |item|
          Inventory::MovementRecorder.call(
            business: @business,
            branch: @sale.branch,
            product: item.product,
            movement_type: "sale_cancellation",
            quantity: item.quantity,
            unit: item.unit,
            reference_type: "Sale",
            reference_id: @sale.id,
            reason: "Cancelacion venta #{@sale.folio}",
            created_by: @cancelled_by
          )
        end

        if cash_refund_cents.positive?
          Cash::MovementRecorder.call(
            cash_register_session: @refund_session,
            movement_type: "refund",
            amount_cents: -cash_refund_cents,
            reference_type: "Sale",
            reference_id: @sale.id,
            reason: "Cancelacion venta #{@sale.folio}: #{@reason}",
            created_by: @cancelled_by
          )
        end

        @sale.update!(
          status: "cancelled",
          cancelled_at: Time.current,
          cancelled_by: @cancelled_by,
          cancellation_reason: @reason
        )

        @sale
      end
    end
  end
end
