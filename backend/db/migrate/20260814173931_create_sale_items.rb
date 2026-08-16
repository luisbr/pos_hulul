class CreateSaleItems < ActiveRecord::Migration[8.0]
  def change
    create_table :sale_items, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :sale, null: false, foreign_key: true, type: :uuid
      t.references :product, null: false, foreign_key: true, type: :uuid
      t.string :sku, null: false
      t.string :product_name, null: false
      t.decimal :quantity, null: false, precision: 14, scale: 4
      t.references :unit, null: false, foreign_key: true, type: :uuid
      t.integer :unit_price_cents, null: false, default: 0
      t.integer :discount_cents, null: false, default: 0
      t.integer :tax_cents, null: false, default: 0
      t.integer :total_cents, null: false, default: 0

      t.timestamps
    end

    add_index :sale_items, [ :business_id, :sale_id ]
    add_index :sale_items, [ :business_id, :product_id ]
  end
end
