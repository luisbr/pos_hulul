class CreateInventoryBalances < ActiveRecord::Migration[8.0]
  def change
    create_table :inventory_balances, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.references :product, null: false, foreign_key: true, type: :uuid
      t.decimal :quantity, null: false, precision: 14, scale: 4, default: 0

      t.timestamps
    end

    add_index :inventory_balances, [ :business_id, :branch_id, :product_id ], unique: true
  end
end
