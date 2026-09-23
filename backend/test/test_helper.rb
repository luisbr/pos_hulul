ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

class ActionDispatch::IntegrationTest
  def sign_in_as(user)
    @auth_headers = {
      "Authorization" => "Bearer #{user.signed_id(purpose: "portal_session", expires_in: 30.days)}"
    }
  end

  def get(path, **args)
    args[:headers] = (@auth_headers || {}).merge(args[:headers] || {})
    super(path, **args)
  end

  def post(path, **args)
    args[:headers] = (@auth_headers || {}).merge(args[:headers] || {})
    super(path, **args)
  end

  def patch(path, **args)
    args[:headers] = (@auth_headers || {}).merge(args[:headers] || {})
    super(path, **args)
  end

  def delete(path, **args)
    args[:headers] = (@auth_headers || {}).merge(args[:headers] || {})
    super(path, **args)
  end
end
