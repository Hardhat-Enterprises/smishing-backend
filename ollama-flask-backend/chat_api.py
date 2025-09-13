from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import os
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure rate limiter (global + per-route)
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["100 per hour"]  # global limit (can adjust)
)

# Ollama API URL (can override in .env)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")


@app.post("/chat/api/generate")
@limiter.limit("10/minute")  # per-client limit for this endpoint
def chat():
    """Proxy endpoint: forward chat prompts to Ollama model."""
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        r = requests.post(
            OLLAMA_URL,
            json={
                "model": "llama3.2:1b",  # small model to avoid OOM
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        r.raise_for_status()
        jr = r.json()
        return jsonify({"response": jr.get("response", "")})
    except Exception as e:
        print("Flask proxy error:", e)
        return jsonify({"response": "Proxy error"}), 502


@app.get("/health")
def health():
    """Simple health check endpoint."""
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))  # configurable via .env
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)