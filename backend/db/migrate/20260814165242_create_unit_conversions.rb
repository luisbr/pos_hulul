class CreateUnitConversions < ActiveRecord::Migration[8.0]
  def change
    create_table :unit_conversions, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :from_unit, null: false, foreign_key: { to_table: :units }, type: :uuid
      t.references :to_unit, null: false, foreign_key: { to_table: :units }, type: :uuid
      t.decimal :factor, null: false, precision: 14, scale: 4

      t.timestamps
    end

    add_index :unit_conversions, [ :business_id, :from_unit_id, :to_unit_id ], unique: true
  end
end
