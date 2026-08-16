class UnitConversion < ApplicationRecord
  belongs_to :business
  belongs_to :from_unit, class_name: "Unit"
  belongs_to :to_unit, class_name: "Unit"

  validates :factor, numericality: { greater_than: 0 }
  validates :from_unit_id, uniqueness: { scope: [ :business_id, :to_unit_id ] }
end
