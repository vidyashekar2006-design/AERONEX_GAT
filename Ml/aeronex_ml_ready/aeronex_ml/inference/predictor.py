from pathlib import Path
import json, time
import numpy as np, pandas as pd, joblib
from aeronex_ml.preprocessing.validation import validate_telemetry
from aeronex_ml.preprocessing.cleaning import clean_telemetry
from aeronex_ml.features.telemetry_features import build_features, feature_columns

class AERONEXPredictor:
 def __init__(self,artifact_dir='artifacts'):
  a=Path(artifact_dir); self.a=a; self.models={k:joblib.load(a/f'models/{k}.joblib') for k in ['health','degradation','rul','mission','fault','anomaly']}; self.meta={k:json.loads((a/f'metadata/{k}.json').read_text()) for k in ['health','degradation','rul','mission','fault','anomaly']}; self.th=json.loads((a/'metadata/anomaly_thresholds.json').read_text())
 def predict(self,telemetry,required_duration_hours=None):
  t0=time.perf_counter(); df=pd.DataFrame(telemetry) if not isinstance(telemetry,pd.DataFrame) else telemetry.copy(); report=validate_telemetry(df); clean=clean_telemetry(df); f=build_features(clean); cols=self.meta['health']['features'];
  if len(f)<3: return {'timestamp':str(df.iloc[-1].get('timestamp','')),'data_quality':{**report.to_dict(),'status':'INSUFFICIENT_DATA'},'engine_health':{'status':'INSUFFICIENT_DATA','score':None,'confidence':None},'anomaly':{'detected':None,'score':None,'severity':'UNKNOWN','confidence':None},'fault':{'predicted':None,'probability':None,'confidence':None},'degradation':{'score':None,'rate':None,'trend':'UNKNOWN','confidence':None},'rul':{'value':None,'unit':'hours','confidence':None,'status':'INSUFFICIENT_DATA'},'maintenance':{'action':'INSUFFICIENT_DATA','priority':'HIGH','reason':'Insufficient telemetry window'},'mission':{'reliability':None,'completion_probability':None,'risk':'UNKNOWN','decision':'INSUFFICIENT_DATA','confidence':None},'explanations':['Telemetry window is too short for reliable inference'],'model_metadata':{k:self.meta[k].get('model_name') for k in self.meta}}
  row=f.iloc[[-1]][cols]; health=float(self.models['health'].predict(row)[0]); deg=float(self.models['degradation'].predict(row)[0]); rul=float(max(0,self.models['rul'].predict(row)[0])); mp=float(self.models['mission'].predict_proba(row)[0,1]); fault_probs=self.models['fault'].predict_proba(row)[0]; fi=int(np.argmax(fault_probs)); fault=self.models['fault'].classes_[fi]; fp=float(fault_probs[fi]); score=float(-self.models['anomaly'].decision_function(row)[0]); detected=score>=self.th['warning']; sev='HIGH' if score>=self.th['high'] else ('MEDIUM' if detected else 'LOW')
  # Health/degradation labels are stored 0..1 in supplied dataset; convert health to 0..100 for contract.
  hs=float(np.clip(health*100,0,100)); ds=float(np.clip(deg,0,1));
  if len(f)>=3 and 'degradation_index' in f: rate=float(f['degradation_index'].iloc[-1]-f['degradation_index'].iloc[0])/max(1,(len(f)-1)*10); trend='INCREASING' if rate>1e-5 else ('DECREASING' if rate<-1e-5 else 'STABLE')
  else: rate=None; trend='UNKNOWN'
  # Mission decision combines calibrated mission probability with RUL and data quality; no random confidence.
  req=float(required_duration_hours) if required_duration_hours else None
  if req is not None and rul < req: mp=min(mp, max(0.0,rul/req)*mp)
  risk='LOW' if mp>=.8 else ('MEDIUM' if mp>=.55 else 'HIGH'); decision='MISSION_SUPPORTED' if mp>=.8 else ('MISSION_AT_RISK' if mp>=.55 else 'MISSION_NOT_SUPPORTED')
  action='CONTINUE' if risk=='LOW' and not detected else ('MONITOR' if risk=='LOW' else ('INSPECT' if risk=='MEDIUM' else 'URGENT_INSPECTION'))
  reasons=[]
  if detected: reasons.append(f'Unsupervised anomaly score is {score:.2f} ({sev.lower()} severity)')
  if hs<60: reasons.append('Health model indicates degraded engine condition')
  if trend=='INCREASING': reasons.append('Degradation index is increasing over the supplied window')
  if fault!='normal' and fp>=.5: reasons.append(f'Fault classifier most strongly indicates {fault} ({fp:.0%})')
  if req is not None and rul<req: reasons.append('Estimated RUL is below the required mission duration')
  if not reasons: reasons.append('No material degradation or anomaly signal detected in the supplied window')
  latency=(time.perf_counter()-t0)*1000
  return {'timestamp':str(clean.iloc[-1]['timestamp']),'data_quality':report.to_dict(),'engine_health':{'score':hs,'status':'HEALTHY' if hs>=75 else ('WARNING' if hs>=50 else 'CRITICAL'),'confidence':None},'anomaly':{'detected':bool(detected),'score':score,'severity':sev,'confidence':None},'fault':{'predicted':None if fault=='normal' else fault,'probability':fp,'confidence':fp},'degradation':{'score':ds,'rate':rate,'trend':trend,'confidence':None},'rul':{'value':rul,'unit':'hours','confidence':None,'status':'ESTIMATED_FROM_TRAINED_REGRESSOR'},'maintenance':{'action':action,'priority':'LOW' if risk=='LOW' else ('MEDIUM' if risk=='MEDIUM' else 'HIGH'),'reason':'; '.join(reasons)},'mission':{'reliability':mp,'completion_probability':mp,'risk':risk,'decision':decision,'confidence':mp},'explanations':reasons,'model_metadata':{k:self.meta[k].get('model_name') for k in self.meta},'inference_latency_ms':latency}
