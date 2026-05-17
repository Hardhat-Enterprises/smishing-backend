---

# Flask Service README (ollama-flask-backend/README.md)

markdown
# Ollama Flask Backend

This microservice proxies chat requests to a locally running [Ollama](https://ollama.ai) server.  
It is part of the **Smishing Backend**, but can be run standalone.

---

## ⚙ Setup

### 1. Prerequisites

- Python 3.10+
- Ollama installed and running
- Node.js service (optional if integrated)

---

### 2. Installation

bash
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env

3. Run
   py chat_api.py

Service runs on:
http://localhost:5000

Endpoints

Health
GET /health

Response:
{ "status": "ok" }

Chat
POST /chat/api/generate

Body:
{ "prompt": "hello" }

Response:
{ "response": "Hello, how can I help you?" }

Environment Variables

.env
FLASK_PORT=5000
FLASK_DEBUG=false
FLASK_API_KEY=super-secret-key
OLLAMA_URL=http://localhost:11434/api/generate
