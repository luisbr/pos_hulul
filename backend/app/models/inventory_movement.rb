class InventoryMovement < ApplicationRecord
  MOVEMENT_TYPES = %w[
    initial_stock
    purchase_receipt
    positive_adjustment
    negative_adjustment
    waste
    sale
    sale_cancellation
  ].freeze

  INCREASE_TYPES = %w[initial_stock purchase_receipt positive_adjustment sale_cancellation].freeze
  DECREASE_TYPES = %w[negative_adjustment waste sale].freeze

  belongs_to :business
  belongs_to :branch
  belongs_to :product
  belongs_to :unit
  belongs_to :created_by, class_name: "User", optional: true

  validates :movement_type, inclusion: { in: MOVEMENT_TYPES }
  validates :quantity, :base_quantity, numericality: { greater_than: 0 }
  validates :unit_cost_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :reason, presence: true, if: :requires_reason?

  scope :recent, -> { order(created_at: :desc) }

  def signed_base_quantity
    if INCREASE_TYPES.include?(movement_type)
      base_quantity
    else
      -base_quantity
    end
  end

  private

  def requires_reason?
    %w[positive_adjustment negative_adjustment waste].include?(movement_type)
  end
end
