import argparse, json, sys
from pathlib import Path
import pandas as pd, numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score, accuracy_score, mean_absolute_error, mean_squared_error, r2_score, roc_auc_score, brier_score_loss
from sklearn.inspection import permutation_importance
from sklearn.model_selection import GroupShuffleSplit
from aeronex_ml.preprocessing.validation import validate_telemetry
from aeronex_ml.preprocessing.cleaning import clean_telemetry
from aeronex_ml.features.telemetry_features import build_features, feature_columns

TARGETS={"health":"health_index","degradation":"degradation_index","rul":"rul_hours","mission":"mission_completion"}

def split(df):
    engines=np.array(sorted(df.engine_id.unique())); rng=np.random.default_rng(42); rng.shuffle(engines)
    n=len(engines); tr=engines[:max(1,int(.7*n))]; va=engines[max(1,int(.7*n)):max(2,int(.85*n))]; te=engines[max(2,int(.85*n)):]
    return df[df.engine_id.isin(tr)].copy(),df[df.engine_id.isin(va)].copy(),df[df.engine_id.isin(te)].copy()

def make_preprocessor(X):
    nums=[c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]; cats=[c for c in X.columns if c not in nums]
    return ColumnTransformer([("num",Pipeline([("imp",SimpleImputer(strategy="median")),("scale",StandardScaler())]),nums),("cat",Pipeline([("imp",SimpleImputer(strategy="most_frequent")),("oh",OneHotEncoder(handle_unknown="ignore",sparse_output=False))]),cats)],remainder="drop")

def train(args):
    df=pd.read_csv(args.data,parse_dates=["timestamp"]); report=validate_telemetry(df); df=clean_telemetry(df); feat=build_features(df);
    tr,va,te=split(feat); feature_cols=feature_columns(feat); Xtr=tr[feature_cols];
    meta={"data_source":"real_project_provided_dataset","dataset":"aeronex_engine_telemetry.csv","validation":report.to_dict(),"split":{"strategy":"engine-held-out chronological-by-engine","train_engines":sorted(tr.engine_id.unique().tolist()),"validation_engines":sorted(va.engine_id.unique().tolist()),"test_engines":sorted(te.engine_id.unique().tolist())},"features":feature_cols,"version":"0.1.0"}
    out=Path(args.out); (out/'models').mkdir(parents=True,exist_ok=True); (out/'metadata').mkdir(parents=True,exist_ok=True); (out/'preprocessors').mkdir(parents=True,exist_ok=True)
    # Health: supervised baseline using provided health_index label; explicitly not a physical validation.
    for name,target,kind in [("health","health_index","reg"),("degradation","degradation_index","reg"),("rul","rul_hours","reg"),("mission","mission_completion","clf")]:
        Xtr2=tr[feature_cols]; Xva=va[feature_cols]; Xte=te[feature_cols]
        prep=make_preprocessor(Xtr2)
        model=RandomForestRegressor(n_estimators=20,random_state=42,n_jobs=-1,min_samples_leaf=3) if kind=='reg' else RandomForestClassifier(n_estimators=20,random_state=42,n_jobs=-1,class_weight='balanced',min_samples_leaf=3)
        pipe=Pipeline([('prep',prep),('model',model)]); pipe.fit(Xtr2,tr[target])
        pred=pipe.predict(Xte); m={"target":target,"kind":kind,"algorithm":type(model).__name__,"data_source":"real_project_provided_dataset"}; val_pred=pipe.predict(Xva)
        if kind=='reg': m.update({"validation_MAE":float(mean_absolute_error(va[target],val_pred)),"validation_RMSE":float(np.sqrt(mean_squared_error(va[target],val_pred))),"validation_R2":float(r2_score(va[target],val_pred)),"MAE":float(mean_absolute_error(te[target],pred)),"RMSE":float(np.sqrt(mean_squared_error(te[target],pred))),"R2":float(r2_score(te[target],pred))})
        else:
            val_prob=pipe.predict_proba(Xva)[:,1]; prob=pipe.predict_proba(Xte)[:,1]; m.update({"validation_f1":float(f1_score(va[target],val_pred,zero_division=0)),"validation_roc_auc":float(roc_auc_score(va[target],val_prob)),"accuracy":float(accuracy_score(te[target],pred)),"precision":float(precision_score(te[target],pred,zero_division=0)),"recall":float(recall_score(te[target],pred,zero_division=0)),"f1":float(f1_score(te[target],pred,zero_division=0)),"roc_auc":float(roc_auc_score(te[target],prob)),"brier":float(brier_score_loss(te[target],prob))})
        import joblib; joblib.dump(pipe,out/f'models/{name}.joblib'); (out/f'metadata/{name}.json').write_text(json.dumps({**meta,"model_name":name,"model_type":type(model).__name__,"test_metrics":m},indent=2,default=str))
    # Fault classifier: exclude normal? Keep 5-class classifier.
    prep=make_preprocessor(tr[feature_cols]); base=RandomForestClassifier(n_estimators=30,random_state=42,n_jobs=-1,class_weight='balanced',min_samples_leaf=2); pipe=Pipeline([('prep',prep),('model',base)]); pipe.fit(tr[feature_cols],tr.fault_type)
    p=pipe.predict(te[feature_cols]); prob=pipe.predict_proba(te[feature_cols]); m={"accuracy":float(accuracy_score(te.fault_type,p)),"precision_macro":float(precision_score(te.fault_type,p,average='macro',zero_division=0)),"recall_macro":float(recall_score(te.fault_type,p,average='macro',zero_division=0)),"f1_macro":float(f1_score(te.fault_type,p,average='macro',zero_division=0))}
    import joblib; joblib.dump(pipe,out/'models/fault.joblib'); (out/'metadata/fault.json').write_text(json.dumps({**meta,"model_name":"fault","model_type":"CalibratedRandomForestClassifier","classes":pipe.classes_.tolist(),"test_metrics":m},indent=2,default=str))
    # Anomaly: fit only on normal training rows, contamination derived from normal data false positive target rather than labels.
    normal=tr[tr.fault_type=='normal']; prep=make_preprocessor(normal[feature_cols]); iso=Pipeline([('prep',prep),('model',IsolationForest(n_estimators=20,random_state=42,contamination='auto',n_jobs=-1))]); iso.fit(normal[feature_cols]); joblib.dump(iso,out/'models/anomaly.joblib'); (out/'metadata/anomaly.json').write_text(json.dumps({**meta,"model_name":"anomaly","model_type":"IsolationForest","training_population":"normal fault_type rows only","evaluation_note":"Unsupervised score; threshold selected at inference from decision-function quantile on training normal population. No supervised accuracy claimed."},indent=2,default=str))
    # thresholds from training normal scores; evaluate against held-out labels without fitting on them
    scores=-iso.decision_function(normal[feature_cols]); thresholds={"warning":float(np.quantile(scores,.95)),"high":float(np.quantile(scores,.99))};
    test_scores=-iso.decision_function(te[feature_cols]); test_flag=test_scores>=thresholds["warning"]; y=te.anomaly.astype(int).to_numpy();
    tp=int(((test_flag==1)&(y==1)).sum()); fp=int(((test_flag==1)&(y==0)).sum()); fn=int(((test_flag==0)&(y==1)).sum()); tn=int(((test_flag==0)&(y==0)).sum());
    anomaly_eval={"threshold_warning":thresholds["warning"],"test_precision":float(tp/max(1,tp+fp)),"test_recall":float(tp/max(1,tp+fn)),"test_false_positive_rate":float(fp/max(1,fp+tn)),"note":"Post-hoc evaluation only; model fit used normal training rows and threshold used training-normal score quantile."};
    (out/'metadata/anomaly_evaluation.json').write_text(json.dumps(anomaly_eval,indent=2)); (out/'metadata/anomaly_thresholds.json').write_text(json.dumps(thresholds,indent=2))
    # global metadata
    (out/'metadata/manifest.json').write_text(json.dumps(meta,indent=2,default=str)); print(json.dumps({"validation":report.to_dict(),"artifacts":str(out)},indent=2))
if __name__=='__main__':
 ap=argparse.ArgumentParser(); ap.add_argument('--data',required=True); ap.add_argument('--out',default='artifacts'); train(ap.parse_args())
