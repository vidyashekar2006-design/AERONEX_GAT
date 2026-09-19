import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import MissionPhase, MissionRun


class MissionRepository:
    def __init__(self, session: AsyncSession): self.session = session

    async def create(self, mission: MissionRun) -> MissionRun:
        self.session.add(mission); await self.session.flush(); return mission

    async def add_phase(self, phase: MissionPhase) -> MissionPhase:
        self.session.add(phase); await self.session.flush(); return phase

    async def get_by_engine(self, engine_id: uuid.UUID, limit: int = 100) -> list[MissionRun]:
        result = await self.session.scalars(select(MissionRun).where(MissionRun.engine_id == engine_id).order_by(MissionRun.started_at.desc()).limit(limit))
        return list(result)
