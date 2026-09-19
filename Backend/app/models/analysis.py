from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class AnalysisResult(Base):
    """Reserved persisted contract for outputs supplied by a future AI/ML service."""

    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    model_status: Mapped[str] = mapped_column(String(32), default="NOT_AVAILABLE")
    payload: Mapped[dict] = mapped_column(JSON)
