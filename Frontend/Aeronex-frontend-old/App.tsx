import { useState } from 'react'
import { Activity, BarChart3, ClipboardList, Cpu, Gauge, LayoutDashboard, Settings, ShieldCheck, Target, WifiOff } from 'lucide-react'
import { useSimulationSocket } from './simulation/useSimulationSocket'
import type { UnknownRecord } from './simulation/types'

const nav = [{ label: 'Dashboard', icon: LayoutDashboard }, { label: 'Telemetry', icon: Activity }, { label: 'Digital Twin', icon: Cpu }, { label: 'Health', icon: ShieldCheck }, { label: 'Analysis', icon: BarChart3 }, { label: 'Mission', icon: Target }, { label: 'Reports', icon: ClipboardList }, { label: 'Settings', icon: Settings }]
const read = (group: UnknownRecord | undefined, ...keys: string[]) => { for (const key of keys) { const value = group?.[key]; if (value !== undefined && value !== null && value !== '') return String(value) } return '—' }
const status = (health?: UnknownRecord) => read(health, 'status', 'overall_status', 'state')
const formatTime = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)) : 'WAITING FOR DATA'

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><em>{value === '—' ? 'NOT AVAILABLE' : unit}</em></div> }

function EngineTwin({ telemetry, health }: { telemetry?: UnknownRecord; health?: UnknownRecord }) {
  const [auto, setAuto] = useState(false); const [selected, setSelected] = useState<string | null>(null); const [angle, setAngle] = useState(-12); const [zoom, setZoom] = useState(1); const [dragStart, setDragStart] = useState<number | null>(null)
  const rpm = read(telemetry, 'rpm', 'RPM'); const engineStatus = status(health)
  return <section className="twin panel"><div className="panel-head"><div><p className="eyebrow">ENGINE DIGITAL TWIN</p><h1>Aero Piston Engine <span>01</span></h1></div><div className={`health ${engineStatus === '—' ? 'muted' : engineStatus.toLowerCase()}`}><i /> HEALTH: {engineStatus === '—' ? 'UNAVAILABLE' : engineStatus}</div></div>
    <div className="engine-stage" onPointerDown={(event) => setDragStart(event.clientX)} onPointerMove={(event) => { if (dragStart !== null) { setAngle(angle + (event.clientX - dragStart) * .45); setDragStart(event.clientX) } }} onPointerUp={() => setDragStart(null)} onPointerLeave={() => setDragStart(null)}>
      <div className={`engine-art ${auto ? 'spin' : ''}`} style={{ transform: `perspective(600px) rotateX(8deg) rotateY(${angle}deg) scale(${zoom})` }} aria-label="Representative aero piston engine digital twin">
        <div className="shaft" /><div className="hub" /><div className="prop prop-a" /><div className="prop prop-b" />
        <div className="crankcase" /><button className="part cylinder left" onClick={() => setSelected('CYLINDER / COOLING SYSTEM')}><b /><b /><b /></button><button className="part cylinder right" onClick={() => setSelected('CYLINDER / COOLING SYSTEM')}><b /><b /><b /></button><button className="part intake" onClick={() => setSelected('INTAKE ASSEMBLY')} /><button className="part exhaust" onClick={() => setSelected('EXHAUST ASSEMBLY')} />
        <div className="sensor s1" /><div className="sensor s2" />
      </div>
      <div className="stage-note">REPRESENTATIVE ACADEMIC ENGINE MODEL<br/><span>Visual state follows incoming simulator telemetry.</span></div>
      <div className="twin-controls"><button onClick={() => setAuto(!auto)}>{auto ? 'Pause motion' : 'Auto rotate'}</button><button onClick={() => setZoom(Math.min(1.22, zoom + .08))}>Zoom +</button><button onClick={() => setZoom(Math.max(.72, zoom - .08))}>Zoom −</button><button onClick={() => { setSelected(null); setAngle(-12); setZoom(1) }}>Reset view</button></div>
      {selected && <aside className="component"><small>COMPONENT FOCUS</small><strong>{selected}</strong><p>Component-level analysis is not available in the current snapshot.</p><button onClick={() => setSelected(null)}>Close</button></aside>}
    </div>
    <div className="metrics"><Metric label="RPM" value={rpm} unit="RPM" /><Metric label="CYLINDER HEAD" value={read(telemetry, 'cht', 'cylinder_head_temperature')} unit="°C" /><Metric label="EXHAUST GAS" value={read(telemetry, 'egt', 'exhaust_gas_temperature')} unit="°C" /><Metric label="OIL PRESSURE" value={read(telemetry, 'oil_pressure')} unit="kPa" /><Metric label="VIBRATION" value={read(telemetry, 'vibration')} unit="mm/s" /></div>
  </section>
}

function App() {
  const [active, setActive] = useState('Dashboard'); const { snapshot, state, lastUpdate } = useSimulationSocket()
  const reliability = read(snapshot.mission, 'reliability', 'mission_reliability'); const rul = read(snapshot.analysis, 'rul', 'remaining_useful_life')
  return <div className="app-shell"><header><div className="brand-mark"><span>AE</span></div><div className="brand"><strong>AERONEX</strong><small>Smarter Engines. Safer Missions.</small></div><div className="header-meta"><div className="live"><i /> LIVE</div><div className={`connection ${state}`}><WifiOff size={14} /> {state.toUpperCase()}</div><div className="updated"><span>LAST UPDATE</span>{formatTime(lastUpdate)}</div><div className="operator">AETHERIS / OPERATOR 01</div></div></header>
    <aside className="sidebar"><div className="system-label"><Gauge size={16}/><span>MISSION OPS</span></div><nav>{nav.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={active === label ? 'active' : ''}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="security"><ShieldCheck size={18}/><div><b>SECURE SESSION</b><span>Access monitored</span></div></div></aside>
    <main><div className="context"><div><p className="eyebrow">{active === 'Dashboard' ? 'MISSION CONTROL' : 'AERONEX / ' + active.toUpperCase()}</p><h2>{active}</h2></div><p className="context-id">ASSET <b>MALE-UAV / ENG-01</b></p></div>
      <EngineTwin telemetry={snapshot.telemetry} health={snapshot.health} />
      <section className="lower-grid"><div className="panel health-summary"><div className="panel-head"><div><p className="eyebrow">FLEET INTELLIGENCE</p><h3>Operational Assessment</h3></div><Activity size={19}/></div><div className="assessment"><div><span>REMAINING USEFUL LIFE</span><strong>{rul === '—' ? 'NOT AVAILABLE' : rul}</strong><small>{rul === '—' ? 'Awaiting model output' : 'Backend model estimate'}</small></div><div><span>MISSION RELIABILITY</span><strong>{reliability === '—' ? 'NOT AVAILABLE' : reliability}</strong><small>{reliability === '—' ? 'Awaiting mission service' : 'Backend mission estimate'}</small></div></div></div><div className="panel event-log"><div className="panel-head"><div><p className="eyebrow">SYSTEM EVENTS</p><h3>Live Event Log</h3></div><span className="quiet">STREAM</span></div><div className="empty-log"><WifiOff size={20}/><span>{state === 'connected' ? 'No events received' : 'Awaiting backend connection'}</span><small>Events are supplied by the simulation service.</small></div></div></section>
    </main></div>
}
export default App
