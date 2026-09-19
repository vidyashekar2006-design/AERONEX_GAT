# AERONEX — AI/ML prototype layer

This package implements the engine-telemetry analytics layer requested for SIH26054 without modifying backend/frontend code. It is standalone because no AERONEX repository archive was present in the available uploaded files at implementation time.

## Quick start
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/run_training.py
python scripts/eda.py
python scripts/run_inference.py --rows 60 --required-duration-hours 5
pytest -q
```

## What is real vs estimated
The training dataset is the supplied AERONEX telemetry CSV. Metrics in `artifacts/metadata/*.json` are calculated from held-out engines and are not invented. RUL and health/degradation predictions are model estimates against supplied labels, not physical certification.

## Backend integration
```python
from aeronex_ml.inference.predictor import AERONEXPredictor
predictor = AERONEXPredictor('artifacts')
result = predictor.predict(telemetry_window, required_duration_hours=5.0)
```
Return `result` directly as JSON after Pydantic validation if desired.

See `docs/ML_ARCHITECTURE.md` for architecture, leakage controls, limitations and mission logic.

## Demo scenarios
Run `python scripts/make_demo_scenarios.py` to create transparent synthetic perturbations from real project telemetry. They are marked `data_source=synthetic_demo_scenario` and are for demonstrating response direction only; they are not used for model training or reported as real performance.
