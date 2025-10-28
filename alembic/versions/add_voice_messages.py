"""add_voice_messages

Revision ID: add_voice_messages
Revises: add_user_online_status
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_voice_messages'
down_revision: Union[str, Sequence[str], None] = 'add_user_online_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add voice message support to messages table."""
    # Create ENUM type first (PostgreSQL requires this)
    message_type_enum = sa.Enum('text', 'voice', 'image', name='messagetype')
    message_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Add message type and file path columns
    op.add_column('messages', sa.Column('message_type', message_type_enum, nullable=False, server_default='text'))
    op.add_column('messages', sa.Column('file_path', sa.String(length=500), nullable=True))
    op.add_column('messages', sa.Column('file_size', sa.Integer(), nullable=True))
    op.add_column('messages', sa.Column('duration_seconds', sa.Integer(), nullable=True))  # For voice messages
    
    # Add index for message type queries
    op.create_index('ix_messages_type', 'messages', ['message_type'])


def downgrade() -> None:
    """Remove voice message support from messages table."""
    op.drop_index('ix_messages_type', table_name='messages')
    op.drop_column('messages', 'duration_seconds')
    op.drop_column('messages', 'file_size')
    op.drop_column('messages', 'file_path')
    op.drop_column('messages', 'message_type')
    
    # Drop ENUM type
    message_type_enum = sa.Enum('text', 'voice', 'image', name='messagetype')
    message_type_enum.drop(op.get_bind(), checkfirst=True)
