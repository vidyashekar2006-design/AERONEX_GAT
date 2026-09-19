from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pandas as pd

from app.models.telemetry import TelemetryRecord


# E:\Aeronex\Ml\aeronex_ml_ready
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ML_ROOT = PROJECT_ROOT / "Ml" / "aeronex_ml_ready"

if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from aeronex_ml.inference.predictor import AERONEXPredictor


_ENGINE_ID = "AERONEX_SIM_ENGINE_01"
_MISSION_ID = "LIVE_SIMULATION"

_predictor: AERONEXPredictor | None = None


def get_predictor() -> AERONEXPredictor:
    global _predictor

    if _predictor is None:
        artifact_dir = ML_ROOT / "artifacts"
        _predictor = AERONEXPredictor(str(artifact_dir))

    return _predictor


def _mission_phase(operating_mode: str) -> str:
    """
    Map the simulator operating mode to the ML model's
    training vocabulary.

    HIGH_LOAD represents the simulator's takeoff/high-load phase.
    IDLE is treated as a low-load cruise-like operating state
    because the current simulator contract does not expose
    mission phase separately.
    """
    mapping = {
        "IDLE": "cruise",
        "CRUISE": "cruise",
        "HIGH_LOAD": "takeoff",
    }

    return mapping.get(str(operating_mode), "cruise")


def telemetry_to_ml(record: TelemetryRecord) -> dict[str, Any]:
    """
    Convert the backend telemetry contract into the feature names
    expected by the trained AERONEX ML package.
    """

    throttle = float(record.throttle)

    return {
        "timestamp": record.timestamp.isoformat(),
        "engine_id": _ENGINE_ID,
        "mission_id": _MISSION_ID,
        "mission_phase": _mission_phase(record.operating_mode),

        "load_fraction": throttle,
        "ambient_temperature_c": float(record.ambient_temperature),

        "rpm": float(record.rpm),
        "oil_temperature_c": float(record.oil_temperature),

        # Simulator CHT is used as the ML model's coolant-temperature signal.
        "coolant_temperature_c": float(record.cht),

        "oil_pressure_bar": float(record.oil_pressure),

        # The simulator does not currently expose manifold pressure.
        # Use a bounded throttle-derived proxy for this prototype.
        "manifold_pressure_bar": 0.8 + (0.7 * throttle),

        # Simulator fuel flow is L/h.
        # The ML dataset uses kg/h; 0.74 kg/L is used as a
        # representative gasoline-density conversion.
        "fuel_flow_kg_h": float(record.fuel_flow) * 0.74,

        "vibration_rms": float(record.vibration),
        "exhaust_temperature_c": float(record.egt),
    }


def predict_from_records(
    records: list[TelemetryRecord],
    required_duration_hours: float | None = None,
) -> dict[str, Any]:
    """
    Run trained ML inference on the most recent telemetry window.
    """

    if not records:
        return {
            "model_status": "INSUFFICIENT_DATA",
            "reason": "No telemetry available",
        }

    # Keep the inference window bounded.
    window = records[-60:]

    telemetry_window = [
        telemetry_to_ml(record)
        for record in window
    ]

    predictor = get_predictor()

    return predictor.predict(
        telemetry_window,
        required_duration_hours=required_duration_hours,
    )


def records_to_dataframe(
    records: list[TelemetryRecord],
) -> pd.DataFrame:
    """
    Utility for debugging/testing the ML input contract.
    """

    return pd.DataFrame(
        [telemetry_to_ml(record) for record in records]
    )