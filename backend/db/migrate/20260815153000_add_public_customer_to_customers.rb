class AddPublicCustomerToCustomers < ActiveRecord::Migration[8.0]
  def change
    add_column :customers, :public_customer, :boolean, null: false, default: false
    add_index :customers, [ :business_id, :public_customer ]
  end
end
