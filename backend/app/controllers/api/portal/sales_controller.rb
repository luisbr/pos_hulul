class Api::Portal::SalesController < ApplicationController
  def index
    sales = business.sales.includes(:sale_items, :payments, :cashier, :customer).recent.limit(100)
    render json: sales.map { |sale| sale_json(sale) }
  end

  def show
    sale = business.sales.includes(:sale_items, :payments, :cashier, :customer).find(params[:id])
    render json: sale_json(sale)
  end

  def create
    attrs = sale_params
    branch = business.branches.find(attrs[:branch_id])
    cash_register = business.cash_registers.find(attrs[:cash_register_id])
    session = business.cash_register_sessions.open.find_by(cash_register:)
    cashier = business.users.find(attrs[:cashier_id])
    customer = attrs[:customer_id].present? ? business.customers.find(attrs[:customer_id]) : nil

    sale = Sales::Checkout.call(
      business: business,
      branch: branch,
      cash_register: cash_register,
      cash_register_session: session,
      cashier: cashier,
      customer: customer,
      items: attrs.fetch(:items, []),
      payments: attrs.fetch(:payments, []),
      idempotency_key: attrs[:idempotency_key]
    )

    render json: sale_json(sale.reload), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound, ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  def cancel
    sale = business.sales.includes(:payments, sale_items: %i[product unit]).find(params[:id])
    cancelled_by = business.users.find(cancel_params[:cancelled_by_id])
    refund_session = if cancel_params[:cash_register_session_id].present?
      business.cash_register_sessions.open.find(cancel_params[:cash_register_session_id])
    end

    cancelled_sale = Sales::Canceller.call(
      sale: sale,
      cancelled_by: cancelled_by,
      reason: cancel_params[:cancellation_reason],
      refund_session: refund_session
    )

    render json: sale_json(cancelled_sale.reload)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound, ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  private

  def business
    @business ||= Business.find(params[:business_id])
  end

  def sale_params
    params.require(:sale).permit(
      :branch_id,
      :cash_register_id,
      :cashier_id,
      :customer_id,
      :idempotency_key,
      items: [ :product_id, :quantity ],
      payments: [ :payment_method, :amount_cents, :received_amount_cents, :reference ]
    )
  end

  def cancel_params
    params.require(:sale).permit(:cancelled_by_id, :cash_register_session_id, :cancellation_reason)
  end

  def sale_json(sale)
    {
      id: sale.id,
      folio: sale.folio,
      status: sale.status,
      sale_type: sale.sale_type,
      subtotal_cents: sale.subtotal_cents,
      tax_cents: sale.tax_cents,
      discount_cents: sale.discount_cents,
      total_cents: sale.total_cents,
      created_at: sale.created_at.iso8601,
      cancelled_at: sale.cancelled_at&.iso8601,
      cancellation_reason: sale.cancellation_reason,
      cashier: {
        id: sale.cashier.id,
        name: sale.cashier.name
      },
      customer: sale.customer && {
        id: sale.customer.id,
        commercial_name: sale.customer.commercial_name
      },
      cancelled_by: sale.cancelled_by && {
        id: sale.cancelled_by.id,
        name: sale.cancelled_by.name
      },
      items: sale.sale_items.map do |item|
        {
          id: item.id,
          sku: item.sku,
          product_name: item.product_name,
          quantity: item.quantity.to_s,
          unit: item.unit.abbreviation,
          unit_price_cents: item.unit_price_cents,
          tax_cents: item.tax_cents,
          total_cents: item.total_cents
        }
      end,
      payments: sale.payments.map do |payment|
        {
          id: payment.id,
          payment_method: payment.payment_method,
          amount_cents: payment.amount_cents,
          received_amount_cents: payment.received_amount_cents,
          change_amount_cents: payment.change_amount_cents,
          reference: payment.reference
        }
      end
    }
  end
end
