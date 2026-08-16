class CreateProductCategories < ActiveRecord::Migration[8.0]
  def change
    create_table :product_categories, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :parent, null: true, foreign_key: { to_table: :product_categories }, type: :uuid
      t.string :name, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :product_categories, [ :business_id, :parent_id, :name ], unique: true
  end
end
