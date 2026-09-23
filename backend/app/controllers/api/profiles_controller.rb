class Api::ProfilesController < ApplicationController
  before_action :require_authenticated_user!

  def show
    render_profile
  end

  def update
    attributes = profile_params.slice(:name, :email)

    if password_change_requested?
      return render json: { errors: [ "La contrasena actual es incorrecta" ] }, status: :unprocessable_entity unless current_user.authenticate(profile_params[:current_password].to_s)
      return render json: { errors: [ "La nueva contrasena debe tener al menos 8 caracteres" ] }, status: :unprocessable_entity if profile_params[:password].to_s.length < 8
      return render json: { errors: [ "La confirmacion de contrasena no coincide" ] }, status: :unprocessable_entity if profile_params[:password] != profile_params[:password_confirmation]

      attributes[:password] = profile_params[:password]
      attributes[:password_confirmation] = profile_params[:password_confirmation]
    end

    current_user.update!(attributes)
    render_profile
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def profile_params
    params.require(:profile).permit(:name, :email, :current_password, :password, :password_confirmation)
  end

  def password_change_requested?
    profile_params.values_at(:current_password, :password, :password_confirmation).any?(&:present?)
  end

  def render_profile
    render json: {
      token: session_token_for(current_user),
      user: {
        id: current_user.id,
        name: current_user.name,
        email: current_user.email
      }
    }
  end
end
