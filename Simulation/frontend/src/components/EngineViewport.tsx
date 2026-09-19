import React from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import { EngineCanvas } from './3d/EngineCanvas';

export const EngineViewport: React.FC = () => {
  const { telemetry, health, simulationState } = useSimulation();

  return (
    <div id="engine-digital-twin-container" className="w-full">
      <EngineCanvas
        telemetry={telemetry}
        health={health}
        simulationState={simulationState}
      />
    </div>
  );
};
