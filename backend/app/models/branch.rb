class Branch < ApplicationRecord
  belongs_to :business

  has_many :cash_registers, dependent: :restrict_with_exception
  has_many :inventory_balances, dependent: :restrict_with_exception
  has_many :inventory_movements, dependent: :restrict_with_exception
  has_many :cash_register_sessions, dependent: :restrict_with_exception
  has_many :cash_movements, dependent: :restrict_with_exception
  has_many :sales, dependent: :restrict_with_exception

  validates :name, :code, :timezone, :currency, presence: true
  validates :code, uniqueness: { scope: :business_id }
end
