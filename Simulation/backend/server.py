from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from datetime import datetime, timezone
from typing import Any


app = FastAPI(title="Aeronex Backend")


# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# EXTERNAL SIMULATION IS AUTHORITATIVE
#
# The backend does NOT start or advance the simulator.
# The external simulation generates telemetry after its START button is
# pressed. This server receives, validates, stores and broadcasts telemetry.
# ---------------------------------------------------------------------------

latest_telemetry: dict[str, Any] = {}
telemetry_records: list[dict[str, Any]] = []
telemetry_started = False
last_received_at: str | None = None
websocket_clients: set[WebSocket] = set()


@app.get("/")
def root():
    return {
        "project": "Aeronex",
        "status": "online",
        "simulation": "mission",
    }


@app.get("/status")
def get_status():
    return build_status()


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _calculate_health(telemetry: dict[str, Any]) -> str:
    """Rule-based fallback health classification for the prototype."""
    cht = _safe_float(telemetry.get("cht"))
    egt = _safe_float(telemetry.get("egt"))
    oil_temperature = _safe_float(telemetry.get("oil_temperature"))
    oil_pressure = _safe_float(telemetry.get("oil_pressure"))
    vibration = _safe_float(telemetry.get("vibration"))

    if (
        cht >= 165.0
        or egt >= 600.0
        or oil_temperature >= 115.0
        or oil_pressure <= 1.5
        or vibration >= 0.75
    ):
        return "CRITICAL"

    if (
        cht >= 125.0
        or egt >= 450.0
        or oil_temperature >= 90.0
        or oil_pressure <= 2.8
        or vibration >= 0.50
    ):
        return "WARNING"

    return "NORMAL"


def _build_health_summary() -> dict[str, Any]:
    if not latest_telemetry:
        return {
            "health_status": "NO_DATA",
            "operating_mode": "IDLE",
            "source": "external_simulation",
        }

    return {
        "health_status": _calculate_health(latest_telemetry),
        "operating_mode": latest_telemetry.get("operating_mode", "UNKNOWN"),
        "source": "external_simulation",
        "degradation": {
            "scenario": latest_telemetry.get("degradation_scenario", "NORMAL"),
            "enabled": bool(latest_telemetry.get("degradation_enabled", False)),
            "severity": _safe_float(latest_telemetry.get("degradation_severity")),
        },
    }


def build_status() -> dict[str, Any]:
    """Build dashboard state entirely from externally received telemetry."""
    return {
        "running": telemetry_started,
        "complete": False,
        "simulation_source": "external",
        "timestamp": latest_telemetry.get("sim_time", 0.0),
        "telemetry_records": len(telemetry_records),
        "telemetry_connected": bool(latest_telemetry),
        "last_received_at": last_received_at,
        "digital_twin": _build_health_summary(),
        "latest_telemetry": dict(latest_telemetry),
        "mission": {
            "name": "External Simulation Mission",
            "current_phase": latest_telemetry.get("mission_phase"),
            "current_phase_index": None,
            "total_phases": None,
            "phase_elapsed_time": latest_telemetry.get("phase_elapsed_time"),
            "completed_phases": [],
            "telemetry_records": len(telemetry_records),
        },
    }


def _normalise_telemetry(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalise the external simulation telemetry contract."""
    required_numeric = (
        "sim_time",
        "rpm",
        "cht",
        "egt",
        "oil_temperature",
        "oil_pressure",
        "fuel_flow",
        "vibration",
        "throttle",
        "altitude",
        "ambient_temperature",
        "degradation_severity",
    )

    normalised = dict(payload)

    for field in required_numeric:
        if field not in normalised:
            raise ValueError(f"missing telemetry field: {field}")
        try:
            normalised[field] = float(normalised[field])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"invalid numeric telemetry field: {field}") from exc

    normalised["degradation_enabled"] = bool(
        normalised.get("degradation_enabled", False)
    )
    normalised.setdefault("operating_mode", "UNKNOWN")
    normalised.setdefault("degradation_scenario", "NORMAL")

    # Server receipt time is deliberately separate from simulation time.
    normalised["received_at"] = datetime.now(timezone.utc).isoformat()

    return normalised


@app.post("/api/telemetry")
async def receive_telemetry(payload: dict[str, Any]):
    """
    Receive one telemetry packet from the external simulation.

    START is controlled by the simulation. The backend begins its Aeronex
    processing path when the first valid telemetry packet arrives.
    """
    global latest_telemetry, telemetry_started, last_received_at

    try:
        telemetry = _normalise_telemetry(payload)
    except ValueError as exc:
        return {"status": "rejected", "error": str(exc)}

    latest_telemetry = telemetry
    telemetry_records.append(dict(telemetry))
    telemetry_started = True
    last_received_at = telemetry["received_at"]

    # Keep a bounded in-memory demo history.
    if len(telemetry_records) > 10_000:
        del telemetry_records[:-10_000]

    status = build_status()

    disconnected: list[WebSocket] = []
    for client in websocket_clients:
        try:
            await client.send_json(status)
        except Exception:
            disconnected.append(client)

    for client in disconnected:
        websocket_clients.discard(client)

    return {
        "status": "accepted",
        "sim_time": telemetry["sim_time"],
        "records": len(telemetry_records),
        "health_status": status["digital_twin"]["health_status"],
    }


@app.post("/api/telemetry/reset")
def reset_telemetry():
    """Reset the current external-simulation telemetry session."""
    global latest_telemetry, telemetry_started, last_received_at

    latest_telemetry = {}
    telemetry_records.clear()
    telemetry_started = False
    last_received_at = None

    return {"status": "reset"}


@app.websocket("/ws/simulation")
async def simulation_websocket(websocket: WebSocket):
    """
    Dashboard subscription endpoint.

    The frontend may connect here to receive live backend state. This endpoint
    intentionally does not start, pause, reset, or control the simulator.
    """
    await websocket.accept()
    websocket_clients.add(websocket)

    try:
        # Immediately provide current state.
        await websocket.send_json(build_status())

        while True:
            try:
                message = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=15.0,
                )

                # Keep only a harmless dashboard ping protocol.
                if message.get("action") == "ping":
                    await websocket.send_json(
                        {"type": "pong", "status": build_status()}
                    )

            except asyncio.TimeoutError:
                # Periodic state refresh; telemetry itself is pushed immediately
                # by /api/telemetry when a packet arrives.
                await websocket.send_json(build_status())

    except WebSocketDisconnect:
        websocket_clients.discard(websocket)
        print("Frontend disconnected")

    except Exception as exc:
        websocket_clients.discard(websocket)
        print("WebSocket error:", exc)
