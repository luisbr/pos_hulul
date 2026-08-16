class Product < ApplicationRecord
  TAX_MODES = %w[included zero exempt].freeze

  belongs_to :business
  belongs_to :category, class_name: "ProductCategory"
  belongs_to :brand, optional: true
  belongs_to :base_unit, class_name: "Unit"

  has_many :inventory_balances, dependent: :restrict_with_exception
  has_many :inventory_movements, dependent: :restrict_with_exception
  has_many :sale_items, dependent: :restrict_with_exception

  validates :name, :sku, :sale_price_cents, :tax_mode, presence: true
  validates :sku, uniqueness: { scope: :business_id }
  validates :barcode, uniqueness: { scope: :business_id }, allow_blank: true
  validates :sale_price_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :current_cost_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :minimum_stock, numericality: { greater_than_or_equal_to: 0 }
  validates :tax_mode, inclusion: { in: TAX_MODES }
  validates :tax_rate, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true) }
  scope :search, lambda { |query|
    next all if query.blank?

    term = "%#{sanitize_sql_like(query)}%"
    where("products.name ILIKE :term OR products.sku ILIKE :term OR products.barcode ILIKE :term OR products.search_aliases ILIKE :term", term:)
  }
end
