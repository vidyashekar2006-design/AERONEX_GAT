import React from 'react';
import { DigitalTwinPanel } from './DigitalTwinPanel';
import { HealthPanel } from './HealthPanel';
import { TelemetryGrid } from './TelemetryGrid';
import { MissionPanel } from './MissionPanel';
import { AlertPanel } from './AlertPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { TelemetryCharts } from './TelemetryCharts';
import { DegradationPanel } from './DegradationPanel';
import { AeronexSnapshot } from '../../services/websocket';

interface DashboardViewProps {
  onNavigateToTab: (tab: any) => void;
  snapshot: AeronexSnapshot | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  snapshot,
}) => {
  return (
    <div className="space-y-4 font-mono select-none">
      {/* PRIMARY ARCHITECTURAL SECTION:
          3D DIGITAL TWIN + HEALTH & DEGRADATION */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        {/* Large 3D Digital Twin */}
        <div className="xl:col-span-3">
          <DigitalTwinPanel
            onNavigateToTwinDetail={() =>
              onNavigateToTab('digital-twin')
            }
            snapshot={snapshot}
          />
        </div>

        {/* Engine Health + Degradation */}
        <div className="space-y-4 flex flex-col justify-between">
          <HealthPanel snapshot={snapshot} />

          <DegradationPanel snapshot={snapshot} />
        </div>
      </div>

      {/* PRIMARY TELEMETRY */}
      <div>
        <TelemetryGrid snapshot={snapshot} />
      </div>

      {/* MISSION + ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2">
          <MissionPanel snapshot={snapshot} />
        </div>

        <div>
          <AlertPanel snapshot={snapshot} />
        </div>
      </div>

      {/* AI / ENGINEERING ANALYSIS */}
      <div>
        <AnalysisPanel snapshot={snapshot} />
      </div>

      {/* TELEMETRY TIME SERIES */}
      <div>
        <TelemetryCharts snapshot={snapshot} />
      </div>
    </div>
  );
};