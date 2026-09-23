class Api::Portal::ProductsController < ApplicationController
  require "csv"
  before_action :require_portal_business!
  before_action :require_active_portal_business!, only: %i[create update import_preview import_commit]
  before_action -> { require_permission!("manage_products") }, only: %i[create update import_preview import_commit]

  def index
    products = business.products
      .includes(:category, :brand, :base_unit, :inventory_balances)
      .search(params[:q])
      .order(:name)
      .limit(100)
    products = products.active if ActiveModel::Type::Boolean.new.cast(params[:active_only])

    render json: products.map { |product| product_json(product, branch:) }
  end

  def show
    product = business.products.includes(:category, :brand, :base_unit, :inventory_balances).find(params[:id])

    render json: product_json(product, branch:)
  end

  def create
    product = business.products.create!(product_params)
    record_audit_event!(
      business: business,
      event_type: "product.created",
      auditable: product,
      metadata: {
        sku: product.sku,
        name: product.name,
        sale_price_cents: product.sale_price_cents
      }
    )

    render json: product_json(product.reload, branch:), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    product = business.products.find(params[:id])
    product.update!(product_params)
    record_audit_event!(
      business: business,
      event_type: "product.updated",
      auditable: product,
      metadata: {
        sku: product.sku,
        name: product.name,
        changed_fields: product.previous_changes.keys - %w[updated_at]
      }
    )

    render json: product_json(product.reload, branch:)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def import_template
    csv = CSV.generate do |output|
      output << Products::Importer::TEMPLATE_HEADERS
      output << [
        "TAL-900",
        "7501000012345",
        "Taladro demo 1/2",
        "Herramienta electrica",
        "Truper",
        "Pieza",
        "1299.00",
        "950.00",
        "5",
        "2",
        "16",
        "A3",
        "R2",
        "G1"
      ]
    end

    send_data csv, filename: "hulul-import-template.csv", type: "text/csv"
  end

  def import_preview
    result = Products::Importer.preview(
      business: business,
      branch: branch,
      file: import_file,
      created_by: import_user
    )

    render json: result
  rescue ArgumentError, Roo::Base::TypeError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  def import_commit
    result = Products::Importer.import(
      business: business,
      branch: branch,
      file: import_file,
      created_by: import_user
    )
    record_audit_event!(
      business: business,
      event_type: "products.imported",
      auditable: business,
      metadata: {
        branch_id: branch.id,
        imported_count: result[:imported_count],
        errors_count: result[:errors].size
      }
    )

    status = result[:errors].any? ? :unprocessable_entity : :created
    render json: result, status: status
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ArgumentError, Roo::Base::TypeError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  private

  def business
    portal_business
  end

  def branch
    @branch ||= portal_branch(params[:branch_id])
  end

  def product_params
    params.require(:product).permit(
      :category_id,
      :brand_id,
      :base_unit_id,
      :name,
      :short_description,
      :sku,
      :barcode,
      :allows_fractional_sale,
      :sale_price_cents,
      :current_cost_cents,
      :tax_mode,
      :tax_rate,
      :minimum_stock,
      :aisle_location,
      :shelf_location,
      :bin_location,
      :search_aliases,
      :active
    )
  end

  def import_file
    params.require(:file)
  end

  def import_user
    portal_actor
  end

  def product_json(product, branch:)
    balance = product.inventory_balances.find { |item| item.branch_id == branch&.id }
    quantity = balance&.quantity || 0
    stock_status = if quantity <= 0
      "out"
    elsif quantity <= product.minimum_stock
      "low"
    else
      "ok"
    end

    {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      short_description: product.short_description,
      category_id: product.category_id,
      category: product.category.name,
      brand_id: product.brand_id,
      brand: product.brand&.name,
      base_unit: {
        id: product.base_unit.id,
        name: product.base_unit.name,
        abbreviation: product.base_unit.abbreviation
      },
      allows_fractional_sale: product.allows_fractional_sale,
      sale_price_cents: product.sale_price_cents,
      current_cost_cents: product.current_cost_cents,
      tax_mode: product.tax_mode,
      tax_rate: product.tax_rate.to_s,
      minimum_stock: product.minimum_stock.to_s,
      aisle_location: product.aisle_location,
      shelf_location: product.shelf_location,
      bin_location: product.bin_location,
      stock_quantity: quantity.to_s,
      stock_status:,
      location: [ product.aisle_location, product.shelf_location, product.bin_location ].compact_blank.join(" / "),
      active: product.active
    }
  end
end
