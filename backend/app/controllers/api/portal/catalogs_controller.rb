class Api::Portal::CatalogsController < ApplicationController
  def index
    business = Business.find(params[:business_id])

    render json: {
      categories: business.product_categories.order(:name).map do |category|
        {
          id: category.id,
          parent_id: category.parent_id,
          name: category.name,
          active: category.active
        }
      end,
      brands: business.brands.order(:name).map do |brand|
        {
          id: brand.id,
          name: brand.name,
          active: brand.active
        }
      end,
      units: business.units.order(:name).map do |unit|
        {
          id: unit.id,
          name: unit.name,
          abbreviation: unit.abbreviation,
          active: unit.active
        }
      end
    }
  end

  def create
    record = catalog_model.new(catalog_params.merge(business: business))
    record.save!

    render json: catalog_json(record), status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  def update
    record = catalog_scope.find(params[:id])
    record.update!(catalog_params)

    render json: catalog_json(record)
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound, ArgumentError => error
    render json: { errors: [ error.message ] }, status: :unprocessable_entity
  end

  private

  def business
    @business ||= Business.find(params[:business_id])
  end

  def catalog_scope
    case params[:catalog_type]
    when "categories" then business.product_categories
    when "brands" then business.brands
    when "units" then business.units
    else
      raise ArgumentError, "Catalogo invalido"
    end
  end

  def catalog_model
    catalog_scope.klass
  end

  def catalog_params
    case params[:catalog_type]
    when "categories"
      params.require(:catalog).permit(:name, :parent_id, :active)
    when "brands"
      params.require(:catalog).permit(:name, :active)
    when "units"
      params.require(:catalog).permit(:name, :abbreviation, :active)
    else
      raise ArgumentError, "Catalogo invalido"
    end
  end

  def catalog_json(record)
    case record
    when ProductCategory
      {
        id: record.id,
        parent_id: record.parent_id,
        name: record.name,
        active: record.active
      }
    when Brand
      {
        id: record.id,
        name: record.name,
        active: record.active
      }
    when Unit
      {
        id: record.id,
        name: record.name,
        abbreviation: record.abbreviation,
        active: record.active
      }
    else
      raise ArgumentError, "Catalogo invalido"
    end
  end
end
