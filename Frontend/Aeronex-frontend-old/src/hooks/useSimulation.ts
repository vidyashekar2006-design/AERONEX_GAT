import { useEffect, useMemo, useState } from 'react'
import { connectSimulation } from '../services/websocket'
import type { DegradationScenario, SimulationSnapshot } from '../simulation/types'

export function useSimulation() {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null)
  const [scenario, setScenario] =
    useState<DegradationScenario>('COOLING_DEGRADATION')
  const [enabled, setEnabled] = useState(false)
  const [severity, setSeverity] = useState(35)
  const [connection, setConnection] =
    useState<'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    const disconnect = connectSimulation(
      (nextSnapshot) => {
        setSnapshot(nextSnapshot as SimulationSnapshot)
      },
      (state) => {
        setConnection(state)
      },
    )

    return disconnect
  }, [])

  const controls = useMemo(
    () => ({
      scenario,
      setScenario,
      enabled,
      setEnabled,
      severity,
      setSeverity,
    }),
    [scenario, enabled, severity],
  )

  return {
    snapshot,
    controls,
    connection,
  }
}