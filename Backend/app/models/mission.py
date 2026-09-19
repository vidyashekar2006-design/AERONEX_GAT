from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class MissionState(Base):
    __tablename__ = "mission_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    mission_name: Mapped[str] = mapped_column(String(200), default="MALE UAV Engine Reliability Mission")
    phase: Mapped[str] = mapped_column(String(64))
    elapsed_time: Mapped[float] = mapped_column(Float)
    altitude: Mapped[float] = mapped_column(Float)
    throttle: Mapped[float] = mapped_column(Float)
