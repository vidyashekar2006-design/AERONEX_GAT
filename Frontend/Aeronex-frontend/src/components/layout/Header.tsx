import React from 'react';
import { ShieldCheck, Radio } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  lastUpdate: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  lastUpdate,
}) => {
  return (
    <header className="w-full bg-[#0b1322] border-b border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 select-none z-30 sticky top-0">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded bg-slate-900 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-mono font-black text-sm tracking-tighter mr-2 shadow-inner">
              AN
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl font-black tracking-wider text-white">
                  AERONEX
                </span>

                <span className="hidden sm:inline-block font-mono text-[10px] tracking-widest text-cyan-400/90 font-medium px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  DIGITAL TWIN
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans tracking-tight">
                Smarter Engines. Safer Missions.
              </p>
            </div>
          </div>
        </div>

        {/* SIH / Team */}
        <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="text-slate-200 font-semibold">
            AETHERIS
          </span>

          <span className="text-slate-400">•</span>

          <span>SIH 2026</span>

          <span className="text-slate-400">•</span>

          <span className="text-cyan-400 font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
            PS: SIH26054
          </span>
        </div>
      </div>

      {/* Live Backend State */}
      <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
        {connected ? (
          <>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />

            <span className="font-mono text-[10px] tracking-wider text-emerald-400 uppercase">
              LIVE BACKEND
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />

            <span className="font-mono text-[10px] tracking-wider text-amber-300 uppercase">
              BACKEND OFFLINE
            </span>
          </>
        )}
      </div>

      {/* Right Header */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Connection indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            connected
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />

          <span className="font-bold tracking-wider text-[11px]">
            {connected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* System State */}
        <div className="hidden sm:flex flex-col items-end text-[11px] leading-tight">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-slate-400">
              System:
            </span>

            <span
              className={`font-semibold flex items-center gap-1 ${
                connected
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />

              {connected ? 'LIVE' : 'WAITING'}
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            Last Update:{' '}
            <span className="text-slate-200">
              {lastUpdate
                ? new Date(lastUpdate).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Team Identification */}
        <div className="hidden md:flex flex-col items-end border-l border-slate-800 pl-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            TEAM
          </span>

          <span className="font-semibold text-slate-200 tracking-wide">
            AETHERIS
          </span>
        </div>
      </div>
    </header>
  );
};