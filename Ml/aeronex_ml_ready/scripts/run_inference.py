import argparse,json,pandas as pd
from aeronex_ml.inference.predictor import AERONEXPredictor
ap=argparse.ArgumentParser(); ap.add_argument('--data',default='data/raw/aeronex_engine_telemetry.csv'); ap.add_argument('--rows',type=int,default=60); ap.add_argument('--required-duration-hours',type=float,default=None); args=ap.parse_args()
df=pd.read_csv(args.data).tail(args.rows); p=AERONEXPredictor('artifacts'); print(json.dumps(p.predict(df,args.required_duration_hours),indent=2,default=str))
