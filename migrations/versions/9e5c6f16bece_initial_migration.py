"""Initial migration

Revision ID: 9e5c6f16bece
Revises: 
Create Date: 2025-03-05 21:25:34.939207

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9e5c6f16bece'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('word_bank', schema=None) as batch_op:
        batch_op.alter_column('id',
               existing_type=sa.BIGINT(),
               type_=sa.Integer(),
               existing_nullable=False,
               autoincrement=True)
        batch_op.alter_column('word',
               existing_type=sa.TEXT(),
               type_=sa.String(length=50),
               nullable=False)

    with op.batch_alter_table('word_today', schema=None) as batch_op:
        batch_op.alter_column('id',
               existing_type=sa.BIGINT(),
               type_=sa.Integer(),
               existing_nullable=False,
               autoincrement=True)
        batch_op.alter_column('word',
               existing_type=sa.TEXT(),
               type_=sa.String(length=50),
               nullable=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('word_today', schema=None) as batch_op:
        batch_op.alter_column('word',
               existing_type=sa.String(length=50),
               type_=sa.TEXT(),
               nullable=True)
        batch_op.alter_column('id',
               existing_type=sa.Integer(),
               type_=sa.BIGINT(),
               existing_nullable=False,
               autoincrement=True)

    with op.batch_alter_table('word_bank', schema=None) as batch_op:
        batch_op.alter_column('word',
               existing_type=sa.String(length=50),
               type_=sa.TEXT(),
               nullable=True)
        batch_op.alter_column('id',
               existing_type=sa.Integer(),
               type_=sa.BIGINT(),
               existing_nullable=False,
               autoincrement=True)

    # ### end Alembic commands ###
