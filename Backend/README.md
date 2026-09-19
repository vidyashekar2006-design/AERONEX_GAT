# AERONEX backend

Engine-centric FastAPI backend for receiving MALE UAV aero-piston-engine simulator telemetry and streaming the current digital-twin state to dashboard clients.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For PostgreSQL, set `DATABASE_URL` in `.env` to a SQLAlchemy PostgreSQL URL. SQLite is retained only as the local-development fallback.

Simulator endpoint: `POST http://BACKEND_IP:8000/api/telemetry`  
Dashboard WebSocket: `ws://BACKEND_IP:8000/ws/simulation`

API documentation is available at `/docs`.

## PostgreSQL demo deployment

`docker compose up --build` starts the backend on all LAN interfaces and PostgreSQL on the same compose network. Change the example database password before using it outside the prototype/demo environment.
