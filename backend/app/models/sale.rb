class Sale < ApplicationRecord
  STATUSES = %w[paid cancelled].freeze
  SALE_TYPES = %w[cash card transfer mixed].freeze

  belongs_to :business
  belongs_to :branch
  belongs_to :cash_register
  belongs_to :cash_register_session
  belongs_to :customer, optional: true
  belongs_to :cashier, class_name: "User"
  belongs_to :cancelled_by, class_name: "User", optional: true

  has_many :sale_items, dependent: :restrict_with_exception
  has_many :payments, dependent: :restrict_with_exception

  validates :folio, :idempotency_key, presence: true
  validates :folio, uniqueness: { scope: :business_id }
  validates :idempotency_key, uniqueness: { scope: :business_id }
  validates :status, inclusion: { in: STATUSES }
  validates :sale_type, inclusion: { in: SALE_TYPES }
  validates :subtotal_cents, :tax_cents, :discount_cents, :total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :cancellation_reason, presence: true, if: -> { status == "cancelled" }

  scope :recent, -> { order(created_at: :desc) }
end
