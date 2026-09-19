from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.contracts import unavailable_analysis
from app.services.state import digital_twin_snapshot, latest_telemetry, health_snapshot, mission_snapshot

router = APIRouter(tags=["system"])


@router.get("/health")
def service_health():
    return {"status": "ok", "service": "aeronex-backend"}


@router.get("/api/status")
def status(db: Session = Depends(get_db)):
    latest = latest_telemetry(db)
    return {
        "backend": {"status": "online"},
        "telemetry": {"connected": latest is not None, "last_update": latest.timestamp if latest else None, "frequency": 0.5},
        "engine": digital_twin_snapshot(db)["engine"],
        "health": health_snapshot(db, latest.timestamp if latest else None),
        "mission": mission_snapshot(db),
        "degradation": digital_twin_snapshot(db)["degradation"],
        "analysis": unavailable_analysis(),
    }
