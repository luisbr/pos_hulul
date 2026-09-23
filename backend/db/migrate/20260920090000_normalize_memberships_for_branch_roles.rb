class NormalizeMembershipsForBranchRoles < ActiveRecord::Migration[8.0]
  def up
    execute <<~SQL
      INSERT INTO branch_assignments (id, membership_id, branch_id, role, active, created_at, updated_at)
      SELECT gen_random_uuid(), memberships.id, branches.id, memberships.role, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM memberships
      INNER JOIN branches ON branches.business_id = memberships.business_id
      WHERE memberships.role IN ('manager', 'cashier', 'warehouse')
        AND NOT EXISTS (
          SELECT 1 FROM branch_assignments
          WHERE branch_assignments.membership_id = memberships.id
        )
    SQL

    execute <<~SQL
      UPDATE memberships
      SET role = 'member', updated_at = CURRENT_TIMESTAMP
      WHERE role IN ('manager', 'cashier', 'warehouse')
    SQL
  end

  def down
    execute <<~SQL
      UPDATE memberships
      SET role = COALESCE(
        (
          SELECT branch_assignments.role
          FROM branch_assignments
          WHERE branch_assignments.membership_id = memberships.id
          ORDER BY branch_assignments.created_at
          LIMIT 1
        ),
        'cashier'
      ), updated_at = CURRENT_TIMESTAMP
      WHERE role = 'member'
    SQL
  end
end
