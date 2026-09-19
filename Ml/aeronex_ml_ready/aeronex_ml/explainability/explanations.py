import numpy as np
def top_signal_explanations(row, feature_names, top_n=5):
    vals=[]
    for c in feature_names:
        v=row.get(c);
        if v is not None and np.isfinite(v): vals.append((c,abs(float(v)),float(v)))
    return [c for c,_,_ in sorted(vals,key=lambda z:z[1],reverse=True)[:top_n]]
