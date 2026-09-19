# AERONEX AI/ML Layer

## Dataset inspected
The supplied `aeronex_engine_telemetry.csv` contains 30,000 rows, 20 engines, 20 missions, 10-second samples, five mission phases, four named fault classes plus normal, anomaly labels, health/degradation indices, RUL hours and mission-completion labels. The supplied data has no missing values or duplicate records in the inspected CSV. It is treated as **project-provided dataset**; its physical provenance is not established here, so model results must not be presented as flight-certified performance.

## Leakage policy
Target columns (`health_index`, `degradation_index`, `rul_hours`, `mission_completion`, `fault_type`, `anomaly`) are excluded from model features. Splits are by engine identity, not random rows. Preprocessing is fitted inside each training pipeline.

## Models
- Health: RandomForestRegressor baseline against the supplied health-index label.
- Degradation: RandomForestRegressor against supplied degradation index.
- RUL: RandomForestRegressor against supplied RUL hours; output is explicitly estimated and data-limited until lifecycle/failure provenance is validated.
- Fault: Random Forest multiclass classifier.
- Anomaly: Isolation Forest fitted only on normal training rows.
- Mission completion: calibrated Random Forest binary classifier.

## Real-time contract
Backend supplies a telemetry window as a JSON array of records to `AERONEXPredictor.predict()`. The same validation, cleaning and feature logic used in training is applied. Models are loaded once and never retrained during inference.

## Failure-safe behavior
Short windows return `INSUFFICIENT_DATA`. Invalid timestamps/ranges produce a warning-quality report. No random confidence or fabricated metrics are generated. Where calibrated confidence is not available, fields are `null`; classifier probabilities are used as confidence proxies.

## Mission reliability
Mission completion probability starts from the random-forest mission probability. If a required mission duration is supplied, it is constrained by estimated RUL relative to that requirement. Decision bands: >=0.80 supported, 0.55-0.80 at risk, <0.55 not supported. These are prototype decision thresholds, not certified operational limits.

## Important limitation
The dataset has only 20 engines and a single short mission record per engine, and the provenance/physics of labels is not independently verified. Production RUL and mission-reliability validation requires multiple engines, repeated missions, true maintenance/failure events, censoring information, and validated operating envelopes.
