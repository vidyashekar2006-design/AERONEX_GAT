from __future__ import annotations

import asyncio
import json
import os
from typing import Any
from urllib import error, request
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

SIMULATION_DIR = Path(__file__).resolve().parent.parent

if str(SIMULATION_DIR) not in sys.path:
    sys.path.insert(0, str(SIMULATION_DIR))

from simulator.mission import (
    MissionSimulator,
    create_default_mission_profile,
)


# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------

HOST = os.getenv("SIMULATION_HOST", "0.0.0.0")
PORT = int(os.getenv("SIMULATION_PORT", "8000"))

# Aeronex monitoring backend.
#
# For local development, the Aeronex backend can run on port 8001.
# Change this through the environment variable when deploying.
AERONEX_BACKEND_URL = os.getenv(
    "AERONEX_BACKEND_URL",
    "http://127.0.0.1:8001",
)

TELEMETRY_ENDPOINT = f"{AERONEX_BACKEND_URL}/api/telemetry"


# ---------------------------------------------------------------------------
# FASTAPI APPLICATION
# ---------------------------------------------------------------------------

app = FastAPI(title="Aeronex Simulation Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# SIMULATION STATE
# ---------------------------------------------------------------------------

mission = MissionSimulator(create_default_mission_profile())

simulation_clients: set[WebSocket] = set()

simulation_task: asyncio.Task | None = None

state_lock = asyncio.Lock()


# ---------------------------------------------------------------------------
# STATUS
# ---------------------------------------------------------------------------

def build_status() -> dict[str, Any]:
    """Build the complete state sent to the Simulation UI."""

    latest = mission.telemetry_records[-1] if mission.telemetry_records else {}

    phase_index = mission.current_phase_index

    if mission.complete:
        phase_index = len(mission.profile.phases) - 1

    total_phases = len(mission.profile.phases)

    if total_phases > 0:
        progress = (
            (phase_index + 1) / total_phases
        ) * 100.0
    else:
        progress = 0.0

    return {
        "type": "simulation_status",

        "running": mission.running,
        "complete": mission.complete,

        "simulation_source": "internal_mission_simulator",

        "timestamp": float(
            mission.controller.engine.environment.mission_elapsed_time
        ),

        "telemetry_records": len(mission.telemetry_records),

        "mission": {
            "name": mission.profile.name,

            "current_phase": (
                latest.get("mission_phase")
                if latest
                else mission.profile.phases[0].name
            ),

            "current_phase_index": phase_index,

            "total_phases": total_phases,

            "progress": progress,

            "phase_elapsed_time": mission.phase_elapsed_time,

            "completed_phases": list(
                mission.completed_phases
            ),
        },

        "controls": {
            "throttle": float(
                mission.controller.controls.throttle
            ),
            "altitude": float(
                mission.controller.controls.altitude
            ),
            "ambient_temperature": float(
                mission.controller.controls.ambient_temperature
            ),
            "degradation_scenario": (
                mission.controller.controls.degradation_scenario.value
            ),
            "degradation_enabled": bool(
                mission.controller.controls.degradation_enabled
            ),
            "degradation_severity": float(
                mission.controller.controls.degradation_severity
            ),
        },

        "latest_telemetry": dict(latest),

        "digital_twin": {
            "health_status": (
                mission.controller.digital_twin.health_status.value
            ),
        },
    }


# ---------------------------------------------------------------------------
# WEBSOCKET BROADCAST
# ---------------------------------------------------------------------------

async def broadcast_status() -> None:
    """Broadcast the current simulation state to all connected UIs."""

    if not simulation_clients:
        return

    status = build_status()

    disconnected: list[WebSocket] = []

    for client in simulation_clients:
        try:
            await client.send_json(status)
        except Exception:
            disconnected.append(client)

    for client in disconnected:
        simulation_clients.discard(client)


# ---------------------------------------------------------------------------
# TELEMETRY NORMALISATION
# ---------------------------------------------------------------------------

def normalise_telemetry(
    telemetry: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert MissionSimulator telemetry into the exact
    telemetry contract expected by the Aeronex monitoring backend.
    """

    required_fields = (
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

    for field in required_fields:
        if field not in telemetry:
            raise ValueError(
                f"Missing telemetry field: {field}"
            )

    # Build ONLY the fields accepted by TelemetryIn.
    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),

        "sim_time": float(
            telemetry.get(
                "sim_time",
                telemetry.get(
                    "mission_elapsed_time",
                    0.0,
                ),
            )
        ),

        "rpm": float(telemetry["rpm"]),
        "cht": float(telemetry["cht"]),
        "egt": float(telemetry["egt"]),

        "oil_temperature": float(
            telemetry["oil_temperature"]
        ),

        "oil_pressure": float(
            telemetry["oil_pressure"]
        ),

        "fuel_flow": float(
            telemetry["fuel_flow"]
        ),

        "vibration": float(
            telemetry["vibration"]
        ),

        "throttle": float(
            telemetry["throttle"]
        ),

        "altitude": float(
            telemetry["altitude"]
        ),

        "ambient_temperature": float(
            telemetry["ambient_temperature"]
        ),

        "operating_mode": telemetry.get(
            "operating_mode",
            "IDLE",
        ),

        "degradation_scenario": telemetry.get(
            "degradation_scenario",
            "NORMAL",
        ),

        "degradation_enabled": bool(
            telemetry.get(
                "degradation_enabled",
                False,
            )
        ),

        "degradation_severity": float(
            telemetry["degradation_severity"]
        ),
    }

    return result
# ---------------------------------------------------------------------------
# SEND TELEMETRY TO AERONEX BACKEND
# ---------------------------------------------------------------------------

def _post_telemetry_sync(
    telemetry: dict[str, Any],
) -> None:
    """
    Send telemetry to the separate Aeronex monitoring backend.

    Uses only Python's standard library so the Simulation Backend does not
    require an additional HTTP client dependency.
    """

    payload = json.dumps(
        telemetry
    ).encode("utf-8")

    http_request = request.Request(
        TELEMETRY_ENDPOINT,
        data=payload,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(
            http_request,
            timeout=2.0,
        ) as response:
            response.read()

    except error.HTTPError as exc:
        print(
            "❌ Aeronex telemetry rejected:",
            exc.code,
            exc.read().decode("utf-8", errors="replace"),
        )

    except (
        error.URLError,
        TimeoutError,
        OSError,
    ):
        pass
        # The simulation must continue even if the monitoring backend
        # is temporarily unavailable.
        pass


async def send_telemetry_to_aeronex(
    telemetry: dict[str, Any],
) -> None:
    """Send telemetry without blocking the simulation loop."""

    await asyncio.to_thread(
        _post_telemetry_sync,
        telemetry,
    )


# ---------------------------------------------------------------------------
# SIMULATION LOOP
# ---------------------------------------------------------------------------

async def simulation_loop() -> None:
    """
    Advance the MissionSimulator using its configured fixed timestep.

    The Simulation Backend owns the simulation clock.
    """

    try:
        while mission.running and not mission.complete:

            telemetry = mission.step()

            if telemetry is not None:

                normalised = normalise_telemetry(
                    telemetry
                )

                # Send telemetry to the monitoring backend.
                await send_telemetry_to_aeronex(
                    normalised
                )

                # Push fresh state to Simulation UI clients.
                await broadcast_status()

            await asyncio.sleep(
                mission.controller.config.fixed_timestep
            )

        # Always send the final state.
        await broadcast_status()

    except asyncio.CancelledError:
        raise

    except Exception as exc:
        print(
            "Simulation loop error:",
            exc,
        )

    finally:
        global simulation_task
        simulation_task = None


# ---------------------------------------------------------------------------
# SIMULATION COMMANDS
# ---------------------------------------------------------------------------

async def start_simulation() -> dict[str, Any]:
    """Start or resume the mission."""

    global simulation_task

    async with state_lock:

        if mission.complete:
            return {
                "status": "complete",
                "message": (
                    "Mission is complete. "
                    "Reset the simulation before starting again."
                ),
            }

        mission.start()

        if (
            simulation_task is None
            or simulation_task.done()
        ):
            simulation_task = asyncio.create_task(
                simulation_loop()
            )

    await broadcast_status()

    return {
        "status": "started",
        "state": build_status(),
    }


async def pause_simulation() -> dict[str, Any]:
    """Pause the mission without resetting it."""

    async with state_lock:
        mission.pause()

    await broadcast_status()

    return {
        "status": "paused",
        "state": build_status(),
    }


async def reset_simulation() -> dict[str, Any]:
    """Reset the mission to its initial state."""

    global simulation_task

    async with state_lock:

        mission.pause()

        if (
            simulation_task is not None
            and not simulation_task.done()
        ):
            simulation_task.cancel()

        simulation_task = None

        mission.reset()

    await broadcast_status()

    return {
        "status": "reset",
        "state": build_status(),
    }


async def handle_command(
    message: dict[str, Any],
) -> dict[str, Any]:
    """Handle commands received from the Simulation UI."""

    action = str(
        message.get("action", "")
    ).lower()

    if action == "start":
        return await start_simulation()

    if action == "pause":
        return await pause_simulation()

    if action == "reset":
        return await reset_simulation()

    if action == "set_controls":
        try:
            current_controls = mission.controller.controls

            scenario = message.get(
                "degradation_scenario",
                current_controls.degradation_scenario.value,
            )

            enabled = message.get(
                "degradation_enabled",
                current_controls.degradation_enabled,
            )

            severity = message.get(
                "degradation_severity",
                current_controls.degradation_severity,
            )

            mission.set_manual_degradation(
                scenario,
                enabled=bool(enabled),
                severity=float(severity),
            )

            await broadcast_status()

            return {
                "status": "controls_updated",
                "state": build_status(),
            }

        except (
            ValueError,
            TypeError,
        ) as exc:
            return {
                "status": "error",
                "message": (
                    f"Invalid degradation controls: {exc}"
                ),
                "state": build_status(),
            }

    if action == "ping":
        return {
            "status": "pong",
            "state": build_status(),
        }

    return {
        "status": "ignored",
        "message": (
            f"Unknown simulation action: {action}"
        ),
        "state": build_status(),
    }

# ---------------------------------------------------------------------------
# HTTP ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/")
def root() -> dict[str, Any]:
    return {
        "project": "Aeronex",
        "component": "Simulation Backend",
        "status": "online",
        "mission_running": mission.running,
        "mission_complete": mission.complete,
    }


@app.get("/status")
def status() -> dict[str, Any]:
    return build_status()


@app.post("/api/start")
async def http_start() -> dict[str, Any]:
    return await start_simulation()


@app.post("/api/pause")
async def http_pause() -> dict[str, Any]:
    return await pause_simulation()


@app.post("/api/reset")
async def http_reset() -> dict[str, Any]:
    return await reset_simulation()


# ---------------------------------------------------------------------------
# WEBSOCKET
# ---------------------------------------------------------------------------

@app.websocket("/ws/simulation")
async def simulation_websocket(
    websocket: WebSocket,
) -> None:
    """
    WebSocket used by the Simulation UI.

    Commands:
        {"action": "start"}
        {"action": "pause"}
        {"action": "reset"}
        {"action": "ping"}

    The backend also continuously pushes simulation state.
    """

    await websocket.accept()

    simulation_clients.add(
        websocket
    )

    try:

        # Immediately send current state.
        await websocket.send_json(
            build_status()
        )

        while True:

            message = await websocket.receive_json()

            if not isinstance(message, dict):
                continue

            response = await handle_command(
                message
            )

            await websocket.send_json(
                response
            )

    except WebSocketDisconnect:

        simulation_clients.discard(
            websocket
        )

        print(
            "Simulation UI disconnected"
        )

    except Exception as exc:

        simulation_clients.discard(
            websocket
        )

        print(
            "Simulation WebSocket error:",
            exc,
        )


# ---------------------------------------------------------------------------
# DEVELOPMENT ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=False,
    )