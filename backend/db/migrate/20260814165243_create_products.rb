class CreateProducts < ActiveRecord::Migration[8.0]
  def change
    create_table :products, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :category, null: false, foreign_key: { to_table: :product_categories }, type: :uuid
      t.references :brand, null: true, foreign_key: true, type: :uuid
      t.uuid :main_supplier_id
      t.string :name, null: false
      t.text :short_description
      t.string :sku, null: false
      t.string :barcode
      t.references :base_unit, null: false, foreign_key: { to_table: :units }, type: :uuid
      t.boolean :allows_fractional_sale, null: false, default: false
      t.integer :sale_price_cents, null: false
      t.integer :current_cost_cents
      t.string :tax_mode, null: false, default: "included"
      t.decimal :tax_rate, null: false, precision: 5, scale: 2, default: 16
      t.decimal :minimum_stock, null: false, precision: 14, scale: 4, default: 0
      t.string :aisle_location
      t.string :shelf_location
      t.string :bin_location
      t.string :supplier_code
      t.text :search_aliases
      t.string :photo_url
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :products, [ :business_id, :sku ], unique: true
    add_index :products, [ :business_id, :barcode ], unique: true, where: "barcode IS NOT NULL"
    add_index :products, [ :business_id, :name ]
  end
end
