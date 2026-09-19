import React from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Flame,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const HealthPanel: React.FC = () => {
  const { health, telemetry } = useSimulation();

  const isCritical = health.status === 'CRITICAL';
  const isWarning = health.status === 'WARNING';
  const isNormal = health.status === 'NORMAL';

  // Calculate circular progress dash
  const strokeDash = 283; // 2 * pi * 45
  const strokeOffset = strokeDash - (strokeDash * health.health_index) / 100;

  const getThemeColors = () => {
    if (isCritical) {
      return {
        border: 'border-rose-600/80',
        bg: 'bg-rose-950/30',
        glow: 'shadow-rose-950/60',
        text: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        circle: '#f43f5e',
      };
    }
    if (isWarning) {
      return {
        border: 'border-amber-600/80',
        bg: 'bg-amber-950/30',
        glow: 'shadow-amber-950/60',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        circle: '#f59e0b',
      };
    }
    return {
      border: 'border-cyan-800/60',
      bg: 'bg-slate-900/40',
      glow: 'shadow-cyan-950/30',
      text: 'text-cyan-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      circle: '#06b6d4',
    };
  };

  const theme = getThemeColors();

  return (
    <div
      id="health-panel"
      className={`rounded-xl border ${theme.border} ${theme.bg} p-4 backdrop-blur-md transition-all duration-300 relative overflow-hidden`}
    >
      {/* Background Status Glow */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
        }`}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${
              isCritical
                ? 'bg-rose-500/20 text-rose-400'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-5 h-5 animate-bounce" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-400">
              ENGINE HEALTH
            </h2>
            <div className={`text-base font-bold font-tech tracking-wide ${theme.text}`}>
              {health.status}
            </div>
          </div>
        </div>

        {/* Operating Mode Pill */}
        <div className="text-right">
          <div className="text-[10px] uppercase font-tech text-slate-500 tracking-wider">
            Operating Mode
          </div>
          <div className="text-sm font-mono font-bold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80">
            {telemetry.operating_mode}
          </div>
        </div>
      </div>

      {/* Main Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Gauge Radial / Circular Meter */}
        <div className="flex items-center justify-center gap-3">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#1e293b"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={theme.circle}
                strokeWidth="7"
                fill="none"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * health.health_index) / 100}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono-num text-slate-100">
                {health.health_index}%
              </span>
              <span className="text-[9px] font-tech text-slate-400 tracking-wider">INDEX</span>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="text-[11px] font-tech text-slate-400 uppercase">Health Index</div>
            <div className="text-xs text-slate-300 font-mono">
              {health.health_index >= 90
                ? 'Optimal Envelope'
                : health.health_index >= 70
                ? 'Marginal Margin'
                : 'Degraded State'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Avail Perf:</span>
              <span className="font-mono font-bold text-slate-200">
                {telemetry.available_performance}%
              </span>
            </div>
          </div>
        </div>

        {/* Degradation Status Card */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-tech uppercase text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              Fault Injection / Degradation
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border ${
                telemetry.degradation_enabled
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {telemetry.degradation_enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <div className="mt-1">
            <div className="text-xs font-mono font-semibold text-slate-200">
              {telemetry.degradation_enabled
                ? telemetry.degradation_scenario.replace('_', ' ')
                : 'NONE'}
            </div>
            {telemetry.degradation_enabled && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="text-[10px] font-mono text-slate-400">Severity:</div>
                <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${telemetry.degradation_severity * 100}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-amber-300">
                  {(telemetry.degradation_severity * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Anomaly / Threshold Diagnostics */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex flex-col justify-between h-full">
          <span className="text-[11px] font-tech uppercase text-slate-400 flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Active Diagnostics
          </span>

          <div className="space-y-1 overflow-y-auto max-h-16">
            {health.active_criticals.length > 0 ? (
              health.active_criticals.map((crit, idx) => (
                <div
                  key={`crit-${idx}`}
                  className="text-[11px] font-mono text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1.5"
                >
                  <AlertOctagon className="w-3 h-3 text-rose-400 flex-shrink-0" />
                  <span className="truncate">{crit}</span>
                </div>
              ))
            ) : health.active_warnings.length > 0 ? (
              health.active_warnings.map((warn, idx) => (
                <div
                  key={`warn-${idx}`}
                  className="text-[11px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{warn}</span>
                </div>
              ))
            ) : (
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>All telemetry within nominal aero limits</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
