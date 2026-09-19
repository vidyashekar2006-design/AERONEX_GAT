import React from 'react';
import { TelemetryParam } from '../../types';
import { Activity } from 'lucide-react';

interface TelemetryGridProps {
  snapshot: {
    telemetry: {
      rpm: number;
      cht: number;
      egt: number;
      oil_temperature: number;
      oil_pressure: number;
      fuel_flow: number;
      vibration: number;
    };
    engine: {
      throttle: number;
      operating_mode: string;
    };
    environment: {
      altitude: number;
      ambient_temperature: number;
    };
  } | null;
}

type TelemetryStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

const getTelemetryStatus = (
  value: number,
  min: number,
  max: number
): TelemetryStatus => {
  if (!Number.isFinite(value)) {
    return 'CRITICAL';
  }

  if (value < min || value > max) {
    return 'CRITICAL';
  }

  return 'NORMAL';
};

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  snapshot,
}) => {
  const params: TelemetryParam[] = snapshot
    ? [
        {
          id: 'rpm',
          name: 'Engine RPM',
          shortName: 'RPM',
          value: snapshot.telemetry.rpm,
          unit: 'RPM',
          min: 800,
          max: 5000,
          status: getTelemetryStatus(
            snapshot.telemetry.rpm,
            800,
            5000
          ),
          history: [],
          category: 'core',
          nominalRange: '800–5000',
        },
        {
          id: 'cht',
          name: 'Cylinder Head Temperature',
          shortName: 'CHT',
          value: snapshot.telemetry.cht,
          unit: '°C',
          min: 60,
          max: 180,
          status: getTelemetryStatus(
            snapshot.telemetry.cht,
            60,
            180
          ),
          history: [],
          category: 'thermal',
          nominalRange: '60–180',
        },
        {
          id: 'egt',
          name: 'Exhaust Gas Temperature',
          shortName: 'EGT',
          value: snapshot.telemetry.egt,
          unit: '°C',
          min: 150,
          max: 700,
          status: getTelemetryStatus(
            snapshot.telemetry.egt,
            150,
            700
          ),
          history: [],
          category: 'thermal',
          nominalRange: '150–700',
        },
        {
          id: 'oil_temperature',
          name: 'Oil Temperature',
          shortName: 'OIL TEMP',
          value: snapshot.telemetry.oil_temperature,
          unit: '°C',
          min: 40,
          max: 120,
          status: getTelemetryStatus(
            snapshot.telemetry.oil_temperature,
            40,
            120
          ),
          history: [],
          category: 'fluid',
          nominalRange: '40–120',
        },
        {
          id: 'oil_pressure',
          name: 'Oil Pressure',
          shortName: 'OIL PRESS',
          value: snapshot.telemetry.oil_pressure,
          unit: 'bar',
          min: 2,
          max: 6,
          status: getTelemetryStatus(
            snapshot.telemetry.oil_pressure,
            2,
            6
          ),
          history: [],
          category: 'fluid',
          nominalRange: '2–6',
        },
        {
          id: 'fuel_flow',
          name: 'Fuel Flow',
          shortName: 'FUEL FLOW',
          value: snapshot.telemetry.fuel_flow,
          unit: 'L/h',
          min: 0,
          max: 60,
          status: getTelemetryStatus(
            snapshot.telemetry.fuel_flow,
            0,
            60
          ),
          history: [],
          category: 'fluid',
          nominalRange: '0–60',
        },
        {
          id: 'vibration',
          name: 'Engine Vibration',
          shortName: 'VIBRATION',
          value: snapshot.telemetry.vibration,
          unit: 'g',
          min: 0,
          max: 1,
          status: getTelemetryStatus(
            snapshot.telemetry.vibration,
            0,
            1
          ),
          history: [],
          category: 'dynamics',
          nominalRange: '0–1',
        },
        {
          id: 'throttle',
          name: 'Throttle',
          shortName: 'THROTTLE',
          value: snapshot.engine.throttle,
          unit: '%',
          min: 0,
          max: 100,
          status: getTelemetryStatus(
            snapshot.engine.throttle,
            0,
            100
          ),
          history: [],
          category: 'core',
          nominalRange: '0–100',
        },
        {
          id: 'altitude',
          name: 'Altitude',
          shortName: 'ALTITUDE',
          value: snapshot.environment.altitude,
          unit: 'm',
          min: 0,
          max: 15000,
          status: getTelemetryStatus(
            snapshot.environment.altitude,
            0,
            15000
          ),
          history: [],
          category: 'flight',
          nominalRange: '0–15000',
        },
        {
          id: 'ambient_temperature',
          name: 'Ambient Temperature',
          shortName: 'AMBIENT',
          value: snapshot.environment.ambient_temperature,
          unit: '°C',
          min: -60,
          max: 60,
          status: getTelemetryStatus(
            snapshot.environment.ambient_temperature,
            -60,
            60
          ),
          history: [],
          category: 'flight',
          nominalRange: '-60–60',
        },
      ]
    : [];

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />

          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            PRIMARY POWERPLANT TELEMETRY
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            LIVE TELEMETRY
          </span>

          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            BACKEND DATA
          </span>
        </div>
      </div>

      {/* Telemetry cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {params.map((param) => {
          const isWarning = param.status === 'WARNING';
          const isCritical = param.status === 'CRITICAL';

          return (
            <div
              key={param.id}
              className={`bg-[#0a101d] p-2.5 rounded border transition-colors ${
                isCritical
                  ? 'border-red-500/50 bg-red-950/10'
                  : isWarning
                    ? 'border-amber-500/50 bg-amber-950/10'
                    : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Parameter name + status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span className="font-semibold truncate">
                  {param.shortName}
                </span>

                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isCritical
                      ? 'text-red-400 bg-red-500/15'
                      : isWarning
                        ? 'text-amber-400 bg-amber-500/15'
                        : 'text-emerald-400 bg-emerald-500/10'
                  }`}
                >
                  {param.status}
                </span>
              </div>

              {/* Main value */}
              <div className="flex items-baseline justify-between mt-1">
                <div className="flex items-baseline gap-1 min-w-0">
                  <span
                    className={`font-mono text-xl font-black tracking-tight ${
                      isCritical
                        ? 'text-red-300'
                        : isWarning
                          ? 'text-amber-300'
                          : 'text-white'
                    }`}
                  >
                    {Number.isFinite(param.value)
                      ? param.value
                      : '—'}
                  </span>

                  <span className="font-mono text-[10px] text-slate-400 font-medium">
                    {param.unit}
                  </span>
                </div>
              </div>

              {/* Nominal range */}
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>
                  BAND: {param.nominalRange}
                </span>

                <span className="text-slate-500 font-sans">
                  LIVE
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!snapshot && (
        <div className="py-8 text-center">
          <div className="font-mono text-xs text-slate-500">
            WAITING FOR BACKEND TELEMETRY...
          </div>

          <div className="mt-1 font-mono text-[10px] text-slate-600">
            CONNECTING TO AERONEX TELEMETRY STREAM
          </div>
        </div>
      )}
    </div>
  );
};