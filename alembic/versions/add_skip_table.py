"""add_skip_table

Revision ID: add_skip_table
Revises: add_voice_messages
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_skip_table'
down_revision: Union[str, Sequence[str], None] = 'add_campus_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('skips',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('skipper_id', sa.Integer(), nullable=False),
    sa.Column('skipped_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint('skipper_id <> skipped_id', name='ck_skip_not_self'),
    sa.ForeignKeyConstraint(['skipped_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['skipper_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('skipper_id', 'skipped_id', name='uq_skip_unique')
    )
    op.create_index(op.f('ix_skips_skipped_id'), 'skips', ['skipped_id'], unique=False)
    op.create_index(op.f('ix_skips_skipper_id'), 'skips', ['skipper_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_skips_skipper_id'), table_name='skips')
    op.drop_index(op.f('ix_skips_skipped_id'), table_name='skips')
    op.drop_table('skips')

