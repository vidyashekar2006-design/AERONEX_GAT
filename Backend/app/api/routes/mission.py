from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.state import mission_snapshot

router = APIRouter(prefix="/api/mission", tags=["mission"])


@router.get("")
def mission(db: Session = Depends(get_db)):
    return mission_snapshot(db)
