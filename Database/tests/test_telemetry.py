from datetime import datetime, timedelta, timezone
import pytest
from app.core.enums import OperatingMode
from app.core.exceptions import DuplicateTelemetryError
from app.models.entities import Engine, MissionRun
from app.repositories.engine import EngineRepository
from app.repositories.mission import MissionRepository
from app.repositories.telemetry import TelemetryRepository
from app.schemas.telemetry import TelemetryInput

def payload(**changes):
    data = dict(timestamp=datetime.now(timezone.utc), sim_time=1.0, rpm=3200, cht=145.2, egt=680.5, oil_temperature=92.3, oil_pressure=3.4, fuel_flow=4.8, vibration=.18, throttle=.55, altitude=3000, ambient_temperature=12, operating_mode=OperatingMode.CRUISE, packet_id="packet-1", sequence_number=1, source="SAMPLE_GENERATOR")
    data.update(changes); return TelemetryInput(**data)

@pytest.mark.asyncio
async def test_persist_and_query_raw_telemetry(session):
    engine = await EngineRepository(session).create(Engine(engine_identifier="ENG-01"))
    mission = await MissionRepository(session).create(MissionRun(mission_identifier="MIS-01", engine_id=engine.id, started_at=datetime.now(timezone.utc)))
    repository = TelemetryRepository(session)
    stored = await repository.create(engine.id, payload(), mission.id)
    await session.commit()
    assert (await repository.get_latest(engine.id)).id == stored.id
    history = await repository.get_history(engine.id, datetime.now(timezone.utc)-timedelta(minutes=1), datetime.now(timezone.utc)+timedelta(minutes=1), mission.id)
    assert [item.id for item in history] == [stored.id]

@pytest.mark.asyncio
async def test_duplicate_packet_is_rejected(session):
    engine = await EngineRepository(session).create(Engine(engine_identifier="ENG-02"))
    repository = TelemetryRepository(session)
    await repository.create(engine.id, payload())
    with pytest.raises(DuplicateTelemetryError): await repository.create(engine.id, payload())

def test_invalid_raw_values_are_not_repaired():
    with pytest.raises(ValueError): payload(throttle=1.2)
    with pytest.raises(ValueError): payload(rpm=float("nan"))
    with pytest.raises(ValueError): payload(timestamp=datetime.now())
