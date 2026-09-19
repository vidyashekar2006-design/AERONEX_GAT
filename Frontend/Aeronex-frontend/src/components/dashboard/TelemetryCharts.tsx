import React, { useEffect, useMemo, useState } from 'react';
import { LineChart } from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface TelemetryChartsProps {
  snapshot: AeronexSnapshot | null;
}

interface ChartChannel {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  nominalBand: [number, number];
  getValue: (snapshot: AeronexSnapshot) => number;
}

const MAX_POINTS = 120;

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  snapshot,
}) => {
  const [selectedChannelId, setSelectedChannelId] =
    useState<string>('cht');

  const [history, setHistory] = useState<
    Record<string, number[]>
  >({});

  useEffect(() => {
    if (!snapshot) return;

    const values: Record<string, number> = {
      cht: snapshot.telemetry.cht,
      rpm: snapshot.telemetry.rpm,
      egt: snapshot.telemetry.egt,
      oilTemp: snapshot.telemetry.oil_temperature,
      oilPressure: snapshot.telemetry.oil_pressure,
      vibration: snapshot.telemetry.vibration,
    };

    setHistory(previous => {
      const next = { ...previous };

      Object.entries(values).forEach(([key, value]) => {
        if (!Number.isFinite(value)) return;

        const existing = next[key] ?? [];

        next[key] = [...existing, value].slice(
          -MAX_POINTS
        );
      });

      return next;
    });
  }, [snapshot]);

  const channels: ChartChannel[] = useMemo(
    () => [
      {
        id: 'cht',
        name: 'CYLINDER HEAD TEMP (CHT)',
        unit: '°C',
        min: 50,
        max: 180,
        nominalBand: [80, 110],
        getValue: s => s.telemetry.cht,
      },
      {
        id: 'rpm',
        name: 'ENGINE SPEED (RPM)',
        unit: 'RPM',
        min: 0,
        max: 5500,
        nominalBand: [800, 5000],
        getValue: s => s.telemetry.rpm,
      },
      {
        id: 'egt',
        name: 'EXHAUST GAS TEMP (EGT)',
        unit: '°C',
        min: 100,
        max: 750,
        nominalBand: [450, 620],
        getValue: s => s.telemetry.egt,
      },
      {
        id: 'oilTemp',
        name: 'OIL TEMPERATURE',
        unit: '°C',
        min: 30,
        max: 140,
        nominalBand: [60, 105],
        getValue: s => s.telemetry.oil_temperature,
      },
      {
        id: 'oilPressure',
        name: 'OIL PRESSURE',
        unit: 'bar',
        min: 0,
        max: 7,
        nominalBand: [3, 5],
        getValue: s => s.telemetry.oil_pressure,
      },
      {
        id: 'vibration',
        name: 'ENGINE VIBRATION (RMS)',
        unit: 'mm/s',
        min: 0,
        max: 1,
        nominalBand: [0.05, 0.4],
        getValue: s => s.telemetry.vibration,
      },
    ],
    []
  );

  const currentChannel =
    channels.find(
      channel => channel.id === selectedChannelId
    ) ?? channels[0];

  const dataset =
    history[currentChannel.id] ?? [];

  const currentValue = snapshot
    ? currentChannel.getValue(snapshot)
    : null;

  const svgWidth = 640;
  const svgHeight = 160;
  const padLeft = 46;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 26;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const yRange =
    currentChannel.max - currentChannel.min;

  const getY = (value: number) => {
    const clamped = Math.max(
      currentChannel.min,
      Math.min(currentChannel.max, value)
    );

    return (
      padTop +
      chartH -
      ((clamped - currentChannel.min) / yRange) *
        chartH
    );
  };

  const points =
    dataset.length > 1
      ? dataset
          .map((value, index) => {
            const x =
              padLeft +
              (index / (dataset.length - 1)) *
                chartW;

            const y = getY(value);

            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '';

  const latestValue =
    dataset.length > 0
      ? dataset[dataset.length - 1]
      : currentValue;

  const latestY =
    latestValue !== null &&
    latestValue !== undefined
      ? getY(latestValue)
      : null;

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-cyan-400" />

          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            TELEMETRY TIME-SERIES PROFILES
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            LIVE DATA
          </span>

          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            2 Hz
          </span>
        </div>
      </div>

      {/* Channel selector */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {channels.map(channel => {
          const isSelected =
            channel.id === selectedChannelId;

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() =>
                setSelectedChannelId(channel.id)
              }
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                isSelected
                  ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {channel.id === 'oilTemp'
                ? 'OIL TEMP'
                : channel.id === 'oilPressure'
                  ? 'OIL PRESS'
                  : channel.id.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-[#0a101d] p-2 rounded border border-slate-800/90 relative overflow-hidden">
        {/* Current value */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-800/60 text-xs">
          <div>
            <span className="text-slate-400 text-[10px]">
              {currentChannel.name}
            </span>

            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white">
                {currentValue !== null &&
                Number.isFinite(currentValue)
                  ? currentValue.toFixed(
                      currentChannel.id ===
                        'vibration'
                        ? 2
                        : currentChannel.id ===
                            'oilPressure'
                          ? 2
                          : 0
                    )
                  : 'N/A'}
              </span>

              <span className="text-[10px] text-slate-400">
                {currentChannel.unit}
              </span>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 space-y-0.5">
            <div>
              NOMINAL:{' '}
              {currentChannel.nominalBand[0]} –{' '}
              {currentChannel.nominalBand[1]}{' '}
              {currentChannel.unit}
            </div>

            <div>
              WINDOW: LAST {dataset.length} SAMPLES
            </div>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto mt-2 overflow-visible"
        >
          {/* Y grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(
            (pct, index) => {
              const y =
                padTop + pct * chartH;

              const value =
                currentChannel.max -
                pct * yRange;

              return (
                <g key={index}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />

                  <text
                    x={padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {value.toFixed(
                      value < 10 ? 1 : 0
                    )}
                  </text>
                </g>
              );
            }
          )}

          {/* Time axis */}
          {[0, 0.25, 0.5, 0.75, 1].map(
            (pct, index) => {
              const x =
                padLeft + pct * chartW;

              return (
                <g key={index}>
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + chartH}
                    stroke="#1e293b"
                    strokeDasharray="2 4"
                    strokeWidth="0.6"
                  />

                  <text
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {index === 4
                      ? 'NOW'
                      : `-${(4 - index) * 30}s`}
                  </text>
                </g>
              );
            }
          )}

          {/* Nominal band */}
          {(() => {
            const top = getY(
              currentChannel.nominalBand[1]
            );

            const bottom = getY(
              currentChannel.nominalBand[0]
            );

            return (
              <rect
                x={padLeft}
                y={Math.min(top, bottom)}
                width={chartW}
                height={Math.abs(bottom - top)}
                fill="#10b981"
                fillOpacity="0.06"
              />
            );
          })()}

          {/* Live line */}
          {points && (
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Latest point */}
          {latestY !== null && (
            <circle
              cx={padLeft + chartW}
              cy={latestY}
              r="3.5"
              fill="#38bdf8"
              stroke="#0a101d"
              strokeWidth="1.5"
            />
          )}
        </svg>

        <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 px-2 pt-1 border-t border-slate-800/60">
          <span>
            SAMPLING: 2 Hz (LIVE ROLLING BUFFER)
          </span>

          <span>
            CH: FADEC-A-{currentChannel.id.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};