class CreateBranchAssignments < ActiveRecord::Migration[8.0]
  def change
    create_table :branch_assignments, id: :uuid do |t|
      t.references :membership, null: false, foreign_key: true, type: :uuid
      t.references :branch, null: false, foreign_key: true, type: :uuid
      t.string :role, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :branch_assignments, [ :membership_id, :branch_id ], unique: true
  end
end
