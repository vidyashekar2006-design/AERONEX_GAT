from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.telemetry import TelemetryRepository
from app.schemas.telemetry import TelemetryInput


class TelemetryIngestionService:
    """Transaction boundary the future backend calls after request parsing."""
    def __init__(self, session: AsyncSession): self.session = session

    async def ingest(self, engine_id: UUID, payload: TelemetryInput, mission_run_id: UUID | None = None):
        record = await TelemetryRepository(self.session).create(engine_id, payload, mission_run_id)
        await self.session.commit()
        return record
