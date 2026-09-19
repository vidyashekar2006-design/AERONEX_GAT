import React, { useState } from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { LineChart as ChartIcon, Maximize2, Activity, Flame, Droplets, Gauge } from 'lucide-react';

export const TelemetryCharts: React.FC = () => {
  const { history, telemetry } = useSimulation();
  const [activeTab, setActiveTab] = useState<'ALL' | 'RPM' | 'THERMAL' | 'OIL' | 'VIB'>('ALL');

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b1120] border border-slate-700/90 rounded p-2 text-xs shadow-xl backdrop-blur-md">
          <div className="font-mono text-slate-400 mb-1 border-b border-slate-800 pb-0.5">
            MET: {label}
          </div>
          <div className="space-y-0.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-tech text-slate-300">{entry.name}:</span>
                </span>
                <span className="font-mono-num font-bold text-slate-100">
                  {entry.value} {entry.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="telemetry-charts-panel" className="space-y-2">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-300">
            REAL-TIME TELEMETRIC TIME SERIES
          </h2>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            10Hz STREAMING BUFFER
          </span>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-tech transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2x2 GRID
          </button>
          <button
            onClick={() => setActiveTab('RPM')}
            className={`px-2 py-0.5 rounded text-[11px] font-tech transition cursor-pointer ${
              activeTab === 'RPM'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RPM
          </button>
          <button
            onClick={() => setActiveTab('THERMAL')}
            className={`px-2 py-0.5 rounded text-[11px] font-tech transition cursor-pointer ${
              activeTab === 'THERMAL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CHT + EGT
          </button>
          <button
            onClick={() => setActiveTab('OIL')}
            className={`px-2 py-0.5 rounded text-[11px] font-tech transition cursor-pointer ${
              activeTab === 'OIL'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OIL SYS
          </button>
          <button
            onClick={() => setActiveTab('VIB')}
            className={`px-2 py-0.5 rounded text-[11px] font-tech transition cursor-pointer ${
              activeTab === 'VIB'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VIBRATION
          </button>
        </div>
      </div>

      {/* Grid of 4 Charts */}
      <div
        className={`grid gap-3 ${
          activeTab === 'ALL' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* CHART 1: RPM + THROTTLE */}
        {(activeTab === 'ALL' || activeTab === 'RPM') && (
          <div className="rounded-lg border border-slate-800 bg-[#090e18]/90 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-tech font-bold text-slate-200 tracking-wider">
                  1. ENGINE SPEED & THROTTLE
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-cyan-400">RPM: {telemetry.rpm}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">THR: {telemetry.throttle}%</span>
              </div>
            </div>

            <div className={activeTab === 'ALL' ? 'h-48' : 'h-72'}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} fontVariant="tabular-nums" />
                  <YAxis domain={[0, 6000]} stroke="#475569" fontSize={10} fontVariant="tabular-nums" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={5500} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'CAUTION', fill: '#f59e0b', fontSize: 9 }} />
                  <ReferenceLine y={5800} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'REDLINE', fill: '#ef4444', fontSize: 9 }} />
                  <Area
                    type="monotone"
                    dataKey="rpm"
                    name="RPM"
                    unit="RPM"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRpm)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: CHT + EGT (Dual Line Thermal) */}
        {(activeTab === 'ALL' || activeTab === 'THERMAL') && (
          <div className="rounded-lg border border-slate-800 bg-[#090e18]/90 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-tech font-bold text-slate-200 tracking-wider">
                  2. THERMAL PROFILES (CHT & EGT)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-amber-400">CHT: {telemetry.cht}°C</span>
                <span className="text-slate-500">|</span>
                <span className="text-rose-400">EGT: {telemetry.egt}°C</span>
              </div>
            </div>

            <div className={activeTab === 'ALL' ? 'h-48' : 'h-72'}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                  {/* Left Y Axis for CHT & EGT */}
                  <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={135} stroke="#f59e0b" strokeDasharray="2 2" />
                  <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="2 2" />
                  <Line
                    type="monotone"
                    dataKey="cht"
                    name="CHT"
                    unit="°C"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="egt"
                    name="EGT"
                    unit="°C"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: OIL TEMPERATURE + OIL PRESSURE */}
        {(activeTab === 'ALL' || activeTab === 'OIL') && (
          <div className="rounded-lg border border-slate-800 bg-[#090e18]/90 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-tech font-bold text-slate-200 tracking-wider">
                  3. LUBRICATION (OIL TEMP & PRESSURE)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-sky-400">P: {telemetry.oil_pressure} bar</span>
                <span className="text-slate-500">|</span>
                <span className="text-indigo-300">T: {telemetry.oil_temperature}°C</span>
              </div>
            </div>

            <div className={activeTab === 'ALL' ? 'h-48' : 'h-72'}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                  {/* Left Y Axis for Oil Temperature */}
                  <YAxis yAxisId="left" stroke="#818cf8" fontSize={10} domain={[40, 150]} />
                  {/* Right Y Axis for Oil Pressure */}
                  <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} domain={[0, 7]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="oil_temperature"
                    name="Oil Temp"
                    unit="°C"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="oil_pressure"
                    name="Oil Pressure"
                    unit="bar"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 4: MECHANICAL VIBRATION */}
        {(activeTab === 'ALL' || activeTab === 'VIB') && (
          <div className="rounded-lg border border-slate-800 bg-[#090e18]/90 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-tech font-bold text-slate-200 tracking-wider">
                  4. MECHANICAL VIBRATION (RMS)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className={telemetry.vibration > 4.5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {telemetry.vibration.toFixed(2)} mm/s
                </span>
                <span className="text-[10px] text-slate-500">ISO 10816 CRANKCASE</span>
              </div>
            </div>

            <div className={activeTab === 'ALL' ? 'h-48' : 'h-72'}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                  <YAxis domain={[0, 9]} stroke="#475569" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={3.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'WARN 3.5', fill: '#f59e0b', fontSize: 9 }} />
                  <ReferenceLine y={5.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'CRIT 5.5', fill: '#ef4444', fontSize: 9 }} />
                  <Area
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration"
                    unit="mm/s"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVib)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
