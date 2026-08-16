class CashRegisterSession < ApplicationRecord
  STATUSES = %w[open closed].freeze

  belongs_to :business
  belongs_to :branch
  belongs_to :cash_register
  belongs_to :opened_by, class_name: "User"
  belongs_to :closed_by, class_name: "User", optional: true

  has_many :cash_movements, dependent: :restrict_with_exception
  has_many :sales, dependent: :restrict_with_exception
  has_many :payments, dependent: :restrict_with_exception

  validates :opened_at, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :opening_amount_cents, :expected_cash_cents, numericality: { only_integer: true }
  validates :counted_cash_cents, :difference_cents, numericality: { only_integer: true }, allow_nil: true
  validates :cash_register_id, uniqueness: { conditions: -> { where(status: "open") }, if: :open? }

  scope :open, -> { where(status: "open") }
  scope :recent, -> { order(opened_at: :desc) }

  def open?
    status == "open"
  end

  def closed?
    status == "closed"
  end

  def recalculate_expected_cash!
    update!(expected_cash_cents: cash_movements.sum(:amount_cents))
  end
end
