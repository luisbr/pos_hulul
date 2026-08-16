class CreatePurchaseItems < ActiveRecord::Migration[8.0]
  def change
    create_table :purchase_items, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :purchase, null: false, foreign_key: true, type: :uuid
      t.references :product, null: false, foreign_key: true, type: :uuid
      t.references :unit, null: false, foreign_key: true, type: :uuid
      t.decimal :quantity, precision: 14, scale: 4, null: false
      t.integer :unit_cost_cents, null: false
      t.integer :total_cents, null: false

      t.timestamps
    end
  end
end
