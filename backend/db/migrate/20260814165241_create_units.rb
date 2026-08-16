class CreateUnits < ActiveRecord::Migration[8.0]
  def change
    create_table :units, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :abbreviation, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :units, [ :business_id, :name ], unique: true
    add_index :units, [ :business_id, :abbreviation ], unique: true
  end
end
