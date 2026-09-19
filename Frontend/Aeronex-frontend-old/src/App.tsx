import { useState } from 'react'
import { useSimulation } from './hooks/useSimulation'

import { Header } from './components/layout/Header'
import { Sidebar, type Page } from './components/layout/Sidebar'

import { Dashboard } from './pages/Dashboard'
import { DigitalTwin } from './pages/DigitalTwin'
import { LiveTelemetry } from './pages/LiveTelemetry'
import { HealthAlerts } from './pages/HealthAlerts'
import { Analysis } from './pages/Analysis'
import { Mission } from './pages/Mission'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

export default function App() {
  const [active, setActive] = useState<Page>('Dashboard')

  const sim = useSimulation()

  // Wait until the first WebSocket snapshot arrives
  if (!sim.snapshot) {
    return (
      <div className="app flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Connecting to Aeronex...
          </div>

          <div className="text-sm opacity-70">
            Waiting for live simulator telemetry
          </div>
        </div>
      </div>
    )
  }

  const page =
    active === 'Dashboard' ? (
      <Dashboard sim={sim} />
    ) : active === 'Digital Twin' ? (
      <DigitalTwin sim={sim} />
    ) : active === 'Live Telemetry' ? (
      <LiveTelemetry sim={sim} />
    ) : active === 'Health & Alerts' ? (
      <HealthAlerts sim={sim} />
    ) : active === 'Analysis' ? (
      <Analysis sim={sim} />
    ) : active === 'Mission' ? (
      <Mission sim={sim} />
    ) : active === 'Reports' ? (
      <Reports />
    ) : (
      <Settings />
    )

  return (
    <div className="app">
      <Header
        lastUpdate={new Date(
          sim.snapshot.timestamp
        ).toLocaleTimeString()}
      />

      <Sidebar
        active={active}
        onChange={setActive}
      />

      <main>{page}</main>
    </div>
  )
}