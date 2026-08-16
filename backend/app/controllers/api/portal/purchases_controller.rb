class Api::Portal::PurchasesController < ApplicationController
  def index
    purchases = business.purchases.includes(:supplier, :branch, :created_by, purchase_items: :product).recent.limit(100)
    render json: purchases.map { |purchase| purchase_json(purchase) }
  end

  def show
    purchase = business.purchases.includes(:supplier, :branch, :created_by, purchase_items: :product).find(params[:id])
    render json: purchase_json(purchase)
  end

  def create
    attrs = purchase_params
    purchase = Purchases::Recorder.call(
      business: business,
      branch: business.branches.find(attrs[:branch_id]),
      supplier: business.suppliers.find(attrs[:supplier_id]),
      created_by: business.users.find(attrs[:created_by_id]),
      purchased_at: attrs[:purchased_at],
      invoice_reference: attrs[:invoice_reference],
      notes: attrs[:notes],
      items: attrs.fetch(:items, [])
    )

    render json: purchase_json(purchase.reload), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound, ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  def cancel
    purchase = business.purchases.includes(:supplier, :branch, :created_by, :cancelled_by, purchase_items: %i[product unit]).find(params[:id])
    cancelled_by = business.users.find(cancel_params[:cancelled_by_id])

    cancelled_purchase = Purchases::Canceller.call(
      purchase: purchase,
      cancelled_by: cancelled_by,
      reason: cancel_params[:cancellation_reason]
    )

    render json: purchase_json(cancelled_purchase.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound, ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  private

  def business
    @business ||= Business.find(params[:business_id])
  end

  def purchase_params
    params.require(:purchase).permit(
      :branch_id,
      :supplier_id,
      :created_by_id,
      :purchased_at,
      :invoice_reference,
      :notes,
      items: [ :product_id, :quantity, :unit_cost_cents ]
    )
  end

  def cancel_params
    params.require(:purchase).permit(:cancelled_by_id, :cancellation_reason)
  end

  def purchase_json(purchase)
    {
      id: purchase.id,
      folio: purchase.folio,
      status: purchase.status,
      purchased_at: purchase.purchased_at.iso8601,
      cancelled_at: purchase.cancelled_at&.iso8601,
      cancellation_reason: purchase.cancellation_reason,
      invoice_reference: purchase.invoice_reference,
      notes: purchase.notes,
      total_cents: purchase.total_cents,
      branch: {
        id: purchase.branch.id,
        name: purchase.branch.name,
        code: purchase.branch.code
      },
      supplier: {
        id: purchase.supplier.id,
        commercial_name: purchase.supplier.commercial_name
      },
      created_by: {
        id: purchase.created_by.id,
        name: purchase.created_by.name
      },
      cancelled_by: purchase.cancelled_by && {
        id: purchase.cancelled_by.id,
        name: purchase.cancelled_by.name
      },
      items: purchase.purchase_items.map do |item|
        {
          id: item.id,
          product: {
            id: item.product.id,
            sku: item.product.sku,
            name: item.product.name
          },
          unit: item.unit.abbreviation,
          quantity: item.quantity.to_s,
          unit_cost_cents: item.unit_cost_cents,
          total_cents: item.total_cents
        }
      end
    }
  end
end
