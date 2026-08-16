class AddCustomerToSales < ActiveRecord::Migration[8.0]
  def change
    add_reference :sales, :customer, foreign_key: true, type: :uuid
    add_index :sales, [ :business_id, :customer_id, :created_at ]
  end
end
