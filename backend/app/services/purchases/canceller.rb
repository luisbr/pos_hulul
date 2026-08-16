module Purchases
  class Canceller
    def self.call(...)
      new(...).call
    end

    def initialize(purchase:, cancelled_by:, reason:)
      @purchase = purchase
      @business = purchase.business
      @cancelled_by = cancelled_by
      @reason = reason.to_s.strip
    end

    def call
      raise ArgumentError, "La compra ya esta cancelada" if @purchase.status == "cancelled"
      raise ArgumentError, "Captura motivo de cancelacion" if @reason.blank?

      insufficiencies = insufficient_stock
      if insufficiencies.any?
        raise ArgumentError, insufficiencies.join(", ")
      end

      ActiveRecord::Base.transaction do
        @purchase.purchase_items.includes(:product, :unit).find_each do |item|
          Inventory::MovementRecorder.call(
            business: @business,
            branch: @purchase.branch,
            product: item.product,
            movement_type: "negative_adjustment",
            quantity: item.quantity,
            unit: item.unit,
            unit_cost_cents: item.unit_cost_cents,
            reference_type: "purchase_cancellation",
            reference_id: @purchase.id,
            reason: "Cancelacion compra #{@purchase.folio}: #{@reason}",
            created_by: @cancelled_by
          )
        end

        @purchase.update!(
          status: "cancelled",
          cancelled_at: Time.current,
          cancelled_by: @cancelled_by,
          cancellation_reason: @reason
        )

        @purchase
      end
    end

    private

    def insufficient_stock
      @purchase.purchase_items.includes(:product).filter_map do |item|
        balance = InventoryBalance.lock.find_by(
          business: @business,
          branch: @purchase.branch,
          product: item.product
        )
        available = balance&.quantity || 0
        next if available >= item.quantity

        "#{item.product.name} requiere #{item.quantity.to_s('F')} y solo hay #{available.to_s('F')}"
      end
    end
  end
end
