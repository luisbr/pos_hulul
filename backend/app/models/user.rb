class User < ApplicationRecord
  has_secure_password

  has_many :memberships, dependent: :destroy
  has_many :businesses, through: :memberships
  has_many :inventory_movements, foreign_key: :created_by_id, dependent: :nullify, inverse_of: :created_by
  has_many :opened_cash_register_sessions, class_name: "CashRegisterSession", foreign_key: :opened_by_id, dependent: :restrict_with_exception, inverse_of: :opened_by
  has_many :closed_cash_register_sessions, class_name: "CashRegisterSession", foreign_key: :closed_by_id, dependent: :nullify, inverse_of: :closed_by
  has_many :sales, foreign_key: :cashier_id, dependent: :restrict_with_exception, inverse_of: :cashier
  has_many :cancelled_purchases, class_name: "Purchase", foreign_key: :cancelled_by_id, dependent: :nullify, inverse_of: :cancelled_by
  has_many :payments, foreign_key: :created_by_id, dependent: :restrict_with_exception, inverse_of: :created_by
  has_many :cash_movements, foreign_key: :created_by_id, dependent: :nullify, inverse_of: :created_by
  has_many :audit_events, foreign_key: :actor_id, dependent: :nullify, inverse_of: :actor

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
end
