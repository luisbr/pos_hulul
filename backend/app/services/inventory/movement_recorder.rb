module Inventory
  class MovementRecorder
    def self.call(...)
      new(...).call
    end

    def initialize(business:, branch:, product:, movement_type:, quantity:, unit: nil, unit_cost_cents: nil, reference_type: nil, reference_id: nil, reason: nil, created_by: nil)
      @business = business
      @branch = branch
      @product = product
      @movement_type = movement_type
      @quantity = BigDecimal(quantity.to_s)
      @unit = unit || product.base_unit
      @unit_cost_cents = unit_cost_cents
      @reference_type = reference_type
      @reference_id = reference_id
      @reason = reason
      @created_by = created_by
    end

    def call
      ActiveRecord::Base.transaction do
        movement = InventoryMovement.create!(
          business: @business,
          branch: @branch,
          product: @product,
          movement_type: @movement_type,
          quantity: @quantity,
          unit: @unit,
          base_quantity: base_quantity,
          unit_cost_cents: @unit_cost_cents,
          reference_type: @reference_type,
          reference_id: @reference_id,
          reason: @reason,
          created_by: @created_by
        )

        balance = InventoryBalance.lock.find_or_initialize_by(
          business: @business,
          branch: @branch,
          product: @product
        )
        balance.quantity ||= 0
        balance.quantity += movement.signed_base_quantity
        balance.save!

        movement
      end
    end

    private

    def base_quantity
      return @quantity if @unit == @product.base_unit

      conversion = UnitConversion.find_by!(
        business: @business,
        from_unit: @unit,
        to_unit: @product.base_unit
      )
      @quantity * conversion.factor
    end
  end
end
