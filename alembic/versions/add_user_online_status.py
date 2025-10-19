"""add_user_online_status

Revision ID: add_user_online_status
Revises: 27bc47dcce33
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_user_online_status'
down_revision: Union[str, Sequence[str], None] = '27bc47dcce33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add online status tracking to users table."""
    # Add online status columns to users table
    op.add_column('users', sa.Column('is_online', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add index for online status queries
    op.create_index('ix_users_online_status', 'users', ['is_online', 'last_seen_at'])


def downgrade() -> None:
    """Remove online status tracking from users table."""
    op.drop_index('ix_users_online_status', table_name='users')
    op.drop_column('users', 'last_seen_at')
    op.drop_column('users', 'is_online')
