"""add_campus_to_users

Revision ID: add_campus_to_users
Revises: add_voice_messages
Create Date: 2024-01-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_campus_to_users'
down_revision: Union[str, Sequence[str], None] = '4a29ff48f8fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add campus column to users table."""
    op.add_column('users', sa.Column('campus', sa.String(100), nullable=True))


def downgrade() -> None:
    """Remove campus column from users table."""
    op.drop_column('users', 'campus')

