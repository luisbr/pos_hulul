class CreateSales < ActiveRecord::Migration[8.0]
  def change
    create_table :sales, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.references :cash_register, null: false, foreign_key: true, type: :uuid
      t.references :cash_register_session, null: false, foreign_key: true, type: :uuid
      t.references :cashier, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.string :folio, null: false
      t.string :status, null: false, default: "paid"
      t.integer :subtotal_cents, null: false, default: 0
      t.integer :tax_cents, null: false, default: 0
      t.integer :discount_cents, null: false, default: 0
      t.integer :total_cents, null: false, default: 0
      t.string :sale_type, null: false, default: "cash"
      t.string :idempotency_key, null: false

      t.timestamps
    end

    add_index :sales, [ :business_id, :folio ], unique: true
    add_index :sales, [ :business_id, :idempotency_key ], unique: true
    add_index :sales, [ :business_id, :cash_register_session_id, :created_at ]
  end
end
