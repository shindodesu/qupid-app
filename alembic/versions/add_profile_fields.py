"""Add profile fields for initial profile setup

Revision ID: add_profile_fields
Revises: add_voice_messages
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_profile_fields'
down_revision = 'add_voice_messages'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new profile fields
    op.add_column('users', sa.Column('birthday', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('gender', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('sexuality', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('looking_for', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('profile_completed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove profile fields
    op.drop_column('users', 'profile_completed')
    op.drop_column('users', 'looking_for')
    op.drop_column('users', 'sexuality')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'birthday')
