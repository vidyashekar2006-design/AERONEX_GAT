import json
import websocket

URL = "ws://127.0.0.1:8000/ws/simulation"

print("🔌 Connecting to Aeronex WebSocket...")

ws = websocket.create_connection(URL, timeout=30)

print("✅ Connected!")
print("📡 Listening for live snapshots...\n")

try:
    for i in range(10):
        message = ws.recv()
        data = json.loads(message)

        print(f"--- SNAPSHOT {i + 1} ---")

        telemetry = data.get("telemetry", {})
        analysis = data.get("analysis")
        print("Analysis:")
        print(json.dumps(analysis, indent=2))

        print(
            f"Telemetry: "
            f"RPM={telemetry.get('rpm')} | "
            f"CHT={telemetry.get('cht')} | "
            f"EGT={telemetry.get('egt')}"
        )

        print(
        f"ML Status: "
        f"{analysis.get('data_quality', {}).get('status', 'UNKNOWN')}"
      )

        print()

finally:
    ws.close()
    print("🔌 WebSocket closed.")