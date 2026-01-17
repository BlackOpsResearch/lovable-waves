---
id: "water_showcase_unified_T1_hybrid_ocean_overview"
system: "water-showcase-unified"
component: "gptwaves-vpro"
level: "T1"
type: "overview"
title: "Hybrid Ocean (vPRO) — Overview + System Map"
description: "T1 overview of the Hybrid Ocean system (far-field + near-field breaching) and integration plan for gptwaves-vpro."
audience: "Braden, implementers"
confidence_threshold: 0.75
token_cost: 900
word_count: 850
created: "2025-12-29T00:00:00Z"
updated: "2025-12-29T00:00:00Z"
author: "aether"
status: "in_progress"
tags: ["water", "ocean", "hybrid", "breaching", "foam", "spray", "mpm", "webgpu", "t0-t4", "transitional"]
dependencies:
  - "Documentation/appexamples/water-showcase-unified/WAVE_SIMULATION_ADVANCED_DISCUSSION.md"
  - "Documentation/appexamples/water-showcase-unified/ADVANCED_WATER_SYSTEMS_DESIGN.md"
  - "Documentation/Documentationtext/wavewake.txt"
related_docs:
  - "Documentation/appexamples/water-showcase-unified/T0_hybrid_ocean_executive.md"
  - "Documentation/appexamples/water-showcase-unified/T2_hybrid_ocean_architecture.md"
version: "v0.1.0"
---

> **TRANSITIONAL T-LEVEL DOCUMENT** – Do not overwrite existing L-level docs. This T-level will supersede L-level after review/acceptance.

## Why Hybrid Ocean?
Our current system is a **2D heightfield** (fast, stable, scalable). It excels at:
- large-scale wave propagation
- cheap interaction stamping (impulses, obstacles)
- high-quality shading (refraction/reflection, caustics, wind ripples, whitecaps heuristics)

But a pure heightfield cannot represent **true volumetric breaking**:
- curling crest overturn
- sheets and arcs
- spray plumes and droplets with coherent breakup
- “water mass” leaving the surface and re-entering with momentum

So we use a **hybrid** architecture: keep the heightfield for 99% of the ocean, and allocate expensive volumetrics only where the player is looking / interacting.

## External references (what we’re borrowing)
From matsuoka-601’s projects:
- **Splash** (`matsuoka-601/Splash`): MLS‑MPM simulation + screen-space fluid rendering; improved depth smoothing via **Narrow‑Range Filter** (PACMCGIT 2018), ray-marched shadows using a density grid (particle mode), and a focus on reducing required substeps.
- **WebGPU‑Ocean** (`matsuoka-601/WebGPU-Ocean`): MLS‑MPM (Hu et al.) and optional SPH, with screen-space fluid rendering; calls out P2G scatter as a main implementation difficulty; reports real-time with ~100k particles on integrated GPUs.
- **WaterBall** (`matsuoka-601/WaterBall`): MLS‑MPM + screen-space fluid rendering on a sphere (good reference for “local domain” thinking and screen-space surface reconstruction).

We are **not** copying these repos directly; we’re extracting the patterns: **local 3D particle/grid sim + screen-space reconstruction + filters + coupling**.

## System Map (vPRO target)
### 1) Far-field Ocean Layer (cheap, always-on)
**Goal:** “the ocean exists everywhere” at stable perf.
- **Option A (near-term)**: keep our current heightfield + wind + whitecaps heuristic.
- **Option B (mid-term)**: add spectral/FFT base waves (global wind-driven swells) and treat the heightfield as an additive “interaction layer”.

Outputs:
- surface height \(h(x,z)\), surface velocity proxy, normals
- wind field parameters (direction/strength/gusts)

### 2) Near-field “Breach Bubble” Layer (expensive, only near player)
**Goal:** physically plausible breaching near character/boats.
- A moving local domain centered on a **focus actor** (character/boat/camera).
- Contains a volumetric solver:
  - **WebGPU path**: MLS‑MPM style particle-grid solver (like Splash/WebGPU‑Ocean).
  - **WebGL fallback path**: metaball/sheet approximation driven by event emitters + ballistic spray + foam stamping.

Outputs:
- a **screen-space reconstructed surface** (depth/thickness/normal) for rendering
- spray droplets / foam particles
- local density grid (optional) for shadows / godrays / extinction

### 3) Coupling Layer (the glue)
**Far → Near (seeding)**
- Detect triggers in the far-field:
  - steepness threshold (breaking onset)
  - impact/entry events (boat slam, sphere entry, character step)
  - obstacle interactions (rudder/prop, shoreline)
- Seed the near-field bubble with:
  - initial particle velocities aligned to local wave kinematics
  - density/volume consistent with a crest volume estimate

**Near → Far (persistence)**
- When near-field dissipates, stamp back:
  - height/velocity impulses (wake + impact rings)
  - persistent foam decals (lifetime)
  - bubble entrainment field injections

## Integration in this repo
### vPRO engine boundary
We created a dedicated engine target:
- `WaterEngine`: added `gptwaves-vpro`
- Engine wiring:
  - `src/engines/gptwaves-vpro/GptwavesVProEngine.tsx`
  - `src/engines/gptwaves-vpro/GptwavesVProScene.tsx` (currently delegates to v7)
  - `App.tsx` / `TopBar.tsx` / `EngineSelector.tsx`: now list and render `gptwaves-vpro`

This is the safety guarantee: we can iterate aggressively without destabilizing v7.

### Current “near-field” building blocks we already have
Even before MLS‑MPM, we have useful primitives:
- **Heightfield injection**: `addDrop`, `addImpulse`, and `moveSphere` (displacement coupling)
- **Volumetric breach mesh**: raymarched metaball volume (currently sphere-driven) that we can generalize into “breach emitters”
- **Bubble + foam fields**: already integrated into shading (good for near→far persistence)
- **Wind model knobs**: direction/strength/gusts (can drive both far and near)

## Phased rollout (don’t overreach)
### Phase 0 — “Orchestration plumbing” (vPRO scaffolding)
- Add `gptwaves-vpro` toggles (enable/disable near-field bubble; debug views)
- Define the coupling contracts:
  - `FarFieldSample`: \(h, \nabla h, \partial_t h\) at points
  - `NearFieldStamp`: impulses + foam + bubble injections

### Phase 1 — WebGL near-field breaching (fastest visible leap)
Goal: breaching visuals that feel physical, even if not fully MPM yet.
- Generalize breach metaballs from “sphere-only” → “event emitters”
- Add sheet/arc primitives (metaball chains + anisotropic kernels)
- Add re-entry: convert falling blobs into impulses + foam stamps

### Phase 2 — WebGPU near-field MLS‑MPM prototype (in a small bubble)
Goal: implement the actual method hinted by Splash/WebGPU‑Ocean.
- Local domain (e.g., 1–3m cube around actor) with LOD:
  - particles count tiering
  - grid resolution tiering
  - substeps tiering (Splash emphasizes substep reduction)
- Rendering:
  - screen-space surface reconstruction (GDC 2010 “screen-space fluid rendering”)
  - depth smoothing filter:
    - start with bilateral
    - upgrade to **Narrow‑Range Filter** as in Splash

### Phase 3 — Hybrid ocean base waves
Goal: large ocean swells + near-field interaction detail.
- Introduce FFT base layer (wind spectrum) as “far-field”
- Keep our heightfield as the “interaction layer” added on top

## Risk map (early)
- **Performance**: MPM can explode in cost; must enforce bubble bounds + LOD
- **Coupling stability**: avoid positive feedback (volume→surface→volume loops)
- **Rendering artifacts**: screen-space fluids need careful filtering to avoid “jelly” or “sparkle”

## Immediate next step
Create `T2_hybrid_ocean_architecture.md` to lock down:
- data contracts, buffers, coordinate systems
- event triggers for breaking and splash generation
- exact integration points inside `gptwaves-vpro`

