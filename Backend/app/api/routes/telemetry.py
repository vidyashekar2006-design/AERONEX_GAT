from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db import get_db
from app.models.telemetry import TelemetryRecord
from app.schemas.telemetry import TelemetryIn
from app.services.state import latest_telemetry, serialize_telemetry, store_telemetry, unified_snapshot
from app.services.websocket import manager
from app.services.ml_service import predict_from_records

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest(packet: TelemetryIn, db: Session = Depends(get_db)):
    record = store_telemetry(db, packet)
    print(
    f"📡 BROADCAST RECORD | "
    f"id={record.id} | "
    f"RPM={record.rpm} | "
    f"CHT={record.cht} | "
    f"EGT={record.egt}"
)

    # Fetch a bounded telemetry window for ML inference.
    statement = (
        select(TelemetryRecord)
        .order_by(desc(TelemetryRecord.timestamp))
        .limit(60)
    )

    records = list(db.scalars(statement))
    records.reverse()

    analysis = predict_from_records(records)

    await manager.broadcast(
        unified_snapshot(
            db,
            record,
            analysis=analysis,
        )
    )

    return {
        "status": "accepted",
        "id": record.id,
        "timestamp": record.timestamp,
        "ml_status": analysis.get(
            "data_quality",
            {}
        ).get("status", "UNKNOWN"),
    }


@router.get("/latest")
def latest(db: Session = Depends(get_db)):
    record = latest_telemetry(db)
    return serialize_telemetry(record) if record else None


@router.get("/history")
def history(
    limit: int = Query(default=300, ge=1),
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db),
):
    safe_limit = min(limit, get_settings().telemetry_history_max_limit)
    statement = select(TelemetryRecord)
    if start_time:
        statement = statement.where(TelemetryRecord.timestamp >= start_time)
    if end_time:
        statement = statement.where(TelemetryRecord.timestamp <= end_time)
    records = list(db.scalars(statement.order_by(desc(TelemetryRecord.timestamp)).limit(safe_limit)))
    records.reverse()
    return {"items": [serialize_telemetry(item) for item in records], "limit": safe_limit}
