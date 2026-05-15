"""add_age_verification_and_student_id_table

Revision ID: 2e5a9f8c4b3d
Revises: 1e371a517fed
Create Date: 2026-05-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2e5a9f8c4b3d'
down_revision = '1e371a517fed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add age_verified columns to users table
    op.add_column('users', sa.Column('age_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('age_verified_at', sa.DateTime(timezone=True), nullable=True))

    # Create student_id_verifications table
    op.create_table(
        'student_id_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('rejection_reason', sa.String(500), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_student_id_user_status', 'student_id_verifications', ['user_id', 'status'])
    op.create_index('ix_student_id_email_status', 'student_id_verifications', ['email', 'status'])
    op.create_index('ix_student_id_verifications_status', 'student_id_verifications', ['status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_student_id_verifications_status', table_name='student_id_verifications')
    op.drop_index('ix_student_id_email_status', table_name='student_id_verifications')
    op.drop_index('ix_student_id_user_status', table_name='student_id_verifications')
    
    # Drop table
    op.drop_table('student_id_verifications')
    
    # Drop columns
    op.drop_column('users', 'age_verified_at')
    op.drop_column('users', 'age_verified')
