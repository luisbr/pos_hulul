class Membership < ApplicationRecord
  ROLES = %w[owner member manager cashier warehouse hulul_admin hulul_support].freeze
  PERMISSIONS = {
    "owner" => %w[
      manage_business_settings
      manage_branch_settings
      manage_users
      manage_catalogs
      manage_products
      manage_customers
      manage_suppliers
      create_sale
      cancel_sale
      open_cash_register
      close_cash_register
      create_cash_movement
      adjust_inventory
      manage_purchases
      cancel_purchase
      view_audit_events
    ],
    "member" => [],
    "manager" => %w[
      manage_branch_settings
      manage_catalogs
      manage_products
      manage_customers
      manage_suppliers
      create_sale
      cancel_sale
      open_cash_register
      close_cash_register
      create_cash_movement
      adjust_inventory
      manage_purchases
      cancel_purchase
      view_audit_events
    ],
    "cashier" => %w[
      create_sale
      open_cash_register
      manage_customers
    ],
    "warehouse" => %w[
      manage_catalogs
      manage_products
      adjust_inventory
      manage_suppliers
      manage_purchases
      view_audit_events
    ],
    "hulul_admin" => %w[
      manage_business_settings
      manage_branch_settings
      manage_users
      manage_catalogs
      manage_products
      manage_customers
      manage_suppliers
      create_sale
      cancel_sale
      open_cash_register
      close_cash_register
      create_cash_movement
      adjust_inventory
      manage_purchases
      cancel_purchase
      view_audit_events
    ],
    "hulul_support" => %w[
      manage_business_settings
      manage_branch_settings
      manage_catalogs
      manage_products
      manage_customers
      manage_suppliers
      create_sale
      cancel_sale
      open_cash_register
      close_cash_register
      create_cash_movement
      adjust_inventory
      manage_purchases
      cancel_purchase
      view_audit_events
    ]
  }.freeze

  belongs_to :business
  belongs_to :user
  has_many :branch_assignments, dependent: :destroy
  has_many :assigned_branches, through: :branch_assignments, source: :branch
  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception

  validates :role, inclusion: { in: ROLES }
  validates :role, uniqueness: { scope: [ :business_id, :user_id ] }

  def permissions_for(branch = nil)
    effective_role = branch ? role_for_branch(branch) : role
    PERMISSIONS.fetch(effective_role, [])
  end

  def can?(permission, branch: nil)
    permissions_for(branch).include?(permission.to_s)
  end

  def role_for_branch(branch)
    return role if %w[owner hulul_admin hulul_support].include?(role)
    return role if legacy_branch_role? && branch_assignments.empty?
    return nil unless branch

    branch_assignments.find { |assignment| assignment.branch_id == branch.id && assignment.active }&.role
  end

  def can_access_branch?(branch)
    role_for_branch(branch).present?
  end

  def legacy_branch_role?
    %w[manager cashier warehouse].include?(role)
  end
end
