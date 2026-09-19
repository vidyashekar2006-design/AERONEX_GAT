"""Initial AERONEX schema baseline."""
from alembic import op
from app.db.base import Base
import app.models.entities  # noqa: F401

revision = "20260912_0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Executed only by Alembic; applications do not create production tables.
    Base.metadata.create_all(bind=op.get_bind())

def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
