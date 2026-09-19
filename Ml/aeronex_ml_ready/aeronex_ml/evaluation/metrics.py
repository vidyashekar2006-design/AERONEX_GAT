from sklearn.metrics import *
import numpy as np
def regression_metrics(y,p): return {'MAE':float(mean_absolute_error(y,p)),'RMSE':float(np.sqrt(mean_squared_error(y,p))),'R2':float(r2_score(y,p))}
def classification_metrics(y,p,prob=None):
 d={'accuracy':float(accuracy_score(y,p)),'precision_macro':float(precision_score(y,p,average='macro',zero_division=0)),'recall_macro':float(recall_score(y,p,average='macro',zero_division=0)),'f1_macro':float(f1_score(y,p,average='macro',zero_division=0))}
 if prob is not None and len(np.unique(y))==2: d['roc_auc']=float(roc_auc_score(y,prob)); d['brier']=float(brier_score_loss(y,prob))
 return d
