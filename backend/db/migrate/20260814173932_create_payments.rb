class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :sale, null: false, foreign_key: true, type: :uuid
      t.references :cash_register_session, null: false, foreign_key: true, type: :uuid
      t.string :payment_method, null: false
      t.integer :amount_cents, null: false
      t.integer :received_amount_cents, null: false, default: 0
      t.integer :change_amount_cents, null: false, default: 0
      t.string :reference
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :uuid

      t.timestamps
    end

    add_index :payments, [ :business_id, :sale_id ]
    add_index :payments, [ :business_id, :cash_register_session_id, :created_at ]
  end
end
