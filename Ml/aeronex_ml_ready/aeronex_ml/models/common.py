import json, joblib
from pathlib import Path

def save_bundle(obj,path,metadata):
    path=Path(path); path.parent.mkdir(parents=True,exist_ok=True); joblib.dump(obj,path)
    mp=path.with_suffix('.json'); mp.write_text(json.dumps(metadata,indent=2,default=str)); return path

def load_bundle(path): return joblib.load(path)
