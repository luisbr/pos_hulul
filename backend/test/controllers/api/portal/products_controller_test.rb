require "test_helper"
require "tempfile"

class Api::Portal::ProductsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @business = Business.create!(
      commercial_name: "Ferreteria El Tornillo",
      status: "active",
      license_status: "trial"
    )
    @branch = Branch.create!(
      business: @business,
      name: "Sucursal Centro",
      code: "TOL"
    )
    @category = ProductCategory.create!(
      business: @business,
      name: "Construccion"
    )
    @brand = Brand.create!(
      business: @business,
      name: "Cemex"
    )
    @unit = Unit.create!(
      business: @business,
      name: "Bulto",
      abbreviation: "bulto"
    )
    @product = Product.create!(
      business: @business,
      category: @category,
      brand: @brand,
      base_unit: @unit,
      name: "Cemento gris 50 kg",
      sku: "CEM-050",
      barcode: "7501000000028",
      sale_price_cents: 23_000,
      current_cost_cents: 18_400,
      tax_mode: "included",
      tax_rate: 16,
      minimum_stock: 15
    )
    InventoryBalance.create!(
      business: @business,
      branch: @branch,
      product: @product,
      quantity: 38
    )
  end

  test "lists products with branch stock" do
    get api_portal_business_products_url(@business)

    assert_response :success
    product = response.parsed_body.first
    assert_equal @product.id, product["id"]
    assert_equal "38.0", product["stock_quantity"].to_f.to_s
    assert_equal "ok", product["stock_status"]
  end

  test "searches products" do
    get api_portal_business_products_url(@business), params: { q: "cemento" }

    assert_response :success
    assert_equal 1, response.parsed_body.length
  end

  test "shows product detail" do
    get api_portal_business_product_url(@business, @product)

    assert_response :success
    assert_equal "CEM-050", response.parsed_body["sku"]
    assert_equal "Cemex", response.parsed_body["brand"]
  end

  test "creates product" do
    assert_difference -> { Product.count }, 1 do
      post api_portal_business_products_url(@business), params: {
        product: {
          category_id: @category.id,
          brand_id: @brand.id,
          base_unit_id: @unit.id,
          name: "Mortero 50 kg",
          sku: "MOR-050",
          barcode: "7501000099999",
          sale_price_cents: 19_500,
          current_cost_cents: 14_000,
          tax_mode: "included",
          tax_rate: 16,
          minimum_stock: 8,
          aisle_location: "B2",
          active: true
        }
      }
    end

    assert_response :created
    assert_equal "MOR-050", response.parsed_body["sku"]
    assert_equal @category.id, response.parsed_body["category_id"]
  end

  test "updates product" do
    patch api_portal_business_product_url(@business, @product), params: {
      product: {
        name: "Cemento gris reforzado 50 kg",
        sale_price_cents: 24_500,
        minimum_stock: 20
      }
    }

    assert_response :success
    assert_equal "Cemento gris reforzado 50 kg", response.parsed_body["name"]
    assert_equal 24_500, response.parsed_body["sale_price_cents"]
  end

  test "deactivates product" do
    patch api_portal_business_product_url(@business, @product), params: {
      product: {
        active: false
      }
    }

    assert_response :success
    assert_equal false, response.parsed_body["active"]
    assert_equal false, @product.reload.active
  end

  test "rejects duplicate sku" do
    post api_portal_business_products_url(@business), params: {
      product: {
        category_id: @category.id,
        base_unit_id: @unit.id,
        name: "Cemento duplicado",
        sku: "CEM-050",
        sale_price_cents: 23_000,
        tax_mode: "included",
        tax_rate: 16,
        minimum_stock: 1
      }
    }

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join(" "), "Sku"
  end

  test "returns import template" do
    get import_template_api_portal_business_products_url(@business)

    assert_response :success
    assert_includes response.body, "sku,codigo_barras,nombre,categoria"
  end

  test "previews product import" do
    file = csv_file(<<~CSV)
      sku,codigo_barras,nombre,categoria,marca,unidad,precio_venta,costo,stock_inicial,stock_minimo,iva,pasillo,anaquel,gaveta
      TAL-900,7501000012345,Taladro demo,Herramienta electrica,Truper,Pieza,1299.00,950.00,5,2,16,A3,R2,G1
    CSV

    post import_preview_api_portal_business_products_url(@business), params: { file: file }

    assert_response :success
    assert_equal 1, response.parsed_body["rows"].length
    assert_empty response.parsed_body["errors"]
  end

  test "imports products from file and creates stock" do
    file = csv_file(<<~CSV)
      sku,codigo_barras,nombre,categoria,marca,unidad,precio_venta,costo,stock_inicial,stock_minimo,iva,pasillo,anaquel,gaveta
      TAL-901,7501000012399,Taladro importado,Herramienta electrica,Truper,Pieza,999.00,700.00,3,1,16,A1,R1,G2
    CSV

    user = User.create!(name: "Luis Ramirez", email: "luis-import@example.test", password: "password123")
    Membership.create!(business: @business, user: user, role: "warehouse")

    assert_difference -> { Product.count }, 1 do
      assert_difference -> { InventoryMovement.where(movement_type: "initial_stock").count }, 1 do
        post import_commit_api_portal_business_products_url(@business), params: { file: file, created_by_id: user.id }
      end
    end

    assert_response :created
    assert_equal 1, response.parsed_body["imported_count"]
    product = Product.find_by!(business: @business, sku: "TAL-901")
    balance = InventoryBalance.find_by!(business: @business, branch: @branch, product: product)
    assert_equal 3, balance.quantity
  end

  test "rejects import preview with duplicate sku in db" do
    file = csv_file(<<~CSV)
      sku,codigo_barras,nombre,categoria,marca,unidad,precio_venta,costo,stock_inicial,stock_minimo,iva,pasillo,anaquel,gaveta
      CEM-050,7501000012345,Taladro demo,Herramienta electrica,Truper,Pieza,1299.00,950.00,5,2,16,A3,R2,G1
    CSV

    post import_preview_api_portal_business_products_url(@business), params: { file: file }

    assert_response :success
    assert_includes response.parsed_body["errors"].join(" "), "SKU ya existe"
  end

  private

  def csv_file(content)
    file = Tempfile.new([ "hulul-import", ".csv" ])
    file.write(content)
    file.rewind
    Rack::Test::UploadedFile.new(file.path, "text/csv")
  end
end
