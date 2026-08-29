"""add rollout percentage

Revision ID: 674cc0a7391e
Revises: 49015df65fc9
Create Date: 2026-08-28 12:43:03.899876

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '674cc0a7391e'
down_revision: Union[str, Sequence[str], None] = '49015df65fc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'flags',
        sa.Column(
            'rollout_percentage',
            sa.Integer(),
            nullable=False,
            server_default='100'
        )
    )


def downgrade() -> None:
    op.drop_column('flags', 'rollout_percentage')
