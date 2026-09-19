from typing import Any

from pydantic import BaseModel


def unavailable_analysis() -> dict[str, Any]:
    return {
        "model_status": "NOT_AVAILABLE",
        "anomaly_detection": {"status": "NOT_AVAILABLE"},
        "fault_classification": {"fault": None, "confidence": None},
        "degradation_estimation": {"severity": None},
        "rul_estimation": {"value": None, "unit": "hours"},
        "predictive_maintenance": {"recommendation": None},
        "explainability": {"reason": None},
    }


def unavailable_reliability() -> dict[str, Any]:
    return {"status": "NOT_AVAILABLE", "score": None, "confidence": None, "reason": None}
