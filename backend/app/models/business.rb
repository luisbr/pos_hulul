class Business < ApplicationRecord
  STATUSES = %w[active suspended cancelled].freeze
  LICENSE_STATUSES = %w[trial active suspended cancelled].freeze

  has_many :branches, dependent: :restrict_with_exception
  has_many :cash_registers, dependent: :restrict_with_exception
  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :product_categories, dependent: :restrict_with_exception
  has_many :brands, dependent: :restrict_with_exception
  has_many :units, dependent: :restrict_with_exception
  has_many :unit_conversions, dependent: :restrict_with_exception
  has_many :customers, dependent: :restrict_with_exception
  has_many :suppliers, dependent: :restrict_with_exception
  has_many :products, dependent: :restrict_with_exception
  has_many :inventory_balances, dependent: :restrict_with_exception
  has_many :inventory_movements, dependent: :restrict_with_exception
  has_many :cash_register_sessions, dependent: :restrict_with_exception
  has_many :cash_movements, dependent: :restrict_with_exception
  has_many :purchases, dependent: :restrict_with_exception
  has_many :purchase_items, dependent: :restrict_with_exception
  has_many :sales, dependent: :restrict_with_exception
  has_many :sale_items, dependent: :restrict_with_exception
  has_many :payments, dependent: :restrict_with_exception

  validates :commercial_name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :license_status, inclusion: { in: LICENSE_STATUSES }
end
