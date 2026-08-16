class CreateCashRegisterSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :cash_register_sessions, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.references :cash_register, null: false, foreign_key: true, type: :uuid
      t.references :opened_by, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.references :closed_by, null: true, foreign_key: { to_table: :users }, type: :uuid
      t.datetime :opened_at, null: false
      t.datetime :closed_at
      t.integer :opening_amount_cents, null: false, default: 0
      t.integer :expected_cash_cents, null: false, default: 0
      t.integer :counted_cash_cents
      t.integer :difference_cents
      t.string :status, null: false, default: "open"
      t.text :closing_notes

      t.timestamps
    end

    add_index :cash_register_sessions, [ :business_id, :cash_register_id, :status ]
    add_index :cash_register_sessions, [ :cash_register_id ], unique: true, where: "status = 'open'", name: "index_open_cash_register_session"
  end
end
