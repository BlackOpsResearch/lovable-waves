---
id: "water_showcase_unified_T2_hybrid_ocean_architecture"
system: "water-showcase-unified"
component: "gptwaves-vpro"
level: "T2"
type: "architecture"
title: "Hybrid Ocean (vPRO) — Architecture"
description: "T2 architecture for Hybrid Ocean: contracts, dataflow, coupling, and phased implementation details."
audience: "implementers"
confidence_threshold: 0.65
token_cost: 2200
word_count: 2500
created: "2025-12-29T00:00:00Z"
updated: "2025-12-29T00:00:00Z"
author: "aether"
status: "in_progress"
tags: ["water", "ocean", "hybrid", "near-field", "breaching", "mpm", "webgpu", "architecture", "t0-t4", "transitional"]
dependencies:
  - "Documentation/appexamples/water-showcase-unified/T1_hybrid_ocean_overview.md"
  - "Documentation/appexamples/water-showcase-unified/WAVE_SIMULATION_ADVANCED_DISCUSSION.md"
related_docs:
  - "Documentation/appexamples/water-showcase-unified/T0_hybrid_ocean_executive.md"
version: "v0.1.0"
---

> **TRANSITIONAL T-LEVEL DOCUMENT** – Do not overwrite existing L-level docs. This T-level will supersede L-level after review/acceptance.

## Architecture goals (non-negotiable)
- **No regressions** to existing engines: all work lives in `gptwaves-vpro`.
- **Bounded cost**: near-field volumetrics must be LOD-controlled, spatially bounded, and event-driven.
- **Stable coupling**: prevent feedback loops that “pump” energy into the system.
- **Unified coordinates**: a single, explicit set of transforms between:
  - world space (meters-ish)
  - far-field surface space (ocean domain)
  - near-field bubble space (local 3D domain)
  - screen-space reconstruction buffers

## Terminology
- **Far-field**: the cheap “everywhere” ocean (FFT/procedural) + low-frequency swells.
- **Interaction heightfield**: our existing 2D solver (ping‑pong textures) that handles local impulses, wakes, obstacles.
- **Near-field bubble**: moving 3D simulation domain around a focus actor for breaching/splash volumetrics.

## Current baseline (what we already have)
In `gptwaves-v7`:
- A heightfield solver producing `waterTexture` where:
  - `r = height`
  - `g = velocity`
  - `b/a = normal-ish components`
- Injection APIs:
  - `addDrop(x,z,radius,strength)` (height/velocity injection depending on shader)
  - `addImpulse(x,z,radius,strength)` (velocity injection)
  - `moveSphere(old,new,radius,displacementScale)` (displacement coupling)
- Volumetric breach mesh: raymarched metaball volume (already acts like a “volumetric sheet” primitive)

`gptwaves-vpro` currently delegates to v7, giving us a stable starting point.

## Data contracts (explicit interfaces)
### Far-field sampling
We need a stable way to sample the surface to seed near-field:

```ts
export type FarFieldSample = {
  // World-space
  x: number;
  z: number;

  // Surface
  h: number;          // height
  dhdx: number;       // slope x
  dhdz: number;       // slope z
  ht: number;         // time-derivative proxy (optional)

  // Derived
  normal: { x: number; y: number; z: number };
  steepness: number;  // e.g., 1 - normal.y
};
```

Implementation note: in WebGL we can compute `h` and slope from `waterTexture` (r + ba). For stability, we sample on a schedule (e.g., 30Hz) and cache.

### Near-field stamp-back
Near-field must leave persistent effects in the far-field:

```ts
export type NearFieldStamp = {
  // Heightfield
  impulses: Array<{ x: number; z: number; radius: number; strength: number }>;

  // Foam decals / bubble entrainment (existing systems)
  foam: Array<{ x: number; z: number; radius: number; strength: number; lifetime: number }>;
  bubbles: Array<{ x: number; z: number; radius: number; strength: number }>;
};
```

## Trigger model (when do we spawn breaching?)
We need deterministic, debuggable triggers. Early candidates:
- **Steepness trigger**: if `steepness > breakThreshold` and crest speed exceeds `cThreshold`.
- **Obstacle trigger**: hull entry/exit, slam, rudder turn, prop wash (already measured in the boat system).
- **User/character trigger**: footsteps, jumps, impacts.

Each trigger yields an **event packet**:

```ts
export type BreachEvent = {
  kind: 'crest_break' | 'impact' | 'hull_slam' | 'prop_wash' | 'footstep';
  x: number;
  z: number;
  // energy budget (controls particle count / blob count)
  energy: number;
  // preferred direction (for sheets/arcs)
  dir: { x: number; z: number };
  // lifespan hint
  ttl: number;
};
```

## Near-field bubble design
### Spatial definition
The bubble is a moving local simulation box:
- Center: focus actor position projected onto water surface
- Size: configurable (e.g., 2m–6m, depending on perf)
- Resolution: LOD tiers (grid + particles)

### WebGL “Phase 1” near-field (metaballs + ballistic)
Goal: physical plausibility without full 3D fluid yet.
- Use the existing breach metaball system as the core volumetric primitive.
- Add anisotropic kernels and chained blobs to form **sheets** and **arcs**:
  - “sheet”: a string of metaballs with coherent velocity + gravity
  - “spray”: ballistic droplets with coherent turbulence (already similar to our drips)
- Coupling back:
  - when a blob falls below surface: stamp impulses and foam
  - when energy decays: fade volume and convert remaining energy into surface foam

This phase gives you “hero breaching” quickly and lets us validate triggers + LOD.

### WebGPU “Phase 2” near-field (MLS‑MPM)
Goal: adopt the real method highlighted by Splash/WebGPU‑Ocean/WaterBall.

Key learnings from those repos (high-level, verified from their READMEs):
- Simulation: **MLS‑MPM** (Hu et al.)
- Rendering: **Screen‑Space Fluid Rendering** (GDC 2010)
- Depth smoothing:
  - WebGPU‑Ocean/WaterBall used bilateral filtering; Splash upgraded to **Narrow‑Range Filter** (PACMCGIT 2018)
- Shadows:
  - Splash ray-marches shadows through a density grid (particle mode), requiring an extra density P2G stage
- Stability:
  - Splash notes that reducing substeps matters; it uses a Tait equation pressure model and adjusted parameters (gamma) for stability

We will implement the WebGPU path inside `gptwaves-webgpu` infrastructure *only after* the WebGL phase validates triggers and coupling.

### Verified implementation modules (local clones)
We cloned the repos under `Documentation/appexamples/water-showcase-unified/_external/matsuoka-601/` and confirmed the concrete module structure:
- **MLS‑MPM core**:
  - `Splash/mls-mpm/mls-mpm.ts` orchestrates compute pipelines:
    - `clearGrid` → `p2g_1` → `p2g_2` → `updateGrid` → `g2p`
    - optional density grid: `p2gDensity` + `castDensityGrid` (for particle-mode shadows)
  - `WebGPU-Ocean/mls-mpm/*` and `WaterBall/mls-mpm/*` follow the same pattern
  - `WebGPU-Ocean/sph/*` exists as an alternative near-field method (neighbor search, more expensive)
- **Screen-space fluid rendering**:
  - `render/depthMap.wgsl` + `render/thicknessMap.wgsl` create depth + thickness maps
  - `render/fluid.wgsl` shades the reconstructed surface
  - **Depth smoothing**:
    - Splash: `render/narrowRangeFilter.wgsl` (Narrow‑Range Filter)
    - WebGPU‑Ocean/WaterBall: `render/bilateral.wgsl`
  - Splash also includes `render/densityRaymarch.wgsl` for density-grid shadow raymarching

These file paths are the blueprint for our vPRO WebGPU phase: we can port the pipeline in a bounded bubble domain and then focus most effort on coupling/blending rather than reinventing the core stages.

## Rendering architecture (composition)
We need to blend three visual layers:
1) Base ocean shading (heightfield surface)
2) Near-field volumetric surface (screen-space reconstructed) composited on top
3) Spray particles (additive/alpha) + foam decals

Order:
- Render base water as today
- Render near-field surface into its own depth/normal/thickness buffers
- Composite:
  - refract/reflect using near-field normals where present
  - otherwise fall back to base water normals

## LOD + budgets (how we stay real-time)
### Hard budgets
- Bubble footprint: max radius in meters (or pool units)
- Particle count tiers (WebGPU): e.g., 20k / 60k / 120k
- Update rates: run near-field at 30Hz when not in focus, 60Hz when active

### Adaptive quality
- Track frame time; reduce:
  - particle count / grid resolution
  - number of substeps
  - density/shadow raymarching

## Implementation plan (next concrete steps)
1) **vPRO feature flags + debug views**
   - show trigger events, bubble bounds, and stamp-back footprints
2) **Generalize breach system into an emitter graph**
   - multiple emitters per frame, each with energy + direction + TTL
3) **Define coupling contracts in code**
   - `FarFieldSample` + `NearFieldStamp` types
4) **Ship Phase 1**
   - breaking crests near actor using sheet/arc metaballs + re-entry stamping
5) **Only then** start Phase 2 WebGPU MPM prototype


