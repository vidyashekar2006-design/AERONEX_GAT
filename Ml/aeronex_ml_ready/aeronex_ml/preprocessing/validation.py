from dataclasses import dataclass, asdict
import numpy as np
import pandas as pd

NUMERIC_RANGES = {
    "load_fraction": (0, 1.2), "ambient_temperature_c": (-80, 80), "rpm": (0, 10000),
    "oil_temperature_c": (-50, 200), "coolant_temperature_c": (-50, 200),
    "oil_pressure_bar": (0, 20), "manifold_pressure_bar": (0, 5), "fuel_flow_kg_h": (0, 50),
    "vibration_rms": (0, 20), "exhaust_temperature_c": (-50, 1200),
}
@dataclass
class ValidationReport:
    status: str; rows: int; missing_ratio: float; timestamp_valid: bool; duplicates: int
    invalid_numeric: int; range_violations: dict; constant_sensors: list[str]; sampling_interval_seconds: float|None
    sensor_anomalies: list[str]
    def to_dict(self): return asdict(self)

def validate_telemetry(df: pd.DataFrame, require_timestamp=True) -> ValidationReport:
    if not isinstance(df,pd.DataFrame) or df.empty: raise ValueError("Telemetry must be a non-empty DataFrame")
    required=["timestamp","engine_id","mission_phase"] if require_timestamp else ["engine_id","mission_phase"]
    missing_cols=[c for c in required if c not in df.columns]
    if missing_cols: raise ValueError(f"Missing required telemetry columns: {missing_cols}")
    x=df.copy()
    ts=pd.to_datetime(x["timestamp"],errors="coerce") if "timestamp" in x else pd.Series(dtype='datetime64[ns]')
    
    if ts.notna().all() and "engine_id" in x:
        timestamp_valid=bool(all(g.is_monotonic_increasing for _,g in x.assign(_ts=ts).groupby("engine_id")["_ts"]))
    else:
        timestamp_valid=bool(ts.notna().all() and ts.is_monotonic_increasing)
    dup=int(x.duplicated(subset=[c for c in ["timestamp","engine_id","mission_id"] if c in x.columns]).sum())
    numeric_cols=x.select_dtypes(include=np.number).columns
    invalid=int((~np.isfinite(x[numeric_cols].to_numpy())).sum()) if len(numeric_cols) else 0
    violations={}
    for c,(lo,hi) in NUMERIC_RANGES.items():
        if c in x:
            n=int(((x[c]<lo)|(x[c]>hi)).sum())
            if n: violations[c]=n
    constants=[c for c in numeric_cols if c not in {"anomaly","mission_completion"} and x[c].nunique(dropna=True)<=1]
    missing_ratio=float(x.isna().mean().mean())
    interval=None
    if len(ts.dropna())>1:
        dif=(x.assign(_ts=ts).sort_values(["engine_id","_ts"]).groupby("engine_id")["_ts"].diff().dt.total_seconds().dropna())
        if len(dif): interval=float(dif.median())
    status="GOOD" if (timestamp_valid and dup==0 and invalid==0 and not violations and missing_ratio<=0.05) else "WARNING"
    return ValidationReport(status,len(x),missing_ratio,timestamp_valid,dup,invalid,violations,constants,interval,[])
