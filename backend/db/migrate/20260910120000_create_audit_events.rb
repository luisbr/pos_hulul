class CreateAuditEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :audit_events, id: :uuid do |t|
      t.references :business, null: false, foreign_key: true, type: :uuid
      t.references :actor, foreign_key: { to_table: :users }, type: :uuid
      t.string :event_type, null: false
      t.string :auditable_type, null: false
      t.uuid :auditable_id, null: false
      t.jsonb :metadata, null: false, default: {}
      t.string :ip_address
      t.string :user_agent

      t.timestamps
    end

    add_index :audit_events, [ :business_id, :created_at ]
    add_index :audit_events, [ :business_id, :event_type ]
    add_index :audit_events, [ :auditable_type, :auditable_id ]
  end
end
