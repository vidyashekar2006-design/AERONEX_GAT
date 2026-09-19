import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { TelemetryParam } from '../../types';
import { AeronexSnapshot } from '../../services/websocket';

interface TelemetryViewProps {
  snapshot: AeronexSnapshot | null;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  snapshot
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState('all');

  const t = snapshot?.telemetry;

  const params: TelemetryParam[] = [
    {
      id: 'rpm',
      name: 'ENGINE SPEED',
      shortName: 'RPM',
      unit: 'RPM',
      value: t?.rpm ?? 0,
      min: 0,
      max: 5500,
      nominalRange: '800 – 5000 RPM',
      status: t && t.rpm > 5000 ? 'WARNING' : 'NORMAL',
      category: 'core',
      history: []
    },
    {
      id: 'cht',
      name: 'CYLINDER HEAD TEMP',
      shortName: 'CHT',
      unit: '°C',
      value: t?.cht ?? 0,
      min: 50,
      max: 180,
      nominalRange: '80 – 110 °C',
      status: t && t.cht > 120 ? 'WARNING' : 'NORMAL',
      category: 'thermal',
      history: []
    },
    {
      id: 'egt',
      name: 'EXHAUST GAS TEMP',
      shortName: 'EGT',
      unit: '°C',
      value: t?.egt ?? 0,
      min: 100,
      max: 750,
      nominalRange: '450 – 620 °C',
      status: t && t.egt > 600 ? 'WARNING' : 'NORMAL',
      category: 'thermal',
      history: []
    },
    {
      id: 'oil-temperature',
      name: 'OIL TEMPERATURE',
      shortName: 'OIL Temp',
      unit: '°C',
      value: t?.oil_temperature ?? 0,
      min: 30,
      max: 140,
      nominalRange: '60 – 105 °C',
      status: t && t.oil_temperature > 105 ? 'WARNING' : 'NORMAL',
      category: 'fluid',
      history: []
    },
    {
      id: 'oil-pressure',
      name: 'OIL PRESSURE',
      shortName: 'OIL Press',
      unit: 'bar',
      value: t?.oil_pressure ?? 0,
      min: 0,
      max: 7,
      nominalRange: '3 – 5 bar',
      status: t && t.oil_pressure < 2.5 ? 'WARNING' : 'NORMAL',
      category: 'fluid',
      history: []
    },
    {
      id: 'fuel-flow',
      name: 'FUEL FLOW',
      shortName: 'Fuel Flow',
      unit: 'L/h',
      value: t?.fuel_flow ?? 0,
      min: 0,
      max: 60,
      nominalRange: '0 – 60 L/h',
      status: 'NORMAL',
      category: 'fluid',
      history: []
    },
    {
      id: 'vibration',
      name: 'ENGINE VIBRATION',
      shortName: 'Vibration',
      unit: 'mm/s',
      value: t?.vibration ?? 0,
      min: 0,
      max: 1,
      nominalRange: '0.05 – 0.40 mm/s',
      status: t && t.vibration > 0.35 ? 'WARNING' : 'NORMAL',
      category: 'dynamics',
      history: []
    },
    {
      id: 'throttle',
      name: 'THROTTLE',
      shortName: 'Throttle',
      unit: '%',
      value: snapshot?.engine.throttle ?? 0,
      min: 0,
      max: 100,
      nominalRange: '0 – 100%',
      status: 'NORMAL',
      category: 'core',
      history: []
    },
    {
      id: 'altitude',
      name: 'ALTITUDE',
      shortName: 'Altitude',
      unit: 'm',
      value: snapshot?.environment.altitude ?? 0,
      min: 0,
      max: 15000,
      nominalRange: '0 – 15000 m',
      status: 'NORMAL',
      category: 'flight',
      history: []
    },
    {
      id: 'ambient-temperature',
      name: 'AMBIENT TEMPERATURE',
      shortName: 'Ambient Temp',
      unit: '°C',
      value: snapshot?.environment.ambient_temperature ?? 0,
      min: -60,
      max: 60,
      nominalRange: '-60 – 60 °C',
      status: 'NORMAL',
      category: 'flight',
      history: []
    }
  ];

  const categories = [
    { id: 'all', label: 'ALL PARAMETERS' },
    { id: 'core', label: 'CORE & MECHANICAL' },
    { id: 'thermal', label: 'THERMAL' },
    { id: 'fluid', label: 'FLUID & LUBRICATION' },
    { id: 'dynamics', label: 'DYNAMICS' },
    { id: 'flight', label: 'FLIGHT ENVELOPE' }
  ];

  const filtered =
    selectedCategory === 'all'
      ? params
      : params.filter(
          p => p.category === selectedCategory
        );

  return (
    <div className="space-y-4 font-mono">

      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              ENGINE TELEMETRY SUITE
            </h2>

            <p className="text-xs text-slate-400 font-sans">
              Live backend telemetry stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">
            BUS SAMPLING: 2 Hz
          </span>

          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            LIVE STREAM
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-[#0d1527] p-1.5 rounded-lg border border-slate-800">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded text-xs ${
              selectedCategory === cat.id
                ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(param => {
          const value =
            typeof param.value === 'number'
              ? param.value
              : Number(param.value) || 0;

          const percentage =
            ((value - param.min) /
              (param.max - param.min)) * 100;

          const pct = Math.max(
            0,
            Math.min(100, percentage)
          );

          const warning =
            param.status === 'WARNING';

          return (
            <div
              key={param.id}
              className={`bg-[#0d1527] border rounded-lg p-3.5 ${
                warning
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">
                  {param.name}
                </span>

                <span
                  className={`text-[10px] px-1.5 rounded ${
                    warning
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {param.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between my-2">
                <div>
                  <span
                    className={`text-2xl font-black ${
                      warning
                        ? 'text-amber-300'
                        : 'text-white'
                    }`}
                  >
                    {value.toFixed(
                      param.id === 'vibration' ||
                      param.id === 'oil-pressure'
                        ? 2
                        : 0
                    )}
                  </span>

                  <span className="text-xs text-slate-400 ml-1">
                    {param.unit}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400">
                  {param.nominalRange}
                </span>
              </div>

              <div className="w-full h-2 bg-slate-950 rounded overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${
                    warning
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>MIN {param.min}</span>
                <span>
                  CH: {param.id.toUpperCase()}
                </span>
                <span>MAX {param.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};