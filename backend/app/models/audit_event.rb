class AuditEvent < ApplicationRecord
  belongs_to :business
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :auditable, polymorphic: true

  validates :event_type, presence: true
  validates :auditable_type, presence: true
  validates :auditable_id, presence: true

  scope :recent, -> { order(created_at: :desc) }
end
