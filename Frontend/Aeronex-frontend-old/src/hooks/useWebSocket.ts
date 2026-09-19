import { useEffect, useState } from 'react'
import { connectSimulation } from '../services/websocket'
import type { SimulationSnapshot } from '../simulation/types'

/** Optional backend transport hook. The app intentionally uses the demo provider until selected. */
export function useWebSocket(enabled:boolean) { const [snapshot,setSnapshot]=useState<SimulationSnapshot|null>(null); const [status,setStatus]=useState<'connected'|'disconnected'>('disconnected'); useEffect(()=>{if(!enabled)return;return connectSimulation(setSnapshot,setStatus)},[enabled]); return {snapshot,status} }
