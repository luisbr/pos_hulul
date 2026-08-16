class Purchase < ApplicationRecord
  STATUSES = %w[received].freeze

  belongs_to :business
  belongs_to :branch
  belongs_to :supplier
  belongs_to :created_by, class_name: "User"

  has_many :purchase_items, dependent: :restrict_with_exception

  validates :folio, presence: true, uniqueness: { scope: :business_id }
  validates :status, inclusion: { in: STATUSES }
  validates :purchased_at, presence: true
  validates :total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :recent, -> { order(purchased_at: :desc, created_at: :desc) }
end
