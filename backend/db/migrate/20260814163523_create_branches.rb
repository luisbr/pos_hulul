class CreateBranches < ActiveRecord::Migration[8.0]
  def change
    create_table :branches, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :code, null: false
      t.text :address
      t.string :timezone, null: false, default: "America/Mexico_City"
      t.string :currency, null: false, default: "MXN"
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :branches, [ :business_id, :code ], unique: true
  end
end
