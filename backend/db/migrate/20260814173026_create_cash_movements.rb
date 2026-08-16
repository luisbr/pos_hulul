class CreateCashMovements < ActiveRecord::Migration[8.0]
  def change
    create_table :cash_movements, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.references :cash_register_session, null: false, foreign_key: true, type: :uuid
      t.string :movement_type, null: false
      t.integer :amount_cents, null: false
      t.string :reference_type
      t.uuid :reference_id
      t.text :reason
      t.references :created_by, null: true, foreign_key: { to_table: :users }, type: :uuid

      t.timestamps
    end

    add_index :cash_movements, [ :business_id, :cash_register_session_id, :created_at ]
    add_index :cash_movements, [ :business_id, :movement_type ]
    add_index :cash_movements, [ :reference_type, :reference_id ]
  end
end
