from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pandas as pd

from app.models.telemetry import TelemetryRecord


# ---------------------------------------------------------------------------
# ML package location
# ---------------------------------------------------------------------------

# E:\Aeronex\Ml\aeronex_ml_ready
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ML_ROOT = PROJECT_ROOT / "Ml" / "aeronex_ml_ready"

if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))


from aeronex_ml.inference.predictor import AERONEXPredictor


# ---------------------------------------------------------------------------
# Aeronex identifiers
# ---------------------------------------------------------------------------

_ENGINE_ID = "AERONEX_SIM_ENGINE_01"
_MISSION_ID = "LIVE_SIMULATION"


_predictor: AERONEXPredictor | None = None


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------

def get_predictor() -> AERONEXPredictor:
    """
    Lazily load the Aeronex ML v2 predictor.

    Models are loaded only when the first telemetry prediction is requested.
    """

    global _predictor

    if _predictor is None:
        artifact_dir = ML_ROOT / "artifacts"
        _predictor = AERONEXPredictor(str(artifact_dir))

    return _predictor


# ---------------------------------------------------------------------------
# Telemetry conversion
# ---------------------------------------------------------------------------

def telemetry_to_ml(
    record: TelemetryRecord,
) -> dict[str, Any]:
    """
    Convert the Aeronex backend telemetry contract into the exact
    feature contract used by Aeronex ML v2.

    ML v2 features:

        rpm
        cht
        egt
        oil_temperature
        oil_pressure
        fuel_flow
        vibration
        throttle
        altitude
        ambient_temperature

    No feature engineering or unit conversion is performed here because
    the simulator-derived ML v2 dataset uses the same telemetry semantics.
    """

    return {
        "timestamp": record.timestamp.isoformat(),

        # Useful metadata retained for debugging / traceability.
        "engine_id": _ENGINE_ID,
        "mission_id": _MISSION_ID,

        # ---------------------------------------------------------------
        # Exact ML v2 feature contract
        # ---------------------------------------------------------------

        "rpm": float(record.rpm),
        "cht": float(record.cht),
        "egt": float(record.egt),

        "oil_temperature": float(
            record.oil_temperature
        ),

        "oil_pressure": float(
            record.oil_pressure
        ),

        "fuel_flow": float(
            record.fuel_flow
        ),

        "vibration": float(
            record.vibration
        ),

        "throttle": float(
            record.throttle
        ),

        "altitude": float(
            record.altitude
        ),

        "ambient_temperature": float(
            record.ambient_temperature
        ),
    }


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

def predict_from_records(
    records: list[TelemetryRecord],
    required_duration_hours: float | None = None,
) -> dict[str, Any]:
    """
    Run Aeronex ML v2 inference on the most recent telemetry window.
    """

    if not records:
        return {
            "model_status": "INSUFFICIENT_DATA",
            "reason": "No telemetry available",
        }

    # Keep inference bounded.
    # The current dashboard uses the most recent 60 samples.
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


# ---------------------------------------------------------------------------
# DataFrame utility
# ---------------------------------------------------------------------------

def records_to_dataframe(
    records: list[TelemetryRecord],
) -> pd.DataFrame:
    """
    Convert backend telemetry records into the ML v2 feature DataFrame.

    This is primarily useful for debugging, testing and inspection.
    """

    return pd.DataFrame(
        [
            telemetry_to_ml(record)
            for record in records
        ]
    )