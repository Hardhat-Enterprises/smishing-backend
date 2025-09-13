# Smishing Backend (Node + Flask + Ollama)

This project is a _hybrid backend_:

- _Node.js/Express_ service providing REST endpoints (/api/\*)
- _Flask microservice_ acting as a proxy to an _Ollama LLM server_
- Shared .env configuration to keep services portable and secure

---

## ⚙ Setup (Node + Flask)

### 1. Start Ollama

```bash
ollama serve
ollama pull llama3.2:1b   # lightweight model

2. Flask Service
cd ollama-flask-backend
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
py chat_api.py

Flask will run on:
http://localhost:5000/chat/api/generate

Health check:
http://localhost:5000/health

3. Node.js Service
cd ..
npm install
npm start

Node will run on:
http://localhost:4000

Health check:
http://localhost:4000/api/health

API Endpoints

Health Checks
	•	GET http://localhost:4000/api/health → Node
	•	GET http://localhost:5000/health → Flask

Chat Proxy
	•	POST http://localhost:4000/api/chat
Body:
{ "message": "hello" }

Response (proxied from Ollama through Flask):
{ "response": "Hello, how can I help you?" }

Environment Variables

Root .env (Node)
PORT=4000
NODE_ENV=development
FLASK_API_URL=http://localhost:5000

Flask .env
FLASK_PORT=5000
FLASK_DEBUG=false
FLASK_API_KEY=super-secret-key
OLLAMA_URL=http://localhost:11434/api/generate
```
