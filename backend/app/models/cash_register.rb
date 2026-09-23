class CashRegister < ApplicationRecord
  belongs_to :business
  belongs_to :branch

  has_many :cash_register_sessions, dependent: :restrict_with_exception
  has_many :sales, dependent: :restrict_with_exception

  validates :name, :code, :ticket_size, presence: true
  validates :code, uniqueness: { scope: [ :business_id, :branch_id ] }
  validates :current_folio_number, numericality: { only_integer: true, greater_than: 0 }

  def current_session
    cash_register_sessions.active.order(opened_at: :desc).first
  end
end
