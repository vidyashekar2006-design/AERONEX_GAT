from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TelemetryRecord(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    sim_time: Mapped[float] = mapped_column(Float)
    rpm: Mapped[float] = mapped_column(Float)
    cht: Mapped[float] = mapped_column(Float)
    egt: Mapped[float] = mapped_column(Float)
    oil_temperature: Mapped[float] = mapped_column(Float)
    oil_pressure: Mapped[float] = mapped_column(Float)
    fuel_flow: Mapped[float] = mapped_column(Float)
    vibration: Mapped[float] = mapped_column(Float)
    throttle: Mapped[float] = mapped_column(Float)
    altitude: Mapped[float] = mapped_column(Float)
    ambient_temperature: Mapped[float] = mapped_column(Float)
    operating_mode: Mapped[str] = mapped_column(String(64))
    degradation_scenario: Mapped[str] = mapped_column(String(64))
    degradation_enabled: Mapped[bool] = mapped_column(Boolean)
    degradation_severity: Mapped[float] = mapped_column(Float)
