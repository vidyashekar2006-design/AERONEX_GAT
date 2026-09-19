"""
Aeronex Telemetry Bridge

The simulator remains independent.
This script:
    1. Runs the existing Aeronex simulator.
    2. Automatically changes simulator controls through a representative
       operating profile.
    3. Advances the simulation every 0.5 seconds.
    4. Sends telemetry to the Aeronex backend every 1 second.
    5. Does NOT generate random/fake telemetry values.

The backend only consumes telemetry.
The simulator is NOT controlled by the Aeronex frontend/backend.
"""

import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


# ---------------------------------------------------------------------------
# Simulator imports
# ---------------------------------------------------------------------------

SIMULATOR_DIR = Path(__file__).resolve().parent / "simulator"
sys.path.insert(0, str(SIMULATOR_DIR))

from controller import SimulationController
from engine import DegradationScenario


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# For same-laptop testing:
#   http://localhost:8000/api/telemetry
#
# For two-laptop testing:
#   Set the environment variable:
#   AERONEX_BACKEND_URL=http://<BACKEND_LAPTOP_IP>:8000/api/telemetry
#
BACKEND_URL = os.getenv(
    "AERONEX_BACKEND_URL",
    "http://localhost:8000/api/telemetry",
)

# Simulator advances using its existing fixed timestep of 0.5 seconds.
SIMULATION_STEP = 0.5

# Send one telemetry packet every 1 second.
SEND_INTERVAL = 1.0


# ---------------------------------------------------------------------------
# Telemetry conversion
# ---------------------------------------------------------------------------

def convert_telemetry(record: dict) -> dict:
    """
    Convert simulator telemetry into the Aeronex backend contract.
    """

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),

        "sim_time": float(record["timestamp"]),

        "rpm": float(record["rpm"]),
        "cht": float(record["cht"]),
        "egt": float(record["egt"]),

        "oil_temperature": float(record["oil_temperature"]),
        "oil_pressure": float(record["oil_pressure"]),

        "fuel_flow": float(record["fuel_flow"]),
        "vibration": float(record["vibration"]),

        "throttle": float(record["throttle"]),
        "altitude": float(record["altitude"]),
        "ambient_temperature": float(
            record["ambient_temperature"]
        ),

        "operating_mode": record["operating_mode"],

        "degradation_scenario": record["degradation_scenario"],
        "degradation_enabled": bool(
            record["degradation_enabled"]
        ),
        "degradation_severity": float(
            record["degradation_severity"]
        ),
    }


# ---------------------------------------------------------------------------
# Backend communication
# ---------------------------------------------------------------------------

def send_telemetry(payload: dict) -> None:
    """
    Send one telemetry packet to the Aeronex backend.
    """

    response = requests.post(
        BACKEND_URL,
        json=payload,
        timeout=5,
    )

    response.raise_for_status()

    degradation = payload["degradation_scenario"]

    print(
        f"📡 SENT | "
        f"sim={payload['sim_time']:.1f}s | "
        f"RPM={payload['rpm']:.0f} | "
        f"CHT={payload['cht']:.1f} | "
        f"EGT={payload['egt']:.1f} | "
        f"OilP={payload['oil_pressure']:.2f} | "
        f"Vib={payload['vibration']:.2f} | "
        f"mode={payload['operating_mode']} | "
        f"degradation={degradation} "
        f"{payload['degradation_severity']:.2f}"
    )


# ---------------------------------------------------------------------------
# Automatic simulation profile
# ---------------------------------------------------------------------------

def apply_simulation_profile(
    controller: SimulationController,
    sim_time: float,
) -> str:
    """
    Automatically change simulator controls according to simulation time.

    The values are NOT random.

    Each phase represents a different representative operating condition.
    The existing engine.py physics model calculates the resulting telemetry.
    """

    # Repeat the profile every 70 seconds.
    cycle_time = sim_time % 70.0

    # ---------------------------------------------------------------
    # PHASE 1 — START / LOW LOAD
    # 0 - 5 seconds
    # ---------------------------------------------------------------

    if cycle_time < 5.0:

        controller.set_throttle(0.25)
        controller.set_altitude(0.0)
        controller.set_ambient_temperature(20.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "START / LOW LOAD"


    # ---------------------------------------------------------------
    # PHASE 2 — TAKEOFF / HIGH LOAD
    # 5 - 15 seconds
    # ---------------------------------------------------------------

    elif cycle_time < 15.0:

        controller.set_throttle(0.85)
        controller.set_altitude(300.0)
        controller.set_ambient_temperature(20.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "TAKEOFF / HIGH LOAD"


    # ---------------------------------------------------------------
    # PHASE 3 — CLIMB
    # 15 - 25 seconds
    # ---------------------------------------------------------------

    elif cycle_time < 25.0:

        controller.set_throttle(0.75)
        controller.set_altitude(3000.0)
        controller.set_ambient_temperature(12.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "CLIMB"


    # ---------------------------------------------------------------
    # PHASE 4 — CRUISE
    # 25 - 35 seconds
    # ---------------------------------------------------------------

    elif cycle_time < 35.0:

        controller.set_throttle(0.55)
        controller.set_altitude(3000.0)
        controller.set_ambient_temperature(12.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "CRUISE"


    # ---------------------------------------------------------------
    # PHASE 5 — HIGH ALTITUDE CRUISE
    # 35 - 45 seconds
    # ---------------------------------------------------------------

    elif cycle_time < 45.0:

        controller.set_throttle(0.55)
        controller.set_altitude(6500.0)
        controller.set_ambient_temperature(-5.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "HIGH-ALTITUDE CRUISE"


    # ---------------------------------------------------------------
    # PHASE 6 — ENVIRONMENT CHANGE
    # 45 - 52 seconds
    # ---------------------------------------------------------------

    elif cycle_time < 52.0:

        controller.set_throttle(0.60)
        controller.set_altitude(6500.0)
        controller.set_ambient_temperature(30.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "ENVIRONMENT CHANGE"


    # ---------------------------------------------------------------
    # PHASE 7 — COOLING DEGRADATION
    # 52 - 60 seconds
    # ---------------------------------------------------------------

    elif cycle_time < 60.0:

        controller.set_throttle(0.60)
        controller.set_altitude(6500.0)
        controller.set_ambient_temperature(30.0)

        controller.set_degradation_scenario(
            DegradationScenario.COOLING_DEGRADATION
        )
        controller.set_degradation_severity(0.40)
        controller.set_degradation_enabled(True)

        return "COOLING DEGRADATION"


    # ---------------------------------------------------------------
    # PHASE 8 — RECOVERY / LOWER LOAD
    # 60 - 70 seconds
    # ---------------------------------------------------------------

    else:

        controller.set_throttle(0.35)
        controller.set_altitude(1000.0)
        controller.set_ambient_temperature(22.0)

        controller.set_degradation_scenario(
            DegradationScenario.NORMAL
        )
        controller.set_degradation_severity(0.0)
        controller.set_degradation_enabled(False)

        return "RECOVERY / LOWER LOAD"


# ---------------------------------------------------------------------------
# Main bridge loop
# ---------------------------------------------------------------------------

def main() -> None:
    """
    Start the simulator and continuously stream telemetry.
    """

    controller = SimulationController()

    print("=" * 70)
    print("🚀 AERONEX TELEMETRY BRIDGE")
    print("=" * 70)

    print(f"🎯 Backend: {BACKEND_URL}")
    print(f"⚙️  Simulation step: {SIMULATION_STEP}s")
    print(f"📡 Telemetry interval: {SEND_INTERVAL}s")
    print("🧠 Telemetry source: Existing Aeronex simulator")
    print("🎲 Random/fake telemetry: DISABLED")
    print("")
    print("📋 Automatic operating profile:")
    print("   0–5s    → START / LOW LOAD")
    print("   5–15s   → TAKEOFF / HIGH LOAD")
    print("   15–25s  → CLIMB")
    print("   25–35s  → CRUISE")
    print("   35–45s  → HIGH-ALTITUDE CRUISE")
    print("   45–52s  → ENVIRONMENT CHANGE")
    print("   52–60s  → COOLING DEGRADATION")
    print("   60–70s  → RECOVERY / LOWER LOAD")
    print("   🔁 Profile repeats continuously")
    print("")
    print("Press Ctrl+C to stop.")
    print("=" * 70)
    print("")

    # Start the existing simulator.
    controller.start()

    last_sent_time = -SEND_INTERVAL
    last_phase = None

    try:

        while True:

            # -----------------------------------------------------------
            # Current simulator time
            # -----------------------------------------------------------

            status = controller.get_status()

            controls = status.get("controls", {})
            current_sim_time = float(
                status.get("latest_telemetry", {}).get(
                    "timestamp",
                    0.0,
                )
            )

            # -----------------------------------------------------------
            # Apply automatic operating profile
            # -----------------------------------------------------------

            phase = apply_simulation_profile(
                controller,
                current_sim_time,
            )

            if phase != last_phase:
                print(f"\n🔄 PHASE → {phase}")
                last_phase = phase

            # -----------------------------------------------------------
            # Advance simulator by 0.5 seconds
            # -----------------------------------------------------------

            telemetry = controller.step()

            if telemetry is None:
                time.sleep(SIMULATION_STEP)
                continue

            sim_time = float(telemetry["timestamp"])

            # -----------------------------------------------------------
            # Send telemetry every 1 second
            #
            # Simulator still runs at 0.5 second resolution.
            # We send every second to keep the backend stream clean.
            # -----------------------------------------------------------

            if sim_time - last_sent_time >= SEND_INTERVAL:

                payload = convert_telemetry(telemetry)

                send_telemetry(payload)

                last_sent_time = sim_time

            # -----------------------------------------------------------
            # Keep simulation approximately real-time
            # -----------------------------------------------------------

            time.sleep(SIMULATION_STEP)

    except KeyboardInterrupt:

        print("\n")
        print("🛑 Telemetry bridge stopped by user.")

    except requests.RequestException as exc:

        print("\n❌ Backend connection failed.")
        print(f"   {exc}")
        print("")
        print("Make sure the Aeronex backend is running.")
        print(f"Expected backend: {BACKEND_URL}")

    except Exception as exc:

        print("\n❌ Telemetry bridge error.")
        print(f"   {type(exc).__name__}: {exc}")

    finally:

        try:
            controller.pause()
        except Exception:
            pass

        print("\n🏁 Aeronex telemetry bridge finished.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()