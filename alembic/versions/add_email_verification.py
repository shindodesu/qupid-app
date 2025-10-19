"""add_email_verification_table

Revision ID: add_email_verification
Revises: add_user_online_status
Create Date: 2024-10-19 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_email_verification'
down_revision = 'add_user_online_status'
branch_labels = None
depends_on = None


def upgrade():
    # Create email_verifications table
    op.create_table(
        'email_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('verification_code', sa.String(length=6), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on email
    op.create_index(op.f('ix_email_verifications_email'), 'email_verifications', ['email'], unique=False)


def downgrade():
    # Drop index
    op.drop_index(op.f('ix_email_verifications_email'), table_name='email_verifications')
    
    # Drop table
    op.drop_table('email_verifications')
