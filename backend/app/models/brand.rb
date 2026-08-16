class Brand < ApplicationRecord
  belongs_to :business

  has_many :products, dependent: :restrict_with_exception

  validates :name, presence: true, uniqueness: { scope: :business_id }
end
