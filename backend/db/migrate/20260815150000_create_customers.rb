class CreateCustomers < ActiveRecord::Migration[8.0]
  def change
    create_table :customers, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.string :customer_type, null: false, default: "person"
      t.string :commercial_name, null: false
      t.string :legal_name
      t.string :rfc
      t.string :phone
      t.string :whatsapp
      t.string :email
      t.string :address
      t.string :contact_name
      t.integer :credit_limit_cents, null: false, default: 0
      t.integer :credit_days, null: false, default: 0
      t.string :credit_status, null: false, default: "clear"
      t.boolean :active, null: false, default: true
      t.text :notes

      t.timestamps
    end

    add_index :customers, [ :business_id, :commercial_name ]
    add_index :customers, [ :business_id, :rfc ]
    add_index :customers, [ :business_id, :email ]
  end
end
