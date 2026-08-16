class CreateSuppliers < ActiveRecord::Migration[8.0]
  def change
    create_table :suppliers, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.string :commercial_name, null: false
      t.string :legal_name
      t.string :rfc
      t.string :phone
      t.string :whatsapp
      t.string :email
      t.string :contact_name
      t.string :address
      t.string :delivery_days
      t.string :payment_terms
      t.boolean :active, null: false, default: true
      t.text :notes

      t.timestamps
    end

    add_index :suppliers, [ :business_id, :commercial_name ]
    add_index :suppliers, [ :business_id, :rfc ]
    add_index :suppliers, [ :business_id, :email ]
  end
end
