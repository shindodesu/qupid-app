"""add show_campus to users (privacy)

Revision ID: add_show_campus
Revises: add_skip_table
Create Date: 2025-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_show_campus'
down_revision: Union[str, Sequence[str], None] = 'add_skip_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('show_campus', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('users', 'show_campus')
