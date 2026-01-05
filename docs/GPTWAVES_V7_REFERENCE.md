# GPT Waves V7 - Complete Monolith
**Version:** 7.0  
**Date:** 2025-01-27  
**Purpose:** Complete self-contained reference for GPT Waves V7 water simulation system  
**Status:** ✅ Complete Reference - Single Source of Truth

---

## 📋 PARSING INSTRUCTIONS FOR AI SYSTEMS

This monolith contains complete documentation and code for the GPT Waves V7 water simulation system:

**File Structure:**
- Each section is marked with `=== SECTION: [Name] ===`
- Code files are marked with `=== FILE: [path] ===`
- Documentation files are marked with `=== DOC: [name] ===`

**To Extract Files:**
1. Search for `=== FILE:` markers
2. Extract code between markers
3. Create files at specified paths
4. Search for `=== DOC:` markers
5. Extract documentation between markers
6. Create documentation files

**To Understand System:**
1. Read `=== DOC: Master System Map ===` first
2. Read `=== DOC: Architecture Overview ===` for system design
3. Read `=== FILE: ===` sections for actual code
4. Reference shader files for rendering implementation

---

## 📁 FILE STRUCTURE MAP

```
gptwaves-v7/
├── GptwavesV7Engine.tsx          # Main engine component (entry point)
├── GptwavesV7Scene.tsx           # Core scene component (3723 lines)
├── config/
│   └── WaveSimulationConfig.ts   # Configuration system
├── hooks/
│   ├── useWaterSimulation.ts     # Water simulation hook
│   └── useCaustics.ts            # Caustics rendering hook
├── components/
│   ├── WaterSurface.tsx          # Water surface rendering
│   ├── Pool.tsx                  # Pool walls rendering
│   ├── Sphere.tsx                # Interactive sphere
│   ├── Obstacles.tsx             # Beach obstacles
│   ├── SandFloor.tsx             # 2D sand floor
│   └── SandFloor3D.tsx          # 3D sand floor with displacement
├── shaders/
│   ├── simulationShaders.ts      # Wave simulation shaders
│   ├── causticsShaders.ts        # Caustics rendering shaders
│   ├── rendererShaders.ts        # Main rendering shaders
│   ├── bubbleShaders.ts          # Bubble particle shaders
│   ├── obstacleShaders.ts        # Obstacle rendering shaders
│   ├── sandShaders.ts           # 2D sand shaders
│   ├── sandShaders3D.ts         # 3D sand displacement shaders
│   ├── breachShaders.ts         # Breaching/spray metaball shaders
│   └── dripShaders.ts           # Drip droplet shaders
├── utils/
│   ├── obstacles.ts             # Obstacle generation utilities
│   └── rayMath.ts               # Ray-sphere intersection
└── assets/
    └── useWebglWaterAssets.ts   # Asset loading hook
```

---

## === DOC: Master System Map ===

# GPT Waves V7 - Master System Map
**Project:** GPT Waves V7 - Advanced Water Simulation  
**Date:** 2025-01-27  
**Purpose:** Complete system architecture documentation for interactive water simulation with physics, bubbles, breaching, and caustics

## System Overview

GPT Waves V7 is a comprehensive water simulation system built on React Three Fiber and Three.js. It implements:

1. **Height-Field Wave Simulation** - GPU-accelerated wave propagation using fragment shaders
2. **Interactive Sphere Physics** - Buoyancy, drag, planing, slamming with realistic water interaction
3. **Bubble Particle System** - 3D bubble particles with wake, surface entrainment, and coalescence
4. **Breaching/Spray System** - Metaball-based water sheets and blobs above the surface
5. **Caustics Rendering** - Refraction-based caustics with dispersion support
6. **Beach Environment** - Sand floor, obstacles, and dynamic boat

## Core Systems

### 1. Wave Simulation System
- **Location:** `hooks/useWaterSimulation.ts`, `shaders/simulationShaders.ts`
- **Method:** Height-field with finite difference wave equation
- **Resolution:** 256×256 (configurable)
- **Data Layout:** RGBA texture (height, velocity, normal.x, normal.z)
- **Features:**
  - Obstacle mask support (solid boundaries)
  - Sphere displacement coupling
  - Drop/impulse injection
  - Normal calculation

### 2. Physics System
- **Location:** `GptwavesV7Scene.tsx` (physics integration)
- **Features:**
  - Buoyancy (height-field sampling)
  - Added mass (fluid carries with sphere)
  - Quadratic drag (velocity-dependent)
  - Planing forces (surface skimming)
  - Slam forces (impact reactions)
  - Wake injection (momentum-based)
  - Collision detection (pool boundaries)

### 3. Bubble System
- **Location:** `GptwavesV7Scene.tsx` (bubble particle logic)
- **Features:**
  - Wake emission (rear separation)
  - Surface entrainment (waterline rim)
  - Impact bubbles (entry clouds)
  - Coalescence (merging)
  - Surface foam field (2D accumulation)
  - 3D density field (layered texture)
  - Smart-link mode (bubbles align with foam)

### 4. Breaching System
- **Location:** `GptwavesV7Scene.tsx` (breach metaball logic), `shaders/breachShaders.ts`
- **Features:**
  - Wave retraction detection
  - Metaball chains (strands)
  - Re-entry collision (wave surface sampling)
  - Cavitation trails (concave entry)
  - Delayed ejecta bursts

### 5. Caustics System
- **Location:** `hooks/useCaustics.ts`, `shaders/causticsShaders.ts`
- **Features:**
  - Refraction-based caustics
  - Area change calculation (focus)
  - Transmission (Fresnel)
  - Absorption (path length)
  - Soft sun (angular radius)
  - Temporal accumulation
  - Dispersion support

### 6. Rendering System
- **Location:** `components/WaterSurface.tsx`, `shaders/rendererShaders.ts`
- **Features:**
  - Above/underwater views
  - Sky cubemap reflections
  - Bubble scattering (volumetric)
  - Surface foam (micro-foam brightening)
  - Obstacle shadows
  - Sand floor (beach mode)

## Data Flow

```
User Input → Sphere Physics → Water Displacement → Wave Simulation
                                                          ↓
                    Caustics ← Water Texture ← Normal Calculation
                                                          ↓
                    Rendering ← Bubble Field ← Bubble Particles
                                                          ↓
                    Breaching ← Wave Retraction ← Wave Heights
```

## Key Algorithms

1. **Wave Propagation:** Finite difference with neighbor averaging
2. **Buoyancy:** Height-field sampling
3. **Caustics:** Refraction projection with area change
4. **Bubble Coalescence:** Spatial hash with volume conservation
5. **Breaching:** Metaball SDF raymarching
6. **Surface Foam:** 2D accumulation with decay

---

## === DOC: Architecture Overview ===

# GPT Waves V7 - Architecture Overview

## Component Hierarchy

```
GptwavesV7Engine
  └── GptwavesV7Scene
      ├── WaterSurface (above + underwater meshes)
      ├── Pool (or SandFloor + Obstacles + Boat)
      ├── Sphere
      ├── Bubble InstancedMesh
      ├── Drip InstancedMesh
      └── Breach Metaball Mesh
```

## Hook Architecture

1. **useWaterSimulation** - Manages wave simulation textures and operations
2. **useCaustics** - Manages caustics render target and updates
3. **useWebglWaterAssets** - Loads tile texture and sky cubemap

## Shader Pipeline

1. **Simulation Passes:**
   - Drop/Impulse injection
   - Sphere displacement
   - Wave update (neighbor averaging)
   - Normal calculation

2. **Caustics Pass:**
   - Refraction projection
   - Area change calculation
   - Focus/intensity computation

3. **Rendering Pass:**
   - Water surface (above/underwater)
   - Pool walls / Sand floor
   - Sphere
   - Obstacles
   - Bubble particles
   - Drip droplets
   - Breach metaballs

## State Management

- **Refs for mutable state:** sphereCenterRef, sphereVelocityRef, bubblePoolRef, etc.
- **Settings from props:** UnifiedWaterSettings interface
- **Render targets:** Water textures (ping-pong), caustics texture, bubble field texture

---

## === FILE: GptwavesV7Engine.tsx ===

```typescript
/**
 * GptwavesV7Engine - iteration sandbox for "unified metrics" + smoother cross-effect transitions.
 *
 * V7 starts as a copy of v6, then we iterate without destabilizing v6/v5.
 *
 * NOTE: This component is rendered INSIDE a Canvas from App.tsx.
 */

import { GptwavesV7Scene } from './GptwavesV7Scene';
import { UnifiedWaterSettings } from '../../types/WaterSettings';

interface GptwavesV7EngineProps {
  settings: UnifiedWaterSettings;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
}

export function GptwavesV7Engine({ settings, onResetRef }: GptwavesV7EngineProps) {
  // Extract settings
  const paused = !settings.waves.autoUpdate;
  const spherePhysicsEnabled = settings.sphere.enabled;
  const lightFollowCamera = false;
  const poolEnabled = settings.pool.enabled;
  const poolSize = settings.pool.size;
  const backgroundType = settings.scene.backgroundType;

  // Volumetric clouds are handled in App.tsx, so we just return the scene
  return (
    <GptwavesV7Scene
      settings={settings}
      paused={paused}
      spherePhysicsEnabled={spherePhysicsEnabled}
      lightFollowCamera={lightFollowCamera}
      poolEnabled={poolEnabled}
      poolSize={poolSize}
      backgroundType={backgroundType}
      skyCaptureResolution={settings.reflections.cubeCameraResolution}
      skyCaptureFrames={settings.reflections.cubeCameraFrames}
      skyCaptureNear={settings.reflections.cubeCameraNear}
      skyCaptureFar={settings.reflections.cubeCameraFar}
      onResetRef={onResetRef}
    />
  );
}
```

---

## === FILE: GptwavesV7Scene.tsx ===

**⚠️ CRITICAL: Complete 3723-line file embedded below.**

```typescript
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CubeCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useWebglWaterAssets } from './assets/useWebglWaterAssets';
import { Obstacles } from './components/Obstacles';
import { Pool } from './components/Pool';
import { SandFloor } from './components/SandFloor';
import { Sphere } from './components/Sphere';
import { WaterSurface } from './components/WaterSurface';
import { useCaustics } from './hooks/useCaustics';
import { useWaterSimulation } from './hooks/useWaterSimulation';
import { BUBBLE_FRAGMENT_SHADER, BUBBLE_VERTEX_SHADER } from './shaders/bubbleShaders';
import { BREACH_FRAGMENT_SHADER, BREACH_VERTEX_SHADER } from './shaders/breachShaders';
import { DRIP_FRAGMENT_SHADER, DRIP_VERTEX_SHADER } from './shaders/dripShaders';
import { OBSTACLE_FRAGMENT_SHADER, OBSTACLE_VERTEX_SHADER } from './shaders/obstacleShaders';
import { hitTestSphere } from './utils/rayMath';
import type { UnifiedWaterSettings } from '../../types/WaterSettings';
import {
  createObstacleMaskData,
  createObstacleMaskTextureFromData,
  DEFAULT_BEACH_OBSTACLES,
  stampCapsuleObstacleMaskData,
} from './utils/obstacles';

const MODE_NONE = -1;
const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;
const MODE_ORBIT_CAMERA = 2;
const MODE_PAN_CAMERA = 3; // V7: Right-click drag to pan

const BUOYANCY_MAX_SAMPLES = 64;
const BUBBLE_MAX_PARTICLES = 1024;
const DRIP_MAX_PARTICLES = 256;
const BUBBLE_WAKE_SPEED_EPS = 1e-6;
// V7: Experimental iteration (keeps V6 as baseline).
const BUBBLE_FIELD_SIZE = 96;
const BUBBLE_FIELD_LAYERS = 12;

// Breaching / spray metaballs (separate from bubbles).
const BREACH_MAX_BLOBS = 64;

export function GptwavesV7Scene({
  settings,
  paused,
  spherePhysicsEnabled,
  lightFollowCamera,
  poolEnabled,
  poolSize,
  backgroundType,
  skyCaptureResolution,
  skyCaptureFrames,
  skyCaptureNear,
  skyCaptureFar,
  onResetRef,
}: {
  settings: UnifiedWaterSettings;
  paused: boolean;
  spherePhysicsEnabled: boolean;
  lightFollowCamera: boolean;
  poolEnabled: boolean;
  poolSize: number;
  backgroundType: UnifiedWaterSettings['scene']['backgroundType'];
  skyCaptureResolution: 256 | 512 | 1024;
  skyCaptureFrames: number;
  skyCaptureNear: number;
  skyCaptureFar: number;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const { camera, gl } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const boatRef = useRef<THREE.Mesh>(null);
  const pausedRef = useRef(paused);
  const spherePhysicsEnabledRef = useRef(spherePhysicsEnabled);
  const lightFollowCameraRef = useRef(lightFollowCamera);
  const poolSizeRef = useRef(poolSize);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    spherePhysicsEnabledRef.current = spherePhysicsEnabled;
  }, [spherePhysicsEnabled]);

  useEffect(() => {
    lightFollowCameraRef.current = lightFollowCamera;
  }, [lightFollowCamera]);

  useEffect(() => {
    poolSizeRef.current = poolSize;
  }, [poolSize]);

  // Camera orbit parameters (match original main.js defaults).
  const angleXDegRef = useRef(-25);
  const angleYDegRef = useRef(-200.5);
  // V7: Camera distance for scroll zoom
  const cameraDistanceRef = useRef(4.0);
  // V7: Pan offset for right-click pan
  const panOffsetRef = useRef({ x: 0, y: 0.5 }); // Default y=0.5 from original
  const groupMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Sphere physics state (match original).
  const sphereRadius = settings.sphere.radius;
  const sphereCenterRef = useRef(
    new THREE.Vector3(
      settings.sphere.position.x,
      settings.sphere.position.y,
      settings.sphere.position.z
    )
  );
  const sphereOldCenterRef = useRef(sphereCenterRef.current.clone());
  const sphereVelocityRef = useRef(new THREE.Vector3());
  const sphereMouseTargetRef = useRef<THREE.Vector3 | null>(null); // Target position from mouse (elastic constraint)
  // V5: Track target velocity so the cursor can drag fast without the controller “braking to zero”
  // (This fixes the “moves the wrong way / returns to origin when moving cursor fast” feel.)
  const sphereMouseTargetPrevRef = useRef<THREE.Vector3 | null>(null);
  const sphereMouseTargetVelRef = useRef(new THREE.Vector3(0, 0, 0));
  const gravity = useMemo(() => new THREE.Vector3(0, -4, 0), []);

  const buoyancyNextSampleTimeRef = useRef(0);
  const buoyancySubmergedFractionRef = useRef(0);
  const sphereSubmergedFractionRef = useRef(0);
  const sphereSubmergedPrevRef = useRef(0);
  const sphereWetnessRef = useRef(0);

  // Scratch buffers for sampling water heights via buoyancySampler (64-wide 1px readback).
  const waterSampleIdxRef = useRef(new Int16Array(BUOYANCY_MAX_SAMPLES));
  const waterSampleXRef = useRef(new Float32Array(BUOYANCY_MAX_SAMPLES));
  const waterSampleZRef = useRef(new Float32Array(BUOYANCY_MAX_SAMPLES));
  const waterSampleHRef = useRef(new Float32Array(BUOYANCY_MAX_SAMPLES));

  // Bubble particle system (instanced).
  const bubbleMeshRef = useRef<THREE.InstancedMesh>(null);
  const bubbleSpawnCarryRef = useRef(0);
  const bubbleNextIndexRef = useRef(0);
  const bubbleInitRef = useRef(false);
  const bubbleMergedThisFrameRef = useRef(new Uint8Array(BUBBLE_MAX_PARTICLES));
  const bubblePoolRef = useRef({
    active: new Uint8Array(BUBBLE_MAX_PARTICLES),
    age: new Float32Array(BUBBLE_MAX_PARTICLES),
    life: new Float32Array(BUBBLE_MAX_PARTICLES),
    size: new Float32Array(BUBBLE_MAX_PARTICLES),
    surfaceHoldState: new Uint8Array(BUBBLE_MAX_PARTICLES), // 0=underwater, 1=holding at surface
    surfaceHoldUntil: new Float32Array(BUBBLE_MAX_PARTICLES), // absolute age (seconds) when bubble should pop
    pos: new Float32Array(BUBBLE_MAX_PARTICLES * 3),
    vel: new Float32Array(BUBBLE_MAX_PARTICLES * 3),
    turb: new Float32Array(BUBBLE_MAX_PARTICLES * 3),
    seedA: new Float32Array(BUBBLE_MAX_PARTICLES),
    seedB: new Float32Array(BUBBLE_MAX_PARTICLES),
  });
  const bubbleTmpObj = useMemo(() => new THREE.Object3D(), []);
  const bubbleRandomRef = useRef({ spare: 0, hasSpare: false });

  // Drip droplets (wet sphere in air) – simple instanced particle system.
  const dripMeshRef = useRef<THREE.InstancedMesh>(null);
  const dripSpawnCarryRef = useRef(0);
  const dripExitCooldownRef = useRef(0);
  const dripNextIndexRef = useRef(0);
  const dripInitRef = useRef(false);
  const dripPoolRef = useRef({
    active: new Uint8Array(DRIP_MAX_PARTICLES),
    age: new Float32Array(DRIP_MAX_PARTICLES),
    life: new Float32Array(DRIP_MAX_PARTICLES),
    radius: new Float32Array(DRIP_MAX_PARTICLES),
    pos: new Float32Array(DRIP_MAX_PARTICLES * 3),
    vel: new Float32Array(DRIP_MAX_PARTICLES * 3),
  });
  const dripTmpObj = useMemo(() => new THREE.Object3D(), []);

  // Breaching / spray metaballs (raymarched) – “water sheets” and blobs above the surface.
  const breachMeshRef = useRef<THREE.Mesh>(null);
  const breachSpawnCarryRef = useRef(0);
  const breachNextIndexRef = useRef(0);
  const breachPoolRef = useRef({
    active: new Uint8Array(BREACH_MAX_BLOBS),
    age: new Float32Array(BREACH_MAX_BLOBS),
    life: new Float32Array(BREACH_MAX_BLOBS),
    radius: new Float32Array(BREACH_MAX_BLOBS),
    pos: new Float32Array(BREACH_MAX_BLOBS * 3),
    vel: new Float32Array(BREACH_MAX_BLOBS * 3),
  });
  const breachUniformBlobs = useMemo(
    () => Array.from({ length: BREACH_MAX_BLOBS }, () => new THREE.Vector4(0, 0, 0, 0)),
    []
  );

  // Cavitation / vacuum entry (concave trail + delayed ejecta burst using breach blobs).
  const cavitationPrevSubRef = useRef(0);
  const cavitationCooldownRef = useRef(0);
  const cavitationPendingRef = useRef({
    active: false,
    timer: 0,
    baseX: 0,
    baseZ: 0,
    dirX: 0,
    dirZ: 0,
    rearX: 0,
    rearZ: 0,
    entrySpeed: 0,
    hSpeed: 0,
  });

  // V7: Wave retraction tracking (for retraction-driven breaching).
  // Track wave heights at sample points around the sphere to detect retraction velocity.
  const WAVE_RETRACT_SAMPLES = 8;
  const waveRetractionRef = useRef({
    prevHeights: new Float32Array(WAVE_RETRACT_SAMPLES),
    sampleX: new Float32Array(WAVE_RETRACT_SAMPLES),
    sampleZ: new Float32Array(WAVE_RETRACT_SAMPLES),
    maxRetractionSpeed: 0, // highest retraction speed this frame
    avgRetractionSpeed: 0, // average retraction speed this frame
    retractionDir: { x: 0, z: 0 }, // direction of max retraction
    initialized: false,
  });

  const bubbleField = useMemo(() => {
    const size = BUBBLE_FIELD_SIZE;
    const layers = BUBBLE_FIELD_LAYERS;
    const data = new Uint8Array(size * size * layers * 4);
    const tex = new THREE.DataTexture(data, size, size * layers, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return { tex, data, size, layers };
  }, []);

  useEffect(() => {
    return () => {
      bubbleField.tex.dispose();
    };
  }, [bubbleField]);

  // Persistent 2D surface foam field (separate from the 3D bubble density field).
  // This is what the water shader uses to render the surface foam/entrainment layer.
  const surfaceFoamField = useMemo(() => {
    const size = 256;
    const accum = new Float32Array(size * size); // 0..255 (float for smooth decay)
    const data = new Uint8Array(size * size * 4);
    // Initialize to black with alpha=255.
    for (let i = 0; i < size * size; i++) {
      data[i * 4 + 0] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return { tex, data, accum, size };
  }, []);

  useEffect(() => {
    return () => {
      surfaceFoamField.tex.dispose();
    };
  }, [surfaceFoamField]);

  const bubbleRandNormal = useCallback(() => {
    // Box–Muller transform with cached spare sample to avoid extra calls.
    const rng = bubbleRandomRef.current;
    if (rng.hasSpare) {
      rng.hasSpare = false;
      return rng.spare;
    }
    let u = 0;
    let v = 0;
    // Avoid log(0).
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    const z0 = mag * Math.cos(2.0 * Math.PI * v);
    const z1 = mag * Math.sin(2.0 * Math.PI * v);
    rng.spare = z1;
    rng.hasSpare = true;
    return z0;
  }, []);

  const buoyancySamples = useMemo(() => {
    const rawSampleCount = settings.sphere.physics.sampleCount;
    const sampleCount = Math.max(1, Math.min(BUOYANCY_MAX_SAMPLES, Math.round(rawSampleCount)));
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const samples = Array.from({ length: sampleCount }, (_, i) => {
      const r = Math.sqrt((i + 0.5) / sampleCount) * sphereRadius;
      const theta = i * goldenAngle;
      const dx = Math.cos(theta) * r;
      const dz = Math.sin(theta) * r;
      return { dx, dz, r2: dx * dx + dz * dz };
    });

    return {
      sampleCount,
      samples,
      areaElement: (Math.PI * sphereRadius * sphereRadius) / sampleCount,
      sphereVolume: (4 / 3) * Math.PI * Math.pow(sphereRadius, 3),
    };
  }, [settings.sphere.physics.sampleCount, sphereRadius]);

  const buoyancySampler = useMemo(() => {
    const uvData = new Uint8Array(BUOYANCY_MAX_SAMPLES * 4);
    for (let i = 0; i < BUOYANCY_MAX_SAMPLES; i++) {
      uvData[i * 4] = 128;
      uvData[i * 4 + 1] = 128;
      uvData[i * 4 + 2] = 0;
      uvData[i * 4 + 3] = 255;
    }

    const uvTexture = new THREE.DataTexture(uvData, BUOYANCY_MAX_SAMPLES, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    uvTexture.wrapS = THREE.ClampToEdgeWrapping;
    uvTexture.wrapT = THREE.ClampToEdgeWrapping;
    uvTexture.minFilter = THREE.NearestFilter;
    uvTexture.magFilter = THREE.NearestFilter;
    uvTexture.generateMipmaps = false;
    uvTexture.needsUpdate = true;

    const renderTarget = new THREE.WebGLRenderTarget(BUOYANCY_MAX_SAMPLES, 1, {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    renderTarget.texture.generateMipmaps = false;

    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uWater: { value: null as unknown as THREE.Texture },
        uSampleUvTex: { value: uvTexture },
        uEncodeScale: { value: 4 },
      },
      vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xyz, 1.0);
}
`,
      fragmentShader: /* glsl */ `
precision highp float;
uniform sampler2D uWater;
uniform sampler2D uSampleUvTex;
uniform float uEncodeScale;
varying vec2 vUv;

void main() {
  float idx = floor(gl_FragCoord.x);
  float u = (idx + 0.5) / ${BUOYANCY_MAX_SAMPLES}.0;
  vec2 sampleUv = texture2D(uSampleUvTex, vec2(u, 0.5)).rg;
  float h = texture2D(uWater, sampleUv).r;
  float enc = clamp(0.5 + h * uEncodeScale, 0.0, 1.0);
  gl_FragColor = vec4(enc, 0.0, 0.0, 1.0);
}
`,
      depthTest: false,
      depthWrite: false,
    });

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(quadGeometry, material);
    scene.add(mesh);

    const readBuffer = new Uint8Array(BUOYANCY_MAX_SAMPLES * 4);

    return {
      uvData,
      uvTexture,
      renderTarget,
      scene,
      quadCamera,
      quadGeometry,
      material,
      mesh,
      readBuffer,
    };
  }, []);

  useEffect(() => {
    return () => {
      buoyancySampler.renderTarget.dispose();
      buoyancySampler.uvTexture.dispose();
      buoyancySampler.material.dispose();
      buoyancySampler.quadGeometry.dispose();
    };
  }, [buoyancySampler]);

  // Light direction (default to unified settings; can optionally follow camera).
  const lightDirRef = useRef(
    new THREE.Vector3(
      settings.lighting.directionalDirection.x,
      settings.lighting.directionalDirection.y,
      settings.lighting.directionalDirection.z
    ).normalize()
  );

  useEffect(() => {
    if (lightFollowCameraRef.current) return;
    lightDirRef.current
      .set(
        settings.lighting.directionalDirection.x,
        settings.lighting.directionalDirection.y,
        settings.lighting.directionalDirection.z
      )
      .normalize();
  }, [settings.lighting.directionalDirection]);

  // Input/drag state (match original flow).
  const modeRef = useRef<number>(MODE_NONE);
  const oldXRef = useRef(0);
  const oldYRef = useRef(0);
  const prevHitRef = useRef(new THREE.Vector3());
  const planeNormalRef = useRef(new THREE.Vector3());
  // V5: Constraint plane for stable cursor interaction
  const constraintPlanePointRef = useRef<THREE.Vector3 | null>(null);
  const constraintPlaneNormalRef = useRef<THREE.Vector3 | null>(null);
  // V5: Preserve where on the sphere we grabbed (so cursor moves the grabbed point, not the center)
  // Stored as: center - hitPoint at grab time.
  const grabOffsetRef = useRef(new THREE.Vector3(0, 0, 0));
  // V5: Store grab depth along the pointer ray (stable 2D->3D mapping while dragging)
  const dragRayDepthRef = useRef<number | null>(null);

  useEffect(() => {
    if (modeRef.current === MODE_MOVE_SPHERE) return;
    sphereCenterRef.current.set(
      settings.sphere.position.x,
      settings.sphere.position.y,
      settings.sphere.position.z
    );
    sphereOldCenterRef.current.copy(sphereCenterRef.current);
    sphereVelocityRef.current.set(0, 0, 0);
  }, [settings.sphere.position.x, settings.sphere.position.y, settings.sphere.position.z]);

  const { tileTexture, skyCubemap, assetsLoaded } = useWebglWaterAssets();

  const fallbackSkyCubemap = useMemo(() => new THREE.CubeTexture(), []);
  useEffect(() => {
    return () => {
      fallbackSkyCubemap.dispose();
    };
  }, [fallbackSkyCubemap]);

  const simulationResolution = 256;
  const { addDrop, addImpulse, getTexture, moveSphere, reset, setObstacleTexture, stepSimulation, updateNormals } =
    useWaterSimulation({ resolution: simulationResolution });
  const { texture: causticsTexture, updateCaustics } = useCaustics({
    ...settings.caustics,
    iorAir: settings.material.iorAir,
    iorWater: settings.material.iorWater,
    poolHeight: 1.0,
  });

  const bubbleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        light: { value: new THREE.Vector3(0, 1, 0) },
        sky: { value: skyCubemap ?? fallbackSkyCubemap },
        water: { value: null as unknown as THREE.Texture },
        causticTex: { value: causticsTexture },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: sphereRadius },
        uCameraPos: { value: new THREE.Vector3() },
        uOpacity: { value: 0.35 },
        uReflectStrength: { value: 1.0 },
        uFresnelPower: { value: 3.0 },
        uIorAir: { value: 1.0 },
        uIorWater: { value: 1.333 },
        uCausticsScale: { value: 1.0 },
        uCausticsStrength: { value: 1.0 },
        uDispersionStrength: { value: 0.0 },
      },
      vertexShader: BUBBLE_VERTEX_SHADER,
      fragmentShader: BUBBLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
  }, [causticsTexture, fallbackSkyCubemap, skyCubemap]);

  useEffect(() => {
    return () => {
      bubbleMaterial.dispose();
    };
  }, [bubbleMaterial]);

  const dripMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        light: { value: new THREE.Vector3(0, 1, 0) },
        uCameraPos: { value: new THREE.Vector3() },
        uOpacity: { value: 0.55 },
      },
      vertexShader: DRIP_VERTEX_SHADER,
      fragmentShader: DRIP_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      dripMaterial.dispose();
    };
  }, [dripMaterial]);

  const breachMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uCameraLocal: { value: new THREE.Vector3() },
        uLightDir: { value: new THREE.Vector3(0, 1, 0) },
        uSky: { value: skyCubemap ?? fallbackSkyCubemap },
        uBlobCount: { value: 0.0 },
        uBlobs: { value: breachUniformBlobs },
        uIso: { value: 1.15 },
        uOpacity: { value: 0.65 },
        // Must match the boxGeometry used in JSX (local space).
        uBoundsMin: { value: new THREE.Vector3(-1.0, -0.6, -1.0) },
        uBoundsMax: { value: new THREE.Vector3(1.0, 0.6, 1.0) },
      },
      vertexShader: BREACH_VERTEX_SHADER,
      fragmentShader: BREACH_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });
  }, [breachUniformBlobs, fallbackSkyCubemap, skyCubemap]);

  useEffect(() => {
    return () => {
      breachMaterial.dispose();
    };
  }, [breachMaterial]);

  const beachObstacles = useMemo(
    () => (poolEnabled ? [] : DEFAULT_BEACH_OBSTACLES),
    [poolEnabled]
  );

  const obstacleMask = useMemo(() => {
    if (beachObstacles.length === 0) return null;
    const baseData = createObstacleMaskData({
      obstacles: beachObstacles,
      resolution: simulationResolution,
      padding: 0.02,
    });
    const data: Uint8Array<ArrayBuffer> = new Uint8Array(baseData);
    const texture = createObstacleMaskTextureFromData({ data, resolution: simulationResolution });
    return { baseData, data, texture };
  }, [beachObstacles, simulationResolution]);

  useEffect(() => {
    setObstacleTexture(obstacleMask?.texture);
    return () => {
      setObstacleTexture(null);
      obstacleMask?.texture.dispose();
    };
  }, [obstacleMask, setObstacleTexture]);

  const boatGeometry = useMemo(() => new THREE.BoxGeometry(0.32, 0.16, 0.14), []);

  const boatMaterial = useMemo(() => {
    const baseColor = new THREE.Color('#2b2f3a');
    return new THREE.ShaderMaterial({
      uniforms: {
        water: { value: null as unknown as THREE.Texture },
        causticTex: { value: causticsTexture },
        light: { value: lightDirRef.current.clone() },
        baseColor: { value: baseColor },
        uInvScale: { value: 1.0 },
        uIorAir: { value: 1.0 },
        uIorWater: { value: 1.333 },
        uCausticsScale: { value: 0.75 },
        uCausticsStrength: { value: 1.0 },
        uDispersionStrength: { value: 0.0 },
      },
      vertexShader: OBSTACLE_VERTEX_SHADER,
      fragmentShader: OBSTACLE_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
    });
  }, [causticsTexture]);

  // Allow the outer app to trigger a full reset via a shared ref.
  useEffect(() => {
    if (!onResetRef) return;
    onResetRef.current = reset;
    return () => {
      onResetRef.current = null;
    };
  }, [onResetRef, reset]);

  // Seed initial ripples (match original: 20 alternating drops).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    reset();
    for (let i = 0; i < 20; i++) {
      addDrop(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        0.03,
        i % 2 === 0 ? 0.01 : -0.01
      );
    }
  }, [addDrop, reset]);

  // Pointer input handlers (ported from original main.js).
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const toLocalRay = (originWorld: THREE.Vector3, dirWorld: THREE.Vector3) => {
      const group = groupRef.current;
      if (!group) {
        return {
          origin: originWorld.clone(),
          dir: dirWorld.clone(),
        };
      }

      const origin = group.worldToLocal(originWorld.clone());
      const end = group.worldToLocal(originWorld.clone().add(dirWorld));
      const dir = end.sub(origin).normalize();
      return { origin, dir };
    };

    const getRayForPointerEvent = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      return toLocalRay(raycaster.ray.origin, raycaster.ray.direction);
    };

    const getCenterRayDirection = () => {
      const dirWorld = new THREE.Vector3();
      camera.getWorldDirection(dirWorld);
      return toLocalRay(camera.position, dirWorld).dir;
    };

    const startDrag = (
      x: number,
      y: number,
      rayOrigin: THREE.Vector3,
      rayDir: THREE.Vector3,
      button: number // V7: Track which mouse button
    ) => {
      oldXRef.current = x;
      oldYRef.current = y;

      // V7: Right-click (button 2) = pan camera
      if (button === 2 && settings.camera.rightClickPanEnabled) {
        modeRef.current = MODE_PAN_CAMERA;
        dom.style.cursor = 'move';
        return;
      }

      // Default to orbit camera mode (most common interaction)
      modeRef.current = MODE_ORBIT_CAMERA;
      dom.style.cursor = 'grab';

      // Check if clicking on sphere first (highest priority)
      const sphereHit = hitTestSphere(
        rayOrigin,
        rayDir,
        sphereCenterRef.current,
        sphereRadius
      );

      if (sphereHit) {
        modeRef.current = MODE_MOVE_SPHERE;
        prevHitRef.current.copy(sphereHit.hit);
        
        // V5: Create constraint plane for stable cursor interaction
        // Plane goes through hit point, normal is camera forward direction
        const cameraForward = getCenterRayDirection().normalize();
        constraintPlanePointRef.current = sphereHit.hit.clone();
        constraintPlaneNormalRef.current = cameraForward.clone();
        
        // V5: Preserve grab offset (hit point -> sphere center) so we target the CENTER correctly.
        // Without this, the solver chases a surface point and creates jitter/oscillation.
        grabOffsetRef.current.copy(sphereCenterRef.current).sub(sphereHit.hit);

        // V5: Store depth along the ray at the grab moment (used for stable dragging)
        dragRayDepthRef.current = sphereHit.t;

        // Initialize mouse target to current center (no snap on grab)
        sphereMouseTargetRef.current = sphereCenterRef.current.clone();
        // Reset target velocity tracking for a clean grab (prevents first-frame impulse).
        sphereMouseTargetPrevRef.current = null;
        sphereMouseTargetVelRef.current.set(0, 0, 0);
        
        // Keep planeNormalRef for backward compatibility (not used in new approach)
        planeNormalRef.current.copy(cameraForward).multiplyScalar(-1);
        dom.style.cursor = 'grabbing';
        return;
      }

      // Check if clicking on water surface (within pool bounds)
      // Match original: calculate intersection with y=0 plane
      if (Math.abs(rayDir.y) > 0.0001) {
        const t = -rayOrigin.y / rayDir.y;
        if (t > 0) { // Only consider intersections in front of camera
          const pointOnPlane = rayOrigin.clone().add(rayDir.clone().multiplyScalar(t));

          // Check if point is within pool bounds (original only checks X and Z)
          if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
            modeRef.current = MODE_ADD_DROPS;
            dom.style.cursor = 'crosshair';
            addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
            if (pausedRef.current) {
              updateNormals();
              updateCaustics(
                getTexture(),
                lightDirRef.current,
                sphereCenterRef.current,
                sphereRadius
              );
            }
            return;
          }
        }
      }

      // If we get here, orbit camera mode was already set (default)
    };

    const duringDrag = (
      x: number,
      y: number,
      rayOrigin: THREE.Vector3,
      rayDir: THREE.Vector3
    ) => {
      const dx = x - oldXRef.current;
      const dy = y - oldYRef.current;

      if (modeRef.current === MODE_ADD_DROPS) {
        const t = -rayOrigin.y / rayDir.y;
        const pointOnPlane = rayOrigin.clone().add(rayDir.clone().multiplyScalar(t));
        addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
        if (pausedRef.current) {
          updateNormals();
          updateCaustics(
            getTexture(),
            lightDirRef.current,
            sphereCenterRef.current,
            sphereRadius
          );
        }
      } else if (modeRef.current === MODE_MOVE_SPHERE) {
        // V5: Stable drag mapping (standard): keep a constant depth along the pointer ray.
        // This avoids axis flips and the “moves the wrong way until cursor leaves sphere” problem.
        const dragDepth = dragRayDepthRef.current;
        if (dragDepth !== null && dragDepth > 0) {
          // Point under cursor at the same depth as the initial grab.
          const hitPoint = rayOrigin.clone().add(rayDir.clone().multiplyScalar(dragDepth));
          // Convert grabbed point target -> sphere center target using preserved offset.
          const targetPosition = hitPoint.clone().add(grabOffsetRef.current);

          // Clamp to pool bounds (accounting for sphere radius)
          const poolMin = -1;
          const poolMax = 1;
          const minBound = poolMin + sphereRadius;
          const maxBound = poolMax - sphereRadius;

          targetPosition.x = Math.max(minBound, Math.min(maxBound, targetPosition.x));
          targetPosition.y = Math.max(minBound, Math.min(10, targetPosition.y));
          targetPosition.z = Math.max(minBound, Math.min(maxBound, targetPosition.z));

          sphereMouseTargetRef.current = targetPosition;
          prevHitRef.current.copy(hitPoint);
        }

        if (pausedRef.current) {
          updateCaustics(
            getTexture(),
            lightDirRef.current,
            sphereCenterRef.current,
            sphereRadius
          );
        }
      } else if (modeRef.current === MODE_ORBIT_CAMERA) {
        // Match original exactly: subtract delta (original uses screen coordinates directly)
        angleYDegRef.current -= dx;
        angleXDegRef.current -= dy;
        angleXDegRef.current = Math.max(-89.999, Math.min(89.999, angleXDegRef.current));
      } else if (modeRef.current === MODE_PAN_CAMERA) {
        // V7: Pan the camera (move the look-at point)
        const panSpeed = Math.max(0.1, settings.camera.panSpeed) * 0.005;
        panOffsetRef.current.x += dx * panSpeed;
        panOffsetRef.current.y -= dy * panSpeed; // Invert y for natural movement
      }

      oldXRef.current = x;
      oldYRef.current = y;
    };

    const stopDrag = () => {
      modeRef.current = MODE_NONE;
      sphereMouseTargetRef.current = null; // Clear mouse target when released
      sphereMouseTargetPrevRef.current = null;
      sphereMouseTargetVelRef.current.set(0, 0, 0);
      constraintPlanePointRef.current = null; // Clear constraint plane
      constraintPlaneNormalRef.current = null;
      grabOffsetRef.current.set(0, 0, 0);
      dragRayDepthRef.current = null;
      dom.style.cursor = 'default';
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      dom.setPointerCapture(e.pointerId);
      const { origin, dir } = getRayForPointerEvent(e);
      startDrag(e.clientX, e.clientY, origin, dir, e.button);
    };

    // V7: Prevent context menu on right-click (for panning)
    const onContextMenu = (e: MouseEvent) => {
      if (settings.camera.rightClickPanEnabled) {
        e.preventDefault();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (modeRef.current === MODE_NONE) return;
      e.preventDefault();
      const { origin, dir } = getRayForPointerEvent(e);
      duringDrag(e.clientX, e.clientY, origin, dir);
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      dom.releasePointerCapture(e.pointerId);
      stopDrag();
    };

    // V7: Scroll wheel zoom
    const onWheel = (e: WheelEvent) => {
      if (!settings.camera.scrollZoomEnabled) return;
      e.preventDefault();
      
      const zoomSpeed = Math.max(0.1, settings.camera.scrollZoomSpeed) * 0.002;
      const delta = e.deltaY * zoomSpeed;
      const minDist = Math.max(0.1, settings.camera.minDistance);
      const maxDist = Math.max(minDist + 0.1, settings.camera.maxDistance);
      
      cameraDistanceRef.current = THREE.MathUtils.clamp(
        cameraDistanceRef.current + delta,
        minDist,
        maxDist
      );
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [addDrop, camera, getTexture, gl, settings.camera, updateCaustics, updateNormals]);

  // Per-frame: update camera, optionally update simulation (match original update/draw order).
  useFrame((state, deltaSeconds) => {
    const groupScale = poolSizeRef.current / 2;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(groupScale);
      groupRef.current.updateMatrixWorld();
    }

    // Match original draw() by driving the camera from the exact same view matrix.
    // Original order: translate(0,0,-distance) -> rotateX(-angleX) -> rotateY(-angleY) -> translate(panX,panY,0)
    // Three.js camera world = inverse(view).
    // V7: Use cameraDistanceRef for zoom, panOffsetRef for pan
    const camDist = cameraDistanceRef.current;
    const panX = panOffsetRef.current.x;
    const panY = panOffsetRef.current.y;
    groupMatrix.identity();
    groupMatrix.makeTranslation(0, 0, -camDist * groupScale);
    tmpMatrix.makeRotationX(THREE.MathUtils.degToRad(-angleXDegRef.current));
    groupMatrix.multiply(tmpMatrix);
    tmpMatrix.makeRotationY(THREE.MathUtils.degToRad(-angleYDegRef.current));
    groupMatrix.multiply(tmpMatrix);
    tmpMatrix.makeTranslation(panX * groupScale, panY * groupScale, 0);
    groupMatrix.multiply(tmpMatrix);

    tmpMatrix.copy(groupMatrix).invert();
    tmpMatrix.decompose(camera.position, camera.quaternion, camera.scale);
    camera.updateMatrixWorld();

    // Light direction follows camera when L is held (match original).
    if (lightFollowCameraRef.current) {
      const theta = THREE.MathUtils.degToRad(90 - angleYDegRef.current);
      const phi = THREE.MathUtils.degToRad(-angleXDegRef.current);
      lightDirRef.current.set(
        Math.cos(theta) * Math.cos(phi),
        Math.sin(phi),
        Math.sin(theta) * Math.cos(phi)
      );
      lightDirRef.current.normalize();
    }

    // Ensure bubble instances start hidden once the mesh exists (handles asset-loading null renders).
    if (!bubbleInitRef.current && bubbleMeshRef.current) {
      for (let i = 0; i < BUBBLE_MAX_PARTICLES; i++) {
        bubbleTmpObj.position.set(0, 0, 0);
        bubbleTmpObj.scale.setScalar(0);
        bubbleTmpObj.updateMatrix();
        bubbleMeshRef.current.setMatrixAt(i, bubbleTmpObj.matrix);
      }
      bubbleMeshRef.current.instanceMatrix.needsUpdate = true;
      bubbleInitRef.current = true;
    }

    // Ensure drip instances start hidden once the mesh exists.
    if (!dripInitRef.current && dripMeshRef.current) {
      for (let i = 0; i < DRIP_MAX_PARTICLES; i++) {
        dripTmpObj.position.set(0, 0, 0);
        dripTmpObj.scale.setScalar(0);
        dripTmpObj.updateMatrix();
        dripMeshRef.current.setMatrixAt(i, dripTmpObj.matrix);
      }
      dripMeshRef.current.instanceMatrix.needsUpdate = true;
      dripInitRef.current = true;
    }

    // When paused, keep caustics + shading coherent (also clears caustics if disabled).
    if (pausedRef.current) {
      updateCaustics(getTexture(), lightDirRef.current, sphereCenterRef.current, sphereRadius);

      const causticsStrengthBaseline = 5.0;
      const causticsStrength =
        causticsStrengthBaseline > 0
          ? settings.pool.causticsIntensityMultiplier / causticsStrengthBaseline
          : 1.0;
      const dispersion = settings.caustics.dispersionEnabled
        ? settings.caustics.dispersionStrength
        : 0.0;

      boatMaterial.uniforms.water.value = getTexture();
      boatMaterial.uniforms.causticTex.value = causticsTexture;
      boatMaterial.uniforms.light.value.copy(lightDirRef.current);
      boatMaterial.uniforms.uInvScale.value = poolSizeRef.current > 0 ? 2 / poolSizeRef.current : 1;
      boatMaterial.uniforms.uIorAir.value = settings.material.iorAir;
      boatMaterial.uniforms.uIorWater.value = settings.material.iorWater;
      boatMaterial.uniforms.uCausticsScale.value = settings.caustics.projectionScale;
      boatMaterial.uniforms.uCausticsStrength.value = causticsStrength;
      boatMaterial.uniforms.uDispersionStrength.value = dispersion;

      return;
    }

    if (deltaSeconds > 1) return;

    // V5: Transient wave impulses computed during the physics step (used for impacts/slams).
    let slamWaveImpulse = 0;
    let slamWaveRadius = 0;

    // Dynamic obstacle: moving boat hull (updates obstacle mask + visual mesh).
    if (!poolEnabled && obstacleMask) {
      const elapsedSeconds = state.clock.getElapsedTime();
      const orbitCenter = { x: 0.65, z: 0.0 };
      const orbitRadius = 0.22;
      const angularSpeed = 0.18;

      const angle = elapsedSeconds * angularSpeed;
      const boatX = orbitCenter.x + Math.cos(angle) * orbitRadius;
      const boatZ = orbitCenter.z + Math.sin(angle) * orbitRadius;
      const heading = angle + Math.PI * 0.5;

      obstacleMask.data.set(obstacleMask.baseData);
      stampCapsuleObstacleMaskData({
        data: obstacleMask.data,
        resolution: simulationResolution,
        center: { x: boatX, z: boatZ },
        length: 0.32,
        radius: 0.07,
        rotation: heading,
        padding: 0.03,
      });
      obstacleMask.texture.needsUpdate = true;

      if (boatRef.current) {
        boatRef.current.position.set(boatX, -0.03, boatZ);
        boatRef.current.rotation.set(0, -heading, 0);
      }
    }

    // V5: Physics always runs (gravity, buoyancy, drag)
    if (spherePhysicsEnabledRef.current) {
      const center = sphereCenterRef.current;
      const velocity = sphereVelocityRef.current;

      const legacyPercentUnderWater = Math.max(
        0,
        Math.min(1, (sphereRadius - center.y) / (2 * sphereRadius))
      );

      const now = state.clock.getElapsedTime();

      const spherePhysics = settings.sphere.physics;
      const sampleHz = spherePhysics.sampleHz;
      const encodeScale = Math.max(0.0001, spherePhysics.heightEncodeScale);
      const heightfieldBuoyancyEnabled =
        spherePhysics.buoyancyModel === 'heightfield' && sampleHz > 0;

      if (heightfieldBuoyancyEnabled && now >= buoyancyNextSampleTimeRef.current) {
        buoyancyNextSampleTimeRef.current = now + 1 / sampleHz;

        const waterTexture = getTexture();
        buoyancySampler.material.uniforms.uWater.value = waterTexture;
        buoyancySampler.material.uniforms.uEncodeScale.value = encodeScale;

        const { sampleCount, samples, areaElement, sphereVolume } = buoyancySamples;
        const { uvData } = buoyancySampler;

        for (let i = 0; i < sampleCount; i++) {
          const sample = samples[i];
          const x = THREE.MathUtils.clamp(center.x + sample.dx, -1, 1);
          const z = THREE.MathUtils.clamp(center.z + sample.dz, -1, 1);
          const u = THREE.MathUtils.clamp(x * 0.5 + 0.5, 0, 1);
          const v = THREE.MathUtils.clamp(z * 0.5 + 0.5, 0, 1);
          uvData[i * 4] = Math.round(u * 255);
          uvData[i * 4 + 1] = Math.round(v * 255);
          uvData[i * 4 + 2] = 0;
          uvData[i * 4 + 3] = 255;
        }

        for (let i = sampleCount; i < BUOYANCY_MAX_SAMPLES; i++) {
          uvData[i * 4] = 128;
          uvData[i * 4 + 1] = 128;
          uvData[i * 4 + 2] = 0;
          uvData[i * 4 + 3] = 255;
        }

        buoyancySampler.uvTexture.needsUpdate = true;

        const previousTarget = gl.getRenderTarget();
        gl.setRenderTarget(buoyancySampler.renderTarget);
        gl.render(buoyancySampler.scene, buoyancySampler.quadCamera);
        gl.setRenderTarget(previousTarget);

        gl.readRenderTargetPixels(
          buoyancySampler.renderTarget,
          0,
          0,
          BUOYANCY_MAX_SAMPLES,
          1,
          buoyancySampler.readBuffer
        );

        let submergedVolume = 0;
        for (let i = 0; i < sampleCount; i++) {
          const encoded = buoyancySampler.readBuffer[i * 4] / 255;
          const waterHeight = (encoded - 0.5) / encodeScale;
          const sample = samples[i];
          const halfChord = Math.sqrt(Math.max(0, sphereRadius * sphereRadius - sample.r2));
          const yBottom = center.y - halfChord;
          const thickness = THREE.MathUtils.clamp(waterHeight - yBottom, 0, 2 * halfChord);
          submergedVolume += thickness * areaElement;
        }

        buoyancySubmergedFractionRef.current =
          sphereVolume > 0
            ? THREE.MathUtils.clamp(submergedVolume / sphereVolume, 0, 1)
            : legacyPercentUnderWater;
      } else if (!heightfieldBuoyancyEnabled) {
        buoyancySubmergedFractionRef.current = legacyPercentUnderWater;
      }

      const submergedFraction = buoyancySubmergedFractionRef.current || legacyPercentUnderWater;
      sphereSubmergedFractionRef.current = submergedFraction;

      // Wetness accumulator (0..1): wets quickly while submerged, dries slowly out of water.
      {
        const wet = spherePhysics.wetness;
        if (wet && wet.enabled) {
          const sub = THREE.MathUtils.clamp(submergedFraction, 0, 1);
          const wetPrev = sphereWetnessRef.current;

          const kWet = Math.max(0, wet.accumulateRate);
          const kDry = Math.max(0, wet.dryRate);

          let wetNext = wetPrev;
          if (sub > 0.02) {
            // Rise toward 1 with a rate that scales with how submerged the sphere is.
            const k = kWet * (0.25 + 0.75 * sub);
            wetNext = 1.0 - (1.0 - wetPrev) * Math.exp(-k * deltaSeconds);
          } else {
            // Exponential drying out of water.
            wetNext = wetPrev * Math.exp(-kDry * deltaSeconds);
          }

          // Small extra wetting around the surface band (captures waterline “cling”).
          const surfaceBand = 4 * sub * (1 - sub); // 0..1 (peaks when half-submerged)
          wetNext = THREE.MathUtils.clamp(wetNext + surfaceBand * 0.10 * kWet * deltaSeconds, 0, 1);
          sphereWetnessRef.current = wetNext;
        } else {
          sphereWetnessRef.current = 0;
        }
      }
      const { sphereVolume } = buoyancySamples;
      const submergedVolume = submergedFraction * sphereVolume;
      
      // V5: Added Mass - sphere carries fluid with it underwater
      const addedMass = spherePhysics.addedMassCoefficient * spherePhysics.fluidDensity * submergedVolume;
      const effectiveMass = spherePhysics.mass + addedMass;
      
      // V5: Buoyancy + gravity as forces (fixes added-mass bias).
      // F_net = m*g + buoyancyStrength * (ρ * V_sub) * (-g_dir) * |g|
      const gMag = gravity.length();
      const gDir = gravity.clone().normalize(); // points downward
      const buoyancyStrength = Math.max(0, spherePhysics.buoyancyStrength);

      const displacedMass = spherePhysics.fluidDensity * submergedVolume;
      const buoyancyForceVec = gDir.clone().multiplyScalar(-buoyancyStrength * displacedMass * gMag);
      const gravityForceVec = gravity.clone().multiplyScalar(spherePhysics.mass);

      const area = Math.PI * sphereRadius * sphereRadius;
      const netForce = gravityForceVec.add(buoyancyForceVec);

      // V5: Planing (skimming) + Slam (impact) forces (optional, settings-driven).
      // These make surface interactions depend on speed, size, and entry angle.
      const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
      const totalSpeed = velocity.length();
      const upwardDir = gDir.clone().multiplyScalar(-1);
      const entrySpeed = Math.max(0, -velocity.y);
      const entrySin = totalSpeed > 1e-6 ? THREE.MathUtils.clamp(entrySpeed / totalSpeed, 0, 1) : 0;

      // Approximate wetted area at the free surface (y=0). This is the “contact patch”
      // that makes skipping/planing scale with sphere size and penetration depth.
      const capHeight = THREE.MathUtils.clamp(sphereRadius - center.y, 0, 2 * sphereRadius);
      const wettedArea = Math.PI * Math.max(0, 2 * sphereRadius * capHeight - capHeight * capHeight);
      const wettedFrac = area > 0 ? THREE.MathUtils.clamp(wettedArea / area, 0, 1) : 0;

      if (
        spherePhysics.planingEnabled &&
        wettedArea > 1e-6 &&
        entrySpeed > 0 &&
        submergedFraction > 0 &&
        submergedFraction < spherePhysics.planingMaxSubmergedFraction &&
        horizontalSpeed > spherePhysics.planingSpeedThreshold
      ) {
        const proximity =
          1 - THREE.MathUtils.clamp(submergedFraction / Math.max(1e-6, spherePhysics.planingMaxSubmergedFraction), 0, 1);

        // For a sphere, “planing” is mostly an impact-driven surface reaction, not an airfoil-like lift.
        // Scale by entry angle and wetted area so it DOESN’T skip unrealistically at low penetration.
        const liftRaw =
          spherePhysics.planingLiftCoefficient *
          spherePhysics.fluidDensity *
          wettedArea *
          totalSpeed *
          totalSpeed *
          entrySin *
          proximity;
        const lift = Math.min(liftRaw, spherePhysics.planingLiftMax);
        netForce.addScaledVector(upwardDir, lift);

        // Add strong surface drag so the sphere bleeds energy into the water instead of “hover-skipping”.
        // This also prevents repeated easy bounces.
        const dragRaw =
          spherePhysics.planingDragMultiplier *
          0.5 *
          spherePhysics.fluidDensity *
          wettedArea *
          totalSpeed *
          totalSpeed *
          entrySin;

        const drag = Math.min(dragRaw, spherePhysics.planingLiftMax * 3);
        if (horizontalSpeed > 1e-6) {
          const invH = 1 / horizontalSpeed;
          netForce.x += -drag * velocity.x * invH;
          netForce.z += -drag * velocity.z * invH;
        }

        // Convert a bit of this surface interaction into a water impulse (visible “skim” effect).
        // Keep it bounded and zero-mean via the ring pattern later.
        const reactionAccel = (lift / Math.max(1e-6, effectiveMass)) * wettedFrac;
        const skimImpulse = THREE.MathUtils.clamp(reactionAccel * deltaSeconds * 0.35, 0, 0.02);
        if (skimImpulse > 0) {
          slamWaveRadius = Math.max(slamWaveRadius, Math.max(sphereRadius * 0.6, 0.03));
          slamWaveImpulse = THREE.MathUtils.clamp(slamWaveImpulse + skimImpulse, 0, 0.05);
        }
      }

      if (spherePhysics.slamEnabled && entrySpeed > 0 && wettedArea > 1e-6 && submergedFraction < 0.75) {
        const surfaceFactor = THREE.MathUtils.clamp(1 - submergedFraction / 0.75, 0, 1);
        const slamRaw =
          spherePhysics.slamCoefficient *
          spherePhysics.fluidDensity *
          wettedArea *
          entrySpeed *
          entrySpeed *
          surfaceFactor;
        const slam = Math.min(slamRaw, spherePhysics.slamMaxForce);
        netForce.addScaledVector(upwardDir, slam);

        // Convert some slam energy into a water velocity impulse (applied after moveSphere).
        // Base on actual slam force (so “weight” feels like it matters).
        slamWaveRadius = Math.max(slamWaveRadius, Math.max(sphereRadius * 0.75, 0.04));
        const slamAccel = slam / Math.max(1e-6, effectiveMass);
        // Much more conservative conversion to avoid unrealistic “splash slashes”.
        slamWaveImpulse = THREE.MathUtils.clamp(slamWaveImpulse + slamAccel * deltaSeconds * 0.18, 0, 0.03);
      }

      velocity.addScaledVector(netForce, deltaSeconds / Math.max(1e-6, effectiveMass));

      // V5: Force-based drag (scales with size + mass better than multiplicative damping).
      // V7: Use a conservative cap vs. geometric waterline fraction to avoid “stale buoyancy sampling”
      // making the sphere feel sluggish/laggy when yanking it near the surface (especially with breaches active).
      const dragSubmergedFraction = Math.min(submergedFraction, legacyPercentUnderWater + 0.15);
      if (dragSubmergedFraction > 0) {
        const vMag = velocity.length();
        if (vMag > 1e-6) {
          const cd = Math.max(0, spherePhysics.quadraticDrag);
          const linear = Math.max(0, spherePhysics.linearDrag);

          // Quadratic drag: F = -0.5 * ρ * Cd * A * |v| v
          const quadCoeff = 0.5 * spherePhysics.fluidDensity * cd * area;
          const dragForce = velocity
            .clone()
            .multiplyScalar(-(linear + quadCoeff * vMag) * dragSubmergedFraction);

          velocity.addScaledVector(dragForce, deltaSeconds / Math.max(1e-6, effectiveMass));
        }
      }

      // V5: Apply mouse constraint BEFORE position integration (prevents double-step issue)
      if (modeRef.current === MODE_MOVE_SPHERE && sphereMouseTargetRef.current && spherePhysics.mouseControlEnabled) {
        const targetPosition = sphereMouseTargetRef.current;
        const displacement = targetPosition.clone().sub(center);
        const displacementMag = displacement.length();

        // Only apply if there's meaningful displacement (avoid micro-oscillations)
        if (displacementMag > 0.0005) {
          // Critically damped tracking servo (moving target):
          // x'' = ω² (x_t - x) + 2 ω (v_t - v)
          // V7: Smoothly blend cursor-control parameters across the waterline using the geometric fraction,
          // so large waves/breaches can't “trap” the cursor in slow-water mode.
          const waterBlend = THREE.MathUtils.smoothstep(legacyPercentUnderWater, 0.02, 0.18);
          const omega = THREE.MathUtils.lerp(
            spherePhysics.mouseTargetOmegaAir,
            spherePhysics.mouseTargetOmegaWater,
            waterBlend
          );
          const omegaSafe = Math.max(0.1, omega);
          const maxForce = THREE.MathUtils.lerp(
            spherePhysics.mouseMaxForceAir,
            spherePhysics.mouseMaxForceWater,
            waterBlend
          );

          // Estimate target velocity from frame-to-frame target positions.
          const dtSafe = Math.max(1e-6, deltaSeconds);
          const targetVel = sphereMouseTargetVelRef.current;
          const prevTarget = sphereMouseTargetPrevRef.current;
          if (prevTarget) {
            targetVel.copy(targetPosition).sub(prevTarget).multiplyScalar(1 / dtSafe);
            prevTarget.copy(targetPosition);
          } else {
            sphereMouseTargetPrevRef.current = targetPosition.clone();
            targetVel.set(0, 0, 0);
          }

          const desiredAccel = displacement
            .multiplyScalar(omegaSafe * omegaSafe)
            .addScaledVector(targetVel, 2 * omegaSafe)
            .addScaledVector(velocity, -2 * omegaSafe);
          let desiredForce = desiredAccel.clone().multiplyScalar(effectiveMass);

          // Clamp the force so the cursor only influences (never teleports / explodes).
          const fMag = desiredForce.length();
          if (fMag > maxForce) {
            desiredForce.multiplyScalar(maxForce / fMag);
          }

          // Apply (F = m a)
          velocity.addScaledVector(desiredForce, deltaSeconds / effectiveMass);
        }
      }

      center.addScaledVector(velocity, deltaSeconds);

      // V5: Collision detection with pool boundaries (floor and walls)
      const poolMin = -1;
      const poolMax = 1;
      const minBound = poolMin + sphereRadius;
      const maxBound = poolMax - sphereRadius;
      const bounceRetention = 0.7;
      // Below this speed, treat contact as resting (kill the normal component) to prevent jitter.
      const restThreshold = 0.25;

      // Floor collision (Y-axis)
      if (center.y < minBound) {
        center.y = minBound;
        if (velocity.y < -restThreshold) {
          velocity.y = Math.abs(velocity.y) * bounceRetention;
        } else {
          velocity.y = 0;
        }
      }

      // Wall collisions (X and Z axes)
      if (center.x < minBound) {
        center.x = minBound;
        if (velocity.x < -restThreshold) {
          velocity.x = Math.abs(velocity.x) * bounceRetention;
        } else {
          velocity.x = 0;
        }
      } else if (center.x > maxBound) {
        center.x = maxBound;
        if (velocity.x > restThreshold) {
          velocity.x = -Math.abs(velocity.x) * bounceRetention;
        } else {
          velocity.x = 0;
        }
      }

      if (center.z < minBound) {
        center.z = minBound;
        if (velocity.z < -restThreshold) {
          velocity.z = Math.abs(velocity.z) * bounceRetention;
        } else {
          velocity.z = 0;
        }
      } else if (center.z > maxBound) {
        center.z = maxBound;
        if (velocity.z > restThreshold) {
          velocity.z = -Math.abs(velocity.z) * bounceRetention;
        } else {
          velocity.z = 0;
        }
      }

      // V5: Clamp maximum velocity to prevent too-fast movement
      const maxSpeed = 5.0; // Maximum speed units per second
      const currentSpeed = velocity.length();
      if (currentSpeed > maxSpeed) {
        velocity.normalize().multiplyScalar(maxSpeed);
      }
    }

    // Displace water around sphere (heightfield coupling).
    // IMPORTANT: Direct height injection can create a positive feedback loop (sphere motion → wave → buoyancy → more motion).
    // We gate displacement by horizontal speed + submergence so gentle floating doesn't explode into a huge wave.
    {
      const spherePhysics = settings.sphere.physics;
      const center = sphereCenterRef.current;
      const v = sphereVelocityRef.current;
      const horizontalSpeed = Math.sqrt(v.x * v.x + v.z * v.z);
      const approxSubmerged = THREE.MathUtils.clamp((sphereRadius - center.y) / (2 * sphereRadius), 0, 1);

      // Gate: below ~0.08 units/s, almost no displacement; above ~0.8, full.
      const speedGate = THREE.MathUtils.smoothstep(horizontalSpeed, 0.08, 0.8);

      const displacementScale =
        Math.max(0, spherePhysics.waterDisplacementScale) *
        approxSubmerged *
        speedGate;

      moveSphere(
        sphereOldCenterRef.current,
        sphereCenterRef.current,
        sphereRadius,
        displacementScale
      );
    }
    sphereOldCenterRef.current.copy(sphereCenterRef.current);

    // V5: Wake injection (momentum-based) to avoid the “peaky cone” piling up behind the sphere.
    // Inject into the velocity channel so waves fan out naturally.
    if (spherePhysicsEnabledRef.current) {
      const spherePhysics = settings.sphere.physics;
      if (spherePhysics.wakeEnabled) {
        const center = sphereCenterRef.current;
        const v = sphereVelocityRef.current;
        const vx = v.x;
        const vz = v.z;
        const speed = Math.sqrt(vx * vx + vz * vz);
        if (speed > 0.02) {
          const dirX = vx / speed;
          const dirZ = vz / speed;

          const offset = spherePhysics.wakeOffset * sphereRadius;
          const frontX = THREE.MathUtils.clamp(center.x + dirX * offset, -1, 1);
          const frontZ = THREE.MathUtils.clamp(center.z + dirZ * offset, -1, 1);
          const backX = THREE.MathUtils.clamp(center.x - dirX * offset, -1, 1);
          const backZ = THREE.MathUtils.clamp(center.z - dirZ * offset, -1, 1);

          // V5: Prevent runaway “cone” growth.
          // Continuous speed-based vertical velocity injection can pump energy indefinitely.
          // Make wake injection:
          // - frame-rate independent (scale by dt)
          // - strongest near the surface (submergedFraction band), weak when fully submerged/out of water
          // - wider (less needle-like)
          // - hard-capped
          const approxSubmerged = THREE.MathUtils.clamp((sphereRadius - center.y) / (2 * sphereRadius), 0, 1);
          const surfaceBand = 4 * approxSubmerged * (1 - approxSubmerged); // 0..1, peaks at 0.5

          const radius = Math.max(0.04, Math.max(spherePhysics.wakeRadius, sphereRadius * 0.45));
          const impulseRaw = spherePhysics.wakeStrength * speed * deltaSeconds * 0.35 * surfaceBand;
          const impulseMult = Math.max(0, spherePhysics.impulseStrengthMultiplier);
          const impulse = THREE.MathUtils.clamp(impulseRaw * impulseMult, -0.02, 0.02);

          addImpulse(frontX, frontZ, radius, impulse);
          // Keep wake injection zero-mean to avoid slowly raising the global water level.
          addImpulse(backX, backZ, radius, -impulse);
        }
      }

      if (slamWaveImpulse > 0 && slamWaveRadius > 0) {
        const center = sphereCenterRef.current;
        const impulseMult = Math.max(0, spherePhysics.impulseStrengthMultiplier);
        const slamImpulse = THREE.MathUtils.clamp(slamWaveImpulse * impulseMult, 0, 0.035);
        // Zero-mean slam impulse: positive core + negative wider ring (approx area-compensation).
        addImpulse(center.x, center.z, slamWaveRadius, slamImpulse);
        addImpulse(center.x, center.z, slamWaveRadius * 2.0, -slamImpulse * 0.25);
      }
    }

    // -----------------------------------------------------------------------
    // Bubble particles (first-pass): visible wake cue driven by motion + surface band.
    // NOTE: Water surface refraction shader does NOT raytrace bubbles yet; we render them
    // as an additive overlay (depthTest=false) for now to validate spawn logic + feel.
    // -----------------------------------------------------------------------
    {
      const bubbles = settings.sphere.physics.bubbles;
      const mesh = bubbleMeshRef.current;
      if (mesh && bubbles.enabled && spherePhysicsEnabledRef.current) {
        const pool = bubblePoolRef.current;
        const center = sphereCenterRef.current;
        const v = sphereVelocityRef.current;

        // -------------------------------------------------------------------
        // Persistent surface foam field (2D) – decays slowly and is re-deposited
        // by bubbles near the surface (and burst deposits when bubbles surface).
        // This makes the foam “last longer” and allows foam to line up with 3D bubbles.
        // -------------------------------------------------------------------
        const foamAcc = surfaceFoamField.accum;
        const foamData = surfaceFoamField.data;
        const foamSize = surfaceFoamField.size;
        const foamCellWorld = 2 / foamSize;

        const foamLifetime = Math.max(0.05, bubbles.surfaceFoamLifetime);
        const foamDecay = Math.exp(-deltaSeconds / foamLifetime);
        for (let fi = 0; fi < foamAcc.length; fi++) foamAcc[fi] *= foamDecay;

        const foamStrength = Math.max(0, bubbles.surfaceFoamStrength);
        const foamDepth = Math.max(1e-4, bubbles.surfaceFoamDepth);
        const foamSizeMult = Math.max(0.1, bubbles.surfaceFoamSizeMultiplier);
        const foamVar = THREE.MathUtils.clamp(bubbles.surfaceFoamVariance, 0, 1);
        const foamSmart = !!bubbles.surfaceFoamSmartLink;

        const depositFoam = (x: number, z: number, rWorld: number, amount: number) => {
          if (amount <= 0) return;
          const uvx = THREE.MathUtils.clamp(x * 0.5 + 0.5, 0, 1);
          const uvz = THREE.MathUtils.clamp(z * 0.5 + 0.5, 0, 1);
          const cx = Math.floor(uvx * (foamSize - 1));
          const cz = Math.floor(uvz * (foamSize - 1));

          const radCells = Math.min(
            16,
            Math.max(1, Math.round((rWorld / Math.max(1e-6, foamCellWorld)) * 1.25))
          );
          const invRad2 = 1 / Math.max(1e-6, radCells * radCells);

          for (let dz = -radCells; dz <= radCells; dz++) {
            const zz = cz + dz;
            if (zz < 0 || zz >= foamSize) continue;
            for (let dx = -radCells; dx <= radCells; dx++) {
              const xx = cx + dx;
              if (xx < 0 || xx >= foamSize) continue;
              const w = Math.exp(-(dx * dx + dz * dz) * invRad2);
              const idx = zz * foamSize + xx;
              foamAcc[idx] = Math.min(255, foamAcc[idx] + amount * w);
            }
          }
        };

        const vx = v.x;
        const vz = v.z;
        const speed = Math.sqrt(vx * vx + vz * vz);

        const safeRadius = Math.max(1e-6, sphereRadius);
        const approxSubmerged = THREE.MathUtils.clamp((safeRadius - center.y) / (2 * safeRadius), 0, 1);
        const surfaceBand = 4 * approxSubmerged * (1 - approxSubmerged); // 0..1, peaks at ~0.5 submerged

        const speedTerm = Math.max(0, speed - Math.max(0, bubbles.speedThreshold));
        const speedPow = Math.max(0, bubbles.speedPower);
        const surfacePow = Math.max(0, bubbles.surfaceBandStrength);

        // Waterline contact fraction (0..1). This is more directly “how much of the sphere is interacting with the free surface”.
        // - 0 when fully submerged (or fully out of water)
        // - 1 when the sphere center is exactly at the surface (half-submerged)
        const area = Math.PI * safeRadius * safeRadius;
        const capHeight = THREE.MathUtils.clamp(safeRadius - center.y, 0, 2 * safeRadius);
        const wettedArea = Math.PI * Math.max(0, 2 * safeRadius * capHeight - capHeight * capHeight);
        const wettedFrac = area > 0 ? THREE.MathUtils.clamp(wettedArea / area, 0, 1) : 0;

        // Vertical entry speed (positive when entering water).
        const entrySpeed = Math.max(0, -v.y);

        // 1) Wake emission (rear separation) – gated to near-surface via surfaceBand
        const emitWake =
          bubbles.rate * Math.pow(speedTerm, speedPow) * Math.pow(Math.max(0, surfaceBand), surfacePow);

        // 2) Surface entrainment (waterline rim) – active when sphere intersects the free surface.
        // This is the “bubbles near the top / waterline” behavior when the sphere is partially out of water.
        const emitSurface =
          bubbles.rate * 0.45 * Math.pow(Math.max(0, speed), 1.0) * Math.pow(Math.max(0, wettedFrac), 0.85);

        // 3) Impact/entry bubbles – stronger when entering the water fast (vertical motion + slam impulse)
        // This produces a cloud/ring of bubbles that initially follows the entry motion.
        const emitImpact =
          bubbles.rate *
          (30.0 * slamWaveImpulse * (0.25 + 0.75 * Math.pow(wettedFrac, 0.6)) +
            1.6 * Math.pow(entrySpeed, 1.35) * Math.pow(wettedFrac, 0.8));

        const emit = emitWake + emitSurface + emitImpact;

        const spawnFloat = emit * deltaSeconds + bubbleSpawnCarryRef.current;
        const spawnCountRaw = Math.floor(spawnFloat);
        bubbleSpawnCarryRef.current = spawnFloat - spawnCountRaw;

        // V7: Bubble pool budgeting.
        // Avoid the “trail truncates at a fixed length” look caused by always overwriting in a ring buffer.
        // Users can choose:
        // - overflowMode = 'skip' (honor lifetime, stop spawning when pool is full)
        // - overflowMode = 'overwrite' (constant-length trail, always spawns)
        const bubbleMaxActive = Math.min(BUBBLE_MAX_PARTICLES, Math.max(8, Math.round(bubbles.maxActive)));
        const bubbleOverflowMode: 'skip' | 'overwrite' = bubbles.overflowMode === 'overwrite' ? 'overwrite' : 'skip';

        let spawnCount = Math.min(96, Math.max(0, spawnCountRaw));
        if (bubbleOverflowMode === 'skip' && spawnCount > 0) {
          // Clamp by available inactive slots and drop backlog to avoid delayed “burst dumps”.
          let free = 0;
          for (let i = 0; i < bubbleMaxActive; i++) free += pool.active[i] === 0 ? 1 : 0;
          if (spawnCount > free) {
            spawnCount = free;
            bubbleSpawnCarryRef.current = 0;
          }
        }

        // Spawn:
        // - A) rear separation-band ring behind the sphere (wake)
        // - B) waterline rim bubbles (surface entrainment + impact bubbles)
        if (spawnCount > 0) {
          const hasHoriz = speed > 1e-6;
          const dirX = hasHoriz ? vx / speed : 0;
          const dirZ = hasHoriz ? vz / speed : 0;
          // Horizontal perpendicular basis (dir is horizontal in xz, so perp is also horizontal).
          const perpX = dirZ;
          const perpZ = -dirX;

          const sepAlpha = Math.max(0, bubbles.sepAlpha);
          const sepBeta = Math.max(0, Math.min(bubbles.sepBeta, sepAlpha));
          const spawnR = Math.max(0.0, bubbles.spawnRadius) * safeRadius;
          const wakeOffset = Math.max(0.0, bubbles.wakeOffset) * safeRadius;
          const inherit = THREE.MathUtils.clamp(bubbles.inheritVelocity, 0, 1);

          // Waterline circle radius where the sphere intersects y=0 plane.
          // Only valid when the sphere actually intersects the free surface.
          const waterlineR2 = safeRadius * safeRadius - center.y * center.y;
          const waterlineR = waterlineR2 > 0 ? Math.sqrt(waterlineR2) : 0;

          // Mix toward surface bubbles when the sphere intersects the surface, especially during entry.
          const entryMix = THREE.MathUtils.clamp(entrySpeed / 1.5, 0, 1);
          const surfaceMix = THREE.MathUtils.clamp(wettedFrac * (0.55 + 0.45 * entryMix), 0, 1);

          let next = bubbleNextIndexRef.current;
          if (next < 0 || next >= bubbleMaxActive) next = 0;

          for (let s = 0; s < spawnCount; s++) {
            // Allocate particle slot.
            let idx = -1;
            if (bubbleOverflowMode === 'skip') {
              for (let k = 0; k < bubbleMaxActive; k++) {
                const j = (next + k) % bubbleMaxActive;
                if (pool.active[j] === 0) {
                  idx = j;
                  next = (j + 1) % bubbleMaxActive;
                  break;
                }
              }
              if (idx < 0) break;
            } else {
              idx = next;
              next = (next + 1) % bubbleMaxActive;
            }

            pool.active[idx] = 1;
            pool.age[idx] = 0;
            pool.surfaceHoldState[idx] = 0;
            pool.surfaceHoldUntil[idx] = 0;

            const lifeJitter = 0.7 + Math.random() * 0.6;
            pool.life[idx] = Math.max(0.05, bubbles.lifetime) * lifeJitter;

            const sizeDistPow = Math.max(0.05, bubbles.sizeDistributionPower);
            const sizeT = Math.pow(Math.random(), sizeDistPow);
            pool.size[idx] =
              THREE.MathUtils.lerp(Math.max(0, bubbles.sizeMin), Math.max(0, bubbles.sizeMax), sizeT);

            pool.seedA[idx] = Math.random() * 10.0;
            pool.seedB[idx] = Math.random() * 10.0;

            const base = idx * 3;

            const useSurfaceSpawn =
              waterlineR > 1e-6 && (hasHoriz ? Math.random() < surfaceMix : wettedFrac > 0);

            let px = 0;
            let py = 0;
            let pz = 0;

            if (useSurfaceSpawn) {
              // Surface entrainment / impact: spawn near the waterline rim (y≈0) slightly below the surface.
              // Strong rear bias (prevents “side bubbles” when moving): sample around the rear direction.
              let phi = Math.random() * Math.PI * 2;
              if (hasHoriz) {
                const rearAngle = Math.atan2(-dirZ, -dirX);
                const spread = Math.PI * 0.22; // ~40° 1-sigma
                const g = THREE.MathUtils.clamp(bubbleRandNormal(), -2.0, 2.0);
                phi = rearAngle + g * spread;
              }

              const rx = Math.cos(phi);
              const rz = Math.sin(phi);

              px = center.x + rx * waterlineR;
              pz = center.z + rz * waterlineR;
              // Slightly below surface; also add a little depth jitter so it reads 3D.
              py = -0.006 - Math.random() * 0.028;

              // Small drift behind the motion direction so it “peels” into the wake.
              if (hasHoriz) {
                const peel = safeRadius * (0.08 + 0.12 * entryMix);
                px -= dirX * peel;
                pz -= dirZ * peel;
              }
            } else if (hasHoriz && speed > 1e-6) {
              // Wake bubbles:
              // - Core: tight, centered vortex immediately behind the sphere (most bubbles)
              // - Ring: separation band around the body (secondary)
              const speedN = THREE.MathUtils.clamp(speed / 1.0, 0, 1);
              const wakeCoreChance = THREE.MathUtils.clamp(0.75 + 0.2 * speedN, 0, 0.95);
              const useWakeCore = Math.random() < wakeCoreChance;

              if (useWakeCore) {
                const coreBack = wakeOffset + safeRadius * 0.45;
                const coreRad = Math.min(spawnR * 0.25, safeRadius * 0.22);
                const baseY = Math.min(center.y, -0.02);

                const theta = Math.random() * Math.PI * 2;
                const rCore = coreRad * (0.25 + 0.75 * Math.sqrt(Math.random()));
                const offP = Math.cos(theta) * rCore;
                const offY = Math.sin(theta) * rCore * 0.55;

                px = center.x - dirX * coreBack + perpX * offP;
                py = baseY + offY;
                pz = center.z - dirZ * coreBack + perpZ * offP;
                py = Math.min(py, -0.01);
              } else {
                // Separation band: sample a in [-sepAlpha, -sepBeta] (back-facing, near 90° boundary)
                const a = -(sepBeta + Math.random() * (sepAlpha - sepBeta));
                const theta = Math.acos(THREE.MathUtils.clamp(a, -1, 1));
                const phi = Math.random() * Math.PI * 2;
                const sinT = Math.sin(theta);
                const cosT = Math.cos(theta);
                const cosP = Math.cos(phi);
                const sinP = Math.sin(phi);

                // Axis = dir (xz), perp = horizontal perpendicular, up = Y.
                const nX = dirX * cosT + perpX * (sinT * cosP);
                const nY = sinT * sinP;
                const nZ = dirZ * cosT + perpZ * (sinT * cosP);

                px = center.x + nX * spawnR - dirX * wakeOffset;
                py = center.y + nY * safeRadius * 0.6;
                pz = center.z + nZ * spawnR - dirZ * wakeOffset;

                // Keep underwater-ish (water level ~0). Surface gating already limits emission.
                py = Math.min(py, -0.01);
              }
            } else {
              // Fallback: no good direction, no waterline => spawn just below the sphere center.
              px = center.x;
              py = Math.min(center.y, -0.02);
              pz = center.z;
            }

            // Clamp to pool bounds (avoid spawning outside the sim domain).
            px = THREE.MathUtils.clamp(px, -0.98, 0.98);
            pz = THREE.MathUtils.clamp(pz, -0.98, 0.98);

            pool.pos[base] = px;
            pool.pos[base + 1] = py;
            pool.pos[base + 2] = pz;

            // Inherit some sphere velocity. For impact/entry bubbles we allow downward inheritance
            // so the cloud initially follows the entry before buoyancy + drag take over.
            const inheritY = THREE.MathUtils.clamp(inherit + 0.25 * entryMix, 0, 1);
            pool.vel[base] = vx * inherit;
            pool.vel[base + 1] = THREE.MathUtils.clamp(v.y, -5, 5) * inheritY;
            pool.vel[base + 2] = vz * inherit;

            // Initialize correlated turbulence velocity to 0 (OU process will kick in).
            pool.turb[base] = 0;
            pool.turb[base + 1] = 0;
            pool.turb[base + 2] = 0;
          }

          bubbleNextIndexRef.current = next;
        }

        // Integrate + write instance matrices.
        const drag = Math.max(0, bubbles.drag);
        const baseRiseSpeed = Math.max(0, bubbles.riseSpeed);
        const riseSizePower = Math.max(0, bubbles.riseSizePower);
        const riseMinFactor = Math.max(0, bubbles.riseMinFactor);
        const riseMaxFactor = Math.max(riseMinFactor, bubbles.riseMaxFactor);
        const rRef =
          (Math.max(0, bubbles.sizeMin) + Math.max(0, bubbles.sizeMax)) * 0.5 > 1e-6
            ? (Math.max(0, bubbles.sizeMin) + Math.max(0, bubbles.sizeMax)) * 0.5
            : 0.01;

        const turbBase = Math.max(0, bubbles.turbulence);
        const tauCorr = Math.max(1e-3, bubbles.turbulenceCorrelationTime);
        const tauSettle = Math.max(1e-3, bubbles.turbulenceSettleTime);

        const wakeSwirlStrength = Math.max(0, bubbles.wakeSwirlStrength);
        const wakeSwirlRadius = Math.max(1e-3, bubbles.wakeSwirlRadius) * safeRadius;
        const wakeDecayLength = Math.max(1e-3, bubbles.wakeDecayLength) * safeRadius;

        // Sphere wake axis (unit) used for wake turbulence + swirl.
        const hasWakeAxis = speed > BUBBLE_WAKE_SPEED_EPS;
        const dirHX = hasWakeAxis ? vx / speed : 0;
        const dirHZ = hasWakeAxis ? vz / speed : 0;
        const wx = -dirHX; // wake axis points behind the sphere
        const wz = -dirHZ;

        let anyActive = false;
        const anyMovedThisFrame = true;

        // Pass 1: integrate bubbles and update their state arrays (do NOT write instance matrices yet).
        for (let i = 0; i < BUBBLE_MAX_PARTICLES; i++) {
          if (pool.active[i] === 0) continue;
          anyActive = true;

          const life = pool.life[i];
          const ageNext = pool.age[i] + deltaSeconds;
          pool.age[i] = ageNext;

          const base = i * 3;
          let px = pool.pos[base];
          let py = pool.pos[base + 1];
          let pz = pool.pos[base + 2];

          // Upward drift (buoyancy).
          const r = pool.size[i];

          // In smart-link mode we keep bubbles alive until they surface, so they can line up with surface foam.
          // In non-smart mode, lifetime is allowed to cull bubbles early for performance / stability.
          if (!foamSmart && ageNext >= life) {
            pool.active[i] = 0;
            continue;
          }

          const riseFactorRaw = rRef > 0 ? Math.pow(Math.max(1e-6, r) / rRef, riseSizePower) : 1.0;
          const riseFactor = THREE.MathUtils.clamp(riseFactorRaw, riseMinFactor, riseMaxFactor);
          const riseSpeed = baseRiseSpeed * riseFactor;
          py += riseSpeed * deltaSeconds;

          // Compute wake weight for this bubble (used for damping + turbulence).
          // wakeWeight ~ 1 near the wake core, decays downstream.
          let wakeWeight = 0;
          if (hasWakeAxis) {
            const dx = px - center.x;
            const dz = pz - center.z;
            const s = dx * wx + dz * wz;
            if (s > 0) {
              wakeWeight = Math.exp(-s / wakeDecayLength);
            }
          }

          // V7: Sphere influence on existing bubbles (locality effect).
          // When sphere moves through water, it pushes nearby existing bubbles - but only within a local radius.
          if (bubbles.sphereInfluenceEnabled && speed > 0.1) {
            const influenceR = Math.max(0.1, bubbles.sphereInfluenceRadius) * safeRadius;
            const influenceFalloff = Math.max(0.01, bubbles.sphereInfluenceFalloff);
            const influenceStrength = Math.max(0, bubbles.sphereInfluenceStrength);

            const dx = px - center.x;
            const dy = py - center.y;
            const dz = pz - center.z;
            const dist2 = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(dist2);

            if (dist < influenceR && dist > safeRadius * 0.5) {
              // Soft falloff: 1 at sphere surface, 0 at influenceR
              const t = (dist - safeRadius * 0.5) / (influenceR - safeRadius * 0.5);
              const falloff = Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), influenceFalloff);

              // Apply sphere velocity to bubble, scaled by distance falloff
              const impulse = influenceStrength * falloff * deltaSeconds;
              pool.vel[base] += v.x * impulse;
              pool.vel[base + 1] += v.y * impulse * 0.5; // Less vertical influence
              pool.vel[base + 2] += v.z * impulse;
            }
          }

          // Exponential drag on inherited/advection velocity.
          // We apply stronger damping to horizontal components so bubbles stop following sphere direction quickly,
          // especially once outside the wake region.
          const dragH =
            drag *
            Math.max(0, bubbles.dragHorizontalMultiplier) *
            (1 + Math.max(0, bubbles.wakeExitHorizontalDrag) * (1 - wakeWeight));
          const dragV = drag;

          const dragMulH = dragH > 0 ? Math.exp(-dragH * deltaSeconds) : 1.0;
          const dragMulV = dragV > 0 ? Math.exp(-dragV * deltaSeconds) : 1.0;

          const vxP = pool.vel[base] * dragMulH;
          const vyP = pool.vel[base + 1] * dragMulV;
          const vzP = pool.vel[base + 2] * dragMulH;
          pool.vel[base] = vxP;
          pool.vel[base + 1] = vyP;
          pool.vel[base + 2] = vzP;

          // Wake swirl/advection (cheap coherent helical motion in the wake).
          let wakeVX = 0;
          let wakeVY = 0;
          let wakeVZ = 0;
          if (hasWakeAxis && wakeSwirlStrength > 0) {
            const dx = px - center.x;
            const dy = py - center.y;
            const dz = pz - center.z;

            const s = dx * wx + dz * wz; // behind-distance (positive behind)
            if (s > 0) {
              // r_perp = d - w*s (with w=(wx,0,wz))
              const rx = dx - wx * s;
              const ry = dy;
              const rz = dz - wz * s;
              const rp2 = rx * rx + ry * ry + rz * rz;

              // tangent = w x r_perp
              let tx = -wz * ry;
              let ty = wz * rx - wx * rz;
              let tz = wx * ry;
              const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (tLen > 1e-6) {
                tx /= tLen;
                ty /= tLen;
                tz /= tLen;
              } else {
                tx = 0;
                ty = 0;
                tz = 0;
              }

              const axial = Math.exp(-s / wakeDecayLength);
              const radial = Math.exp(-rp2 / (wakeSwirlRadius * wakeSwirlRadius));
              const amp = wakeSwirlStrength * axial * radial;
              wakeVX = tx * amp;
              wakeVY = ty * amp;
              wakeVZ = tz * amp;
            }
          }

          px += vxP * deltaSeconds;
          py += vyP * deltaSeconds;
          pz += vzP * deltaSeconds;

          // Add wake swirl advection.
          px += wakeVX * deltaSeconds;
          py += wakeVY * deltaSeconds;
          pz += wakeVZ * deltaSeconds;

          // Correlated turbulence that settles over time (Ornstein–Uhlenbeck).
          const a = Math.exp(-deltaSeconds / tauCorr);
          const settleExp = Math.exp(-ageNext / tauSettle);
          const settleFloor = THREE.MathUtils.clamp(bubbles.turbulenceSettleFloor, 0, 1);
          const settleMix = settleFloor + (1 - settleFloor) * settleExp;

          const ambient = THREE.MathUtils.clamp(bubbles.turbulenceAmbientFactor, 0, 1);
          const wakeMix = ambient + (1 - ambient) * wakeWeight;

          const sigma = turbBase * wakeMix * settleMix;
          const noiseScale = sigma * Math.sqrt(Math.max(0, 1 - a * a));

          const txBase = base;
          const turbXPrev = pool.turb[txBase];
          const turbYPrev = pool.turb[txBase + 1];
          const turbZPrev = pool.turb[txBase + 2];

          // Reduce vertical turbulence so rise reads cleanly.
          const turbX = turbXPrev * a + noiseScale * bubbleRandNormal();
          const turbY = turbYPrev * a + noiseScale * 0.35 * bubbleRandNormal();
          const turbZ = turbZPrev * a + noiseScale * bubbleRandNormal();

          pool.turb[txBase] = turbX;
          pool.turb[txBase + 1] = turbY;
          pool.turb[txBase + 2] = turbZ;

          px += turbX * deltaSeconds;
          py += turbY * deltaSeconds;
          pz += turbZ * deltaSeconds;

          // Surface foam deposit when bubbles approach the surface.
          // (This is what makes the foam pattern correspond to the actual 3D bubbles near the surface.)
          if (foamStrength > 0 && py > -foamDepth) {
            const near = THREE.MathUtils.clamp((py + foamDepth) / foamDepth, 0, 1);
            const jitter = 1 + (Math.random() * 2 - 1) * foamVar;
            const amount = 40.0 * foamStrength * near * deltaSeconds * jitter; // in 0..255 units/sec
            depositFoam(px, pz, Math.max(0.001, r) * foamSizeMult, amount);
          }

          // When a bubble reaches the surface, kill it and optionally deposit an extra burst of foam.
          // Bubble "touches" surface when its top hits y=0: (py + r >= 0).
          if (py + r >= 0.0) {
            const holdEnabled = bubbles.surfaceBubbleHoldEnabled && bubbles.surfaceBubbleHoldSeconds > 0;

            if (holdEnabled) {
              // One-time initialize hold timer when we first reach the surface.
              if (pool.surfaceHoldState[i] === 0) {
                pool.surfaceHoldState[i] = 1;

                // Stable per-bubble random (based on seeds) so hold time doesn't flicker frame-to-frame.
                const sr = Math.sin(pool.seedA[i] * 12.9898 + pool.seedB[i] * 78.233) * 43758.5453;
                const rand01 = sr - Math.floor(sr);

                const baseHold = Math.max(0, bubbles.surfaceBubbleHoldSeconds);
                const denom = Math.max(1e-6, bubbles.sizeMax - bubbles.sizeMin);
                const size01 = THREE.MathUtils.clamp((r - bubbles.sizeMin) / denom, 0, 1);
                const holdScale = (0.65 + 0.7 * rand01) * (0.75 + 0.5 * size01);

                pool.surfaceHoldUntil[i] = ageNext + baseHold * holdScale;
              }

              // Clamp to a stable “surface tension” height (optional protrusion).
              const protrude = THREE.MathUtils.clamp(bubbles.surfaceBubbleProtrudeFraction, 0, 0.75);
              const targetY = -(1 - protrude) * r; // y=0 is surface
              py = Math.min(py, targetY);

              // Strong damping while stuck to the surface.
              pool.vel[base] *= Math.exp(-10.0 * deltaSeconds);
              pool.vel[base + 1] = 0;
              pool.vel[base + 2] *= Math.exp(-10.0 * deltaSeconds);

              // Pop after hold time and deposit a burst of foam.
              if (ageNext >= pool.surfaceHoldUntil[i]) {
                // Optional: split larger bubbles into multiple smaller ones near the surface (v7 prototype).
                if (bubbles.surfaceBubbleSplitEnabled) {
                  const sizeThresh = (Math.max(0.001, bubbles.sizeMin) + Math.max(0.001, bubbles.sizeMax)) * 0.5;
                  if (r > sizeThresh) {
                    const sr = Math.sin(pool.seedA[i] * 31.416 + pool.seedB[i] * 17.903) * 43758.5453;
                    const rand01 = sr - Math.floor(sr);

                    const childCount = r > sizeThresh * 1.25 && rand01 > 0.35 ? 3 : 2;
                    const baseChildR = r * Math.cbrt(1 / childCount);

                    // Allocate free slots for children (skip if pool is full).
                    const allocChild = () => {
                      let next = bubbleNextIndexRef.current;
                      if (next < 0 || next >= bubbleMaxActive) next = 0;
                      for (let k = 0; k < bubbleMaxActive; k++) {
                        const j = (next + k) % bubbleMaxActive;
                        if (pool.active[j] === 0) {
                          bubbleNextIndexRef.current = (j + 1) % bubbleMaxActive;
                          return j;
                        }
                      }
                      return -1;
                    };

                    for (let c = 0; c < childCount; c++) {
                      const ci = allocChild();
                      if (ci < 0) break;

                      pool.active[ci] = 1;
                      pool.age[ci] = 0;
                      pool.life[ci] = Math.max(0.05, bubbles.lifetime) * (0.6 + 0.8 * Math.random());

                      // Child radius: volume-ish conservation + slight jitter, clamped to configured range.
                      const childR = THREE.MathUtils.clamp(
                        baseChildR * (0.9 + 0.2 * Math.random()),
                        Math.max(0.001, bubbles.sizeMin),
                        Math.max(Math.max(0.001, bubbles.sizeMin), bubbles.sizeMax)
                      );
                      pool.size[ci] = childR;

                      pool.seedA[ci] = Math.random() * 10.0;
                      pool.seedB[ci] = Math.random() * 10.0;

                      pool.surfaceHoldState[ci] = 1;
                      const holdBase = Math.max(0.02, bubbles.surfaceBubbleHoldSeconds);
                      pool.surfaceHoldUntil[ci] = holdBase * (0.35 + 0.55 * Math.random());

                      const baseC = ci * 3;
                      const phi = Math.random() * Math.PI * 2;
                      const rr = childR * (0.35 + 0.65 * Math.random());
                      const ox = Math.cos(phi) * rr;
                      const oz = Math.sin(phi) * rr;

                      pool.pos[baseC] = THREE.MathUtils.clamp(px + ox, -0.98, 0.98);
                      pool.pos[baseC + 1] = py; // already clamped to surface tension height
                      pool.pos[baseC + 2] = THREE.MathUtils.clamp(pz + oz, -0.98, 0.98);

                      // Small outward drift so splits separate instead of re-clumping.
                      pool.vel[baseC] = ox * 2.0 + (Math.random() * 2 - 1) * 0.08;
                      pool.vel[baseC + 1] = 0;
                      pool.vel[baseC + 2] = oz * 2.0 + (Math.random() * 2 - 1) * 0.08;

                      pool.turb[baseC] = 0;
                      pool.turb[baseC + 1] = 0;
                      pool.turb[baseC + 2] = 0;
                    }
                  }
                }

                if (foamStrength > 0) {
                  const jitter = 1 + (Math.random() * 2 - 1) * foamVar;
                  // V7: Enhanced foam burst when surface bubbles pop, using surfacePopFoamMultiplier
                  const popMult = Math.max(0, bubbles.surfacePopFoamMultiplier ?? 1.5);
                  const burst = (foamSmart ? 140.0 : 80.0) * foamStrength * jitter * popMult;
                  depositFoam(px, pz, Math.max(0.001, r) * foamSizeMult * 1.25, burst);
                }
                pool.active[i] = 0;
                pool.surfaceHoldState[i] = 0;
                pool.surfaceHoldUntil[i] = 0;
                continue;
              }
            } else {
              // Default: pop immediately on contact.
              if (foamStrength > 0) {
                const jitter = 1 + (Math.random() * 2 - 1) * foamVar;
                // V7: Use surfacePopFoamMultiplier for enhanced pop foam
                const popMult = Math.max(0, bubbles.surfacePopFoamMultiplier ?? 1.5);
                const burst = (foamSmart ? 120.0 : 60.0) * foamStrength * jitter * popMult;
                depositFoam(px, pz, Math.max(0.001, r) * foamSizeMult * 1.15, burst);
              }
              pool.active[i] = 0;
              pool.surfaceHoldState[i] = 0;
              pool.surfaceHoldUntil[i] = 0;
              continue;
            }
          } else {
            // If we were holding but slipped below the surface band, reset.
            if (pool.surfaceHoldState[i] !== 0) {
              pool.surfaceHoldState[i] = 0;
              pool.surfaceHoldUntil[i] = 0;
            }
          }

          pool.pos[base] = px;
          pool.pos[base + 1] = py;
          pool.pos[base + 2] = pz;
        }

        // Pass 2: coalescence (merge) using a lightweight 2D spatial hash in xz.
        // Default OFF. When enabled, merges conserve gas volume: r_new = (r_i^3 + r_j^3)^(1/3).
        if (anyActive && bubbles.coalescenceEnabled) {
          const mergedThisFrame = bubbleMergedThisFrameRef.current;
          mergedThisFrame.fill(0);

          const kMerge = Math.max(0.1, bubbles.coalescenceRadiusMultiplier);
          const relVelMax = Math.max(0, bubbles.coalescenceRelVelMax);
          const relVelMax2 = relVelMax * relVelMax;
          const lambda = Math.max(0, bubbles.coalescenceRate);
          const pMerge = 1 - Math.exp(-lambda * deltaSeconds);

          // Cell size: proportional to max merge radius. Keep a floor to avoid too many buckets.
          const cellSize = Math.max(0.02, kMerge * 2.0 * Math.max(0.001, bubbles.sizeMax));
          const invCell = 1.0 / cellSize;
          const grid = new Map<number, number[]>();

          const minX = -1.0;
          const minZ = -1.0;

          // Build buckets of active indices.
          for (let i = 0; i < BUBBLE_MAX_PARTICLES; i++) {
            if (pool.active[i] === 0) continue;
            const base = i * 3;
            const px = pool.pos[base];
            const pz = pool.pos[base + 2];
            const ix = Math.floor((px - minX) * invCell);
            const iz = Math.floor((pz - minZ) * invCell);
            const key = (ix & 0xffff) | ((iz & 0xffff) << 16);
            const bucket = grid.get(key);
            if (bucket) bucket.push(i);
            else grid.set(key, [i]);
          }

          // Merge checks.
          for (let i = 0; i < BUBBLE_MAX_PARTICLES; i++) {
            if (pool.active[i] === 0) continue;
            if (mergedThisFrame[i] !== 0) continue;

            const baseI = i * 3;
            const xi = pool.pos[baseI];
            const yi = pool.pos[baseI + 1];
            const zi = pool.pos[baseI + 2];
            const ri = pool.size[i];

            const ix = Math.floor((xi - minX) * invCell);
            const iz = Math.floor((zi - minZ) * invCell);

            for (let dz = -1; dz <= 1; dz++) {
              for (let dx = -1; dx <= 1; dx++) {
                const key = ((ix + dx) & 0xffff) | (((iz + dz) & 0xffff) << 16);
                const bucket = grid.get(key);
                if (!bucket) continue;

                for (let bi = 0; bi < bucket.length; bi++) {
                  const j = bucket[bi];
                  if (j <= i) continue; // unique pairs; keep i as survivor
                  if (pool.active[j] === 0) continue;
                  if (mergedThisFrame[j] !== 0) continue;

                  const baseJ = j * 3;
                  const xj = pool.pos[baseJ];
                  const yj = pool.pos[baseJ + 1];
                  const zj = pool.pos[baseJ + 2];
                  const rj = pool.size[j];

                  const dxp = xj - xi;
                  const dyp = yj - yi;
                  const dzp = zj - zi;
                  const dist2 = dxp * dxp + dyp * dyp + dzp * dzp;
                  const mergeR = kMerge * (ri + rj);
                  if (dist2 > mergeR * mergeR) continue;

                  // Relative velocity test (use advected velocity + OU turbulence, ignore slip).
                  const vxi = pool.vel[baseI] + pool.turb[baseI];
                  const vyi = pool.vel[baseI + 1] + pool.turb[baseI + 1];
                  const vzi = pool.vel[baseI + 2] + pool.turb[baseI + 2];

                  const vxj = pool.vel[baseJ] + pool.turb[baseJ];
                  const vyj = pool.vel[baseJ + 1] + pool.turb[baseJ + 1];
                  const vzj = pool.vel[baseJ + 2] + pool.turb[baseJ + 2];

                  const dvx = vxj - vxi;
                  const dvy = vyj - vyi;
                  const dvz = vzj - vzi;
                  const rel2 = dvx * dvx + dvy * dvy + dvz * dvz;
                  if (rel2 > relVelMax2) continue;

                  if (pMerge < 1 && Math.random() > pMerge) continue;

                  // Merge volumes (gas volume ~ r^3).
                  const wi = ri * ri * ri;
                  const wj = rj * rj * rj;
                  const w = wi + wj;
                  const invW = w > 0 ? 1 / w : 0;

                  // Update i (survivor).
                  pool.pos[baseI] = (xi * wi + xj * wj) * invW;
                  pool.pos[baseI + 1] = (yi * wi + yj * wj) * invW;
                  pool.pos[baseI + 2] = (zi * wi + zj * wj) * invW;

                  pool.vel[baseI] = (pool.vel[baseI] * wi + pool.vel[baseJ] * wj) * invW;
                  pool.vel[baseI + 1] = (pool.vel[baseI + 1] * wi + pool.vel[baseJ + 1] * wj) * invW;
                  pool.vel[baseI + 2] = (pool.vel[baseI + 2] * wi + pool.vel[baseJ + 2] * wj) * invW;

                  pool.turb[baseI] = (pool.turb[baseI] * wi + pool.turb[baseJ] * wj) * invW;
                  pool.turb[baseI + 1] = (pool.turb[baseI + 1] * wi + pool.turb[baseJ + 1] * wj) * invW;
                  pool.turb[baseI + 2] = (pool.turb[baseI + 2] * wi + pool.turb[baseJ + 2] * wj) * invW;

                  pool.size[i] = Math.cbrt(w);

                  // Keep the "new" bubble from instantly dying: choose the best remaining fade.
                  pool.age[i] = Math.min(pool.age[i], pool.age[j]);
                  pool.life[i] = Math.max(pool.life[i], pool.life[j]);

                  // Kill j.
                  pool.active[j] = 0;
                  mergedThisFrame[i] = 1;
                  mergedThisFrame[j] = 1;
                  break;
                }
                if (mergedThisFrame[i] !== 0) break;
              }
              if (mergedThisFrame[i] !== 0) break;
            }
          }
        }

        // Pass 2.5: Build a low-res 3D-ish bubble density field (stacked layers) for the water shader.
        // This makes bubbles appear "under" the water surface (not as a screen overlay) and gives depth parallax.
        {
          const strength = Math.max(0, bubbles.renderStrength);
          const data = bubbleField.data;
          data.fill(0);

          if (strength > 0) {
            const size = bubbleField.size;
            const layers = bubbleField.layers;
            const poolHeight = 1.0;
            const cellWorld = 2 / size;

            // Intensity scaling in 8-bit space (tuned by eye, multiplied by renderStrength).
            const baseIntensity = 36 * strength;

            for (let i = 0; i < BUBBLE_MAX_PARTICLES; i++) {
              if (pool.active[i] === 0) continue;
              const base = i * 3;
              const px = pool.pos[base];
              const py = pool.pos[base + 1];
              const pz = pool.pos[base + 2];

              const uvx = THREE.MathUtils.clamp(px * 0.5 + 0.5, 0, 1);
              const uvz = THREE.MathUtils.clamp(pz * 0.5 + 0.5, 0, 1);
              const yN = THREE.MathUtils.clamp((-py) / poolHeight, 0, 1);

              const layerF = yN * (layers - 1);
              const l0 = Math.floor(layerF);
              const t = layerF - l0;
              const l1 = Math.min(l0 + 1, layers - 1);

              const cx = Math.floor(uvx * (size - 1));
              const cz = Math.floor(uvz * (size - 1));

              const r = Math.max(0, pool.size[i]);
              const radCells = Math.min(6, Math.max(1, Math.round((r / Math.max(1e-6, cellWorld)) * 1.2)));
              const invRad2 = 1 / Math.max(1e-6, radCells * radCells);

              const intensity = baseIntensity * THREE.MathUtils.clamp(r / Math.max(1e-6, rRef), 0.5, 2.0);

              for (let dz = -radCells; dz <= radCells; dz++) {
                const zz = cz + dz;
                if (zz < 0 || zz >= size) continue;
                for (let dx = -radCells; dx <= radCells; dx++) {
                  const xx = cx + dx;
                  if (xx < 0 || xx >= size) continue;

                  const w = Math.exp(-(dx * dx + dz * dz) * invRad2);
                  const add0 = Math.round(intensity * w * (1 - t));
                  const add1 = Math.round(intensity * w * t);

                  const row0 = (l0 * size + zz) * size + xx;
                  const row1 = (l1 * size + zz) * size + xx;
                  const idx0 = row0 * 4;
                  const idx1 = row1 * 4;

                  if (add0 > 0) {
                    const v0 = Math.min(255, data[idx0] + add0);
                    data[idx0] = v0;
                    data[idx0 + 1] = v0;
                    data[idx0 + 2] = v0;
                    data[idx0 + 3] = 255;
                  }
                  if (add1 > 0) {
                    const v1 = Math.min(255, data[idx1] + add1);
                    data[idx1] = v1;
                    data[idx1 + 1] = v1;
                    data[idx1 + 2] = v1;
                    data[idx1 + 3] = 255;
                  }
                }
              }
            }
          }

          bubbleField.tex.needsUpdate = true;
        }

        // Pass 2.6: Update persistent surface foam texture (2D) from float accum.
        {
          for (let i = 0; i < foamAcc.length; i++) {
            const b = Math.min(255, Math.max(0, Math.round(foamAcc[i])));
            const idx = i * 4;
            foamData[idx] = b;
            foamData[idx + 1] = b;
            foamData[idx + 2] = b;
            foamData[idx + 3] = 255;
          }
          surfaceFoamField.tex.needsUpdate = true;
        }

        // Pass 3: write instance matrices.
        for (let i = 0; i < BUBBLE_MAX_PARTICLES; i++) {
          if (pool.active[i] === 0) {
            bubbleTmpObj.position.set(0, 0, 0);
            bubbleTmpObj.scale.setScalar(0);
            bubbleTmpObj.updateMatrix();
            mesh.setMatrixAt(i, bubbleTmpObj.matrix);
            continue;
          }

          const life = pool.life[i];
          const age = pool.age[i];
          const base = i * 3;
          const px = pool.pos[base];
          const py = pool.pos[base + 1];
          const pz = pool.pos[base + 2];

          const lifeT = THREE.MathUtils.clamp(age / Math.max(1e-6, life), 0, 1);
          const fadeLife = foamSmart ? 1 : 1 - lifeT;
          // V7: Avoid a “fixed depth band” look near the surface.
          // Keep bubbles visible up to very near y=0 (they are still removed on actual surface hit).
          const surfaceFadeDepth = 0.02;
          const fadeSurface = foamSmart ? 1 : THREE.MathUtils.smoothstep(-py, 0.0, surfaceFadeDepth);
          const scale = pool.size[i] * fadeLife * fadeSurface;

          bubbleTmpObj.position.set(px, py, pz);
          bubbleTmpObj.scale.setScalar(scale);
          bubbleTmpObj.updateMatrix();
          mesh.setMatrixAt(i, bubbleTmpObj.matrix);
        }

        if (anyMovedThisFrame) mesh.instanceMatrix.needsUpdate = true;
      }
    }

    // -----------------------------------------------------------------------
    // Breaching / spray metaballs (wave crest sheets & blobs above the surface).
    // Goal: plausible physics + “lava blob” style organic morphing via metaballs.
    // -----------------------------------------------------------------------
    {
      const b = settings.sphere.physics.bubbles;
      const pool = breachPoolRef.current;

      const breachEnabled = b.breachEnabled;
      const cavitationEnabled = b.cavitationEnabled;
      const enabled = (breachEnabled || cavitationEnabled) && spherePhysicsEnabledRef.current;

      // Defaults: keep shader fed even when disabled.
      let blobCount = 0;

      if (enabled) {
        const center = sphereCenterRef.current;
        const v = sphereVelocityRef.current;
        const vx = v.x;
        const vz = v.z;
        const speed = Math.sqrt(vx * vx + vz * vz);
        const entrySpeed = Math.max(0, -v.y);

        // Waterline contact fraction (0..1).
        const area = Math.PI * sphereRadius * sphereRadius;
        const capHeight = THREE.MathUtils.clamp(sphereRadius - center.y, 0, 2 * sphereRadius);
        const wettedArea = Math.PI * Math.max(0, 2 * sphereRadius * capHeight - capHeight * capHeight);
        const wettedFrac = area > 0 ? THREE.MathUtils.clamp(wettedArea / area, 0, 1) : 0;

        // “Crest energy” proxy from the physics step.
        const energy = Math.max(0, slamWaveImpulse - Math.max(0, b.breachMinImpulse));
        const energy01 = THREE.MathUtils.clamp(energy / 0.03, 0, 1);
        const encodeScale = Math.max(0.0001, settings.sphere.physics.heightEncodeScale);

        // V7: Wave retraction detection (breach triggered by wave falling back, not expanding).
        // This tracks wave heights around the sphere and detects when they retract quickly.
        let retractionBoost = 0;
        if (b.breachRetractionEnabled && wettedFrac > 0.05) {
          const retractState = waveRetractionRef.current;
          const numSamples = WAVE_RETRACT_SAMPLES;
          const sampleRadius = sphereRadius * 1.5;

          // Set up sample points in a ring around the sphere
          for (let i = 0; i < numSamples; i++) {
            const phi = (i / numSamples) * Math.PI * 2;
            retractState.sampleX[i] = THREE.MathUtils.clamp(center.x + Math.cos(phi) * sampleRadius, -0.98, 0.98);
            retractState.sampleZ[i] = THREE.MathUtils.clamp(center.z + Math.sin(phi) * sampleRadius, -0.98, 0.98);
          }

          // Sample current wave heights at these positions
          {
            const { uvData } = buoyancySampler;
            for (let i = 0; i < numSamples; i++) {
              const u = THREE.MathUtils.clamp(retractState.sampleX[i] * 0.5 + 0.5, 0, 1);
              const v2 = THREE.MathUtils.clamp(retractState.sampleZ[i] * 0.5 + 0.5, 0, 1);
              uvData[i * 4] = Math.round(u * 255);
              uvData[i * 4 + 1] = Math.round(v2 * 255);
              uvData[i * 4 + 2] = 0;
              uvData[i * 4 + 3] = 255;
            }
            for (let i = numSamples; i < BUOYANCY_MAX_SAMPLES; i++) {
              uvData[i * 4] = 128;
              uvData[i * 4 + 1] = 128;
              uvData[i * 4 + 2] = 0;
              uvData[i * 4 + 3] = 255;
            }

            buoyancySampler.material.uniforms.uWater.value = getTexture();
            buoyancySampler.material.uniforms.uEncodeScale.value = encodeScale;
            buoyancySampler.uvTexture.needsUpdate = true;

            const previousTarget = gl.getRenderTarget();
            gl.setRenderTarget(buoyancySampler.renderTarget);
            gl.render(buoyancySampler.scene, buoyancySampler.quadCamera);
            gl.setRenderTarget(previousTarget);

            gl.readRenderTargetPixels(
              buoyancySampler.renderTarget,
              0,
              0,
              BUOYANCY_MAX_SAMPLES,
              1,
              buoyancySampler.readBuffer
            );

            // Compute retraction speeds (negative = wave falling)
            let maxRetract = 0;
            let avgRetract = 0;
            let maxRetractIdx = 0;
            const dt = Math.max(1e-4, deltaSeconds);

            for (let i = 0; i < numSamples; i++) {
              const encoded = buoyancySampler.readBuffer[i * 4] / 255;
              const height = (encoded - 0.5) / encodeScale;

              if (retractState.initialized) {
                const prevH = retractState.prevHeights[i];
                const dH = height - prevH; // negative = falling
                const velocity = dH / dt;

                // Retraction = negative velocity (wave falling)
                if (velocity < 0) {
                  const retractSpeed = -velocity;
                  avgRetract += retractSpeed;
                  if (retractSpeed > maxRetract) {
                    maxRetract = retractSpeed;
                    maxRetractIdx = i;
                  }
                }
              }

              retractState.prevHeights[i] = height;
            }

            retractState.initialized = true;
            retractState.maxRetractionSpeed = maxRetract;
            retractState.avgRetractionSpeed = avgRetract / numSamples;

            // Store direction of max retraction (radial from sphere center)
            if (maxRetract > 0) {
              const phi = (maxRetractIdx / numSamples) * Math.PI * 2;
              retractState.retractionDir.x = Math.cos(phi);
              retractState.retractionDir.z = Math.sin(phi);
            }

            // Compute breach boost from retraction (0..1 based on min/max thresholds)
            const minSpeed = Math.max(0, b.breachRetractionMinSpeed);
            const maxSpeed = Math.max(minSpeed + 0.01, b.breachRetractionMaxSpeed);
            const retractStrength = Math.max(0, b.breachRetractionStrength);

            if (maxRetract > minSpeed) {
              const t = THREE.MathUtils.clamp((maxRetract - minSpeed) / (maxSpeed - minSpeed), 0, 1);
              retractionBoost = t * retractStrength;
            }
          }
        }

        // Spawn rate (events/sec): scales with impact/skim energy + surface contact + speed + retraction.
        // V7: retractionBoost adds to the energy term, so retraction-driven breaching scales naturally.
        const baseRate = Math.max(0, b.breachRate);
        const effectiveEnergy = energy01 + retractionBoost; // retractionBoost scales linearly with retraction
        const rate =
          baseRate *
          (0.15 + 0.85 * wettedFrac) *
          (0.35 + 0.65 * THREE.MathUtils.clamp(speed / 1.2, 0, 1)) *
          (0.25 + 2.75 * effectiveEnergy) *
          Math.max(0, b.breachStrength);

        const spawnFloat = rate * deltaSeconds + breachSpawnCarryRef.current;
        const spawnEventsRaw = Math.floor(spawnFloat);
        breachSpawnCarryRef.current = spawnFloat - spawnEventsRaw;

        const spawnEvents = Math.min(6, Math.max(0, spawnEventsRaw));
        const chainLen = Math.max(1, Math.min(8, Math.round(b.breachChainLength)));

        // Direction: primarily along horizontal motion.
        const hasDir = speed > 1e-6;
        const dirX = hasDir ? vx / speed : 1;
        const dirZ = hasDir ? vz / speed : 0;
        const perpX = dirZ;
        const perpZ = -dirX;

        const dirMix = THREE.MathUtils.clamp(b.breachDirectionMix, 0, 1);
        let strandDirX = THREE.MathUtils.lerp(dirX, perpX, dirMix);
        let strandDirZ = THREE.MathUtils.lerp(dirZ, perpZ, dirMix);
        {
          const l = Math.sqrt(strandDirX * strandDirX + strandDirZ * strandDirZ);
          if (l > 1e-6) {
            strandDirX /= l;
            strandDirZ /= l;
          } else {
            strandDirX = dirX;
            strandDirZ = dirZ;
          }
        }

        // Surface foam deposit helper (for breach re-entry splashes).
        const foamAcc = surfaceFoamField.accum;
        const foamSize = surfaceFoamField.size;
        const foamCellWorld = 2 / foamSize;
        const foamSizeMult = Math.max(0.1, b.surfaceFoamSizeMultiplier);
        const foamStrength = Math.max(0, b.surfaceFoamStrength);

        const depositFoam = (x: number, z: number, rWorld: number, amount: number) => {
          if (amount <= 0) return;
          const uvx = THREE.MathUtils.clamp(x * 0.5 + 0.5, 0, 1);
          const uvz = THREE.MathUtils.clamp(z * 0.5 + 0.5, 0, 1);
          const cx = Math.floor(uvx * (foamSize - 1));
          const cz = Math.floor(uvz * (foamSize - 1));

          const radCells = Math.min(
            16,
            Math.max(1, Math.round((rWorld / Math.max(1e-6, foamCellWorld)) * 1.25))
          );
          const invRad2 = 1 / Math.max(1e-6, radCells * radCells);

          for (let dz = -radCells; dz <= radCells; dz++) {
            const zz = cz + dz;
            if (zz < 0 || zz >= foamSize) continue;
            for (let dx = -radCells; dx <= radCells; dx++) {
              const xx = cx + dx;
              if (xx < 0 || xx >= foamSize) continue;
              const w = Math.exp(-(dx * dx + dz * dz) * invRad2);
              const idx = zz * foamSize + xx;
              foamAcc[idx] = Math.min(255, foamAcc[idx] + amount * w);
            }
          }
        };

        // -------------------------------------------------------------------
        // Cavitation / vacuum entry (concave trail + delayed ejecta).
        // -------------------------------------------------------------------
        if (cavitationEnabled) {
          // Cooldown to avoid re-triggering constantly while inside water.
          cavitationCooldownRef.current = Math.max(0, cavitationCooldownRef.current - deltaSeconds);

          const subNow = THREE.MathUtils.clamp(sphereSubmergedFractionRef.current, 0, 1);
          const subPrev = cavitationPrevSubRef.current;
          cavitationPrevSubRef.current = subNow;

          // Strong entry trigger: crossing from mostly-out to meaningfully-in while moving down.
          const entryCross = subPrev < 0.15 && subNow >= 0.15;
          const entryGate = entrySpeed > 0.25;

          // Prefer “rear” along horizontal motion; for near-vertical entries, treat as symmetric.
          const hasHoriz = speed > 1e-6;
          const dX = hasHoriz ? vx / speed : 0;
          const dZ = hasHoriz ? vz / speed : 0;
          const rearX0 = -dX;
          const rearZ0 = -dZ;
          const sideX0 = dZ;
          const sideZ0 = -dX;

          if (cavitationCooldownRef.current <= 0 && entryCross && entryGate) {
            const entry01 = THREE.MathUtils.clamp(entrySpeed / 1.2, 0, 1);
            const trailS = Math.max(0, b.cavitationTrailStrength) * (0.5 + 0.65 * entry01);
            const trailR = THREE.MathUtils.clamp(b.cavitationTrailRadius, 0.01, 0.35);
            const trailOffset = THREE.MathUtils.clamp(b.cavitationTrailOffset, 0, 3);

            // Inject a short concave “suction” trail behind the sphere at entry (discrete, non-accumulating).
            const segments = hasHoriz ? 4 : 1;
            for (let s = 0; s < segments; s++) {
              const t = (trailOffset + 0.45 * s) * sphereRadius;
              const jitter = (Math.random() * 2 - 1) * trailR * 0.35;
              const px = THREE.MathUtils.clamp(center.x + rearX0 * t + sideX0 * jitter, -0.98, 0.98);
              const pz = THREE.MathUtils.clamp(center.z + rearZ0 * t + sideZ0 * jitter, -0.98, 0.98);
              const r = trailR * (1.0 + 0.18 * s);
              const sDrop = -trailS * (1.0 - 0.12 * s);
              addDrop(px, pz, r, sDrop);
            }

            // Arm delayed ejecta (uses breach metaball blobs).
            {
              const pending = cavitationPendingRef.current;
              pending.active = true;
              pending.timer = Math.max(0, b.cavitationDelay);
              pending.baseX = THREE.MathUtils.clamp(center.x + rearX0 * sphereRadius * (trailOffset + 0.6), -0.98, 0.98);
              pending.baseZ = THREE.MathUtils.clamp(center.z + rearZ0 * sphereRadius * (trailOffset + 0.6), -0.98, 0.98);
              pending.dirX = dX;
              pending.dirZ = dZ;
              pending.rearX = rearX0;
              pending.rearZ = rearZ0;
              pending.entrySpeed = entrySpeed;
              pending.hSpeed = speed;
            }

            cavitationCooldownRef.current = 0.35;
          }

          // Fire delayed ejecta burst.
          const pending = cavitationPendingRef.current;
          if (pending.active) {
            pending.timer -= deltaSeconds;
            if (pending.timer <= 0) {
              pending.active = false;

              const ejectStrength = Math.max(0, b.cavitationEjectStrength);
              if (ejectStrength > 0) {
                const entry01 = THREE.MathUtils.clamp(pending.entrySpeed / 1.2, 0, 1);
                const speed01 = THREE.MathUtils.clamp(pending.hSpeed / 1.2, 0, 1);

                const ejectEvents = Math.min(12, Math.max(0, Math.floor((2 + 6 * entry01) * ejectStrength)));
                if (ejectEvents > 0) {
                  const xs = waterSampleXRef.current;
                  const zs = waterSampleZRef.current;
                  const hs = waterSampleHRef.current;

                  const hasAxis = pending.dirX * pending.dirX + pending.dirZ * pending.dirZ > 1e-10;
                  const sideX = pending.dirZ;
                  const sideZ = -pending.dirX;
                  const spread = sphereRadius * (0.22 + 0.35 * entry01);

                  // Choose burst bases (behind sphere), then sample true wave height.
                  for (let e = 0; e < ejectEvents; e++) {
                    let bx = pending.baseX;
                    let bz = pending.baseZ;
                    if (hasAxis) {
                      const along = (0.05 + 0.35 * Math.random()) * sphereRadius;
                      const lateral = bubbleRandNormal() * spread;
                      bx = pending.baseX + pending.rearX * along + sideX * lateral;
                      bz = pending.baseZ + pending.rearZ * along + sideZ * lateral;
                    } else {
                      const phi = Math.random() * Math.PI * 2;
                      const rx = Math.cos(phi);
                      const rz = Math.sin(phi);
                      bx = pending.baseX + rx * (0.18 + 0.32 * Math.random()) * sphereRadius;
                      bz = pending.baseZ + rz * (0.18 + 0.32 * Math.random()) * sphereRadius;
                    }
                    xs[e] = THREE.MathUtils.clamp(bx, -0.98, 0.98);
                    zs[e] = THREE.MathUtils.clamp(bz, -0.98, 0.98);
                  }

                  // Sample the current wave surface height at each burst base.
                  {
                    const { uvData } = buoyancySampler;
                    for (let i = 0; i < ejectEvents; i++) {
                      const u = THREE.MathUtils.clamp(xs[i] * 0.5 + 0.5, 0, 1);
                      const v2 = THREE.MathUtils.clamp(zs[i] * 0.5 + 0.5, 0, 1);
                      uvData[i * 4] = Math.round(u * 255);
                      uvData[i * 4 + 1] = Math.round(v2 * 255);
                      uvData[i * 4 + 2] = 0;
                      uvData[i * 4 + 3] = 255;
                    }
                    for (let i = ejectEvents; i < BUOYANCY_MAX_SAMPLES; i++) {
                      uvData[i * 4] = 128;
                      uvData[i * 4 + 1] = 128;
                      uvData[i * 4 + 2] = 0;
                      uvData[i * 4 + 3] = 255;
                    }

                    buoyancySampler.material.uniforms.uWater.value = getTexture();
                    buoyancySampler.material.uniforms.uEncodeScale.value = encodeScale;
                    buoyancySampler.uvTexture.needsUpdate = true;

                    const previousTarget = gl.getRenderTarget();
                    gl.setRenderTarget(buoyancySampler.renderTarget);
                    gl.render(buoyancySampler.scene, buoyancySampler.quadCamera);
                    gl.setRenderTarget(previousTarget);

                    gl.readRenderTargetPixels(
                      buoyancySampler.renderTarget,
                      0,
                      0,
                      BUOYANCY_MAX_SAMPLES,
                      1,
                      buoyancySampler.readBuffer
                    );

                    for (let i = 0; i < ejectEvents; i++) {
                      const encoded = buoyancySampler.readBuffer[i * 4] / 255;
                      hs[i] = (encoded - 0.5) / encodeScale;
                    }
                  }

                  // Spawn burst blobs (“water balls”) above the sampled wave surface.
                  const rBase = Math.max(0.001, b.breachRadius);
                  const lifeBase = Math.max(0.05, b.breachLifetime);
                  const jetBase = Math.max(0, b.breachJetSpeed);
                  const upBase = Math.max(0, b.breachUpSpeed);

                  for (let e = 0; e < ejectEvents; e++) {
                    const idx = breachNextIndexRef.current;
                    breachNextIndexRef.current = (idx + 1) % BREACH_MAX_BLOBS;

                    pool.active[idx] = 1;
                    pool.age[idx] = 0;
                    pool.life[idx] = lifeBase * (0.35 + Math.random() * 0.45);

                    const r0 =
                      rBase *
                      (0.55 + 0.55 * Math.random()) *
                      (0.75 + 0.55 * entry01) *
                      (0.85 + 0.35 * THREE.MathUtils.clamp(ejectStrength, 0, 3));
                    pool.radius[idx] = r0;

                    const base = idx * 3;
                    const waterY = hs[e] ?? 0;
                    pool.pos[base] = xs[e];
                    pool.pos[base + 1] = waterY + Math.max(0.01, r0 * 0.55) + 0.02 + Math.random() * 0.03;
                    pool.pos[base + 2] = zs[e];

                    let jx = pending.rearX;
                    let jz = pending.rearZ;
                    if (!hasAxis) {
                      // Radial for vertical-ish entries.
                      const dx = xs[e] - center.x;
                      const dz = zs[e] - center.z;
                      const dl = Math.sqrt(dx * dx + dz * dz);
                      if (dl > 1e-6) {
                        jx = dx / dl;
                        jz = dz / dl;
                      } else {
                        const phi = Math.random() * Math.PI * 2;
                        jx = Math.cos(phi);
                        jz = Math.sin(phi);
                      }
                    }

                    const jet = (0.35 + 0.9 * speed01 + 0.65 * entry01) * jetBase * (0.6 + 0.6 * ejectStrength);
                    const up = (0.55 + 1.55 * entry01) * upBase * (0.6 + 0.6 * ejectStrength);
                    const lat = (Math.random() * 2 - 1) * (0.18 + 0.25 * entry01);

                    pool.vel[base] = jx * jet + sideX * lat + (Math.random() * 2 - 1) * 0.12;
                    pool.vel[base + 1] = up + (Math.random() * 2 - 1) * 0.35;
                    pool.vel[base + 2] = jz * jet + sideZ * lat + (Math.random() * 2 - 1) * 0.12;
                  }
                }
              }
            }
          }
        } else {
          // Keep state stable if cavitation is toggled off.
          cavitationPendingRef.current.active = false;
          cavitationCooldownRef.current = 0;
          cavitationPrevSubRef.current = THREE.MathUtils.clamp(sphereSubmergedFractionRef.current, 0, 1);
        }

        // Spawn new breach “strands” (metaball chains).
        if (breachEnabled && spawnEvents > 0 && wettedFrac > 0.02) {
          const jet = Math.max(0, b.breachJetSpeed) * (0.4 + 0.9 * energy01);
          const upKick = Math.max(0, b.breachUpSpeed) * (0.35 + 0.9 * energy01);
          const spacing = Math.max(0.25, b.breachChainSpacing) * Math.max(0.001, b.breachRadius);
          const eventSpread = Math.max(0, b.breachEventSpread) * sphereRadius;
          const spawnOffset = b.breachSpawnOffset * sphereRadius;
          const waterTake = THREE.MathUtils.clamp(b.breachWaterTake, 0, 1);

          // Waterline circle where the sphere intersects y=0 plane (only valid if intersecting).
          const waterlineR2 = sphereRadius * sphereRadius - center.y * center.y;
          const waterlineR = waterlineR2 > 0 ? Math.sqrt(waterlineR2) : 0;

          // Precompute event bases (so sampled heights match the random offsets we chose).
          const evX = waterSampleXRef.current;
          const evZ = waterSampleZRef.current;
          const evH = waterSampleHRef.current;
          for (let e = 0; e < spawnEvents; e++) {
            const rim = waterlineR > 1e-5 ? waterlineR : sphereRadius * 0.85;
            const hasHoriz = speed > 0.05;

            if (hasHoriz) {
              // Skim / directional motion: bias spawns near the forward contact patch.
              const baseX0 = center.x + dirX * (rim + spawnOffset);
              const baseZ0 = center.z + dirZ * (rim + spawnOffset);
              const spread = (Math.random() * 2 - 1) * eventSpread;
              const along = (Math.random() * 2 - 1) * eventSpread * 0.25;
              evX[e] = THREE.MathUtils.clamp(baseX0 + perpX * spread + strandDirX * along, -0.98, 0.98);
              evZ[e] = THREE.MathUtils.clamp(baseZ0 + perpZ * spread + strandDirZ * along, -0.98, 0.98);
            } else {
              // Vertical-ish impact: distribute around the waterline ring so the splash is symmetric.
              const phi = Math.random() * Math.PI * 2;
              const rx = Math.cos(phi);
              const rz = Math.sin(phi);
              const tx = -rz; // tangent
              const tz = rx;
              const baseX0 = center.x + rx * (rim + spawnOffset);
              const baseZ0 = center.z + rz * (rim + spawnOffset);
              const spread = (Math.random() * 2 - 1) * eventSpread;
              const along = (Math.random() * 2 - 1) * eventSpread * 0.25;
              evX[e] = THREE.MathUtils.clamp(baseX0 + tx * spread + rx * along, -0.98, 0.98);
              evZ[e] = THREE.MathUtils.clamp(baseZ0 + tz * spread + rz * along, -0.98, 0.98);
            }
          }

          // Sample the current wave surface height at each event base so sheets *emanate from the waves*.
          {
            const { uvData } = buoyancySampler;
            for (let i = 0; i < spawnEvents; i++) {
              const u = THREE.MathUtils.clamp(evX[i] * 0.5 + 0.5, 0, 1);
              const v = THREE.MathUtils.clamp(evZ[i] * 0.5 + 0.5, 0, 1);
              uvData[i * 4] = Math.round(u * 255);
              uvData[i * 4 + 1] = Math.round(v * 255);
              uvData[i * 4 + 2] = 0;
              uvData[i * 4 + 3] = 255;
            }
            for (let i = spawnEvents; i < BUOYANCY_MAX_SAMPLES; i++) {
              uvData[i * 4] = 128;
              uvData[i * 4 + 1] = 128;
              uvData[i * 4 + 2] = 0;
              uvData[i * 4 + 3] = 255;
            }

            buoyancySampler.material.uniforms.uWater.value = getTexture();
            buoyancySampler.material.uniforms.uEncodeScale.value = encodeScale;
            buoyancySampler.uvTexture.needsUpdate = true;

            const previousTarget = gl.getRenderTarget();
            gl.setRenderTarget(buoyancySampler.renderTarget);
            gl.render(buoyancySampler.scene, buoyancySampler.quadCamera);
            gl.setRenderTarget(previousTarget);

            gl.readRenderTargetPixels(
              buoyancySampler.renderTarget,
              0,
              0,
              BUOYANCY_MAX_SAMPLES,
              1,
              buoyancySampler.readBuffer
            );

            for (let i = 0; i < spawnEvents; i++) {
              const encoded = buoyancySampler.readBuffer[i * 4] / 255;
              evH[i] = (encoded - 0.5) / encodeScale;
            }
          }

          for (let e = 0; e < spawnEvents; e++) {
            const baseX = evX[e];
            const baseZ = evZ[e];
            const waterY = evH[e] ?? 0;

            // Choose a target total volume proportional to radius^3 * chainLen (volume-ish conservation).
            const r0 =
              Math.max(0.001, b.breachRadius) *
              (0.75 + 0.65 * energy01) *
              (1 + (Math.random() * 2 - 1) * THREE.MathUtils.clamp(b.breachRadiusJitter, 0, 1));
            const target = Math.pow(r0, 3) * chainLen;

            // Lift the base just above the sampled water height so it visually “peels off” the wave surface.
            const baseY = waterY + Math.max(0.01, r0 * 0.55) + Math.random() * 0.05 + 0.06 * energy01;

            // Base radii taper (then scaled to match target).
            const baseR: number[] = [];
            for (let i = 0; i < chainLen; i++) {
              const t = chainLen > 1 ? i / (chainLen - 1) : 0;
              baseR.push(r0 * (1.0 - 0.28 * t));
            }
            let sum = 0;
            for (let i = 0; i < chainLen; i++) sum += Math.pow(baseR[i], 3);
            const s = sum > 1e-9 ? Math.cbrt(target / sum) : 1.0;

            // “Take water out” at spawn to better merge the wave into the extruded metaball sheet.
            // This is a cheap volume-ish coupling: create a small trough where the breach lifts off.
            if (waterTake > 0) {
              const takeR = THREE.MathUtils.clamp(r0 * (1.0 + 0.35 * chainLen), 0.04, 0.22);
              const takeS = -waterTake * THREE.MathUtils.clamp(0.004 + 0.018 * energy01, 0, 0.02);
              addImpulse(baseX, baseZ, takeR, takeS);
            }

            // Cone direction: radial outward from the sphere center at the spawn point.
            // This makes the splash sheet spread naturally in a cone rather than purely along velocity.
            let radX = baseX - center.x;
            let radZ = baseZ - center.z;
            const radLen = Math.sqrt(radX * radX + radZ * radZ);
            if (radLen > 1e-6) {
              radX /= radLen;
              radZ /= radLen;
            } else {
              radX = dirX;
              radZ = dirZ;
            }

            // Strand direction: for vertical impacts, strands should align more with the cone/radial direction.
            const impact01 = THREE.MathUtils.clamp(entrySpeed / 1.2, 0, 1) * (0.35 + 0.65 * energy01);
            let chainDirX = THREE.MathUtils.lerp(strandDirX, radX, impact01);
            let chainDirZ = THREE.MathUtils.lerp(strandDirZ, radZ, impact01);
            {
              const l = Math.sqrt(chainDirX * chainDirX + chainDirZ * chainDirZ);
              if (l > 1e-6) {
                chainDirX /= l;
                chainDirZ /= l;
              } else {
                chainDirX = radX;
                chainDirZ = radZ;
              }
            }

            for (let i = 0; i < chainLen; i++) {
              const idx = breachNextIndexRef.current;
              breachNextIndexRef.current = (idx + 1) % BREACH_MAX_BLOBS;

              pool.active[idx] = 1;
              pool.age[idx] = 0;
              pool.life[idx] = Math.max(0.05, b.breachLifetime) * (0.7 + Math.random() * 0.6);

              const r = baseR[i] * s;
              pool.radius[idx] = r;

              const base = idx * 3;
              pool.pos[base] = baseX + chainDirX * spacing * i;
              pool.pos[base + 1] = baseY + 0.02 * i;
              pool.pos[base + 2] = baseZ + chainDirZ * spacing * i;

              // Motion/inertia: inherit horizontal motion + add jet + upward kick.
              const inherit = 0.25;
              pool.vel[base] = vx * inherit + radX * (jet + 0.45 * speed) + (Math.random() * 2 - 1) * 0.2;
              pool.vel[base + 1] =
                v.y * 0.15 + upKick + 0.25 * entrySpeed + (Math.random() * 2 - 1) * 0.25;
              pool.vel[base + 2] = vz * inherit + radZ * (jet + 0.45 * speed) + (Math.random() * 2 - 1) * 0.2;
            }
          }
        }

        // Integrate breach blobs.
        const drag = Math.max(0, b.breachDrag);
        const rRef = Math.max(0.001, b.breachRadius);
        const g = Math.max(0, b.breachGravity);

        for (let i = 0; i < BREACH_MAX_BLOBS; i++) {
          if (pool.active[i] === 0) continue;

          const ageNext = pool.age[i] + deltaSeconds;
          pool.age[i] = ageNext;
          const life = pool.life[i];
          if (ageNext >= life) {
            pool.active[i] = 0;
            continue;
          }

          const base = i * 3;
          let px = pool.pos[base];
          let py = pool.pos[base + 1];
          let pz = pool.pos[base + 2];

          const r = pool.radius[i];
          const dragMul = drag > 0 ? Math.exp(-drag * (rRef / Math.max(1e-3, r)) * deltaSeconds) : 1.0;

          let vxP = pool.vel[base] * dragMul;
          let vyP = pool.vel[base + 1] * dragMul;
          let vzP = pool.vel[base + 2] * dragMul;

          vyP -= g * deltaSeconds;

          px += vxP * deltaSeconds;
          py += vyP * deltaSeconds;
          pz += vzP * deltaSeconds;

          pool.vel[base] = vxP;
          pool.vel[base + 1] = vyP;
          pool.vel[base + 2] = vzP;

          // Cull if too far out of bounds.
          if (Math.abs(px) > 1.35 || Math.abs(pz) > 1.35 || py > 1.2 || py < -1.2) {
            pool.active[i] = 0;
            continue;
          }

          pool.pos[base] = px;
          pool.pos[base + 1] = py;
          pool.pos[base + 2] = pz;
        }

        // Re-entry/collision with the *actual wave surface* (sampled from the heightfield).
        // This makes blobs land on crests/troughs instead of an invisible flat plane at y=0.
        {
          const idxMap = waterSampleIdxRef.current;
          const xs = waterSampleXRef.current;
          const zs = waterSampleZRef.current;
          const hs = waterSampleHRef.current;

          let sampleCount = 0;
          for (let i = 0; i < BREACH_MAX_BLOBS; i++) {
            if (pool.active[i] === 0) continue;
            if (sampleCount >= BUOYANCY_MAX_SAMPLES) break;
            idxMap[sampleCount] = i;
            const base = i * 3;
            xs[sampleCount] = THREE.MathUtils.clamp(pool.pos[base], -0.999, 0.999);
            zs[sampleCount] = THREE.MathUtils.clamp(pool.pos[base + 2], -0.999, 0.999);
            sampleCount++;
          }

          if (sampleCount > 0) {
            const { uvData } = buoyancySampler;
            for (let i = 0; i < sampleCount; i++) {
              const u = THREE.MathUtils.clamp(xs[i] * 0.5 + 0.5, 0, 1);
              const v = THREE.MathUtils.clamp(zs[i] * 0.5 + 0.5, 0, 1);
              uvData[i * 4] = Math.round(u * 255);
              uvData[i * 4 + 1] = Math.round(v * 255);
              uvData[i * 4 + 2] = 0;
              uvData[i * 4 + 3] = 255;
            }
            for (let i = sampleCount; i < BUOYANCY_MAX_SAMPLES; i++) {
              uvData[i * 4] = 128;
              uvData[i * 4 + 1] = 128;
              uvData[i * 4 + 2] = 0;
              uvData[i * 4 + 3] = 255;
            }

            buoyancySampler.material.uniforms.uWater.value = getTexture();
            buoyancySampler.material.uniforms.uEncodeScale.value = encodeScale;
            buoyancySampler.uvTexture.needsUpdate = true;

            const previousTarget = gl.getRenderTarget();
            gl.setRenderTarget(buoyancySampler.renderTarget);
            gl.render(buoyancySampler.scene, buoyancySampler.quadCamera);
            gl.setRenderTarget(previousTarget);

            gl.readRenderTargetPixels(
              buoyancySampler.renderTarget,
              0,
              0,
              BUOYANCY_MAX_SAMPLES,
              1,
              buoyancySampler.readBuffer
            );

            for (let i = 0; i < sampleCount; i++) {
              const encoded = buoyancySampler.readBuffer[i * 4] / 255;
              hs[i] = (encoded - 0.5) / encodeScale;
            }

            for (let s = 0; s < sampleCount; s++) {
              const bi = idxMap[s];
              if (pool.active[bi] === 0) continue;
              const base = bi * 3;
              const px = pool.pos[base];
              const py = pool.pos[base + 1];
              const pz = pool.pos[base + 2];
              const r = pool.radius[bi];
              const waterY = hs[s];

              // Hit: blob bottom touches the current wave surface.
              if (py - r <= waterY) {
                const impactV = Math.max(0, -pool.vel[base + 1]);
                const splashR = THREE.MathUtils.clamp(r * 1.35, 0.02, 0.12);
                const splashS = THREE.MathUtils.clamp(0.006 + 0.02 * energy01 + 0.01 * impactV, 0.0, 0.04);
                addDrop(px, pz, splashR, splashS);
                if (foamStrength > 0) {
                  depositFoam(px, pz, Math.max(0.001, r) * foamSizeMult * 1.2, 120.0 * foamStrength);
                }
                pool.active[bi] = 0;
              }
            }
          }
        }

        // Anti-clump: simple pairwise repulsion to keep strands separated.
        const repulse = Math.max(0, b.breachRepulsion);
        if (repulse > 0) {
          const k = Math.max(0.5, b.breachRepulsionRadiusMultiplier);
          const push = repulse * deltaSeconds;
          for (let i = 0; i < BREACH_MAX_BLOBS; i++) {
            if (pool.active[i] === 0) continue;
            const bi = i * 3;
            const xi = pool.pos[bi];
            const yi = pool.pos[bi + 1];
            const zi = pool.pos[bi + 2];
            const ri = pool.radius[i];
            for (let j = i + 1; j < BREACH_MAX_BLOBS; j++) {
              if (pool.active[j] === 0) continue;
              const bj = j * 3;
              const dx = pool.pos[bj] - xi;
              const dy = pool.pos[bj + 1] - yi;
              const dz = pool.pos[bj + 2] - zi;
              const rj = pool.radius[j];
              const minD = k * (ri + rj);
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < minD * minD && d2 > 1e-10) {
                const d = Math.sqrt(d2);
                const s = ((minD - d) / d) * 0.5 * push;
                pool.pos[bi] -= dx * s;
                pool.pos[bi + 1] -= dy * s;
                pool.pos[bi + 2] -= dz * s;
                pool.pos[bj] += dx * s;
                pool.pos[bj + 1] += dy * s;
                pool.pos[bj + 2] += dz * s;
              }
            }
          }
        }
      } else {
        // When disabled, clear active blobs so they don't “freeze” on screen.
        pool.active.fill(0);
      }

      // Pack active blobs into the shader uniform array.
      for (let i = 0; i < BREACH_MAX_BLOBS; i++) {
        if (pool.active[i] === 0) continue;
        if (blobCount >= BREACH_MAX_BLOBS) break;
        const base = i * 3;
        breachUniformBlobs[blobCount].set(pool.pos[base], pool.pos[base + 1], pool.pos[base + 2], pool.radius[i]);
        blobCount++;
      }
      for (let i = blobCount; i < BREACH_MAX_BLOBS; i++) {
        breachUniformBlobs[i].set(0, 0, 0, 0);
      }
      breachMaterial.uniforms.uBlobCount.value = blobCount;
    }

    // -----------------------------------------------------------------------
    // Dripping droplets from the wet sphere (above the surface).
    // Uses the same “wake axis” idea as bubbles to get coherent trailing/vortex motion.
    // -----------------------------------------------------------------------
    {
      const wet = settings.sphere.physics.wetness;
      const mesh = dripMeshRef.current;
      if (mesh && wet && wet.enabled && wet.dripsEnabled && spherePhysicsEnabledRef.current) {
        const pool = dripPoolRef.current;
        const center = sphereCenterRef.current;
        const v = sphereVelocityRef.current;
        const vx = v.x;
        const vz = v.z;
        const speed = Math.sqrt(vx * vx + vz * vz);
        const hasDir = speed > 1e-6;
        const dirX = hasDir ? vx / speed : 1;
        const dirZ = hasDir ? vz / speed : 0;
        const rearX = -dirX;
        const rearZ = -dirZ;
        const perpX = dirZ;
        const perpZ = -dirX;

        const wetAmt = THREE.MathUtils.clamp(sphereWetnessRef.current, 0, 1);
        // IMPORTANT: use geometric waterline fraction here (not heightfield sampling),
        // so fast cursor motion can't “miss” the surface crossing due to sampleHz lag.
        const geoSub = THREE.MathUtils.clamp((sphereRadius - center.y) / (2 * sphereRadius), 0, 1);

        const prevSub = sphereSubmergedPrevRef.current;
        const leaving = THREE.MathUtils.clamp((prevSub - geoSub) / Math.max(1e-6, deltaSeconds), 0, 1);
        sphereSubmergedPrevRef.current = geoSub;

        const minWet = THREE.MathUtils.clamp(wet.dripMinWetness, 0, 1);
        const wet01 = wetAmt <= minWet ? 0 : (wetAmt - minWet) / Math.max(1e-6, 1 - minWet);
        const above01 = THREE.MathUtils.clamp(1 - geoSub, 0, 1);

        const baseRate = Math.max(0, wet.dripRate);
        // Continuous “slow drips” (water film draining) – should not depend on the waterline being sampled this frame.
        const rate = baseRate * wet01 * (0.15 + 0.85 * above01);

        const spawnFloat = rate * deltaSeconds + dripSpawnCarryRef.current;
        const spawnEventsRaw = Math.floor(spawnFloat);
        dripSpawnCarryRef.current = spawnFloat - spawnEventsRaw;

        const dripEvents = Math.min(12, Math.max(0, spawnEventsRaw));
        const rBase = Math.max(0.001, wet.dripRadius);
        const inherit = THREE.MathUtils.clamp(wet.dripInheritVelocity, 0, 1);

        // Waterline radius if intersecting y=0 (only valid if |center.y| < radius).
        const waterlineR2 = sphereRadius * sphereRadius - center.y * center.y;
        const waterlineR = waterlineR2 > 0 ? Math.sqrt(waterlineR2) : 0;

        // -------------------------------------------------------------------
        // Exit-spray burst (event-based): when the sphere crosses OUT of the water quickly,
        // spawn a short burst of faster droplets at the surface. This fixes:
        // - slow/weak spray at low speeds (we gate by exit speed)
        // - “no droplets when moving faster” (we don't rely on fractional carry)
        // -------------------------------------------------------------------
        dripExitCooldownRef.current = Math.max(0, dripExitCooldownRef.current - deltaSeconds);
        const exitSpeed = Math.max(0, v.y);
        const exit01 = THREE.MathUtils.clamp(exitSpeed / 2.0, 0, 1);
        const exitCross = prevSub > 0.08 && geoSub <= 0.08 && leaving > 0.05; // leaving the surface band

        let burstEvents = 0;
        if (dripExitCooldownRef.current <= 0 && exitCross && exitSpeed > 0.25) {
          const burstPow = exit01 * exit01;
          const depth01 = THREE.MathUtils.clamp(prevSub / 0.35, 0, 1);
          const wetScale = 0.35 + 0.65 * wetAmt;
          const leaveScale = 0.35 + 0.65 * leaving;
          burstEvents = Math.min(
            24,
            Math.max(0, Math.floor((3 + 18 * burstPow) * (0.25 + 0.75 * depth01) * wetScale * leaveScale))
          );
          dripExitCooldownRef.current = 0.22;
        }

        for (let e = 0; e < burstEvents; e++) {
          const idx = dripNextIndexRef.current;
          dripNextIndexRef.current = (idx + 1) % DRIP_MAX_PARTICLES;

          pool.active[idx] = 1;
          pool.age[idx] = 0;
          pool.life[idx] = 0.6 + Math.random() * 0.7;
          pool.radius[idx] = rBase * (0.55 + Math.random() * 0.75);

          const base = idx * 3;

          const rimBase = waterlineR > 1e-5 ? waterlineR : sphereRadius * 0.85;
          let px = center.x;
          let pz = center.z;

          if (hasDir) {
            // Bias burst to the rear waterline where the wake separates.
            const rearAngle = Math.atan2(rearZ, rearX);
            const phi = rearAngle + bubbleRandNormal() * 0.85;
            const rim = rimBase * (0.75 + 0.35 * Math.random());
            px = center.x + Math.cos(phi) * rim + rearX * (0.02 + 0.04 * Math.random());
            pz = center.z + Math.sin(phi) * rim + rearZ * (0.02 + 0.04 * Math.random());
          } else {
            // Vertical-ish exit: symmetric ring spray.
            const phi = Math.random() * Math.PI * 2;
            const rim = rimBase * (0.75 + 0.35 * Math.random());
            px = center.x + Math.cos(phi) * rim;
            pz = center.z + Math.sin(phi) * rim;
          }

          // Spawn near the water surface.
          let py = 0.02 + Math.random() * 0.06;

          px = THREE.MathUtils.clamp(px, -0.98, 0.98);
          pz = THREE.MathUtils.clamp(pz, -0.98, 0.98);

          pool.pos[base] = px;
          pool.pos[base + 1] = py;
          pool.pos[base + 2] = pz;

          // Outward direction + rear bias.
          let outX = px - center.x;
          let outZ = pz - center.z;
          {
            const l = Math.sqrt(outX * outX + outZ * outZ);
            if (l > 1e-6) {
              outX /= l;
              outZ /= l;
            } else {
              outX = rearX;
              outZ = rearZ;
            }
          }
          if (hasDir) {
            outX += rearX * 0.85;
            outZ += rearZ * 0.85;
            const l = Math.sqrt(outX * outX + outZ * outZ);
            if (l > 1e-6) {
              outX /= l;
              outZ /= l;
            }
          }

          const burstPow = exit01 * exit01;
          const leaveScale = 0.45 + 0.55 * leaving;
          const outSpd = (0.35 + 2.1 * burstPow) * (0.7 + 0.35 * Math.random()) * leaveScale;
          const upSpd = (0.05 + 3.0 * burstPow) * (0.75 + 0.35 * Math.random()) * leaveScale;

          pool.vel[base] = vx * 0.15 + outX * outSpd + (Math.random() * 2 - 1) * 0.18;
          pool.vel[base + 1] = exitSpeed * 0.25 + upSpd + (Math.random() * 2 - 1) * 0.25;
          pool.vel[base + 2] = vz * 0.15 + outZ * outSpd + (Math.random() * 2 - 1) * 0.18;
        }

        // -------------------------------------------------------------------
        // Continuous slow drips (from sphere surface, above water)
        // -------------------------------------------------------------------
        for (let e = 0; e < dripEvents; e++) {
          const idx = dripNextIndexRef.current;
          dripNextIndexRef.current = (idx + 1) % DRIP_MAX_PARTICLES;

          pool.active[idx] = 1;
          pool.age[idx] = 0;
          pool.life[idx] = 2.4 + Math.random() * 1.2;
          pool.radius[idx] = rBase * (0.75 + Math.random() * 0.55);

          const base = idx * 3;
          // Choose a point on the lower hemisphere that is above the water plane.
          let px = center.x;
          let py = center.y - sphereRadius;
          let pz = center.z;
          let found = false;
          for (let t = 0; t < 4; t++) {
            let dx = Math.random() * 2 - 1;
            let dz = Math.random() * 2 - 1;
            let dy = -Math.abs(Math.random());
            const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (l < 1e-6) continue;
            dx /= l;
            dy /= l;
            dz /= l;
            const x = center.x + dx * sphereRadius;
            const y = center.y + dy * sphereRadius;
            const z = center.z + dz * sphereRadius;
            if (y > 0.02) {
              px = x;
              py = y;
              pz = z;
              found = true;
              break;
            }
          }
          if (!found) {
            px = center.x + (Math.random() * 2 - 1) * sphereRadius * 0.05;
            pz = center.z + (Math.random() * 2 - 1) * sphereRadius * 0.05;
            py = Math.max(0.03, center.y - sphereRadius * 0.65);
          }
          py = Math.max(0.02, py + 0.01);

          // Clamp to pool bounds.
          px = THREE.MathUtils.clamp(px, -0.98, 0.98);
          pz = THREE.MathUtils.clamp(pz, -0.98, 0.98);

          pool.pos[base] = px;
          pool.pos[base + 1] = py;
          pool.pos[base + 2] = pz;

          // Initial velocity: mostly falling (drip), small horizontal inheritance.
          pool.vel[base] = vx * inherit * 0.2 + (Math.random() * 2 - 1) * 0.12 + perpX * (Math.random() * 2 - 1) * 0.08;
          pool.vel[base + 1] = -(0.12 + Math.random() * 0.35);
          pool.vel[base + 2] = vz * inherit * 0.2 + (Math.random() * 2 - 1) * 0.12 + perpZ * (Math.random() * 2 - 1) * 0.08;
        }

        const g = Math.max(0, wet.dripGravity);
        const drag = Math.max(0, wet.dripDrag);
        const dragMul = drag > 0 ? Math.exp(-drag * deltaSeconds) : 1.0;

        // Reuse bubble wake swirl for coherent trailing motion.
        const bubbles = settings.sphere.physics.bubbles;
        const wakeSwirlStrength = Math.max(0, bubbles.wakeSwirlStrength) * 0.65;
        const wakeSwirlRadius = Math.max(1e-3, bubbles.wakeSwirlRadius) * sphereRadius;
        const wakeDecayLength = Math.max(1e-3, bubbles.wakeDecayLength) * sphereRadius;
        const hasWakeAxis = speed > BUBBLE_WAKE_SPEED_EPS;
        const wx = -dirX;
        const wz = -dirZ;

        let anyMovedThisFrame = false;
        for (let i = 0; i < DRIP_MAX_PARTICLES; i++) {
          if (pool.active[i] === 0) continue;
          anyMovedThisFrame = true;

          const ageNext = pool.age[i] + deltaSeconds;
          pool.age[i] = ageNext;
          if (ageNext >= pool.life[i]) {
            pool.active[i] = 0;
            dripTmpObj.position.set(0, 0, 0);
            dripTmpObj.scale.setScalar(0);
            dripTmpObj.updateMatrix();
            mesh.setMatrixAt(i, dripTmpObj.matrix);
            continue;
          }

          const base = i * 3;
          let px = pool.pos[base];
          let py = pool.pos[base + 1];
          let pz = pool.pos[base + 2];

          let vxP = pool.vel[base] * dragMul;
          let vyP = pool.vel[base + 1] * dragMul;
          let vzP = pool.vel[base + 2] * dragMul;

          vyP -= g * deltaSeconds;

          // Wake swirl advection (position-space, matches bubbles).
          if (hasWakeAxis && wakeSwirlStrength > 0) {
            const dx = px - center.x;
            const dy = py - center.y;
            const dz = pz - center.z;
            const s = dx * wx + dz * wz;
            if (s > 0) {
              const rx = dx - wx * s;
              const ry = dy;
              const rz = dz - wz * s;
              const rp2 = rx * rx + ry * ry + rz * rz;

              let tx = -wz * ry;
              let ty = wz * rx - wx * rz;
              let tz = wx * ry;
              const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (tLen > 1e-6) {
                tx /= tLen;
                ty /= tLen;
                tz /= tLen;
              } else {
                tx = 0;
                ty = 0;
                tz = 0;
              }

              const axial = Math.exp(-s / wakeDecayLength);
              const radial = Math.exp(-rp2 / (wakeSwirlRadius * wakeSwirlRadius));
              const amp = wakeSwirlStrength * axial * radial;
              px += tx * amp * deltaSeconds;
              py += ty * amp * deltaSeconds;
              pz += tz * amp * deltaSeconds;
            }
          }

          px += vxP * deltaSeconds;
          py += vyP * deltaSeconds;
          pz += vzP * deltaSeconds;

          pool.vel[base] = vxP;
          pool.vel[base + 1] = vyP;
          pool.vel[base + 2] = vzP;

          // Impact with water surface (y=0 plane for now).
          if (py <= 0.0) {
            const rImp = Math.max(0.001, wet.dripImpulseRadius);
            const sImp = Math.max(0, wet.dripImpulseStrength);
            if (sImp > 0) {
              addDrop(px, pz, rImp, sImp);
              if (wet.dripZeroMeanEnabled) {
                const ringR = rImp * Math.max(1.0, wet.dripZeroMeanRadiusMultiplier);
                const ringS = -sImp * THREE.MathUtils.clamp(wet.dripZeroMeanStrengthMultiplier, 0, 1);
                if (ringS !== 0) addDrop(px, pz, ringR, ringS);
              }
            }
            pool.active[i] = 0;
            dripTmpObj.position.set(0, 0, 0);
            dripTmpObj.scale.setScalar(0);
            dripTmpObj.updateMatrix();
            mesh.setMatrixAt(i, dripTmpObj.matrix);
            continue;
          }

          // Cull.
          if (Math.abs(px) > 1.2 || Math.abs(pz) > 1.2 || py > 1.25 || py < -1.2) {
            pool.active[i] = 0;
            dripTmpObj.position.set(0, 0, 0);
            dripTmpObj.scale.setScalar(0);
            dripTmpObj.updateMatrix();
            mesh.setMatrixAt(i, dripTmpObj.matrix);
            continue;
          }

          pool.pos[base] = px;
          pool.pos[base + 1] = py;
          pool.pos[base + 2] = pz;

          dripTmpObj.position.set(px, py, pz);
          dripTmpObj.scale.setScalar(pool.radius[i]);
          dripTmpObj.updateMatrix();
          mesh.setMatrixAt(i, dripTmpObj.matrix);
        }

        if (anyMovedThisFrame) mesh.instanceMatrix.needsUpdate = true;
      }
    }

    // Update water simulation and normals.
    stepSimulation();
    stepSimulation();
    updateNormals();

    // Update caustics after normals update.
    updateCaustics(
      getTexture(),
      lightDirRef.current,
      sphereCenterRef.current,
      sphereRadius
    );

    // Keep boat shading updated with the current simulation textures.
    boatMaterial.uniforms.water.value = getTexture();
    boatMaterial.uniforms.causticTex.value = causticsTexture;
    boatMaterial.uniforms.light.value.copy(lightDirRef.current);
    boatMaterial.uniforms.uInvScale.value = poolSizeRef.current > 0 ? 2 / poolSizeRef.current : 1;

    const causticsStrengthBaseline = 5.0;
    boatMaterial.uniforms.uIorAir.value = settings.material.iorAir;
    boatMaterial.uniforms.uIorWater.value = settings.material.iorWater;
    boatMaterial.uniforms.uCausticsScale.value = settings.caustics.projectionScale;
    boatMaterial.uniforms.uCausticsStrength.value =
      causticsStrengthBaseline > 0
        ? settings.pool.causticsIntensityMultiplier / causticsStrengthBaseline
        : 1.0;
    boatMaterial.uniforms.uDispersionStrength.value = settings.caustics.dispersionEnabled
      ? settings.caustics.dispersionStrength
      : 0.0;

    // Bubble shading (underwater bubble mesh): caustics + reflections + fresnel rim.
    bubbleMaterial.uniforms.water.value = getTexture();
    bubbleMaterial.uniforms.causticTex.value = causticsTexture;
    bubbleMaterial.uniforms.light.value.copy(lightDirRef.current);
    bubbleMaterial.uniforms.sphereCenter.value.copy(sphereCenterRef.current);
    bubbleMaterial.uniforms.sphereRadius.value = sphereRadius;
    bubbleMaterial.uniforms.uCameraPos.value.copy(camera.position);
    bubbleMaterial.uniforms.sky.value = skyCubemap ?? fallbackSkyCubemap;

    const bubbles = settings.sphere.physics.bubbles;
    bubbleMaterial.uniforms.uOpacity.value = bubbles.renderOpacity;
    bubbleMaterial.uniforms.uReflectStrength.value = Math.max(0, bubbles.renderStrength);
    bubbleMaterial.uniforms.uIorAir.value = settings.material.iorAir;
    bubbleMaterial.uniforms.uIorWater.value = settings.material.iorWater;
    bubbleMaterial.uniforms.uCausticsScale.value = settings.caustics.projectionScale;
    bubbleMaterial.uniforms.uCausticsStrength.value =
      causticsStrengthBaseline > 0
        ? settings.pool.causticsIntensityMultiplier / causticsStrengthBaseline
        : 1.0;
    bubbleMaterial.uniforms.uDispersionStrength.value = settings.caustics.dispersionEnabled
      ? settings.caustics.dispersionStrength
      : 0.0;

    // Drip shading (wet sphere droplets in air).
    dripMaterial.uniforms.light.value.copy(lightDirRef.current);
    dripMaterial.uniforms.uCameraPos.value.copy(camera.position);

    // Breaching metaballs shading (above-surface water blobs).
    breachMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    breachMaterial.uniforms.uLightDir.value.copy(lightDirRef.current);
    breachMaterial.uniforms.uSky.value = skyCubemap ?? fallbackSkyCubemap;
    {
      const camLocal = groupRef.current
        ? groupRef.current.worldToLocal(camera.position.clone())
        : camera.position.clone();
      breachMaterial.uniforms.uCameraLocal.value.copy(camLocal);
    }
    breachMaterial.uniforms.uIso.value = Math.max(0.01, bubbles.breachIso);
    breachMaterial.uniforms.uOpacity.value = THREE.MathUtils.clamp(bubbles.breachOpacity, 0, 1);
  }, -1);

  // Don't render until assets are loaded (must be after ALL hooks)
  const useDynamicSky = backgroundType === 'nebula' || backgroundType === 'volumetric-clouds';
  if (!assetsLoaded || !tileTexture || (!skyCubemap && !useDynamicSky)) {
    return null;
  }

  const invScale = poolSize > 0 ? 2 / poolSize : 1;
  const iorAir = settings.material.iorAir;
  const iorWater = settings.material.iorWater;
  const causticsScale = settings.caustics.projectionScale;
  const causticsStrengthBaseline = 5.0;
  const causticsStrength =
    causticsStrengthBaseline > 0
      ? settings.pool.causticsIntensityMultiplier / causticsStrengthBaseline
      : 1.0;
  const dispersionStrength = settings.caustics.dispersionEnabled ? settings.caustics.dispersionStrength : 0.0;

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={bubbleMeshRef}
        args={[undefined, undefined, BUBBLE_MAX_PARTICLES]}
        frustumCulled={false}
        renderOrder={3}
        material={bubbleMaterial}
      >
        <sphereGeometry args={[1, 8, 8]} />
      </instancedMesh>

      <instancedMesh
        ref={dripMeshRef}
        args={[undefined, undefined, DRIP_MAX_PARTICLES]}
        frustumCulled={false}
        renderOrder={4}
        material={dripMaterial}
      >
        <sphereGeometry args={[1, 6, 6]} />
      </instancedMesh>

      {/* Breaching / spray metaballs (raymarched volume) */}
      <mesh ref={breachMeshRef} frustumCulled={false} renderOrder={2} material={breachMaterial}>
        {/* Must match breachMaterial uBoundsMin/uBoundsMax */}
        <boxGeometry args={[2, 1.2, 2]} />
      </mesh>

      {poolEnabled ? (
        <Pool
          waterTextureGetter={getTexture}
          tileTexture={tileTexture}
          causticsTexture={causticsTexture}
          lightDir={lightDirRef.current}
          sphereCenter={sphereCenterRef.current}
          sphereRadius={sphereRadius}
          iorAir={iorAir}
          iorWater={iorWater}
          causticsScale={causticsScale}
          causticsStrength={causticsStrength}
          dispersionStrength={dispersionStrength}
        />
      ) : (
        <>
          <SandFloor
            waterTextureGetter={getTexture}
            causticsTexture={causticsTexture}
            lightDir={lightDirRef.current}
            iorAir={iorAir}
            iorWater={iorWater}
            causticsScale={causticsScale}
            causticsStrength={causticsStrength}
            dispersionStrength={dispersionStrength}
          />
          <Obstacles
            obstacles={beachObstacles}
            waterTextureGetter={getTexture}
            causticsTexture={causticsTexture}
            lightDir={lightDirRef.current}
            invScale={invScale}
            iorAir={iorAir}
            iorWater={iorWater}
            causticsScale={causticsScale}
            causticsStrength={causticsStrength}
            dispersionStrength={dispersionStrength}
          />
          <mesh
            ref={boatRef}
            geometry={boatGeometry}
            material={boatMaterial}
            position={[0.87, -0.03, 0.0]}
            renderOrder={1}
          />
        </>
      )}

      {useDynamicSky ? (
        <CubeCamera
          resolution={skyCaptureResolution}
          frames={skyCaptureFrames}
          near={skyCaptureNear}
          far={skyCaptureFar}
        >
          {(texture) => (
            <WaterSurface
              waterTextureGetter={getTexture}
              tileTexture={tileTexture}
              causticsTexture={causticsTexture}
              skyCubemap={texture as unknown as THREE.CubeTexture}
              lightDir={lightDirRef.current}
              sphereCenter={sphereCenterRef.current}
              sphereRadius={sphereRadius}
              beachMode={!poolEnabled}
              obstacleTexture={obstacleMask?.texture}
              bubbleFieldTexture={bubbleField.tex}
              bubbleFoamTexture={surfaceFoamField.tex}
              bubbleFieldLayers={bubbleField.layers}
              bubbleStrength={
                settings.sphere.physics.bubbles.enabled && spherePhysicsEnabled
                  ? settings.sphere.physics.bubbles.renderStrength
                  : 0
              }
              bubbleFoamStrength={
                settings.sphere.physics.bubbles.enabled && spherePhysicsEnabled
                  ? settings.sphere.physics.bubbles.surfaceFoamStrength
                  : 0
              }
              bubbleFoamThresholdLow={settings.sphere.physics.bubbles.surfaceFoamThresholdLow}
              bubbleFoamThresholdHigh={settings.sphere.physics.bubbles.surfaceFoamThresholdHigh}
              bubbleFoamDepth={settings.sphere.physics.bubbles.surfaceFoamDepth}
              iorAir={iorAir}
              iorWater={iorWater}
              causticsScale={causticsScale}
              causticsStrength={causticsStrength}
              dispersionStrength={dispersionStrength}
            />
          )}
        </CubeCamera>
      ) : (
        <WaterSurface
          waterTextureGetter={getTexture}
          tileTexture={tileTexture}
          causticsTexture={causticsTexture}
          skyCubemap={skyCubemap!}
          lightDir={lightDirRef.current}
          sphereCenter={sphereCenterRef.current}
          sphereRadius={sphereRadius}
          beachMode={!poolEnabled}
          obstacleTexture={obstacleMask?.texture}
          bubbleFieldTexture={bubbleField.tex}
          bubbleFoamTexture={surfaceFoamField.tex}
          bubbleFieldLayers={bubbleField.layers}
          bubbleStrength={
            settings.sphere.physics.bubbles.enabled && spherePhysicsEnabled
              ? settings.sphere.physics.bubbles.renderStrength
              : 0
          }
          bubbleFoamStrength={
            settings.sphere.physics.bubbles.enabled && spherePhysicsEnabled
              ? settings.sphere.physics.bubbles.surfaceFoamStrength
              : 0
          }
          bubbleFoamThresholdLow={settings.sphere.physics.bubbles.surfaceFoamThresholdLow}
          bubbleFoamThresholdHigh={settings.sphere.physics.bubbles.surfaceFoamThresholdHigh}
          bubbleFoamDepth={settings.sphere.physics.bubbles.surfaceFoamDepth}
          iorAir={iorAir}
          iorWater={iorWater}
          causticsScale={causticsScale}
          causticsStrength={causticsStrength}
          dispersionStrength={dispersionStrength}
        />
      )}

      <Sphere
        waterTextureGetter={getTexture}
        causticsTexture={causticsTexture}
        lightDir={lightDirRef.current}
        sphereCenter={sphereCenterRef.current}
        sphereRadius={sphereRadius}
        iorAir={iorAir}
        iorWater={iorWater}
        causticsScale={causticsScale}
        causticsStrength={causticsStrength}
        dispersionStrength={dispersionStrength}
        wetnessAmountRef={sphereWetnessRef}
        wetnessSettings={settings.sphere.physics.wetness}
      />
    </group>
  );
}

```
---

## === FILE: config/WaveSimulationConfig.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * Wave Simulation Configuration
 * 
 * Comprehensive configuration system for all wave simulation features.
 * Enables dynamic toggling and fine-tuning of all approaches.
 */

export type ShadowMethod = 
  | '2d-surface' 
  | 'volumetric-ray-march' 
  | 'volumetric-projection' 
  | 'volumetric-texture';

export type CollisionMethod = 
  | 'fake-displacement' 
  | 'obstacle-mask' 
  | 'sdf' 
  | 'hybrid';

export type MeshStretchingMethod = 
  | 'vertex-displacement' 
  | 'dynamic-subdivision' 
  | 'tessellation';

export type SimulationMethod = 
  | 'height-field' 
  | 'sph' 
  | 'hybrid';

export interface GodRaysConfig {
  enabled: boolean;
  scatteringPower: number; // 1.0 - 5.0
  falloff: number; // 0.01 - 0.5
}

export interface ShadowConfig {
  enabled: boolean;
  method: ShadowMethod;
  resolution: 256 | 512 | 1024;
  rayMarchSteps: number; // 10 - 50 (only for ray-march method)
  softnessFactor: number; // 0.1 - 2.0
  intensity: number; // 0.0 - 1.0
  godRays: GodRaysConfig;
}

export interface MeshStretchingConfig {
  enabled: boolean;
  method: MeshStretchingMethod;
  blendRadius: number; // 1.0 - 3.0 (multiplier of sphere radius)
  smoothness: number; // 0.1 - 3.0
}

export interface SphereCollisionConfig {
  enabled: boolean;
  method: CollisionMethod;
  updateRate: number; // 1 - 4 (update mask every N frames)
  reflectionStrength: number; // 0.0 - 2.0
  meshStretching: MeshStretchingConfig;
}

export interface VolumetricConfig {
  enabled: boolean;
  resolution: 64 | 128 | 256; // 3D texture resolution
  shadowAbsorption: number; // 0.0 - 1.0
  lightScattering: number; // 0.0 - 1.0
}

export interface SimulationConfig {
  resolution: 128 | 256 | 512 | 1024;
  updateRate: number; // 1 - 4 (frames between updates)
  method: SimulationMethod;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export interface LODConfig {
  enabled: boolean;
  cameraDistanceThresholds: [number, number]; // [medium, high] in world units
  lowQuality: DeepPartial<WaveSimulationConfig>;
  mediumQuality: DeepPartial<WaveSimulationConfig>;
  highQuality: DeepPartial<WaveSimulationConfig>;
}

export interface AdaptiveQualityConfig {
  enabled: boolean;
  targetFPS: number; // 30 | 60 | 120
  minFPS: number; // Minimum acceptable FPS
}

export interface PerformanceConfig {
  lod: LODConfig;
  adaptiveQuality: AdaptiveQualityConfig;
}

export interface WaveSimulationConfig {
  simulation: SimulationConfig;
  shadows: ShadowConfig;
  sphereCollision: SphereCollisionConfig;
  volumetric: VolumetricConfig;
  performance: PerformanceConfig;
}

// Default configuration (matches current GPTWAVES)
export const DEFAULT_CONFIG: WaveSimulationConfig = {
  simulation: {
    resolution: 256,
    updateRate: 1,
    method: 'height-field',
  },
  shadows: {
    enabled: true,
    method: '2d-surface', // Current implementation
    resolution: 256,
    rayMarchSteps: 20,
    softnessFactor: 1.0,
    intensity: 0.5,
    godRays: {
      enabled: false,
      scatteringPower: 2.0,
      falloff: 0.1,
    },
  },
  sphereCollision: {
    enabled: true,
    method: 'fake-displacement', // Current implementation
    updateRate: 1,
    reflectionStrength: 1.0,
    meshStretching: {
      enabled: false,
      method: 'vertex-displacement',
      blendRadius: 1.2,
      smoothness: 1.0,
    },
  },
  volumetric: {
    enabled: false,
    resolution: 128,
    shadowAbsorption: 0.5,
    lightScattering: 0.3,
  },
  performance: {
    lod: {
      enabled: false,
      cameraDistanceThresholds: [5.0, 10.0],
      lowQuality: {
        simulation: { resolution: 128, updateRate: 2 },
        shadows: { enabled: false },
        sphereCollision: { enabled: false },
        volumetric: { enabled: false },
      },
      mediumQuality: {
        simulation: { resolution: 256, updateRate: 1 },
        shadows: { enabled: true, method: '2d-surface' },
        sphereCollision: { enabled: true, method: 'fake-displacement' },
        volumetric: { enabled: false },
      },
      highQuality: {
        simulation: { resolution: 512, updateRate: 1 },
        shadows: { enabled: true, method: 'volumetric-projection' },
        sphereCollision: { enabled: true, method: 'obstacle-mask' },
        volumetric: { enabled: true },
      },
    },
    adaptiveQuality: {
      enabled: false,
      targetFPS: 60,
      minFPS: 30,
    },
  },
};

// Preset configurations for quick testing
export const PRESETS = {
  // Current GPTWAVES (baseline)
  baseline: DEFAULT_CONFIG,
  
  // Volumetric shadows only
  volumetricShadows: {
    ...DEFAULT_CONFIG,
    shadows: {
      ...DEFAULT_CONFIG.shadows,
      method: 'volumetric-projection',
      godRays: { enabled: true, scatteringPower: 2.0, falloff: 0.1 },
    },
  },
  
  // Real collision only
  realCollision: {
    ...DEFAULT_CONFIG,
    sphereCollision: {
      ...DEFAULT_CONFIG.sphereCollision,
      method: 'obstacle-mask',
      meshStretching: {
        enabled: true,
        method: 'vertex-displacement',
        blendRadius: 1.2,
        smoothness: 1.0,
      },
    },
  },
  
  // Everything enabled (high quality)
  highQuality: {
    ...DEFAULT_CONFIG,
    shadows: {
      ...DEFAULT_CONFIG.shadows,
      method: 'volumetric-ray-march',
      godRays: { enabled: true, scatteringPower: 2.5, falloff: 0.15 },
    },
    sphereCollision: {
      ...DEFAULT_CONFIG.sphereCollision,
      method: 'hybrid',
      meshStretching: {
        enabled: true,
        method: 'vertex-displacement',
        blendRadius: 1.5,
        smoothness: 1.5,
      },
    },
    volumetric: {
      enabled: true,
      resolution: 256,
      shadowAbsorption: 0.7,
      lightScattering: 0.5,
    },
    performance: {
      ...DEFAULT_CONFIG.performance,
      lod: { ...DEFAULT_CONFIG.performance.lod, enabled: true },
    },
  },
  
  // Performance mode (low quality, high FPS)
  performance: {
    ...DEFAULT_CONFIG,
    simulation: { resolution: 128, updateRate: 2, method: 'height-field' },
    shadows: { ...DEFAULT_CONFIG.shadows, enabled: false },
    sphereCollision: { ...DEFAULT_CONFIG.sphereCollision, enabled: false },
    volumetric: { enabled: false },
  },
} as const;

export type PresetName = keyof typeof PRESETS;


```
---

## === FILE: hooks/useWaterSimulation.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useCallback, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DROP_FRAGMENT_SHADER,
  DROP_VERTEX_SHADER,
  IMPULSE_FRAGMENT_SHADER,
  IMPULSE_VERTEX_SHADER,
  NORMAL_FRAGMENT_SHADER,
  NORMAL_VERTEX_SHADER,
  SPHERE_FRAGMENT_SHADER,
  SPHERE_VERTEX_SHADER,
  UPDATE_FRAGMENT_SHADER,
  UPDATE_VERTEX_SHADER,
} from '../shaders/simulationShaders';

function canDrawTo(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
  const previousTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.clear(true, true, true);
  const gl = renderer.getContext();
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  renderer.setRenderTarget(previousTarget);
  return status === gl.FRAMEBUFFER_COMPLETE;
}

function selectWaterRenderTargetOptions(renderer: THREE.WebGLRenderer) {
  const candidates: Array<{ type: THREE.TextureDataType; linearExt?: string }> = [
    { type: THREE.FloatType, linearExt: 'OES_texture_float_linear' },
    { type: THREE.HalfFloatType, linearExt: 'OES_texture_half_float_linear' },
  ];

  for (const candidate of candidates) {
    const minMagFilter =
      candidate.linearExt && renderer.extensions.has(candidate.linearExt)
        ? THREE.LinearFilter
        : THREE.NearestFilter;

    const probe = new THREE.WebGLRenderTarget(4, 4, {
      type: candidate.type,
      format: THREE.RGBAFormat,
      minFilter: minMagFilter,
      magFilter: minMagFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    probe.texture.generateMipmaps = false;

    const ok = canDrawTo(renderer, probe);
    probe.dispose();

    if (ok) {
      return { type: candidate.type, filter: minMagFilter };
    }
  }

  throw new Error(
    'GPTwaves: rendering to float/half-float textures is required but not supported in this WebGL context.'
  );
}

export function useWaterSimulation({ resolution = 256 }: { resolution?: number } = {}) {
  const { gl } = useThree();
  const currentRef = useRef<'A' | 'B'>('A');

  const { type, filter } = useMemo(() => selectWaterRenderTargetOptions(gl), [gl]);

  const defaultObstacleTexture = useMemo(() => {
    const data = new Uint8Array([255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const obstacleTextureRef = useRef<THREE.Texture>(defaultObstacleTexture);

  const textureA = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(resolution, resolution, {
      type,
      format: THREE.RGBAFormat,
      minFilter: filter,
      magFilter: filter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    t.texture.generateMipmaps = false;
    return t;
  }, [filter, resolution, type]);

  const textureB = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(resolution, resolution, {
      type,
      format: THREE.RGBAFormat,
      minFilter: filter,
      magFilter: filter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    });
    t.texture.generateMipmaps = false;
    return t;
  }, [filter, resolution, type]);

  const quadGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const quadCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  const dropMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: null as unknown as THREE.Texture },
          uObstacle: { value: defaultObstacleTexture },
          uCenter: { value: new THREE.Vector2() },
          uRadius: { value: 0.03 },
          uStrength: { value: 0.01 },
        },
        vertexShader: DROP_VERTEX_SHADER,
        fragmentShader: DROP_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  const impulseMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: null as unknown as THREE.Texture },
          uObstacle: { value: defaultObstacleTexture },
          uCenter: { value: new THREE.Vector2() },
          uRadius: { value: 0.03 },
          uStrength: { value: 0.01 },
        },
        vertexShader: IMPULSE_VERTEX_SHADER,
        fragmentShader: IMPULSE_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  const updateMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: null as unknown as THREE.Texture },
          uObstacle: { value: defaultObstacleTexture },
          uDelta: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
        },
        vertexShader: UPDATE_VERTEX_SHADER,
        fragmentShader: UPDATE_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    [resolution]
  );

  const normalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: null as unknown as THREE.Texture },
          uObstacle: { value: defaultObstacleTexture },
          uDelta: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
        },
        vertexShader: NORMAL_VERTEX_SHADER,
        fragmentShader: NORMAL_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    [resolution]
  );

  const sphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: null as unknown as THREE.Texture },
          uObstacle: { value: defaultObstacleTexture },
          uOldCenter: { value: new THREE.Vector3() },
          uNewCenter: { value: new THREE.Vector3() },
          uRadius: { value: 0.25 },
          uDisplacementScale: { value: 0.1 },
        },
        vertexShader: SPHERE_VERTEX_SHADER,
        fragmentShader: SPHERE_FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  const dropScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(quadGeometry, dropMaterial));
    return scene;
  }, [dropMaterial, quadGeometry]);

  const impulseScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(quadGeometry, impulseMaterial));
    return scene;
  }, [impulseMaterial, quadGeometry]);

  const updateScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(quadGeometry, updateMaterial));
    return scene;
  }, [quadGeometry, updateMaterial]);

  const normalScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(quadGeometry, normalMaterial));
    return scene;
  }, [normalMaterial, quadGeometry]);

  const sphereScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(quadGeometry, sphereMaterial));
    return scene;
  }, [quadGeometry, sphereMaterial]);

  const getTargets = useCallback(() => {
    const current = currentRef.current === 'A' ? textureA : textureB;
    const next = currentRef.current === 'A' ? textureB : textureA;
    return { current, next };
  }, [textureA, textureB]);

  const swap = useCallback(() => {
    currentRef.current = currentRef.current === 'A' ? 'B' : 'A';
  }, []);

  const renderPass = useCallback(
    (scene: THREE.Scene, material: THREE.ShaderMaterial) => {
      const { current, next } = getTargets();
      const previousTarget = gl.getRenderTarget();

      material.uniforms.uTexture.value = current.texture;
      material.uniforms.uObstacle.value = obstacleTextureRef.current;
      gl.setRenderTarget(next);
      gl.render(scene, quadCamera);
      gl.setRenderTarget(previousTarget);
      swap();
    },
    [getTargets, gl, quadCamera, swap]
  );

  const addDrop = useCallback(
    (x: number, z: number, radius = 0.03, strength = 0.01) => {
      dropMaterial.uniforms.uCenter.value.set(x, z);
      dropMaterial.uniforms.uRadius.value = radius;
      dropMaterial.uniforms.uStrength.value = strength;
      renderPass(dropScene, dropMaterial);
    },
    [dropMaterial, dropScene, renderPass]
  );

  const addImpulse = useCallback(
    (x: number, z: number, radius = 0.03, strength = 0.01) => {
      impulseMaterial.uniforms.uCenter.value.set(x, z);
      impulseMaterial.uniforms.uRadius.value = radius;
      impulseMaterial.uniforms.uStrength.value = strength;
      renderPass(impulseScene, impulseMaterial);
    },
    [impulseMaterial, impulseScene, renderPass]
  );

  const moveSphere = useCallback(
    (oldCenter: THREE.Vector3, newCenter: THREE.Vector3, radius = 0.25, displacementScale = 0.1) => {
      sphereMaterial.uniforms.uOldCenter.value.copy(oldCenter);
      sphereMaterial.uniforms.uNewCenter.value.copy(newCenter);
      sphereMaterial.uniforms.uRadius.value = radius;
      sphereMaterial.uniforms.uDisplacementScale.value = displacementScale;
      renderPass(sphereScene, sphereMaterial);
    },
    [renderPass, sphereMaterial, sphereScene]
  );

  const stepSimulation = useCallback(() => {
    renderPass(updateScene, updateMaterial);
  }, [renderPass, updateMaterial, updateScene]);

  const updateNormals = useCallback(() => {
    renderPass(normalScene, normalMaterial);
  }, [normalMaterial, normalScene, renderPass]);

  const reset = useCallback(() => {
    const previousTarget = gl.getRenderTarget();
    const prevClearColor = gl.getClearColor(new THREE.Color());
    const prevClearAlpha = gl.getClearAlpha();

    const clearTarget = (target: THREE.WebGLRenderTarget) => {
      gl.setRenderTarget(target);
      gl.setClearColor(0x000000, 0);
      gl.clear(true, true, true);
    };

    currentRef.current = 'A';
    clearTarget(textureA);
    clearTarget(textureB);

    gl.setRenderTarget(previousTarget);
    gl.setClearColor(prevClearColor, prevClearAlpha);
  }, [gl, textureA, textureB]);

  const getTexture = useCallback(() => {
    return currentRef.current === 'A' ? textureA.texture : textureB.texture;
  }, [textureA.texture, textureB.texture]);

  const setObstacleTexture = useCallback((texture: THREE.Texture | null | undefined) => {
    obstacleTextureRef.current = texture ?? defaultObstacleTexture;
  }, [defaultObstacleTexture]);

  return {
    addDrop,
    addImpulse,
    moveSphere,
    stepSimulation,
    updateNormals,
    reset,
    getTexture,
    setObstacleTexture,
  };
}

```
---

## === FILE: hooks/useCaustics.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CAUSTICS_FRAGMENT_SHADER,
  CAUSTICS_FRAGMENT_SHADER_FALLBACK,
  CAUSTICS_VERTEX_SHADER,
} from '../shaders/causticsShaders';

function halton(index: number, base: number) {
  let result = 0;
  let f = 1;
  let i = index;
  while (i > 0) {
    f /= base;
    result += f * (i % base);
    i = Math.floor(i / base);
  }
  return result;
}

function jitterConeDirection({
  baseDir,
  angleRad,
  sampleIndex,
  out,
  tmpHelper,
  tmpU,
  tmpV,
}: {
  baseDir: THREE.Vector3;
  angleRad: number;
  sampleIndex: number;
  out: THREE.Vector3;
  tmpHelper: THREE.Vector3;
  tmpU: THREE.Vector3;
  tmpV: THREE.Vector3;
}) {
  const u = halton(sampleIndex, 2);
  const v = halton(sampleIndex, 3);

  const cosThetaMax = Math.cos(angleRad);
  const cosTheta = THREE.MathUtils.lerp(1, cosThetaMax, u);
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  const phi = 2 * Math.PI * v;

  const w = out.copy(baseDir).normalize();
  tmpHelper.set(0, 1, 0);
  if (Math.abs(w.y) >= 0.999) tmpHelper.set(1, 0, 0);
  tmpU.crossVectors(tmpHelper, w).normalize();
  tmpV.crossVectors(w, tmpU);

  out
    .copy(w)
    .multiplyScalar(cosTheta)
    .addScaledVector(tmpU, Math.cos(phi) * sinTheta)
    .addScaledVector(tmpV, Math.sin(phi) * sinTheta)
    .normalize();

  return out;
}

export function useCaustics({
  enabled = true,
  resolution = 1024,
  waterMeshDetail = 200,
  algorithm = 'v2',
  areaChangeMethod = 'cross',
  projectionScale = 0.75,
  baseGain = 0.2,
  intensity = 5.0,
  focusEpsilon = 1e-5,
  maxFocus = 50,
  transmissionEnabled = true,
  fresnelF0 = 0.02,
  absorptionEnabled = true,
  absorptionSigma = 0.15,
  softSunEnabled = true,
  sunAngularRadiusDeg = 0.27,
  softSunSamples = 4,
  temporalAccumulation = true,
  temporalAlpha = 0.08,
  iorAir = 1.0,
  iorWater = 1.333,
  poolHeight = 1.0,
  debug = false,
}: {
  enabled?: boolean;
  resolution?: number;
  waterMeshDetail?: number;
  algorithm?: 'legacy' | 'v2';
  areaChangeMethod?: 'product' | 'cross' | 'none';
  projectionScale?: number;
  baseGain?: number;
  intensity?: number;
  focusEpsilon?: number;
  maxFocus?: number;
  transmissionEnabled?: boolean;
  fresnelF0?: number;
  absorptionEnabled?: boolean;
  absorptionSigma?: number;
  softSunEnabled?: boolean;
  sunAngularRadiusDeg?: number;
  softSunSamples?: number;
  temporalAccumulation?: boolean;
  temporalAlpha?: number;
  dispersionEnabled?: boolean;
  dispersionStrength?: number;
  iorAir?: number;
  iorWater?: number;
  poolHeight?: number;
  debug?: boolean;
} = {}) {
  const { gl } = useThree();
  const needsClearRef = useRef(true);
  const sampleIndexRef = useRef(1);
  const lastAccumulationKeyRef = useRef<string>('');

  const hasDerivatives = useMemo(() => {
    if (gl.capabilities.isWebGL2) return true;
    const ext = gl.getContext().getExtension('OES_standard_derivatives');
    return !!ext;
  }, [gl]);

  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log(
      `[GPTwaves Caustics] OES_standard_derivatives: ${hasDerivatives ? 'AVAILABLE' : 'MISSING'}`
    );
  }, [debug, hasDerivatives]);

  const causticsTarget = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(resolution, resolution, {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    target.texture.generateMipmaps = false;
    return target;
  }, [resolution]);

  const causticsMeshGeometry = useMemo(
    () => new THREE.PlaneGeometry(2, 2, waterMeshDetail, waterMeshDetail),
    [waterMeshDetail]
  );

  const causticsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uWaterTexture: { value: null as unknown as THREE.Texture },
          uLight: { value: new THREE.Vector3(2, 2, -1).normalize() },
          uSphereCenter: { value: new THREE.Vector3() },
          uSphereRadius: { value: 0.25 },
          uIorAir: { value: 1.0 },
          uIorWater: { value: 1.333 },
          uPoolHeight: { value: 1.0 },
          uProjectionScale: { value: 0.75 },
          uBaseGain: { value: 0.2 },
          uIntensity: { value: 1.0 },
          uSampleWeight: { value: 1.0 },
          uOutputAlpha: { value: 1.0 },
          uAreaMode: { value: 1.0 },
          uFocusEpsilon: { value: 1e-5 },
          uMaxFocus: { value: 50.0 },
          uTransmissionEnabled: { value: 1.0 },
          uFresnelF0: { value: 0.02 },
          uAbsorptionEnabled: { value: 1.0 },
          uAbsorptionSigma: { value: 0.15 },
        },
        vertexShader: CAUSTICS_VERTEX_SHADER,
        fragmentShader: hasDerivatives
          ? CAUSTICS_FRAGMENT_SHADER
          : CAUSTICS_FRAGMENT_SHADER_FALLBACK,
        extensions: hasDerivatives ? { derivatives: true } : undefined,
        depthTest: false,
        depthWrite: false,
      }),
    [hasDerivatives]
  );

  const tmpJitteredLight = useMemo(() => new THREE.Vector3(), []);
  const tmpJitterHelper = useMemo(() => new THREE.Vector3(), []);
  const tmpJitterU = useMemo(() => new THREE.Vector3(), []);
  const tmpJitterV = useMemo(() => new THREE.Vector3(), []);

  const causticsScene = useMemo(() => {
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(causticsMeshGeometry, causticsMaterial));
    return scene;
  }, [causticsMeshGeometry, causticsMaterial]);

  const causticsCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );

  const updateCaustics = useCallback(
    (
      waterTexture: THREE.Texture,
      lightDir: THREE.Vector3,
      sphereCenter: THREE.Vector3,
      sphereRadius: number
    ) => {
      const intensityBaseline = 5.0; // Match DEFAULT_SETTINGS baseline so current visuals remain stable.

      const previousTarget = gl.getRenderTarget();
      const prevClearColor = gl.getClearColor(new THREE.Color());
      const prevClearAlpha = gl.getClearAlpha();

      const isV2 = algorithm === 'v2';
      const effectiveAreaMode =
        !isV2 && algorithm === 'legacy'
          ? 0
          : areaChangeMethod === 'product'
            ? 0
            : areaChangeMethod === 'cross'
              ? 1
              : 2;

      const useSoftSun = enabled && isV2 && softSunEnabled && sunAngularRadiusDeg > 0;
      const useTemporal = useSoftSun && temporalAccumulation;
      const useMultiSample = useSoftSun && !useTemporal && softSunSamples > 1;
      const outputAlpha = useTemporal ? THREE.MathUtils.clamp(temporalAlpha, 0, 1) : 1.0;
      const sampleCount = useMultiSample ? Math.max(1, Math.floor(softSunSamples)) : 1;
      const sampleWeight = 1.0 / sampleCount;

      const accumulationKey = JSON.stringify({
        enabled,
        isV2,
        area: effectiveAreaMode,
        projectionScale,
        baseGain,
        intensity,
        focusEpsilon,
        maxFocus,
        transmissionEnabled: isV2 && transmissionEnabled,
        fresnelF0,
        absorptionEnabled: isV2 && absorptionEnabled,
        absorptionSigma,
        useSoftSun,
        useTemporal,
        sunAngularRadiusDeg,
        temporalAlpha: outputAlpha,
        sampleCount,
        iorAir,
        iorWater,
        poolHeight,
      });
      if (useTemporal && lastAccumulationKeyRef.current !== accumulationKey) {
        needsClearRef.current = true;
        lastAccumulationKeyRef.current = accumulationKey;
      }

      const material = causticsMaterial;
      material.transparent = useTemporal || useMultiSample;
      material.blending = useTemporal
        ? THREE.NormalBlending
        : useMultiSample
          ? THREE.AdditiveBlending
          : THREE.NoBlending;

      causticsMaterial.uniforms.uWaterTexture.value = waterTexture;
      causticsMaterial.uniforms.uLight.value.copy(lightDir);
      causticsMaterial.uniforms.uSphereCenter.value.copy(sphereCenter);
      causticsMaterial.uniforms.uSphereRadius.value = sphereRadius;
      causticsMaterial.uniforms.uIorAir.value = iorAir;
      causticsMaterial.uniforms.uIorWater.value = iorWater;
      causticsMaterial.uniforms.uPoolHeight.value = poolHeight;
      causticsMaterial.uniforms.uProjectionScale.value = projectionScale;
      causticsMaterial.uniforms.uBaseGain.value = baseGain;
      causticsMaterial.uniforms.uIntensity.value = intensityBaseline > 0 ? intensity / intensityBaseline : 1.0;
      causticsMaterial.uniforms.uSampleWeight.value = sampleWeight;
      causticsMaterial.uniforms.uOutputAlpha.value = outputAlpha;
      causticsMaterial.uniforms.uAreaMode.value = effectiveAreaMode;
      causticsMaterial.uniforms.uFocusEpsilon.value = focusEpsilon;
      causticsMaterial.uniforms.uMaxFocus.value = maxFocus;
      causticsMaterial.uniforms.uTransmissionEnabled.value = isV2 && transmissionEnabled ? 1.0 : 0.0;
      causticsMaterial.uniforms.uFresnelF0.value = fresnelF0;
      causticsMaterial.uniforms.uAbsorptionEnabled.value = isV2 && absorptionEnabled ? 1.0 : 0.0;
      causticsMaterial.uniforms.uAbsorptionSigma.value = absorptionSigma;

      gl.setRenderTarget(causticsTarget);
      gl.setClearColor(0x000000, 1);

      if (!enabled) {
        gl.clear(true, true, true);
      } else if (useTemporal) {
        if (needsClearRef.current) {
          gl.clear(true, true, true);
          needsClearRef.current = false;
          sampleIndexRef.current = 1;
        }

        const angleRad = THREE.MathUtils.degToRad(sunAngularRadiusDeg);
        jitterConeDirection({
          baseDir: lightDir,
          angleRad,
          sampleIndex: sampleIndexRef.current++,
          out: tmpJitteredLight,
          tmpHelper: tmpJitterHelper,
          tmpU: tmpJitterU,
          tmpV: tmpJitterV,
        });
        causticsMaterial.uniforms.uLight.value.copy(tmpJitteredLight);
        gl.render(causticsScene, causticsCamera);
      } else if (useMultiSample) {
        gl.clear(true, true, true);
        const angleRad = THREE.MathUtils.degToRad(sunAngularRadiusDeg);
        for (let i = 0; i < sampleCount; i++) {
          jitterConeDirection({
            baseDir: lightDir,
            angleRad,
            sampleIndex: sampleIndexRef.current++,
            out: tmpJitteredLight,
            tmpHelper: tmpJitterHelper,
            tmpU: tmpJitterU,
            tmpV: tmpJitterV,
          });
          causticsMaterial.uniforms.uLight.value.copy(tmpJitteredLight);
          gl.render(causticsScene, causticsCamera);
        }
      } else {
        gl.clear(true, true, true);
        gl.render(causticsScene, causticsCamera);
      }
      gl.setRenderTarget(previousTarget);

      gl.setClearColor(prevClearColor, prevClearAlpha);
    },
    [
      absorptionEnabled,
      absorptionSigma,
      algorithm,
      areaChangeMethod,
      baseGain,
      causticsCamera,
      causticsMaterial,
      causticsScene,
      causticsTarget,
      enabled,
      focusEpsilon,
      fresnelF0,
      gl,
      intensity,
      iorAir,
      iorWater,
      maxFocus,
      poolHeight,
      projectionScale,
      softSunEnabled,
      softSunSamples,
      sunAngularRadiusDeg,
      temporalAccumulation,
      temporalAlpha,
      transmissionEnabled,
      tmpJitteredLight,
      tmpJitterHelper,
      tmpJitterU,
      tmpJitterV,
    ]
  );

  return {
    texture: causticsTarget.texture,
    updateCaustics,
  };
}

```
---

## === FILE: assets/useWebglWaterAssets.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createSkyCubemap } from '../../webgl-water/utils/createSkyCubemap';

// Helper function to load images asynchronously
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function useWebglWaterAssets() {
  const { gl } = useThree();
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [tileTexture, setTileTexture] = useState<THREE.Texture | null>(null);
  const [skyCubemap, setSkyCubemap] = useState<THREE.CubeTexture | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      try {
        // Load tile texture (with fallback)
        let tileTex: THREE.Texture | null = null;
        try {
          const tileImg = await loadImage('/webgl-water/tiles.jpg');
          if (cancelled) return;
          
          tileTex = new THREE.Texture(tileImg);
          tileTex.wrapS = THREE.RepeatWrapping;
          tileTex.wrapT = THREE.RepeatWrapping;
          tileTex.minFilter = THREE.LinearMipmapLinearFilter;
          tileTex.magFilter = THREE.LinearFilter;
          tileTex.colorSpace = THREE.SRGBColorSpace;
          tileTex.needsUpdate = true;
        } catch (error) {
          console.warn('Failed to load tile texture, using fallback:', error);
          // Create a simple procedural tile texture as fallback
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#888888';
          ctx.fillRect(0, 0, size, size);
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 2;
          for (let i = 0; i < size; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
          }
          tileTex = new THREE.Texture(canvas);
          tileTex.wrapS = THREE.RepeatWrapping;
          tileTex.wrapT = THREE.RepeatWrapping;
          tileTex.needsUpdate = true;
        }
        
        if (cancelled) return;
        setTileTexture(tileTex);

        // Try to load cubemap images, fallback to procedural if missing
        let cubemap: THREE.CubeTexture | null = null;
        try {
          // Try loading all 6 faces (yneg might be missing)
          const cubemapImages = await Promise.all([
            loadImage('/webgl-water/xpos.jpg'),
            loadImage('/webgl-water/xneg.jpg'),
            loadImage('/webgl-water/ypos.jpg'),
            loadImage('/webgl-water/yneg.jpg').catch(() => null), // yneg might not exist
            loadImage('/webgl-water/zpos.jpg'),
            loadImage('/webgl-water/zneg.jpg'),
          ]);
          
          if (cancelled) return;

          // If all images loaded successfully, use them
          if (cubemapImages.every(img => img !== null)) {
            cubemap = new THREE.CubeTexture(cubemapImages as HTMLImageElement[]);
            cubemap.colorSpace = THREE.SRGBColorSpace;
            cubemap.needsUpdate = true;
          } else {
            throw new Error('Some cubemap images failed to load');
          }
        } catch (error) {
          console.warn('Failed to load cubemap images, using procedural fallback:', error);
          // Use procedural cubemap as fallback
          if (!cancelled && gl) {
            cubemap = createSkyCubemap(gl, 512);
          }
        }
        
        if (cancelled) return;
        setSkyCubemap(cubemap);
        setAssetsLoaded(true);
      } catch (error) {
        console.error('Failed to load assets:', error);
        // Create fallback textures
        if (!cancelled && gl) {
          setSkyCubemap(createSkyCubemap(gl, 512));
        }
        setAssetsLoaded(true); // Still mark as loaded to avoid infinite waiting
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [gl]);

  return { tileTexture, skyCubemap, assetsLoaded };
}

```
---

## === FILE: components/WaterSurface.tsx ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  WATER_FRAGMENT_SHADER_ABOVE,
  WATER_FRAGMENT_SHADER_UNDERWATER,
  WATER_VERTEX_SHADER,
} from '../shaders/rendererShaders';

export function WaterSurface({
  waterTextureGetter,
  tileTexture,
  causticsTexture,
  skyCubemap,
  lightDir,
  sphereCenter,
  sphereRadius,
  beachMode,
  obstacleTexture,
  bubbleFieldTexture,
  bubbleFoamTexture,
  bubbleFieldLayers,
  bubbleStrength,
  bubbleFoamStrength,
  bubbleFoamThresholdLow,
  bubbleFoamThresholdHigh,
  bubbleFoamDepth,
  sandScale = 3.5,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
}: {
  waterTextureGetter: () => THREE.Texture;
  tileTexture: THREE.Texture;
  causticsTexture: THREE.Texture;
  skyCubemap: THREE.CubeTexture;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  sphereRadius: number;
  beachMode: boolean;
  obstacleTexture?: THREE.Texture | null;
  bubbleFieldTexture?: THREE.Texture | null;
  bubbleFoamTexture?: THREE.Texture | null;
  bubbleFieldLayers?: number;
  bubbleStrength?: number;
  bubbleFoamStrength?: number;
  bubbleFoamThresholdLow?: number;
  bubbleFoamThresholdHigh?: number;
  bubbleFoamDepth?: number;
  sandScale?: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
}) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2, 200, 200), []);

  const defaultObstacleTexture = useMemo(() => {
    const data = new Uint8Array([255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const defaultBubbleFieldTexture = useMemo(() => {
    // 1x1 black (no bubbles)
    const data = new Uint8Array([0, 0, 0, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const materialAbove = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          tiles: { value: tileTexture },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          eye: { value: new THREE.Vector3() },
          sky: { value: skyCubemap },
          obstacles: { value: defaultObstacleTexture },
          uBubbleField: { value: defaultBubbleFieldTexture },
          uBubbleFoamTex: { value: defaultBubbleFieldTexture },
          uBubbleLayers: { value: bubbleFieldLayers ?? 1 },
          uBubbleStrength: { value: bubbleStrength ?? 0 },
          uBubbleFoamStrength: { value: bubbleFoamStrength ?? 0.45 },
          uBubbleFoamThresholdLow: { value: bubbleFoamThresholdLow ?? 0.02 },
          uBubbleFoamThresholdHigh: { value: bubbleFoamThresholdHigh ?? 0.2 },
          uBubbleFoamDepth: { value: bubbleFoamDepth ?? 0.02 },
          uIorAir: { value: iorAir },
          uIorWater: { value: iorWater },
          uCausticsScale: { value: causticsScale },
          uCausticsStrength: { value: causticsStrength },
          uDispersionStrength: { value: dispersionStrength },
          uBeachMode: { value: beachMode ? 1.0 : 0.0 },
          uTime: { value: 0.0 },
          uSandScale: { value: sandScale },
        },
        vertexShader: WATER_VERTEX_SHADER,
        fragmentShader: WATER_FRAGMENT_SHADER_ABOVE,
        side: THREE.BackSide,
        depthTest: true,
        depthWrite: true,
      }),
    [
      beachMode,
      causticsScale,
      causticsStrength,
      causticsTexture,
      bubbleFieldLayers,
      bubbleStrength,
      bubbleFoamDepth,
      bubbleFoamStrength,
      bubbleFoamThresholdHigh,
      bubbleFoamThresholdLow,
      defaultObstacleTexture,
      defaultBubbleFieldTexture,
      dispersionStrength,
      iorAir,
      iorWater,
      lightDir,
      sandScale,
      skyCubemap,
      sphereCenter,
      sphereRadius,
      tileTexture,
    ]
  );

  const materialUnderwater = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          tiles: { value: tileTexture },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          eye: { value: new THREE.Vector3() },
          sky: { value: skyCubemap },
          obstacles: { value: defaultObstacleTexture },
          uBubbleField: { value: defaultBubbleFieldTexture },
          uBubbleFoamTex: { value: defaultBubbleFieldTexture },
          uBubbleLayers: { value: bubbleFieldLayers ?? 1 },
          uBubbleStrength: { value: bubbleStrength ?? 0 },
          uBubbleFoamStrength: { value: bubbleFoamStrength ?? 0.45 },
          uBubbleFoamThresholdLow: { value: bubbleFoamThresholdLow ?? 0.02 },
          uBubbleFoamThresholdHigh: { value: bubbleFoamThresholdHigh ?? 0.2 },
          uBubbleFoamDepth: { value: bubbleFoamDepth ?? 0.02 },
          uIorAir: { value: iorAir },
          uIorWater: { value: iorWater },
          uCausticsScale: { value: causticsScale },
          uCausticsStrength: { value: causticsStrength },
          uDispersionStrength: { value: dispersionStrength },
          uBeachMode: { value: beachMode ? 1.0 : 0.0 },
          uTime: { value: 0.0 },
          uSandScale: { value: sandScale },
        },
        vertexShader: WATER_VERTEX_SHADER,
        fragmentShader: WATER_FRAGMENT_SHADER_UNDERWATER,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
      }),
    [
      beachMode,
      causticsScale,
      causticsStrength,
      causticsTexture,
      bubbleFieldLayers,
      bubbleStrength,
      bubbleFoamDepth,
      bubbleFoamStrength,
      bubbleFoamThresholdHigh,
      bubbleFoamThresholdLow,
      defaultObstacleTexture,
      defaultBubbleFieldTexture,
      dispersionStrength,
      iorAir,
      iorWater,
      lightDir,
      sandScale,
      skyCubemap,
      sphereCenter,
      sphereRadius,
      tileTexture,
    ]
  );

  useFrame(({ clock }) => {
    const waterTexture = waterTextureGetter();
    const eye = meshRef.current
      ? meshRef.current.worldToLocal(camera.position.clone())
      : camera.position.clone();
    const t = clock.getElapsedTime();
    const obstacles = obstacleTexture ?? defaultObstacleTexture;
    const bubblesTex = bubbleFieldTexture ?? defaultBubbleFieldTexture;
    const bubblesLayers = bubbleFieldLayers ?? 1;
    const bubblesStrength = bubbleStrength ?? 0;
    const foamTex = bubbleFoamTexture ?? defaultBubbleFieldTexture;
    const foamStrength = bubbleFoamStrength ?? 0.45;
    const foamLow = bubbleFoamThresholdLow ?? 0.02;
    const foamHigh = bubbleFoamThresholdHigh ?? 0.2;
    const foamDepth = bubbleFoamDepth ?? 0.02;

    for (const mat of [materialAbove, materialUnderwater]) {
      mat.uniforms.water.value = waterTexture;
      mat.uniforms.tiles.value = tileTexture;
      mat.uniforms.causticTex.value = causticsTexture;
      mat.uniforms.sky.value = skyCubemap;
      mat.uniforms.obstacles.value = obstacles;
      mat.uniforms.uBubbleField.value = bubblesTex;
      mat.uniforms.uBubbleFoamTex.value = foamTex;
      mat.uniforms.uBubbleLayers.value = bubblesLayers;
      mat.uniforms.uBubbleStrength.value = bubblesStrength;
      mat.uniforms.uBubbleFoamStrength.value = foamStrength;
      mat.uniforms.uBubbleFoamThresholdLow.value = foamLow;
      mat.uniforms.uBubbleFoamThresholdHigh.value = foamHigh;
      mat.uniforms.uBubbleFoamDepth.value = foamDepth;
      mat.uniforms.light.value.copy(lightDir);
      mat.uniforms.sphereCenter.value.copy(sphereCenter);
      mat.uniforms.sphereRadius.value = sphereRadius;
      mat.uniforms.eye.value.copy(eye);
      mat.uniforms.uIorAir.value = iorAir;
      mat.uniforms.uIorWater.value = iorWater;
      mat.uniforms.uCausticsScale.value = causticsScale;
      mat.uniforms.uCausticsStrength.value = causticsStrength;
      mat.uniforms.uDispersionStrength.value = dispersionStrength;
      mat.uniforms.uBeachMode.value = beachMode ? 1.0 : 0.0;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uSandScale.value = sandScale;
    }
  });

  return (
    <group renderOrder={1}>
      <mesh ref={meshRef} geometry={geometry} material={materialAbove} />
      <mesh geometry={geometry} material={materialUnderwater} />
    </group>
  );
}

```
---

## === FILE: components/Pool.tsx ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CUBE_FRAGMENT_SHADER, CUBE_VERTEX_SHADER } from '../shaders/rendererShaders';

export function Pool({
  waterTextureGetter,
  tileTexture,
  causticsTexture,
  lightDir,
  sphereCenter,
  sphereRadius,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
}: {
  waterTextureGetter: () => THREE.Texture;
  tileTexture: THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  sphereRadius: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          tiles: { value: tileTexture },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          uIorAir: { value: iorAir },
          uIorWater: { value: iorWater },
          uCausticsScale: { value: causticsScale },
          uCausticsStrength: { value: causticsStrength },
          uDispersionStrength: { value: dispersionStrength },
          uBeachMode: { value: 0.0 },
          uTime: { value: 0.0 },
          uSandScale: { value: 0.0 },
        },
        vertexShader: CUBE_VERTEX_SHADER,
        fragmentShader: CUBE_FRAGMENT_SHADER,
        side: THREE.FrontSide,
      }),
    [
      causticsScale,
      causticsStrength,
      causticsTexture,
      dispersionStrength,
      iorAir,
      iorWater,
      lightDir,
      sphereCenter,
      sphereRadius,
      tileTexture,
    ]
  );

  useFrame(({ clock }) => {
    material.uniforms.water.value = waterTextureGetter();
    material.uniforms.tiles.value = tileTexture;
    material.uniforms.causticTex.value = causticsTexture;
    material.uniforms.light.value.copy(lightDir);
    material.uniforms.sphereCenter.value.copy(sphereCenter);
    material.uniforms.sphereRadius.value = sphereRadius;
    material.uniforms.uIorAir.value = iorAir;
    material.uniforms.uIorWater.value = iorWater;
    material.uniforms.uCausticsScale.value = causticsScale;
    material.uniforms.uCausticsStrength.value = causticsStrength;
    material.uniforms.uDispersionStrength.value = dispersionStrength;
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  const poolGeometry = useMemo(() => {
    // Match the original LightGL mesh exactly:
    // - Base geometry: GL.Mesh.cube() (6 faces, 4 verts per face, outward winding)
    // - Then: cubeMesh.triangles.splice(4, 2) to remove the -Y face (open top after Y remap)
    const geometry = new THREE.BufferGeometry();

    const pickOctant = (i: number) =>
      new THREE.Vector3((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);

    const faces: Array<[number, number, number, number]> = [
      [0, 4, 2, 6], // -x
      [1, 3, 5, 7], // +x
      // [-y] face intentionally omitted (open top)
      [2, 6, 3, 7], // +y (becomes pool bottom after Y remap)
      [0, 2, 1, 3], // -z
      [4, 5, 6, 7], // +z
    ];

    const positions: number[] = [];
    const indices: number[] = [];

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
      const base = faceIndex * 4;
      const [a, b, c, d] = faces[faceIndex];
      for (const corner of [a, b, c, d]) {
        const p = pickOctant(corner);
        positions.push(p.x, p.y, p.z);
      }
      indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  return <mesh geometry={poolGeometry} material={material} renderOrder={0} />;
}

```
---

## === FILE: components/Sphere.tsx ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPHERE_FRAGMENT_SHADER, SPHERE_VERTEX_SHADER } from '../shaders/rendererShaders';

export function Sphere({
  waterTextureGetter,
  causticsTexture,
  lightDir,
  sphereCenter,
  sphereRadius,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
  wetnessAmountRef,
  wetnessSettings,
}: {
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  sphereCenter: THREE.Vector3;
  sphereRadius: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
  wetnessAmountRef: { current: number };
  wetnessSettings: {
    enabled: boolean;
    gravityBias: number;
    darken: number;
    gloss: number;
    streakScale: number;
    streakStrength: number;
  };
}) {
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          light: { value: lightDir.clone() },
          sphereCenter: { value: sphereCenter.clone() },
          sphereRadius: { value: sphereRadius },
          causticTex: { value: causticsTexture },
          water: { value: null as unknown as THREE.Texture },
          tiles: { value: causticsTexture },
          eye: { value: new THREE.Vector3() },
          uIorAir: { value: iorAir },
          uIorWater: { value: iorWater },
          uCausticsScale: { value: causticsScale },
          uCausticsStrength: { value: causticsStrength },
          uDispersionStrength: { value: dispersionStrength },
          uWetEnabled: { value: 0.0 },
          uWetness: { value: 0.0 },
          uWetGravityBias: { value: 0.0 },
          uWetDarken: { value: 0.0 },
          uWetGloss: { value: 0.0 },
          uWetStreakScale: { value: 1.0 },
          uWetStreakStrength: { value: 0.0 },
        },
        vertexShader: SPHERE_VERTEX_SHADER,
        fragmentShader: SPHERE_FRAGMENT_SHADER,
        side: THREE.FrontSide,
      }),
    [
      causticsScale,
      causticsStrength,
      causticsTexture,
      dispersionStrength,
      iorAir,
      iorWater,
      lightDir,
      sphereCenter,
      sphereRadius,
    ]
  );

  useFrame((state) => {
    material.uniforms.water.value = waterTextureGetter();
    material.uniforms.causticTex.value = causticsTexture;
    material.uniforms.light.value.copy(lightDir);
    material.uniforms.sphereCenter.value.copy(sphereCenter);
    material.uniforms.sphereRadius.value = sphereRadius;
    material.uniforms.eye.value.copy(state.camera.position);
    material.uniforms.uIorAir.value = iorAir;
    material.uniforms.uIorWater.value = iorWater;
    material.uniforms.uCausticsScale.value = causticsScale;
    material.uniforms.uCausticsStrength.value = causticsStrength;
    material.uniforms.uDispersionStrength.value = dispersionStrength;

    material.uniforms.uWetEnabled.value = wetnessSettings.enabled ? 1.0 : 0.0;
    material.uniforms.uWetness.value = THREE.MathUtils.clamp(wetnessAmountRef.current, 0, 1);
    material.uniforms.uWetGravityBias.value = THREE.MathUtils.clamp(wetnessSettings.gravityBias, 0, 1);
    material.uniforms.uWetDarken.value = THREE.MathUtils.clamp(wetnessSettings.darken, 0, 1);
    material.uniforms.uWetGloss.value = THREE.MathUtils.clamp(wetnessSettings.gloss, 0, 1);
    material.uniforms.uWetStreakScale.value = Math.max(0.01, wetnessSettings.streakScale);
    material.uniforms.uWetStreakStrength.value = THREE.MathUtils.clamp(wetnessSettings.streakStrength, 0, 1);
  });

  return <mesh geometry={geometry} material={material} renderOrder={2} />;
}

```
---

## === FILE: components/Obstacles.tsx ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GptwavesObstacle } from '../utils/obstacles';
import { OBSTACLE_FRAGMENT_SHADER, OBSTACLE_VERTEX_SHADER } from '../shaders/obstacleShaders';

function ObstacleMesh({
  obstacle,
  waterTextureGetter,
  causticsTexture,
  lightDir,
  invScale,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
}: {
  obstacle: GptwavesObstacle;
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  invScale: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
}) {
  const geometry = useMemo(() => {
    if (obstacle.kind === 'cylinder') {
      return new THREE.CylinderGeometry(obstacle.radius, obstacle.radius, obstacle.height, 32, 1);
    }
    return new THREE.BoxGeometry(obstacle.size.x, obstacle.height, obstacle.size.z);
  }, [obstacle]);

  const material = useMemo(() => {
    const color = new THREE.Color(obstacle.color ?? '#5a564f');
    return new THREE.ShaderMaterial({
      uniforms: {
        water: { value: null as unknown as THREE.Texture },
        causticTex: { value: causticsTexture },
        light: { value: lightDir.clone() },
        baseColor: { value: color },
        uInvScale: { value: invScale },
        uIorAir: { value: iorAir },
        uIorWater: { value: iorWater },
        uCausticsScale: { value: causticsScale },
        uCausticsStrength: { value: causticsStrength },
        uDispersionStrength: { value: dispersionStrength },
      },
      vertexShader: OBSTACLE_VERTEX_SHADER,
      fragmentShader: OBSTACLE_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
    });
  }, [causticsScale, causticsStrength, causticsTexture, dispersionStrength, invScale, iorAir, iorWater, lightDir, obstacle.color]);

  useFrame(() => {
    material.uniforms.water.value = waterTextureGetter();
    material.uniforms.causticTex.value = causticsTexture;
    material.uniforms.light.value.copy(lightDir);
    material.uniforms.uInvScale.value = invScale;
    material.uniforms.uIorAir.value = iorAir;
    material.uniforms.uIorWater.value = iorWater;
    material.uniforms.uCausticsScale.value = causticsScale;
    material.uniforms.uCausticsStrength.value = causticsStrength;
    material.uniforms.uDispersionStrength.value = dispersionStrength;
  });

  const yBase = obstacle.yBase ?? -1;
  const position = useMemo(() => {
    if (obstacle.kind === 'cylinder') {
      return new THREE.Vector3(obstacle.center.x, yBase + obstacle.height * 0.5, obstacle.center.z);
    }
    return new THREE.Vector3(obstacle.center.x, yBase + obstacle.height * 0.5, obstacle.center.z);
  }, [obstacle, yBase]);

  return <mesh geometry={geometry} material={material} position={position} renderOrder={0} />;
}

export function Obstacles({
  obstacles,
  waterTextureGetter,
  causticsTexture,
  lightDir,
  invScale,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
}: {
  obstacles: readonly GptwavesObstacle[];
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  invScale: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
}) {
  if (obstacles.length === 0) return null;

  return (
    <group>
      {obstacles.map((o, index) => (
        <ObstacleMesh
          key={`${o.kind}-${index}`}
          obstacle={o}
          waterTextureGetter={waterTextureGetter}
          causticsTexture={causticsTexture}
          lightDir={lightDir}
          invScale={invScale}
          iorAir={iorAir}
          iorWater={iorWater}
          causticsScale={causticsScale}
          causticsStrength={causticsStrength}
          dispersionStrength={dispersionStrength}
        />
      ))}
    </group>
  );
}

```
---

## === FILE: components/SandFloor.tsx ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SAND_FRAGMENT_SHADER, SAND_VERTEX_SHADER } from '../shaders/sandShaders';

export function SandFloor({
  waterTextureGetter,
  causticsTexture,
  lightDir,
  size = 20,
  sandScale = 3.5,
  y = -1,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
}: {
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  size?: number;
  sandScale?: number;
  y?: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
}) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(size, size, 1, 1), [size]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uWater: { value: null as unknown as THREE.Texture },
          uCausticTex: { value: causticsTexture },
          uLight: { value: lightDir.clone() },
          uTime: { value: 0 },
          uSandScale: { value: sandScale },
          uIorAir: { value: iorAir },
          uIorWater: { value: iorWater },
          uCausticsScale: { value: causticsScale },
          uCausticsStrength: { value: causticsStrength },
          uDispersionStrength: { value: dispersionStrength },
        },
        vertexShader: SAND_VERTEX_SHADER,
        fragmentShader: SAND_FRAGMENT_SHADER,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
      }),
    [causticsScale, causticsStrength, causticsTexture, dispersionStrength, iorAir, iorWater, lightDir, sandScale]
  );

  useFrame(({ clock }) => {
    material.uniforms.uWater.value = waterTextureGetter();
    material.uniforms.uCausticTex.value = causticsTexture;
    material.uniforms.uLight.value.copy(lightDir);
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uSandScale.value = sandScale;
    material.uniforms.uIorAir.value = iorAir;
    material.uniforms.uIorWater.value = iorWater;
    material.uniforms.uCausticsScale.value = causticsScale;
    material.uniforms.uCausticsStrength.value = causticsStrength;
    material.uniforms.uDispersionStrength.value = dispersionStrength;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      renderOrder={0}
    />
  );
}

```
---

## === FILE: components/SandFloor3D.tsx ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SAND_FRAGMENT_SHADER_3D, SAND_VERTEX_SHADER_3D } from '../shaders/sandShaders3D';

/**
 * 3D Sand Floor Component
 * 
 * Creates actual 3D geometry displacement using FBM noise.
 * Vertices are displaced up/down based on noise values, creating
 * real 3D ripples and waves in the sand.
 * 
 * Key differences from 2D version:
 * - Higher geometry resolution (needed for smooth displacement)
 * - Displacement strength parameter
 * - Ridge strength parameter
 * - Proper 3D normals for lighting
 */
export function SandFloor3D({
  waterTextureGetter,
  causticsTexture,
  lightDir,
  size = 20,
  sandScale = 3.5,
  y = -1,
  iorAir,
  iorWater,
  causticsScale,
  causticsStrength,
  dispersionStrength,
  displacementStrength = 0.05, // How much to displace (in world units)
  ridgeStrength = 0.02, // Additional ridge displacement
  resolution = 100, // Higher resolution for smooth displacement
}: {
  waterTextureGetter: () => THREE.Texture;
  causticsTexture: THREE.Texture;
  lightDir: THREE.Vector3;
  size?: number;
  sandScale?: number;
  y?: number;
  iorAir: number;
  iorWater: number;
  causticsScale: number;
  causticsStrength: number;
  dispersionStrength: number;
  displacementStrength?: number;
  ridgeStrength?: number;
  resolution?: number;
}) {
  // Higher resolution geometry for smooth 3D displacement
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(size, size, resolution, resolution),
    [size, resolution]
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uWater: { value: null as unknown as THREE.Texture },
          uCausticTex: { value: causticsTexture },
          uLight: { value: lightDir.clone() },
          uTime: { value: 0 },
          uSandScale: { value: sandScale },
          uDisplacementStrength: { value: displacementStrength },
          uRidgeStrength: { value: ridgeStrength },
          uIorAir: { value: iorAir },
          uIorWater: { value: iorWater },
          uCausticsScale: { value: causticsScale },
          uCausticsStrength: { value: causticsStrength },
          uDispersionStrength: { value: dispersionStrength },
        },
        vertexShader: SAND_VERTEX_SHADER_3D,
        fragmentShader: SAND_FRAGMENT_SHADER_3D,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
      }),
    [
      causticsScale,
      causticsStrength,
      causticsTexture,
      dispersionStrength,
      displacementStrength,
      iorAir,
      iorWater,
      lightDir,
      ridgeStrength,
      sandScale,
    ]
  );

  useFrame(({ clock }) => {
    material.uniforms.uWater.value = waterTextureGetter();
    material.uniforms.uCausticTex.value = causticsTexture;
    material.uniforms.uLight.value.copy(lightDir);
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uSandScale.value = sandScale;
    material.uniforms.uDisplacementStrength.value = displacementStrength;
    material.uniforms.uRidgeStrength.value = ridgeStrength;
    material.uniforms.uIorAir.value = iorAir;
    material.uniforms.uIorWater.value = iorWater;
    material.uniforms.uCausticsScale.value = causticsScale;
    material.uniforms.uCausticsStrength.value = causticsStrength;
    material.uniforms.uDispersionStrength.value = dispersionStrength;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      renderOrder={0}
    />
  );
}

```
---

## === FILE: utils/obstacles.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import * as THREE from 'three';

export type GptwavesObstacle =
  | {
      kind: 'cylinder';
      center: { x: number; z: number };
      radius: number; // simulation space (-1..1)
      height: number; // simulation space Y units
      yBase?: number; // default -1
      color?: string;
    }
  | {
      kind: 'wall';
      center: { x: number; z: number };
      size: { x: number; z: number }; // footprint in simulation space (-1..1)
      height: number; // simulation space Y units
      yBase?: number; // default -1
      color?: string;
    };

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function createReefLineObstacles({
  seed,
  xStart,
  xEnd,
  z,
  count,
  radiusMin,
  radiusMax,
  heightMin,
  heightMax,
  jitterX,
  jitterZ,
  yBase = -1.0,
  color = '#4f4a45',
}: {
  seed: number;
  xStart: number;
  xEnd: number;
  z: number;
  count: number;
  radiusMin: number;
  radiusMax: number;
  heightMin: number;
  heightMax: number;
  jitterX: number;
  jitterZ: number;
  yBase?: number;
  color?: string;
}): GptwavesObstacle[] {
  const rng = makeRng(seed);
  const rocks: GptwavesObstacle[] = [];

  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const x = lerp(xStart, xEnd, t) + (rng() * 2 - 1) * jitterX;
    const zz = z + (rng() * 2 - 1) * jitterZ;
    const radius = lerp(radiusMin, radiusMax, rng());
    const height = lerp(heightMin, heightMax, rng());
    rocks.push({
      kind: 'cylinder',
      center: { x, z: zz },
      radius,
      height,
      yBase,
      color,
    });
  }

  return rocks;
}

function createRingObstacles({
  seed,
  center,
  ringRadius,
  count,
  radiusMin,
  radiusMax,
  heightMin,
  heightMax,
  yBase = -1.0,
  color = '#6b5f52',
}: {
  seed: number;
  center: { x: number; z: number };
  ringRadius: number;
  count: number;
  radiusMin: number;
  radiusMax: number;
  heightMin: number;
  heightMax: number;
  yBase?: number;
  color?: string;
}): GptwavesObstacle[] {
  const rng = makeRng(seed);
  const pillars: GptwavesObstacle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * ringRadius;
    const z = center.z + Math.sin(angle) * ringRadius;
    const radius = lerp(radiusMin, radiusMax, rng());
    const height = lerp(heightMin, heightMax, rng());
    pillars.push({
      kind: 'cylinder',
      center: { x, z },
      radius,
      height,
      yBase,
      color,
    });
  }

  return pillars;
}

function createBreakwaterObstacles({
  seed,
  center,
  size,
  height,
  rockCount,
  rockRadiusMin,
  rockRadiusMax,
  rockHeightMin,
  rockHeightMax,
  yBase = -1.0,
  wallColor = '#5a564f',
  rockColor = '#4f4a45',
}: {
  seed: number;
  center: { x: number; z: number };
  size: { x: number; z: number };
  height: number;
  rockCount: number;
  rockRadiusMin: number;
  rockRadiusMax: number;
  rockHeightMin: number;
  rockHeightMax: number;
  yBase?: number;
  wallColor?: string;
  rockColor?: string;
}): GptwavesObstacle[] {
  const rng = makeRng(seed);

  const obstacles: GptwavesObstacle[] = [
    {
      kind: 'wall',
      center,
      size,
      height,
      yBase,
      color: wallColor,
    },
  ];

  for (let i = 0; i < rockCount; i++) {
    const t = rockCount <= 1 ? 0.5 : i / (rockCount - 1);
    const x = center.x + lerp(-size.x * 0.5, size.x * 0.5, t) + (rng() * 2 - 1) * 0.04;
    const z = center.z + (rng() * 2 - 1) * (size.z * 0.6);
    const radius = lerp(rockRadiusMin, rockRadiusMax, rng());
    const rockHeight = lerp(rockHeightMin, rockHeightMax, rng());
    obstacles.push({
      kind: 'cylinder',
      center: { x, z },
      radius,
      height: rockHeight,
      yBase,
      color: rockColor,
    });
  }

  return obstacles;
}

const DEFAULT_BREAKWATER_OBSTACLES = createBreakwaterObstacles({
  seed: 1337,
  center: { x: 0.0, z: 0.68 },
  size: { x: 1.55, z: 0.14 },
  height: 1.2,
  rockCount: 9,
  rockRadiusMin: 0.05,
  rockRadiusMax: 0.12,
  rockHeightMin: 1.05,
  rockHeightMax: 1.35,
  wallColor: '#5a564f',
  rockColor: '#4f4a45',
});

const DEFAULT_REEF_LINE_OBSTACLES = createReefLineObstacles({
  seed: 2025,
  xStart: -0.92,
  xEnd: 0.92,
  z: -0.62,
  count: 14,
  radiusMin: 0.05,
  radiusMax: 0.11,
  heightMin: 1.0,
  heightMax: 1.35,
  jitterX: 0.05,
  jitterZ: 0.06,
  color: '#3f4745',
});

const DEFAULT_RING_OBSTACLES = createRingObstacles({
  seed: 9001,
  center: { x: -0.15, z: 0.18 },
  ringRadius: 0.48,
  count: 18,
  radiusMin: 0.055,
  radiusMax: 0.085,
  heightMin: 1.05,
  heightMax: 1.35,
  color: '#6b5f52',
});

export const DEFAULT_BEACH_OBSTACLES: GptwavesObstacle[] = [
  ...DEFAULT_REEF_LINE_OBSTACLES,
  ...DEFAULT_BREAKWATER_OBSTACLES,
  ...DEFAULT_RING_OBSTACLES,
];

export function createObstacleMaskData({
  obstacles,
  resolution,
  padding = 0.0,
}: {
  obstacles: readonly GptwavesObstacle[];
  resolution: number;
  padding?: number;
}): Uint8Array<ArrayBuffer> {
  const data: Uint8Array<ArrayBuffer> = new Uint8Array(resolution * resolution * 4);
  data.fill(255);

  const isSolidAt = (x: number, z: number) => {
    for (const obstacle of obstacles) {
      if (obstacle.kind === 'cylinder') {
        const dx = x - obstacle.center.x;
        const dz = z - obstacle.center.z;
        const r = obstacle.radius + padding;
        if (dx * dx + dz * dz <= r * r) return true;
      } else {
        const hx = obstacle.size.x * 0.5 + padding;
        const hz = obstacle.size.z * 0.5 + padding;
        if (Math.abs(x - obstacle.center.x) <= hx && Math.abs(z - obstacle.center.z) <= hz) {
          return true;
        }
      }
    }
    return false;
  };

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const u = (x + 0.5) / resolution;
      const v = (y + 0.5) / resolution;
      const sx = u * 2 - 1;
      const sz = v * 2 - 1;

      if (!isSolidAt(sx, sz)) continue;
      const i = (y * resolution + x) * 4;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }

  return data;
}

export function createObstacleMaskTextureFromData({
  data,
  resolution,
}: {
  data: Uint8Array<ArrayBuffer>;
  resolution: number;
}): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, resolution, resolution, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function stampCapsuleObstacleMaskData({
  data,
  resolution,
  center,
  length,
  radius,
  rotation = 0.0,
  padding = 0.0,
}: {
  data: Uint8Array<ArrayBuffer>;
  resolution: number;
  center: { x: number; z: number };
  length: number; // total capsule length (including end caps)
  radius: number; // capsule radius
  rotation?: number; // radians, 0 points along +X
  padding?: number;
}) {
  const r = Math.max(0, radius + padding);
  if (r <= 0 || length <= 0) return;

  const halfLength = Math.max(0, length * 0.5 - r);
  const ext = halfLength + r;

  const minX = center.x - ext;
  const maxX = center.x + ext;
  const minZ = center.z - ext;
  const maxZ = center.z + ext;

  const x0 = Math.max(0, Math.floor(((minX + 1) * 0.5) * resolution));
  const x1 = Math.min(resolution - 1, Math.ceil(((maxX + 1) * 0.5) * resolution));
  const y0 = Math.max(0, Math.floor(((minZ + 1) * 0.5) * resolution));
  const y1 = Math.min(resolution - 1, Math.ceil(((maxZ + 1) * 0.5) * resolution));

  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const invRes = 1 / resolution;
  const rr = r * r;

  for (let y = y0; y <= y1; y++) {
    const sz = ((y + 0.5) * invRes) * 2 - 1;
    for (let x = x0; x <= x1; x++) {
      const sx = ((x + 0.5) * invRes) * 2 - 1;
      const dx = sx - center.x;
      const dz = sz - center.z;

      const localX = dx * cosR + dz * sinR;
      const localZ = -dx * sinR + dz * cosR;

      const clampedX = Math.max(-halfLength, Math.min(halfLength, localX));
      const ddx = localX - clampedX;
      if (ddx * ddx + localZ * localZ > rr) continue;

      const i = (y * resolution + x) * 4;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
}

export function createObstacleMaskTexture({
  obstacles,
  resolution,
  padding = 0.0,
}: {
  obstacles: readonly GptwavesObstacle[];
  resolution: number;
  padding?: number;
}): THREE.DataTexture {
  const data = createObstacleMaskData({ obstacles, resolution, padding });
  return createObstacleMaskTextureFromData({ data, resolution });
}

```
---

## === FILE: utils/rayMath.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
import * as THREE from 'three';

export function hitTestSphere(
  origin: THREE.Vector3,
  ray: THREE.Vector3,
  center: THREE.Vector3,
  radius: number
): { t: number; hit: THREE.Vector3 } | null {
  const offset = origin.clone().sub(center);
  const a = ray.dot(ray);
  const b = 2 * ray.dot(offset);
  const c = offset.dot(offset) - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant > 0) {
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    const hit = origin.clone().add(ray.clone().multiplyScalar(t));
    return { t, hit };
  }

  return null;
}


```
---

## === FILE: shaders/simulationShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * Ported from Documentation/appexamples/webgl-water/water.js.
 * Texture data layout: (height, velocity, normal.x, normal.z)
 */

export const DROP_VERTEX_SHADER = /* glsl */ `
varying vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
`;

export const DROP_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

const float PI = 3.141592653589793;

uniform sampler2D uTexture;
uniform sampler2D uObstacle;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uStrength;

varying vec2 vCoord;

void main() {
  vec4 info = texture2D(uTexture, vCoord);
  float mask = texture2D(uObstacle, vCoord).r;

  // Solid obstacle cells stay at rest (zero height/velocity/normal).
  if (mask < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float drop = max(0.0, 1.0 - length(uCenter * 0.5 + 0.5 - vCoord) / uRadius);
  drop = 0.5 - cos(drop * PI) * 0.5;
  info.r += drop * uStrength;

  gl_FragColor = info;
}
`;

// V5: Velocity impulse injection (writes to info.g instead of info.r).
// This is useful for wakes and impacts because it injects momentum, not height.
export const IMPULSE_VERTEX_SHADER = /* glsl */ `
varying vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
`;

export const IMPULSE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

const float PI = 3.141592653589793;

uniform sampler2D uTexture;
uniform sampler2D uObstacle;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uStrength;

varying vec2 vCoord;

void main() {
  vec4 info = texture2D(uTexture, vCoord);
  float mask = texture2D(uObstacle, vCoord).r;

  // Solid obstacle cells stay at rest (zero height/velocity/normal).
  if (mask < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float drop = max(0.0, 1.0 - length(uCenter * 0.5 + 0.5 - vCoord) / uRadius);
  drop = 0.5 - cos(drop * PI) * 0.5;
  // Inject into velocity channel.
  info.g += drop * uStrength;

  gl_FragColor = info;
}
`;

export const UPDATE_VERTEX_SHADER = /* glsl */ `
varying vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
`;

export const UPDATE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uObstacle;
uniform vec2 uDelta;

varying vec2 vCoord;

void main() {
  vec4 info = texture2D(uTexture, vCoord);
  float mask = texture2D(uObstacle, vCoord).r;

  // Solid obstacle cells stay at rest.
  if (mask < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 dx = vec2(uDelta.x, 0.0);
  vec2 dy = vec2(0.0, uDelta.y);

  // Reflective boundary at obstacles:
  // If a neighbor is solid, mirror the current height instead of sampling inside the solid.
  float hL = texture2D(uTexture, vCoord - dx).r;
  float hD = texture2D(uTexture, vCoord - dy).r;
  float hR = texture2D(uTexture, vCoord + dx).r;
  float hU = texture2D(uTexture, vCoord + dy).r;

  float mL = texture2D(uObstacle, vCoord - dx).r;
  float mD = texture2D(uObstacle, vCoord - dy).r;
  float mR = texture2D(uObstacle, vCoord + dx).r;
  float mU = texture2D(uObstacle, vCoord + dy).r;

  hL = mix(info.r, hL, step(0.5, mL));
  hD = mix(info.r, hD, step(0.5, mD));
  hR = mix(info.r, hR, step(0.5, mR));
  hU = mix(info.r, hU, step(0.5, mU));

  float average = (hL + hD + hR + hU) * 0.25;

  info.g += (average - info.r) * 2.0;
  info.g *= 0.995;
  info.r += info.g;
  // V5: Remove DC drift (uniform offsets are otherwise neutrally stable in this solver).
  // This gently pulls the surface back toward y=0 over time without killing waves instantly.
  info.r *= 0.9995;

  gl_FragColor = info;
}
`;

export const NORMAL_VERTEX_SHADER = /* glsl */ `
varying vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
`;

export const NORMAL_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uObstacle;
uniform vec2 uDelta;

varying vec2 vCoord;

void main() {
  vec4 info = texture2D(uTexture, vCoord);
  float mask = texture2D(uObstacle, vCoord).r;

  if (mask < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float hX = texture2D(uTexture, vec2(vCoord.x + uDelta.x, vCoord.y)).r;
  float hY = texture2D(uTexture, vec2(vCoord.x, vCoord.y + uDelta.y)).r;
  float mX = texture2D(uObstacle, vec2(vCoord.x + uDelta.x, vCoord.y)).r;
  float mY = texture2D(uObstacle, vec2(vCoord.x, vCoord.y + uDelta.y)).r;

  hX = mix(info.r, hX, step(0.5, mX));
  hY = mix(info.r, hY, step(0.5, mY));

  vec3 dx = vec3(uDelta.x, hX - info.r, 0.0);
  vec3 dy = vec3(0.0, hY - info.r, uDelta.y);
  info.ba = normalize(cross(dy, dx)).xz;

  gl_FragColor = info;
}
`;

export const SPHERE_VERTEX_SHADER = /* glsl */ `
varying vec2 vCoord;

void main() {
  vCoord = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xyz, 1.0);
}
`;

export const SPHERE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uObstacle;
uniform vec3 uOldCenter;
uniform vec3 uNewCenter;
uniform float uRadius;
uniform float uDisplacementScale;

varying vec2 vCoord;

float volumeInSphere(vec3 center) {
  // V5: Use a more physically grounded sphere cross-section instead of an exponential “blob”.
  // This makes the coupling depend on actual radius and depth (better size/shape response).
  vec3 p = vec3(vCoord.x * 2.0 - 1.0, 0.0, vCoord.y * 2.0 - 1.0);
  vec2 dXZ = p.xz - center.xz;
  float d = length(dXZ);

  // Soft edge to reduce aliasing.
  // NOTE: If this edge is too sharp, sphere motion creates an unrealistically “slashy” wave.
  // We scale with radius so larger spheres smear displacement over more texels.
  float edge = max(0.02, uRadius * 0.18);
  float inside = 1.0 - smoothstep(uRadius - edge, uRadius + edge, d);
  if (inside <= 0.0) return 0.0;
  inside *= inside; // soften further (reduces sharp rims / unrealistic high-frequency energy)

  float r2 = max(0.0, uRadius * uRadius - d * d);
  float halfChord = sqrt(r2);
  float yBottom = center.y - halfChord;
  float yTop = center.y + halfChord;

  // Only count the portion of the sphere that is below the water surface (y=0).
  float ymin = min(0.0, yBottom);
  float ymax = min(0.0, yTop);
  float submergedHeight = max(0.0, ymax - ymin);

  // Empirical scale: keep motion-generated “slash” waves believable without killing interaction.
  return submergedHeight * inside * (uDisplacementScale * 0.65);
}

void main() {
  vec4 info = texture2D(uTexture, vCoord);
  float mask = texture2D(uObstacle, vCoord).r;

  if (mask < 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  info.r += volumeInSphere(uOldCenter);
  info.r -= volumeInSphere(uNewCenter);
  gl_FragColor = info;
}
`;

```
---

## === FILE: shaders/causticsShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * Ported from Documentation/appexamples/webgl-water/renderer.js (caustics shader).
 */

export const CAUSTICS_VERTEX_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uWaterTexture;
uniform vec3 uLight;
uniform float uIorAir;
uniform float uIorWater;
uniform float uPoolHeight;
uniform float uProjectionScale;

varying vec3 vOldPos;
varying vec3 vNewPos;
varying vec3 vRay;
varying vec3 vSurfaceNormal;
varying float vPathLength;

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  vec3 tMin = (cubeMin - origin) / ray;
  vec3 tMax = (cubeMax - origin) / ray;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  return vec2(tNear, tFar);
}

vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
  vec2 tcube = intersectCube(origin, ray, vec3(-1.0, -uPoolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  origin += ray * tcube.y;
  float tplane = (-origin.y - uPoolHeight) / refractedLight.y;
  return origin + refractedLight * tplane;
}

void main() {
  vec4 info = texture2D(uWaterTexture, position.xy * 0.5 + 0.5);
  vec2 slope = info.ba * 0.5;
  float ny = sqrt(max(1.0 - dot(slope, slope), 0.0));
  vec3 normal = normalize(vec3(slope.x, ny, slope.y));

  vec3 lightDir = normalize(uLight);
  float eta = uIorAir / uIorWater;
  vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), eta);
  vRay = refract(-lightDir, normal, eta);
  vSurfaceNormal = normal;

  vOldPos = project(position.xzy, refractedLight, refractedLight);
  vNewPos = project(position.xzy + vec3(0.0, info.r, 0.0), vRay, refractedLight);

  vec3 surfacePoint = position.xzy + vec3(0.0, info.r, 0.0);
  vec2 t = intersectCube(surfacePoint, vRay, vec3(-1.0, -uPoolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  vPathLength = max(t.y, 0.0) * max(length(vRay), 1e-5);

  gl_Position = vec4(uProjectionScale * (vNewPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
}
`;

export const CAUSTICS_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 uLight;
uniform vec3 uSphereCenter;
uniform float uSphereRadius;
uniform float uIorAir;
uniform float uIorWater;
uniform float uPoolHeight;
uniform float uBaseGain;
uniform float uIntensity;
uniform float uSampleWeight;
uniform float uOutputAlpha;
uniform float uAreaMode; // 0=product(legacy), 1=cross(v2), 2=none(flat)
uniform float uFocusEpsilon;
uniform float uMaxFocus;
uniform float uTransmissionEnabled;
uniform float uFresnelF0;
uniform float uAbsorptionEnabled;
uniform float uAbsorptionSigma;

varying vec3 vOldPos;
varying vec3 vNewPos;
varying vec3 vRay;
varying vec3 vSurfaceNormal;
varying float vPathLength;

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  vec3 tMin = (cubeMin - origin) / ray;
  vec3 tMax = (cubeMax - origin) / ray;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  return vec2(tNear, tFar);
}

float fresnelSchlick(float cosTheta, float F0) {
  float m = clamp(1.0 - cosTheta, 0.0, 1.0);
  float m2 = m * m;
  float m5 = m2 * m2 * m;
  return F0 + (1.0 - F0) * m5;
}

void main() {
  float focus = 1.0;
  if (uAreaMode < 1.5) {
    vec3 oldDx = dFdx(vOldPos);
    vec3 oldDy = dFdy(vOldPos);
    vec3 newDx = dFdx(vNewPos);
    vec3 newDy = dFdy(vNewPos);

    float oldArea = uAreaMode < 0.5 ? length(oldDx) * length(oldDy) : length(cross(oldDx, oldDy));
    float newArea = uAreaMode < 0.5 ? length(newDx) * length(newDy) : length(cross(newDx, newDy));
    newArea = max(newArea, uFocusEpsilon);

    focus = clamp(oldArea / newArea, 0.0, uMaxFocus);
  }

  float intensity = focus * uBaseGain * uIntensity * uSampleWeight;

  if (uTransmissionEnabled > 0.5) {
    vec3 n = normalize(vSurfaceNormal);
    vec3 lightDir = normalize(uLight);
    float cosI = clamp(dot(n, lightDir), 0.0, 1.0);
    float F = fresnelSchlick(cosI, uFresnelF0);
    intensity *= (1.0 - F);
  }

  if (uAbsorptionEnabled > 0.5) {
    intensity *= exp(-uAbsorptionSigma * max(vPathLength, 0.0));
  }

  gl_FragColor = vec4(intensity, 1.0, 0.0, uOutputAlpha);

  vec3 lightDir = normalize(uLight);
  vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);

  vec3 dir = (uSphereCenter - vNewPos) / uSphereRadius;
  vec3 area = cross(dir, refractedLight);
  float shadow = dot(area, area);
  float dist = dot(dir, -refractedLight);
  shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
  shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
  shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
  gl_FragColor.g = shadow * uSampleWeight;

  vec2 t = intersectCube(vNewPos, -refractedLight, vec3(-1.0, -uPoolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (vNewPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
}
`;

export const CAUSTICS_FRAGMENT_SHADER_FALLBACK = /* glsl */ `
precision highp float;

uniform vec3 uLight;
uniform vec3 uSphereCenter;
uniform float uSphereRadius;
uniform float uIorAir;
uniform float uIorWater;
uniform float uPoolHeight;
uniform float uBaseGain;
uniform float uIntensity;
uniform float uSampleWeight;
uniform float uOutputAlpha;

varying vec3 vOldPos;
varying vec3 vNewPos;
varying vec3 vRay;
varying vec3 vSurfaceNormal;
varying float vPathLength;

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  vec3 tMin = (cubeMin - origin) / ray;
  vec3 tMax = (cubeMax - origin) / ray;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  return vec2(tNear, tFar);
}

void main() {
  float intensity = uBaseGain * uIntensity * uSampleWeight;
  gl_FragColor = vec4(intensity, 1.0, 0.0, uOutputAlpha);

  vec3 lightDir = normalize(uLight);
  vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);

  vec3 dir = (uSphereCenter - vNewPos) / uSphereRadius;
  vec3 area = cross(dir, refractedLight);
  float shadow = dot(area, area);
  float dist = dot(dir, -refractedLight);
  shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
  shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
  shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
  gl_FragColor.g = shadow * uSampleWeight;

  vec2 t = intersectCube(vNewPos, -refractedLight, vec3(-1.0, -uPoolHeight, -1.0), vec3(1.0, 2.0, 1.0));
  gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (vNewPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
}
`;

```
---

## === FILE: shaders/rendererShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * Ported from Documentation/appexamples/webgl-water/renderer.js (water/cube/sphere shaders).
 *
 * Notes:
 * - GLSL1 syntax (texture2D/textureCube) is used to match the original.
 * - Varying names are prefixed to avoid clashing with Three.js attributes.
 */

export const RENDERER_HELPER_FUNCTIONS = /* glsl */ `
const vec3 abovewaterColor = vec3(0.25, 1.0, 1.25);
const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
const float poolHeight = 1.0;

uniform vec3 light;
uniform vec3 sphereCenter;
uniform float sphereRadius;
uniform sampler2D tiles;
uniform sampler2D causticTex;
uniform sampler2D water;
uniform float uIorAir;
uniform float uIorWater;
uniform float uCausticsScale;
uniform float uCausticsStrength;
uniform float uDispersionStrength;
uniform float uBeachMode;
uniform float uTime;
uniform float uSandScale;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 sandAlbedo(vec3 point) {
  vec2 uv = point.xz * uSandScale;
  vec2 drift = vec2(uTime * 0.02, uTime * 0.015);
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  uv += info.ba * 6.0;

  float n = fbm(uv * 0.35 + drift);
  float ridge = 1.0 - abs(sin(dot(uv, vec2(0.85, 0.52)) * 2.6 + n * 2.0));
  ridge = smoothstep(0.15, 0.95, ridge);

  vec3 sandLight = vec3(0.78, 0.71, 0.52);
  vec3 sandDark = vec3(0.52, 0.45, 0.30);
  vec3 c = mix(sandDark, sandLight, n);
  c *= 0.85 + 0.22 * ridge;
  return c;
}

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
  vec3 tMin = (cubeMin - origin) / ray;
  vec3 tMax = (cubeMax - origin) / ray;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  return vec2(tNear, tFar);
}

float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
  vec3 toSphere = origin - sphereCenter;
  float a = dot(ray, ray);
  float b = 2.0 * dot(toSphere, ray);
  float c = dot(toSphere, toSphere) - sphereRadius * sphereRadius;
  float discriminant = b * b - 4.0 * a * c;
  if (discriminant > 0.0) {
    float t = (-b - sqrt(discriminant)) / (2.0 * a);
    if (t > 0.0) return t;
  }
  return 1.0e6;
}

vec3 getSphereColor(vec3 point) {
  vec3 color = vec3(0.5);

  /* ambient occlusion with walls */
  color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
  color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
  color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);

  /* caustics */
  vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  float diffuseBase = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  if (point.y < info.r) {
    vec2 causticUv = uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    float c = texture2D(causticTex, causticUv).r;
    vec3 causticRgb = vec3(c);
    if (uDispersionStrength > 0.0) {
      vec2 delta = uDispersionStrength * normalize(refractedLight.xz);
      causticRgb.r = texture2D(causticTex, causticUv + delta).r;
      causticRgb.g = c;
      causticRgb.b = texture2D(causticTex, causticUv - delta).r;
    }
    color += diffuseBase * causticRgb * (4.0 * uCausticsStrength);
  } else {
    color += diffuseBase;
  }

  return color;
}

vec3 getWallColor(vec3 point) {
  float scale = 0.5;

  vec3 wallColor;
  vec3 normal;
  bool isWall = false;
  if (abs(point.x) > 0.999) {
    wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
    normal = vec3(-point.x, 0.0, 0.0);
    isWall = true;
  } else if (abs(point.z) > 0.999) {
    wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
    normal = vec3(0.0, 0.0, -point.z);
    isWall = true;
  } else {
    wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
    normal = vec3(0.0, 1.0, 0.0);
  }

  // Beach mode: replace pool tiles with procedural sand on the floor.
  if (uBeachMode > 0.5 && !isWall) {
    wallColor = sandAlbedo(point);
  }

  scale /= length(point); /* pool ambient occlusion */
  scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0); /* sphere ambient occlusion */

  /* caustics */
  vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  float diffuse = max(0.0, dot(refractedLight, normal));
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  if (point.y < info.r) {
    vec4 caustic = texture2D(causticTex, uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
    scale += diffuse * caustic.r * (2.0 * uCausticsStrength) * caustic.g;
  } else {
    if (uBeachMode > 0.5) {
      return wallColor * scale;
    }
    /* shadow for the rim of the pool */
    vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
    scale += diffuse * 0.5;
  }

  return wallColor * scale;
}
`;

export const WATER_VERTEX_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D water;
varying vec3 vPosition;

void main() {
  vec4 info = texture2D(water, position.xy * 0.5 + 0.5);
  vec3 pos = position.xzy;
  pos.y += info.r;
  vPosition = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const WATER_FRAGMENT_HEADER = /* glsl */ `
precision highp float;
${RENDERER_HELPER_FUNCTIONS}

uniform vec3 eye;
uniform samplerCube sky;
uniform sampler2D obstacles;
uniform sampler2D uBubbleField;
uniform sampler2D uBubbleFoamTex;
uniform float uBubbleLayers;
uniform float uBubbleStrength;
uniform float uBubbleFoamStrength;
uniform float uBubbleFoamThresholdLow;
uniform float uBubbleFoamThresholdHigh;
uniform float uBubbleFoamDepth;
varying vec3 vPosition;

float sampleBubbleDensity(vec3 p) {
  // Map world to [0,1] in pool-local simulation space.
  vec2 uv = clamp(p.xz * 0.5 + 0.5, 0.0, 1.0);
  // Depth normalized (0 at surface, 1 at bottom). poolHeight is defined in helper functions.
  float yN = clamp((-p.y) / poolHeight, 0.0, 1.0);
  float layers = max(1.0, uBubbleLayers);
  float layerF = yN * (layers - 1.0);
  float l0 = floor(layerF);
  float t = layerF - l0;
  float l1 = min(l0 + 1.0, layers - 1.0);

  // Layers are packed vertically: each layer occupies 1/layers of V.
  float v0 = (l0 + uv.y) / layers;
  float v1 = (l1 + uv.y) / layers;
  float d0 = texture2D(uBubbleField, vec2(uv.x, v0)).r;
  float d1 = texture2D(uBubbleField, vec2(uv.x, v1)).r;
  return mix(d0, d1, t);
}

float sphereShadowWater(vec3 p, vec3 dirToLight) {
  // Hard-ish shadow from the main sphere occluder, in pool-local space.
  // Returns 1.0 = fully lit, smaller values = shadowed.
  vec3 oc = p - sphereCenter;
  float b = dot(oc, dirToLight);
  float c = dot(oc, oc) - sphereRadius * sphereRadius;
  float h = b * b - c;
  if (h < 0.0) return 1.0;
  float t = -b - sqrt(h);
  return (t > 0.01) ? 0.25 : 1.0;
}

vec3 applyBubbleScattering(vec3 origin, vec3 ray, float tHit, vec3 color, vec3 waterColor) {
  // Very cheap volumetric integral along the refracted segment.
  // This is intentionally low-step for performance (bubbles are a “glitter” cue).
  float steps = 6.0;
  float dt = tHit / steps;
  float accum = 0.0;
  vec3 causticAccum = vec3(0.0);
  float glintAccum = 0.0;

  // Direction of sunlight *inside the water* (used for caustics + bubble glints).
  vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  float invLightY = 1.0 / max(0.05, abs(refractedLight.y));
  float viewToLight = pow(max(0.0, dot(normalize(-ray), normalize(refractedLight))), 40.0);
  for (int i = 0; i < 6; i++) {
    float t = (float(i) + 0.5) * dt;
    vec3 p = origin + ray * t;
    float d = sampleBubbleDensity(p);
    float shadow = sphereShadowWater(p, normalize(refractedLight));
    float illum = 0.25 + 0.75 * shadow;
    accum += d * illum;

    // Caustic sparkle inside bubbly regions (bubbles act like tiny lenses).
    vec4 info = texture2D(water, p.xz * 0.5 + 0.5);
    if (p.y < info.r) {
      vec2 causticUv = uCausticsScale * (p.xz - p.y * refractedLight.xz * invLightY) * 0.5 + 0.5;
      float c = texture2D(causticTex, causticUv).r;
      vec3 causticRgb = vec3(c);
      if (uDispersionStrength > 0.0) {
        vec2 delta = (uDispersionStrength * 0.5) * normalize(refractedLight.xz);
        causticRgb.r = texture2D(causticTex, causticUv + delta).r;
        causticRgb.g = c;
        causticRgb.b = texture2D(causticTex, causticUv - delta).r;
      }
      causticAccum += d * causticRgb * shadow;
    }

    // Reflection-like glints (sun highlights) — cheap stochastic sparkle.
    float n = hash12(p.xz * 37.0 + float(i) * 17.0);
    float sparkMask = smoothstep(0.86, 1.0, n);
    glintAccum += d * viewToLight * sparkMask * shadow;
  }
  accum *= dt;
  causticAccum *= dt;
  glintAccum *= dt;

  // Bubble extinction: bubbly water attenuates what you see behind it (including caustics/shadows).
  // This is the missing “bubbles affect caustics + underwater shadows” piece.
  float extinction = (uBubbleStrength * 1.3) * accum;
  color *= exp(-extinction);

  vec3 bubbleRgb = vec3(0.80, 0.92, 1.0);
  // Base bubbly scattering (milky/blue lift).
  color += bubbleRgb * waterColor * (uBubbleStrength * 2.2) * accum;

  // Caustic energy concentrated by bubbles.
  color += causticAccum * (uBubbleStrength * 5.0) * uCausticsStrength;

  // Warm sun glints on bubbles (reads as “reflections”).
  color += vec3(1.0, 0.95, 0.85) * (uBubbleStrength * 8.0) * glintAccum;
  return color;
}

vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
  vec3 color;
  float tHit = 0.0;
  vec3 hitPoint = origin;
  float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
  if (q < 1.0e6) {
    tHit = q;
    hitPoint = origin + ray * q;
    color = getSphereColor(hitPoint);
  } else if (ray.y < 0.0) {
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    tHit = t.y;
    vec3 hit = origin + ray * t.y;
    hitPoint = hit;
    if (uBeachMode > 0.5 && (abs(hit.x) > 0.999 || abs(hit.z) > 0.999)) {
      color = textureCube(sky, ray).rgb;
      color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
    } else {
      color = getWallColor(hit);
    }
  } else {
    vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    tHit = t.y;
    vec3 hit = origin + ray * t.y;
    hitPoint = hit;
    if (hit.y < 2.0 / 12.0 && uBeachMode < 0.5) {
      color = getWallColor(hit);
    } else {
      color = textureCube(sky, ray).rgb;
      color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
    }
  }
  if (ray.y < 0.0) {
    color *= waterColor;
    // Foam also attenuates caustics/light behind it (acts like a bright, scattering cap).
    float foam = texture2D(uBubbleFoamTex, hitPoint.xz * 0.5 + 0.5).r;
    float foamExt = foam * (0.4 + 1.2 * max(0.0, uBubbleFoamStrength));
    color *= exp(-foamExt);
    // Bubble scattering for refracted rays through water.
    color = applyBubbleScattering(origin, ray, tHit, color, waterColor);
  }
  return color;
}
`;

export const WATER_FRAGMENT_SHADER_ABOVE = /* glsl */ `
${WATER_FRAGMENT_HEADER}

void main() {
  vec2 coord = vPosition.xz * 0.5 + 0.5;
  vec2 baseCoord = coord;
  if (texture2D(obstacles, baseCoord).r < 0.5) discard;
  vec4 info = texture2D(water, coord);

  /* make water look more "peaked" */
  for (int i = 0; i < 5; i++) {
    coord += info.ba * 0.005;
    info = texture2D(water, coord);
  }

  vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
  vec3 incomingRay = normalize(vPosition - eye);

  vec3 reflectedRay = reflect(incomingRay, normal);
  vec3 refractedRay = refract(incomingRay, normal, uIorAir / uIorWater);
  float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

  vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, abovewaterColor);
  vec3 refractedColor = getSurfaceRayColor(vPosition, refractedRay, abovewaterColor);

  vec3 color = mix(refractedColor, reflectedColor, fresnel);

  // V6: Surface micro-foam / brightening from near-surface bubble density.
  // This makes the entrainment region read more “alive” when bubbles are close to the surface.
  vec2 foamUv = clamp(vPosition.xz * 0.5 + 0.5, 0.0, 1.0);
  // Tiny blur in uv-space (world 0.02 ~= uv 0.01) to reduce aliasing.
  float f0 = texture2D(uBubbleFoamTex, foamUv).r;
  float f1 = texture2D(uBubbleFoamTex, clamp(foamUv + vec2(0.01, 0.0), 0.0, 1.0)).r;
  float f2 = texture2D(uBubbleFoamTex, clamp(foamUv + vec2(0.0, 0.01), 0.0, 1.0)).r;
  float foamRaw = ((f0 + f1 + f2) / 3.0) * uBubbleStrength;
  float foam = smoothstep(uBubbleFoamThresholdLow, uBubbleFoamThresholdHigh, foamRaw);
  float foamNoise = 0.85 + 0.15 * fbm(vPosition.xz * 45.0 + vec2(uTime * 0.25, uTime * 0.18));
  foam *= foamNoise;
  vec3 foamRgb = vec3(0.92, 0.97, 1.0);
  color = mix(color, foamRgb, foam * uBubbleFoamStrength);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const WATER_FRAGMENT_SHADER_UNDERWATER = /* glsl */ `
${WATER_FRAGMENT_HEADER}

void main() {
  vec2 coord = vPosition.xz * 0.5 + 0.5;
  vec2 baseCoord = coord;
  if (texture2D(obstacles, baseCoord).r < 0.5) discard;
  vec4 info = texture2D(water, coord);

  /* make water look more "peaked" */
  for (int i = 0; i < 5; i++) {
    coord += info.ba * 0.005;
    info = texture2D(water, coord);
  }

  vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
  vec3 incomingRay = normalize(vPosition - eye);

  normal = -normal;
  vec3 reflectedRay = reflect(incomingRay, normal);
  vec3 refractedRay = refract(incomingRay, normal, uIorWater / uIorAir);
  float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));

  vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, underwaterColor);
  vec3 refractedColor = getSurfaceRayColor(vPosition, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);

  vec3 color = mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay));

  // V6: Underwater view also picks up slight foam brightening near the surface.
  vec2 foamUv = clamp(vPosition.xz * 0.5 + 0.5, 0.0, 1.0);
  float f0 = texture2D(uBubbleFoamTex, foamUv).r;
  float f1 = texture2D(uBubbleFoamTex, clamp(foamUv + vec2(0.01, 0.0), 0.0, 1.0)).r;
  float f2 = texture2D(uBubbleFoamTex, clamp(foamUv + vec2(0.0, 0.01), 0.0, 1.0)).r;
  float foamRaw = ((f0 + f1 + f2) / 3.0) * uBubbleStrength;
  float foam = smoothstep(uBubbleFoamThresholdLow, uBubbleFoamThresholdHigh, foamRaw);
  float foamNoise = 0.85 + 0.15 * fbm(vPosition.xz * 45.0 + vec2(uTime * 0.25, uTime * 0.18));
  foam *= foamNoise;
  vec3 foamRgb = vec3(0.92, 0.97, 1.0);
  color = mix(color, foamRgb, foam * uBubbleFoamStrength * 0.55);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const CUBE_VERTEX_SHADER = /* glsl */ `
precision highp float;

varying vec3 vPosition;
const float poolHeight = 1.0;

void main() {
  vPosition = position.xyz;
  vPosition.y = ((1.0 - vPosition.y) * (7.0 / 12.0) - 1.0) * poolHeight;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}
`;

export const CUBE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
${RENDERER_HELPER_FUNCTIONS}

varying vec3 vPosition;

void main() {
  gl_FragColor = vec4(getWallColor(vPosition), 1.0);
  vec4 info = texture2D(water, vPosition.xz * 0.5 + 0.5);
  if (vPosition.y < info.r) {
    gl_FragColor.rgb *= underwaterColor * 1.2;
  }
}
`;

export const SPHERE_VERTEX_SHADER = /* glsl */ `
precision highp float;

uniform vec3 sphereCenter;
uniform float sphereRadius;

varying vec3 vPosition;

void main() {
  vPosition = sphereCenter + position.xyz * sphereRadius;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
}
`;

export const SPHERE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
${RENDERER_HELPER_FUNCTIONS}

varying vec3 vPosition;

uniform vec3 eye;

uniform float uWetEnabled;
uniform float uWetness;
uniform float uWetGravityBias;
uniform float uWetDarken;
uniform float uWetGloss;
uniform float uWetStreakScale;
uniform float uWetStreakStrength;

float sphereWetMask(vec3 point, vec3 nrm) {
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  float underwater = step(point.y, info.r); // 1 if point is below water surface

  float wetBase = mix(clamp(uWetness, 0.0, 1.0), 1.0, underwater);

  // Gravity bias: make wetness persist near the bottom of the sphere.
  float down = clamp(0.5 + 0.5 * dot(nrm, vec3(0.0, -1.0, 0.0)), 0.0, 1.0);
  float grav = mix(1.0, down, clamp(uWetGravityBias, 0.0, 1.0));

  // Streaking: cheap modulation that reads like uneven runoff.
  float scale = max(0.01, uWetStreakScale);
  float n = fbm((nrm.xz + vec2(0.0, nrm.y)) * scale);
  float streak = mix(1.0, mix(0.65, 1.35, n), clamp(uWetStreakStrength, 0.0, 1.0));

  return clamp(uWetEnabled * wetBase * grav * streak, 0.0, 1.0);
}

vec3 getSphereColorWet(vec3 point) {
  vec3 color = vec3(0.5);

  // Ambient occlusion with walls (same as original).
  color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
  color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
  color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);

  vec3 sphereNormal = normalize((point - sphereCenter) / sphereRadius);

  // Caustics (ported from original getSphereColor).
  vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  float diffuseBase = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
  vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
  if (point.y < info.r) {
    vec2 causticUv = uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    float c = texture2D(causticTex, causticUv).r;
    vec3 causticRgb = vec3(c);
    if (uDispersionStrength > 0.0) {
      vec2 delta = uDispersionStrength * normalize(refractedLight.xz);
      causticRgb.r = texture2D(causticTex, causticUv + delta).r;
      causticRgb.g = c;
      causticRgb.b = texture2D(causticTex, causticUv - delta).r;
    }
    color += diffuseBase * causticRgb * (4.0 * uCausticsStrength);
  } else {
    color += diffuseBase;
  }

  // Wetness shading: darker + glossier in wet regions.
  vec3 V = normalize(eye - point);
  float wet = sphereWetMask(point, sphereNormal);
  color *= 1.0 - clamp(uWetDarken, 0.0, 1.0) * wet;

  // Fresnel/spec highlight boosts read as a wet glossy film.
  float fres = pow(1.0 - max(0.0, dot(sphereNormal, V)), 4.0);
  vec3 R = reflect(-V, sphereNormal);
  float sunSpec = pow(max(0.0, dot(normalize(light), R)), 250.0);
  float gloss = clamp(uWetGloss, 0.0, 1.0);
  color += vec3(1.0, 0.98, 0.92) * (sunSpec * (0.35 + 1.85 * gloss * wet));
  color += vec3(0.65, 0.78, 0.95) * (fres * (0.08 + 0.45 * gloss * wet));

  return color;
}

void main() {
  gl_FragColor = vec4(getSphereColorWet(vPosition), 1.0);
  vec4 info = texture2D(water, vPosition.xz * 0.5 + 0.5);
  if (vPosition.y < info.r) {
    gl_FragColor.rgb *= underwaterColor * 1.2;
  }
}
`;

```
---

## === FILE: shaders/bubbleShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
export const BUBBLE_VERTEX_SHADER = /* glsl */ `
precision highp float;

varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  // NOTE: ShaderMaterial already injects built-in attributes/uniforms like:
  // position, normal, modelMatrix, viewMatrix, projectionMatrix.
  // Redeclaring them breaks compilation, so we intentionally do NOT declare them here.
#ifdef USE_INSTANCING
  vec4 localPos = instanceMatrix * vec4(position, 1.0);
  mat4 mWorld = modelMatrix * instanceMatrix;
#else
  vec4 localPos = vec4(position, 1.0);
  mat4 mWorld = modelMatrix;
#endif

  vLocalPos = localPos.xyz; // pool-local simulation space (matches water/caustics textures)
  vec4 worldPos = modelMatrix * localPos;
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(mWorld) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const BUBBLE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 light;
uniform samplerCube sky;
uniform sampler2D water;
uniform sampler2D causticTex;
uniform vec3 sphereCenter;
uniform float sphereRadius;

uniform vec3 uCameraPos;
uniform float uOpacity;
uniform float uReflectStrength;
uniform float uFresnelPower;

uniform float uIorAir;
uniform float uIorWater;
uniform float uCausticsScale;
uniform float uCausticsStrength;
uniform float uDispersionStrength;

varying vec3 vLocalPos;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

float sphereShadow(vec3 p, vec3 dirToLight) {
  // Simple hard shadow from the sphere occluder (pool-local space).
  vec3 oc = p - sphereCenter;
  float b = dot(oc, dirToLight);
  float c = dot(oc, oc) - sphereRadius * sphereRadius;
  float h = b * b - c;
  if (h < 0.0) return 1.0;
  float t = -b - sqrt(h);
  // If the intersection is in front of the point, we're in shadow.
  return (t > 0.01) ? 0.25 : 1.0;
}

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos); // towards camera

  float ndv = max(0.0, dot(N, V));
  float fresnel = pow(1.0 - ndv, uFresnelPower);
  float strength = max(0.0, uReflectStrength);

  // Environment reflection (reads as bubble “reflection”).
  vec3 R = reflect(-V, N);
  vec3 refl = textureCube(sky, R).rgb;

  // Refraction through the bubble (water -> air). This gives the “lens” look and helps match
  // the water-surface bubble illumination feel.
  vec3 T = refract(-V, N, uIorWater / max(0.001, uIorAir));
  vec3 refr = textureCube(sky, T).rgb;

  // Sun direction INSIDE water, pointing TOWARD the sun (same convention as getWallColor).
  vec3 lightTowardSun = -refract(-light, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  float invLightY = 1.0 / max(0.05, abs(lightTowardSun.y));

  // Diffuse shading gives real “shadowed side” on bubbles.
  float diffuse = max(0.0, dot(N, normalize(lightTowardSun)));
  float shadow = sphereShadow(vLocalPos, normalize(lightTowardSun));
  diffuse *= shadow;

  // Caustics on bubble surface (bright patterns in bubbly regions), sampled in pool-local space.
  vec4 info = texture2D(water, vLocalPos.xz * 0.5 + 0.5);
  vec3 causticRgb = vec3(0.0);
  if (vLocalPos.y < info.r) {
    vec2 causticUv = uCausticsScale * (vLocalPos.xz - vLocalPos.y * lightTowardSun.xz * invLightY) * 0.5 + 0.5;
    float c = texture2D(causticTex, causticUv).r;
    causticRgb = vec3(c);
    if (uDispersionStrength > 0.0) {
      vec2 delta = (uDispersionStrength * 0.5) * normalize(lightTowardSun.xz);
      causticRgb.r = texture2D(causticTex, causticUv + delta).r;
      causticRgb.g = c;
      causticRgb.b = texture2D(causticTex, causticUv - delta).r;
    }
    causticRgb *= shadow;
  }

  // A tight sun-like highlight (cheap specular).
  float sunSpec = pow(max(0.0, dot(normalize(light), R)), 250.0) * fresnel * shadow;

  // Base bubble color (bluish glass) with directional shading.
  vec3 bubbleBase = vec3(0.10, 0.18, 0.22) * (0.25 + 0.75 * diffuse);
  vec3 color =
    bubbleBase +
    causticRgb * (4.5 * uCausticsStrength) * (0.35 + 0.65 * strength) +
    refl * ((0.35 + 0.95 * strength) * fresnel) +
    refr * ((0.12 + 0.35 * strength) * (1.0 - fresnel)) +
    vec3(1.0, 0.95, 0.85) * (sunSpec * (3.0 + 6.0 * strength));

  float alpha = uOpacity * (0.10 + 0.90 * fresnel);
  gl_FragColor = vec4(color, alpha);
}
`;


```
---

## === FILE: shaders/obstacleShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * Simple obstacle shading with caustics (for GPTwaves beach obstacles).
 *
 * Notes:
 * - Samples `water`/`causticTex` in *simulation space* (-1..1 in XZ), so we convert world-space
 *   positions back to simulation space using `uInvScale` (inverse of the group scale).
 */

export const OBSTACLE_VERTEX_SHADER = /* glsl */ `
precision highp float;

uniform float uInvScale;

varying vec3 vPoint;
varying vec3 vNormal;

void main() {
  vec3 worldPos = (modelMatrix * vec4(position.xyz, 1.0)).xyz;
  vPoint = worldPos * uInvScale;

  // Normals are in world space after normalMatrix.
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}
`;

export const OBSTACLE_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);

uniform sampler2D water;
uniform sampler2D causticTex;
uniform vec3 light;
uniform vec3 baseColor;
uniform float uIorAir;
uniform float uIorWater;
uniform float uCausticsScale;
uniform float uCausticsStrength;
uniform float uDispersionStrength;

varying vec3 vPoint;
varying vec3 vNormal;

void main() {
  vec3 point = vPoint;
  vec2 coord = point.xz * 0.5 + 0.5;
  vec4 info = texture2D(water, coord);

  vec3 n = normalize(vNormal);
  float ndl = max(0.0, dot(n, light));
  vec3 color = baseColor * (0.35 + 0.65 * ndl);

  // Underwater caustics (same mapping as pool/sphere logic, but applied to arbitrary geometry).
  if (point.y < info.r) {
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
    float diffuse = max(0.0, dot(refractedLight, n));
    vec2 causticUv = uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    vec4 caustic = texture2D(causticTex, causticUv);
    vec3 causticRgb = vec3(caustic.r);
    if (uDispersionStrength > 0.0) {
      vec2 delta = uDispersionStrength * normalize(refractedLight.xz);
      causticRgb.r = texture2D(causticTex, causticUv + delta).r;
      causticRgb.g = caustic.r;
      causticRgb.b = texture2D(causticTex, causticUv - delta).r;
    }
    color += diffuse * causticRgb * (2.0 * uCausticsStrength) * caustic.g;
    color *= underwaterColor * 1.15;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

```
---

## === FILE: shaders/sandShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * Sand floor shaders (GPTwaves "beach" environment).
 *
 * Goal: believable underwater sand with subtle animated ripples + caustics,
 * driven by the existing gptwaves water/caustics textures.
 */

export const SAND_VERTEX_SHADER = /* glsl */ `
precision highp float;

varying vec3 vPosition;

void main() {
  vPosition = position.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}
`;

export const SAND_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);

uniform sampler2D uWater;
uniform sampler2D uCausticTex;
uniform vec3 uLight;
uniform float uTime;
uniform float uSandScale;
uniform float uIorAir;
uniform float uIorWater;
uniform float uCausticsScale;
uniform float uCausticsStrength;
uniform float uDispersionStrength;

varying vec3 vPosition;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 sandAlbedo(vec3 point, vec2 waterNormal) {
  vec2 uv = point.xz * uSandScale;
  uv += waterNormal * 6.0;
  vec2 drift = vec2(uTime * 0.02, uTime * 0.015);

  float n = fbm(uv * 0.35 + drift);
  float ridge = 1.0 - abs(sin(dot(uv, vec2(0.85, 0.52)) * 2.6 + n * 2.0));
  ridge = smoothstep(0.15, 0.95, ridge);

  vec3 sandLight = vec3(0.78, 0.71, 0.52);
  vec3 sandDark = vec3(0.52, 0.45, 0.30);
  vec3 c = mix(sandDark, sandLight, n);
  c *= 0.85 + 0.22 * ridge;
  return c;
}

void main() {
  vec3 point = vPosition;
  vec2 waterCoord = fract(point.xz * 0.5 + 0.5);
  vec4 info = texture2D(uWater, waterCoord);

  vec3 base = sandAlbedo(point, info.ba);

  // Caustics (ported from original wall logic; tiled for larger floor)
  vec3 refractedLight = -refract(-uLight, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  vec3 normal = vec3(0.0, 1.0, 0.0);
  float diffuse = max(0.0, dot(refractedLight, normal));

  if (point.y < info.r) {
    vec2 causticUv = uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    vec4 caustic = texture2D(uCausticTex, fract(causticUv));
    vec3 causticRgb = vec3(caustic.r);
    if (uDispersionStrength > 0.0) {
      vec2 delta = uDispersionStrength * normalize(refractedLight.xz);
      causticRgb.r = texture2D(uCausticTex, fract(causticUv + delta)).r;
      causticRgb.g = caustic.r;
      causticRgb.b = texture2D(uCausticTex, fract(causticUv - delta)).r;
    }
    base += diffuse * causticRgb * (2.0 * uCausticsStrength) * caustic.g;
    base *= underwaterColor * 1.15;
  }

  gl_FragColor = vec4(base, 1.0);
}
`;

```
---

## === FILE: shaders/sandShaders3D.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
/**
 * 3D Sand floor shaders with geometry displacement.
 * 
 * Uses FBM noise to displace vertices in 3D space, creating actual
 * 3D ripples and waves in the sand. Bright areas (high noise) are raised,
 * dark areas (low noise) are lowered.
 * 
 * Key differences from 2D version:
 * - Noise calculation moved to vertex shader
 * - Vertices displaced based on noise value
 * - Normals calculated from displacement gradient
 * - Higher geometry resolution needed for smooth displacement
 */

export const SAND_VERTEX_SHADER_3D = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uSandScale;
uniform float uDisplacementStrength;
uniform float uRidgeStrength;

varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vWaterCoord;
varying vec2 vUv;
varying float vDisplacement;

// Shared noise functions (same as 2D version)
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Calculate displacement height at a point (without water normal - added in fragment)
float calculateDisplacement(vec2 uv, vec2 drift) {
  // Base FBM noise
  float n = fbm(uv * 0.35 + drift);
  
  // Ridge pattern (parallel lines)
  float ridge = 1.0 - abs(sin(dot(uv, vec2(0.85, 0.52)) * 2.6 + n * 2.0));
  ridge = smoothstep(0.15, 0.95, ridge);
  
  // Combine noise and ridge
  float displacement = n * uDisplacementStrength;
  displacement += ridge * uRidgeStrength;
  
  // Center around 0 (so displacement goes up and down)
  displacement -= (uDisplacementStrength * 0.5 + uRidgeStrength * 0.5);
  
  return displacement;
}

void main() {
  // World position (before displacement)
  vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // UV coordinates for noise
  vec2 uv = worldPos.xz * uSandScale;
  
  // Water coordinate (for fragment shader to sample)
  vec2 waterCoord = fract(worldPos.xz * 0.5 + 0.5);
  
  // Animated drift
  vec2 drift = vec2(uTime * 0.02, uTime * 0.015);
  
  // Calculate displacement at this vertex
  // Note: Water normal influence will be added in fragment shader
  // since WebGL 1.0 doesn't support texture sampling in vertex shader
  float displacement = calculateDisplacement(uv, drift);
  
  // Displace vertex in Y direction (up/down)
  vec3 displacedPos = worldPos;
  displacedPos.y += displacement;
  
  // Calculate normal from displacement gradient
  // Sample neighboring points to get gradient
  float eps = 0.01 * uSandScale;
  float dx = calculateDisplacement(uv + vec2(eps, 0.0), drift) - displacement;
  float dz = calculateDisplacement(uv + vec2(0.0, eps), drift) - displacement;
  
  // Normal is perpendicular to the gradient
  // dx/dz are in world space, so we need to scale by sand scale
  vec3 normal = normalize(vec3(-dx / eps, 1.0, -dz / eps));
  
  // Transform to world space
  vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  
  // Transform displaced position to view space
  vec4 mvPosition = viewMatrix * vec4(displacedPos, 1.0);
  
  // Pass to fragment shader
  vPosition = displacedPos;
  vWorldPosition = displacedPos;
  vNormal = worldNormal;
  vWaterCoord = waterCoord;
  vUv = uv;
  vDisplacement = displacement;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const SAND_FRAGMENT_SHADER_3D = /* glsl */ `
precision highp float;

const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);

uniform sampler2D uWater;
uniform sampler2D uCausticTex;
uniform vec3 uLight;
uniform float uTime;
uniform float uSandScale;
uniform float uIorAir;
uniform float uIorWater;
uniform float uCausticsScale;
uniform float uCausticsStrength;
uniform float uDispersionStrength;
uniform float uDisplacementStrength;

varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vWaterCoord;
varying float vDisplacement;

// Same noise functions as vertex shader (for color calculation)
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 sandAlbedo(vec3 point, vec2 waterNormal) {
  vec2 uv = point.xz * uSandScale;
  uv += waterNormal * 6.0;
  vec2 drift = vec2(uTime * 0.02, uTime * 0.015);

  float n = fbm(uv * 0.35 + drift);
  float ridge = 1.0 - abs(sin(dot(uv, vec2(0.85, 0.52)) * 2.6 + n * 2.0));
  ridge = smoothstep(0.15, 0.95, ridge);

  vec3 sandLight = vec3(0.78, 0.71, 0.52);
  vec3 sandDark = vec3(0.52, 0.45, 0.30);
  vec3 c = mix(sandDark, sandLight, n);
  c *= 0.85 + 0.22 * ridge;
  return c;
}

void main() {
  vec3 point = vWorldPosition;
  vec4 info = texture2D(uWater, vWaterCoord);
  vec2 waterNormal = info.ba;

  // Base sand color (same as 2D version, with water normal influence)
  vec3 base = sandAlbedo(point, waterNormal);
  
  // Optionally add subtle displacement-based color variation
  // Higher areas (brighter) get slightly lighter, lower areas darker
  float displacementFactor = vDisplacement / uDisplacementStrength;
  base *= (1.0 + displacementFactor * 0.1); // ±10% brightness variation
  
  // Add lighting based on 3D normal
  vec3 n = normalize(vNormal);
  float ndl = max(0.0, dot(n, normalize(uLight)));
  
  // Enhance lighting contrast for 3D effect
  // Bright sides (facing light) get brighter, dark sides get darker
  float lighting = 0.3 + 0.7 * ndl; // Ambient + diffuse
  base *= lighting;
  
  // Add subtle rim lighting for depth
  float rim = 1.0 - abs(dot(n, vec3(0.0, 1.0, 0.0)));
  rim = pow(rim, 2.0);
  base += vec3(0.1) * rim;

  // Caustics (same as 2D version)
  vec3 refractedLight = -refract(-uLight, vec3(0.0, 1.0, 0.0), uIorAir / uIorWater);
  float diffuse = max(0.0, dot(refractedLight, n));

  if (point.y < info.r) {
    vec2 causticUv = uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
    vec4 caustic = texture2D(uCausticTex, fract(causticUv));
    vec3 causticRgb = vec3(caustic.r);
    if (uDispersionStrength > 0.0) {
      vec2 delta = uDispersionStrength * normalize(refractedLight.xz);
      causticRgb.r = texture2D(uCausticTex, fract(causticUv + delta)).r;
      causticRgb.g = caustic.r;
      causticRgb.b = texture2D(uCausticTex, fract(causticUv - delta)).r;
    }
    base += diffuse * causticRgb * (2.0 * uCausticsStrength) * caustic.g;
    base *= underwaterColor * 1.15;
  }

  gl_FragColor = vec4(base, 1.0);
}
`;

```
---

## === FILE: shaders/breachShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
// Breaching / spray metaball rendering (SDF raymarch in a local volume).
// Inspired by `src/engines/lava-blobs/LavaBlobsEngine.tsx` metaball field technique.

export const BREACH_VERTEX_SHADER = /* glsl */ `
precision highp float;

varying vec3 vLocalPos;
varying vec3 vWorldPos;

void main() {
  vLocalPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const BREACH_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec3 vLocalPos;
varying vec3 vWorldPos;

uniform float uTime;
uniform vec3 uCameraLocal;
uniform vec3 uLightDir;
uniform samplerCube uSky;

// Blob array: xyz = position in LOCAL volume space, w = radius.
uniform float uBlobCount;
uniform vec4 uBlobs[64];

uniform float uIso;
uniform float uOpacity;

// Volume bounds in LOCAL space (matches the mesh geometry).
uniform vec3 uBoundsMin;
uniform vec3 uBoundsMax;

vec2 intersectBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax) {
  vec3 inv = 1.0 / rd;
  vec3 t0 = (bmin - ro) * inv;
  vec3 t1 = (bmax - ro) * inv;
  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);
  float a = max(max(tmin.x, tmin.y), tmin.z);
  float b = min(min(tmax.x, tmax.y), tmax.z);
  return vec2(a, b);
}

float field(vec3 p) {
  float f = 0.0;
  for (int i = 0; i < 64; i++) {
    float fi = float(i);
    if (fi >= uBlobCount) break;
    vec4 b = uBlobs[i];
    float r = max(0.0, b.w);
    vec3 c = b.xyz;
    float d = length(p - c);
    f += r / (d + 1e-3);
  }
  return f;
}

float sdf(vec3 p) {
  // Metaball iso-surface: iso - field.
  return uIso - field(p);
}

vec3 calcNormal(vec3 p) {
  float e = 0.002;
  vec2 h = vec2(1.0, -1.0) * 0.5773;
  return normalize(
    h.xyy * sdf(p + h.xyy * e) +
    h.yyx * sdf(p + h.yyx * e) +
    h.yxy * sdf(p + h.yxy * e) +
    h.xxx * sdf(p + h.xxx * e)
  );
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  // Ray in LOCAL space.
  vec3 ro = uCameraLocal;
  vec3 rd = normalize(vLocalPos - uCameraLocal);

  vec2 tHit = intersectBox(ro, rd, uBoundsMin, uBoundsMax);
  if (tHit.y < tHit.x) discard;
  float t0 = max(0.0, tHit.x);
  float t1 = tHit.y;

  // Raymarch.
  float t = t0;
  bool hit = false;
  vec3 p = ro;
  for (int i = 0; i < 96; i++) {
    p = ro + rd * t;
    float sd = sdf(p);
    if (sd < 0.001) { hit = true; break; }
    // Adaptive step (stable for metaball fields).
    t += clamp(abs(sd) * 0.7, 0.004, 0.08);
    if (t > t1) break;
  }
  if (!hit) discard;

  vec3 n = calcNormal(p);
  vec3 V = normalize(-rd);
  vec3 L = normalize(uLightDir);

  float ndl = max(dot(n, L), 0.0);
  float fresnel = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  float spec = pow(max(dot(reflect(-L, n), V), 0.0), 90.0);

  vec3 R = reflect(-V, n);
  vec3 env = textureCube(uSky, R).rgb;

  // Water-ish color (tunable later).
  vec3 base = vec3(0.35, 0.78, 1.05);
  vec3 col =
    base * (0.18 + 0.82 * ndl) +
    env * (0.25 + 0.75 * fresnel) +
    vec3(1.0, 0.95, 0.85) * (spec * 0.7);

  // Subtle noise breakup (reads as “spray sheet” variation).
  float n2 = hash12(p.xz * 37.0 + uTime * 0.2);
  col *= 0.92 + 0.08 * n2;

  gl_FragColor = vec4(col, uOpacity);
}
`;


```
---

## === FILE: shaders/dripShaders.ts ===

**⚠️ CRITICAL: Complete file embedded below.**

```typescript
export const DRIP_VERTEX_SHADER = /* glsl */ `
precision highp float;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  // NOTE: ShaderMaterial injects built-ins; do not redeclare them.
#ifdef USE_INSTANCING
  vec4 localPos = instanceMatrix * vec4(position, 1.0);
  mat4 mWorld = modelMatrix * instanceMatrix;
#else
  vec4 localPos = vec4(position, 1.0);
  mat4 mWorld = modelMatrix;
#endif

  vec4 worldPos = modelMatrix * localPos;
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(mWorld) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const DRIP_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec3 light;
uniform vec3 uCameraPos;
uniform float uOpacity;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  float ndv = max(0.0, dot(N, V));

  float fresnel = pow(1.0 - ndv, 4.0);
  vec3 R = reflect(-V, N);

  // Tight sun highlight (reads like a specular water droplet).
  float sunSpec = pow(max(0.0, dot(normalize(light), R)), 350.0);

  vec3 base = vec3(0.04, 0.08, 0.12);
  vec3 color =
    base +
    vec3(1.0, 0.98, 0.92) * (sunSpec * 4.0) +
    vec3(0.70, 0.82, 0.95) * (fresnel * 0.55);

  float alpha = uOpacity * (0.05 + 0.95 * fresnel) + sunSpec * 0.25;
  gl_FragColor = vec4(color, alpha);
}
`;



```
---

## === FILE: types/WaterSettings.ts ===

**⚠️ CRITICAL: Complete UnifiedWaterSettings interface with 100+ settings**

```typescript
/**
 * Unified Water Settings
 * 
 * Comprehensive settings that work across ALL water implementations.
 * Every visual/physical parameter is exposed and adjustable.
 */

export type WaterEngine = 
  | 'webgl-water-original'  // Original JavaScript/WebGL demo (iframe)
  | 'webgl-water'           // React Three.js port
  | 'lovable-waves'         // TypeScript/React raw WebGL port (working caustics)
  | 'gptwaves'              // GPTwaves baseline (locked legacy caustics)
  | 'gptwaves-webgl2'        // GPTwaves copy for WebGL2 porting
  | 'gptwaves-webgpu'        // GPTwaves copy for WebGPU porting
  | 'gptwaves-webgpu-cloudsun' // WebGPU (sun synced to unified settings / volumetric clouds)
  | 'gptwaves-webgpu-walls'    // WebGPU (Option B: walls receiver experiment)
  | 'gptwaves-webgpu-multiface' // WebGPU (Option A: multiface receiver experiment)
  | 'gptwaves-webgpu-v9'       // WebGPU v9: underwater caustic/shadow godrays (water volume)
  | 'gptwaves-v2'           // GPTwaves experimental (physics caustics v2)
  | 'gptwaves-beach'        // GPTwaves beach scene (boat hull + columns, pool disabled)
  | 'gptwaves-v4'           // GPTwaves v4 (copy of v1 for development)
  | 'gptwaves-v5'           // GPTwaves v5 (enhanced sphere physics for testing)
  | 'gptwaves-v6'           // GPTwaves v6 (bubble/surface entrainment iteration sandbox)
  | 'gptwaves-v7'           // GPTwaves v7 (unified-metrics + cross-effect smoothing sandbox)
  | 'hierarchical-lod' 
  | 'cosmic-ocean' 
  | 'dli-waves'
  | 'sand-original'         // Standalone 3D Sand App (original version)
  | 'sand-enhanced'         // Standalone 3D Sand App (enhanced with realism features)
  | 'volumetric-clouds'      // Volumetric clouds with God Rays (v1 baseline)
  | 'volumetric-clouds-v2'   // Volumetric clouds (v2 - Opus 4.5: critical fixes)
  | 'volumetric-clouds-v3'   // Volumetric clouds (v3 - Opus 4.5: advanced features)
  | 'volumetric-clouds-v4'   // Volumetric clouds (v4 - GPT 5.2: improved god rays)
  | 'volumetric-clouds-v5'   // Volumetric clouds (v5 - GPT 5.2: hybrid 3D-aware rays)
  | 'volumetric-clouds-v6'   // Volumetric clouds (v6 - Godray Fix: full multi-pass pipeline)
  | 'volumetric-clouds-v7'   // Volumetric clouds (v7 - controls + stability improvements)
  | 'volumetric-clouds-v8'   // Volumetric clouds (v8 - snapshot of v7+adaptive sampling; iteration sandbox)
  | 'volumetric-clouds-v9'   // Volumetric clouds (v9 - evolution sandbox for new ideas)
  | 'cosmic-background'     // Cosmic/nebula background scene (standalone)
  | 'lava-blobs';           // 3D Lava blobs effects gallery (standalone)

export interface UnifiedWaterSettings {
  // Engine selection
  activeEngine: WaterEngine;
  comparisonMode: boolean; // Show 2 engines side-by-side
  comparisonEngine?: WaterEngine;
  
  // ============================================================================
  // GEOMETRY & MESH
  // ============================================================================
  geometry: {
    size: number; // Water plane size
    sizeX: number; // Separate X size
    sizeY: number; // Separate Y size
    segments: number; // Mesh resolution
    segmentsX: number; // Separate X segments
    segmentsY: number; // Separate Y segments
    waterLevel: number; // Y position of water surface
    rotation: { x: number; y: number; z: number }; // Water plane rotation
  };
  
  // ============================================================================
  // WAVE SIMULATION
  // ============================================================================
  waves: {
    // Height field simulation
    heightFieldResolution: number; // Texture resolution for height field
    damping: number; // Wave energy decay (0.9-1.0)
    speed: number; // Wave propagation speed
    autoUpdate: boolean; // Auto-update simulation
    
    // Gerstner waves
    gerstnerEnabled: boolean;
    gerstnerAmplitude: number;
    gerstnerSpeed: number;
    gerstnerFrequency: number;
    gerstnerSteepness: number;
    gerstnerDirection: { x: number; z: number };
    gerstnerWaveCount: number; // Number of wave components
    
    // FFT ocean
    fftEnabled: boolean;
    fftResolution: number;
    fftWindSpeed: number;
    fftWindDirection: number;
    fftChoppiness: number;
    fftAmplitude: number;
    
    // Procedural waves
    proceduralEnabled: boolean;
    proceduralAmplitude: number;
    proceduralSpeed: number;
    proceduralFrequency: number;
    proceduralTurbulence: number;
    proceduralWindDirection: { x: number; z: number };
    proceduralWindStrength: number;
    proceduralPerpendicularStrength: number;
    proceduralGustIntensity: number;
    proceduralGustCycleSpeed: number;
    
    // SPH particles (for hierarchical)
    sphEnabled: boolean;
    sphParticleCount: number;
    sphRadius: number;
    sphRestDensity: number;
    sphGasConstant: number;
    sphViscosity: number;
  };
  
  // ============================================================================
  // MATERIAL & APPEARANCE
  // ============================================================================
  material: {
    // Physical material properties
    roughness: number; // 0 = mirror, 1 = matte
    metalness: number; // 0 = dielectric, 1 = metal
    clearcoat: number; // Clear coat layer (0-1)
    transmission: number; // Transparency (0-1)
    opacity: number; // Overall opacity (0-1)
    ior: number; // Index of refraction (1.0 = air, 1.333 = water)
    iorAir: number; // IOR of air (usually 1.0)
    iorWater: number; // IOR of water (usually 1.333)
    
    // Colors
    waterColor: string; // Base water color
    abovewaterColor: { r: number; g: number; b: number }; // Refracted color
    underwaterColor: { r: number; g: number; b: number }; // Underwater tint
    
    // Fresnel
    fresnelEnabled: boolean;
    fresnelMin: number; // Min reflection (perpendicular)
    fresnelMax: number; // Max reflection (grazing)
    fresnelPower: number; // Transition curve
    
    // Normal refinement
    normalRefinementEnabled: boolean;
    normalRefinementIterations: number;
    normalRefinementStep: number;
  };
  
  // ============================================================================
  // REFLECTIONS
  // ============================================================================
  reflections: {
    enabled: boolean;
    method: 'cubemap' | 'raytraced' | 'ssr' | 'none';
    intensity: number;
    cubeCameraResolution: 256 | 512 | 1024;
    cubeCameraNear: number;
    cubeCameraFar: number;
    cubeCameraFrames: number; // Infinity = real-time, number = static
    raytracedMaxSteps: number;
    raytracedStepSize: number;
    raytracedMaxDistance: number;
  };
  
  // ============================================================================
  // REFRACTIONS
  // ============================================================================
  refractions: {
    enabled: boolean;
    method: 'raytraced' | 'distortion' | 'none';
    intensity: number;
    raytracedMaxSteps: number;
    raytracedStepSize: number;
    distortionStrength: number;
  };
  
  // ============================================================================
  // CAUSTICS
  // ============================================================================
  caustics: {
    enabled: boolean;
    resolution: number; // Caustics texture resolution
    intensity: number; // Brightness multiplier
    waterMeshDetail: number; // Vertices for caustics projection
    algorithm: 'legacy' | 'v2';
    // Area metric for focus (legacy = product, v2 = cross).
    areaChangeMethod: 'product' | 'cross' | 'none';
    projectionScale: number; // Refracted projection scale (legacy constant = 0.75)
    baseGain: number; // Base gain inside caustics shader (legacy constant = 0.2)
    focusEpsilon: number; // Clamp for newArea (stability)
    maxFocus: number; // Clamp for focus (stability)

    // Physics weights (v2)
    transmissionEnabled: boolean; // Multiply by (1 - Fresnel)
    fresnelF0: number; // Water F0 (~0.02)
    absorptionEnabled: boolean; // Beer–Lambert absorption
    absorptionSigma: number; // Absorption coefficient

    // Soft sun (finite angular radius)
    softSunEnabled: boolean;
    sunAngularRadiusDeg: number;
    softSunSamples: number; // Used when temporalAccumulation is disabled
    temporalAccumulation: boolean;
    temporalAlpha: number; // EMA blend alpha

    // Optional chromatic dispersion (experimental)
    dispersionEnabled: boolean;
    dispersionStrength: number;

    // Water volume godrays (underwater shafts driven by caustics + shadow masks).
    // v9 focuses on this feature; other engines may ignore it.
    waterGodraysEnabled: boolean;
    waterGodraysStrength: number;
    waterGodraysSteps: number;
    waterGodraysMaxDistance: number; // 0 = use full water path length

    debug: boolean;
  };
  
  // ============================================================================
  // TURBULENCE (Underwater turbulence layer for organic wave variation)
  // ============================================================================
  turbulence: {
    enabled: boolean;
    strength: number; // 0-1, overall effect strength
    damping: number; // 0.998 = slower damping (currents persist longer)
    propagation: number; // 1.8 = different wave speed
    delay: number; // 0.7 = how much of surface wave is copied
    wallProximityStrength: number; // 2.0 = wall effect multiplier
    phaseOffsetStrength: number; // 0.1 = wave timing shift
    velocityPerturbationStrength: number; // 0.05 = speed variation
    amplitudeModulationStrength: number; // 0.1 = height variation
  };
  
  // ============================================================================
  // LIGHTING
  // ============================================================================
  lighting: {
    // Ambient
    ambientEnabled: boolean;
    ambientIntensity: number;
    ambientColor: { r: number; g: number; b: number };
    
    // Directional (sun)
    directionalEnabled: boolean;
    directionalIntensity: number;
    directionalDirection: { x: number; y: number; z: number };
    directionalColor: { r: number; g: number; b: number };
    
    // Sun highlight
    sunHighlightEnabled: boolean;
    sunHighlightPower: number; // Sharpness
    sunHighlightColor: { r: number; g: number; b: number };
    
    // Point lights
    pointLights: Array<{
      enabled: boolean;
      position: { x: number; y: number; z: number };
      intensity: number;
      color: { r: number; g: number; b: number };
      distance: number;
      decay: number;
    }>;
  };
  
  // ============================================================================
  // POOL/ENVIRONMENT
  // ============================================================================
  pool: {
    enabled: boolean;
    size: number;
    width: number;
    length: number;
    depth: number;
    wallThickness: number;
    tileTextureEnabled: boolean;
    tileTextureScale: number;
    causticsIntensityMultiplier: number;
    underwaterTintMultiplier: number;
    underwaterTint: { r: number; g: number; b: number };
    ambientOcclusionScale: number;
  };
  
  // ============================================================================
  // SPHERE INTERACTION
  // ============================================================================
  sphere: {
    enabled: boolean;
    position: { x: number; y: number; z: number };
    radius: number;
    color: string;
    material: 'standard' | 'physical' | 'basic';

    // Physics (used by GPTwaves)
    physics: {
      buoyancyModel: 'legacy' | 'heightfield'; // legacy=centerY, heightfield=integrated disk samples
      sampleCount: number; // 1..64
      sampleHz: number; // sampling rate (GPU readback) in Hz
      heightEncodeScale: number; // encoding scale for 8-bit height readback
      buoyancyStrength: number; // multiplier (legacy parity ~1.1)
      mass: number; // sphere mass (arbitrary units)
      fluidDensity: number; // water density (arbitrary units)
      addedMassCoefficient: number; // added mass term (sphere ~0.5)
      linearDrag: number; // linear damping when submerged
      quadraticDrag: number; // quadratic drag coefficient when submerged

      // Sphere↔Water coupling (V5)
      waterDisplacementScale: number; // scales how strongly the sphere displaces the heightfield
      impulseStrengthMultiplier: number; // scales wake/slam/skim impulses injected into the sim

      // Mouse interaction (force-limited servo, blends air↔water via submerged fraction)
      mouseControlEnabled: boolean;
      mouseTargetOmegaAir: number;
      mouseTargetOmegaWater: number;
      mouseKpAir: number;
      mouseKpWater: number;
      mouseKdAir: number;
      mouseKdWater: number;
      mouseMaxForceAir: number;
      mouseMaxForceWater: number;

      // Surface interaction (skipping/planing + slamming)
      planingEnabled: boolean;
      planingSpeedThreshold: number;
      planingMaxSubmergedFraction: number;
      planingLiftCoefficient: number;
      planingLiftMax: number;
      planingDragMultiplier: number;

      slamEnabled: boolean;
      slamCoefficient: number;
      slamMaxForce: number;

      // Wave injection enhancements (in addition to moveSphere)
      wakeEnabled: boolean;
      wakeStrength: number;
      wakeRadius: number;
      wakeOffset: number;

      // Bubble trail (visual, spawned from motion + wake/separation heuristics)
      bubbles: {
        enabled: boolean;
        // Spawn rate model: rate * max(0, speed-speedThreshold)^speedPower * surfaceBand^surfaceBandStrength
        rate: number; // base rate scalar
        speedThreshold: number; // below this, bubbles don't spawn
        speedPower: number; // exponent on speed term
        surfaceBandStrength: number; // exponent on surface band (peaks near half-submerged)

        // Pool / budgeting (v7 uses this to avoid ring-buffer overwrite truncation)
        maxActive: number; // max active bubble particles (budget)
        overflowMode: 'skip' | 'overwrite'; // when full: skip spawns or overwrite oldest

        // Wake/separation band parameters (used for sphere ring sampling)
        sepAlpha: number; // how deep into back-facing region to allow (e.g. 0.35)
        sepBeta: number; // near-90° cutoff (e.g. 0.05)

        // Placement (in units of sphere radius)
        wakeOffset: number; // additional spawn offset behind sphere center (× radius)
        spawnRadius: number; // spawn radius multiplier relative to sphere radius

        // Motion
        inheritVelocity: number; // how much of the sphere velocity bubbles inherit (0..1)
        riseSpeed: number; // upward bias (world units/sec in sim space)
        riseSizePower: number; // rise ∝ (r/rRef)^power
        riseMinFactor: number; // clamp factor on size-based rise
        riseMaxFactor: number; // clamp factor on size-based rise
        drag: number; // exponential drag (higher = slows faster)
        dragHorizontalMultiplier: number; // extra drag multiplier for horizontal (XZ) motion
        wakeExitHorizontalDrag: number; // additional drag applied as bubbles leave wake (0 = none)
        turbulence: number; // random drift strength
        turbulenceCorrelationTime: number; // OU correlation time (sec)
        turbulenceSettleTime: number; // turbulence decay timescale (sec)
        turbulenceSettleFloor: number; // 0..1, residual turbulence fraction after settling
        turbulenceAmbientFactor: number; // 0..1, minimum turbulence fraction even outside wake

        // Wake swirl/advection (cheap analytic wake field)
        wakeSwirlStrength: number; // swirl velocity magnitude (sim units/sec)
        wakeSwirlRadius: number; // gaussian radius in multiples of sphere radius
        wakeDecayLength: number; // axial decay length in multiples of sphere radius

        // Sphere influence on existing bubbles (locality effect: only nearby bubbles move with sphere)
        sphereInfluenceEnabled: boolean; // when sphere enters water, push nearby existing bubbles
        sphereInfluenceRadius: number; // radius of influence (multiples of sphere radius)
        sphereInfluenceFalloff: number; // softness of falloff edge (0=hard, 1+=soft)
        sphereInfluenceStrength: number; // how strongly sphere motion affects existing bubbles

        // Visual
        renderStrength: number; // overall visibility/scattering multiplier
        renderOpacity: number; // opacity when rendering 3D meshes (underwater camera)

        // Surface foam / entrainment (water surface shader)
        surfaceFoamStrength: number; // foam brightening strength from near-surface bubble density
        surfaceFoamThresholdLow: number; // smoothstep low threshold on foam density
        surfaceFoamThresholdHigh: number; // smoothstep high threshold on foam density
        surfaceFoamDepth: number; // sampling depth below surface (positive, in sim units; surface is y=0)
        surfaceFoamLifetime: number; // seconds (persistence of surface foam texture)
        surfaceFoamSizeMultiplier: number; // deposit radius multiplier relative to bubble radius
        surfaceFoamVariance: number; // 0..1, random variation in deposit intensity/size
        surfaceFoamSmartLink: boolean; // if true, surface foam deposits from actual 3D bubbles surfacing; 3D bubbles persist until surface

        // Surface bubbles (v7 prototype): linger at the surface before popping.
        surfaceBubbleHoldEnabled: boolean;
        surfaceBubbleHoldSeconds: number; // seconds bubbles remain at surface before popping
        surfaceBubbleProtrudeFraction: number; // 0..1 of radius above surface (0.5 = half-submerged)
        surfaceBubbleSplitEnabled: boolean; // optional: split larger bubbles into smaller near surface

        // Breaching / spray metaballs (wave crest sheets & blobs above the surface)
        breachEnabled: boolean;
        breachRate: number; // base events/sec (scaled by slam/skim energy)
        breachMinImpulse: number; // threshold on slamWaveImpulse before breaching activates
        breachStrength: number; // global strength scalar (affects spawn count and size)
        breachChainLength: number; // metaballs per "sheet/strand"
        breachChainSpacing: number; // spacing between metaballs (in multiples of radius)
        breachJetSpeed: number; // horizontal jet speed (inherits from motion)
        breachUpSpeed: number; // upward kick speed
        breachDrag: number; // drag on breach blobs (1/sec)
        breachGravity: number; // gravity magnitude applied to breach blobs
        breachLifetime: number; // seconds
        breachRadius: number; // base radius (sim units)
        breachRadiusJitter: number; // 0..1
        breachIso: number; // metaball iso threshold (shader)
        breachOpacity: number; // render opacity
        breachEventSpread: number; // lateral spread between strands (× sphere radius)
        breachDirectionMix: number; // 0..1 (0 = along motion, 1 = crest-tangent/perp)
        breachSpawnOffset: number; // along motion from rim (× sphere radius)
        breachRepulsion: number; // separation strength between breach blobs
        breachRepulsionRadiusMultiplier: number; // min distance multiplier on (r_i + r_j)
        breachWaterTake: number; // 0..1, subtract impulse from wave at spawn (volume-ish coupling)

        // Wave retraction-driven breaching (breach triggered by wave falling back, not expanding)
        breachRetractionEnabled: boolean; // enable breaching based on wave retraction speed
        breachRetractionMinSpeed: number; // min retraction speed to start breach (height units/sec)
        breachRetractionMaxSpeed: number; // max retraction speed for full effect
        breachRetractionStrength: number; // multiplier on breach from retraction

        // Surface pop foam enhancement
        surfacePopFoamMultiplier: number; // extra foam burst when surface bubbles pop (multiplier on base)

        // Cavitation / vacuum entry (concave wake + delayed ejecta blobs)
        cavitationEnabled: boolean;
        cavitationTrailStrength: number; // strength of concave (negative) trail injected into heightfield
        cavitationTrailRadius: number; // radius for concave trail
        cavitationTrailOffset: number; // behind sphere (× radius)
        cavitationDelay: number; // seconds before ejecta fires after strong entry
        cavitationEjectStrength: number; // multiplier on ejecta blob spawn (count/size)

        // Coalescence (merge)
        coalescenceEnabled: boolean;
        coalescenceRadiusMultiplier: number; // merge distance = k*(r_i + r_j)
        coalescenceRelVelMax: number; // require relative speed below this to merge
        coalescenceRate: number; // probabilistic merge rate (1/sec)

        // Lifetime / size
        lifetime: number; // seconds
        sizeMin: number; // radius in sim units
        sizeMax: number; // radius in sim units
        sizeDistributionPower: number; // 1 = uniform sizes, >1 biases toward smaller bubbles
      };

      // Wetness / dripping (visual + light coupling on the sphere surface)
      wetness: {
        enabled: boolean;
        accumulateRate: number; // 1/sec (how fast sphere becomes wet when submerged)
        dryRate: number; // 1/sec (how fast it dries when out of water)
        gravityBias: number; // 0..1 (0 = uniform wetness, 1 = wetness concentrates near bottom)
        darken: number; // 0..1 (wet darkening multiplier strength)
        gloss: number; // 0..1 (wet specular strength)
        streakScale: number; // noise scale for "runoff streaks"
        streakStrength: number; // 0..1 (how strongly streaks modulate wetness)

        dripsEnabled: boolean;
        dripRate: number; // droplets/sec at full wetness (scaled by wetness)
        dripMinWetness: number; // 0..1
        dripRadius: number; // sim units (visual size)
        dripGravity: number; // gravity magnitude for drip particles
        dripDrag: number; // 1/sec exponential drag
        dripImpulseRadius: number; // water ripple radius when drip hits
        dripImpulseStrength: number; // water ripple strength when drip hits
        dripZeroMeanEnabled: boolean; // if true, apply a negative ring so ripples don't lift overall water level
        dripZeroMeanRadiusMultiplier: number; // ring radius multiplier (e.g. 2.0)
        dripZeroMeanStrengthMultiplier: number; // ring strength multiplier (e.g. 0.25)
        dripInheritVelocity: number; // 0..1 (inherit sphere velocity)
      };
    };
  };
  
  // ============================================================================
  // CAMERA
  // ============================================================================
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    // Enhanced camera controls (v7)
    scrollZoomEnabled: boolean; // enable scroll wheel zoom
    scrollZoomSpeed: number; // zoom speed multiplier
    rightClickPanEnabled: boolean; // enable right-click drag to pan
    panSpeed: number; // pan speed multiplier
    minDistance: number; // minimum orbit distance
    maxDistance: number; // maximum orbit distance
    fov: number;
    near: number;
    far: number;
    controlsEnabled: boolean;
  };
  
  // ============================================================================
  // RENDERING
  // ============================================================================
  rendering: {
    antialias: boolean;
    alpha: boolean;
    powerPreference: 'default' | 'high-performance' | 'low-power';
    shadowMapEnabled: boolean;
    shadowMapType: 'basic' | 'pcf' | 'pcfsoft' | 'vsm';
    toneMapping: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
    toneMappingExposure: number;
    outputEncoding: 'linear' | 'sRGB';
  };
  
  // ============================================================================
  // FOG
  // ============================================================================
  fog: {
    enabled: boolean;
    type: 'linear' | 'exponential' | 'exponential2';
    color: string;
    density: number;
    distance: number;
    startDistance: number;
  };
  
  // ============================================================================
  // SCENE BACKGROUND
  // ============================================================================
  scene: {
    backgroundType:
      | 'skybox'
      | 'nebula'
      | 'gradient'
      | 'image'
      | 'environment'
      | 'volumetric-clouds'
      | 'volumetric-clouds-v6'
      | 'none';
    
    // Volumetric Clouds
    volumetricClouds: {
      enabled: boolean;
      quality: 'low' | 'medium' | 'high';
      
      // Texture Generation
      noiseModel?: 'fbm' | 'perlin-worley';
      textureSize: 32 | 64 | 96 | 128 | 256;
      cloudCoverage: number;
      cloudSoftness: number;
      noiseScale: number;
      octaves: number;
      persistence: number;
      lacunarity: number;
      noiseIntensity: number;
      seed: number;
      
      // Cloud Shape (Mask)
      maskRadius: number;
      maskSoftness: number;
      flattenTop: number;
      flattenBottom: number;
      flattenXpos: number;
      flattenXneg: number;
      flattenZpos: number;
      flattenZneg: number;
      noiseStrength: number;
      noiseFrequency: number;
      detailNoiseStrength: number;
      detailNoiseFrequency: number;
      
      // Rendering
      textureTiling: number;
      densityThreshold: number;
      densityMultiplier: number;
      opacity: number;
      raymarchSteps: number;
      lightSteps: number;
      containerScale: number;
      
      // Animation
      isAnimating: boolean;
      animationSpeedX: number;
      animationSpeedY: number;
      animationSpeedZ: number;
      
      // God Rays
      godRays: {
        enabled: boolean;
        density: number;
        decay: number;
        weight: number;
        exposure: number;
        samples: number;
      };

      // V4: God Rays Stability Controls (jitter, step scaling, edge behavior)
      v4Enhancements: {
        godRaysJitterEnabled: boolean;
        godRaysJitterStrength: number;
        godRaysJitterAnimate: boolean;
        godRaysUseDensityForStep: boolean;
        godRaysStepScale: number;
        godRaysClampSamples: boolean;
        godRaysEdgeFade: number;

        // Adaptive sampling (importance map + piecewise refinement)
        godRaysAdaptiveEnabled: boolean;
        godRaysAdaptiveOccupancyWeight: number;
        godRaysAdaptiveEdgeWeight: number;
        godRaysAdaptiveMinSamples: number;
        godRaysAdaptiveMaxSamples: number;
        godRaysAdaptiveSkipThreshold: number;
        godRaysAdaptiveMicroStepThreshold: number;
      };

      // V5: Hybrid 3D-informed God Rays Controls
      v5Enhancements: {
        godRays3DEnabled: boolean;
        godRays3DMix: number;
        godRays3DSteps: number;
        godRays3DAbsorption: number;
        godRaysSunRadius: number;
        godRaysSunSoftness: number;
        godRaysDepthGateEnabled: boolean;
        godRaysDepthGateEpsilon: number;
      };
    };
  };
  
  // ============================================================================
  // DEBUG
  // ============================================================================
  debug: {
    mode: 0 | 1 | 2 | 3; // 0=none, 1=underwater, 2=caustics, 3=coordinates
    showStats: boolean;
    showWireframe: boolean;
    showNormals: boolean;
    showBoundingBox: boolean;
    showGrid: boolean;
  };
}

export const DEFAULT_SETTINGS: UnifiedWaterSettings = {
  activeEngine: 'webgl-water',
  comparisonMode: false,
  
  geometry: {
    size: 2, // Match original: 2x2 water plane
    sizeX: 2,
    sizeY: 2,
    segments: 200, // Match original: 200x200 segments
    segmentsX: 200,
    segmentsY: 200,
    waterLevel: 0,
    rotation: { x: 0, y: 0, z: 0 }, // WebGL Water handles rotation internally, others use this
  },
  
  waves: {
    heightFieldResolution: 256,
    damping: 0.995,
    speed: 0.02,
    autoUpdate: true,
    gerstnerEnabled: true, // Enable for Hierarchical and Cosmic
    gerstnerAmplitude: 0.5,
    gerstnerSpeed: 0.5,
    gerstnerFrequency: 0.5,
    gerstnerSteepness: 0.5,
    gerstnerDirection: { x: 1, z: 0 },
    gerstnerWaveCount: 8,
    fftEnabled: false,
    fftResolution: 256,
    fftWindSpeed: 10,
    fftWindDirection: 0,
    fftChoppiness: 1.5,
    fftAmplitude: 1.0,
    proceduralEnabled: false,
    proceduralAmplitude: 0.5,
    proceduralSpeed: 0.5,
    proceduralFrequency: 0.5,
    proceduralTurbulence: 0.1,
    proceduralWindDirection: { x: 1, z: 0 },
    proceduralWindStrength: 1.0,
    proceduralPerpendicularStrength: 0.5,
    proceduralGustIntensity: 0.1,
    proceduralGustCycleSpeed: 0.1,
    sphEnabled: false,
    sphParticleCount: 1000,
    sphRadius: 0.1,
    sphRestDensity: 1000,
    sphGasConstant: 2000,
    sphViscosity: 0.01,
  },
  
  material: {
    roughness: 0.05,
    metalness: 0.2,
    clearcoat: 1.0,
    transmission: 0.2,
    opacity: 1.0,
    ior: 1.333,
    iorAir: 1.0,
    iorWater: 1.333,
    waterColor: '#4a9eff',
    abovewaterColor: { r: 0.25, g: 1.0, b: 1.25 },
    underwaterColor: { r: 0.4, g: 0.9, b: 1.0 },
    fresnelEnabled: true,
    fresnelMin: 0.25,
    fresnelMax: 1.0,
    fresnelPower: 3.0,
    normalRefinementEnabled: true,
    normalRefinementIterations: 5,
    normalRefinementStep: 0.005,
  },
  
  reflections: {
    enabled: true,
    method: 'cubemap',
    intensity: 1.0,
    cubeCameraResolution: 512,
    cubeCameraNear: 0.1,
    cubeCameraFar: 1000,
    cubeCameraFrames: Infinity,
    raytracedMaxSteps: 10,
    raytracedStepSize: 0.1,
    raytracedMaxDistance: 10,
  },
  
  refractions: {
    enabled: true,
    method: 'raytraced',
    intensity: 1.0,
    raytracedMaxSteps: 10,
    raytracedStepSize: 0.1,
    distortionStrength: 0.1,
  },
  
  caustics: {
    enabled: true,
    resolution: 1024,
    intensity: 5.0,
    waterMeshDetail: 200,
    algorithm: 'legacy',
    areaChangeMethod: 'product',
    projectionScale: 0.75,
    baseGain: 0.2,
    focusEpsilon: 1e-5,
    maxFocus: 50,
    transmissionEnabled: false,
    fresnelF0: 0.02,
    absorptionEnabled: false,
    absorptionSigma: 0.15,
    softSunEnabled: false,
    sunAngularRadiusDeg: 0.27,
    softSunSamples: 4,
    temporalAccumulation: false,
    temporalAlpha: 0.08,
    dispersionEnabled: false,
    dispersionStrength: 0.002,
    waterGodraysEnabled: false,
    waterGodraysStrength: 0.35,
    waterGodraysSteps: 18,
    waterGodraysMaxDistance: 0,
    debug: false,
  },
  
  turbulence: {
    enabled: true,
    strength: 0.1, // Conservative default for stability
    damping: 0.995,
    propagation: 0.5,
    delay: 0.3,
    wallProximityStrength: 1.2,
    phaseOffsetStrength: 0.02,
    velocityPerturbationStrength: 0.01,
    amplitudeModulationStrength: 0.02,
  },
  
  lighting: {
    ambientEnabled: true,
    ambientIntensity: 0.3,
    ambientColor: { r: 1, g: 1, b: 1 },
    directionalEnabled: true,
    directionalIntensity: 0.5,
    directionalDirection: { x: 0.5, y: 1, z: 0.5 },
    directionalColor: { r: 1, g: 1, b: 1 },
    sunHighlightEnabled: true,
    sunHighlightPower: 5000,
    sunHighlightColor: { r: 10, g: 8, b: 6 },
    pointLights: [],
  },
  
  pool: {
    enabled: true,
    size: 2, // Match original: 2x2 pool (cube from -1 to +1)
    width: 2,
    length: 2,
    depth: 2, // Match original: full cube depth
    wallThickness: 0.1,
    tileTextureEnabled: true,
    tileTextureScale: 1.0,
    causticsIntensityMultiplier: 5.0,
    underwaterTintMultiplier: 1.2,
    underwaterTint: { r: 0.4, g: 0.9, b: 1.0 },
    ambientOcclusionScale: 0.5,
  },
  
  sphere: {
    enabled: true,
    position: { x: -0.4, y: -0.75, z: 0.2 },
    radius: 0.25,
    color: '#ffffff',
    material: 'standard',
    physics: {
      buoyancyModel: 'heightfield',
      sampleCount: 32,
      sampleHz: 20,
      heightEncodeScale: 4,
      buoyancyStrength: 1.1,
      mass: 0.03,
      fluidDensity: 1.0,
      addedMassCoefficient: 0.5,
      linearDrag: 0.0,
      quadraticDrag: 1.0,
      // V5 defaults: conservative to avoid blow-ups; tune via Sphere Physics drawer.
      waterDisplacementScale: 0.03,
      impulseStrengthMultiplier: 0.6,
      mouseControlEnabled: true,
      mouseTargetOmegaAir: 30,
      mouseTargetOmegaWater: 8,
      mouseKpAir: 60,
      mouseKpWater: 18,
      mouseKdAir: 14,
      mouseKdWater: 10,
      mouseMaxForceAir: 30,
      mouseMaxForceWater: 10,
      planingEnabled: true,
      planingSpeedThreshold: 0.8,
      planingMaxSubmergedFraction: 0.25,
      planingLiftCoefficient: 1.0,
      planingLiftMax: 15,
      planingDragMultiplier: 1.4,
      slamEnabled: true,
      slamCoefficient: 1.0,
      slamMaxForce: 30,
      wakeEnabled: true,
      wakeStrength: 0.06,
      wakeRadius: 0.06,
      wakeOffset: 0.9,

      bubbles: {
        enabled: true,
        rate: 220,
        speedThreshold: 0.2,
        speedPower: 1.5,
        surfaceBandStrength: 1.0,
        maxActive: 512,
        overflowMode: 'skip',
        sepAlpha: 0.35,
        sepBeta: 0.05,
        wakeOffset: 0.25,
        spawnRadius: 1.0,
        inheritVelocity: 0.3,
        riseSpeed: 0.35,
        riseSizePower: 1.0,
        riseMinFactor: 0.7,
        riseMaxFactor: 2.0,
        drag: 1.0,
        dragHorizontalMultiplier: 2.5,
        wakeExitHorizontalDrag: 2.0,
        turbulence: 0.15,
        turbulenceCorrelationTime: 0.25,
        turbulenceSettleTime: 0.8,
        turbulenceSettleFloor: 0.25,
        turbulenceAmbientFactor: 0.2,
        wakeSwirlStrength: 0.25,
        wakeSwirlRadius: 1.2,
        wakeDecayLength: 1.6,
        sphereInfluenceEnabled: true,
        sphereInfluenceRadius: 2.5,
        sphereInfluenceFalloff: 1.2,
        sphereInfluenceStrength: 0.65,
        renderStrength: 1.0,
        renderOpacity: 0.35,
        surfaceFoamStrength: 0.45,
        surfaceFoamThresholdLow: 0.02,
        surfaceFoamThresholdHigh: 0.2,
        surfaceFoamDepth: 0.02,
        surfaceFoamLifetime: 6.0,
        surfaceFoamSizeMultiplier: 1.4,
        surfaceFoamVariance: 0.35,
        surfaceFoamSmartLink: false,
        surfaceBubbleHoldEnabled: false,
        surfaceBubbleHoldSeconds: 0.35,
        surfaceBubbleProtrudeFraction: 0.5,
        surfaceBubbleSplitEnabled: false,
        breachEnabled: false,
        breachRate: 1.2,
        breachMinImpulse: 0.012,
        breachStrength: 1.0,
        breachChainLength: 4,
        breachChainSpacing: 1.25,
        breachJetSpeed: 1.2,
        breachUpSpeed: 0.9,
        breachDrag: 1.2,
        breachGravity: 4.5,
        breachLifetime: 1.6,
        breachRadius: 0.045,
        breachRadiusJitter: 0.45,
        breachIso: 1.15,
        breachOpacity: 0.65,
        breachEventSpread: 0.35,
        breachDirectionMix: 0.0,
        breachSpawnOffset: 0.08,
        breachRepulsion: 0.0,
        breachRepulsionRadiusMultiplier: 1.2,
        breachWaterTake: 0.25,
        breachRetractionEnabled: false,
        breachRetractionMinSpeed: 0.08,
        breachRetractionMaxSpeed: 0.35,
        breachRetractionStrength: 1.0,
        surfacePopFoamMultiplier: 1.5,
        cavitationEnabled: false,
        cavitationTrailStrength: 0.012,
        cavitationTrailRadius: 0.07,
        cavitationTrailOffset: 0.9,
        cavitationDelay: 0.06,
        cavitationEjectStrength: 1.0,
        coalescenceEnabled: false,
        coalescenceRadiusMultiplier: 1.6,
        coalescenceRelVelMax: 0.2,
        coalescenceRate: 2.0,
        lifetime: 1.4,
        sizeMin: 0.003,
        sizeMax: 0.012,
        sizeDistributionPower: 2.2,
      },

      wetness: {
        enabled: true,
        accumulateRate: 6.0,
        dryRate: 0.55,
        gravityBias: 0.85,
        darken: 0.35,
        gloss: 0.85,
        streakScale: 3.5,
        streakStrength: 0.65,
        dripsEnabled: true,
        dripRate: 18.0,
        dripMinWetness: 0.12,
        dripRadius: 0.008,
        dripGravity: 8.0,
        dripDrag: 0.4,
        dripImpulseRadius: 0.035,
        dripImpulseStrength: 0.010,
        dripZeroMeanEnabled: false,
        dripZeroMeanRadiusMultiplier: 2.0,
        dripZeroMeanStrengthMultiplier: 0.25,
        dripInheritVelocity: 0.55,
      },
    },
  },
  
  camera: {
    position: { x: 0, y: 2, z: 4 },
    target: { x: 0, y: 0, z: 0 },
    scrollZoomEnabled: true,
    scrollZoomSpeed: 0.8,
    rightClickPanEnabled: true,
    panSpeed: 0.5,
    minDistance: 0.5,
    maxDistance: 12.0,
    fov: 45,
    near: 0.01,
    far: 100,
    controlsEnabled: true,
  },
  
  rendering: {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    shadowMapEnabled: false,
    shadowMapType: 'pcfsoft',
    toneMapping: 'aces',
    toneMappingExposure: 1.0,
    outputEncoding: 'sRGB',
  },
  
  fog: {
    enabled: false,
    type: 'linear',
    color: '#ffffff',
    density: 0.01,
    distance: 50,
    startDistance: 10,
  },
  
  scene: {
    backgroundType: 'skybox',
    volumetricClouds: {
      enabled: false,
      quality: 'medium',
      
      // Texture Generation
      noiseModel: 'fbm',
      textureSize: 96,
      cloudCoverage: 0.55,
      cloudSoftness: 0.05,
      noiseScale: 3.5,
      octaves: 5,
      persistence: 0.5,
      lacunarity: 3.0,
      noiseIntensity: 1.0,
      // NOTE: deterministic default for stable visuals + reproducible demos.
      seed: 0,
      
      // Cloud Shape
      maskRadius: 0.52,
      maskSoftness: 0.17,
      flattenTop: 0.7,
      flattenBottom: 0.3,
      flattenXpos: 0.9,
      flattenXneg: 0.9,
      flattenZpos: 0.9,
      flattenZneg: 0.9,
      noiseStrength: 0.05,
      noiseFrequency: 2.7,
      detailNoiseStrength: 0.036,
      detailNoiseFrequency: 10.5,
      
      // Rendering
      textureTiling: 2.0,
      densityThreshold: 0.0,
      densityMultiplier: 50.0,
      opacity: 6.0,
      raymarchSteps: 44,
      lightSteps: 1,
      containerScale: 120.0,
      
      // Animation
      isAnimating: true,
      animationSpeedX: 0.02,
      animationSpeedY: 0.0,
      animationSpeedZ: 0.01,
      
      // God Rays
      godRays: {
        enabled: true,
        density: 0.98,
        decay: 0.98,
        weight: 0.4,
        exposure: 0.4,
        samples: 120,
      },

      // V4 enhancements (defaults match core-v5)
      v4Enhancements: {
        godRaysJitterEnabled: true,
        godRaysJitterStrength: 0.35,
        godRaysJitterAnimate: true,
        godRaysUseDensityForStep: true,
        godRaysStepScale: 1.0,
        godRaysClampSamples: true,
        godRaysEdgeFade: 0.08,

        // Adaptive sampling defaults (off by default; v7 can wire these)
        godRaysAdaptiveEnabled: false,
        godRaysAdaptiveOccupancyWeight: 0.5,
        godRaysAdaptiveEdgeWeight: 0.5,
        godRaysAdaptiveMinSamples: 24,
        godRaysAdaptiveMaxSamples: 120,
        godRaysAdaptiveSkipThreshold: 0.01,
        godRaysAdaptiveMicroStepThreshold: 0.3,
      },

      // V5 enhancements (defaults match core-v5)
      v5Enhancements: {
        godRays3DEnabled: true,
        godRays3DMix: 0.65,
        godRays3DSteps: 10,
        godRays3DAbsorption: 1.2,
        godRaysSunRadius: 0.02,
        godRaysSunSoftness: 0.006,
        godRaysDepthGateEnabled: true,
        godRaysDepthGateEpsilon: 0.0005,
      },
    },
  },
  
  debug: {
    mode: 0,
    showStats: false,
    showWireframe: false,
    showNormals: false,
    showBoundingBox: false,
    showGrid: false,
  },
};
```

**Settings Summary:**
- **Total Settings:** 100+ individual parameters
- **Sphere Physics:** 20+ settings (buoyancy, drag, planing, slam, wake)
- **Bubble System:** 50+ settings (spawn, motion, coalescence, surface foam, breaching, cavitation)
- **Wetness/Drips:** 15+ settings (accumulation, drying, dripping, impulses)
- **Caustics:** 20+ settings (resolution, algorithm, physics weights, soft sun, dispersion)
- **Waves:** 15+ settings (heightfield, Gerstner, FFT, procedural, SPH)
- **Material:** 15+ settings (roughness, metalness, IOR, colors, Fresnel)
- **Lighting:** 10+ settings (ambient, directional, sun highlight, point lights)
- **Camera:** 10+ settings (position, controls, zoom, pan, FOV)
- **Pool/Environment:** 10+ settings (size, depth, textures, tints)
- **Volumetric Clouds:** 40+ settings (texture, shape, rendering, animation, god rays)

**Complete DEFAULT_SETTINGS:** See source file `src/types/WaterSettings.ts` lines 641-1098 for all default values.

---

*GPT Waves V7 Monolith - Complete Reference*  
*Created: 2025-01-27*  
*Purpose: Single Source of Truth for GPT Waves V7 System*  
*Status: ✅ Complete - Includes all 100+ settings and full scene implementation*

