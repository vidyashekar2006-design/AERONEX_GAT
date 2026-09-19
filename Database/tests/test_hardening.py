from datetime import datetime, timezone
from uuid import uuid4
import pytest
from sqlalchemy.exc import IntegrityError
from app.core.enums import HealthStatus
from app.models.entities import Engine, EngineHealthState, MissionPhase, MissionRun, RULResult
from app.repositories.telemetry import TelemetryRepository
from tests.test_telemetry import payload

@pytest.mark.asyncio
async def test_engine_mission_mismatch_is_database_rejected(session):
    first = Engine(engine_identifier="ENG-A")
    second = Engine(engine_identifier="ENG-B")
    session.add_all([first, second]); await session.flush()
    mission = MissionRun(mission_identifier="MIS-A", engine_id=first.id, started_at=datetime.now(timezone.utc))
    session.add(mission); await session.flush()
    with pytest.raises(IntegrityError):
        await TelemetryRepository(session).create(second.id, payload(packet_id="mismatch"), mission.id)

@pytest.mark.asyncio
async def test_database_constraints_and_nullable_identity_semantics(session):
    engine = Engine(engine_identifier="ENG-C"); session.add(engine); await session.flush()
    repository = TelemetryRepository(session)
    await repository.create(engine.id, payload(packet_id=None, sequence_number=None))
    await repository.create(engine.id, payload(packet_id=None, sequence_number=None, sim_time=2))
    with pytest.raises(IntegrityError):
        session.add(MissionPhase(mission_run_id=uuid4(), phase_name="BAD", phase_index=-1, started_at=datetime.now(timezone.utc)))
        await session.flush()

@pytest.mark.asyncio
async def test_confidence_and_rul_checks(session):
    engine = Engine(engine_identifier="ENG-D"); session.add(engine); await session.flush()
    session.add(EngineHealthState(engine_id=engine.id, timestamp=datetime.now(timezone.utc), source="TEST", status=HealthStatus.NORMAL, confidence=1.1))
    with pytest.raises(IntegrityError): await session.flush()
    await session.rollback()
    session.add(RULResult(engine_id=engine.id, timestamp=datetime.now(timezone.utc), source="TEST", value=-1))
    with pytest.raises(IntegrityError): await session.flush()
