# AERONEX Digital Twin Frontend

React + TypeScript + Vite workstation UI for a representative academic aero-piston-engine monitoring digital twin.

## Run

```bash
npm install
npm run dev
```

The default experience is clearly marked **DEMO MODE** and uses `src/simulation/demoProvider.ts`. Future backend integration is prepared through `src/services/websocket.ts` (`ws://localhost:8000/ws/simulation`) and `src/services/api.ts`.

The frontend displays backend state; it does not implement engine physics, mission simulation, maintenance recommendations, or ML predictions.
