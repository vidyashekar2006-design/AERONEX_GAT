from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.state import digital_twin_snapshot

router = APIRouter(prefix="/api/digital-twin", tags=["digital twin"])


@router.get("")
def digital_twin(db: Session = Depends(get_db)):
    return digital_twin_snapshot(db)
