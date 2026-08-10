"""Add Teacher and Class models

Revision ID: c1234567890a
Revises: b7928fc9a4ac
Create Date: 2026-08-10 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c1234567890a'
down_revision = 'b7928fc9a4ac'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Teachers table
    op.create_table('teachers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('teacher_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('school_id', 'teacher_id', name='uq_school_teacher_id'),
        sa.UniqueConstraint('user_id', name='uq_teacher_user_id')
    )
    op.create_index('ix_teacher_school_id', 'teachers', ['school_id'], unique=False)
    op.create_index('ix_teacher_teacher_id', 'teachers', ['teacher_id'], unique=False)
    op.create_index('ix_teacher_user_id', 'teachers', ['user_id'], unique=False)
    op.create_index('ix_teacher_email', 'teachers', ['email'], unique=False)
    op.create_index('ix_teacher_status', 'teachers', ['status'], unique=False)

    # Classes table
    op.create_table('classes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('grade', sa.String(), nullable=False),
        sa.Column('section', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('teacher_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('school_id', 'grade', 'section', name='uq_school_grade_section')
    )
    op.create_index('ix_class_school_id', 'classes', ['school_id'], unique=False)
    op.create_index('ix_class_grade', 'classes', ['grade'], unique=False)
    op.create_index('ix_class_section', 'classes', ['section'], unique=False)
    op.create_index('ix_class_teacher_id', 'classes', ['teacher_id'], unique=False)
    op.create_index('ix_class_status', 'classes', ['status'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_class_status', table_name='classes')
    op.drop_index('ix_class_teacher_id', table_name='classes')
    op.drop_index('ix_class_section', table_name='classes')
    op.drop_index('ix_class_grade', table_name='classes')
    op.drop_index('ix_class_school_id', table_name='classes')
    op.drop_table('classes')

    op.drop_index('ix_teacher_status', table_name='teachers')
    op.drop_index('ix_teacher_email', table_name='teachers')
    op.drop_index('ix_teacher_user_id', table_name='teachers')
    op.drop_index('ix_teacher_teacher_id', table_name='teachers')
    op.drop_index('ix_teacher_school_id', table_name='teachers')
    op.drop_table('teachers')
