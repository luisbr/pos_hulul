class Branch < ApplicationRecord
  belongs_to :business

  has_many :cash_registers, dependent: :restrict_with_exception
  has_many :inventory_balances, dependent: :restrict_with_exception
  has_many :inventory_movements, dependent: :restrict_with_exception
  has_many :cash_register_sessions, dependent: :restrict_with_exception
  has_many :cash_movements, dependent: :restrict_with_exception
  has_many :sales, dependent: :restrict_with_exception
  has_many :branch_assignments, dependent: :destroy

  validates :name, :code, :timezone, :currency, presence: true
  validates :code, uniqueness: { scope: :business_id }
  validates :operational_day_start_minute,
    numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than: 24.hours / 60 }

  def operational_date_for(time)
    zone = ActiveSupport::TimeZone[timezone] || Time.zone
    (time.in_time_zone(zone) - operational_day_start_minute.minutes).to_date
  end
end
