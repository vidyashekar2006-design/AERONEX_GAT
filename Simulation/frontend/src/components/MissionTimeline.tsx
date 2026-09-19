import React from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import {
  CheckCircle2,
  Navigation,
  Clock,
  ArrowRight,
  PlaneTakeoff,
  PlaneLanding,
  CloudSun,
  AlertTriangle,
  Flag,
} from 'lucide-react';

export const MissionTimeline: React.FC = () => {
  const { allPhases, currentPhaseIndex, jumpToPhase, telemetry } = useSimulation();

  const getPhaseIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Clock className="w-3.5 h-3.5" />;
      case 2:
        return <PlaneTakeoff className="w-3.5 h-3.5" />;
      case 5:
        return <Navigation className="w-3.5 h-3.5" />;
      case 6:
        return <CloudSun className="w-3.5 h-3.5" />;
      case 7:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 8:
        return <PlaneLanding className="w-3.5 h-3.5" />;
      case 9:
        return <Flag className="w-3.5 h-3.5" />;
      default:
        return <Navigation className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      id="mission-timeline-container"
      className="rounded-xl border border-slate-800 bg-[#090e18]/95 p-4 backdrop-blur-md space-y-3"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
            UAV MALE REPRESENTATIVE FLIGHT PROFILE (9 PHASES)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">ACTIVE:</span>
          <span className="text-cyan-400 font-bold font-tech uppercase">
            {allPhases[currentPhaseIndex]?.name}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono-num">
            ALT: {telemetry.altitude}m
          </span>
        </div>
      </div>

      {/* 9-Phase Responsive Stepper */}
      <div className="relative pt-2 pb-1 overflow-x-auto">
        <div className="flex items-center min-w-[760px] justify-between relative px-2">
          {/* Background Connecting Bar */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />

          {/* Active Progress Bar */}
          <div
            className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-400 z-0 transition-all duration-500"
            style={{
              width: `${(currentPhaseIndex / (allPhases.length - 1)) * 92}%`,
            }}
          />

          {allPhases.map((phase, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;
            const isUpcoming = idx > currentPhaseIndex;

            return (
              <div
                key={`phase-${phase.id}`}
                onClick={() => jumpToPhase(idx)}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
                title={`Click to jump to Phase ${phase.id}: ${phase.name}`}
              >
                {/* Node circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isCurrent
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 scale-110 shadow-lg shadow-cyan-500/30'
                      : isCompleted
                      ? 'bg-slate-900 border-cyan-600/80 text-cyan-400'
                      : 'bg-[#080d1a] border-slate-700/80 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <span className="text-xs font-mono font-bold">{phase.id}</span>
                  )}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-60 pointer-events-none" />
                  )}
                </div>

                {/* Phase Short Code & Name */}
                <div className="mt-2 text-center max-w-[80px]">
                  <div
                    className={`text-[10px] font-tech font-bold uppercase truncate transition-colors ${
                      isCurrent
                        ? 'text-cyan-300'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {phase.shortCode}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    {phase.targetAltitude > 0 ? `${(phase.targetAltitude / 1000).toFixed(1)}k m` : 'GND'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Detail Callout */}
      <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {getPhaseIcon(allPhases[currentPhaseIndex]?.id || 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-tech font-bold text-slate-200">
                PHASE {allPhases[currentPhaseIndex]?.id}: {allPhases[currentPhaseIndex]?.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                CURRENT WAYPOINT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {allPhases[currentPhaseIndex]?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-tech">Target Throttle</div>
            <div className="font-bold text-cyan-400">
              {allPhases[currentPhaseIndex]?.targetThrottle}%
            </div>
          </div>
          <div className="text-right border-l border-slate-800 pl-3">
            <div className="text-[10px] text-slate-400 uppercase font-tech">Target Ceiling</div>
            <div className="font-bold text-sky-400">
              {allPhases[currentPhaseIndex]?.targetAltitude.toLocaleString()} m
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
