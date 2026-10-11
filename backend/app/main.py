"""Optional backend. The frontend works without it. Use it when you want server-side inference
with a larger model (e.g. TensorFlow/Keras). The /api/recognize endpoint mirrors the browser k-NN
and reads app/models/signs.json (export it from the Live page and copy it here)."""
import json, math, os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SignBridge AI API")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")], allow_methods=["*"], allow_headers=["*"])
MODEL = Path(__file__).parent / "models" / "signs.json"

class Req(BaseModel):
    landmarks: list[list[float]]  # 21 x [x, y, z]

def featurize(l):
    w = l[0]; p = [[a - b for a, b in zip(q, w)] for q in l]
    s = max(math.sqrt(sum(c * c for c in q)) for q in p) or 1
    return [c / s for q in p for c in q]

@app.get("/api/health")
def health(): return {"ok": True}

@app.post("/api/recognize")
def recognize(r: Req):
    if not MODEL.exists(): return {"label": None, "confidence": 0, "note": "No trained model file."}
    samples = json.loads(MODEL.read_text()).get("samples", [])
    if not samples or len(r.landmarks) != 21: return {"label": None, "confidence": 0}
    v = featurize(r.landmarks)
    d = sorted((math.dist(v, s["v"]), s["label"]) for s in samples)[:5]
    if d[0][0] > 1.0: return {"label": None, "confidence": 0}
    votes = {}
    for dist, lab in d: votes[lab] = votes.get(lab, 0) + 1 / (dist + 0.05)
    lab = max(votes, key=votes.get)
    return {"label": lab, "confidence": votes[lab] / sum(votes.values())}
