class Payment < ApplicationRecord
  PAYMENT_METHODS = %w[cash card transfer].freeze

  belongs_to :business
  belongs_to :sale
  belongs_to :cash_register_session
  belongs_to :created_by, class_name: "User"

  validates :payment_method, inclusion: { in: PAYMENT_METHODS }
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :received_amount_cents, :change_amount_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
