from datetime import datetime
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import (AnalysisResult, DegradationState, DigitalTwinState, EngineFeature, EngineHealthState, HealthEvent, MissionReliability, ProcessedTelemetry, RULResult)


class RecordRepository:
    """Small generic persistence facade for derived data. Producers own their calculations."""
    def __init__(self, session: AsyncSession): self.session = session

    async def create(self, record):
        self.session.add(record); await self.session.flush(); return record

    async def features(self, engine_id: UUID, start: datetime, end: datetime) -> list[EngineFeature]:
        result = await self.session.scalars(select(EngineFeature).where(EngineFeature.engine_id == engine_id, EngineFeature.timestamp.between(start, end)).order_by(EngineFeature.timestamp))
        return list(result)

    async def analysis(self, engine_id: UUID, start: datetime, end: datetime) -> list[AnalysisResult]:
        result = await self.session.scalars(select(AnalysisResult).where(AnalysisResult.engine_id == engine_id, AnalysisResult.timestamp.between(start, end)).order_by(AnalysisResult.timestamp))
        return list(result)

    async def latest_state(self, model, engine_id: UUID):
        return await self.session.scalar(select(model).where(model.engine_id == engine_id).order_by(model.timestamp.desc()).limit(1))


# Stable aliases for API/ML integration while retaining a deliberately small implementation.
ProcessedTelemetryRepository = FeatureRepository = DigitalTwinRepository = HealthRepository = AlertRepository = DegradationRepository = AnalysisRepository = RULRepository = MissionReliabilityRepository = RecordRepository
