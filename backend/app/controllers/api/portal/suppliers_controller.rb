class Api::Portal::SuppliersController < ApplicationController
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: %i[create update]
  before_action -> { require_permission!("manage_suppliers") }, only: %i[create update]

  def index
    suppliers = business.suppliers.search(params[:q]).ordered.limit(100)
    suppliers = suppliers.active if ActiveModel::Type::Boolean.new.cast(params[:active_only])

    render json: suppliers.map { |supplier| supplier_json(supplier) }
  end

  def show
    render json: supplier_json(business.suppliers.find(params[:id]))
  end

  def create
    supplier = business.suppliers.create!(supplier_params)
    record_audit_event!(
      business: business,
      event_type: "supplier.created",
      auditable: supplier,
      metadata: {
        commercial_name: supplier.commercial_name,
        rfc: supplier.rfc
      }
    )

    render json: supplier_json(supplier), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    supplier = business.suppliers.find(params[:id])
    supplier.update!(supplier_params)
    record_audit_event!(
      business: business,
      event_type: "supplier.updated",
      auditable: supplier,
      metadata: {
        commercial_name: supplier.commercial_name,
        changed_fields: supplier.previous_changes.keys - %w[updated_at]
      }
    )

    render json: supplier_json(supplier.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def business
    portal_business
  end

  def supplier_params
    params.require(:supplier).permit(
      :commercial_name,
      :legal_name,
      :rfc,
      :phone,
      :whatsapp,
      :email,
      :contact_name,
      :address,
      :delivery_days,
      :payment_terms,
      :active,
      :notes
    )
  end

  def supplier_json(supplier)
    {
      id: supplier.id,
      commercial_name: supplier.commercial_name,
      legal_name: supplier.legal_name,
      rfc: supplier.rfc,
      phone: supplier.phone,
      whatsapp: supplier.whatsapp,
      email: supplier.email,
      contact_name: supplier.contact_name,
      address: supplier.address,
      delivery_days: supplier.delivery_days,
      payment_terms: supplier.payment_terms,
      active: supplier.active,
      notes: supplier.notes
    }
  end
end
