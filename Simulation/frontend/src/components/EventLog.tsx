import React, { useState } from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import {
  Terminal,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Trash2,
  Filter,
} from 'lucide-react';

export const EventLog: React.FC = () => {
  const { eventLog, clearEventLog } = useSimulation();
  const [filter, setFilter] = useState<'ALL' | 'WARNINGS' | 'CRITICAL' | 'INFO'>('ALL');

  const formatMet = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredEvents = eventLog.filter((entry) => {
    if (filter === 'ALL') return true;
    if (filter === 'WARNINGS') return entry.level === 'WARNING' || entry.level === 'CRITICAL';
    if (filter === 'CRITICAL') return entry.level === 'CRITICAL';
    if (filter === 'INFO') return entry.level === 'INFO' || entry.level === 'SUCCESS';
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SUCCESS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Info className="w-3 h-3 text-cyan-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div
      id="event-log-feed"
      className="rounded-xl border border-slate-800 bg-[#090e18]/95 p-4 backdrop-blur-md flex flex-col h-[340px]"
    >
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
            TELEMETRY DIAGNOSTIC & FLIGHT EVENT FEED
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-tech">
            {(['ALL', 'WARNINGS', 'INFO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={clearEventLog}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
            <Terminal className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
            <p className="text-xs font-tech">No events matching current filter criteria.</p>
          </div>
        ) : (
          filteredEvents.map((entry) => (
            <div
              key={entry.id}
              className={`p-2 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-colors ${
                entry.level === 'CRITICAL'
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  : entry.level === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                  : 'bg-slate-950/50 border-slate-800/70 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono-num text-cyan-400/90 font-bold">
                  [{formatMet(entry.met)}]
                </span>
                {getLevelBadge(entry.level)}
                <span className="text-slate-200 text-xs font-mono">{entry.message}</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-[10px] text-slate-400 font-tech">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {entry.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom status bar */}
      <div className="border-t border-slate-800/80 pt-2 mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>TOTAL EVENTS LOGGED: {eventLog.length}</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE STREAM LISTENER
        </span>
      </div>
    </div>
  );
};
