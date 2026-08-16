class CashMovement < ApplicationRecord
  MOVEMENT_TYPES = %w[
    opening
    sale_cash_payment
    credit_payment
    cash_out
    refund
    closing_adjustment
  ].freeze

  belongs_to :business
  belongs_to :branch
  belongs_to :cash_register_session
  belongs_to :created_by, class_name: "User", optional: true

  validates :movement_type, inclusion: { in: MOVEMENT_TYPES }
  validates :amount_cents, numericality: { only_integer: true }
  validates :reason, presence: true, if: :requires_reason?

  scope :recent, -> { order(created_at: :desc) }

  private

  def requires_reason?
    %w[cash_out refund closing_adjustment].include?(movement_type)
  end
end
