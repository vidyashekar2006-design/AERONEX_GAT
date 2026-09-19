from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.state import latest_telemetry

router = APIRouter(prefix="/api/degradation", tags=["degradation"])


@router.get("")
def degradation(db: Session = Depends(get_db)):
    latest = latest_telemetry(db)
    if not latest:
        return {"scenario": None, "enabled": False, "severity": None}
    return {"scenario": latest.degradation_scenario, "enabled": latest.degradation_enabled,
            "severity": latest.degradation_severity}
