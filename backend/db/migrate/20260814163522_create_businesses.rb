class CreateBusinesses < ActiveRecord::Migration[8.0]
  def change
    enable_extension "pgcrypto"

    create_table :businesses, id: :uuid do |t|
      t.string :commercial_name, null: false
      t.string :legal_name
      t.string :rfc
      t.string :primary_contact_name
      t.string :phone
      t.string :whatsapp
      t.string :email
      t.string :status, null: false, default: "active"
      t.string :license_status, null: false, default: "trial"
      t.datetime :trial_ends_at
      t.datetime :license_expires_at

      t.timestamps
    end

    add_index :businesses, :commercial_name
    add_index :businesses, :license_status
  end
end
