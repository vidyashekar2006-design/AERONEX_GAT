from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.alerts import HealthEvent
from app.services.state import serialize_alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def alerts(limit: int = Query(default=100, ge=1, le=500), db: Session = Depends(get_db)):
    events = list(db.scalars(select(HealthEvent).order_by(desc(HealthEvent.timestamp)).limit(limit)))
    return {"items": [serialize_alert(event) for event in events]}
