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
end
