class Business < ApplicationRecord
  STATUSES = %w[active suspended cancelled].freeze
  LICENSE_STATUSES = %w[trial active suspended cancelled].freeze
  COMMERCIAL_NAME_PLACEHOLDER = "Nombre de empresa".freeze
  LEGAL_NAME_PLACEHOLDER = "Razon social sin configurar".freeze
  RFC_PLACEHOLDER = "RFC sin configurar".freeze
  BRANCH_NAME_PLACEHOLDER = "Nombre de sucursal".freeze

  has_many :branches, dependent: :restrict_with_exception
  has_many :cash_registers, dependent: :restrict_with_exception
  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :product_categories, dependent: :restrict_with_exception
  has_many :brands, dependent: :restrict_with_exception
  has_many :units, dependent: :restrict_with_exception
  has_many :unit_conversions, dependent: :restrict_with_exception
  has_many :customers, dependent: :restrict_with_exception
  has_many :suppliers, dependent: :restrict_with_exception
  has_many :products, dependent: :restrict_with_exception
  has_many :inventory_balances, dependent: :restrict_with_exception
  has_many :inventory_movements, dependent: :restrict_with_exception
  has_many :cash_register_sessions, dependent: :restrict_with_exception
  has_many :cash_movements, dependent: :restrict_with_exception
  has_many :purchases, dependent: :restrict_with_exception
  has_many :purchase_items, dependent: :restrict_with_exception
  has_many :sales, dependent: :restrict_with_exception
  has_many :sale_items, dependent: :restrict_with_exception
  has_many :payments, dependent: :restrict_with_exception
  has_many :audit_events, dependent: :restrict_with_exception

  validates :commercial_name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :license_status, inclusion: { in: LICENSE_STATUSES }

  def company_setup_missing_fields
    [
      ("commercial_name" if placeholder_or_blank?(commercial_name, COMMERCIAL_NAME_PLACEHOLDER)),
      ("legal_name" if placeholder_or_blank?(legal_name, LEGAL_NAME_PLACEHOLDER)),
      ("rfc" if placeholder_or_blank?(rfc, RFC_PLACEHOLDER)),
      ("primary_contact_name" if primary_contact_name.blank?),
      ("phone" if phone.blank?),
      ("email" if email.blank?)
    ].compact
  end

  def branch_setup_missing_fields(branch)
    return [ "branch" ] unless branch

    [
      ("branch_name" if placeholder_or_blank?(branch.name, BRANCH_NAME_PLACEHOLDER)),
      ("branch_address" if branch.address.blank?),
      ("cash_register" unless branch.cash_registers.where(active: true).exists?)
    ].compact
  end

  def setup_missing_fields(branch = nil)
    company_setup_missing_fields + branch_setup_missing_fields(branch)
  end

  def setup_complete?(branch = nil)
    setup_missing_fields(branch).empty?
  end

  def cash_setup_missing_fields(branch)
    branch_setup_missing_fields(branch) + [
      ("unit" unless units.exists?),
      ("category" unless product_categories.exists?),
      ("supplier" unless suppliers.where(active: true).exists?),
      ("product" unless products.where(active: true).exists?),
      ("stock" unless inventory_balances.where(branch: branch).where("quantity > 0").exists?)
    ].compact
  end

  def cash_setup_ready?(branch)
    cash_setup_missing_fields(branch).empty?
  end

  private

  def placeholder_or_blank?(value, placeholder)
    value.to_s.strip.blank? || value.to_s.strip == placeholder
  end
end
