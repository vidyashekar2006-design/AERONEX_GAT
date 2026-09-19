import numpy as np
import pandas as pd

SIGNALS=["load_fraction","ambient_temperature_c","rpm","oil_temperature_c","coolant_temperature_c","oil_pressure_bar","manifold_pressure_bar","fuel_flow_kg_h","vibration_rms","exhaust_temperature_c"]
def build_features(df: pd.DataFrame, window=6) -> pd.DataFrame:
    x=df.copy()
    if "timestamp" in x: x["timestamp"]=pd.to_datetime(x["timestamp"],errors="coerce")
    x=x.sort_values([c for c in ["engine_id","timestamp"] if c in x.columns]).copy()
    for c in SIGNALS:
        if c not in x: continue
        g=x.groupby("engine_id",group_keys=False)[c] if "engine_id" in x else None
        if g is not None:
            x[f"{c}_delta"] = g.diff()
            x[f"{c}_rate"] = g.diff()/10.0
            x[f"{c}_roll_mean"] = g.transform(lambda s:s.rolling(window,min_periods=2).mean())
            x[f"{c}_roll_std"] = g.transform(lambda s:s.rolling(window,min_periods=2).std())
    if {"coolant_temperature_c","oil_temperature_c"}.issubset(x.columns): x["coolant_oil_temp_delta_c"]=x.coolant_temperature_c-x.oil_temperature_c
    if {"rpm","load_fraction"}.issubset(x.columns): x["rpm_per_load"]=x.rpm/(x.load_fraction.clip(lower=.05))
    if {"fuel_flow_kg_h","load_fraction"}.issubset(x.columns): x["fuel_flow_per_load"]=x.fuel_flow_kg_h/(x.load_fraction.clip(lower=.05))
    if {"vibration_rms","rpm"}.issubset(x.columns): x["vibration_per_krpm"]=x.vibration_rms/(x.rpm/1000).clip(lower=.1)
    if "timestamp" in x:
        x["seconds_since_start"]=x.groupby("engine_id")["timestamp"].transform(lambda s:(s-s.min()).dt.total_seconds())
        x["mission_phase_code"]=x["mission_phase"].map({"takeoff":0,"climb":1,"cruise":2,"descent":3,"landing":4}).fillna(-1) if "mission_phase" in x else -1
    return x

def feature_columns(df):
    exclude={"timestamp","engine_id","mission_id","mission_phase","health_index","degradation_index","anomaly","fault_type","rul_hours","mission_duration_hours","mission_completion"}
    return [c for c in df.columns if c not in exclude and pd.api.types.is_numeric_dtype(df[c])]
