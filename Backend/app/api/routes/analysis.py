from fastapi import APIRouter

from app.schemas.contracts import unavailable_analysis

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/latest")
def analysis_latest():
    return unavailable_analysis()
