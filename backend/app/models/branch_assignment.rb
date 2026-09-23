class BranchAssignment < ApplicationRecord
  ROLES = %w[manager cashier warehouse].freeze

  belongs_to :membership
  belongs_to :branch

  validates :role, inclusion: { in: ROLES }
  validates :branch_id, uniqueness: { scope: :membership_id }
  validate :branch_belongs_to_membership_business

  private

  def branch_belongs_to_membership_business
    return if branch.nil? || membership.nil? || branch.business_id == membership.business_id

    errors.add(:branch, "debe pertenecer a la misma empresa")
  end
end
