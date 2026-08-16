class PurchaseItem < ApplicationRecord
  belongs_to :business
  belongs_to :purchase
  belongs_to :product
  belongs_to :unit

  validates :quantity, numericality: { greater_than: 0 }
  validates :unit_cost_cents, :total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
