"""merge age verification and show campus heads

Revision ID: 4bb0e825622d
Revises: 2e5a9f8c4b3d, add_show_campus
Create Date: 2026-05-05 22:40:42.793975

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4bb0e825622d'
down_revision: Union[str, Sequence[str], None] = ('2e5a9f8c4b3d', 'add_show_campus')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
