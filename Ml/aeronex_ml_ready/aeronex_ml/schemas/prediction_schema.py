from typing import Any, Optional
from pydantic import BaseModel, Field

class MissionInput(BaseModel):
    required_duration_hours: Optional[float] = Field(default=None, gt=0)

class PredictionResult(BaseModel):
    timestamp: str
    data_quality: dict[str, Any]
    engine_health: dict[str, Any]
    anomaly: dict[str, Any]
    fault: dict[str, Any]
    degradation: dict[str, Any]
    rul: dict[str, Any]
    maintenance: dict[str, Any]
    mission: dict[str, Any]
    explanations: list[str]
    model_metadata: dict[str, Any]
