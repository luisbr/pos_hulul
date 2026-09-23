# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_09_20_090000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "audit_events", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "actor_id"
    t.string "event_type", null: false
    t.string "auditable_type", null: false
    t.uuid "auditable_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_audit_events_on_actor_id"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_events_on_auditable_type_and_auditable_id"
    t.index ["business_id", "created_at"], name: "index_audit_events_on_business_id_and_created_at"
    t.index ["business_id", "event_type"], name: "index_audit_events_on_business_id_and_event_type"
    t.index ["business_id"], name: "index_audit_events_on_business_id"
  end

  create_table "branch_assignments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "membership_id", null: false
    t.uuid "branch_id", null: false
    t.string "role", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["branch_id"], name: "index_branch_assignments_on_branch_id"
    t.index ["membership_id", "branch_id"], name: "index_branch_assignments_on_membership_id_and_branch_id", unique: true
    t.index ["membership_id"], name: "index_branch_assignments_on_membership_id"
  end

  create_table "branches", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.string "name", null: false
    t.string "code", null: false
    t.text "address"
    t.string "timezone", default: "America/Mexico_City", null: false
    t.string "currency", default: "MXN", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "operational_day_start_minute", default: 0, null: false
    t.index ["business_id", "code"], name: "index_branches_on_business_id_and_code", unique: true
    t.index ["business_id"], name: "index_branches_on_business_id"
  end

  create_table "brands", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "name"], name: "index_brands_on_business_id_and_name", unique: true
    t.index ["business_id"], name: "index_brands_on_business_id"
  end

  create_table "businesses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "commercial_name", null: false
    t.string "legal_name"
    t.string "rfc"
    t.string "primary_contact_name"
    t.string "phone"
    t.string "whatsapp"
    t.string "email"
    t.string "status", default: "active", null: false
    t.string "license_status", default: "trial", null: false
    t.datetime "trial_ends_at"
    t.datetime "license_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["commercial_name"], name: "index_businesses_on_commercial_name"
    t.index ["license_status"], name: "index_businesses_on_license_status"
  end

  create_table "cash_movements", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.uuid "cash_register_session_id", null: false
    t.string "movement_type", null: false
    t.integer "amount_cents", null: false
    t.string "reference_type"
    t.uuid "reference_id"
    t.text "reason"
    t.uuid "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["branch_id"], name: "index_cash_movements_on_branch_id"
    t.index ["business_id", "cash_register_session_id", "created_at"], name: "idx_on_business_id_cash_register_session_id_created_c17932598a"
    t.index ["business_id", "movement_type"], name: "index_cash_movements_on_business_id_and_movement_type"
    t.index ["business_id"], name: "index_cash_movements_on_business_id"
    t.index ["cash_register_session_id"], name: "index_cash_movements_on_cash_register_session_id"
    t.index ["created_by_id"], name: "index_cash_movements_on_created_by_id"
    t.index ["reference_type", "reference_id"], name: "index_cash_movements_on_reference_type_and_reference_id"
  end

  create_table "cash_register_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.uuid "cash_register_id", null: false
    t.uuid "opened_by_id", null: false
    t.uuid "closed_by_id"
    t.datetime "opened_at", null: false
    t.datetime "closed_at"
    t.integer "opening_amount_cents", default: 0, null: false
    t.integer "expected_cash_cents", default: 0, null: false
    t.integer "counted_cash_cents"
    t.integer "difference_cents"
    t.string "status", default: "open", null: false
    t.text "closing_notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "pending_close_at"
    t.boolean "forced_closed", default: false, null: false
    t.text "force_close_reason"
    t.index ["branch_id"], name: "index_cash_register_sessions_on_branch_id"
    t.index ["business_id", "cash_register_id", "status"], name: "idx_on_business_id_cash_register_id_status_17bd1ee143"
    t.index ["business_id"], name: "index_cash_register_sessions_on_business_id"
    t.index ["cash_register_id"], name: "index_active_cash_register_session", unique: true, where: "((status)::text = ANY ((ARRAY['open'::character varying, 'pending_close'::character varying])::text[]))"
    t.index ["cash_register_id"], name: "index_cash_register_sessions_on_cash_register_id"
    t.index ["closed_by_id"], name: "index_cash_register_sessions_on_closed_by_id"
    t.index ["opened_by_id"], name: "index_cash_register_sessions_on_opened_by_id"
  end

  create_table "cash_registers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.string "name", null: false
    t.string "code", null: false
    t.boolean "active", default: true, null: false
    t.integer "current_folio_number", default: 1, null: false
    t.string "printer_name"
    t.string "ticket_size", default: "80mm", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["branch_id"], name: "index_cash_registers_on_branch_id"
    t.index ["business_id", "branch_id", "code"], name: "index_cash_registers_on_business_id_and_branch_id_and_code", unique: true
    t.index ["business_id"], name: "index_cash_registers_on_business_id"
  end

  create_table "customers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.string "customer_type", default: "person", null: false
    t.string "commercial_name", null: false
    t.string "legal_name"
    t.string "rfc"
    t.string "phone"
    t.string "whatsapp"
    t.string "email"
    t.string "address"
    t.string "contact_name"
    t.integer "credit_limit_cents", default: 0, null: false
    t.integer "credit_days", default: 0, null: false
    t.string "credit_status", default: "clear", null: false
    t.boolean "active", default: true, null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "public_customer", default: false, null: false
    t.index ["business_id", "commercial_name"], name: "index_customers_on_business_id_and_commercial_name"
    t.index ["business_id", "email"], name: "index_customers_on_business_id_and_email"
    t.index ["business_id", "public_customer"], name: "index_customers_on_business_id_and_public_customer"
    t.index ["business_id", "rfc"], name: "index_customers_on_business_id_and_rfc"
    t.index ["business_id"], name: "index_customers_on_business_id"
  end

  create_table "inventory_balances", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.uuid "product_id", null: false
    t.decimal "quantity", precision: 14, scale: 4, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["branch_id"], name: "index_inventory_balances_on_branch_id"
    t.index ["business_id", "branch_id", "product_id"], name: "idx_on_business_id_branch_id_product_id_e40ad5cd11", unique: true
    t.index ["business_id"], name: "index_inventory_balances_on_business_id"
    t.index ["product_id"], name: "index_inventory_balances_on_product_id"
  end

  create_table "inventory_movements", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.uuid "product_id", null: false
    t.string "movement_type", null: false
    t.decimal "quantity", precision: 14, scale: 4, null: false
    t.uuid "unit_id", null: false
    t.decimal "base_quantity", precision: 14, scale: 4, null: false
    t.integer "unit_cost_cents"
    t.string "reference_type"
    t.uuid "reference_id"
    t.text "reason"
    t.uuid "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["branch_id"], name: "index_inventory_movements_on_branch_id"
    t.index ["business_id", "branch_id", "product_id", "created_at"], name: "idx_on_business_id_branch_id_product_id_created_at_72d0001375"
    t.index ["business_id", "movement_type"], name: "index_inventory_movements_on_business_id_and_movement_type"
    t.index ["business_id"], name: "index_inventory_movements_on_business_id"
    t.index ["created_by_id"], name: "index_inventory_movements_on_created_by_id"
    t.index ["product_id"], name: "index_inventory_movements_on_product_id"
    t.index ["reference_type", "reference_id"], name: "index_inventory_movements_on_reference_type_and_reference_id"
    t.index ["unit_id"], name: "index_inventory_movements_on_unit_id"
  end

  create_table "memberships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "user_id", null: false
    t.string "role", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "user_id", "role"], name: "index_memberships_on_business_id_and_user_id_and_role", unique: true
    t.index ["business_id"], name: "index_memberships_on_business_id"
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "payments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "sale_id", null: false
    t.uuid "cash_register_session_id", null: false
    t.string "payment_method", null: false
    t.integer "amount_cents", null: false
    t.integer "received_amount_cents", default: 0, null: false
    t.integer "change_amount_cents", default: 0, null: false
    t.string "reference"
    t.uuid "created_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "cash_register_session_id", "created_at"], name: "idx_on_business_id_cash_register_session_id_created_0baad2a832"
    t.index ["business_id", "sale_id"], name: "index_payments_on_business_id_and_sale_id"
    t.index ["business_id"], name: "index_payments_on_business_id"
    t.index ["cash_register_session_id"], name: "index_payments_on_cash_register_session_id"
    t.index ["created_by_id"], name: "index_payments_on_created_by_id"
    t.index ["sale_id"], name: "index_payments_on_sale_id"
  end

  create_table "product_categories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "parent_id"
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "parent_id", "name"], name: "index_product_categories_on_business_id_and_parent_id_and_name", unique: true
    t.index ["business_id"], name: "index_product_categories_on_business_id"
    t.index ["parent_id"], name: "index_product_categories_on_parent_id"
  end

  create_table "products", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "category_id", null: false
    t.uuid "brand_id"
    t.uuid "main_supplier_id"
    t.string "name", null: false
    t.text "short_description"
    t.string "sku", null: false
    t.string "barcode"
    t.uuid "base_unit_id", null: false
    t.boolean "allows_fractional_sale", default: false, null: false
    t.integer "sale_price_cents", null: false
    t.integer "current_cost_cents"
    t.string "tax_mode", default: "included", null: false
    t.decimal "tax_rate", precision: 5, scale: 2, default: "16.0", null: false
    t.decimal "minimum_stock", precision: 14, scale: 4, default: "0.0", null: false
    t.string "aisle_location"
    t.string "shelf_location"
    t.string "bin_location"
    t.string "supplier_code"
    t.text "search_aliases"
    t.string "photo_url"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["base_unit_id"], name: "index_products_on_base_unit_id"
    t.index ["brand_id"], name: "index_products_on_brand_id"
    t.index ["business_id", "barcode"], name: "index_products_on_business_id_and_barcode", unique: true, where: "(barcode IS NOT NULL)"
    t.index ["business_id", "name"], name: "index_products_on_business_id_and_name"
    t.index ["business_id", "sku"], name: "index_products_on_business_id_and_sku", unique: true
    t.index ["business_id"], name: "index_products_on_business_id"
    t.index ["category_id"], name: "index_products_on_category_id"
  end

  create_table "purchase_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "purchase_id", null: false
    t.uuid "product_id", null: false
    t.uuid "unit_id", null: false
    t.decimal "quantity", precision: 14, scale: 4, null: false
    t.integer "unit_cost_cents", null: false
    t.integer "total_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id"], name: "index_purchase_items_on_business_id"
    t.index ["product_id"], name: "index_purchase_items_on_product_id"
    t.index ["purchase_id"], name: "index_purchase_items_on_purchase_id"
    t.index ["unit_id"], name: "index_purchase_items_on_unit_id"
  end

  create_table "purchases", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.uuid "supplier_id", null: false
    t.uuid "created_by_id", null: false
    t.string "folio", null: false
    t.string "status", default: "received", null: false
    t.datetime "purchased_at", null: false
    t.string "invoice_reference"
    t.text "notes"
    t.integer "total_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "cancelled_at"
    t.text "cancellation_reason"
    t.uuid "cancelled_by_id"
    t.index ["branch_id"], name: "index_purchases_on_branch_id"
    t.index ["business_id", "folio"], name: "index_purchases_on_business_id_and_folio", unique: true
    t.index ["business_id"], name: "index_purchases_on_business_id"
    t.index ["cancelled_by_id"], name: "index_purchases_on_cancelled_by_id"
    t.index ["created_by_id"], name: "index_purchases_on_created_by_id"
    t.index ["supplier_id"], name: "index_purchases_on_supplier_id"
  end

  create_table "sale_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "sale_id", null: false
    t.uuid "product_id", null: false
    t.string "sku", null: false
    t.string "product_name", null: false
    t.decimal "quantity", precision: 14, scale: 4, null: false
    t.uuid "unit_id", null: false
    t.integer "unit_price_cents", default: 0, null: false
    t.integer "discount_cents", default: 0, null: false
    t.integer "tax_cents", default: 0, null: false
    t.integer "total_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "product_id"], name: "index_sale_items_on_business_id_and_product_id"
    t.index ["business_id", "sale_id"], name: "index_sale_items_on_business_id_and_sale_id"
    t.index ["business_id"], name: "index_sale_items_on_business_id"
    t.index ["product_id"], name: "index_sale_items_on_product_id"
    t.index ["sale_id"], name: "index_sale_items_on_sale_id"
    t.index ["unit_id"], name: "index_sale_items_on_unit_id"
  end

  create_table "sales", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "branch_id", null: false
    t.uuid "cash_register_id", null: false
    t.uuid "cash_register_session_id", null: false
    t.uuid "cashier_id", null: false
    t.string "folio", null: false
    t.string "status", default: "paid", null: false
    t.integer "subtotal_cents", default: 0, null: false
    t.integer "tax_cents", default: 0, null: false
    t.integer "discount_cents", default: 0, null: false
    t.integer "total_cents", default: 0, null: false
    t.string "sale_type", default: "cash", null: false
    t.string "idempotency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "cancelled_at"
    t.uuid "cancelled_by_id"
    t.text "cancellation_reason"
    t.uuid "customer_id"
    t.index ["branch_id"], name: "index_sales_on_branch_id"
    t.index ["business_id", "cash_register_session_id", "created_at"], name: "idx_on_business_id_cash_register_session_id_created_d15010852d"
    t.index ["business_id", "customer_id", "created_at"], name: "index_sales_on_business_id_and_customer_id_and_created_at"
    t.index ["business_id", "folio"], name: "index_sales_on_business_id_and_folio", unique: true
    t.index ["business_id", "idempotency_key"], name: "index_sales_on_business_id_and_idempotency_key", unique: true
    t.index ["business_id", "status", "created_at"], name: "index_sales_on_business_id_and_status_and_created_at"
    t.index ["business_id"], name: "index_sales_on_business_id"
    t.index ["cancelled_by_id"], name: "index_sales_on_cancelled_by_id"
    t.index ["cash_register_id"], name: "index_sales_on_cash_register_id"
    t.index ["cash_register_session_id"], name: "index_sales_on_cash_register_session_id"
    t.index ["cashier_id"], name: "index_sales_on_cashier_id"
    t.index ["customer_id"], name: "index_sales_on_customer_id"
  end

  create_table "suppliers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.string "commercial_name", null: false
    t.string "legal_name"
    t.string "rfc"
    t.string "phone"
    t.string "whatsapp"
    t.string "email"
    t.string "contact_name"
    t.string "address"
    t.string "delivery_days"
    t.string "payment_terms"
    t.boolean "active", default: true, null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "commercial_name"], name: "index_suppliers_on_business_id_and_commercial_name"
    t.index ["business_id", "email"], name: "index_suppliers_on_business_id_and_email"
    t.index ["business_id", "rfc"], name: "index_suppliers_on_business_id_and_rfc"
    t.index ["business_id"], name: "index_suppliers_on_business_id"
  end

  create_table "unit_conversions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.uuid "from_unit_id", null: false
    t.uuid "to_unit_id", null: false
    t.decimal "factor", precision: 14, scale: 4, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "from_unit_id", "to_unit_id"], name: "idx_on_business_id_from_unit_id_to_unit_id_a21007d45d", unique: true
    t.index ["business_id"], name: "index_unit_conversions_on_business_id"
    t.index ["from_unit_id"], name: "index_unit_conversions_on_from_unit_id"
    t.index ["to_unit_id"], name: "index_unit_conversions_on_to_unit_id"
  end

  create_table "units", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "business_id", null: false
    t.string "name", null: false
    t.string "abbreviation", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["business_id", "abbreviation"], name: "index_units_on_business_id_and_abbreviation", unique: true
    t.index ["business_id", "name"], name: "index_units_on_business_id_and_name", unique: true
    t.index ["business_id"], name: "index_units_on_business_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "audit_events", "businesses"
  add_foreign_key "audit_events", "users", column: "actor_id"
  add_foreign_key "branch_assignments", "branches"
  add_foreign_key "branch_assignments", "memberships"
  add_foreign_key "branches", "businesses"
  add_foreign_key "brands", "businesses"
  add_foreign_key "cash_movements", "branches"
  add_foreign_key "cash_movements", "businesses"
  add_foreign_key "cash_movements", "cash_register_sessions"
  add_foreign_key "cash_movements", "users", column: "created_by_id"
  add_foreign_key "cash_register_sessions", "branches"
  add_foreign_key "cash_register_sessions", "businesses"
  add_foreign_key "cash_register_sessions", "cash_registers"
  add_foreign_key "cash_register_sessions", "users", column: "closed_by_id"
  add_foreign_key "cash_register_sessions", "users", column: "opened_by_id"
  add_foreign_key "cash_registers", "branches"
  add_foreign_key "cash_registers", "businesses"
  add_foreign_key "customers", "businesses"
  add_foreign_key "inventory_balances", "branches"
  add_foreign_key "inventory_balances", "businesses"
  add_foreign_key "inventory_balances", "products"
  add_foreign_key "inventory_movements", "branches"
  add_foreign_key "inventory_movements", "businesses"
  add_foreign_key "inventory_movements", "products"
  add_foreign_key "inventory_movements", "units"
  add_foreign_key "inventory_movements", "users", column: "created_by_id"
  add_foreign_key "memberships", "businesses"
  add_foreign_key "memberships", "users"
  add_foreign_key "payments", "businesses"
  add_foreign_key "payments", "cash_register_sessions"
  add_foreign_key "payments", "sales"
  add_foreign_key "payments", "users", column: "created_by_id"
  add_foreign_key "product_categories", "businesses"
  add_foreign_key "product_categories", "product_categories", column: "parent_id"
  add_foreign_key "products", "brands"
  add_foreign_key "products", "businesses"
  add_foreign_key "products", "product_categories", column: "category_id"
  add_foreign_key "products", "units", column: "base_unit_id"
  add_foreign_key "purchase_items", "businesses"
  add_foreign_key "purchase_items", "products"
  add_foreign_key "purchase_items", "purchases"
  add_foreign_key "purchase_items", "units"
  add_foreign_key "purchases", "branches"
  add_foreign_key "purchases", "businesses"
  add_foreign_key "purchases", "suppliers"
  add_foreign_key "purchases", "users", column: "cancelled_by_id"
  add_foreign_key "purchases", "users", column: "created_by_id"
  add_foreign_key "sale_items", "businesses"
  add_foreign_key "sale_items", "products"
  add_foreign_key "sale_items", "sales"
  add_foreign_key "sale_items", "units"
  add_foreign_key "sales", "branches"
  add_foreign_key "sales", "businesses"
  add_foreign_key "sales", "cash_register_sessions"
  add_foreign_key "sales", "cash_registers"
  add_foreign_key "sales", "customers"
  add_foreign_key "sales", "users", column: "cancelled_by_id"
  add_foreign_key "sales", "users", column: "cashier_id"
  add_foreign_key "suppliers", "businesses"
  add_foreign_key "unit_conversions", "businesses"
  add_foreign_key "unit_conversions", "units", column: "from_unit_id"
  add_foreign_key "unit_conversions", "units", column: "to_unit_id"
  add_foreign_key "units", "businesses"
end
