import argparse, json
from pathlib import Path
import pandas as pd

ap=argparse.ArgumentParser(); ap.add_argument('--data',default='data/raw/aeronex_engine_telemetry.csv'); ap.add_argument('--out',default='data/demo'); a=ap.parse_args(); out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
df=pd.read_csv(a.data).tail(120).copy()
# Transparent, deterministic telemetry perturbations for a demo only. These are not training labels.
scenarios={'normal':df.copy(),'overheating':df.copy(),'low_oil_pressure':df.copy(),'high_vibration':df.copy()}
scenarios['overheating']['coolant_temperature_c'] += 18
scenarios['overheating']['oil_temperature_c'] += 14
scenarios['overheating']['exhaust_temperature_c'] += 55
scenarios['low_oil_pressure']['oil_pressure_bar'] *= 0.58
scenarios['low_oil_pressure']['oil_temperature_c'] += 5
scenarios['high_vibration']['vibration_rms'] *= 2.3
scenarios['high_vibration']['rpm'] += 120
for name,x in scenarios.items():
 x['data_source']='synthetic_demo_scenario'; x.to_csv(out/f'{name}.csv',index=False)
print(json.dumps({'data_source':'synthetic_demo_scenario','files':[str(out/f'{n}.csv') for n in scenarios]},indent=2))
