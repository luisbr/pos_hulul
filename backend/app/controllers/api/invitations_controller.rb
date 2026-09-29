require "digest"

class Api::InvitationsController < ApplicationController
  def accept
    token = params[:token].to_s
    user = User.find_by(invitation_token_digest: Digest::SHA256.hexdigest(token))
    unless user&.invitation_expires_at&.future?
      return render json: { errors: [ "La invitación no es válida o ya venció" ] }, status: :unprocessable_entity
    end

    password = params[:password].to_s
    confirmation = params[:password_confirmation].to_s
    if password.length < 8 || password != confirmation
      return render json: { errors: [ "La contraseña debe coincidir y tener al menos 8 caracteres" ] }, status: :unprocessable_entity
    end

    user.update!(password:, invitation_token_digest: nil, invitation_expires_at: nil)
    render json: { email: user.email, message: "Acceso activado. Ya puedes iniciar sesión." }
  end
end
