class Purchase < ApplicationRecord
  STATUSES = %w[received cancelled].freeze

  belongs_to :business
  belongs_to :branch
  belongs_to :supplier
  belongs_to :created_by, class_name: "User"
  belongs_to :cancelled_by, class_name: "User", optional: true

  has_many :purchase_items, dependent: :restrict_with_exception

  validates :folio, presence: true, uniqueness: { scope: :business_id }
  validates :status, inclusion: { in: STATUSES }
  validates :purchased_at, presence: true
  validates :total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :cancellation_reason, presence: true, if: -> { status == "cancelled" }

  scope :recent, -> { order(purchased_at: :desc, created_at: :desc) }
end
