from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import Engine


class EngineRepository:
    def __init__(self, session: AsyncSession): self.session = session

    async def create(self, engine: Engine) -> Engine:
        self.session.add(engine); await self.session.flush(); return engine

    async def get(self, engine_id: UUID) -> Engine | None:
        return await self.session.get(Engine, engine_id)

    async def get_by_identifier(self, identifier: str) -> Engine | None:
        return await self.session.scalar(select(Engine).where(Engine.engine_identifier == identifier))
