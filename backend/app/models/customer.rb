class Customer < ApplicationRecord
  CUSTOMER_TYPES = %w[person company].freeze
  CREDIT_STATUSES = %w[clear blocked].freeze

  belongs_to :business

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :rfc, with: ->(rfc) { rfc.strip.upcase }

  validates :commercial_name, presence: true
  validates :customer_type, inclusion: { in: CUSTOMER_TYPES }
  validates :credit_status, inclusion: { in: CREDIT_STATUSES }
  validates :credit_limit_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :credit_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :rfc, uniqueness: { scope: :business_id }, allow_blank: true
  validates :email, uniqueness: { scope: :business_id }, allow_blank: true
  validate :public_customer_must_remain_active
  validate :public_customer_must_keep_name

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(public_customer: :desc, commercial_name: :asc) }
  scope :search, lambda { |query|
    next all if query.blank?

    term = "%#{sanitize_sql_like(query)}%"
    where(
      "customers.commercial_name ILIKE :term OR customers.legal_name ILIKE :term OR customers.contact_name ILIKE :term OR customers.phone ILIKE :term OR customers.email ILIKE :term OR customers.rfc ILIKE :term",
      term:
    )
  }

  private

  def public_customer_must_remain_active
    return unless public_customer? && active == false

    errors.add(:active, "no puede desactivarse para Publico en general")
  end

  def public_customer_must_keep_name
    return unless public_customer? && commercial_name != "Publico en general"

    errors.add(:commercial_name, "debe mantenerse como Publico en general")
  end
end
