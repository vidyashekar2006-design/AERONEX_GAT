import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AeroPistonEngineModel, Engine3DOptions } from './AeroPistonEngineModel';
import { TelemetryData, HealthReport, SimulationState } from '../../simulation/types';
import {
  RotateCcw,
  Eye,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  AlertTriangle,
  Flame,
  Activity,
  Droplets,
  Layers,
  Compass,
} from 'lucide-react';

interface EngineCanvasProps {
  telemetry: TelemetryData;
  health: HealthReport;
  simulationState?: SimulationState;
}

export const EngineCanvas: React.FC<EngineCanvasProps> = ({
  telemetry,
  health,
  simulationState = 'RUNNING',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for live telemetry in 60fps render loop without triggering React re-renders
  const telemetryRef = useRef<TelemetryData>(telemetry);
  const healthRef = useRef<HealthReport>(health);
  const simulationStateRef = useRef<SimulationState>(simulationState);
  telemetryRef.current = telemetry;
  healthRef.current = health;
  simulationStateRef.current = simulationState;

  // Viewport states
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cutawayMode, setCutawayMode] = useState(false);
  const [subsystemFocus, setSubsystemFocus] = useState<'ALL' | 'THERMAL' | 'LUBE' | 'MECHANICAL'>('ALL');
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  // Controls & Camera references
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const engineModelRef = useRef<AeroPistonEngineModel | null>(null);

  // Reset to initial state when simulation transitions to STOPPED
  useEffect(() => {
    if (simulationState === 'STOPPED' && engineModelRef.current) {
      engineModelRef.current.reset();
    }
  }, [simulationState]);

  // Default camera 3/4 engineering perspective (centered and prominently filling viewport)
  const DEFAULT_CAM_POS = new THREE.Vector3(5.6, 3.8, 6.4);
  const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0.2);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.copy(DEFAULT_CAM_POS);
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.update();
    }
  }, []);

  // Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check WebGL availability
    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
      setWebglSupported(true);
    } catch {
      setWebglSupported(false);
      return;
    }

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);

    // Subtle distant background fog to prevent abrupt clipping without darkening the engine
    scene.fog = new THREE.Fog(0x070b14, 28, 65);

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.copy(DEFAULT_CAM_POS);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.32; // Higher exposure for crisp, readable materials
    } catch (e) {
      console.error('Failed to create WebGLRenderer', e);
      setWebglSupported(false);
      return;
    }

    // 4. OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 20.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Prevent looking completely underneath ground
    controls.target.copy(DEFAULT_TARGET);
    controlsRef.current = controls;

    // 5. Aerospace Engineering Studio Lighting Setup
    // Hemisphere Light: Natural skylight fill from above + warm ground bounce from below
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x334155, 2.2);
    scene.add(hemiLight);

    // Key Directional Light (crisp daylight key light illuminating top, front, and cylinder heads)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
    keyLight.position.set(7, 13, 9);
    scene.add(keyLight);

    // Side Fill Light (soft cool blue fill illuminating left bank and crankcase)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 2.0);
    fillLight.position.set(-9, 6, 7);
    scene.add(fillLight);

    // Rim / Back Specular Light (highlights cooling fin edges and metallic silhouettes)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.6);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    // Underside Fill Light (illuminates oil sump, lower crankcase, and underside without dark void)
    const undersideLight = new THREE.DirectionalLight(0x64748b, 1.4);
    undersideLight.position.set(0, -6, 2);
    scene.add(undersideLight);

    // 6. Build Procedural Engine Model
    const engineModel = new AeroPistonEngineModel();
    engineModelRef.current = engineModel;
    scene.add(engineModel.rootGroup);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight, false);
        }
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const currentTelemetry = telemetryRef.current;
      const currentHealth = healthRef.current;

      const simState = simulationStateRef.current;
      const isPaused = simState === 'PAUSED';
      const isIdle = simState === 'STOPPED';
      const effectiveDt = isPaused || isIdle ? 0 : dt;

      // Update engine model kinematics, thermals & vibration
      engineModel.update(effectiveDt, currentTelemetry, currentHealth, {
        cutawayMode,
        subsystemFocus,
        isPaused: isPaused || isIdle,
      });

      // Auto-rotation if enabled
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.2;

      controls.update();
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      engineModel.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Cutaway Mode in model when state changes
  useEffect(() => {
    if (engineModelRef.current) {
      engineModelRef.current.setCutawayMode(cutawayMode);
    }
  }, [cutawayMode]);

  // Update Auto-rotate in controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // WebGL Fallback screen
  if (webglSupported === false) {
    return (
      <div className="rounded-xl border border-rose-900/60 bg-[#090e18] p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
        <h3 className="text-base font-tech font-bold uppercase text-slate-200">
          WEBGL 3D HARDWARE ACCELERATION UNAVAILABLE
        </h3>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-md">
          Your browser or container environment could not initialize WebGL. Telemetry streams and
          mission controls continue running in real time.
        </p>
      </div>
    );
  }

  const isCritical = health.status === 'CRITICAL';
  const isWarning = health.status === 'WARNING';

  return (
    <div
      ref={containerRef}
      id="engine-digital-twin-3d-viewport"
      className={`relative w-full rounded-xl border border-slate-800 bg-[#070b14] overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[720px]' : 'h-[560px]'
      }`}
    >
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD: Title & Live Engine Overlay */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-[#090e18]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg pointer-events-auto">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCritical
                ? 'bg-rose-500 animate-ping'
                : isWarning
                ? 'bg-amber-400 animate-pulse'
                : 'bg-cyan-400 animate-pulse'
            }`}
          />
          <div>
            <div className="text-xs font-tech font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>AERONEX 3D DIGITAL TWIN</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                BOXER 4-CYL TURBO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              KINEMATIC PISTONS • THERMAL DISSIPATION • RMS JITTER
            </div>
          </div>
        </div>

        {/* Live HUD Telemetry Badge */}
        <div className="bg-[#090e18]/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 shadow-md pointer-events-auto grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-tech">RPM:</span>
            <span className="text-cyan-300 font-bold font-mono-num">{telemetry.rpm.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-tech">LOAD:</span>
            <span className="text-sky-300 font-bold font-mono-num">{telemetry.engine_load}%</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-tech">MODE:</span>
            <span className="text-slate-200 font-tech font-bold uppercase">{telemetry.operating_mode}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-tech">STATUS:</span>
            <span
              className={`font-tech font-bold ${
                isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {health.status}
            </span>
          </div>
        </div>

        {/* Simulation Execution State / Diagnostic Overlays */}
        {simulationState === 'PAUSED' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-[11px] font-mono text-amber-300 shadow-lg pointer-events-auto">
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-tech font-bold">SIMULATION PAUSED • KINEMATICS FROZEN</span>
          </div>
        )}

        {telemetry.degradation_enabled && telemetry.degradation_scenario === 'SENSOR_DRIFT' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/80 border border-sky-500/50 text-[11px] font-mono text-sky-300 shadow-lg pointer-events-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>DIAGNOSTIC: SENSOR DRIFT DETECTED • PHYSICAL MECHANICS NOMINAL</span>
          </div>
        )}
      </div>

      {/* Top Right HUD: 3D Camera & Visualizer Actions */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#090e18]/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg">
        {/* Reset Camera View */}
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-tech transition cursor-pointer"
          title="Reset Camera to 3/4 Isometric Perspective"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>RESET CAM</span>
        </button>

        {/* Auto-Rotate 360 Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-tech transition cursor-pointer border ${
            autoRotate
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title="Toggle 360-degree Orbit"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>ORBIT</span>
        </button>

        {/* Normal / Internal View Toggle */}
        <button
          onClick={() => setCutawayMode(!cutawayMode)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-tech transition cursor-pointer border ${
            cutawayMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border-slate-700'
          }`}
          title={cutawayMode ? 'Switch to Normal View (Solid Air-Cooled Casing)' : 'Switch to Internal View (Cutaway Inspection)'}
        >
          <Eye className={`w-3.5 h-3.5 ${cutawayMode ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>{cutawayMode ? 'INTERNAL VIEW' : 'NORMAL VIEW'}</span>
        </button>

        {/* Expand / Shrink Hero Viewport */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
          title={isExpanded ? 'Collapse Viewport' : 'Expand Hero Viewport'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom HUD: Gesture hint & dynamic indicator tags */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        {/* Navigation tips */}
        <div className="bg-[#090e18]/80 backdrop-blur-md px-3 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-auto flex items-center gap-3">
          <span>Rotate: <strong className="text-slate-200">Left Drag</strong></span>
          <span>•</span>
          <span>Pan: <strong className="text-slate-200">Right Drag</strong></span>
          <span>•</span>
          <span>Zoom: <strong className="text-slate-200">Scroll</strong></span>
        </div>

        {/* Thermal & Dynamic Telemetry Indicators */}
        <div className="bg-[#090e18]/85 backdrop-blur-md px-3 py-1 rounded border border-slate-800 text-[10px] font-mono flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1 text-slate-300">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>CHT: <strong className={telemetry.cht > 135 ? 'text-amber-400' : 'text-slate-200'}>{telemetry.cht.toFixed(0)}°C</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>EGT: <strong className={telemetry.egt > 860 ? 'text-rose-400' : 'text-slate-200'}>{telemetry.egt.toFixed(0)}°C</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>VIB: <strong className={telemetry.vibration > 3.5 ? 'text-amber-400' : 'text-slate-200'}>{telemetry.vibration.toFixed(2)} mm/s</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
