import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Monitor,
  Box,
  Activity,
  Cpu,
} from 'lucide-react';

interface SettingsViewProps {
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  connected: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  autoRotate,
  onToggleAutoRotate,
  connected,
}) => {
  const [antialiasing, setAntialiasing] = useState(true);

  return (
    <div className="space-y-4 font-mono select-none max-w-4xl">

      {/* HEADER */}
      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <SettingsIcon className="w-5 h-5" />
          </div>

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-base font-bold text-white tracking-wide">
                PLATFORM CONFIGURATION
              </h2>

              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE SYSTEM
              </span>

            </div>

            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Client visualization preferences and backend connection state
            </p>

          </div>

        </div>

        <div className="text-xs text-slate-400">

          BACKEND:{' '}

          <span
            className={`font-bold ${
              connected
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>

        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* DIGITAL TWIN */}

        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">

            <Box className="w-4 h-4 text-cyan-400" />

            <h3 className="text-xs font-bold text-slate-200 uppercase">
              DIGITAL TWIN
            </h3>

          </div>

          <div className="space-y-3 text-xs">

            {/* AUTO ROTATE */}

            <div className="flex items-center justify-between gap-3">

              <div>

                <div className="font-bold text-slate-200">
                  Auto Rotate
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Continuous rotation in the 3D engine viewport
                </div>

              </div>

              <button
                type="button"
                onClick={onToggleAutoRotate}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  autoRotate
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {autoRotate ? 'ON' : 'OFF'}
              </button>

            </div>


            {/* ANTIALIASING */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5">

              <div>

                <div className="font-bold text-slate-200">
                  Anti-Aliasing
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Smooths edges and fine engine geometry
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setAntialiasing(prev => !prev)
                }
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  antialiasing
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {antialiasing
                  ? 'ENABLED'
                  : 'DISABLED'}
              </button>

            </div>


            {/* CAMERA */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5">

              <div>

                <div className="font-bold text-slate-200">
                  Camera Field of View
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Default perspective used by the 3D viewport
                </div>

              </div>

              <span className="text-cyan-400 font-bold">
                42°
              </span>

            </div>

          </div>

        </div>


        {/* TELEMETRY */}

        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">

            <Activity className="w-4 h-4 text-cyan-400" />

            <h3 className="text-xs font-bold text-slate-200 uppercase">
              TELEMETRY
            </h3>

          </div>

          <div className="space-y-3 text-xs">

            {/* STREAM */}

            <div className="flex items-center justify-between gap-3">

              <div>

                <div className="font-bold text-slate-200">
                  Telemetry Stream
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Simulator → Backend → ML → Dashboard
                </div>

              </div>

              <span
                className={`px-2.5 py-1 rounded border font-bold ${
                  connected
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {connected ? 'LIVE' : 'OFFLINE'}
              </span>

            </div>


            {/* TRANSPORT */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5">

              <div>

                <div className="font-bold text-slate-200">
                  Data Transport
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  HTTP ingestion + WebSocket dashboard stream
                </div>

              </div>

              <span className="text-cyan-300 font-bold">
                ACTIVE
              </span>

            </div>


            {/* SOURCE */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5">

              <div>

                <div className="font-bold text-slate-200">
                  Data Source
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Standalone simulator telemetry
                </div>

              </div>

              <span className="text-slate-300 font-bold">
                SIMULATOR
              </span>

            </div>

          </div>

        </div>


        {/* DISPLAY */}

        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">

            <Monitor className="w-4 h-4 text-cyan-400" />

            <h3 className="text-xs font-bold text-slate-200 uppercase">
              DISPLAY
            </h3>

          </div>

          <div className="space-y-3 text-xs">

            {/* THEME */}

            <div className="flex items-center justify-between gap-3">

              <div>

                <div className="font-bold text-slate-200">
                  Theme
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  High-contrast aerospace interface
                </div>

              </div>

              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                DARK AEROSPACE
              </span>

            </div>


            {/* CALLOUTS */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5">

              <div>

                <div className="font-bold text-slate-200">
                  Coordinate Callouts
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Engineering markers and subsystem overlays
                </div>

              </div>

              <span className="text-emerald-400 font-bold">
                ENABLED
              </span>

            </div>


            {/* LIVE INDICATORS */}

            <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 pt-2.5">

              <div>

                <div className="font-bold text-slate-200">
                  Live Indicators
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  Connection and telemetry state indicators
                </div>

              </div>

              <span className="text-emerald-400 font-bold">
                ENABLED
              </span>

            </div>

          </div>

        </div>


        {/* SYSTEM */}

        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">

            <Cpu className="w-4 h-4 text-cyan-400" />

            <h3 className="text-xs font-bold text-slate-200 uppercase">
              SYSTEM
            </h3>

          </div>

          <div className="space-y-2 text-xs">

            <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-800/60">

              <span className="text-slate-400">
                PRODUCT:
              </span>

              <span className="text-white font-bold text-right">
                AERONEX DIGITAL TWIN
              </span>

            </div>


            <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-800/60">

              <span className="text-slate-400">
                TEAM:
              </span>

              <span className="text-slate-200 font-semibold text-right">
                AETHERIS
              </span>

            </div>


            <div className="flex items-center justify-between gap-3 py-1 border-b border-slate-800/60">

              <span className="text-slate-400">
                PROBLEM:
              </span>

              <span className="text-cyan-400 font-bold">
                SIH26054
              </span>

            </div>


            <div className="flex items-center justify-between gap-3 py-1">

              <span className="text-slate-400">
                MODE:
              </span>

              <span
                className={`font-bold text-right ${
                  connected
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}
              >
                {connected
                  ? 'LIVE BACKEND'
                  : 'BACKEND OFFLINE'}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};