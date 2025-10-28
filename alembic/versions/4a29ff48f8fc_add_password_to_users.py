"""add_password_to_users

Revision ID: 4a29ff48f8fc
Revises: 1e371a517fed
Create Date: 2025-10-28 09:52:15.412822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a29ff48f8fc'
down_revision: Union[str, Sequence[str], None] = '1e371a517fed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add hashed_password and privacy settings."""
    # パスワードハッシュフィールドを追加
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=False, server_default=''))
    
    # 既存のavatar_urlフィールドが存在しない場合のみ追加
    # (既存のマイグレーションで追加されている可能性があるため)
    try:
        op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))
    except:
        pass  # 既に存在する場合はスキップ
    
    # プライバシー設定フィールドを追加
    op.add_column('users', sa.Column('show_faculty', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_grade', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_birthday', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('show_age', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_gender', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_sexuality', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_looking_for', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_bio', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('show_tags', sa.Boolean(), nullable=False, server_default='1'))


def downgrade() -> None:
    """Downgrade schema - Remove hashed_password and privacy settings."""
    op.drop_column('users', 'show_tags')
    op.drop_column('users', 'show_bio')
    op.drop_column('users', 'show_looking_for')
    op.drop_column('users', 'show_sexuality')
    op.drop_column('users', 'show_gender')
    op.drop_column('users', 'show_age')
    op.drop_column('users', 'show_birthday')
    op.drop_column('users', 'show_grade')
    op.drop_column('users', 'show_faculty')
    try:
        op.drop_column('users', 'avatar_url')
    except:
        pass  # 他のマイグレーションで管理されている場合はスキップ
    op.drop_column('users', 'hashed_password')
