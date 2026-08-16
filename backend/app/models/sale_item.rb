class SaleItem < ApplicationRecord
  belongs_to :business
  belongs_to :sale
  belongs_to :product
  belongs_to :unit

  validates :sku, :product_name, presence: true
  validates :quantity, numericality: { greater_than: 0 }
  validates :unit_price_cents, :discount_cents, :tax_cents, :total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
