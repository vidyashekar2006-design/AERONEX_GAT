"""PostgreSQL-only validation. It never runs unless explicitly selected."""
from datetime import datetime, timedelta, timezone
import os
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from alembic import command
from alembic.config import Config
from app.models.entities import Engine, MissionRun
from app.repositories.engine import EngineRepository
from app.repositories.mission import MissionRepository
from app.repositories.telemetry import TelemetryRepository
from tests.test_telemetry import payload

URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.postgres

@pytest.fixture(scope="module")
def postgres_url():
    if not URL:
        pytest.skip("TEST_DATABASE_URL is not configured")
    return URL

@pytest.mark.asyncio
async def test_postgres_migration_and_integrity(postgres_url):
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", postgres_url)
    command.upgrade(config, "head")
    engine = create_async_engine(postgres_url, pool_pre_ping=True)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        engine_row = await EngineRepository(session).create(Engine(engine_identifier="PG-ENG-01"))
        mission = await MissionRepository(session).create(MissionRun(mission_identifier="PG-MIS-01", engine_id=engine_row.id, started_at=datetime.now(timezone.utc)))
        repo = TelemetryRepository(session)
        record = await repo.create(engine_row.id, payload(packet_id="pg-packet", sequence_number=1), mission.id)
        await session.commit()
        assert (await repo.get_latest(engine_row.id)).id == record.id
        assert len(await repo.get_history(engine_row.id, record.timestamp - timedelta(minutes=1), record.timestamp + timedelta(minutes=1))) == 1
        with pytest.raises(Exception):
            await repo.create(engine_row.id, payload(packet_id="pg-packet", sequence_number=2), mission.id)
        await session.rollback()
    await engine.dispose()
