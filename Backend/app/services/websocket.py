import asyncio

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, message: dict) -> None:
        failed: list[WebSocket] = []

        async def send(connection: WebSocket) -> None:
            try:
                await connection.send_json(jsonable_encoder(message))
            except Exception as exc:
             print(f"❌ WebSocket broadcast error: {exc}")
             failed.append(connection)

        await asyncio.gather(*(send(connection) for connection in list(self.connections)))
        for connection in failed:
            self.disconnect(connection)


manager = ConnectionManager()
