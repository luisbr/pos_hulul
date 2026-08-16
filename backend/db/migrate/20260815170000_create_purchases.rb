class CreatePurchases < ActiveRecord::Migration[8.0]
  def change
    create_table :purchases, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.references :supplier, null: false, foreign_key: true, type: :uuid
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.string :folio, null: false
      t.string :status, null: false, default: "received"
      t.datetime :purchased_at, null: false
      t.string :invoice_reference
      t.text :notes
      t.integer :total_cents, null: false, default: 0

      t.timestamps
    end

    add_index :purchases, [ :business_id, :folio ], unique: true
  end
end
