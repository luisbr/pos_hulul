class Api::Portal::SuppliersController < ApplicationController
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

    render json: supplier_json(supplier), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    supplier = business.suppliers.find(params[:id])
    supplier.update!(supplier_params)

    render json: supplier_json(supplier.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def business
    @business ||= Business.find(params[:business_id])
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
