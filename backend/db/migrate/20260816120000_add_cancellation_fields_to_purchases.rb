class AddCancellationFieldsToPurchases < ActiveRecord::Migration[8.0]
  def change
    add_column :purchases, :cancelled_at, :datetime
    add_column :purchases, :cancellation_reason, :text
    add_reference :purchases, :cancelled_by, type: :uuid, foreign_key: { to_table: :users }
  end
end
