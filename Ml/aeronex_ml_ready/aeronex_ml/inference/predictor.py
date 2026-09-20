from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


# ==============================================================
# AERONEX ML V2
# ==============================================================

FEATURES = [
    "rpm",
    "cht",
    "egt",
    "oil_temperature",
    "oil_pressure",
    "fuel_flow",
    "vibration",
    "throttle",
    "altitude",
    "ambient_temperature",
]

MODEL_NAMES = [
    "health",
    "degradation",
    "rul",
    "mission",
    "fault",
    "anomaly",
]

# These are the thresholds produced by the current
# Aeronex ML V2 training run.
DEFAULT_ANOMALY_THRESHOLDS = {
    "warning": 0.11946327836161252,
    "high": 0.17895069658359808,
}


class AERONEXPredictor:
    """
    Aeronex ML V2 inference engine.

    Models are trained on representative simulator-derived
    telemetry.

    Intended for academic/demo digital-twin monitoring.

    NOT validated against real aero-engine data.
    """

    def __init__(
        self,
        artifact_dir: str | Path = "artifacts",
    ):
        self.artifact_dir = Path(artifact_dir)

        model_dir = self.artifact_dir / "models"
        metadata_dir = self.artifact_dir / "metadata"

        self.models: dict[str, Any] = {}
        self.meta: dict[str, dict[str, Any]] = {}

        # ==========================================================
        # LOAD MODEL ARTIFACTS
        # ==========================================================

        for name in MODEL_NAMES:

            model_path = (
                model_dir / f"{name}.joblib"
            )

            metadata_path = (
                metadata_dir / f"{name}.json"
            )

            if not model_path.exists():
                raise FileNotFoundError(
                    f"Missing ML model artifact: "
                    f"{model_path}"
                )

            if not metadata_path.exists():
                raise FileNotFoundError(
                    f"Missing ML metadata: "
                    f"{metadata_path}"
                )

            self.models[name] = joblib.load(
                model_path
            )

            self.meta[name] = json.loads(
                metadata_path.read_text(
                    encoding="utf-8"
                )
            )

        # ==========================================================
        # LOAD V2 ANOMALY THRESHOLDS
        # ==========================================================

        threshold_path = (
            metadata_dir
            / "anomaly_thresholds.json"
        )

        if threshold_path.exists():

            loaded_thresholds = json.loads(
                threshold_path.read_text(
                    encoding="utf-8"
                )
            )

            self.anomaly_thresholds = {
                "warning": float(
                    loaded_thresholds.get(
                        "warning",
                        DEFAULT_ANOMALY_THRESHOLDS[
                            "warning"
                        ],
                    )
                ),
                "high": float(
                    loaded_thresholds.get(
                        "high",
                        DEFAULT_ANOMALY_THRESHOLDS[
                            "high"
                        ],
                    )
                ),
            }

        else:

            self.anomaly_thresholds = (
                DEFAULT_ANOMALY_THRESHOLDS.copy()
            )

    # ==============================================================
    # INPUT PREPARATION
    # ==============================================================

    def _prepare_dataframe(
        self,
        telemetry: (
            list[dict[str, Any]]
            | pd.DataFrame
        ),
    ) -> pd.DataFrame:

        if isinstance(
            telemetry,
            pd.DataFrame,
        ):
            df = telemetry.copy()

        else:
            df = pd.DataFrame(
                telemetry
            )

        if df.empty:
            return df

        missing = [
            column
            for column in FEATURES
            if column not in df.columns
        ]

        if missing:

            raise ValueError(
                "Telemetry is missing required "
                "ML features: "
                + ", ".join(missing)
            )

        # Convert all ML features to numeric.
        for column in FEATURES:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            )

        # Remove invalid rows.
        df = (
            df.dropna(
                subset=FEATURES
            )
            .reset_index(
                drop=True
            )
        )

        return df

    # ==============================================================
    # DATA QUALITY
    # ==============================================================

    def _data_quality(
        self,
        df: pd.DataFrame,
    ) -> dict[str, Any]:

        if df.empty:

            return {
                "status": "NO_DATA",
                "rows": 0,
                "missing_ratio": 1.0,
                "invalid_numeric": 0,
            }

        total_values = (
            len(df)
            * len(FEATURES)
        )

        invalid_numeric = int(
            df[FEATURES]
            .isna()
            .sum()
            .sum()
        )

        missing_ratio = (
            invalid_numeric
            / total_values
            if total_values
            else 0.0
        )

        status = "GOOD"

        if missing_ratio > 0.10:

            status = "POOR"

        elif missing_ratio > 0:

            status = "WARNING"

        return {
            "status": status,
            "rows": int(
                len(df)
            ),
            "missing_ratio": float(
                missing_ratio
            ),
            "invalid_numeric": (
                invalid_numeric
            ),
        }

    # ==============================================================
    # POSITIVE PROBABILITY
    # ==============================================================

    @staticmethod
    def _positive_probability(
        model: Any,
        row: pd.DataFrame,
    ) -> float:

        probabilities = (
            model.predict_proba(
                row
            )[0]
        )

        classes = getattr(
            model,
            "classes_",
            [],
        )

        if len(classes) == 2:

            try:

                positive_index = list(
                    classes
                ).index(1)

            except ValueError:

                positive_index = 1

            return float(
                probabilities[
                    positive_index
                ]
            )

        return float(
            np.max(
                probabilities
            )
        )

    # ==============================================================
    # MISSION INTERPRETATION
    # ==============================================================

    @staticmethod
    def _mission_interpretation(
        probability: float,
    ) -> tuple[str, str]:

        if probability >= 0.80:

            return (
                "LOW",
                "MISSION_SUPPORTED",
            )

        if probability >= 0.55:

            return (
                "MEDIUM",
                "MISSION_AT_RISK",
            )

        return (
            "HIGH",
            "MISSION_NOT_SUPPORTED",
        )

    # ==============================================================
    # MAIN PREDICTION
    # ==============================================================

    def predict(
        self,
        telemetry: (
            list[dict[str, Any]]
            | pd.DataFrame
        ),
        required_duration_hours: (
            float | None
        ) = None,
    ) -> dict[str, Any]:

        started = time.perf_counter()

        # ==========================================================
        # PREPARE TELEMETRY
        # ==========================================================

        try:

            df = self._prepare_dataframe(
                telemetry
            )

        except ValueError as exc:

            return {
                "timestamp": "",

                "data_quality": {
                    "status": "INVALID_DATA",
                    "rows": 0,
                    "missing_ratio": 1.0,
                    "invalid_numeric": 0,
                    "error": str(exc),
                },

                "engine_health": {
                    "status": "INSUFFICIENT_DATA",
                    "score": None,
                    "confidence": None,
                },

                "anomaly": {
                    "detected": None,
                    "score": None,
                    "severity": "UNKNOWN",
                    "confidence": None,
                },

                "fault": {
                    "predicted": None,
                    "probability": None,
                    "confidence": None,
                },

                "degradation": {
                    "score": None,
                    "rate": None,
                    "trend": "UNKNOWN",
                    "confidence": None,
                },

                "rul": {
                    "value": None,
                    "unit": "hours",
                    "confidence": None,
                    "status": "INSUFFICIENT_DATA",
                },

                "maintenance": {
                    "action": "INSUFFICIENT_DATA",
                    "priority": "HIGH",
                    "reason": str(exc),
                },

                "mission": {
                    "reliability": None,
                    "completion_probability": None,
                    "risk": "UNKNOWN",
                    "decision": "INSUFFICIENT_DATA",
                    "confidence": None,
                },

                "explanations": [
                    str(exc)
                ],

                "model_metadata": {},

                "inference_latency_ms": (
                    (
                        time.perf_counter()
                        - started
                    )
                    * 1000
                ),
            }

        quality = self._data_quality(
            df
        )

        # ==========================================================
        # NO VALID TELEMETRY
        # ==========================================================

        if df.empty:

            return {
                "timestamp": "",
                "data_quality": quality,

                "engine_health": {
                    "status": "INSUFFICIENT_DATA",
                    "score": None,
                    "confidence": None,
                },

                "anomaly": {
                    "detected": None,
                    "score": None,
                    "severity": "UNKNOWN",
                    "confidence": None,
                },

                "fault": {
                    "predicted": None,
                    "probability": None,
                    "confidence": None,
                },

                "degradation": {
                    "score": None,
                    "rate": None,
                    "trend": "UNKNOWN",
                    "confidence": None,
                },

                "rul": {
                    "value": None,
                    "unit": "hours",
                    "confidence": None,
                    "status": "INSUFFICIENT_DATA",
                },

                "maintenance": {
                    "action": "INSUFFICIENT_DATA",
                    "priority": "HIGH",
                    "reason": (
                        "No valid telemetry "
                        "available"
                    ),
                },

                "mission": {
                    "reliability": None,
                    "completion_probability": None,
                    "risk": "UNKNOWN",
                    "decision": "INSUFFICIENT_DATA",
                    "confidence": None,
                },

                "explanations": [
                    (
                        "No valid telemetry "
                        "available for inference"
                    )
                ],

                "model_metadata": {},

                "inference_latency_ms": (
                    (
                        time.perf_counter()
                        - started
                    )
                    * 1000
                ),
            }

        # ==========================================================
        # LATEST TELEMETRY
        # ==========================================================

        row = df.iloc[
            [-1]
        ][FEATURES]

        # ==========================================================
        # HEALTH
        # ==========================================================

        health_raw = float(
            self.models["health"]
            .predict(row)[0]
        )

        health_score = float(
            np.clip(
                health_raw * 100.0,
                0.0,
                100.0,
            )
        )

        if health_score >= 75:

            health_status = "HEALTHY"

        elif health_score >= 50:

            health_status = "WARNING"

        else:

            health_status = "CRITICAL"

        # ==========================================================
        # DEGRADATION
        # ==========================================================

        degradation_raw = float(
            self.models["degradation"]
            .predict(row)[0]
        )

        degradation_score = float(
            np.clip(
                degradation_raw,
                0.0,
                1.0,
            )
        )

        if len(df) >= 3:

            first_row = (
                df.iloc[
                    [0]
                ][FEATURES]
            )

            last_row = (
                df.iloc[
                    [-1]
                ][FEATURES]
            )

            first_deg = float(
                self.models["degradation"]
                .predict(
                    first_row
                )[0]
            )

            last_deg = float(
                self.models["degradation"]
                .predict(
                    last_row
                )[0]
            )

            rate = float(
                (
                    last_deg
                    - first_deg
                )
                / max(
                    1,
                    len(df) - 1,
                )
            )

            if rate > 0.001:

                trend = "INCREASING"

            elif rate < -0.001:

                trend = "DECREASING"

            else:

                trend = "STABLE"

        else:

            rate = None
            trend = "UNKNOWN"

        # ==========================================================
        # RUL
        # ==========================================================

        rul_raw = float(
            self.models["rul"]
            .predict(row)[0]
        )

        rul_hours = float(
            max(
                0.0,
                rul_raw,
            )
        )

        # ==========================================================
        # FAULT CLASSIFICATION
        # ==========================================================

        fault_probabilities = (
            self.models["fault"]
            .predict_proba(
                row
            )[0]
        )

        fault_classes = (
            self.models["fault"]
            .classes_
        )

        fault_index = int(
            np.argmax(
                fault_probabilities
            )
        )

        fault_prediction = str(
            fault_classes[
                fault_index
            ]
        )

        fault_probability = float(
            fault_probabilities[
                fault_index
            ]
        )

        # ==========================================================
        # ANOMALY DETECTION — ML V2
        # ==========================================================

        anomaly_model = (
            self.models["anomaly"]
        )

        # Isolation Forest:
        #
        # decision_function()
        # higher = more normal
        # lower  = more anomalous
        #
        # Therefore invert the value.
        #
        # Higher anomaly_score =
        # stronger anomaly signal.

        anomaly_score = float(
            -anomaly_model
            .decision_function(
                row
            )[0]
        )

        warning_threshold = float(
            self.anomaly_thresholds[
                "warning"
            ]
        )

        high_threshold = float(
            self.anomaly_thresholds[
                "high"
            ]
        )

        anomaly_detected = (
            anomaly_score
            >= warning_threshold
        )

        if anomaly_score >= high_threshold:

            anomaly_severity = "HIGH"

        elif anomaly_detected:

            anomaly_severity = "MEDIUM"

        else:

            anomaly_severity = "LOW"

        # ==========================================================
        # MISSION RELIABILITY
        # ==========================================================

        mission_probability = (
            self._positive_probability(
                self.models["mission"],
                row,
            )
        )

        # ==========================================================
        # MISSION DURATION CONSTRAINT
        # ==========================================================

        required_hours = None

        if (
            required_duration_hours
            is not None
        ):

            try:

                required_hours = float(
                    required_duration_hours
                )

                if required_hours <= 0:

                    required_hours = None

            except (
                TypeError,
                ValueError,
            ):

                required_hours = None

        if (
            required_hours is not None
            and rul_hours
            < required_hours
        ):

            rul_factor = max(
                0.0,
                min(
                    1.0,
                    rul_hours
                    / required_hours,
                ),
            )

            mission_probability *= (
                rul_factor
            )

        mission_probability = float(
            np.clip(
                mission_probability,
                0.0,
                1.0,
            )
        )

        (
            mission_risk,
            mission_decision,
        ) = self._mission_interpretation(
            mission_probability
        )

        # ==========================================================
        # MAINTENANCE RECOMMENDATION
        # ==========================================================

        reasons: list[str] = []

        if anomaly_detected:

            reasons.append(
                f"Anomaly score is "
                f"{anomaly_score:.3f} "
                f"({anomaly_severity.lower()} "
                f"severity)"
            )

        if health_score < 60:

            reasons.append(
                "Health model indicates "
                "degraded engine condition"
            )

        if trend == "INCREASING":

            reasons.append(
                "Degradation index is "
                "increasing over the "
                "supplied window"
            )

        if (
            fault_prediction != "normal"
            and fault_probability >= 0.50
        ):

            reasons.append(
                f"Fault classifier indicates "
                f"{fault_prediction} "
                f"({fault_probability:.0%})"
            )

        if (
            required_hours is not None
            and rul_hours
            < required_hours
        ):

            reasons.append(
                "Estimated RUL is below "
                "the required mission duration"
            )

        if mission_risk == "HIGH":

            reasons.append(
                "Mission reliability is "
                "below the supported threshold"
            )

        if not reasons:

            reasons.append(
                "No material degradation or "
                "anomaly signal detected"
            )

        # ==========================================================
        # MAINTENANCE ACTION
        # ==========================================================

        if mission_risk == "HIGH":

            maintenance_action = (
                "URGENT_INSPECTION"
            )

            maintenance_priority = "HIGH"

        elif mission_risk == "MEDIUM":

            maintenance_action = "INSPECT"

            maintenance_priority = "MEDIUM"

        elif anomaly_detected:

            maintenance_action = "MONITOR"

            maintenance_priority = "MEDIUM"

        else:

            maintenance_action = "CONTINUE"

            maintenance_priority = "LOW"

        # ==========================================================
        # TIMESTAMP
        # ==========================================================

        timestamp = str(
            df.iloc[
                -1
            ].get(
                "timestamp",
                "",
            )
        )

        latency_ms = (
            time.perf_counter()
            - started
        ) * 1000

        # ==========================================================
        # FINAL RESULT
        # ==========================================================

        return {
            "timestamp": timestamp,

            "data_quality": quality,

            "engine_health": {
                "score": health_score,
                "status": health_status,
                "confidence": None,
            },

            "anomaly": {
                "detected": bool(
                    anomaly_detected
                ),
                "score": anomaly_score,
                "severity": anomaly_severity,
                "confidence": None,
                "warning_threshold": (
                    warning_threshold
                ),
                "high_threshold": (
                    high_threshold
                ),
            },

            "fault": {
                "predicted": (
                    None
                    if fault_prediction
                    == "normal"
                    else fault_prediction
                ),
                "probability": (
                    fault_probability
                ),
                "confidence": (
                    fault_probability
                ),
            },

            "degradation": {
                "score": degradation_score,
                "rate": rate,
                "trend": trend,
                "confidence": None,
            },

            "rul": {
                "value": rul_hours,
                "unit": "hours",
                "confidence": None,
                "status": (
                    "ESTIMATED_FROM_"
                    "REPRESENTATIVE_SYNTHETIC_MODEL"
                ),
            },

            "maintenance": {
                "action": maintenance_action,
                "priority": (
                    maintenance_priority
                ),
                "reason": "; ".join(
                    reasons
                ),
            },

            "mission": {
                "reliability": (
                    mission_probability
                ),
                "completion_probability": (
                    mission_probability
                ),
                "risk": mission_risk,
                "decision": mission_decision,
                "confidence": (
                    mission_probability
                ),
            },

            "explanations": reasons,

            "model_metadata": {
                name: self.meta[
                    name
                ].get(
                    "model_name",
                    f"aeronex_ml_v2_{name}",
                )
                for name in MODEL_NAMES
            },

            "inference_latency_ms": float(
                latency_ms
            ),
        }