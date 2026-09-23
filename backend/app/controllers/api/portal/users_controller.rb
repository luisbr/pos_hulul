class Api::Portal::UsersController < ApplicationController
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: %i[create update]
  before_action -> { require_permission!("manage_users") }, only: %i[create update]

  def index
    render json: memberships.map { |membership| user_json(membership) }
  end

  def create
    attrs = user_params
    user = User.find_or_initialize_by(email: attrs[:email].to_s.strip.downcase)
    user.assign_attributes(user_params.except(:password)) if user.new_record?
    user.password = user_params[:password] if user_params[:password].present?
    user.active = true if user.new_record?

    membership = business.memberships.find_or_initialize_by(user:)
    membership.assign_attributes(membership_params)
    validate_access_scope!(membership)

    ActiveRecord::Base.transaction do
      user.save!
      membership.save!
      sync_branch_assignments!(membership)
    end
    record_audit_event!(
      business: business,
      event_type: membership.previously_new_record? ? "membership.created" : "membership.updated",
      auditable: membership,
      metadata: {
        user_id: user.id,
        email: user.email,
        role: membership.role,
        active: membership.active
      }
    )

    render json: user_json(membership.reload), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    membership = business.memberships.includes(:user).find_by!(user_id: params[:id])
    user = membership.user

    user.assign_attributes(user_params.except(:password).compact_blank)
    user.password = user_params[:password] if user_params[:password].present?
    membership.assign_attributes(membership_params)
    validate_access_scope!(membership)

    ActiveRecord::Base.transaction do
      user.save!
      membership.save!
      sync_branch_assignments!(membership)
    end
    record_audit_event!(
      business: business,
      event_type: "membership.updated",
      auditable: membership,
      metadata: {
        user_id: user.id,
        email: user.email,
        role: membership.role,
        active: membership.active,
        changed_user_fields: user.previous_changes.keys - %w[updated_at password_digest],
        changed_membership_fields: membership.previous_changes.keys - %w[updated_at]
      }
    )

    render json: user_json(membership.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def business
    portal_business
  end

  def memberships
    business.memberships.where.not(role: %w[hulul_admin hulul_support]).joins(:user).includes(:user).order("users.name")
  end

  def user_params
    params.require(:user).permit(:name, :email, :password)
  end

  def membership_params
    params.require(:membership).permit(:role, :active)
  end

  def assignment_params
    params.fetch(:membership, {}).permit(branch_assignments: %i[branch_id role active]).fetch(:branch_assignments, [])
  end

  def validate_access_scope!(membership)
    unless %w[owner member].include?(membership.role)
      membership.errors.add(:role, "debe ser propietario o usuario de sucursal")
    end
    if membership.role == "member" && assignment_params.empty?
      membership.errors.add(:branch_assignments, "debe incluir al menos una sucursal")
    end
    raise ActiveRecord::RecordInvalid.new(membership) if membership.errors.any?
  end

  def sync_branch_assignments!(membership)
    membership.branch_assignments.destroy_all
    return if membership.role == "owner"

    assignment_params.each do |attrs|
      branch = business.branches.find(attrs[:branch_id])
      membership.branch_assignments.create!(
        branch: branch,
        role: attrs[:role],
        active: attrs.key?(:active) ? attrs[:active] : true
      )
    end
  end

  def user_json(membership)
    user = membership.user

    {
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active && membership.active,
      user_active: user.active,
      membership_active: membership.active,
      role: membership.role,
      branch_assignments: membership.branch_assignments.includes(:branch).map do |assignment|
        {
          id: assignment.id,
          branch_id: assignment.branch_id,
          branch_name: assignment.branch.name,
          role: assignment.role,
          active: assignment.active
        }
      end,
      created_at: user.created_at.iso8601
    }
  end
end
