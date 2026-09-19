import pandas as pd, numpy as np
from pathlib import Path
from aeronex_ml.preprocessing.validation import validate_telemetry
from aeronex_ml.preprocessing.cleaning import clean_telemetry
from aeronex_ml.features.telemetry_features import build_features

def sample():
 p=Path('data/raw/aeronex_engine_telemetry.csv'); return pd.read_csv(p).head(30)
def test_validation_good(): assert validate_telemetry(sample()).status in ('GOOD','WARNING')
def test_clean_nan():
 x=sample(); x.loc[0,'rpm']=np.nan; y=clean_telemetry(x); assert y.rpm.notna().all()
def test_features():
 y=build_features(sample()); assert 'rpm_delta' in y and 'vibration_per_krpm' in y.columns
def test_bad_range():
 x=sample(); x.loc[0,'rpm']=99999; assert validate_telemetry(x).range_violations['rpm']==1
def test_short_window_failure_safe():
 from aeronex_ml.inference.predictor import AERONEXPredictor
 if Path('artifacts/models/health.joblib').exists():
  r=AERONEXPredictor('artifacts').predict(sample().head(2)); assert r['engine_health']['status']=='INSUFFICIENT_DATA'
