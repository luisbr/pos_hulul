class Api::HealthController < ApplicationController
  def show
    render json: {
      status: "ok",
      app: "hulul-pos-api",
      timestamp: Time.current.iso8601
    }
  end
end
