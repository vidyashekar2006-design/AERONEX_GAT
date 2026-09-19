# AERONEX database foundation

PostgreSQL-first, engine-centric persistence for SIH26054. It stores raw aero piston engine telemetry, mission context, processed data, features, digital-twin state, health/event/degradation records, ML outputs, RUL, mission reliability, versions, and report metadata. It deliberately excludes UI, API routes, engine physics, simulator implementation, and ML algorithms.

## Setup

Install Python 3.11+ and PostgreSQL 16+, create the database, then create a virtual environment:

```powershell
psql -U postgres -c "CREATE DATABASE aeronex;"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
pytest
```

Set `DATABASE_URL` in `.env`; never commit it. For isolated development/testing, set `USE_SQLITE=true`. SQLite is a fallback only; PostgreSQL is authoritative. Alembic owns production schema creation.

## Schema, integrity, and indexes

`engines` is the primary entity. An engine has many `mission_runs`; a run has ordered `mission_phases`. Append-only `telemetry` has engine/timestamp, mission/timestamp, and engine/sim-time indexes for bounded historical queries. Packet/sequence uniqueness prevents duplicate persistence. `processed_telemetry` references its raw input; `engine_features` stores feature and processing versions.

Digital-twin, health, degradation, event, analysis, RUL, and mission-reliability records are independent tables. Unavailable estimates are `NULL` and `NOT_AVAILABLE`, never fabricated values. Dataset/model versions and report metadata enable reproducibility. See [ER diagram](docs/er_diagram.md) and [telemetry contract](docs/telemetry_contract.md).

## Integration

The backend calls `TelemetryIngestionService` and repositories from its own dependency boundary; this project has no FastAPI routes. The repository layer provides engine/mission writes, bounded raw telemetry latest/history reads, feature and analysis reads, and derived-record persistence. The Pydantic contract validates input before a write.

`TemporaryTelemetryGenerator` is an isolated deterministic development fixture. Call it at 2 Hz to generate clearly labelled `SAMPLE_GENERATOR` packets. The real simulator replaces it by sending the same contract with `AERONEX_SIMULATOR`; tables, migrations, and repositories remain unchanged.

## Data lineage and operations

Derived records preserve engine, mission, timestamp, source, processing/feature/model version and/or input window. There is no automatic raw-data deletion. Use bounded `get_history(..., limit=...)` queries. For future changes, run `alembic revision --autogenerate -m "description"`, review the revision, and migrate with `alembic upgrade head`. Use a least-privilege PostgreSQL account in production.

## Troubleshooting

`ModuleNotFoundError` means dependencies are not installed. `connection refused` means PostgreSQL is not running or `DATABASE_URL` is wrong. Validate migrations on PostgreSQL before release; SQLite tests are not a replacement for that check.
