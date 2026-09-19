import * as THREE from 'three';
import { TelemetryData, HealthReport } from '../../simulation/types';

export interface Engine3DOptions {
  cutawayMode: boolean;
  subsystemFocus: 'ALL' | 'THERMAL' | 'LUBE' | 'MECHANICAL';
  isPaused?: boolean;
}

/**
 * High-Fidelity Procedural 3D Aero Piston Engine Model
 * Horizontally-Opposed 4-Cylinder Boxer Architecture (Rotax 912/914/915 UAV archetype)
 * Features precision mechanical kinematics: rotating crankshaft, counterweights,
 * articulating H-beam connecting rods, and reciprocating silver pistons with compression rings.
 */
export class AeroPistonEngineModel {
  public rootGroup: THREE.Group;
  public engineAssembly: THREE.Group;

  // Kinematic components
  private crankshaftGroup: THREE.Group;
  private propellerHub: THREE.Group;
  private flywheelMesh: THREE.Mesh;
  private pistons: {
    group: THREE.Group;
    mesh: THREE.Mesh;
    rodGroup: THREE.Group;
    bank: 'left' | 'right';
    cylinderIndex: number;
    phase: number;
    z: number;
  }[] = [];

  // PBR Materials for dynamic updates & contrast
  private cylinderHeadMaterials: THREE.MeshStandardMaterial[] = [];
  private exhaustMaterials: THREE.MeshStandardMaterial[] = [];
  private crankcaseMaterial: THREE.MeshStandardMaterial;
  private crankcaseRibMaterial: THREE.MeshStandardMaterial;
  private cylinderBarrelMaterial: THREE.MeshStandardMaterial;
  private finMaterial: THREE.MeshStandardMaterial;
  private finRimMaterial: THREE.MeshStandardMaterial;
  private statusRingMaterial: THREE.MeshBasicMaterial;
  private bearingMaterials: THREE.MeshStandardMaterial[] = [];
  private sparkPlugMaterials: THREE.MeshStandardMaterial[] = [];

  // Kinematic dimensions (calibrated for zero-gap mechanical alignment)
  private readonly crankRadius = 0.52;
  private readonly rodLength = 1.65;
  private crankAngle = 0;

  constructor() {
    this.rootGroup = new THREE.Group();
    this.engineAssembly = new THREE.Group();
    this.rootGroup.add(this.engineAssembly);

    // 1. Initialize PBR Materials with High Aerospace Contrast
    // Engine crankcase: machined cast aeronautical aluminum
    this.crankcaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b4758, // Dark metallic cast aeronautical aluminum
      metalness: 0.78,
      roughness: 0.38,
      envMapIntensity: 1.2,
    });

    // Crankcase structural stiffener ribs & machined split flange
    this.crankcaseRibMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Polished machined aluminum accent
      metalness: 0.88,
      roughness: 0.22,
    });

    // Cylinder barrels: nitrided steel liners
    this.cylinderBarrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.3,
    });

    // Air-cooled cylinder cooling fins
    this.finMaterial = new THREE.MeshStandardMaterial({
      color: 0x526177, // Slate-metallic air-cooled fin alloy
      metalness: 0.86,
      roughness: 0.28,
    });

    // Polished fin outer edge highlight rim
    this.finRimMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Polished aluminum perimeter edge
      metalness: 0.95,
      roughness: 0.15,
    });

    // Holographic ground datum ring
    this.statusRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    // 2. Build Engine Assemblies
    this.buildDatumBase();
    this.buildCrankcase();
    this.buildCylinders();
    this.buildCrankshaftAndKinematics();
    this.buildPropellerReductionDrive();
    this.buildExhaustAndTurbo();
    this.buildIntakeManifold();
    this.buildAccessoriesAndMounts();
  }

  /**
   * Holographic ground datum plane with calibration crosshairs
   */
  private buildDatumBase(): void {
    const datumGroup = new THREE.Group();
    datumGroup.position.y = -2.1;

    // Outer target circle
    const ringGeo = new THREE.RingGeometry(3.6, 3.75, 64);
    const ringMesh = new THREE.Mesh(ringGeo, this.statusRingMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    datumGroup.add(ringMesh);

    // Inner target circle
    const innerRingGeo = new THREE.RingGeometry(1.8, 1.88, 48);
    const innerRing = new THREE.Mesh(innerRingGeo, this.statusRingMaterial);
    innerRing.rotation.x = -Math.PI / 2;
    datumGroup.add(innerRing);

    // Calibration grid crosshairs
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const pointsX = [new THREE.Vector3(-4.5, 0, 0), new THREE.Vector3(4.5, 0, 0)];
    const pointsZ = [new THREE.Vector3(0, 0, -4.5), new THREE.Vector3(0, 0, 4.5)];
    datumGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsX), lineMat));
    datumGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsZ), lineMat));

    // Corner tick marks
    for (let r = -3.0; r <= 3.0; r += 2.0) {
      if (r === 0) continue;
      const tickGeo = new THREE.BoxGeometry(0.15, 0.02, 0.15);
      const tick = new THREE.Mesh(tickGeo, lineMat);
      tick.position.set(r, 0, r);
      datumGroup.add(tick);
    }

    this.rootGroup.add(datumGroup);
  }

  /**
   * Refined aluminum crankcase with split flange, reinforcement ribs,
   * cylinder mounting decks, and lower finned oil sump.
   */
  private buildCrankcase(): void {
    const crankcaseGroup = new THREE.Group();

    // Upper and lower crankcase block (Z is longitudinal axis, X is lateral cylinder axis)
    const upperCaseGeo = new THREE.BoxGeometry(2.1, 0.95, 3.8);
    const upperCase = new THREE.Mesh(upperCaseGeo, this.crankcaseMaterial);
    upperCase.position.y = 0.475;
    crankcaseGroup.add(upperCase);

    const lowerCaseGeo = new THREE.BoxGeometry(2.1, 0.95, 3.8);
    const lowerCase = new THREE.Mesh(lowerCaseGeo, this.crankcaseMaterial);
    lowerCase.position.y = -0.475;
    crankcaseGroup.add(lowerCase);

    // Machined center split-line flange (visible horizontal line with bolts)
    const splitFlangeGeo = new THREE.BoxGeometry(2.25, 0.08, 3.9);
    const splitFlange = new THREE.Mesh(splitFlangeGeo, this.crankcaseRibMaterial);
    crankcaseGroup.add(splitFlange);

    // Longitudinal top spine ridge & gallery
    const spineGeo = new THREE.BoxGeometry(0.6, 0.3, 3.6);
    const spine = new THREE.Mesh(spineGeo, this.crankcaseRibMaterial);
    spine.position.y = 1.05;
    crankcaseGroup.add(spine);

    // Top crankcase inspection window (transparent acrylic hatch to view crankshaft)
    const hatchFrameGeo = new THREE.BoxGeometry(0.9, 0.06, 1.8);
    const hatchFrame = new THREE.Mesh(hatchFrameGeo, this.crankcaseRibMaterial);
    hatchFrame.position.set(0, 1.0, 0);
    crankcaseGroup.add(hatchFrame);

    const glassGeo = new THREE.BoxGeometry(0.7, 0.04, 1.6);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      metalness: 0.9,
      roughness: 0.1,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.02, 0);
    crankcaseGroup.add(glass);

    // Structural lateral stiffening ribs (4 pairs along the crankcase)
    [-1.4, -0.5, 0.5, 1.4].forEach((z) => {
      const ribGeo = new THREE.BoxGeometry(2.2, 0.1, 0.12);
      const ribUpper = new THREE.Mesh(ribGeo, this.crankcaseRibMaterial);
      ribUpper.position.set(0, 0.7, z);
      crankcaseGroup.add(ribUpper);

      const ribLower = new THREE.Mesh(ribGeo, this.crankcaseRibMaterial);
      ribLower.position.set(0, -0.7, z);
      crankcaseGroup.add(ribLower);
    });

    // 4 Machined circular cylinder mounting spigot flanges on crankcase sides
    const spigotLocations = [
      { x: 1.05, z: 0.9 },
      { x: -1.05, z: 0.9 },
      { x: 1.05, z: -0.9 },
      { x: -1.05, z: -0.9 },
    ];
    const spigotGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.14, 24);
    spigotLocations.forEach((sp) => {
      const spigot = new THREE.Mesh(spigotGeo, this.crankcaseRibMaterial);
      spigot.position.set(sp.x, 0, sp.z);
      spigot.rotation.z = Math.PI / 2;
      crankcaseGroup.add(spigot);
    });

    // Lower Oil Sump Pan with cooling fins
    const sumpGroup = new THREE.Group();
    sumpGroup.position.set(0, -1.2, 0);

    const sumpBodyGeo = new THREE.BoxGeometry(1.5, 0.55, 2.8);
    const sumpMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.35,
    });
    this.bearingMaterials.push(sumpMat);
    const sumpBody = new THREE.Mesh(sumpBodyGeo, sumpMat);
    sumpGroup.add(sumpBody);

    // Sump cooling fins (5 longitudinal fins)
    for (let x = -0.6; x <= 0.6; x += 0.3) {
      const finGeo = new THREE.BoxGeometry(0.04, 0.2, 2.6);
      const fin = new THREE.Mesh(finGeo, this.crankcaseRibMaterial);
      fin.position.set(x, -0.35, 0);
      sumpGroup.add(fin);
    }

    // Oil drain plug & filter cartridge
    const filterGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const filterMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const filter = new THREE.Mesh(filterGeo, filterMat);
    filter.rotation.z = Math.PI / 2.5;
    filter.position.set(0.9, -0.2, 1.0);
    sumpGroup.add(filter);

    crankcaseGroup.add(sumpGroup);

    // Front Gearbox Housing (Reduction gear bellhousing)
    const noseGeo = new THREE.CylinderGeometry(0.72, 1.05, 1.0, 24);
    const nose = new THREE.Mesh(noseGeo, this.crankcaseRibMaterial);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 2.25;
    crankcaseGroup.add(nose);

    // Gearbox perimeter bolt circle (8 bolts)
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8);
      const boltMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 });
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 2.7);
      bolt.rotation.x = Math.PI / 2;
      crankcaseGroup.add(bolt);
    }

    // Rear Accessory Gearbox Cover & Starter Motor
    const rearCaseGeo = new THREE.BoxGeometry(1.7, 1.5, 0.7);
    const rearCase = new THREE.Mesh(rearCaseGeo, this.crankcaseMaterial);
    rearCase.position.z = -2.15;
    crankcaseGroup.add(rearCase);

    const starterGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 16);
    const starterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });
    const starter = new THREE.Mesh(starterGeo, starterMat);
    starter.rotation.x = Math.PI / 2;
    starter.position.set(0.65, 0.65, -2.4);
    crankcaseGroup.add(starter);

    this.engineAssembly.add(crankcaseGroup);
  }

  /**
   * 4 Horizontally opposed cylinders with deep cooling fins, cylinder heads,
   * valve rocker covers, spark plug bosses, and cutaway inspection windows.
   */
  private buildCylinders(): void {
    const cylinderLocations = [
      { id: 1, side: 'right' as const, z: 0.9, name: 'CYL 1' },
      { id: 2, side: 'left' as const, z: 0.9, name: 'CYL 2' },
      { id: 3, side: 'right' as const, z: -0.9, name: 'CYL 3' },
      { id: 4, side: 'left' as const, z: -0.9, name: 'CYL 4' },
    ];

    cylinderLocations.forEach((cyl) => {
      const cylGroup = new THREE.Group();
      const isRight = cyl.side === 'right';
      const dir = isRight ? 1 : -1;

      // Position barrel starting at crankcase spigot ($x = \pm 1.05$)
      cylGroup.position.set(dir * 1.05, 0, cyl.z);
      cylGroup.rotation.z = isRight ? -Math.PI / 2 : Math.PI / 2;

      // Cylinder Barrel Sleeve (Length = 1.35)
      const barrelGeo = new THREE.CylinderGeometry(0.52, 0.52, 1.35, 24);
      const barrel = new THREE.Mesh(barrelGeo, this.cylinderBarrelMaterial);
      barrel.position.y = 0.675;
      cylGroup.add(barrel);

      // Deep Annular Aero Cooling Fins (10 stacked fins per cylinder)
      for (let i = 0.15; i <= 1.25; i += 0.12) {
        const finGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.035, 24);
        const fin = new THREE.Mesh(finGeo, this.finMaterial);
        fin.position.y = i;
        cylGroup.add(fin);

        // Polished outer rim highlight for fin edge
        const rimGeo = new THREE.CylinderGeometry(0.835, 0.835, 0.015, 24);
        const rim = new THREE.Mesh(rimGeo, this.finRimMaterial);
        rim.position.y = i;
        cylGroup.add(rim);
      }

      // Cylinder Head (at outer tip: $y = 1.45$)
      const headGeo = new THREE.BoxGeometry(1.35, 0.65, 1.35);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x64748b, // Distinct cast silver-gray
        metalness: 0.82,
        roughness: 0.28,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0.0,
      });
      this.cylinderHeadMaterials.push(headMat);

      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.55;
      cylGroup.add(head);

      // Head Cooling Fins (3 horizontal fins on cylinder head)
      for (let hf = 1.35; hf <= 1.75; hf += 0.15) {
        const headFinGeo = new THREE.BoxGeometry(1.48, 0.03, 1.48);
        const headFin = new THREE.Mesh(headFinGeo, this.finRimMaterial);
        headFin.position.y = hf;
        cylGroup.add(headFin);
      }

      // Overhead Valve Rocker Covers with embossed longitudinal ribs
      const rockerGeo = new THREE.BoxGeometry(0.85, 0.35, 1.15);
      const rockerMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8, // Polished rocker cover
        metalness: 0.92,
        roughness: 0.2,
      });
      const rocker = new THREE.Mesh(rockerGeo, rockerMat);
      rocker.position.y = 1.95;
      cylGroup.add(rocker);

      // Twin Spark Plug Bosses & Ceramic Insulators
      [-0.3, 0.3].forEach((offsetZ) => {
        const plugBossGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12);
        const plugBoss = new THREE.Mesh(plugBossGeo, this.finRimMaterial);
        plugBoss.position.set(0.45, 1.6, offsetZ);
        plugBoss.rotation.z = Math.PI / 4;
        cylGroup.add(plugBoss);

        const ceramicGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12);
        const ceramicMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.35,
        });
        this.sparkPlugMaterials.push(ceramicMat);
        const ceramic = new THREE.Mesh(ceramicGeo, ceramicMat);
        ceramic.position.set(0.58, 1.72, offsetZ);
        ceramic.rotation.z = Math.PI / 4;
        cylGroup.add(ceramic);
      });

      this.engineAssembly.add(cylGroup);
    });
  }

  /**
   * Crankshaft assembly with polished counterweights, connecting rods,
   * and bright silver pistons with compression rings.
   */
  private buildCrankshaftAndKinematics(): void {
    this.crankshaftGroup = new THREE.Group();

    // Central crankshaft main shaft (along Z axis)
    const shaftGeo = new THREE.CylinderGeometry(0.24, 0.24, 4.2, 24);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Mirror polished steel
      metalness: 0.98,
      roughness: 0.1,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    this.crankshaftGroup.add(shaft);

    // Rear Heavy Flywheel & Starter Ring Gear
    const flywheelGroup = new THREE.Group();
    flywheelGroup.position.set(0, 0, -1.9);

    const flywheelGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.22, 36);
    const flywheelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.25,
    });
    this.flywheelMesh = new THREE.Mesh(flywheelGeo, flywheelMat);
    this.flywheelMesh.rotation.x = Math.PI / 2;
    flywheelGroup.add(this.flywheelMesh);

    // Starter ring gear perimeter teeth ring
    const ringGearGeo = new THREE.TorusGeometry(1.08, 0.06, 12, 48);
    const ringGearMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95 });
    const ringGear = new THREE.Mesh(ringGearGeo, ringGearMat);
    flywheelGroup.add(ringGear);
    this.crankshaftGroup.add(flywheelGroup);

    // 4 Crank stations with opposed counterweights (Boxer geometry)
    // Front pair at z = 0.9 (Cyl 1 & 2), Aft pair at z = -0.9 (Cyl 3 & 4)
    const stations = [
      { z: 0.9, phase: 0, bank: 'right' as const, cylIdx: 0 },
      { z: 0.9, phase: Math.PI, bank: 'left' as const, cylIdx: 1 },
      { z: -0.9, phase: Math.PI, bank: 'right' as const, cylIdx: 2 },
      { z: -0.9, phase: 0, bank: 'left' as const, cylIdx: 3 },
    ];

    // Counterweight Web Geometry (Wedge shape)
    const webGeo = new THREE.BoxGeometry(0.32, 1.15, 0.22);
    const webMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Forged steel counterweight
      metalness: 0.88,
      roughness: 0.3,
    });

    stations.forEach((st) => {
      // 1. Crankpin journal cylinder for connecting rod big-end
      const crankPinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 20);
      const crankPin = new THREE.Mesh(crankPinGeo, shaftMat);
      crankPin.rotation.x = Math.PI / 2;
      crankPin.position.set(
        Math.cos(st.phase) * this.crankRadius,
        Math.sin(st.phase) * this.crankRadius,
        st.z
      );
      this.crankshaftGroup.add(crankPin);

      // 2. Counterweight web: opposed to crankpin for mechanical balance
      const web = new THREE.Mesh(webGeo, webMat);
      web.position.set(
        Math.cos(st.phase + Math.PI) * (this.crankRadius * 0.45),
        Math.sin(st.phase + Math.PI) * (this.crankRadius * 0.45),
        st.z
      );
      web.rotation.z = st.phase;
      this.crankshaftGroup.add(web);
    });

    this.engineAssembly.add(this.crankshaftGroup);

    // Materials for Pistons & Connecting Rods
    const pistonMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Bright satin aluminum piston (easily visible against dark engine)
      metalness: 0.95,
      roughness: 0.12,
    });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark iron piston compression rings
      metalness: 0.6,
      roughness: 0.5,
    });
    const wristPinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Hardened steel wrist pin
      metalness: 0.98,
      roughness: 0.1,
    });
    const rodMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Forged titanium/steel connecting rod
      metalness: 0.92,
      roughness: 0.2,
    });
    const bushingMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Bronze small-end bearing bushing
      metalness: 0.85,
      roughness: 0.3,
    });

    // Build 4 Pistons & Connecting Rods
    stations.forEach((st, idx) => {
      // 1. Piston Assembly
      const pistonGroup = new THREE.Group();

      // Piston Crown & Skirt (Cylinder oriented along X axis)
      const pistonCrownGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.72, 24);
      const pistonMesh = new THREE.Mesh(pistonCrownGeo, pistonMat);
      pistonMesh.rotation.z = Math.PI / 2;
      pistonGroup.add(pistonMesh);

      // Two dark compression rings near top of crown
      [-0.18, -0.06].forEach((rx) => {
        const ringGeo = new THREE.TorusGeometry(0.485, 0.015, 8, 24);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = rx;
        pistonGroup.add(ring);
      });

      // Wrist Pin (gudgeon pin through piston skirt)
      const pinGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16);
      const pin = new THREE.Mesh(pinGeo, wristPinMat);
      pin.position.x = 0;
      pistonGroup.add(pin);

      // 2. Connecting Rod Assembly
      const rodGroup = new THREE.Group();

      // H-beam rod shank (Length = rodLength = 1.65)
      // Centered at x = rodLength / 2
      const rodShankGeo = new THREE.BoxGeometry(this.rodLength - 0.3, 0.14, 0.18);
      const rodShank = new THREE.Mesh(rodShankGeo, rodMat);
      rodShank.position.x = this.rodLength / 2;
      rodGroup.add(rodShank);

      // Big-End Bearing Cap (anchors to crank pin at x = 0)
      const bigEndGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.24, 20);
      const bigEnd = new THREE.Mesh(bigEndGeo, shaftMat);
      bigEnd.rotation.x = Math.PI / 2;
      rodGroup.add(bigEnd);

      // Small-End Bronze Bushing (anchors to wrist pin at x = rodLength)
      const smallEndGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.22, 16);
      const smallEnd = new THREE.Mesh(smallEndGeo, bushingMat);
      smallEnd.position.x = this.rodLength;
      smallEnd.rotation.x = Math.PI / 2;
      rodGroup.add(smallEnd);

      this.engineAssembly.add(pistonGroup);
      this.engineAssembly.add(rodGroup);

      this.pistons.push({
        group: pistonGroup,
        mesh: pistonMesh,
        rodGroup,
        bank: st.bank,
        cylinderIndex: idx,
        phase: st.phase,
        z: st.z,
      });
    });
  }

  /**
   * Propeller reduction gearbox & spinning propeller hub
   */
  private buildPropellerReductionDrive(): void {
    this.propellerHub = new THREE.Group();
    this.propellerHub.position.set(0, 0, 2.85);

    // Propeller drive shaft flange
    const flangeGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.24, 28);
    const flangeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.2 });
    const flange = new THREE.Mesh(flangeGeo, flangeMat);
    flange.rotation.x = Math.PI / 2;
    this.propellerHub.add(flange);

    // Aerodynamic Spinner Cone
    const coneGeo = new THREE.ConeGeometry(0.52, 1.25, 28);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = 0.62;
    this.propellerHub.add(cone);

    // 3 Aerodynamic Carbon Composite Propeller Blades with safety yellow tips
    const bladeGeo = new THREE.BoxGeometry(0.2, 2.5, 0.08);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.35,
    });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // High-vis yellow

    for (let i = 0; i < 3; i++) {
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = (i * 2 * Math.PI) / 3;

      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 1.35;
      blade.rotation.y = 0.22; // Aerodynamic pitch angle

      // Safety yellow tip
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.4, 0.085), tipMat);
      tip.position.y = 2.45;
      bladeArm.add(blade);
      bladeArm.add(tip);

      this.propellerHub.add(bladeArm);
    }

    this.engineAssembly.add(this.propellerHub);
  }

  /**
   * Curved stainless steel exhaust headers and rear turbocharger
   */
  private buildExhaustAndTurbo(): void {
    const exhaustGroup = new THREE.Group();

    const exhaustPipeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // High contrast stainless steel
      metalness: 0.88,
      roughness: 0.32,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0,
    });
    this.exhaustMaterials.push(exhaustPipeMat);

    // Left bank exhaust header tube
    const curvePointsLeft = [
      new THREE.Vector3(-2.2, -0.3, 0.9),
      new THREE.Vector3(-1.6, -0.85, 0.2),
      new THREE.Vector3(-0.8, -0.8, -1.6),
      new THREE.Vector3(0, -0.6, -2.4),
    ];
    const curveLeft = new THREE.CatmullRomCurve3(curvePointsLeft);
    const pipeGeoLeft = new THREE.TubeGeometry(curveLeft, 32, 0.13, 14, false);
    exhaustGroup.add(new THREE.Mesh(pipeGeoLeft, exhaustPipeMat));

    // Right bank exhaust header tube
    const curvePointsRight = [
      new THREE.Vector3(2.2, -0.3, 0.9),
      new THREE.Vector3(1.6, -0.85, 0.2),
      new THREE.Vector3(0.8, -0.8, -1.6),
      new THREE.Vector3(0, -0.6, -2.4),
    ];
    const curveRight = new THREE.CatmullRomCurve3(curvePointsRight);
    const pipeGeoRight = new THREE.TubeGeometry(curveRight, 32, 0.13, 14, false);
    exhaustGroup.add(new THREE.Mesh(pipeGeoRight, exhaustPipeMat));

    // Turbocharger housing assembly (rear lower)
    const turboGroup = new THREE.Group();
    turboGroup.position.set(0, -0.65, -2.7);

    // Turbine scroll (hot side)
    const scrollGeo = new THREE.TorusGeometry(0.52, 0.22, 16, 28);
    const turboHotMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.3,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0,
    });
    this.exhaustMaterials.push(turboHotMat);
    const scroll = new THREE.Mesh(scrollGeo, turboHotMat);
    scroll.rotation.y = Math.PI / 2;
    turboGroup.add(scroll);

    // Compressor scroll (cold side)
    const compMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.22 });
    const comp = new THREE.Mesh(scrollGeo, compMat);
    comp.position.z = -0.42;
    comp.rotation.y = Math.PI / 2;
    turboGroup.add(comp);

    // Wastegate actuator cylinder
    const wastegateGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.85, 14);
    const wastegate = new THREE.Mesh(wastegateGeo, compMat);
    wastegate.position.set(0.45, 0.45, 0);
    wastegate.rotation.z = 0.45;
    turboGroup.add(wastegate);

    exhaustGroup.add(turboGroup);
    this.engineAssembly.add(exhaustGroup);
  }

  /**
   * Top intake runner manifold & throttle bodies
   */
  private buildIntakeManifold(): void {
    const intakeGroup = new THREE.Group();
    intakeGroup.position.set(0, 1.25, 0);

    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const throttleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    // Central plenum chamber box
    const plenumGeo = new THREE.BoxGeometry(1.1, 0.45, 2.8);
    const plenum = new THREE.Mesh(plenumGeo, pipeMat);
    intakeGroup.add(plenum);

    // Throttle Body & Butterfly valve actuator
    const tbGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.55, 20);
    const tb = new THREE.Mesh(tbGeo, throttleMat);
    tb.rotation.x = Math.PI / 2;
    tb.position.set(0, 0.35, 1.1);
    intakeGroup.add(tb);

    // 4 Curved intake runners connecting plenum to cylinder head ports
    [-0.9, 0.9].forEach((z) => {
      const runnerL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 14), pipeMat);
      runnerL.rotation.z = Math.PI / 2.7;
      runnerL.position.set(-1.25, -0.3, z);
      intakeGroup.add(runnerL);

      const runnerR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 14), pipeMat);
      runnerR.rotation.z = -Math.PI / 2.7;
      runnerR.position.set(1.25, -0.3, z);
      intakeGroup.add(runnerR);
    });

    this.engineAssembly.add(intakeGroup);
  }

  /**
   * Rear aircraft firewall mount truss and accessory hardware
   */
  private buildAccessoriesAndMounts(): void {
    const mountGroup = new THREE.Group();
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.35 });
    const strutGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.9, 14);

    // 4 Diagonal aerospace tubular struts anchoring to rear aircraft firewall ring
    const strutConfigs = [
      { x: 1.25, y: 0.85, z: -2.8, rotZ: 0.32, rotX: -0.38 },
      { x: -1.25, y: 0.85, z: -2.8, rotZ: -0.32, rotX: -0.38 },
      { x: 1.25, y: -0.85, z: -2.8, rotZ: 0.32, rotX: 0.38 },
      { x: -1.25, y: -0.85, z: -2.8, rotZ: -0.32, rotX: 0.38 },
    ];

    strutConfigs.forEach((c) => {
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.set(c.x, c.y, c.z);
      strut.rotation.z = c.rotZ;
      strut.rotation.x = c.rotX;
      mountGroup.add(strut);
    });

    // Circular Aircraft Firewall Ring
    const firewallRingGeo = new THREE.TorusGeometry(1.85, 0.08, 12, 36);
    const firewallRing = new THREE.Mesh(firewallRingGeo, strutMat);
    firewallRing.position.set(0, 0, -3.9);
    mountGroup.add(firewallRing);

    this.engineAssembly.add(mountGroup);
  }

  /**
   * Update visual inspection cutaway mode (casing transparency)
   */
  public setCutawayMode(cutaway: boolean): void {
    this.crankcaseMaterial.transparent = cutaway;
    this.crankcaseMaterial.opacity = cutaway ? 0.32 : 1.0;
    this.crankcaseMaterial.roughness = cutaway ? 0.12 : 0.38;
    this.crankcaseMaterial.needsUpdate = true;

    this.crankcaseRibMaterial.transparent = cutaway;
    this.crankcaseRibMaterial.opacity = cutaway ? 0.42 : 1.0;
    this.crankcaseRibMaterial.needsUpdate = true;

    this.cylinderBarrelMaterial.transparent = cutaway;
    this.cylinderBarrelMaterial.opacity = cutaway ? 0.25 : 1.0;
    this.cylinderBarrelMaterial.needsUpdate = true;

    this.finMaterial.transparent = cutaway;
    this.finMaterial.opacity = cutaway ? 0.35 : 1.0;
    this.finMaterial.needsUpdate = true;

    this.finRimMaterial.transparent = cutaway;
    this.finRimMaterial.opacity = cutaway ? 0.45 : 1.0;
    this.finRimMaterial.needsUpdate = true;
  }

  /**
   * Reset engine to pristine initial kinematic and visual state
   */
  public reset(): void {
    this.crankAngle = 0;
    if (this.crankshaftGroup) {
      this.crankshaftGroup.rotation.z = 0;
    }
    if (this.propellerHub) {
      this.propellerHub.rotation.z = 0;
    }
    this.engineAssembly.position.set(0, 0, 0);

    // Re-align all pistons & connecting rods to static angle 0
    this.pistons.forEach((piston) => {
      const isRight = piston.bank === 'right';
      const angle = piston.phase;
      const xc = Math.cos(angle) * this.crankRadius;
      const yc = Math.sin(angle) * this.crankRadius;
      const clampedY = Math.min(this.rodLength * 0.98, Math.max(-this.rodLength * 0.98, yc));
      const deltaX = Math.sqrt(Math.max(0.01, this.rodLength * this.rodLength - clampedY * clampedY));
      const xp = isRight ? xc + deltaX : xc - deltaX;

      piston.group.position.set(xp, 0, piston.z);
      piston.rodGroup.position.set(xc, yc, piston.z);
      piston.rodGroup.rotation.z = Math.atan2(-yc, xp - xc);
    });

    // Reset thermal emissives
    this.cylinderHeadMaterials.forEach((mat) => {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0.0;
    });
    this.exhaustMaterials.forEach((mat) => {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0.0;
    });
    this.bearingMaterials.forEach((mat) => {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0.0;
    });
    this.statusRingMaterial.color.setHex(0x06b6d4);
    this.statusRingMaterial.opacity = 0.45;
  }

  /**
   * Core frame update called inside 60fps render loop
   * Updates crankshaft, articulating rods, reciprocating pistons, thermals, vibration & health
   */
  public update(
    dt: number,
    telemetry: TelemetryData,
    health: HealthReport,
    options: Engine3DOptions
  ): void {
    // 1. KINEMATIC ROTATION: Map simulated RPM directly to crankshaft angle
    const rpm = telemetry.rpm || 0;
    // Optical scaling factor for clear, readable mechanical motion
    const radPerSec = (rpm / 60) * 2 * Math.PI * 0.45;
    this.crankAngle += radPerSec * dt;

    // Rotate crankshaft and flywheel
    if (this.crankshaftGroup) {
      this.crankshaftGroup.rotation.z = this.crankAngle;
    }
    // Propeller reduction drive ratio is 1:2.43 on Rotax aero engines
    if (this.propellerHub) {
      this.propellerHub.rotation.z = this.crankAngle * 0.42;
    }

    // 2. PHYSICALLY COHERENT CRANK-SLIDER MECHANISM
    // Crankpin location: (xc, yc) = (R * cos(angle), R * sin(angle))
    // Piston wrist pin: moves along lateral X axis (y = 0)
    // Connecting rod spans length L exactly from crankpin to wrist pin
    this.pistons.forEach((piston) => {
      const isRight = piston.bank === 'right';
      const angle = this.crankAngle + piston.phase;

      // Crank pin location at this station
      const xc = Math.cos(angle) * this.crankRadius;
      const yc = Math.sin(angle) * this.crankRadius;

      // Distance from crankpin to wrist pin along X axis:
      // (xp - xc)^2 + (-yc)^2 = L^2  ==>  |xp - xc| = sqrt(L^2 - yc^2)
      const clampedY = Math.min(this.rodLength * 0.98, Math.max(-this.rodLength * 0.98, yc));
      const deltaX = Math.sqrt(Math.max(0.01, this.rodLength * this.rodLength - clampedY * clampedY));

      // Wrist pin X coordinate
      const xp = isRight ? xc + deltaX : xc - deltaX;

      // 1. Position Piston Assembly exactly at wrist pin (xp, 0, z)
      piston.group.position.set(xp, 0, piston.z);

      // 2. Position & Orient Connecting Rod
      // Anchored at crankpin (xc, yc, z)
      piston.rodGroup.position.set(xc, yc, piston.z);

      // Rod vector from crankpin (xc, yc) to wrist pin (xp, 0)
      const rodVecX = xp - xc;
      const rodVecY = -yc;
      const rodAngle = Math.atan2(rodVecY, rodVecX);
      piston.rodGroup.rotation.z = rodAngle;
    });

    // 3. REFINED THERMAL VISUALIZATION: CHT (Cylinder Heads) and EGT (Exhaust & Turbo)
    // CHT: Normal ~100-115°C, Caution >135°C, Critical >150°C
    let headEmissive = new THREE.Color(0x000000);
    let headIntensity = 0.0;

    if (telemetry.cht > 135) {
      // Caution to Critical
      const t = Math.min(1, (telemetry.cht - 135) / 25);
      headEmissive = new THREE.Color().lerpColors(new THREE.Color(0xf59e0b), new THREE.Color(0xef4444), t);
      headIntensity = 0.4 + t * 0.75;
    } else if (telemetry.cht > 105) {
      // Warm operational glow
      const t = (telemetry.cht - 105) / 30;
      headEmissive = new THREE.Color(0xd97706);
      headIntensity = t * 0.32;
    }

    this.cylinderHeadMaterials.forEach((mat) => {
      mat.emissive = headEmissive;
      mat.emissiveIntensity = headIntensity;
    });

    // EGT: Normal ~700-800°C, Warning >860°C, Critical >900°C
    const egt = telemetry.egt || 700;
    let exhaustEmissive = new THREE.Color(0x000000);
    let exhaustIntensity = 0.0;

    if (egt > 860) {
      const t = Math.min(1, (egt - 860) / 60);
      exhaustEmissive = new THREE.Color().lerpColors(new THREE.Color(0xf97316), new THREE.Color(0xdc2626), t);
      exhaustIntensity = 0.55 + t * 0.85;
    } else if (egt > 740) {
      const t = (egt - 740) / 120;
      exhaustEmissive = new THREE.Color(0xb45309);
      exhaustIntensity = t * 0.35;
    }

    this.exhaustMaterials.forEach((mat) => {
      mat.emissive = exhaustEmissive;
      mat.emissiveIntensity = exhaustIntensity;
    });

    // 4. CONTROLLED PHYSICAL VIBRATION: Subtle assembly tremor scaled by RMS vibration
    const now = performance.now() * 0.001;
    if (options.isPaused || dt === 0) {
      this.engineAssembly.position.set(0, 0, 0);
    } else {
      const vib = telemetry.vibration || 1.0;
      // Base vibration is subtle; higher vibration causes noticeable mechanical tremor
      const vibAmplitude = Math.min(0.038, 0.0022 * Math.pow(vib, 1.25));
      this.engineAssembly.position.x = Math.sin(now * 58) * vibAmplitude;
      this.engineAssembly.position.y = Math.cos(now * 72) * vibAmplitude * 0.85;
      this.engineAssembly.position.z = Math.sin(now * 88) * vibAmplitude * 0.45;
    }

    // 5. HEALTH STATE VISUAL INDICATION: Datum target ring color
    let statusColor = 0x06b6d4; // Cyan (NORMAL)
    let ringOpacity = 0.45;

    if (health.status === 'CRITICAL') {
      statusColor = 0xef4444; // Red (CRITICAL)
      ringOpacity = 0.65 + Math.sin(now * 8) * 0.3; // Pulsing alert
    } else if (health.status === 'WARNING') {
      statusColor = 0xf59e0b; // Amber (WARNING)
      ringOpacity = 0.55 + Math.sin(now * 4) * 0.15;
    }

    this.statusRingMaterial.color.setHex(statusColor);
    this.statusRingMaterial.opacity = ringOpacity;

    // 6. DEGRADATION HIGHLIGHTS
    if (telemetry.degradation_enabled) {
      const sev = telemetry.degradation_severity || 0.5;
      if (telemetry.degradation_scenario === 'LUBRICATION_DEGRADATION') {
        this.bearingMaterials.forEach((mat) => {
          mat.emissive = new THREE.Color(0xf59e0b);
          mat.emissiveIntensity = 0.35 * sev;
        });
      }
    } else {
      this.bearingMaterials.forEach((mat) => {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0.0;
      });
    }
  }

  public dispose(): void {
    this.rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
