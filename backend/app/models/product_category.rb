class ProductCategory < ApplicationRecord
  belongs_to :business
  belongs_to :parent, class_name: "ProductCategory", optional: true

  has_many :children, class_name: "ProductCategory", foreign_key: :parent_id, dependent: :restrict_with_exception, inverse_of: :parent
  has_many :products, foreign_key: :category_id, dependent: :restrict_with_exception, inverse_of: :category

  validates :name, presence: true, uniqueness: { scope: [ :business_id, :parent_id ] }
end
