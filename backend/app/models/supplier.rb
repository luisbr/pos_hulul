class Supplier < ApplicationRecord
  belongs_to :business

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :rfc, with: ->(rfc) { rfc.strip.upcase }

  validates :commercial_name, presence: true
  validates :rfc, uniqueness: { scope: :business_id }, allow_blank: true
  validates :email, uniqueness: { scope: :business_id }, allow_blank: true

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:commercial_name) }
  scope :search, lambda { |query|
    next all if query.blank?

    term = "%#{sanitize_sql_like(query)}%"
    where(
      "suppliers.commercial_name ILIKE :term OR suppliers.legal_name ILIKE :term OR suppliers.contact_name ILIKE :term OR suppliers.phone ILIKE :term OR suppliers.email ILIKE :term OR suppliers.rfc ILIKE :term",
      term:
    )
  }
end
