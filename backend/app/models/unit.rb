class Unit < ApplicationRecord
  belongs_to :business

  has_many :products, foreign_key: :base_unit_id, dependent: :restrict_with_exception, inverse_of: :base_unit

  validates :name, :abbreviation, presence: true
  validates :name, uniqueness: { scope: :business_id }
  validates :abbreviation, uniqueness: { scope: :business_id }
end
