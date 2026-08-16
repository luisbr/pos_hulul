class AddCancellationFieldsToSales < ActiveRecord::Migration[8.0]
  def change
    change_table :sales, bulk: true do |t|
      t.datetime :cancelled_at
      t.references :cancelled_by, foreign_key: { to_table: :users }, type: :uuid
      t.text :cancellation_reason
    end

    add_index :sales, [ :business_id, :status, :created_at ]
  end
end
