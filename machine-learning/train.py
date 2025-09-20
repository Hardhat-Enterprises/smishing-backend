# machine-learning/train.py
import json, time, traceback
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import ComplementNB
from sklearn.ensemble import VotingClassifier

# SciPy for log-uniform sampling
from scipy.stats import loguniform

# ---------- Paths ----------
REPO = Path(__file__).resolve().parents[1]
MLDIR = REPO / "machine-learning"
MODEL_DIR = MLDIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

CSV_CANDIDATES = [
    MLDIR / "datasets" / "DatasetCombined.csv",
    REPO / "projects" / "Pickling" / "DatasetCombined.csv",
    REPO / "Pickling" / "DatasetCombined.csv",
    REPO / "datasets" / "DatasetCombined.csv",
]

def find_csv() -> Path:
    for p in CSV_CANDIDATES:
        if p.exists():
            print(f"[train] Using dataset: {p}")
            return p
    raise FileNotFoundError(
        "DatasetCombined.csv not found in any of:\n  " +
        "\n  ".join(str(p) for p in CSV_CANDIDATES)
    )

# ---------- Data loading ----------
def read_csv_safely(path: Path) -> pd.DataFrame:
    print(f"[train] Reading CSV from: {path.resolve()}")
    try:
        df = pd.read_csv(path, on_bad_lines="skip", encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(path, on_bad_lines="skip", encoding="latin-1")

    cols_lower = [c.lower() for c in df.columns]
    if "label" in cols_lower and "text" in cols_lower:
        df = df.rename(columns={c: c.lower() for c in df.columns})[["label", "text"]]
    else:
        df = pd.read_csv(
            path, on_bad_lines="skip", encoding="utf-8", engine="python",
            header=None, names=["label","text","c3","c4","c5"]
        )[["label", "text"]]
    return df

def normalize_label(s: str) -> str:
    s = str(s or "").strip().lower()
    if s in {"ham","legit","safe"}: return "ham"
    if s in {"spam","ad","promo","marketing"}: return "spam"
    if s in {"smishing","phishing","fraud","scam"}: return "smishing"
    if s == "0": return "ham"
    if s == "1": return "spam"
    if s == "2": return "smishing"
    return ""

# ---------- Trainer ----------
def main():
    # Load + clean
    csv_path = find_csv()
    df = read_csv_safely(csv_path).dropna()
    df["label"] = df["label"].map(normalize_label)
    df["text"]  = df["text"].astype(str).str.strip()
    df = df[df["label"] != ""].copy()

    keep = {"ham","spam","smishing"}
    df = df[df["label"].isin(keep)].copy()

    print(f"[train] Rows after cleaning: {len(df)}")
    print(df["label"].value_counts())

    if len(df) < 300:
        raise RuntimeError("Not enough rows after filtering. Check your CSV and label values.")

    Xtr, Xte, ytr, yte = train_test_split(
        df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
    )

    # --- Feature extractors ---
    vec_word = TfidfVectorizer(
        ngram_range=(1,2), min_df=2, max_df=0.98,
        sublinear_tf=True, strip_accents="unicode"
    )
    vec_char = TfidfVectorizer(
        analyzer="char_wb", ngram_range=(3,5), min_df=2
    )

    features = FeatureUnion([("w", vec_word), ("c", vec_char)])

    # --- Base classifiers ---
    lr  = LogisticRegression(
        solver="liblinear", C=2.0, max_iter=4000, random_state=42,
        class_weight={"ham":1.0, "spam":1.6, "smishing":2.0}
    )
    svc = CalibratedClassifierCV(
        LinearSVC(C=1.0, class_weight="balanced", random_state=42),
        cv=3
    )
    cnb = ComplementNB(alpha=0.5)

    clf = VotingClassifier(
        estimators=[("lr", lr), ("svc", svc), ("cnb", cnb)],
        voting="soft",
        weights=[2, 2, 1]
    )

    pipe = Pipeline([("features", features), ("clf", clf)])

    # --- Hyperparameter search (randomized) ---
    # CalibratedClassifierCV changed param name from base_estimator__ to estimator__ in newer sklearn.
    tmp = CalibratedClassifierCV(LinearSVC(), cv=2)
    svc_param_name = "estimator__C" if hasattr(tmp, "estimator") else "base_estimator__C"

    param_distributions = {
        "features__w__ngram_range": [(1,1), (1,2)],
        "features__w__min_df": [1,2,3,5],
        "features__w__max_df": [0.9, 0.95, 0.98, 1.0],
        "features__c__ngram_range": [(3,5), (3,6), (4,6)],
        "clf__lr__C": loguniform(0.3, 6.0),
        f"clf__svc__{svc_param_name}": loguniform(0.3, 6.0),
        "clf__cnb__alpha": loguniform(0.1, 2.0),
        "clf__weights": [(2,2,1), (2,1.5,1), (1.5,2,1), (2.5,2,1)]
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    search = RandomizedSearchCV(
        pipe,
        param_distributions=param_distributions,
        n_iter=40,  # increase for even stronger search
        scoring="f1_macro",
        n_jobs=-1,
        cv=cv,
        verbose=2,
        random_state=42,
        refit=True
    )

    print("[train] Searching best hyperparameters…")
    search.fit(Xtr, ytr)
    best = search.best_estimator_
    print("\n[train] Best params:\n", search.best_params_)
    print(f"[train] CV best score (f1_macro): {search.best_score_:.4f}")

    # --- Hold-out evaluation ---
    ypred = best.predict(Xte)
    print("\n[train] Evaluation on hold-out set:\n")
    print(classification_report(yte, ypred, digits=4))

    cm = confusion_matrix(yte, ypred, labels=["ham","spam","smishing"])
    print("\n[train] Confusion matrix (rows=true, cols=pred):")
    print(pd.DataFrame(cm, index=["ham","spam","smishing"], columns=["ham","spam","smishing"]))

    # --- Save model + meta ---
    model_path = MODEL_DIR / "model.joblib"
    meta_path  = MODEL_DIR / "meta.json"
    joblib.dump(best, model_path)
    meta = {"labels": ["ham","spam","smishing"], "version": f"v{int(time.time())}"}
    meta_path.write_text(json.dumps(meta))

    print(f"\n[train] Saved model to: {model_path.resolve()}")
    print(f"[train] Saved meta to:  {meta_path.resolve()}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\n[train] ERROR:", e)
        traceback.print_exc()
        raise
