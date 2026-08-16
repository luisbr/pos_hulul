class Membership < ApplicationRecord
  ROLES = %w[owner manager cashier warehouse hulul_admin hulul_support].freeze

  belongs_to :business
  belongs_to :user

  validates :role, inclusion: { in: ROLES }
  validates :role, uniqueness: { scope: [ :business_id, :user_id ] }
end
