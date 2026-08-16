module Purchases
  class Recorder
    def self.call(...)
      new(...).call
    end

    def initialize(business:, branch:, supplier:, created_by:, purchased_at:, invoice_reference: nil, notes: nil, items:)
      @business = business
      @branch = branch
      @supplier = supplier
      @created_by = created_by
      @purchased_at = purchased_at
      @invoice_reference = invoice_reference
      @notes = notes
      @items = items
    end

    def call
      ActiveRecord::Base.transaction do
        purchase = Purchase.create!(
          business: @business,
          branch: @branch,
          supplier: @supplier,
          created_by: @created_by,
          folio: next_folio,
          status: "received",
          purchased_at: @purchased_at,
          invoice_reference: @invoice_reference,
          notes: @notes,
          total_cents: 0
        )

        total_cents = @items.sum do |attrs|
          product = @business.products.find(attrs[:product_id])
          quantity = BigDecimal(attrs[:quantity].to_s)
          unit_cost_cents = attrs[:unit_cost_cents].to_i
          line_total_cents = (quantity * unit_cost_cents).to_i

          PurchaseItem.create!(
            business: @business,
            purchase: purchase,
            product: product,
            unit: product.base_unit,
            quantity: quantity,
            unit_cost_cents: unit_cost_cents,
            total_cents: line_total_cents
          )

          Inventory::MovementRecorder.call(
            business: @business,
            branch: @branch,
            product: product,
            movement_type: "purchase_receipt",
            quantity: quantity,
            unit: product.base_unit,
            unit_cost_cents: unit_cost_cents,
            reference_type: "purchase",
            reference_id: purchase.id,
            reason: @notes.presence || "Compra #{purchase.folio}",
            created_by: @created_by
          )

          product.update!(current_cost_cents: unit_cost_cents)
          line_total_cents
        end

        purchase.update!(total_cents: total_cents)
        purchase
      end
    end

    private

    def next_folio
      sequence = @business.purchases.count + 1
      "COM-#{@branch.code}-#{sequence.to_s.rjust(6, '0')}"
    end
  end
end
