import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EngineComponent, SystemHealthStatus } from '../../types';
import { ENGINE_COMPONENTS } from '../../data/mockData';
import { RotateCw, Play, Pause, Layers, Eye, Crosshair } from 'lucide-react';

interface EngineCanvasProps {
  selectedComponentId: string | null;
  onSelectComponent: (component: EngineComponent | null) => void;
  degradationEnabled?: boolean;
  chtValue?: number;
  egtValue?: number;
  oilPressureValue?: number;
  vibrationValue?: number;
  wireframeMode?: boolean;
  thermalMode?: boolean;
  explodedOffset?: number; // 0 to 1
  height?: string;
  showQuickControls?: boolean;
  viewMode?: 'isometric' | 'front' | 'side' | 'top';
}

export const EngineCanvas: React.FC<EngineCanvasProps> = ({
  selectedComponentId,
  onSelectComponent,
  degradationEnabled = false,
  chtValue = 0,
  egtValue = 0,
  oilPressureValue = 0,
  vibrationValue = 0,
  wireframeMode = false,
  thermalMode = false,
  explodedOffset = 0,
  height = 'h-full min-h-[420px]',
  showQuickControls = true,
  viewMode = 'isometric'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const engineGroupRef = useRef<THREE.Group | null>(null);
  const clickableMeshesRef = useRef<Map<THREE.Mesh, string>>(new Map());
  const materialMapRef = useRef<Map<string, THREE.MeshStandardMaterial[]>>(new Map());

  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [hoveredPartName, setHoveredPartName] = useState<string | null>(null);

  // Camera control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 6.8, phi: Math.PI / 3, theta: Math.PI / 4 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // Reset camera view
  const resetCamera = useCallback((mode: string = 'isometric') => {
    if (mode === 'isometric') {
      cameraSphericalRef.current = { radius: 6.8, phi: Math.PI / 3, theta: Math.PI / 4 };
    } else if (mode === 'front') {
      cameraSphericalRef.current = { radius: 6.5, phi: Math.PI / 2, theta: 0 };
    } else if (mode === 'side') {
      cameraSphericalRef.current = { radius: 6.5, phi: Math.PI / 2, theta: Math.PI / 2 };
    } else if (mode === 'top') {
      cameraSphericalRef.current = { radius: 6.5, phi: 0.05, theta: 0 };
    }
  }, []);

  // Sync viewMode prop
  useEffect(() => {
    resetCamera(viewMode);
  }, [viewMode, resetCamera]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.035);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LIGHTING (Studio Aerospace Lighting)
    const ambientLight = new THREE.AmbientLight(0xd4e2f5, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-6, 2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    rimLight.position.set(0, -5, -6);
    scene.add(rimLight);

    const topRim = new THREE.DirectionalLight(0x93c5fd, 0.9);
    topRim.position.set(0, 8, -2);
    scene.add(topRim);

    // ENGINEERING GRID / PEDESTAL
    const gridHelper = new THREE.GridHelper(9, 24, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.55;
    scene.add(gridHelper);

    // Subtle coordinate circle ring
    const ringGeo = new THREE.RingGeometry(2.8, 2.82, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.54;
    scene.add(ringMesh);

    // BUILD AERO PISTON ENGINE MODEL
    const engineGroup = new THREE.Group();
    engineGroupRef.current = engineGroup;
    scene.add(engineGroup);

    clickableMeshesRef.current.clear();
    materialMapRef.current.clear();

    const registerMesh = (mesh: THREE.Mesh, componentId: string, mat: THREE.MeshStandardMaterial) => {
      clickableMeshesRef.current.set(mesh, componentId);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!materialMapRef.current.has(componentId)) {
        materialMapRef.current.set(componentId, []);
      }
      materialMapRef.current.get(componentId)!.push(mat);
    };

    // Shared Base Materials
    const gunmetalMat = new THREE.MeshStandardMaterial({
      color: 0x222731,
      roughness: 0.38,
      metalness: 0.82
    });

    const cylinderAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x3a424e,
      roughness: 0.35,
      metalness: 0.84
    });

    const polishedSteelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.95
    });

    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x4a433a,
      roughness: 0.45,
      metalness: 0.72
    });

    const intakeMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.65,
      metalness: 0.35
    });

    const sensorBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9
    });

    // 1. CENTRAL CRANKCASE
    const crankcaseGroup = new THREE.Group();
    crankcaseGroup.name = 'crankcase';
    
    // Main block
    const mainBlockGeo = new THREE.BoxGeometry(1.6, 1.2, 2.3);
    const mainBlock = new THREE.Mesh(mainBlockGeo, gunmetalMat.clone());
    registerMesh(mainBlock, 'crankcase', mainBlock.material as THREE.MeshStandardMaterial);
    crankcaseGroup.add(mainBlock);

    // Top spine ridge with strengthening ribs
    const spineGeo = new THREE.BoxGeometry(0.35, 0.25, 2.2);
    spineGeo.translate(0, 0.68, 0);
    const spine = new THREE.Mesh(spineGeo, gunmetalMat.clone());
    registerMesh(spine, 'crankcase', spine.material as THREE.MeshStandardMaterial);
    crankcaseGroup.add(spine);

    // Front reduction gear housing bell
    const frontHousingGeo = new THREE.CylinderGeometry(0.68, 0.78, 0.65, 32);
    frontHousingGeo.rotateX(Math.PI / 2);
    frontHousingGeo.translate(0, 0.08, 1.45);
    const frontHousing = new THREE.Mesh(frontHousingGeo, gunmetalMat.clone());
    registerMesh(frontHousing, 'crankcase', frontHousing.material as THREE.MeshStandardMaterial);
    crankcaseGroup.add(frontHousing);

    // Split-crankcase center seam line (aerospace detail)
    const seamGeo = new THREE.TorusGeometry(0.79, 0.018, 16, 48);
    seamGeo.translate(0, 0.08, 1.45);
    const seam = new THREE.Mesh(seamGeo, sensorBlueMat);
    crankcaseGroup.add(seam);

    engineGroup.add(crankcaseGroup);

    // 2. PROPELLER SHAFT & NOSE CONE FLANGE
    const propGroup = new THREE.Group();
    propGroup.name = 'propshaft';

    const shaftGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.9, 32);
    shaftGeo.rotateX(Math.PI / 2);
    shaftGeo.translate(0, 0.08, 2.05);
    const shaft = new THREE.Mesh(shaftGeo, polishedSteelMat.clone());
    registerMesh(shaft, 'propshaft', shaft.material as THREE.MeshStandardMaterial);
    propGroup.add(shaft);

    // Propeller mounting flange plate (with bolt perimeter)
    const flangeGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.12, 32);
    flangeGeo.rotateX(Math.PI / 2);
    flangeGeo.translate(0, 0.08, 2.45);
    const flange = new THREE.Mesh(flangeGeo, polishedSteelMat.clone());
    registerMesh(flange, 'propshaft', flange.material as THREE.MeshStandardMaterial);
    propGroup.add(flange);

    // Prop hub center boss
    const hubBossGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.25, 24);
    hubBossGeo.rotateX(Math.PI / 2);
    hubBossGeo.translate(0, 0.08, 2.6);
    const hubBoss = new THREE.Mesh(hubBossGeo, gunmetalMat.clone());
    registerMesh(hubBoss, 'propshaft', hubBoss.material as THREE.MeshStandardMaterial);
    propGroup.add(hubBoss);

    // 6 Flange bolts
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 12);
      boltGeo.rotateX(Math.PI / 2);
      const bx = Math.cos(angle) * 0.44;
      const by = 0.08 + Math.sin(angle) * 0.44;
      boltGeo.translate(bx, by, 2.48);
      const bolt = new THREE.Mesh(boltGeo, polishedSteelMat.clone());
      propGroup.add(bolt);
    }

    engineGroup.add(propGroup);

    // 3. CYLINDERS (Horizontally Opposed 4-Cylinder Layout)
    // Cyl 1: Starboard Fwd (+X, Z: 0.5)
    // Cyl 2: Port Fwd (-X, Z: 0.4) [slightly offset as in real engines!]
    // Cyl 3: Starboard Aft (+X, Z: -0.5)
    // Cyl 4: Port Aft (-X, Z: -0.6)
    const cylinderConfigs = [
      { id: 'cyl1', xSide: 1, zPos: 0.52, name: 'CYLINDER 1' },
      { id: 'cyl2', xSide: -1, zPos: 0.38, name: 'CYLINDER 2' },
      { id: 'cyl3', xSide: 1, zPos: -0.48, name: 'CYLINDER 3' },
      { id: 'cyl4', xSide: -1, zPos: -0.62, name: 'CYLINDER 4' }
    ];

    cylinderConfigs.forEach(cfg => {
      const cylGroup = new THREE.Group();
      cylGroup.name = cfg.id;

      // Base barrel sleeve extending outward horizontally
      const barrelLength = 1.15;
      const barrelRadius = 0.42;
      const barrelGeo = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 28);
      barrelGeo.rotateZ((Math.PI / 2) * cfg.xSide);
      barrelGeo.translate((0.8 + barrelLength / 2) * cfg.xSide, 0.06, cfg.zPos);
      const barrelMesh = new THREE.Mesh(barrelGeo, cylinderAlloyMat.clone());
      registerMesh(barrelMesh, cfg.id, barrelMesh.material as THREE.MeshStandardMaterial);
      cylGroup.add(barrelMesh);

      // COOLING FINS ARRAY (8 distinct circular fin discs along barrel)
      const numFins = 8;
      for (let f = 0; f < numFins; f++) {
        const finProgress = (f + 0.5) / numFins;
        const finDist = 0.88 + finProgress * (barrelLength - 0.2);
        const finGeo = new THREE.CylinderGeometry(barrelRadius + 0.12, barrelRadius + 0.12, 0.032, 28);
        finGeo.rotateZ((Math.PI / 2) * cfg.xSide);
        finGeo.translate(finDist * cfg.xSide, 0.06, cfg.zPos);
        const finMesh = new THREE.Mesh(finGeo, cylinderAlloyMat.clone());
        registerMesh(finMesh, cfg.id, finMesh.material as THREE.MeshStandardMaterial);
        cylGroup.add(finMesh);
      }

      // Cylinder Head Box on outer end
      const headX = (0.8 + barrelLength + 0.22) * cfg.xSide;
      const headGeo = new THREE.BoxGeometry(0.48, 0.86, 0.88);
      headGeo.translate(headX, 0.06, cfg.zPos);
      const headMesh = new THREE.Mesh(headGeo, gunmetalMat.clone());
      registerMesh(headMesh, cfg.id, headMesh.material as THREE.MeshStandardMaterial);
      cylGroup.add(headMesh);

      // Valve Rocker Cover Dome (machined cap)
      const capGeo = new THREE.BoxGeometry(0.18, 0.72, 0.76);
      capGeo.translate(headX + 0.24 * cfg.xSide, 0.06, cfg.zPos);
      const capMesh = new THREE.Mesh(capGeo, polishedSteelMat.clone());
      registerMesh(capMesh, cfg.id, capMesh.material as THREE.MeshStandardMaterial);
      cylGroup.add(capMesh);

      // Spark plug insulator and wire boot
      const plugGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12);
      plugGeo.translate(headX, 0.55, cfg.zPos);
      const plugMesh = new THREE.Mesh(plugGeo, sensorBlueMat);
      cylGroup.add(plugMesh);

      // CHT Thermocouple Sensor Node at cylinder head base
      const sensorNodeGeo = new THREE.SphereGeometry(0.065, 16, 16);
      sensorNodeGeo.translate(headX - 0.1 * cfg.xSide, 0.42, cfg.zPos + 0.25);
      const sensorNode = new THREE.Mesh(sensorNodeGeo, new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.8
      }));
      cylGroup.add(sensorNode);

      engineGroup.add(cylGroup);
    });

    // 4. INTAKE INDUCTION SYSTEM & PLENUM
    const intakeGroup = new THREE.Group();
    intakeGroup.name = 'intake';

    // Center induction airbox on top aft
    const airboxGeo = new THREE.BoxGeometry(0.75, 0.45, 0.95);
    airboxGeo.translate(0, 0.88, -0.2);
    const airbox = new THREE.Mesh(airboxGeo, intakeMat.clone());
    registerMesh(airbox, 'intake', airbox.material as THREE.MeshStandardMaterial);
    intakeGroup.add(airbox);

    // Runners connecting down to cylinder banks
    cylinderConfigs.forEach(cfg => {
      const runnerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.88, -0.2),
        new THREE.Vector3(0.5 * cfg.xSide, 0.82, cfg.zPos * 0.6),
        new THREE.Vector3(1.7 * cfg.xSide, 0.45, cfg.zPos)
      ]);
      const runnerGeo = new THREE.TubeGeometry(runnerCurve, 16, 0.065, 12, false);
      const runner = new THREE.Mesh(runnerGeo, intakeMat.clone());
      registerMesh(runner, 'intake', runner.material as THREE.MeshStandardMaterial);
      intakeGroup.add(runner);
    });
    engineGroup.add(intakeGroup);

    // 5. EXHAUST SYSTEM & HEADERS
    const exhaustGroup = new THREE.Group();
    exhaustGroup.name = 'exhaust';

    cylinderConfigs.forEach(cfg => {
      const headX = (0.8 + 1.15 + 0.1) * cfg.xSide;
      const exCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(headX, -0.32, cfg.zPos),
        new THREE.Vector3(1.2 * cfg.xSide, -0.75, cfg.zPos + 0.1),
        new THREE.Vector3(0.45 * cfg.xSide, -0.92, -0.2),
        new THREE.Vector3(0.35 * cfg.xSide, -0.95, -1.1)
      ]);
      const exGeo = new THREE.TubeGeometry(exCurve, 20, 0.075, 12, false);
      const exMesh = new THREE.Mesh(exGeo, exhaustMat.clone());
      registerMesh(exMesh, 'exhaust', exMesh.material as THREE.MeshStandardMaterial);
      exhaustGroup.add(exMesh);
    });

    // Dual Aft Exhaust tailpipes
    const tailpipeGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.1, 20);
    tailpipeGeo.rotateX(Math.PI / 2);
    tailpipeGeo.translate(0.35, -0.95, -1.6);
    const tailpipe1 = new THREE.Mesh(tailpipeGeo, exhaustMat.clone());
    registerMesh(tailpipe1, 'exhaust', tailpipe1.material as THREE.MeshStandardMaterial);
    exhaustGroup.add(tailpipe1);

    const tailpipe2Geo = tailpipeGeo.clone();
    tailpipe2Geo.translate(-0.7, 0, 0);
    const tailpipe2 = new THREE.Mesh(tailpipe2Geo, exhaustMat.clone());
    registerMesh(tailpipe2, 'exhaust', tailpipe2.material as THREE.MeshStandardMaterial);
    exhaustGroup.add(tailpipe2);

    // EGT Sensor Probes welded on exhaust collectors
    const egtSensorGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8);
    egtSensorGeo.translate(0.35, -0.84, -1.2);
    const egtSensor = new THREE.Mesh(egtSensorGeo, sensorBlueMat);
    exhaustGroup.add(egtSensor);

    engineGroup.add(exhaustGroup);

    // 6. OIL SUMP & FILTER
    const sumpGroup = new THREE.Group();
    sumpGroup.name = 'oilsump';

    const sumpGeo = new THREE.BoxGeometry(1.25, 0.45, 1.8);
    sumpGeo.translate(0, -0.72, 0.1);
    const sump = new THREE.Mesh(sumpGeo, gunmetalMat.clone());
    registerMesh(sump, 'oilsump', sump.material as THREE.MeshStandardMaterial);
    sumpGroup.add(sump);

    // Spin-on oil filter canister on lower side
    const filterGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.55, 24);
    filterGeo.rotateZ(Math.PI / 2);
    filterGeo.translate(0.85, -0.68, 0.4);
    const filter = new THREE.Mesh(filterGeo, gunmetalMat.clone());
    registerMesh(filter, 'oilsump', filter.material as THREE.MeshStandardMaterial);
    sumpGroup.add(filter);

    // Oil pressure sensor hex fitting
    const sensorOilGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
    sensorOilGeo.translate(0.72, -0.45, 0.7);
    const sensorOil = new THREE.Mesh(sensorOilGeo, sensorBlueMat);
    sumpGroup.add(sensorOil);

    engineGroup.add(sumpGroup);

    // ANIMATION LOOP & ORBIT CONTROLS
    let animationFrameId: number;
    const updateCameraPosition = () => {
      const { radius, phi, theta } = cameraSphericalRef.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, y, z);
      camera.lookAt(targetLookAtRef.current);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto-rotation
      if (isAutoRotate && !isDraggingRef.current) {
        cameraSphericalRef.current.theta += 0.0035;
      }

      updateCameraPosition();
      renderer.render(scene, camera);
    };

    animate();

    // INTERACTIVE MOUSE / TOUCH ORBIT
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Hover Raycasting
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isDraggingRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const intersects = raycaster.intersectObjects(Array.from(clickableMeshesRef.current.keys()));
        if (intersects.length > 0) {
          const compId = clickableMeshesRef.current.get(intersects[0].object as THREE.Mesh);
          const found = ENGINE_COMPONENTS.find(c => c.id === compId);
          setHoveredPartName(found ? found.name : compId || null);
          container.style.cursor = 'pointer';
        } else {
          setHoveredPartName(null);
          container.style.cursor = 'grab';
        }
        return;
      }

      // Orbit Drag
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      cameraSphericalRef.current.theta -= deltaX * 0.007;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraSphericalRef.current.phi - deltaY * 0.007)
      );
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        3.2,
        Math.min(14.0, cameraSphericalRef.current.radius + e.deltaY * 0.006)
      );
    };

    // Component Click Selection
    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(Array.from(clickableMeshesRef.current.keys()));

      if (intersects.length > 0) {
        const compId = clickableMeshesRef.current.get(intersects[0].object as THREE.Mesh);
        const comp = ENGINE_COMPONENTS.find(c => c.id === compId) || null;
        onSelectComponent(comp);
      } else {
        // clicked empty background
        onSelectComponent(null);
      }
    };

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });

    resizeObserver.observe(container);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, [onSelectComponent]);

  // Update Material states using LIVE telemetry
useEffect(() => {
  materialMapRef.current.forEach((materials, compId) => {
    materials.forEach(mat => {
      mat.wireframe = wireframeMode;

      // Reset baseline
      if (compId.startsWith('cyl')) {
        mat.color.setHex(0x3a424e);
        mat.roughness = 0.35;
        mat.metalness = 0.84;
      } else if (compId === 'propshaft') {
        mat.color.setHex(0x94a3b8);
        mat.roughness = 0.2;
        mat.metalness = 0.95;
      } else if (compId === 'exhaust') {
        mat.color.setHex(0x4a433a);
      } else if (compId === 'intake') {
        mat.color.setHex(0x181e28);
      } else {
        mat.color.setHex(0x222731);
      }

      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;

      // LIVE thermal visualization
      if (thermalMode) {
        if (compId === 'exhaust') {
          // EGT-based heat
          const egt = egtValue;

          if (egt >= 650) {
            mat.color.setHex(0xef4444);
            mat.emissive.setHex(0x991b1b);
            mat.emissiveIntensity = 0.65;
          } else if (egt >= 550) {
            mat.color.setHex(0xf97316);
            mat.emissive.setHex(0xc2410c);
            mat.emissiveIntensity = 0.45;
          } else if (egt >= 450) {
            mat.color.setHex(0xd97706);
            mat.emissive.setHex(0x92400e);
            mat.emissiveIntensity = 0.3;
          } else {
            mat.color.setHex(0x3b82f6);
            mat.emissive.setHex(0x1d4ed8);
            mat.emissiveIntensity = 0.15;
          }

          return;
        }

        if (compId.startsWith('cyl')) {
          // CHT-based heat
          const cht = chtValue;

          if (cht >= 140) {
            mat.color.setHex(0xef4444);
            mat.emissive.setHex(0x991b1b);
            mat.emissiveIntensity = 0.6;
          } else if (cht >= 120) {
            mat.color.setHex(0xf97316);
            mat.emissive.setHex(0xc2410c);
            mat.emissiveIntensity = 0.45;
          } else if (cht >= 100) {
            mat.color.setHex(0xd97706);
            mat.emissive.setHex(0x92400e);
            mat.emissiveIntensity = 0.3;
          } else {
            mat.color.setHex(0x0ea5e9);
            mat.emissive.setHex(0x0369a1);
            mat.emissiveIntensity = 0.25;
          }

          return;
        }
      }

      // LIVE degradation indication
      if (degradationEnabled) {
        const lowOilPressure = oilPressureValue > 0 && oilPressureValue < 2.5;
        const highVibration = vibrationValue > 0.35;
        const highCHT = chtValue > 120;
        const highEGT = egtValue > 600;

        if (
          (compId === 'oilsump' && lowOilPressure) ||
          (compId.startsWith('cyl') && highCHT) ||
          (compId === 'exhaust' && highEGT)
        ) {
          mat.color.setHex(0xd97706);
          mat.emissive.setHex(0xb45309);
          mat.emissiveIntensity = 0.4;
          return;
        }

        if (compId === 'crankcase' && highVibration) {
          mat.color.setHex(0xd97706);
          mat.emissive.setHex(0xb45309);
          mat.emissiveIntensity = 0.35;
          return;
        }
      }

      // Selected component
      if (selectedComponentId === compId) {
        mat.color.setHex(0x38bdf8);
        mat.emissive.setHex(0x0284c7);
        mat.emissiveIntensity = 0.55;
      }
    });
  });
}, [
  selectedComponentId,
  degradationEnabled,
  wireframeMode,
  thermalMode,
  chtValue,
  egtValue,
  oilPressureValue,
  vibrationValue
]);
  // Exploded View offset handling
  useEffect(() => {
    if (!engineGroupRef.current) return;
    const group = engineGroupRef.current;
    
    // Animate cylinder separation along X axis based on explodedOffset
    const cyl1 = group.getObjectByName('cyl1');
    const cyl2 = group.getObjectByName('cyl2');
    const cyl3 = group.getObjectByName('cyl3');
    const cyl4 = group.getObjectByName('cyl4');
    const prop = group.getObjectByName('propshaft');
    const intake = group.getObjectByName('intake');
    const exhaust = group.getObjectByName('exhaust');
    const sump = group.getObjectByName('oilsump');

    const mult = explodedOffset * 0.9;

    if (cyl1) cyl1.position.x = mult;
    if (cyl2) cyl2.position.x = -mult;
    if (cyl3) cyl3.position.x = mult;
    if (cyl4) cyl4.position.x = -mult;
    if (prop) prop.position.z = mult * 0.8;
    if (intake) intake.position.y = mult * 0.7;
    if (exhaust) exhaust.position.y = -mult * 0.6;
    if (sump) sump.position.y = -mult * 0.5;
  }, [explodedOffset]);

  return (
    <div className={`relative w-full ${height} bg-[#0a101d] overflow-hidden select-none border border-slate-800/80`}>
      {/* Three.js canvas container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Engineering Corner Coordinates & Framing */}
      <div className="absolute top-2 left-3 pointer-events-none flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-mono text-[10px] tracking-widest text-cyan-400/80 uppercase font-semibold">
          3D TWIN // SYS-ID: AERO-P4-REPR
        </span>
      </div>

      <div className="absolute top-2 right-3 pointer-events-none flex items-center gap-3">
        {hoveredPartName && (
          <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/40 font-mono text-[11px] text-cyan-200">
            PROBE: {hoveredPartName}
          </div>
        )}
        <span className="font-mono text-[10px] text-slate-400">
          FOV: 42° | ORBIT: 360°
        </span>
      </div>

      {/* Floating View Controls (Minimal, Professional) */}
      {showQuickControls && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-md border border-slate-800">
          <button
            onClick={() => resetCamera('isometric')}
            title="Reset Camera (Isometric)"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>RESET VIEW</span>
          </button>
          <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5" />
          <button
            onClick={() => setIsAutoRotate(prev => !prev)}
            title="Toggle Auto Rotation"
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
              isAutoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>AUTO ROTATE</span>
          </button>
        </div>
      )}

      {/* Hint overlay on bottom-left */}
      <div className="absolute bottom-3 left-3 pointer-events-none text-[10px] font-mono text-slate-400 flex items-center gap-2">
        <Crosshair className="w-3 h-3 text-slate-400" />
        <span>CLICK COMPONENT TO INSPECT • DRAG TO ORBIT • SCROLL TO ZOOM</span>
      </div>
    </div>
  );
};
