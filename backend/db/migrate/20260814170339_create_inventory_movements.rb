class CreateInventoryMovements < ActiveRecord::Migration[8.0]
  def change
    create_table :inventory_movements, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.references :product, null: false, foreign_key: true, type: :uuid
      t.string :movement_type, null: false
      t.decimal :quantity, null: false, precision: 14, scale: 4
      t.references :unit, null: false, foreign_key: true, type: :uuid
      t.decimal :base_quantity, null: false, precision: 14, scale: 4
      t.integer :unit_cost_cents
      t.string :reference_type
      t.uuid :reference_id
      t.text :reason
      t.references :created_by, null: true, foreign_key: { to_table: :users }, type: :uuid

      t.timestamps
    end

    add_index :inventory_movements, [ :business_id, :branch_id, :product_id, :created_at ]
    add_index :inventory_movements, [ :business_id, :movement_type ]
    add_index :inventory_movements, [ :reference_type, :reference_id ]
  end
end
