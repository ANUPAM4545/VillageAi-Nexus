"""Add Attendance model

Revision ID: d1234567890b
Revises: c1234567890a
Create Date: 2026-08-10 11:38:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd1234567890b'
down_revision = 'c1234567890a'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Attendance table
    op.create_table('attendance',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('attendance_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('marked_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['marked_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'attendance_date', name='uq_student_attendance_date')
    )
    op.create_index('ix_attendance_school_id', 'attendance', ['school_id'], unique=False)
    op.create_index('ix_attendance_student_id', 'attendance', ['student_id'], unique=False)
    op.create_index('ix_attendance_date', 'attendance', ['attendance_date'], unique=False)
    op.create_index('ix_attendance_status', 'attendance', ['status'], unique=False)
    op.create_index('ix_attendance_marked_by', 'attendance', ['marked_by'], unique=False)
    op.create_index('ix_attendance_school_date', 'attendance', ['school_id', 'attendance_date'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_attendance_school_date', table_name='attendance')
    op.drop_index('ix_attendance_marked_by', table_name='attendance')
    op.drop_index('ix_attendance_status', table_name='attendance')
    op.drop_index('ix_attendance_date', table_name='attendance')
    op.drop_index('ix_attendance_student_id', table_name='attendance')
    op.drop_index('ix_attendance_school_id', table_name='attendance')
    op.drop_table('attendance')
