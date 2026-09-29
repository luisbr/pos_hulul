require "digest"
require "cgi"
require "json"
require "net/http"
require "securerandom"

module Onboarding
  class InvitationSender
    EXPIRATION = 7.days

    def self.call(user:, business:)
      new(user:, business:).call
    end

    def initialize(user:, business:)
      @user = user
      @business = business
    end

    def call
      token = SecureRandom.urlsafe_base64(32)
      @user.update!(
        invitation_token_digest: Digest::SHA256.hexdigest(token),
        invitation_expires_at: EXPIRATION.from_now
      )
      deliver!(token)
      true
    end

    private

    def deliver!(token)
      base_url = ENV.fetch("HULUL_POS_MAIL_API_URL")
      api_key = ENV.fetch("HULUL_POS_MAIL_API_KEY")
      link = "#{ENV.fetch('APP_FRONTEND_URL', 'https://pos.hulul.com.mx')}?invite=#{CGI.escape(token)}"
      payload = {
        requestId: "hulul-pos-welcome-#{@user.id}-#{@user.invitation_expires_at.to_i}",
        from: ENV.fetch("HULUL_POS_MAIL_SENDER", "contacto@pos.hulul.com.mx"),
        to: @user.email,
        subject: "Bienvenido a Hulul POS",
        text: "Hola #{@user.name}, activa tu acceso a #{@business.commercial_name}: #{link}",
        html: "<p>Hola #{@user.name},</p><p>Bienvenido a <strong>Hulul POS</strong> para #{@business.commercial_name}.</p><p><a href=\"#{link}\">Crea tu contraseña y activa tu acceso</a></p><p>Este enlace vence en 7 días.</p>"
      }
      uri = URI.join("#{base_url}/", "send")

      4.times do |attempt|
        request = Net::HTTP::Post.new(uri, "Content-Type" => "application/json", "X-Api-Key" => api_key)
        request.body = JSON.generate(payload)
        response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") { |http| http.request(request) }
        return if response.code.to_i == 202
        raise "mail delivery rejected (#{response.code})" unless [ 429, 502 ].include?(response.code.to_i) && attempt < 3

        sleep((2**attempt) + rand)
      end
    end
  end
end
