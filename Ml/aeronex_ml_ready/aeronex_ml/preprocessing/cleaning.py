import pandas as pd
import numpy as np

def clean_telemetry(df: pd.DataFrame) -> pd.DataFrame:
    x=df.copy()
    if "timestamp" in x:
        x["timestamp"]=pd.to_datetime(x["timestamp"],errors="coerce")
        x=x.dropna(subset=["timestamp"]).sort_values([c for c in ["engine_id","timestamp"] if c in x.columns])
    keys=[c for c in ["timestamp","engine_id","mission_id"] if c in x.columns]
    if keys: x=x.drop_duplicates(keys,keep="last")
    for c in x.select_dtypes(include=np.number).columns:
        x[c]=x[c].replace([np.inf,-np.inf],np.nan)
        if c in ["load_fraction","rpm","oil_temperature_c","coolant_temperature_c","oil_pressure_bar","manifold_pressure_bar","fuel_flow_kg_h","vibration_rms","exhaust_temperature_c","ambient_temperature_c"]:
            x[c]=x.groupby("engine_id")[c].transform(lambda s:s.interpolate(limit=3,limit_direction="both")) if "engine_id" in x else x[c].interpolate(limit=3,limit_direction="both")
    return x
