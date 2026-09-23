class ApplicationController < ActionController::API
  private

  def current_user
    return @current_user if defined?(@current_user)

    token = bearer_token
    @current_user = token.present? ? User.find_signed(token, purpose: "portal_session") : nil
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    @current_user = nil
  end

  def session_token_for(user)
    user.signed_id(purpose: "portal_session", expires_in: 30.days)
  end

  def bearer_token
    request.authorization.to_s.delete_prefix("Bearer ").presence
  end

  def require_portal_business!
    return render json: { errors: [ "Sesion requerida" ] }, status: :unauthorized unless current_user&.active?

    business_id = params[:business_id].presence || params[:id]
    @current_membership = current_user.memberships.includes(:business).find_by(business_id: business_id, active: true)
    return if @current_membership

    render json: { errors: [ "No tienes acceso a este negocio" ] }, status: :forbidden
  end

  def require_authenticated_user!
    return if current_user&.active?

    render json: { errors: [ "Sesion requerida" ] }, status: :unauthorized
  end

  def require_admin_access!
    return render json: { errors: [ "Sesion requerida" ] }, status: :unauthorized unless current_user&.active?
    return if current_user.memberships.where(active: true, role: %w[hulul_admin hulul_support]).exists?

    render json: { errors: [ "No tienes acceso al administrador Hulul" ] }, status: :forbidden
  end

  def require_hulul_admin!
    return render json: { errors: [ "Sesion requerida" ] }, status: :unauthorized unless current_user&.active?
    return if current_user.memberships.where(active: true, role: "hulul_admin").exists?

    render json: { errors: [ "No tienes permiso para administrar empresas" ] }, status: :forbidden
  end

  def require_active_portal_business!
    return if portal_business&.status == "active"

    render json: { errors: [ "La empresa no esta activa" ] }, status: :forbidden
  end

  def portal_business
    @current_membership&.business
  end

  def portal_actor
    current_user
  end

  def current_membership
    @current_membership
  end

  def accessible_portal_branches
    scope = portal_business.branches.where(active: true)
    return scope if %w[owner hulul_admin hulul_support].include?(current_membership.role)
    return scope if current_membership.legacy_branch_role? && !current_membership.branch_assignments.exists?

    scope.joins(:branch_assignments).where(
      branch_assignments: { membership_id: current_membership.id, active: true }
    ).distinct
  end

  def portal_branch(branch_id = nil)
    branch_id.present? ? accessible_portal_branches.find(branch_id) : accessible_portal_branches.first
  end

  def ensure_portal_branch_access!(branch)
    accessible_portal_branches.find(branch.id)
  end

  def require_permission!(permission)
    branch = permission_branch
    return if current_membership&.can?(permission, branch: branch)

    render json: { errors: [ "No tienes permiso para esta accion" ] }, status: :forbidden
  end

  def permission_branch
    branch_id = params[:branch_id].presence ||
      params.dig(:inventory_movement, :branch_id).presence ||
      params.dig(:purchase, :branch_id).presence ||
      params.dig(:sale, :branch_id).presence ||
      params.dig(:cash_register_session, :branch_id).presence
    return portal_branch(branch_id) if branch_id

    cash_register_id = params.dig(:cash_register_session, :cash_register_id).presence
    return ensure_portal_branch_access!(portal_business.cash_registers.find(cash_register_id).branch) if cash_register_id

    session_id = params.dig(:cash_movement, :cash_register_session_id).presence
    return ensure_portal_branch_access!(portal_business.cash_register_sessions.find(session_id).branch) if session_id

    resource_branch = case controller_name
    when "sales"
      ensure_portal_branch_access!(portal_business.sales.find(params[:id]).branch) if params[:id].present?
    when "purchases"
      ensure_portal_branch_access!(portal_business.purchases.find(params[:id]).branch) if params[:id].present?
    end
    return resource_branch if resource_branch

    selected_branch_id = request.headers["X-Branch-ID"].presence
    portal_branch(selected_branch_id) if selected_branch_id
  end

  def record_audit_event!(business:, event_type:, auditable:, metadata: {})
    business.audit_events.create!(
      actor: current_user,
      event_type: event_type,
      auditable: auditable,
      metadata: metadata,
      ip_address: request.remote_ip,
      user_agent: request.user_agent
    )
  end
end
