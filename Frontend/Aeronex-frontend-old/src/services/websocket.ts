import type {
  Alert,
  DegradationScenario,
  SimulationSnapshot,
} from '../simulation/types'

export const SIMULATION_WS_URL =
  import.meta.env.VITE_SIMULATION_WS_URL ||
  'ws://localhost:8000/ws/simulation'

type BackendSnapshot = {
  timestamp?: string

  telemetry?: {
    rpm?: number
    cht?: number
    egt?: number
    oil_temperature?: number
    oil_pressure?: number
    fuel_flow?: number
    vibration?: number
  }

  engine?: {
    throttle?: number
    operating_mode?: string
  }

  environment?: {
    altitude?: number
    ambient_temperature?: number
  }

  degradation?: {
    scenario?: string
    enabled?: boolean
    severity?: number
  }

  health?: {
    status?: string
  }

  mission?: {
    mission_name?: string
    phase?: string
    progress?: number | null
    elapsed_time?: number | null
    mission_reliability?: {
      status?: string
      score?: number | null
      confidence?: number | null
      reason?: string | null
      modelVersion?: string
    }
  }

  analysis?: {
    model_status?: string

    anomaly_detection?: {
      status?: string
      score?: number | null
      detected?: boolean
      severity?: string
    }

    fault_classification?: {
      fault?: string | null
      confidence?: number | null
    }

    degradation_estimation?: {
      severity?: number | null
    }

    rul_estimation?: {
      value?: number | null
      unit?: string
    }

    predictive_maintenance?: {
      recommendation?: string | null
    }
  }
}

function numberOr(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0
    ? value
    : fallback
}

function mapStatus(value: unknown): 'NORMAL' | 'WARNING' | 'CRITICAL' {
  const status = stringOr(value, 'NORMAL').toUpperCase()

  if (status === 'CRITICAL') return 'CRITICAL'
  if (status === 'WARNING') return 'WARNING'

  return 'NORMAL'
}

function mapScenario(value: unknown): DegradationScenario {
  const scenario = stringOr(value, 'NORMAL').toUpperCase()

  const valid: DegradationScenario[] = [
    'NORMAL',
    'COOLING_DEGRADATION',
    'LUBRICATION_DEGRADATION',
    'VIBRATION_INCREASE',
    'SENSOR_DRIFT',
  ]

  return valid.includes(scenario as DegradationScenario)
    ? (scenario as DegradationScenario)
    : 'NORMAL'
}

function mapOperatingMode(value: unknown): 'IDLE' | 'CRUISE' | 'HIGH_LOAD' {
  const mode = stringOr(value, 'IDLE').toUpperCase()

  if (mode === 'HIGH_LOAD') return 'HIGH_LOAD'
  if (mode === 'CRUISE') return 'CRUISE'

  return 'IDLE'
}

function mapReliability(
  reliability: BackendSnapshot['mission'] extends infer M
    ? M extends { mission_reliability?: infer R }
      ? R
      : never
    : never,
) {
  const status = stringOr(
    (reliability as { status?: string } | undefined)?.status,
    'NOT_AVAILABLE',
  )

  const validStatuses = [
    'LIKELY_TO_COMPLETE',
    'AT_RISK',
    'UNLIKELY_TO_COMPLETE',
    'NOT_AVAILABLE',
  ]

  return {
    status: validStatuses.includes(status)
      ? (status as
          | 'LIKELY_TO_COMPLETE'
          | 'AT_RISK'
          | 'UNLIKELY_TO_COMPLETE'
          | 'NOT_AVAILABLE')
      : 'NOT_AVAILABLE',
    score: numberOr(
      (reliability as { score?: number | null } | undefined)?.score,
      undefined as unknown as number,
    ),
    confidence: numberOr(
      (reliability as { confidence?: number | null } | undefined)?.confidence,
      undefined as unknown as number,
    ),
    reason:
      (reliability as { reason?: string | null } | undefined)?.reason ??
      'Validated mission-completion model not connected',
    modelVersion: (
      reliability as { modelVersion?: string } | undefined
    )?.modelVersion,
  }
}

function convertSnapshot(
  backend: BackendSnapshot,
): SimulationSnapshot {
  const telemetry = backend.telemetry ?? {}
  const engine = backend.engine ?? {}
  const environment = backend.environment ?? {}
  const degradation = backend.degradation ?? {}
  const mission = backend.mission ?? {}
  const analysis = backend.analysis ?? {}

  const health = mapStatus(backend.health?.status)

  const alert: Alert | null =
    health !== 'NORMAL'
      ? {
          id: `health-${backend.timestamp ?? Date.now()}`,
          time: new Date(
            backend.timestamp ?? Date.now(),
          ).toLocaleTimeString(),
          level: health === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          message: 'ENGINE HEALTH WARNING',
          detail: `Backend health status: ${health}`,
        }
      : null

  const anomalyStatus = stringOr(
    analysis.anomaly_detection?.status,
    'NOT_AVAILABLE',
  )

  const fault =
    analysis.fault_classification?.fault ?? 'NOT AVAILABLE'

  const rul =
    analysis.rul_estimation?.value != null
      ? `${analysis.rul_estimation.value.toFixed(1)} ${
          analysis.rul_estimation.unit ?? 'hours'
        }`
      : undefined

  return {
    source: 'backend',

    timestamp:
      backend.timestamp ??
      new Date().toISOString(),

    telemetry: {
      rpm: numberOr(telemetry.rpm),
      cht: numberOr(telemetry.cht),
      egt: numberOr(telemetry.egt),
      oilTemperature: numberOr(
        telemetry.oil_temperature,
      ),
      oilPressure: numberOr(
        telemetry.oil_pressure,
      ),
      fuelFlow: numberOr(
        telemetry.fuel_flow,
      ),
      vibration: numberOr(
        telemetry.vibration,
      ),

      throttle: numberOr(engine.throttle),
      altitude: numberOr(environment.altitude),
      ambientTemperature: numberOr(
        environment.ambient_temperature,
      ),
    },

    operatingMode: mapOperatingMode(
      engine.operating_mode,
    ),

    health,

    degradation: {
      scenario: mapScenario(
        degradation.scenario,
      ),
      enabled: Boolean(
        degradation.enabled,
      ),
      severity: numberOr(
        degradation.severity,
      ),
    },

    mission: {
      name:
        mission.mission_name ??
        'REPRESENTATIVE ENDURANCE FLIGHT',

      progress:
        mission.progress != null
          ? numberOr(mission.progress)
          : 0,

      currentPhase:
        mission.phase ??
        'NOT AVAILABLE',

      phases: [],

      reliability: mapReliability(
        mission.mission_reliability,
      ),
    },

    alerts: alert ? [alert] : [],

    environment: {
      altitude: numberOr(
        environment.altitude,
      ),
      ambientTemperature: numberOr(
        environment.ambient_temperature,
      ),
    },

    analysis: {
      anomaly: anomalyStatus,
      fault,
      rul,
      maintenance:
        analysis.predictive_maintenance
          ?.recommendation ?? undefined,
    },
  }
}

export function connectSimulation(
  onSnapshot: (
    snapshot: SimulationSnapshot,
  ) => void,
  onState: (
    state: 'connected' | 'disconnected',
  ) => void,
) {
  const socket = new WebSocket(
    SIMULATION_WS_URL,
  )

  socket.onopen = () => {
    onState('connected')
  }

  socket.onmessage = (event) => {
    try {
      const backendSnapshot = JSON.parse(
        event.data,
      ) as BackendSnapshot

      const snapshot =
        convertSnapshot(backendSnapshot)

      onSnapshot(snapshot)
    } catch (error) {
      console.error(
        '❌ Invalid Aeronex WebSocket snapshot:',
        error,
      )
    }
  }

  socket.onerror = () => {
    socket.close()
  }

  socket.onclose = () => {
    onState('disconnected')
  }

  return () => {
    socket.close()
  }
}
