import json
import subprocess
import sys
from pathlib import Path
from urllib.request import urlopen

print("[retrain] script started", flush=True)

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "datasets"
REVIEWED_JSON = DATASET_DIR / "reviewed_reports.json"
EXPORT_URL = "http://localhost:3000/api/reports/export/reviewed"

def export_reviewed_reports():
    print("[retrain] Downloading reviewed reports...", flush=True)
    with urlopen(EXPORT_URL) as response:
        data = json.loads(response.read().decode("utf-8"))

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    REVIEWED_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")

    count = int(data.get("count", 0))
    print(f"[retrain] reviewed_reports.json updated. Count = {count}", flush=True)
    return count

def run_training():
    print("[retrain] Starting model training...", flush=True)
    result = subprocess.run(
        [sys.executable, "train.py"],
        cwd=BASE_DIR,
        check=False
    )
    print(f"[retrain] train.py finished with code {result.returncode}", flush=True)
    return result.returncode

def main():
    try:
        count = export_reviewed_reports()

        if count == 0:
            print("[retrain] No reviewed reports found. Training skipped.", flush=True)
            return

        code = run_training()
        if code == 0:
            print("[retrain] Training completed successfully.", flush=True)
        else:
            print(f"[retrain] Training failed with exit code {code}.", flush=True)
    except Exception as e:
        print(f"[retrain] ERROR: {e}", flush=True)

if __name__ == "__main__":
    main()