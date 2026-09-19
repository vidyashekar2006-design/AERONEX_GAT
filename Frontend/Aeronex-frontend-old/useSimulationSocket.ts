import { useEffect, useRef, useState } from 'react'
import type { SimulationSnapshot } from './types'

type ConnectionState = 'connecting' | 'connected' | 'disconnected'
const emptySnapshot: SimulationSnapshot = {}

/**
 * Thin transport adapter: calculations remain in the simulator/backend.
 * Unknown or partial snapshots are preserved so every view can fall back safely.
 */
export function useSimulationSocket() {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(emptySnapshot)
  const [state, setState] = useState<ConnectionState>('connecting')
  const [lastUpdate, setLastUpdate] = useState<string>()
  const retry = useRef<number | undefined>(undefined)

  useEffect(() => {
    let socket: WebSocket | undefined
    let active = true
    const connect = () => {
      if (!active) return
      setState('connecting')
      try {
        socket = new WebSocket(import.meta.env.VITE_SIMULATION_WS_URL || 'ws://localhost:8000/ws/simulation')
        socket.onopen = () => active && setState('connected')
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data)
            if (payload && typeof payload === 'object') {
              setSnapshot(payload as SimulationSnapshot)
              setLastUpdate(new Date().toISOString())
            }
          } catch { /* Ignore non-snapshot protocol messages. */ }
        }
        socket.onclose = () => {
          if (!active) return
          setState('disconnected')
          retry.current = window.setTimeout(connect, 3000)
        }
        socket.onerror = () => socket?.close()
      } catch {
        setState('disconnected')
        retry.current = window.setTimeout(connect, 3000)
      }
    }
    connect()
    return () => { active = false; socket?.close(); if (retry.current) window.clearTimeout(retry.current) }
  }, [])

  return { snapshot, state, lastUpdate }
}
