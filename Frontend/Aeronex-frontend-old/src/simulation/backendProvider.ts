import type { SimulationSnapshot } from './types'
/** Contract boundary for the future FastAPI/WebSocket simulation controller. */
export function validateBackendSnapshot(data:unknown): SimulationSnapshot | null { if (!data || typeof data !== 'object') return null; const candidate=data as Partial<SimulationSnapshot>; return candidate.telemetry && candidate.mission && candidate.degradation ? candidate as SimulationSnapshot : null }
