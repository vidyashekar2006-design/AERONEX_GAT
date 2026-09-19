# Canonical telemetry contract

Every producer sends `TelemetryInput`. `timestamp` is the simulator event time; `received_at` is assigned during persistence. All times are ISO-8601 UTC.

| Field | Unit |
| --- | --- |
| rpm | rpm |
| cht, egt, oil_temperature, ambient_temperature | °C |
| oil_pressure | bar |
| fuel_flow | L/h |
| vibration | agreed project vibration unit (document calibration with source) |
| throttle | 0.0–1.0 |
| altitude | m |
| sim_time | s |

All numeric inputs must be finite. No value is clamped, normalized, or physically constrained by the data layer. Severity is `0.0–1.0` and must be zero when disabled. Sample packets use `SAMPLE_GENERATOR`; real simulator packets use `AERONEX_SIMULATOR` without a schema change.
