from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.enums import DataQuality
from app.core.exceptions import DuplicateTelemetryError
from app.models.entities import Telemetry
from app.schemas.telemetry import TelemetryInput


class TelemetryRepository:
    """Raw telemetry access; never transforms or overwrites the source record."""
    def __init__(self, session: AsyncSession): self.session = session

    async def create(self, engine_id: UUID, payload: TelemetryInput, mission_run_id: UUID | None = None) -> Telemetry:
        record = Telemetry(engine_id=engine_id, mission_run_id=mission_run_id, received_at=datetime.now(timezone.utc), quality=DataQuality.VALID, **payload.model_dump())
        try:
            async with self.session.begin_nested():
                self.session.add(record)
                await self.session.flush()
        except IntegrityError as exc:
            raise DuplicateTelemetryError("duplicate packet_id or sequence_number") from exc
        return record

    async def get_latest(self, engine_id: UUID, mission_run_id: UUID | None = None) -> Telemetry | None:
        query = select(Telemetry).where(Telemetry.engine_id == engine_id)
        if mission_run_id is not None: query = query.where(Telemetry.mission_run_id == mission_run_id)
        return await self.session.scalar(query.order_by(desc(Telemetry.timestamp), desc(Telemetry.sequence_number)).limit(1))

    async def get_history(self, engine_id: UUID, start: datetime, end: datetime, mission_run_id: UUID | None = None, limit: int = 10_000) -> list[Telemetry]:
        query = select(Telemetry).where(Telemetry.engine_id == engine_id, Telemetry.timestamp >= start, Telemetry.timestamp <= end)
        if mission_run_id is not None: query = query.where(Telemetry.mission_run_id == mission_run_id)
        result = await self.session.scalars(query.order_by(Telemetry.timestamp).limit(limit))
        return list(result)
