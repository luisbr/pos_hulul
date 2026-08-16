class CreateCashRegisters < ActiveRecord::Migration[8.0]
  def change
    create_table :cash_registers, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :code, null: false
      t.boolean :active, null: false, default: true
      t.integer :current_folio_number, null: false, default: 1
      t.string :printer_name
      t.string :ticket_size, null: false, default: "80mm"

      t.timestamps
    end

    add_index :cash_registers, [ :business_id, :branch_id, :code ], unique: true
  end
end
