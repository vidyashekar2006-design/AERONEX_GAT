import argparse
from pathlib import Path
import pandas as pd, matplotlib.pyplot as plt
from aeronex_ml.preprocessing.validation import validate_telemetry
from aeronex_ml.features.telemetry_features import build_features
ap=argparse.ArgumentParser(); ap.add_argument('--data',default='data/raw/aeronex_engine_telemetry.csv'); ap.add_argument('--out',default='reports/figures'); a=ap.parse_args(); Path(a.out).mkdir(parents=True,exist_ok=True)
df=pd.read_csv(a.data,parse_dates=['timestamp']); print(validate_telemetry(df).to_dict()); print(df.describe(include='all').T); print('faults',df.fault_type.value_counts().to_dict()); print('missing',df.isna().sum().to_dict())

# Temporal trends
for c in ['rpm','oil_temperature_c','oil_pressure_bar','vibration_rms','exhaust_temperature_c','health_index','degradation_index','rul_hours']:
 plt.figure(figsize=(10,4)); plt.plot(df.timestamp,df[c],alpha=.6); plt.title(c); plt.tight_layout(); plt.savefig(Path(a.out)/(c+'.png')); plt.close()

# Correlation matrix for numeric telemetry
num=df.select_dtypes(include='number')
plt.figure(figsize=(12,10)); plt.imshow(num.corr(),aspect='auto'); plt.xticks(range(len(num.columns)),num.columns,rotation=90,fontsize=6); plt.yticks(range(len(num.columns)),num.columns,fontsize=6); plt.title('Numeric feature correlation matrix'); plt.colorbar(); plt.tight_layout(); plt.savefig(Path(a.out)/'correlation_matrix.png'); plt.close()
# Fault distribution
plt.figure(figsize=(8,4)); df.fault_type.value_counts().plot(kind='bar'); plt.title('Fault distribution'); plt.tight_layout(); plt.savefig(Path(a.out)/'fault_distribution.png'); plt.close()
# Anomaly timeline
plt.figure(figsize=(10,3)); plt.plot(df.timestamp,df.anomaly,drawstyle='steps-mid'); plt.title('Anomaly timeline'); plt.tight_layout(); plt.savefig(Path(a.out)/'anomaly_timeline.png'); plt.close()
