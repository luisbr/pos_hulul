class Api::Admin::UsersController < ApplicationController
  before_action :require_admin_access!
  before_action :require_hulul_admin!

  def create
    business = Business.find(params[:business_id])
    attrs = user_params
    user = User.find_or_initialize_by(email: attrs[:email].to_s.strip.downcase)
    user.assign_attributes(attrs.except(:password))
    user.password = attrs[:password] if attrs[:password].present?
    user.active = true if user.new_record?
    membership = business.memberships.find_or_initialize_by(user: user)
    membership.assign_attributes(membership_params)
    validate_access_scope!(membership)

    ActiveRecord::Base.transaction do
      user.save!
      membership.save!
      sync_branch_assignments!(business, membership)
    end

    record_audit_event!(
      business: business,
      event_type: "membership.created",
      auditable: membership,
      metadata: { user_id: user.id, role: membership.role }
    )
    render json: membership_json(membership.reload), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    business = Business.find(params[:business_id])
    membership = business.memberships.includes(:user).find(params[:id])
    user = membership.user
    user.assign_attributes(user_params.except(:password).compact_blank)
    user.password = user_params[:password] if user_params[:password].present?
    membership.assign_attributes(membership_params)
    validate_access_scope!(membership)

    ActiveRecord::Base.transaction do
      user.save!
      membership.save!
      sync_branch_assignments!(business, membership)
    end

    record_audit_event!(
      business: business,
      event_type: "membership.updated",
      auditable: membership,
      metadata: { user_id: user.id, role: membership.role }
    )
    render json: membership_json(membership.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password)
  end

  def membership_params
    params.require(:membership).permit(:role, :active)
  end

  def assignment_params
    params.fetch(:membership, {}).permit(branch_assignments: %i[branch_id role active]).fetch(:branch_assignments, [])
  end

  def sync_branch_assignments!(business, membership)
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

  def validate_access_scope!(membership)
    unless %w[owner member].include?(membership.role)
      membership.errors.add(:role, "debe ser propietario o usuario de sucursal")
    end
    if membership.role == "member" && assignment_params.empty?
      membership.errors.add(:branch_assignments, "debe incluir al menos una sucursal")
    end
    raise ActiveRecord::RecordInvalid.new(membership) if membership.errors.any?
  end

  def membership_json(membership)
    {
      membership_id: membership.id,
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      active: membership.active && membership.user.active,
      membership_active: membership.active,
      branch_assignments: membership.branch_assignments.includes(:branch).map do |assignment|
        {
          id: assignment.id,
          branch_id: assignment.branch_id,
          branch_name: assignment.branch.name,
          role: assignment.role,
          active: assignment.active
        }
      end
    }
  end
end
