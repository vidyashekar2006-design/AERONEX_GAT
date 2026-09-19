from datetime import datetime, timezone
from math import isfinite
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.core.enums import DegradationScenario, OperatingMode


class TelemetryInput(BaseModel):
    """Immutable canonical contract accepted from any telemetry producer."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    timestamp: datetime
    sim_time: float = Field(ge=0)
    rpm: float; cht: float; egt: float; oil_temperature: float; oil_pressure: float; fuel_flow: float; vibration: float
    throttle: float = Field(ge=0, le=1)
    altitude: float; ambient_temperature: float
    operating_mode: OperatingMode
    degradation_scenario: DegradationScenario = DegradationScenario.NORMAL
    degradation_enabled: bool = False
    degradation_severity: float = Field(default=0, ge=0, le=1)
    packet_id: str | None = Field(default=None, max_length=100)
    sequence_number: int | None = Field(default=None, ge=0)
    source: str = Field(min_length=1, max_length=50)

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_be_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must be timezone-aware UTC")
        return value.astimezone(timezone.utc)

    @field_validator("sim_time", "rpm", "cht", "egt", "oil_temperature", "oil_pressure", "fuel_flow", "vibration", "throttle", "altitude", "ambient_temperature", "degradation_severity")
    @classmethod
    def finite_number(cls, value: float) -> float:
        if not isfinite(value):
            raise ValueError("numeric telemetry values must be finite")
        return value

    @model_validator(mode="after")
    def degradation_is_consistent(self) -> "TelemetryInput":
        if not self.degradation_enabled and self.degradation_severity != 0:
            raise ValueError("degradation severity must be 0 when degradation is disabled")
        return self


class TelemetryEnvelope(BaseModel):
    """Backend-facing wrapper; identity context deliberately is not telemetry payload."""
    engine_id: UUID
    mission_run_id: UUID | None = None
    telemetry: TelemetryInput
