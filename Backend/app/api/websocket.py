from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder

from app.db import SessionLocal
from app.services.state import unified_snapshot
from app.services.websocket import manager

router = APIRouter()


@router.websocket("/ws/simulation")
async def simulation_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        with SessionLocal() as db:
            await websocket.send_json(jsonable_encoder(unified_snapshot(db)))
        # Receive keeps the connection alive and detects disconnects; clients need not send messages.
        while True:
            await websocket.receive()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
      print(f"❌ WebSocket error: {exc}")
      manager.disconnect(websocket)
