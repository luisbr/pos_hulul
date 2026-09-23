class Api::Portal::CustomersController < ApplicationController
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: %i[create update]
  before_action -> { require_permission!("manage_customers") }, only: %i[create update]

  def index
    customers = business.customers.search(params[:q]).ordered.limit(100)
    customers = customers.active if ActiveModel::Type::Boolean.new.cast(params[:active_only])

    render json: customers.map { |customer| customer_json(customer) }
  end

  def show
    render json: customer_json(business.customers.find(params[:id]))
  end

  def create
    customer = business.customers.create!(customer_params)
    record_audit_event!(
      business: business,
      event_type: "customer.created",
      auditable: customer,
      metadata: {
        commercial_name: customer.commercial_name,
        rfc: customer.rfc
      }
    )

    render json: customer_json(customer), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    customer = business.customers.find(params[:id])
    customer.update!(customer_params)
    record_audit_event!(
      business: business,
      event_type: "customer.updated",
      auditable: customer,
      metadata: {
        commercial_name: customer.commercial_name,
        changed_fields: customer.previous_changes.keys - %w[updated_at]
      }
    )

    render json: customer_json(customer.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def business
    portal_business
  end

  def customer_params
    params.require(:customer).permit(
      :customer_type,
      :commercial_name,
      :legal_name,
      :rfc,
      :phone,
      :whatsapp,
      :email,
      :address,
      :contact_name,
      :active,
      :notes
    )
  end

  def customer_json(customer)
    {
      id: customer.id,
      customer_type: customer.customer_type,
      commercial_name: customer.commercial_name,
      legal_name: customer.legal_name,
      rfc: customer.rfc,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      email: customer.email,
      address: customer.address,
      contact_name: customer.contact_name,
      active: customer.active,
      notes: customer.notes,
      public_customer: customer.public_customer
    }
  end
end
