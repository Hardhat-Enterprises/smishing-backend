# machine-learning/ml_service.py
from fastapi import FastAPI
from pydantic import BaseModel
import pathlib, joblib, numpy as np
from sklearn.pipeline import make_pipeline

app = FastAPI(title="Smishing ML (Legacy RF)")

ROOT = pathlib.Path(__file__).resolve().parents[0].parent  # .../machine-learning
MDIR = ROOT / "model"
PICKLING = ROOT / "projects" / "Pickling"
LOCAL_PICKLING = ROOT / "machine-learning" / "projects" / "Pickling"  # VSCode/Windows layout

def _load_pipeline():
    p_single = MDIR / "model.joblib"
    if p_single.exists():
        pipe = joblib.load(p_single)
        return pipe, {"model_version": "pipeline_joblib"}

    vec_candidates = [
        MDIR / "rf_vectorizer_joblib.pkl",
        PICKLING / "rf_vectorizer_joblib.pkl",
        LOCAL_PICKLING / "rf_vectorizer_joblib.pkl",
    ]
    clf_candidates = [
        MDIR / "rf_model_joblib.pkl",
        PICKLING / "rf_model_joblib.pkl",
        LOCAL_PICKLING / "rf_model_joblib.pkl",
    ]
    vec = next((p for p in vec_candidates if p.exists()), None)
    clf = next((p for p in clf_candidates if p.exists()), None)
    if not vec or not clf:
        raise RuntimeError(
            f"Legacy RF files not found. Expected rf_vectorizer_* and rf_model_* in "
            f"{MDIR}, {PICKLING}, or {LOCAL_PICKLING}"
        )

    loaded_vec = joblib.load(vec)
    loaded_clf = joblib.load(clf)
    pipe = make_pipeline(loaded_vec, loaded_clf)
    meta = {
        "model_version": "legacy_rf_joblib",
        "vectorizer_file": str(vec),
        "model_file": str(clf),
    }
    return pipe, meta

PIPELINE, META = _load_pipeline()

def model_version():
    return META.get("model_version", "unknown")

# ---- determine how to decode raw labels (0/1 vs strings) -----------------
LABEL_DECODER = None
CLASSES = []

def _calibrate_label_decoder():
    """
    Build a mapping from model's raw labels to readable strings.
    Works for numeric labels (0/1) as well as already-string labels.
    We probe with a very safe text and a very smishy text.
    """
    global LABEL_DECODER, CLASSES

    try:
        final_est = getattr(PIPELINE, "steps", [])[ -1 ][1]
        CLASSES = list(getattr(final_est, "classes_", []))
    except Exception:
        CLASSES = []

    # If classes are strings like ['ham','spam'] we are good.
    if CLASSES and all(isinstance(c, str) for c in CLASSES):
        lower = [c.lower() for c in CLASSES]
        LABEL_DECODER = {c: ("ham" if "ham" in c.lower() or "legit" in c.lower() or "safe" in c.lower()
                             else "smishing" if "smish" in c.lower() or "phish" in c.lower() or "spam" in c.lower()
                             else c.lower())
                         for c in CLASSES}
        return

    # Otherwise probe the model to see which raw value corresponds to ham/smishing
    ham_probe = "hello friend how are you doing today there are no links here"
    smish_probe = "Your account is locked. Verify at http://bad.link now and enter your password"

    preds = PIPELINE.predict([ham_probe, smish_probe])
    # If we got two different raw labels, assign them.
    if len(set(preds)) >= 2:
        LABEL_DECODER = {
            preds[0]: "ham",
            preds[1]: "smishing"
        }
    else:
        # Fallback guess (most datasets use 0=ham, 1=spam)
        LABEL_DECODER = {0: "ham", 1: "smishing", "0": "ham", "1": "smishing"}

_calibrate_label_decoder()

class PredictIn(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok", "model_version": model_version(), "classes": [str(c) for c in CLASSES]}

def _decode(raw):
    """Map raw model output to 'ham'|'spam'|'smishing' (we normalize spam→smishing)."""
    if LABEL_DECODER is None:
        return str(raw)
    label = LABEL_DECODER.get(raw, str(raw))
    if label.lower() == "spam":
        return "smishing"
    return label.lower()

@app.post("/predict")
def predict(inp: PredictIn):
    txt = inp.text or ""

    # raw prediction (may be 0/1 or string)
    raw_label = PIPELINE.predict([txt])[0]
    label = _decode(raw_label)

    # probabilities + confidence (take prob of predicted class when possible)
    probs = {}
    confidence = 0.75
    if hasattr(PIPELINE, "predict_proba"):
        p = PIPELINE.predict_proba([txt])[0]

        # best effort to name classes consistently
        class_names = []
        if CLASSES:
            class_names = [ _decode(c) for c in CLASSES ]
        else:
            # fallback synthetic names
            class_names = [f"class_{i}" for i in range(len(p))]

        # pick the probability of the predicted class
        try:
            # find index of the raw_label in CLASSES; if missing, fallback to argmax
            if CLASSES:
                idx = list(CLASSES).index(raw_label)
            else:
                idx = int(np.argmax(p))
            confidence = float(p[idx])
        except Exception:
            confidence = float(np.max(p))

        # export a dict of probabilities by (decoded) class name
        probs = {str(class_names[i]): float(p[i]) for i in range(len(p))}
    else:
        probs = {label: confidence}

    badge = "Safe" if label == "ham" else ("Spam" if label == "spam" else "Smishing")
    # Normalize spam into smishing category for UI
    if badge == "Spam":
        badge = "Smishing"
        label = "smishing"

    severity = {"ham": "low", "spam": "medium", "smishing": "high"}.get(label, "low")

    return {
        "label": label,
        "badge": badge,
        "confidence": confidence,
        "probabilities": probs,
        "severity": severity,
        "model_version": model_version(),
    }
