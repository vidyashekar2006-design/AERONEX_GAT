import { initialSnapshot } from './demoData'
import type { DegradationScenario, SimulationSnapshot } from './types'
export function nextDemoSnapshot(previous:SimulationSnapshot, scenario:DegradationScenario, enabled:boolean, severity:number):SimulationSnapshot {
  const t = previous.telemetry; const drift = (n:number, amount:number) => +(n + (Math.random()-.5)*amount).toFixed(2)
  const effect = enabled ? severity / 100 : 0
  const telemetry = { ...t, rpm:Math.round(drift(t.rpm,28)), cht:Math.round(drift(96 + effect*28,2)), egt:Math.round(drift(540 + effect*18,3)), oilTemperature:Math.round(drift(84 + (scenario==='LUBRICATION_DEGRADATION'?effect*22:0),1)), oilPressure:+drift(3.8 - (scenario==='LUBRICATION_DEGRADATION'?effect*.9:0),.06).toFixed(2), vibration:+drift(.18 + (scenario==='VIBRATION_INCREASE'?effect*.55:0),.02).toFixed(2), fuelFlow:+drift(t.fuelFlow,.25).toFixed(1), throttle:t.throttle, altitude:t.altitude, ambientTemperature:t.ambientTemperature }
  const status = enabled && severity > 65 ? 'CRITICAL' : enabled && severity > 15 ? 'WARNING' : 'NORMAL'
  const alert = enabled ? { id:String(Date.now()), time:new Date().toLocaleTimeString(), level: status === 'CRITICAL' ? 'CRITICAL' as const : 'WARNING' as const, message:`${scenario.replace(/_/g,' ')} DETECTED`, detail:'Severity: DEMO' } : undefined
  return { ...previous, timestamp:new Date().toISOString(), telemetry, health:status, degradation:{ scenario:enabled?scenario:'NORMAL', enabled, severity:enabled?severity:0 }, alerts:alert ? [alert,...previous.alerts].slice(0,8) : previous.alerts }
}
export { initialSnapshot }
