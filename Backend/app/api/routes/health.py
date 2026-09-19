from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.state import latest_telemetry, health_snapshot

router = APIRouter(prefix="/api/health", tags=["engine health"])


@router.get("")
def health(db: Session = Depends(get_db)):
    latest = latest_telemetry(db)
    return health_snapshot(db, latest.timestamp if latest else None)
