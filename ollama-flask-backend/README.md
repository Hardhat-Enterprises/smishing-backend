# AI Chat API (Flask)

Flask microservice that proxies Android app chat requests to a local Ollama server.

## Run (Windows)

1) Start Ollama:
   - ollama serve
   - Have a small model ready, e.g. ollama pull llama3.2:1b

2) Setup & run:
cd chat_api.py
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
py chat_api.py
Service: http://localhost:5000/chat/api/generate  
Health: http://localhost:5000/health

## Android
Use this URL in the emulator:
http://10.0.2.2:5000/chat/api/generate