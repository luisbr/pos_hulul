class Api::SessionsController < ApplicationController
  def create
    user = User.find_by(email: params[:email].to_s.strip.downcase)

    unless user&.authenticate(params[:password].to_s) && user.active?
      return render json: { errors: [ "Correo o contrasena incorrectos" ] }, status: :unauthorized
    end

    memberships = user.memberships.includes(:business).where(active: true).order(:created_at)
    membership = memberships.first
    return render json: { errors: [ "El usuario no tiene un negocio asignado" ] }, status: :unprocessable_entity unless membership

    render json: {
      token: session_token_for(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      default_business_id: membership.business_id,
      businesses: memberships.map do |item|
        {
          id: item.business_id,
          commercial_name: item.business.commercial_name,
          status: item.business.status,
          role: item.role
        }
      end
    }
  end
end
