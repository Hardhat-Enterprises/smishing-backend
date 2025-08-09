from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.post("/chat/api/generate")
def chat():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")

    try:
        r = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:1b",   # small model to avoid OOM
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
        # Return 502 so Android shows “AI server error: 502” if it hits this
        return jsonify({"response": "Proxy error"}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)