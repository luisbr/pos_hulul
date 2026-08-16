class CreateBrands < ActiveRecord::Migration[8.0]
  def change
    create_table :brands, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :brands, [ :business_id, :name ], unique: true
  end
end
