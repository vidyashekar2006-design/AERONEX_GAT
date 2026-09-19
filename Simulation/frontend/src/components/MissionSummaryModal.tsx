import React from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import {
  X,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  CheckCircle2,
  Gauge,
  Flame,
  Droplets,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Download,
} from 'lucide-react';

interface MissionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionSummaryModal: React.FC<MissionSummaryModalProps> = ({ isOpen, onClose }) => {
  const { missionSummary, telemetry } = useSimulation();

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCritical = missionSummary.finalStatus === 'CRITICAL' || missionSummary.criticalEvents > 0;
  const isWarning = missionSummary.finalStatus === 'WARNING' || missionSummary.warningEvents > 0;

  const downloadSummaryJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(missionSummary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aeronex_flight_summary_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="mission-summary-modal"
        className="relative w-full max-w-3xl rounded-xl border border-slate-700 bg-[#090e18] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                AERONEX DIGITAL TWIN — MISSION SUMMARY & DEBRIEF
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                TELEMETRY ENVELOPE RECORD & HEALTH REPORT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Status & Health Banner */}
          <div
            className={`rounded-lg p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isCritical
                ? 'bg-rose-950/40 border-rose-600/70 text-rose-200'
                : isWarning
                ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                : 'bg-cyan-950/30 border-cyan-700/60 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-black/30">
                {isCritical ? (
                  <ShieldX className="w-7 h-7 text-rose-400" />
                ) : isWarning ? (
                  <ShieldAlert className="w-7 h-7 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-cyan-400" />
                )}
              </div>
              <div>
                <div className="text-xs font-tech uppercase tracking-wider opacity-80">
                  FINAL HEALTH STATUS
                </div>
                <div className="text-xl font-bold font-tech">
                  {missionSummary.finalStatus} ({missionSummary.finalHealth}% Index)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <div className="opacity-75 uppercase font-tech text-[10px]">Warnings</div>
                <div className="text-base font-bold text-amber-400">
                  {missionSummary.warningEvents}
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <div className="opacity-75 uppercase font-tech text-[10px]">Critical Alerts</div>
                <div className="text-base font-bold text-rose-400">
                  {missionSummary.criticalEvents}
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <div className="opacity-75 uppercase font-tech text-[10px]">Phases Completed</div>
                <div className="text-base font-bold text-slate-100">
                  {missionSummary.phasesCompleted} / 9
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Telemetry Envelope Bounds */}
          <div className="space-y-2">
            <h3 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-400">
              TELEMETRY EXTREMA & ENVELOPE BOUNDARIES
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Mission Duration */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Mission Duration
                </div>
                <div className="text-lg font-mono font-bold text-slate-100">
                  {formatDuration(missionSummary.missionDuration)}
                </div>
              </div>

              {/* Phases Completed */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Phases Completed
                </div>
                <div className="text-lg font-mono font-bold text-slate-100">
                  {missionSummary.phasesCompleted} of 9
                </div>
              </div>

              {/* Min RPM */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Minimum RPM
                </div>
                <div className="text-lg font-mono font-bold text-slate-100">
                  {missionSummary.minRpm} RPM
                </div>
              </div>

              {/* Max RPM */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Maximum RPM
                </div>
                <div className="text-lg font-mono font-bold text-slate-100">
                  {missionSummary.maxRpm} RPM
                </div>
              </div>

              {/* Max CHT */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Maximum CHT
                </div>
                <div className={`text-lg font-mono font-bold ${missionSummary.maxCht > 135 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {missionSummary.maxCht.toFixed(1)}°C
                </div>
              </div>

              {/* Max EGT */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Maximum EGT
                </div>
                <div className={`text-lg font-mono font-bold ${missionSummary.maxEgt > 860 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {missionSummary.maxEgt.toFixed(1)}°C
                </div>
              </div>

              {/* Min Oil Pressure */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Minimum Oil Pressure
                </div>
                <div className={`text-lg font-mono font-bold ${missionSummary.minOilPressure < 2.3 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {missionSummary.minOilPressure.toFixed(2)} bar
                </div>
              </div>

              {/* Max Vibration */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-tech uppercase mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Maximum Vibration
                </div>
                <div className={`text-lg font-mono font-bold ${missionSummary.maxVibration > 3.5 ? 'text-amber-400' : 'text-slate-100'}`}>
                  {missionSummary.maxVibration.toFixed(2)} mm/s
                </div>
              </div>
            </div>
          </div>

          {/* Fault & Severity Record */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-tech uppercase text-slate-400">
                  Maximum Degradation Severity Injected
                </div>
                <div className="text-base font-mono font-bold text-slate-200">
                  {(missionSummary.maxDegradationSeverity * 100).toFixed(0)}% (
                  {missionSummary.maxDegradationSeverity.toFixed(2)})
                </div>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>Telemetry Mode: {telemetry.operating_mode}</div>
              <div>Final Altitude: {telemetry.altitude}m</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={downloadSummaryJSON}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-tech font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            EXPORT TELEMETRY RECORD (JSON)
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-tech font-bold transition cursor-pointer shadow-md"
          >
            CLOSE REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
