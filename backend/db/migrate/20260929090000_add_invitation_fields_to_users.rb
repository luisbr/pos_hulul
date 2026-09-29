class AddInvitationFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :invitation_token_digest, :string
    add_column :users, :invitation_expires_at, :datetime
    add_index :users, :invitation_token_digest, unique: true
  end
end
