import React, { useState } from 'react';
import { SimulationProvider } from './simulation/simulationProvider';
import { Header } from './components/Header';
import { HealthPanel } from './components/HealthPanel';
import { EngineViewport } from './components/EngineViewport';
import { TelemetryGrid } from './components/TelemetryGrid';
import { TelemetryCharts } from './components/TelemetryCharts';
import { SimulationControls } from './components/SimulationControls';
import { MissionTimeline } from './components/MissionTimeline';
import { EventLog } from './components/EventLog';
import { MissionSummaryModal } from './components/MissionSummaryModal';
import { Cpu, Radio, Shield, Wrench, Layers } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-heading selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header onOpenSummary={() => setSummaryOpen(true)} />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-5">
        {/* Mission Timeline - Full Width Flight Profile */}
        <section aria-label="Mission Timeline">
          <MissionTimeline />
        </section>

        {/* Primary Operational Twin View: Visualization & Real-time Command & Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left / Center Column: Health Panel & 3D Interactive Aero Piston Hero Engine Viewport */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Prominent Engine Health Bar & Degradation Status */}
            <HealthPanel />

            {/* Central 3D Aero Piston Engine Digital Twin Hero */}
            <EngineViewport />
          </div>

          {/* Right Column: Command Console & Real-time Diagnostic Log */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            {/* Simulation & Flight Controls */}
            <SimulationControls />

            {/* Diagnostic Event Log */}
            <EventLog />
          </div>
        </div>

        {/* Live Telemetry Sensor Cards (11 Channels) */}
        <section aria-label="Live Telemetry Sensor Channels">
          <TelemetryGrid />
        </section>

        {/* Telemetric Time-Series Charts (Recharts: RPM, CHT+EGT, Oil System, Vibration) */}
        <section aria-label="Real-time Time Series Charts">
          <TelemetryCharts />
        </section>
      </main>

      {/* Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] px-4 py-3 text-xs text-slate-400 mt-6 font-mono">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-tech text-slate-300">AERONEX SIH 2026</span>
            <span className="text-slate-600">•</span>
            <span>AI-Enabled Digital Twin System for Aero Piston Engines</span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline">MALE UAV Fleet Class</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Radio className="w-3.5 h-3.5" />
              <span>Provider Abstraction: Ready for Python WebSocket (FastAPI)</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Mission Summary & Debrief Modal */}
      <MissionSummaryModal isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <DashboardContent />
    </SimulationProvider>
  );
}
