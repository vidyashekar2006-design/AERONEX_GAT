from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class OperatingMode(str, Enum):
    IDLE = "IDLE"
    CRUISE = "CRUISE"
    HIGH_LOAD = "HIGH_LOAD"


class DegradationScenario(str, Enum):
    NORMAL = "NORMAL"
    COOLING_DEGRADATION = "COOLING_DEGRADATION"
    LUBRICATION_DEGRADATION = "LUBRICATION_DEGRADATION"
    VIBRATION_INCREASE = "VIBRATION_INCREASE"
    SENSOR_DRIFT = "SENSOR_DRIFT"


class TelemetryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    timestamp: datetime
    sim_time: float = Field(ge=0)
    rpm: float = Field(ge=0, le=20000)
    cht: float = Field(ge=-100, le=1000)
    egt: float = Field(ge=-100, le=2000)
    oil_temperature: float = Field(ge=-100, le=500)
    oil_pressure: float = Field(ge=0, le=100)
    fuel_flow: float = Field(ge=0, le=1000)
    vibration: float = Field(ge=0, le=1000)
    throttle: float = Field(ge=0, le=1)
    altitude: float = Field(ge=-1000, le=100000)
    ambient_temperature: float = Field(ge=-100, le=100)
    operating_mode: OperatingMode
    degradation_scenario: DegradationScenario
    degradation_enabled: bool
    degradation_severity: float = Field(ge=0, le=1)

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_be_timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("timestamp must include a timezone, for example Z")
        return value

    @field_validator("degradation_severity")
    @classmethod
    def normal_scenario_has_no_severity(cls, value: float, info):
        scenario = info.data.get("degradation_scenario")
        if scenario == DegradationScenario.NORMAL and value != 0:
            raise ValueError("NORMAL degradation scenario requires severity 0")
        return value

    @model_validator(mode="after")
    def degradation_flags_are_consistent(self):
        if self.degradation_scenario == DegradationScenario.NORMAL and self.degradation_enabled:
            raise ValueError("NORMAL degradation scenario cannot be enabled")
        if not self.degradation_enabled and self.degradation_severity != 0:
            raise ValueError("disabled degradation requires severity 0")
        return self


class TelemetryOut(TelemetryIn):
    id: int | None = None
