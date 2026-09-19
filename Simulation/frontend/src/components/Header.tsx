import React from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Radio,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Gauge,
  Cpu,
} from 'lucide-react';

interface HeaderProps {
  onOpenSummary: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSummary }) => {
  const {
    telemetry,
    health,
    simulationState,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    connectionMode,
  } = useSimulation();

  // Format Mission Elapsed Time (MET) as HH:MM:SS
  const formatMET = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (simulationState === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tech font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-600/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          SIMULATION ACTIVE
        </span>
      );
    }
    if (simulationState === 'PAUSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tech font-semibold bg-amber-950/80 text-amber-400 border border-amber-600/40">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          SIMULATION PAUSED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tech font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        STOPPED
      </span>
    );
  };

  const getHealthBadge = () => {
    if (health.status === 'CRITICAL') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tech font-bold bg-rose-950/90 text-rose-300 border border-rose-600/60 shadow-lg shadow-rose-950/50 animate-pulse">
          <ShieldX className="w-3.5 h-3.5 text-rose-400" />
          CRITICAL ALERT
        </div>
      );
    }
    if (health.status === 'WARNING') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tech font-bold bg-amber-950/90 text-amber-300 border border-amber-600/60 shadow-lg shadow-amber-950/50">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          WARNING
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-tech font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        NOMINAL HEALTH
      </div>
    );
  };

  return (
    <header className="relative z-30 bg-[#090d16]/95 border-b border-slate-800/80 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Brand & System Identification */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-lg bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-inner shadow-cyan-500/10">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-slate-100 font-tech flex items-center gap-2">
                AERONEX
                <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SIH 2026
                </span>
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 font-tech tracking-widest uppercase flex items-center gap-2">
              <span>DIGITAL TWIN ENGINE MONITORING SYSTEM</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-500/90 font-mono text-[11px]">MALE UAV AERO PISTON</span>
            </p>
          </div>
        </div>

        {/* Tactical Telemetry Ribbon & Mission Info */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Mission Name Tag */}
          <div className="px-3 py-1.5 rounded bg-slate-900/90 border border-slate-800/90 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-tech uppercase tracking-wider">Mission Target</div>
              <div className="text-xs font-semibold text-slate-200 font-mono">TAPAS-09 RECONNAISSANCE</div>
            </div>
          </div>

          {/* Simulation Time MET */}
          <div className="px-3 py-1.5 rounded bg-slate-900/90 border border-slate-800/90 flex items-center gap-2">
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-tech uppercase tracking-wider">Simulation MET</div>
              <div className="text-xs font-bold text-cyan-400 font-mono-num tracking-wide">
                T+ {formatMET(telemetry.mission_elapsed_time)}
              </div>
            </div>
          </div>

          {/* Connection Indicator */}
          <div className="px-3 py-1.5 rounded bg-slate-900/90 border border-slate-800/90 flex items-center gap-2" title="Architecture configured with clean provider layer for direct FastAPI/WebSocket integration">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-tech uppercase tracking-wider">Interface Link</div>
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                DIGITAL TWIN ENGINE
                <span className="text-[9px] px-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  READY
                </span>
              </div>
            </div>
          </div>

          {/* Health Status Indicator */}
          {getHealthBadge()}

          {/* Controls toolbar */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
            {simulationState === 'RUNNING' ? (
              <button
                id="btn-pause-sim"
                onClick={pauseSimulation}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-tech font-semibold transition cursor-pointer"
                title="Pause Simulation"
              >
                <Pause className="w-3.5 h-3.5" />
                PAUSE
              </button>
            ) : (
              <button
                id="btn-start-sim"
                onClick={startSimulation}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-tech font-semibold transition cursor-pointer"
                title="Start / Resume Simulation"
              >
                <Play className="w-3.5 h-3.5" />
                START
              </button>
            )}

            <button
              id="btn-reset-sim"
              onClick={resetSimulation}
              className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-slate-100 transition cursor-pointer"
              title="Reset Engine Digital Twin"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-open-summary"
              onClick={onOpenSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 text-xs font-tech font-semibold transition cursor-pointer shadow-sm"
              title="View Mission Summary & Analytics"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              SUMMARY
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
