class AddOperationalDayAndForcedClosureToCashRegisterSessions < ActiveRecord::Migration[8.0]
  def change
    add_column :branches, :operational_day_start_minute, :integer, null: false, default: 0

    add_column :cash_register_sessions, :pending_close_at, :datetime
    add_column :cash_register_sessions, :forced_closed, :boolean, null: false, default: false
    add_column :cash_register_sessions, :force_close_reason, :text

    remove_index :cash_register_sessions, name: "index_open_cash_register_session"
    add_index :cash_register_sessions, [ :cash_register_id ],
      unique: true,
      where: "status IN ('open', 'pending_close')",
      name: "index_active_cash_register_session"
  end
end
