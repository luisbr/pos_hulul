require "set"

module Products
  class Importer
    REQUIRED_HEADERS = %w[sku nombre categoria unidad precio_venta].freeze
    TEMPLATE_HEADERS = %w[
      sku
      codigo_barras
      nombre
      categoria
      marca
      unidad
      precio_venta
      costo
      stock_inicial
      stock_minimo
      iva
      pasillo
      anaquel
      gaveta
    ].freeze

    def self.preview(...)
      new(...).preview
    end

    def self.import(...)
      new(...).import
    end

    def initialize(business:, branch:, file:, created_by: nil)
      @business = business
      @branch = branch
      @file = file
      @created_by = created_by
      @category_cache = {}
      @brand_cache = {}
      @unit_cache = {}
    end

    def preview
      workbook_rows
    end

    def import
      result = workbook_rows
      return result if result[:errors].any?

      created = []
      ActiveRecord::Base.transaction do
        result[:rows].each do |row|
          created << import_row!(row)
        end
      end

      result.merge(imported_count: created.length, imported_skus: created.map(&:sku))
    end

    private

    def workbook_rows
      spreadsheet = Roo::Spreadsheet.open(@file.path, extension: File.extname(@file.original_filename).delete("."))
      sheet = spreadsheet.sheet(0)
      header_map = build_header_map(sheet.row(1))

      missing_headers = REQUIRED_HEADERS - header_map.keys
      return { rows: [], errors: missing_headers.map { |header| "Falta columna #{header}" } } if missing_headers.any?

      rows = []
      errors = []
      seen_skus = Set.new

      2.upto(sheet.last_row) do |index|
        raw_row = sheet.row(index)
        normalized = normalize_row(raw_row, header_map, index)
        next if normalized[:blank]

        row_errors = []
        row_errors << "SKU repetido en archivo" if seen_skus.include?(normalized[:sku])
        row_errors.concat(validate_row(normalized))
        seen_skus << normalized[:sku] if normalized[:sku].present?

        rows << normalized.merge(errors: row_errors)
        errors.concat(row_errors.map { |error| "Fila #{index}: #{error}" })
      end

      { rows: rows, errors: errors.uniq }
    end

    def build_header_map(header_row)
      header_row.each_with_index.with_object({}) do |(header, idx), acc|
        normalized = normalize_header(header)
        acc[normalized] = idx if normalized.present?
      end
    end

    def normalize_header(value)
      ActiveSupport::Inflector.transliterate(value.to_s).downcase.strip.gsub(/\s+/, "_")
    end

    def normalize_row(raw_row, header_map, row_number)
      row = header_map.keys.index_with do |header|
        raw_row[header_map.fetch(header)]
      end

      {
        row_number: row_number,
        sku: row["sku"].to_s.strip,
        barcode: row["codigo_barras"].to_s.strip.presence,
        name: row["nombre"].to_s.strip,
        category_name: row["categoria"].to_s.strip,
        brand_name: row["marca"].to_s.strip.presence,
        unit_name: row["unidad"].to_s.strip,
        sale_price: row["precio_venta"].to_s.strip,
        current_cost: row["costo"].to_s.strip,
        opening_stock: row["stock_inicial"].to_s.strip,
        minimum_stock: row["stock_minimo"].to_s.strip,
        tax_value: row["iva"].to_s.strip,
        aisle_location: row["pasillo"].to_s.strip.presence,
        shelf_location: row["anaquel"].to_s.strip.presence,
        bin_location: row["gaveta"].to_s.strip.presence,
        blank: row.values.all? { |value| value.blank? }
      }
    end

    def validate_row(row)
      errors = []
      errors << "SKU requerido" if row[:sku].blank?
      errors << "Nombre requerido" if row[:name].blank?
      errors << "Categoria requerida" if row[:category_name].blank?
      errors << "Unidad requerida" if row[:unit_name].blank?
      errors << "Precio venta requerido" if row[:sale_price].blank?
      errors << "SKU ya existe" if row[:sku].present? && @business.products.exists?(sku: row[:sku])
      errors << "Codigo de barras ya existe" if row[:barcode].present? && @business.products.exists?(barcode: row[:barcode])
      errors << "Precio venta invalido" if row[:sale_price].present? && !numeric_string?(row[:sale_price])
      errors << "Costo invalido" if row[:current_cost].present? && !numeric_string?(row[:current_cost])
      errors << "Stock inicial invalido" if row[:opening_stock].present? && !numeric_string?(row[:opening_stock])
      errors << "Stock minimo invalido" if row[:minimum_stock].present? && !numeric_string?(row[:minimum_stock])
      errors << "IVA invalido" if row[:tax_value].present? && tax_attributes(row[:tax_value]).nil?
      errors
    end

    def numeric_string?(value)
      BigDecimal(value.to_s)
      true
    rescue ArgumentError
      false
    end

    def tax_attributes(value)
      normalized = value.to_s.strip.downcase
      return { tax_mode: "included", tax_rate: 16 } if normalized.blank?
      return { tax_mode: "exempt", tax_rate: 0 } if %w[exento exempt].include?(normalized)
      return { tax_mode: "zero", tax_rate: 0 } if %w[0 0% cero zero].include?(normalized)

      rate = BigDecimal(normalized)
      { tax_mode: "included", tax_rate: rate }
    rescue ArgumentError
      nil
    end

    def import_row!(row)
      tax = tax_attributes(row[:tax_value]) || { tax_mode: "included", tax_rate: 16 }
      product = @business.products.create!(
        category: find_or_create_category!(row[:category_name]),
        brand: row[:brand_name].present? ? find_or_create_brand!(row[:brand_name]) : nil,
        base_unit: find_or_create_unit!(row[:unit_name]),
        name: row[:name],
        sku: row[:sku],
        barcode: row[:barcode],
        sale_price_cents: money_to_cents(row[:sale_price]),
        current_cost_cents: row[:current_cost].present? ? money_to_cents(row[:current_cost]) : nil,
        tax_mode: tax[:tax_mode],
        tax_rate: tax[:tax_rate],
        minimum_stock: row[:minimum_stock].presence || 0,
        aisle_location: row[:aisle_location],
        shelf_location: row[:shelf_location],
        bin_location: row[:bin_location],
        active: true
      )

      if row[:opening_stock].present? && BigDecimal(row[:opening_stock]).positive?
        Inventory::MovementRecorder.call(
          business: @business,
          branch: @branch,
          product: product,
          movement_type: "initial_stock",
          quantity: row[:opening_stock],
          unit: product.base_unit,
          unit_cost_cents: product.current_cost_cents,
          reason: "Importacion inicial",
          created_by: @created_by
        )
      end

      product
    end

    def find_or_create_category!(name)
      key = name.downcase
      @category_cache[key] ||= @business.product_categories.find_or_create_by!(name: name.strip)
    end

    def find_or_create_brand!(name)
      key = name.downcase
      @brand_cache[key] ||= @business.brands.find_or_create_by!(name: name.strip)
    end

    def find_or_create_unit!(name)
      key = name.downcase
      @unit_cache[key] ||= begin
        abbreviation = name.strip.downcase.gsub(/\s+/, "_").first(12)
        @business.units.find_or_create_by!(name: name.strip) do |unit|
          unit.abbreviation = abbreviation
        end
      end
    end

    def money_to_cents(value)
      (BigDecimal(value.to_s) * 100).round.to_i
    end
  end
end
