class InventoryBalance < ApplicationRecord
  belongs_to :business
  belongs_to :branch
  belongs_to :product

  validates :quantity, numericality: true
  validates :product_id, uniqueness: { scope: [ :business_id, :branch_id ] }
end
