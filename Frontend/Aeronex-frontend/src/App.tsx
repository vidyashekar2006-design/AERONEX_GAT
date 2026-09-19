import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DigitalTwinView } from './components/digital-twin/DigitalTwinView';
import { TelemetryView } from './components/telemetry/TelemetryView';
import { HealthAlertsView } from './components/health-alerts/HealthAlertsView';
import { AnalysisView } from './components/analysis/AnalysisView';
import { MissionView } from './components/mission/MissionView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { useAeronexLiveData } from './hooks/useAeronexLiveData';

export default function App() {
  const [activeTab, setActiveTab] =
    useState<NavigationTab>('dashboard');

  const [showIntro, setShowIntro] =
    useState(true);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [autoRotate, setAutoRotate] =
    useState(true);

  const { snapshot, connected } =
    useAeronexLiveData();

  const toggleAutoRotate = () => {
    setAutoRotate(prev => !prev);
  };

  const handleIntroEnd = () => {
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <video
            autoPlay
            muted
            playsInline
            onEnded={handleIntroEnd}
            className="w-full h-full object-cover"
          >
            <source
              src="/animations/aeronex-intro.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      )}

      <div className="min-h-screen bg-[#080d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
        {/* AERONEX Global Header */}
        <Header
          connected={connected}
          lastUpdate={snapshot?.timestamp ?? null}
        />

        {/* Main Workspace Layout */}
        <div className="flex-1 flex w-full relative">
          {/* Engineering Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() =>
              setSidebarCollapsed(prev => !prev)
            }
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 overflow-y-auto max-w-[1920px] mx-auto w-full">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigateToTab={setActiveTab}
                snapshot={snapshot}
              />
            )}

            {activeTab === 'digital-twin' && (
              <DigitalTwinView
                snapshot={snapshot}
              />
            )}

            {activeTab === 'telemetry' && (
              <TelemetryView
                snapshot={snapshot}
              />
            )}

            {activeTab === 'health-alerts' && (
              <HealthAlertsView
                snapshot={snapshot}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisView
                snapshot={snapshot}
              />
            )}

            {activeTab === 'mission' && (
              <MissionView
                snapshot={snapshot}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                autoRotate={autoRotate}
                onToggleAutoRotate={toggleAutoRotate}
                connected={connected}
              />
            )}

            {/* Persistent Footer */}
            <footer className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2 select-none">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />

                <span>
                  AERONEX // AERO PISTON ENGINE HEALTH & DIGITAL TWIN PROTOTYPE
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  TEAM AETHERIS
                </span>

                <span>•</span>

                <span>
                  SIH 2026 (PS: SIH26054)
                </span>

                <span>•</span>

                <span
                  className={`font-semibold ${
                    connected
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {connected
                    ? 'LIVE BACKEND DATA'
                    : 'BACKEND DISCONNECTED'}
                </span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}