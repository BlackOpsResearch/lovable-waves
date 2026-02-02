# Ocean Sim Expansion — Complete Encyclopedia (Monolith)
**Date:** 2026-02-01  
**Purpose:** Single consolidated monolith of the entire ocean sim expansion plans in total detail.  
**Source:** ENCYCLOPEDIA volumes (00_MASTER_INDEX + V1–V6).  

---

## Index

### Part 0 — Master Index and Navigation
- [Master Index and Navigation](#master-index-and-navigation)
- [How to Use This Encyclopedia](#how-to-use-this-encyclopedia)
- [Volume I — Vision, North Star & Master Plan](#volume-i--vision-north-star--master-plan) (table)
- [Volume II — Splash & MLS-MPM](#volume-ii--splash--mls-mpm) (table)
- [Volume III — Hybrid Ocean & Wave Systems](#volume-iii--hybrid-ocean--wave-systems) (table)
- [Volume IV — Wave Physics Reference](#volume-iv--wave-physics-reference) (table)
- [Volume V — Breach, Spawn & Effects](#volume-v--breach-spawn--effects) (table)
- [Volume VI — Implementation, Specs & Apps](#volume-vi--implementation-specs--apps) (table)
- [Quick Reference: Where to Find What](#quick-reference-where-to-find-what)
- [Source Consolidation Note](#source-consolidation-note)

### Volume I — Vision, North Star & Master Plan
- [Vision and Intent](#vision-and-intent--ocean-sim-expansion)
- [Guiding Principles](#guiding-principles--ocean-sim-expansion)
- [Evolution Phases and Roadmap](#evolution-phases-and-roadmap--ocean-sim-expansion)
- [Project State and Re-Alignment](#project-state-and-re-alignment--ocean-sim-expansion)

### Volume II — Splash & MLS-MPM
- [Splash & MLS-MPM Overview](#splash--mls-mpm-overview--ocean-sim-expansion)
- [MLS-MPM Physics and Algorithms](#mls-mpm-physics-and-algorithms--ocean-sim-expansion)
- [Constraint-Based LOD and Architecture](#constraint-based-lod-and-architecture--ocean-sim-expansion)
- [Simulation Ideas Consolidation](#simulation-ideas-consolidation--ocean-sim-expansion)
- [Implementation Status and Handoff](#implementation-status-and-handoff--ocean-sim-expansion)

### Volume III — Hybrid Ocean & Wave Systems
- [Hybrid Ocean Vision and Summary](#hybrid-ocean-vision-and-summary--ocean-sim-expansion)
- [Hybrid Wave System Map (L0–L5)](#hybrid-wave-system-map-l0l5--ocean-sim-expansion)
- [Two-Way Coupling and Integration](#two-way-coupling-and-integration--ocean-sim-expansion)
- [Heightfield and Splash Layers](#heightfield-and-splash-layers--ocean-sim-expansion)
- [Visual Blending and Seam Elimination](#visual-blending-and-seam-elimination--ocean-sim-expansion)

### Volume IV — Wave Physics Reference
- [Mathematical Models](#mathematical-models--ocean-sim-expansion)
- [Validation Rules and Symptom Index](#validation-rules-and-symptom-index--ocean-sim-expansion)
- [Data Dictionary and Cross Reference](#data-dictionary-and-cross-reference--ocean-sim-expansion)
- [Canonical Scenarios](#canonical-scenarios--ocean-sim-expansion)

### Volume V — Breach, Spawn & Effects
- [Breach Genesis and Organic Spawn](#breach-genesis-and-organic-spawn--ocean-sim-expansion)
- [Trigger, Measurement and Event Contract](#trigger-measurement-and-event-contract--ocean-sim-expansion)
- [Spawn Field SF0/SF1 First Principles](#spawn-field-sf0sf1-first-principles--ocean-sim-expansion)
- [Foam, Bubble, Energy and Visual Contracts](#foam-bubble-energy-and-visual-contracts--ocean-sim-expansion)
- [Phase 2 Implementation Sequence](#phase-2-implementation-sequence--ocean-sim-expansion)
- [LOD, Budget and Debug/Telemetry](#lod-budget-and-debugtelemetry--ocean-sim-expansion)

### Volume VI — Implementation, Specs & Apps
- [Specs Index and Contracts](#specs-index-and-contracts--ocean-sim-expansion)
- [Codebase Monoliths Index](#codebase-monoliths-index--ocean-sim-expansion)
- [Apps and Engines](#apps-and-engines--ocean-sim-expansion)
- [Settings Architecture and NL/Syntax](#settings-architecture-and-nlsyntax--ocean-sim-expansion)
- [Blueprints and Focus Areas](#blueprints-and-focus-areas--ocean-sim-expansion)
- [Quality Assurance and Drift Prevention](#quality-assurance-and-drift-prevention--ocean-sim-expansion)

---

# Ocean Sim Expansion — Complete Encyclopedia
## Master Index and Navigation

**Date:** 2026-02-01  
**Purpose:** Single consolidated encyclopedia of the entire ocean sim expansion plans in total detail. All content is consolidated here—not linked—for one source of truth.  
**Status:** Living document.  
**Scope:** Vision, Splash/MLS-MPM, hybrid ocean, wave physics, breach/spawn/effects, implementation, specs, apps.

---

## How to Use This Encyclopedia

- **By role:** Planning → Vol I, II, III. Physics → Vol IV. Implementation → Vol V, VI.  
- **By topic:** Use the volume and article list below; each article is self-contained with cross-references to other articles.  
- **By phase:** Evolution phases and Phase 2 breach sequence are in Vol I and Vol V.  
- **Full detail:** Each volume folder contains markdown articles; read in order within a volume for a complete narrative.

---

## Volume I — Vision, North Star & Master Plan

**Path:** `ENCYCLOPEDIA/V1_VISION_AND_ARCHITECTURE/`

| Article | Content (consolidated) |
|--------|-------------------------|
| **01_Vision_and_Intent** | Core intent: hyper-realistic water + object interaction, perfect mapping (settings ↔ physics ↔ visuals), dynamic Bezier/Opus modulation, performance-first (LOD, no blocking GPU readbacks). |
| **02_Guiding_Principles** | Relationship correctness > more settings; dynamic settings explainable; performance is a feature; what's already "done enough"; evolution scope (Phase 1–4). |
| **03_Evolution_Phases_and_Roadmap** | Phase 1: water + object coupling, dynamic curves, perf gates. Phase 2: WaveStack, ripples. Phase 3: bubbles/foam. Phase 4: breach realism + Splash integration. Next concrete steps. |
| **04_Project_State_and_Re_Alignment** | Project state audit, current vs planned gap, drift analysis and prevention, immediate action plan, success criteria, genesis-before-feedback rules. |

---

## Volume II — Splash & MLS-MPM

**Path:** `ENCYCLOPEDIA/V2_SPLASH_AND_MLS_MPM/`

| Article | Content (consolidated) |
|--------|-------------------------|
| **01_Splash_MLS_MPM_Overview** | What Splash is (MLS-MPM fluid sim); strengths (droplet physics, lighting, breaching, sheets); limitations (cost, isolation); conditional activation strategy. |
| **02_MLS_MPM_Physics_and_Algorithms** | MLS-MPM algorithm, Tait equation, narrow-range filter, particle–grid transfer, world-locked particles, stability (CFL, dt). |
| **03_Constraint_Based_LOD_and_Architecture** | Particles constrained to heightfield; conform-at-rest, break-and-recover, spatial LOD; Phase 1–4 prep (conform, break/recover, spatial LOD, animated waves). |
| **04_Simulation_Ideas_Consolidation** | Camera/character-following particle system; pool-to-pool siphon; constraint-based LOD; hybrid ocean architecture; code patterns (spawn/despawn, grid, world-locked). |
| **05_Implementation_Status_and_Handoff** | Phase 2 breach status (unit system, η̇, events, spawn field, wave-conforming spawn, wave-inherited velocities, ride window, cohesive phase); HANDOFF_TO_GPT5_2 contents; tuning guide. |

---

## Volume III — Hybrid Ocean & Wave Systems

**Path:** `ENCYCLOPEDIA/V3_HYBRID_OCEAN_AND_WAVE_SYSTEMS/`

| Article | Content (consolidated) |
|--------|-------------------------|
| **01_Hybrid_Ocean_Vision_and_Summary** | Two-layer system: heightfield (base) + Splash (detail); trigger detection (steepness, curvature, velocity); 2.5D dynamic limits + heat map; three-layer architecture (base ocean, 2.5D δ_sim, 3D particle sheets). |
| **02_Hybrid_Wave_System_Map_L0_L5** | L0: shading-only micro detail. L1: kinematic surface. L2: spectral FFT. L3: heightfield PDE. L4: event-driven volumetric (breaking + splashes). L5: reconstruction (particles → surface/foam). Coupling contracts, frame pipeline, debuggability. |
| **03_Two_Way_Coupling_and_Integration** | BFT feedback (breach → heightfield); delta layering η_total = η_base + δ_sim + δ_breach; L2↔L3, L3↔L4, L4↔L5 coupling; seam elimination. |
| **04_Heightfield_and_Splash_Layers** | Base ocean (procedural/Gerstner); 2.5D heightfield (dynamic limits, heat map); 3D particle mesh sheets (Splash); combined surface rendering. |
| **05_Visual_Blending_and_Seam_Elimination** | Separate vs unified vs hybrid render passes; depth-aware compositing; shared lighting/normals; visual integration contract; debug views. |

---

## Volume IV — Wave Physics Reference

**Path:** `ENCYCLOPEDIA/V4_WAVE_PHYSICS_REFERENCE/`

| Article | Content (consolidated) |
|--------|-------------------------|
| **01_Mathematical_Models** | Model selection map (sines/Gerstner, FFT, SWE, SWE+dispersive, SPH/FLIP/MPM); linear wave theory (dispersion); procedural/kinematic; spectral FFT; heightfield PDE; volumetric/particle methods. |
| **02_Validation_Rules_and_Symptom_Index** | Wave validation rules; symptom-to-fix index; diagnostic flow per tier; state contracts (units, ranges, cadence). |
| **03_Data_Dictionary_and_Cross_Reference** | Data dictionary (η, η̇, u, h, etc.); cross-reference (physics ↔ math ↔ code); canonical scenarios. |
| **04_Canonical_Scenarios** | Reference scenarios for validation (drop test, scale invariance, breaking onset, object impact, ride window). |

---

## Volume V — Breach, Spawn & Effects

**Path:** `ENCYCLOPEDIA/V5_BREACH_SPAWN_AND_EFFECTS/`

| Article | Content (consolidated) |
|--------|-------------------------|
| **01_Breach_Genesis_and_Organic_Spawn** | Wave-driven breach genesis; spawn primitives (radial crown, crest ribbon, whitecaps, wall impact, object splash); ride window; energy accounting. |
| **02_Trigger_Measurement_and_Event_Contract** | BAT channels; derived metrics (steepness, curvature, η̇); trigger families; hysteresis/cooldowns; event contract; GPU layouts (EBT); no hot readbacks. |
| **03_Spawn_Field_SF0_SF1_First_Principles** | SF0/SF1 texture layout (X, C, L, Ω, F); normalization ranges; SF → ribbon sheet parcel mapping; cohesive phase → yield → liquid; conservation bridge; visibility rules; object specialization. |
| **04_Foam_Bubble_Energy_Visual_Contracts** | One foam truth (breach → foam field); BFT.B foam deposits; decay/advection; bubble air entrainment; energy accounting (drain at spawn, impact-gated feedback); visual integration contract. |
| **05_Phase_2_Implementation_Sequence** | Ordered steps: scale/timing → η̇ → events → wave-shaped spawn → inertia → ride window → drain → foam/bubbles → visuals → LOD; stop conditions; verification gates. |
| **06_LOD_Budget_Debug_Telemetry** | Hard caps (events/sec, spawn/sec, particles, MLS substeps, BAT/BFT resolution); distance/hardware tiers; breach window scheduling; debug/telemetry no-stall contract (L0–L3). |

---

## Volume VI — Implementation, Specs & Apps

**Path:** `ENCYCLOPEDIA/V6_IMPLEMENTATION_SPECS_AND_APPS/`

| Article | Content (consolidated) |
|--------|-------------------------|
| **01_Specs_Index_and_Contracts** | Full list of breach/splash/MLS specs: genesis, trigger catalog, event contract, spawn shape library, SF0/SF1 first principles, LOD/budget, visual/foam/bubble/energy/energy accounting, Phase 2 checklist, debug/telemetry, settings schema. |
| **02_Codebase_Monoliths_Index** | GPTWAVES_V7, OPUS_WAVES, BREACHABLE_EFFECTS, BUBBLES, FOAM, CAUSTICS, LIGHTING, UNDERWATER_EFFECTS, VOLUMETRIC_CLOUDS_V8, PROCEDURAL_SAND, SAILBOAT; file locations and purposes. |
| **03_Apps_and_Engines** | water-showcase-unified (GPT-V7, Opus, WebTide, Splash); oceansim-app (calibration, migration); standalone-wave-sim; wave-to-3d; WebTide (WebGPU FFT, BabylonJS). |
| **04_Settings_Architecture_and_NL_Syntax** | UnifiedWaterSettings; 275+ settings; NL/syntax mapping; physics/visual mapping; settings completeness audit; breach settings tree (oceansimv1.breach.*). |
| **05_Blueprints_and_Focus_Areas** | T1 blueprints overview; T2 blueprints (sphere-water coupling, Bezier dynamic settings, bubbles/foam, wave systems consolidation, breachable effects, splash breaching integration); focus areas (sphere-water, Bezier, bubbles/foam, waves, breach). |
| **06_Quality_Assurance_and_Drift_Prevention** | Development QA protocol; drift prevention protocol; genesis-before-feedback; visual success criteria; multi-AI coordination; GPT_5_2 handoff packet; auto-mode task queue. |

---

## Quick Reference: Where to Find What

| Topic | Volume | Article |
|-------|--------|---------|
| North star, evolution phases | I | 01, 02, 03 |
| Project state, re-alignment | I | 04 |
| Splash/MLS-MPM overview and physics | II | 01, 02 |
| Constraint LOD, ideas, implementation status | II | 03, 04, 05 |
| Hybrid ocean vision, two-layer/three-layer | III | 01, 04 |
| Hybrid wave tiers L0–L5, coupling | III | 02, 03 |
| Visual blending, seam elimination | III | 05 |
| Math models, dispersion, FFT, SWE, MPM | IV | 01 |
| Validation, symptom index, data dictionary | IV | 02, 03, 04 |
| Breach genesis, spawn primitives | V | 01 |
| Triggers, events, SF0/SF1 | V | 02, 03 |
| Foam, bubble, energy, visual contracts | V | 04 |
| Phase 2 sequence, LOD/budget/debug | V | 05, 06 |
| All specs list | VI | 01 |
| Codebase monoliths, apps, engines | VI | 02, 03 |
| Settings, blueprints, QA, drift prevention | VI | 04, 05, 06 |

---

## Source Consolidation Note

This encyclopedia was built by consolidating content from:

- `OCEANSIM_MASTER_PLAN.md`, `MASTER_INDEX.md`, `MASTER_DOCUMENTATION_INDEX.md`
- `integrations/splash/*` (HYBRID_OCEAN_*, SPLASH_*, GPT_5_2_*, HANDOFF_TO_GPT5_2, phase prep)
- `MLSMPM_*`, `MLS_MPM_*`, `SPLASH_INTEGRATION_*`, `SPLASH_BREACHING_*`
- `wave-physics-encyclopedia/*` (HYBRID_WAVE_SIMULATION_SYSTEM_MAP, MATHEMATICAL_MODELS, WAVE_*)
- `specs/*` (all BREACH_*, MLS_WORLD_UNITS_*, OCEANSIMV1_BREACH_*)
- `blueprints/*`, `codebase/*`, `audits/*`
- `PROJECT_STATE_CONSOLIDATION_*`, `DRIFT_PREVENTION_PROTOCOL`, `EVOLUTION_PHASE_1_*`

All substantive content from those sources is merged into the volume articles below; this master index is the single entry point.

---

**Last updated:** 2026-02-01


---

# Volume I — Vision, North Star & Master Plan

# Vision and Intent — Ocean Sim Expansion

**Volume I — Vision, North Star & Master Plan**  
**Consolidated from:** OCEANSIM_MASTER_PLAN.md, MASTER_INDEX.md, PROJECT_STATE_CONSOLIDATION

---

## Core Intent (What We're Building)

OceanSim is the dedicated application for **perfecting water simulation realism** and **dynamic controllability** in the browser, built on the GPTWAVES‑V7 foundation but evolved into:

1. **Hyper-realistic water + object interaction** — Depth-, speed-, and regime-aware coupling (Froude, wake structure).
2. **Perfect mapping** — Settings ↔ physics ↔ visuals ↔ relationships; every setting has clear, physically grounded relationships; no category mistakes (e.g. ripples mixed into main waves).
3. **Dynamic Bezier/graph modulation** — Opus Waves as the control layer; explicit inputs (speed, depth/submergence, Fr, wind, energy), explicit mapping (Bezier/Opus curves with defined X-axis normalization), explicit clamps/smoothing.
4. **Performance-first** — LOD tiers for every expensive subsystem; no blocking GPU readbacks in hot loops; stable update scheduling (no timing races); stable frametime.

---

## North Star (Evolution Target)

- **Relationship correctness > “more settings”** — We already have many settings; the goal is that every setting has clear relationships, relationships are physically grounded, and we avoid category mistakes.
- **Dynamic settings must be explainable** — Dynamic does *not* mean “mystery automation”; it means explicit inputs, mapping, and clamps.
- **Performance is a feature** — If an effect cannot run on mid-tier hardware at good FPS with LOD, it is not “OceanSim-ready.”

Primary performance constraints:

- Eliminate synchronous GPU readbacks in hot loops.
- Ensure stable update scheduling (no timing races).
- Provide LOD tiers for every expensive subsystem.

---

## What’s Already “Done Enough” (Don’t Redo)

These documents already give full project visibility; improve them only when needed:

- NL/Syntax mapping: `NL_SYNTAX_MAPPING_COMPREHENSIVE.md`
- Physics mapping: `PHYSICS_MAPPING_COMPREHENSIVE.md`
- Visual mapping: `VISUAL_MAPPING_COMPREHENSIVE.md`
- System relationships: `SYSTEM_RELATIONSHIP_MAP.md`
- Timing/perf map (S.A.M.-style): `SYSTEM_ARCHITECTURE_MAP_TIMING.md`
- Performance targets + LOD: `PERFORMANCE_OPTIMIZATION_GUIDE.md`
- Focus areas: `FOCUS_AREAS_AND_BLUEPRINTS.md`

Monoliths exist for external AI/audits; internal work should prioritize **evolution planning and implementation**.

---

## Evolution Scope (What We Evolve First)

### Primary focus: Water + object interaction (Phase 1)

Immediate evolution track:

- **Sphere ↔ water coupling realism** — Depth + speed + Fr, wake structure.
- **Dynamic Bezier/Opus relationships** — Curves that drive coupling and wave regimes.
- **Wave systems layering** — WaveStack: sim + swell + ripples + whitecaps + foam advection.
- **Bubbles + foam** — Event-driven entrainment, surface interaction.
- **Breachable effects** — Remove stalls, improve realism, correct taxonomy.

### Secondary focus: Semi-isolated mastery tracks (later integration)

These remain semi-isolated until water/object interaction is mastered:

- Volumetric clouds / lighting
- Procedural sand
- Sailboat (as its own deep physics domain)

---

## Splash Integration (Optional High-Fidelity Layer)

Splash (MLS-MPM) is **optional**. OceanSim must work perfectly with or without it.

When used:

- Event-triggered particle spawning.
- WebGPU particle simulation (40K–180K particles).
- Visual blending with heightfield.
- Performance-gated activation.

**Spec:** `integrations/SPLASH_INTEGRATION_PLAN.md`

---

## Summary

The vision is a **hyper-realistic, performance-first ocean/water system** with perfect mapping between settings, physics, and visuals, dynamic Bezier/Opus control, and LOD/perf gates. Primary evolution is water + object interaction (Phase 1); breach + Splash integration is Phase 4 and optional.


# Guiding Principles — Ocean Sim Expansion

**Volume I — Vision, North Star & Master Plan**  
**Consolidated from:** OCEANSIM_MASTER_PLAN.md, MASTER_INDEX.md, DRIFT_PREVENTION_PROTOCOL, DEVELOPMENT_QUALITY_ASSURANCE_PROTOCOL

---

## 1. Relationship Correctness > “More Settings”

We already have a lot of settings. The goal now is:

- Every setting has **clear relationships**.
- Relationships are **physically grounded**.
- We avoid category mistakes (e.g. ripples mixed into main waves).

**Ripples vs main waves (critical distinction):**

- **Ripples:** Special wind effect (texture-like); high-frequency, small-scale; moves with wind. **Not** part of main wave geometry.
- **Main waves:** Gravity-driven from object displacement; geometry displacement; low-frequency, large-scale; moves with object movement.

Mistake prevention: ripples and main waves must not share the same conceptual bucket or settings without explicit separation.

---

## 2. Dynamic Settings Must Be Explainable

Dynamic does *not* mean “mystery automation.” It means:

- **Explicit inputs** — Speed, depth/submergence, Froude, wind, energy.
- **Explicit mapping** — Bezier/Opus curves with defined X-axis normalization.
- **Explicit clamps/smoothing** — Stability and performance.

---

## 3. Performance Is a Feature

If an effect cannot run on mid-tier hardware at good FPS with LOD, it is not “OceanSim-ready.”

Primary performance constraints:

- **Eliminate synchronous GPU readbacks** in hot loops.
- **Stable update scheduling** — No timing races.
- **LOD tiers** for every expensive subsystem.

---

## 4. Genesis Before Feedback (Drift Prevention)

- Do **not** tune feedback until genesis is correct.
- **Visual success criteria:** “Wave crest becomes sheet” is success, not “no runaway waves.”
- **Stop conditions:** Check Step 2.5/2.6 (wave-conforming spawn, wave-inherited velocities) success before proceeding.
- Reference: PROJECT_STATE_CONSOLIDATION — Drift Analysis section.

---

## 5. Development Quality Assurance Protocol

- **Pre-development:** Validate physics mapping, relationship mapping, settings completeness; check for category mistakes (e.g. ripples vs main waves).
- **During development:** Validate physics, NL/Syntax, visual mapping; avoid mixing ripples/main waves.
- **Post-development:** Validate completeness, relationships, and mistake-prevention rules.

---

## 6. Multi-AI Coordination

- How Opus 4.5, Sonnet 4.5, GPT-5.2, and Auto Mode work together.
- When to use each AI; handoff protocols; drift prevention rules.
- GPT_5_2 handoff packet: mission, scope, key source docs, tooling constraints, drift tripwires, example task format.
- Auto-mode task queue: concrete tasks, code scanning, MCP tools, progress tracking.

---

## Summary

Guiding principles: relationship correctness over more settings; explainable dynamic settings; performance as a feature; genesis-before-feedback; QA and drift prevention; multi-AI coordination with clear handoffs and task queues.


# Evolution Phases and Roadmap — Ocean Sim Expansion

**Volume I — Vision, North Star & Master Plan**  
**Consolidated from:** OCEANSIM_MASTER_PLAN.md, MASTER_INDEX.md, EVOLUTION_PHASE_1_WATER_OBJECT_INTERACTION

---

## Phase 1: Realistic Coupling + Dynamic Control + Perf Gates (NOW)

**Goal:** Make object interaction physically plausible and tunable via curves, without perf spikes.

**Deliverables:**

- Depth/speed/Fr-aware coupling model (with explicit wake forcing).
- Dynamic curve contract (inputs + normalization + smoothing).
- Timing fixes for settings sync (avoid 1-frame stale refs when it matters).
- Remove/mitigate GPU readback stalls in the hot chain (e.g. buoyancy sampling path).
- Baseline LOD tiering for waves + particles.

**Spec:** `EVOLUTION_PHASE_1_WATER_OBJECT_INTERACTION.md`

---

## Phase 2: WaveStack Consolidation + Ripple Correctness

**Deliverables:**

- Clean layer toggles and isolation mode.
- Ripples as normal-only wind micro-effect (separate from main waves).
- Unified field outputs: height, normals, foam mask, flow indicators.

---

## Phase 3: Bubbles/Foam Realism Pass

**Deliverables:**

- Event-driven entrainment.
- Foam advection and decay that matches energy cues.
- Scalable LOD tiers.

---

## Phase 4: Breach Realism + Splash Integration

**Goal:** Replace simplified breach effects with physically correct particle physics where desired.

**Deliverables:**

- Tiered breach rendering (low/mid/high).
- No GPU readback stalls.
- Correct settings taxonomy and event linking to bubbles/foam.
- **Splash MLS-MPM integration (optional high-fidelity layer):**
  - Event-triggered particle spawning.
  - WebGPU particle simulation (40K–180K particles).
  - Visual blending with heightfield.
  - Performance-gated activation.

**Spec:** `integrations/SPLASH_INTEGRATION_PLAN.md`  
**Note:** Splash is **optional**. OceanSim must work perfectly with or without it.

---

## Next Concrete Steps

1. Use the phase spec checklist: `EVOLUTION_PHASE_1_WATER_OBJECT_INTERACTION.md`.
2. Ensure dynamic curve normalization is explicitly defined (so Bezier tuning is meaningful).
3. Ensure perf gates are explicit (no readbacks, stable update scheduling, LOD tiers).

---

## Phase 2 Breach Implementation (oceansimv1) — Current Status

| Step | Status | Notes |
|------|--------|-------|
| 2.1 – Unit System | ✅ COMPLETE | Gravity scaled correctly |
| 2.2 – η̇ Extraction | ✅ COMPLETE | Implemented in Step 2.6 (velocity shader) |
| 2.3 – Event Slot 0 | ⚠️ PARTIAL | Manual spawn exists, contract not formalized |
| 2.4 – Spawn Field | ✅ COMPLETE | SF0/SF1 computed, debug views available |
| 2.5 – Wave-Conforming Spawn | ✅ COMPLETE | Particles spawn on wave surface |
| 2.6 – Wave-Inherited Velocities | ✅ COMPLETE | Particles inherit wave momentum |
| 2.7 – Ride Window | ⚠️ IN PROGRESS | Tuning physics parameters (TUNING_GUIDE.md) |
| 2.8 – Cohesive Phase | ❌ NOT STARTED | After physics tuning stable |

**Genesis working:** Particles spawn as ribbon sheet on wave surface; particles inherit wave momentum. Auto-inject enabled by default. Current phase: physics tuning.

**Required action:** Tune physics parameters for stable, realistic behavior. See `TUNING_GUIDE.md`.

---

## Summary

Evolution is phased: Phase 1 (coupling + curves + perf), Phase 2 (WaveStack + ripples), Phase 3 (bubbles/foam), Phase 4 (breach + optional Splash). Phase 2 breach steps 2.1–2.6 are complete; 2.7–2.8 in progress or not started. Next concrete steps are Phase 1 checklist, curve normalization, and perf gates.


# Project State and Re-Alignment — Ocean Sim Expansion

**Volume I — Vision, North Star & Master Plan**  
**Consolidated from:** PROJECT_STATE_CONSOLIDATION_2026_01_07, MASTER_INDEX (Critical section), DRIFT_PREVENTION_PROTOCOL

---

## Purpose

- Complete project state audit.
- Current vs planned gap analysis.
- Drift analysis and prevention.
- Immediate action plan.
- Success criteria.

**Status:** Critical re-alignment document. Must read before any work.

---

## Current Implementation Status (Phase 2 Breach)

- **2.1 Unit System:** ✅ Complete — gravity scaled correctly.
- **2.2 η̇ Extraction:** ✅ Complete — implemented in Step 2.6 (velocity shader).
- **2.3 Event Slot 0:** ⚠️ Partial — manual spawn exists, contract not formalized.
- **2.4 Spawn Field:** ✅ Complete — SF0/SF1 computed, debug views available.
- **2.5 Wave-Conforming Spawn:** ✅ Complete — particles spawn on wave surface.
- **2.6 Wave-Inherited Velocities:** ✅ Complete — particles inherit wave momentum.
- **2.7 Ride Window:** ⚠️ In progress — tuning physics parameters (TUNING_GUIDE.md).
- **2.8 Cohesive Phase:** ❌ Not started — after physics tuning stable.

**Genesis working:** Particles spawn as ribbon sheet; particles inherit wave momentum; auto-inject enabled. Current phase: physics tuning.

---

## Drift Prevention Rules

1. **Genesis before feedback** — Do not tune feedback until genesis is correct.
2. **Visual success criteria** — “Wave crest becomes sheet” is success, not “no runaway waves.”
3. **Stop conditions** — Check Step 2.5/2.6 success before proceeding.

Reference: PROJECT_STATE_CONSOLIDATION_2026_01_07 — Section 9 (Drift Analysis).

---

## Immediate Action Plan

1. **Tune physics parameters** — Use TUNING_GUIDE.md; start with core physics, then genesis, then feedback.
2. **Do not proceed to 2.8** until 2.7 tuning is stable and success criteria are met.
3. **Validate** — Genesis working, physics stable; only then extend to cohesive phase and beyond.

---

## Success Criteria

- Genesis (2.5, 2.6) visually correct and stable.
- Ride window (2.7) tuned without runaway or obvious artifacts.
- No GPU readback stalls in hot path.
- All changes aligned with OCEANSIM_MASTER_PLAN and evolution phases.

---

## Coordination Documents

- **MULTI_AI_COORDINATION_PROTOCOL.md** — How AIs work together; handoffs; drift prevention.
- **DRIFT_PREVENTION_PROTOCOL.md** — Mandatory rules; genesis-before-feedback; stop conditions; drift tripwires.
- **GPT_5_2_HANDOFF_PACKET.md** — Mission, scope, key docs, tooling, drift tripwires, task format.
- **AUTO_MODE_TASK_QUEUE.md** — Concrete tasks, code scanning, MCP guidance, progress tracking.

---

## Summary

Project state is tracked in PROJECT_STATE_CONSOLIDATION; Phase 2 breach genesis (2.5, 2.6) is complete; ride window (2.7) is in progress. Re-alignment is enforced by drift prevention rules, immediate action plan, and success criteria. Coordination and handoff docs define how to work without drifting.


---

# Volume II — Splash & MLS-MPM

# Splash & MLS-MPM Overview — Ocean Sim Expansion

**Volume II — Splash & MLS-MPM**  
**Consolidated from:** SPLASH_INTEGRATION_SUMMARY, integrations/splash/SPLASH_HYBRID_OCEAN_SUMMARY, MLSMPM_IDEAS_MASTER_INDEX

---

## What Splash Is

Splash is a **WebGPU MLS-MPM (Moving Least Squares Material Point Method) fluid simulation** used for high-fidelity breaching effects: droplets, sheets, spray, curling lips, and thin-sheet behavior. It is **expensive** (40K–180K particles, multiple compute passes) and **localized**; it is intended to run only where needed (e.g. breach events), not over the full ocean.

---

## Splash Strengths

- **Superior droplet physics** — Real particle-based droplets.
- **Advanced lighting** — Narrow-Range Filter; better reflections/refractions.
- **Realistic breaching** — True fluid simulation with surface tension.
- **Particle interaction** — Droplets interact with each other.
- **Water sheets** — Natural water sheet formation.

---

## Splash Limitations

- **High cost** — 40K–180K particles, multiple compute passes.
- **Isolated system** — Currently only works in pool context.
- **Different shaders** — Incompatible with current ocean water rendering without integration work.
- **Overkill for non-breaching** — Too expensive for continuous waves.

---

## Core Idea: Conditional Activation

- **Use Splash (MLS-MPM) as a high-fidelity, expensive breaching layer** that activates only during breach events.
- **Use simpler effects** (metaball, foam-only, etc.) for non-breaching or low-intensity breaches.
- **Performance gates** prevent frame-time spikes (e.g. disable or reduce Splash if frame time > 16.67ms; instance/particle limits).

Right tool for the job: Splash for high-intensity breaches; metaball/general for medium/low; base ocean always active.

---

## Three-Layer Mental Model

1. **Layer 1: Base ocean surface (always active)** — Main waves, wind ripples, existing water shaders.
2. **Layer 2: Breach detection (conditional)** — Detect breach events; compute intensity; decide Splash vs simple.
3. **Layer 3: Breaching effects (conditional)** — Splash (high-fidelity) for high-intensity breaches; simple (performance) for medium/low.

---

## Key Components (Integration)

1. **Enhanced breach detection** — Multi-method (impulse, velocity, depth, area, Froude); combined scoring (0–1); intensity classification; Splash activation decision.
2. **Splash instance manager** — Localized Splash instances; coordinate transformation (pool → world); scale calibration; lifecycle management.
3. **Rendering decision system** — Performance gates; instance limits; quality LOD; adaptive quality.
4. **Shader integration** — Separate render passes; depth-aware compositing; shared lighting; seamless transition (see Vol III, Visual Blending).

---

## MLS-MPM Simulation Ideas (Consolidated)

Four main ideas documented in MLSMPM_SIMULATION_IDEAS_CONSOLIDATION and MLSMPM_IDEAS_MASTER_INDEX:

1. **Camera/character-following particle system** — Dynamic spawn/despawn with world-locked particles; particle radius follows camera/character; particles stay in world coordinates.
2. **Pool-to-pool siphon system** — Multi-level pools with gravity-driven flow; tunnel/siphon physics.
3. **Constraint-based LOD system** — Particles constrained to heightfield; conform-at-rest, break-and-recover, spatial LOD (see Vol II, Article 03).
4. **Hybrid ocean architecture** — Heightfield + MLS-MPM integration; two-layer (heightfield base + Splash detail); trigger detection (steepness, curvature, velocity) (see Vol III).

---

## Summary

Splash is the high-fidelity MLS-MPM breaching layer; it is used conditionally with performance gates and instance limits. Integration requires breach detection, instance management, rendering decisions, and shader integration. MLS-MPM ideas include camera-following particles, pool-to-pool siphon, constraint-based LOD, and hybrid ocean; these are detailed in other Volume II and III articles.


# MLS-MPM Physics and Algorithms — Ocean Sim Expansion

**Volume II — Splash & MLS-MPM**  
**Consolidated from:** Splash_MSL-MPM docs (SPLASH_PHYSICS_AND_ALGORITHMS), MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC, HANDOFF_TO_GPT5_2

---

## MLS-MPM Algorithm (Summary)

Moving Least Squares Material Point Method (MLS-MPM) is a particle–grid method:

1. **Particle to grid (P2G)** — Transfer mass and momentum from particles to grid (two passes: mass, then momentum).
2. **Grid update** — Apply forces (gravity, pressure), update grid velocities.
3. **Grid to particle (G2P)** — Transfer grid velocities back to particles; advect particles.
4. **Copy position** — Update position buffers for rendering.

Pressure is typically computed via **Tait equation** (equation of state for incompressible-like behavior). **Narrow-Range Filter** is used for depth/surface smoothing and screen-space fluid rendering.

---

## Tait Equation

Used for pressure from density: gives incompressible-like response and stable time steps when combined with CFL conditions. Exact form is implementation-specific; see SPLASH_PHYSICS_AND_ALGORITHMS and shader source (e.g. updateGrid.wgsl, p2g*, g2p*).

---

## Narrow-Range Filter

- Depth smoothing for screen-space fluid rendering.
- Reduces noise and improves surface quality; used in render pipeline (depth map → filter → composite).

---

## World Units and Timing (MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC)

- **Canonical units:** meters (world), seconds (time). Grid cell size and gravity must be in world scale (e.g. `uWorldCellSize`, world-scaled gravity).
- **Stability:** CFL condition and dt invariance; no “dt hacks” that break scale.
- **Verification:** Drop test, scale invariance, no new GPU readback stalls.
- **Calibration:** `heightScaleMeters`, `dt_step_seconds` under multi-substep scheduling; see HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC for η̇ extraction.

---

## World-Locked Particles

Particles are always in **world coordinates**, never camera-relative. Physics (gravity, collisions) runs in world space. Spawn/despawn (e.g. camera-following) only changes which particles are active; positions/velocities remain world-space.

---

## Shader Pipeline (Typical)

- clearGrid — Grid initialization.
- p2g_1, p2g_2 — Particle to grid (mass, momentum).
- updateGrid — Grid forces (gravity, pressure).
- g2p — Grid to particle; advect.
- copyPosition — Position buffer update.
- p2gDensity, clearDensityGrid, castDensityGrid — Density grid for rendering.
- depthMap, narrowRangeFilter — Screen-space fluid depth and smoothing.
- Ray-marched shadows — Optional; see SPLASH_PHYSICS_AND_ALGORITHMS.

---

## Summary

MLS-MPM is a P2G–grid–G2P pipeline with Tait pressure and narrow-range filtering for rendering. World units and timing are meters/seconds with world-scaled grid and gravity; stability is CFL and dt-invariant. Particles are world-locked; shader pipeline and calibration specs are in SPLASH_PHYSICS_AND_ALGORITHMS and MLS/HEIGHTFIELD specs.


# Constraint-Based LOD and Architecture — Ocean Sim Expansion

**Volume II — Splash & MLS-MPM**  
**Consolidated from:** MLSMPM_CONSTRAINT_BASED_LOD_ARCHITECTURE, integrations/splash PHASE_*_PREP, GPT_5_2_VALIDATED_ARCHITECTURE

---

## Core Concept

Particles can be **constrained to the heightfield** so that in calm or low-stress regions they conform to the surface (conform-at-rest); when stress exceeds a threshold they “break” and behave as full 3D MLS-MPM; when stress drops they can “recover” (re-constrain). This gives LOD: cheap conforming behavior where possible, expensive 3D only where needed.

---

## Phase 1 Prep: Conform at Rest

- **Conform-at-rest behavior** — Particles are constrained to heightfield surface when stress is below threshold.
- **Grid update shader modifications** — Grid nodes receive contribution from heightfield target surface so particles are pulled toward it when in conforming mode.
- **Implementation:** PHASE_1_PREP_CONFORM_AT_REST.md; HANDOFF_TO_GPT5_2 (03_PHASE_1_PREP, 02_VALIDATED_ARCHITECTURE).

---

## Phase 2 Prep: Break and Recover

- **Break** — When stress (e.g. curvature, velocity gradient) exceeds threshold, particles are released from heightfield constraint and simulated as full MLS-MPM.
- **Recover** — When stress drops below a lower threshold (hysteresis), particles can be re-attached to heightfield (conform again).
- **Stress threshold system** — Upper/lower bounds to avoid flicker; see PHASE_2_PREP_BREAK_AND_RECOVER.md.

---

## Phase 3 Prep: Spatial LOD

- **Distance-based LOD** — Reduce particle count or resolution with distance from camera/interaction.
- **Camera/interaction tracking** — Spawn/despawn or LOD tiers based on distance.
- **Smooth transitions** — Avoid pop; blend or fade LOD levels. See PHASE_3_PREP_SPATIAL_LOD.md.

---

## Phase 4 Prep: Animated Waves

- **Animated waves integration** — Heightfield target is animated (e.g. FFT ocean, Gerstner); conforming particles follow animated surface.
- **Target surface blending** — Blend between heightfield and particle surface at transition zones.
- **Normal blending** — Normals from heightfield and particles blended for seamless shading. See PHASE_4_PREP_ANIMATED_WAVES.md.

---

## Validated Architecture (GPT_5_2)

- **Constraint-based LOD** — Six non-negotiable laws (conform, break, recover, spatial LOD, animated target, performance gates).
- **Seven-module organization** — Conform, break/recover, spatial LOD, animated waves, trigger, spawn, render.
- **North Star** — One coherent system with conforming and 3D modes; no duplicate or conflicting physics. See GPT_5_2_VALIDATED_ARCHITECTURE.md, GPT_5_2_CONSTRAINT_BASED_LOD_HANDOFF.

---

## Summary

Constraint-based LOD: particles conform to heightfield at rest; break to full 3D when stress is high; recover when stress drops; spatial LOD and animated wave target complete the architecture. Phase 1–4 prep docs and GPT_5_2 validated architecture define the implementation path.


# Simulation Ideas Consolidation — Ocean Sim Expansion

**Volume II — Splash & MLS-MPM**  
**Consolidated from:** MLSMPM_SIMULATION_IDEAS_CONSOLIDATION, MLSMPM_IDEAS_MASTER_INDEX

---

## Idea 1: Camera/Character-Following Particle System

**Problem:** Full-world MLS-MPM is expensive; we need particles only where the camera/character is.

**Solution:** Dynamic spawn/despawn with **world-locked** particles:

- **Particle radius** follows camera/character position.
- **Particles** stay in **world coordinates** (do not move with camera).
- As camera moves: **despawn** particles behind, **spawn** ahead.
- Simulate only particles within spawn radius; physics in world space (gravity, collisions).

**Visual analogy:** Like walking through a pool — the pool stays in world space; we only simulate particles in a radius around the viewer.

**Implementation sketch:** Camera position; spawn radius and despawn radius (hysteresis); particle grid (world-locked); active set updated each frame; spawn new cells when they enter radius, despawn when they leave. See MLSMPM_SIMULATION_IDEAS_CONSOLIDATION for TypeScript-style interfaces and update loops.

---

## Idea 2: Pool-to-Pool Siphon System

**Concept:** Multi-level pools connected by tunnel/siphon; gravity-driven flow between pools; MLS-MPM in each pool; coupling at tunnel/siphon.

**Use cases:** Cascading pools, fountains, channel flow. Implementation details (tunnel geometry, flux coupling) are in the consolidation doc; lower priority than hybrid ocean and constraint LOD.

---

## Idea 3: Constraint-Based LOD System

Particles constrained to heightfield; conform at rest, break when stress high, recover when stress low; spatial LOD and animated waves. **See Vol II, Article 03 (Constraint_Based_LOD_and_Architecture).**

---

## Idea 4: Hybrid Ocean Architecture

Heightfield (base) + MLS-MPM (detail); trigger detection (steepness, curvature, velocity); two-way coupling (BFT). **See Vol III (Hybrid Ocean & Wave Systems).**

---

## Implementation Priority (from Consolidation)

1. **Hybrid ocean architecture** — Highest impact for ocean sim expansion.
2. **Constraint-based LOD** — Already documented (Phase 1–4 prep).
3. **Camera-following** — For large worlds or mobile; useful after hybrid works.
4. **Pool-to-pool siphon** — Niche; later.

---

## Code Patterns (Summary)

- **Spawn/despawn:** Distance to camera vs spawnRadius/despawnRadius; activate/deactivate cells or particles; hysteresis to avoid thrashing.
- **Grid-based spawn:** Cells in world space; camera cell; spawnRadiusCells; update which cells are active; spawn particles in newly active cells, despawn in inactive.
- **World-locked physics:** position, velocity in world space; gravity and collisions in world space; no camera-relative motion.

---

## Summary

Four ideas: camera-following particles (world-locked spawn/despawn), pool-to-pool siphon, constraint-based LOD, hybrid ocean. Priority: hybrid ocean and constraint LOD first; camera-following for scale; siphon for niche cases. Full code sketches and interfaces are in MLSMPM_SIMULATION_IDEAS_CONSOLIDATION.


# Implementation Status and Handoff — Ocean Sim Expansion

**Volume II — Splash & MLS-MPM**  
**Consolidated from:** MASTER_INDEX (Phase 2 status), HANDOFF_TO_GPT5_2, TUNING_GUIDE, integrations/splash implementation status docs

---

## Phase 2 Breach Implementation Status (oceansimv1)

| Step | Status | Notes |
|------|--------|-------|
| 2.1 – Unit System | ✅ COMPLETE | Gravity scaled correctly; world units (meters, seconds) |
| 2.2 – η̇ Extraction | ✅ COMPLETE | Implemented in velocity shader (Step 2.6) |
| 2.3 – Event Slot 0 | ⚠️ PARTIAL | Manual spawn exists; contract not formalized |
| 2.4 – Spawn Field | ✅ COMPLETE | SF0/SF1 computed; debug views available |
| 2.5 – Wave-Conforming Spawn | ✅ COMPLETE | Particles spawn on wave surface (ribbon sheet) |
| 2.6 – Wave-Inherited Velocities | ✅ COMPLETE | Particles inherit wave momentum |
| 2.7 – Ride Window | ⚠️ IN PROGRESS | Tuning physics (TUNING_GUIDE.md) |
| 2.8 – Cohesive Phase | ❌ NOT STARTED | After physics tuning stable |

**Genesis working:** Ribbon sheet spawn and wave-inherited inertia are in place. Auto-inject enabled by default. Current focus: tuning ride window and stability.

---

## HANDOFF_TO_GPT5_2 Contents

The handoff folder typically contains:

- **01_CRITICAL_CORRECTIONS.md** — Must-fix items before continuing.
- **02_VALIDATED_ARCHITECTURE.md** — Constraint-based LOD architecture; six laws; seven modules.
- **03_PHASE_1_PREP.md** — Conform-at-rest implementation steps.
- **04_mlsmpmShaders.ts** — Shader/MLS-MPM integration code (or stubs).
- **05_useMLSMPMSimulation.ts** — Hook or driver for MLS-MPM simulation.
- **06_simulationShaders.ts**, **07_useWaterSimulationV1.ts**, **08_OceanSimV1Scene.tsx**, **09_BreachDebugPanel.tsx** — Scene and debug wiring.
- **README.md** — How to use the handoff; order of operations.

Exact filenames and locations: `integrations/splash/HANDOFF_TO_GPT5_2/`.

---

## Tuning Guide (Summary)

- **Parameters:** MLS-MPM (e.g. grid size, dt, pressure), wave inheritance (velocity scale, blend), coupling (ride window, stress thresholds).
- **Order:** Tune core physics first, then genesis (spawn shape, velocity), then feedback (drain, impact).
- **Troubleshooting:** Too slow / too fast / erratic behavior → check TUNING_GUIDE.md checklist (parameter ranges, CFL, scale).
- **Success criteria:** Genesis visually correct; physics stable; no runaway growth; no GPU readback stalls.

---

## GPT_5_2 Phase 0/1 and Phase 2 Task Queues

- **Phase 0/1:** BFT seam proof; WebGL2 P2G/GPGPU proof; conform-at-rest. Status: complete.
- **Phase 2:** Spawn Field SF0/SF1 → ribbon sheet parcels → cohesive→yield → energy drain. Status: steps 2.1–2.6 complete; 2.7 in progress; 2.8 not started. See GPT_5_2_PHASE_2_TASK_QUEUE.md, GPT_5_2_PHASE_2_HANDOFF.

---

## Next Session Quick Start

1. Read PROJECT_STATE_CONSOLIDATION and DRIFT_PREVENTION_PROTOCOL.
2. Confirm genesis (2.5, 2.6) and open TUNING_GUIDE for 2.7.
3. Use HANDOFF_TO_GPT5_2 for code context and validated architecture.
4. Do not skip to 2.8 until 2.7 is stable and success criteria are met.

---

## Summary

Phase 2 breach: 2.1–2.6 complete (unit system, η̇, spawn field, wave-conforming spawn, wave-inherited velocities); 2.7 (ride window) in progress; 2.8 (cohesive phase) not started. HANDOFF_TO_GPT5_2 holds architecture, prep docs, and code; TUNING_GUIDE and task queues direct next steps and tuning order.


---

# Volume III — Hybrid Ocean & Wave Systems

# Hybrid Ocean Vision and Summary — Ocean Sim Expansion

**Volume III — Hybrid Ocean & Wave Systems**  
**Consolidated from:** SPLASH_HYBRID_OCEAN_SUMMARY, HYBRID_OCEAN_MASTER_DESIGN, integrations/splash HYBRID_OCEAN_*

---

## Vision

Create a **hybrid multi-scale ocean simulation** that combines:

1. **Efficient heightfield simulation** — Large-scale waves; cheap; covers large areas; 60 Hz update.
2. **Splash (MLS-MPM) fluid simulation** — Localized high-detail effects: breaching, splashes, droplets; expensive; localized; 120 Hz update (substeps).

**Result:** Film-like water behavior in real time, using expensive physics only where visuals demand it.

---

## Two-Layer System (Simplified)

```
┌─────────────────────────────────────┐
│   Heightfield Layer (Base)          │
│   – Large-scale waves               │
│   – Cheap, covers large areas       │
│   – 60 Hz update                    │
└─────────────────────────────────────┘
           │ Trigger Detection
           │ (steepness, curvature, velocity)
           ▼
┌─────────────────────────────────────┐
│   Splash Layer (Detail)             │
│   – MLS-MPM fluid simulation        │
│   – Breaching, splashes, droplets   │
│   – Expensive, localized            │
│   – 120 Hz update (substeps)        │
└─────────────────────────────────────┘
```

---

## Three-Layer Architecture (Full)

1. **Layer 1: Base Ocean (Infinite)** — Procedural/Gerstner waves; cheap; always active; far-field motion.
2. **Layer 2: 2.5D Heightfield (δ_sim)** — Local interactions (objects, walls, wakes); **dynamic limits** (inertia, severity); **heat map** for transition zones; when limits are approached → trigger 3D.
3. **Layer 3: 3D Particle Mesh Sheets** — Splash (MLS-MPM); breaching, curling, droplets; moves with 2.5D during transition; full 3D physics; two-way coupling (BFT) back to heightfield.

**Combined surface:** Seamless rendering; unified water body.

---

## 2.5D Dynamic Limits + Heat Map

The 2.5D heightfield has **dynamic limits** that vary with local wave energy, curvature, momentum, and interaction complexity:

- **Inertia limits** — How much momentum the heightfield can represent (e.g. wave speed, velocity magnitude, momentum density).
- **Severity limits** — Curvature limits (steepness, ∇²h, concave/convex).
- **General 2.5D limits** — Fundamental heightfield constraints.

The **heat map** identifies: regions approaching limits; transition windows (where 2.5D → 3D); sheet shape and thickness variation; timing for mesh creation.

---

## Delta Layering

**η_total = η_base + δ_sim + δ_breach**

- **η_base** — Base ocean (infinite, cheap).
- **δ_sim** — Sim delta (interactions; 2.5D heightfield).
- **δ_breach** — Breach delta (phase change; 3D particle sheets; BFT feedback).

---

## Key Innovation: LOD Strategy

- Ocean surface is **mostly heightfield** for performance.
- **Areas of high interaction** (steepness, curvature, velocity) trigger **full 3D Splash** simulation.
- Captures breaching, curling, spray with physical accuracy.
- Target: **16–33 ms per frame** (real-time).

---

## Design Evolution (Summary)

1. **Basic hybrid** — Heightfield + Splash detail layer; simple trigger.
2. **Delta-based layering** — η_total = η_base + δ_sim + δ_breach.
3. **Two-way coupling (BFT)** — Breach feeds back into heightfield; ring waves and aftermath.
4. **Particle spawn shaping** — Ribbon geometry, crest-aligned basis, curling momentum.
5. **2.5D dynamic limits + heat map** — Inertia/severity limits; heat map for transition; sheet moves with 2.5D.

---

## Summary

Hybrid ocean = heightfield (base) + Splash (detail) with trigger detection and two-way coupling. Three-layer architecture: base ocean, 2.5D heightfield with dynamic limits and heat map, 3D particle sheets. Delta layering and BFT ensure one coherent surface and no “VFX on top” look.


# Hybrid Wave System Map (L0–L5) — Ocean Sim Expansion

**Volume III — Hybrid Ocean & Wave Systems**  
**Consolidated from:** wave-physics-encyclopedia HYBRID_WAVE_SIMULATION_SYSTEM_MAP

---

## Core Problem

We want a system that delivers simultaneously:

- **Convincing far-field ocean** (cheap).
- **Correct-ish dispersion + wakes + shoreline interactions** (mid cost).
- **Believable breaking, foam, spray, thin-sheet behavior** (expensive, localized).

And we want it **AI-debuggable:** every feature has an owner module; every module has state contracts; every symptom has a diagnostic flow and validation scenario.

---

## The Hybrid Ladder (Tiered Representations)

### L0 — Shading-only micro detail (always on)

**Goal:** High-frequency “water-ness” (wind shimmer) even when simulation is coarse.

- **Representations:** Animated normal maps; procedural noise; wind streak/patch texture (2D field).
- **Owned phenomena:** Wind micro-roughness patches; small capillary-like detail (visual).

---

### L1 — Kinematic surface (cheap base motion)

**Goal:** Stable, controllable base waves.

- **Options:** Sum-of-sines; Gerstner waves (horizontal displacement, sharper crests).
- **Owned phenomena:** Coherent wave motion; controllable “choppiness” (appearance).

---

### L2 — Spectral ocean (FFT)

**Goal:** Physically plausible wave spectra and dispersion.

- **Options:** Phillips/JONSWAP spectrum + FFT.
- **Outputs:** Displacement (x,y,z); normals (for shading); optional slope/steepness diagnostics.

---

### L3 — Heightfield PDE (bulk flow + shoreline + wakes)

**Goal:** Interaction with bathymetry, flooding, boundary reflections, near-field wakes.

- **Options:** SWE solver; SWE + dispersive surface wave partition.
- **Outputs:** Height and horizontal velocity fields; foam density field (optional); bathymetry coupling.

---

### L4 — Event-driven volumetric “bubble” (breaking + splashes)

**Goal:** Locally simulate 3D effects: curling lips, spray, sheet breakup, high-energy impacts.

- **Options:** SPH bubble (WaveWake design); FLIP/MPM micro-sim.
- **Outputs:** Particles (position/velocity/attributes); impulses back to L3/L2; foam/spray emission events.

---

### L5 — Reconstruction (particles → surface/thickness/foam)

**Goal:** Convert L4 particle sets into renderable surfaces and fields.

- **Options:** Screen-space metaballs (fast); implicit surface / SDF volume (slower); meshing (rare, hero-only).
- **Reality constraint:** Preserving hollow structures (e.g. barrels) is non-trivial; isotropic reconstructions tend to bridge gaps.

---

## Coupling Contracts (How Layers Talk)

- **L2 (FFT) ↔ L3 (SWE/dispersive):** L2 provides boundary swell to L3; L3 provides depth-aware refraction/shoaling near shore. Minimal: L2 displacement everywhere; L3 adds “interaction displacement” + “flow” additively in near regions.
- **L3 ↔ L4 (event trigger & seeding):** Trigger signals (steepness/Jacobian, object impact, shoreline steepening). Seeding: spawn particles over surface patch; seed initial velocity from L3 horizontal velocity + wave orbital estimate. Feedback: deposit impulses into L3; update foam density and spray events.
- **L4 ↔ L5 (reconstruction):** Rendering needs surface/thickness for refraction/SSS; normals for specular; foam coverage / bubble density for whitewater.

---

## Frame Pipeline (Canonical Ordering)

Each frame:

1. Update wind field (L0 input).
2. Advance base ocean (L1 or L2).
3. Advance near-field solver (L3).
4. Run event detection (breaking/impact/wake).
5. Spawn/step L4 bubbles as needed.
6. Reconstruct L5 surfaces/fields (if any active bubbles).
7. Compose final displacement/normals/foam.
8. Render.

Order errors are a common source of “it looks wrong” (stale normals, incorrect buffers, mismatched state).

---

## Debuggability Requirements

For each tier/module: **state contract** (units/ranges/cadence) → DATA_DICTIONARY; **owner symptoms** → WAVE_SYMPTOM_TO_FIX_INDEX; **validation rules** → WAVE_VALIDATION_RULES; **cross references** → WAVE_CROSS_REFERENCE_INDEX; **scenarios** → CANONICAL_SCENARIOS.

---

## Summary

L0–L5: shading-only → kinematic → FFT → heightfield PDE → event-driven volumetric → reconstruction. Coupling contracts and frame pipeline define how layers talk and in what order. Debuggability is enforced via state contracts, symptom index, validation rules, and canonical scenarios.


# Two-Way Coupling and Integration — Ocean Sim Expansion

**Volume III — Hybrid Ocean & Wave Systems**  
**Consolidated from:** SPLASH_INTEGRATION_TWO_WAY_COUPLING, SPLASH_INTEGRATION_SUMMARY, HYBRID_OCEAN_MASTER_DESIGN (BFT)

---

## BFT (Breach Feedback Texture) System

**Purpose:** Breach (Splash/MLS-MPM) must **feed back** into the heightfield so the result is one coherent water body, not “VFX on top.”

- **Feedback:** Particle impacts and sheet collapse deposit into a feedback texture (BFT); heightfield reads BFT and adds ring waves, aftermath, foam.
- **Prevents:** “VFX overlay” look; double-counting energy; stale heightfield.
- **Ring waves and aftermath:** BFT drives heightfield updates so breach aftermath is visible in the base ocean.

---

## Delta Layering

**η_total = η_base + δ_sim + δ_breach**

- **η_base** — Base ocean (procedural/Gerstner; infinite, cheap).
- **δ_sim** — Sim delta (2.5D heightfield; local interactions, objects, wakes).
- **δ_breach** — Breach delta (3D particle sheets; BFT contribution to heightfield).

Combined surface is rendered as one; no separate “breach layer” that doesn’t affect the base.

---

## L2 (FFT) ↔ L3 (SWE / Dispersive) Coupling

- **Recommended:** L2 provides boundary swell to L3 regions; L3 provides depth-aware refraction/shoaling near shore.
- **Minimal viable:** L2 displacement everywhere; L3 adds “interaction displacement” + “flow” additively in near regions.

---

## L3 ↔ L4 (Event Trigger & Seeding) Coupling

- **Trigger signals:** Steepness/Jacobian threshold (breaking onset); object intersection + impact energy; shoreline steepening (shoaling).
- **Seeding:** Spawn particles over surface patch; seed initial velocity from L3 horizontal velocity + wave orbital velocity estimate.
- **Feedback:** Deposit impulses back into L3 (height/velocity); update foam density and spray events.

---

## Integration Strategies (Rendering)

1. **Separate render passes (recommended)** — Render Splash in separate pass; composite with base ocean; clean separation; easy to disable/enable.
2. **Unified shader system** — Merge Splash shaders into OceanSim; single pass; complex; tight coupling.
3. **Hybrid approach (best)** — Separate passes but shared data (lighting, normals, context); clean separation + shared context; flexible and maintainable.

---

## Seam Elimination

- **Depth-aware compositing** — Splash and heightfield composite with correct depth so no Z-fighting or seams.
- **Shared lighting/normals** — Same IOR, sky, light, tone-mapping so Splash and ocean match.
- **Visual integration contract** — See specs BREACH_VISUAL_INTEGRATION_CONTRACT_SPEC; canonical shared inputs and composite ordering.

---

## Summary

Two-way coupling: BFT feeds breach back into heightfield; delta layering (η_base + δ_sim + δ_breach) keeps one coherent surface. L2↔L3 and L3↔L4 coupling contracts define trigger, seeding, and feedback. Integration strategy: hybrid (separate passes, shared data); seam elimination via depth-aware compositing and visual contract.


# Heightfield and Splash Layers — Ocean Sim Expansion

**Volume III — Hybrid Ocean & Wave Systems**  
**Consolidated from:** HYBRID_OCEAN_MASTER_DESIGN, integrations/splash 2.5D_DYNAMIC_LIMITS_SYSTEM

---

## Layer 1: Base Ocean (Infinite)

- **Content:** Procedural/Gerstner waves; cheap; always active.
- **Role:** Provides far-field motion; no local interactions.
- **Always sampled** by Layer 2.

---

## Layer 2: 2.5D Heightfield (δ_sim)

- **Content:** Local interactions (objects, walls, wakes); dynamic limits (inertia, severity); heat map for transition zones.
- **Role:** Handles bulk flow and near-field; when limits are approached, triggers Layer 3.
- **Dynamic limits:**
  - **Inertia limits** — Max momentum the heightfield can represent (wave speed, velocity magnitude, momentum density).
  - **Severity limits** — Curvature limits (steepness, ∇²h, concave/convex).
- **Heat map:** Identifies regions approaching limits; transition windows; sheet shape and thickness; timing for 3D mesh creation.
- **Transition window:** Four phases (detect, prepare, spawn, blend); sheet moves with 2.5D during transition.

---

## Layer 3: 3D Particle Mesh Sheets (Splash)

- **Content:** Splash (MLS-MPM); breaching, curling, droplets; full 3D physics.
- **Role:** High-fidelity detail where 2.5D fails; two-way coupling (BFT) back to heightfield.
- **Triggered when:** Heat map indicates limits approached (inertia or severity).
- **Moves with 2.5D** during transition so no pop or disconnect.

---

## Combined Surface

- **Seamless rendering** — One water body; displacement/normals/foam from base + sim + breach.
- **Unified water body** — No “layer on top” look; BFT and delta layering ensure coherence.

---

## 2.5D Dynamic Limits (Detail)

**Inertia limit calculation (concept):** Wave speed c = √(g h); max velocity ≈ c × safety factor; max momentum density; velocity gradient. When exceeded → heightfield cannot represent momentum accurately → transition to 3D; particles inherit momentum from heightfield.

**Severity limit calculation (concept):** Max steepness |∇h|; max curvature ∇²h; max concave depth (troughs); max convex height (peaks). When exceeded → transition to 3D; particles inherit position/velocity from heightfield at transition.

---

## Summary

Three layers: base ocean (infinite), 2.5D heightfield (dynamic limits + heat map), 3D particle sheets (Splash). Combined surface is one coherent water body with seamless rendering and BFT feedback.


# Visual Blending and Seam Elimination — Ocean Sim Expansion

**Volume III — Hybrid Ocean & Wave Systems**  
**Consolidated from:** SPLASH_VISUAL_BLENDING_STRATEGY, SPLASH_INTEGRATION_SEAM_ELIMINATION_GUIDE, BREACH_VISUAL_INTEGRATION_CONTRACT_SPEC

---

## Strategies

1. **Separate render passes** — Render Splash in separate pass; composite with base ocean; clean separation; easy to disable/enable.
2. **Unified shader system** — Merge Splash shaders into OceanSim; single pass; complex; tight coupling.
3. **Hybrid (recommended)** — Separate passes but **shared data** (lighting, normals, context); clean separation + shared context; flexible and maintainable.

---

## Depth-Aware Compositing

- Splash and heightfield are composited with **correct depth** so no Z-fighting or visible seams.
- Depth buffer from heightfield is read when rendering Splash (or vice versa) so ordering is correct.
- Post-style composite ordering preferred to avoid depth lies (see BREACH_VISUAL_INTEGRATION_CONTRACT_SPEC).

---

## Shared Lighting and Normals

- **Canonical shared inputs:** IOR, sky, light, tone-mapping, underwater mode.
- Splash and ocean use the **same** lighting and environment so reflection/refraction match.
- Normals from heightfield and particles can be **blended** at transition zones for smooth shading (see Phase 4 prep: target surface blending, normal blending).

---

## Visual Integration Contract (Summary)

- **Refraction/reflection contract** — Avoid “double water”; one coherent surface.
- **Caustics + foam continuity** — Breach foam and ocean foam from one pipeline (e.g. uBubbleFoamTex); caustics continuous across breach/ocean.
- **Underwater continuity** — Underwater view sees breach aftermath (bubbles, foam) consistently.
- **Debug views** — Required views for tuning: η, BFT, BAT, spawn, drain, foam, air (see BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC).

---

## Seam Elimination Checklist

- Depth-aware compositing; no Z-fighting.
- Shared IOR, sky, light, tone-mapping.
- Foam from one truth (breach deposits → foam field).
- Caustics continuous.
- Underwater view consistent.
- Debug views available without GPU readback stalls.

---

## Summary

Visual blending: hybrid strategy (separate passes, shared data); depth-aware compositing; shared lighting/normals; visual integration contract (refraction/reflection, foam, caustics, underwater); seam elimination checklist and debug views.


---

# Volume IV — Wave Physics Reference

# Mathematical Models — Ocean Sim Expansion

**Volume IV — Wave Physics Reference**  
**Consolidated from:** wave-physics-encyclopedia MATHEMATICAL_MODELS_FOR_WAVE_SIMULATION, WAVE_PHYSICS_REALITY_LAYER

---

## Model Selection Map (Fast Orientation)

| Goal | Typical model | Captures | Common misses |
|------|----------------|----------|----------------|
| Cheap far-field motion | Sines / Gerstner | Coherent motion, controllable look | Dispersion, energy transfer, realistic wake physics |
| Real ocean spectra | Spectral + FFT | Wind-driven multi-scale waves, dispersion, choppiness | Shoreline flooding, complex obstacles |
| Shoreline + flooding + wakes | SWE | Depth effects, flow, boundary interactions | Deep-water dispersion (without extension) |
| Deep+shallow in one heightfield | SWE + dispersive surface waves | Bulk flow + dispersive surface waves | Breaking/overturning volume |
| Breaking + splashes | SPH / FLIP / MPM (local) | Overturning, topology change, spray | Expensive; needs coupling |
| Thin sheets + surface tension | Cut-cell / sub-grid | Sheet fidelity, obstacles, surface tension | Complexity; research-grade |

---

## Linear Wave Theory (Reference Baseline)

**Dispersion relations:**

- **Deep-water gravity waves:** ω² = g k.
- **Shallow-water gravity waves:** c = √(g h) (approximately non-dispersive).
- **Capillary–gravity, finite depth:** ω² = (g k + (σ/ρ) k³) tanh(k h).

**Derived speeds:** Phase speed c = ω/k; group speed c_g = dω/dk.

**Gives:** Correct wavelength-dependent speeds (dispersion) when used. **Does not give:** Breaking, aeration, spray.

---

## Procedural / Kinematic Surface Models (Fastest Tier)

**Sum of sines:** η(x,t) = Σ A_i sin(k_i·x − ω_i t + φ_i). Pros: extremely cheap, stable, easy art-direction. Cons: repetition, no wave–wave interaction; wake physics must be faked.

**Gerstner waves:** Parametric surface with horizontal displacement and steepness control. Pros: sharper crests, controllable “choppiness.” Cons: still kinematic (not momentum-conserving); breaking must be heuristic-triggered.

---

## Spectral Oceans (FFT)

**Frequency-domain representation:** Ocean as superposition of Fourier modes: H(k,t) = H0(k) exp(i ω(k) t); inverse FFT for spatial displacement/height.

**Key ingredients:** Spectrum model H0(k) (energy distribution; wind-driven); dispersion relation ω(k); directional spreading around wind direction; optional “choppiness” via horizontal displacement.

**Practical note:** Phase continuity under parameter changes avoids visible “jumping” when adjusting wind/size.

---

## Heightfield PDE Solvers (Bulk Flow and Boundaries)

**Shallow Water Equations (SWE):** State: height h(x,t), depth-averaged horizontal velocity u(x,t). Captures: flooding, flow, shoreline interactions, boundary conditions (reflect/absorb). Misses (plain SWE): realistic deep-water dispersion.

**Dispersive surface waves + SWE hybrid:** Partition wave motion into bulk flow (SWE-like) and surface waves (Airy-like); solve each with appropriate methods; recombine velocities each step. High-value for “near shore + wakes + deep-water feel” in one heightfield system.

---

## Volumetric / Particle Methods (SPH / MPM Intuition)

**SPH core idea:** Represent fluid as particles carrying mass and velocity; use kernels to estimate density and gradients. For waves: overturning, splashes, breakup, topological changes emerge naturally if stable.

**Event-driven “SPH bubble” hybrid:** Base ocean remains 2.5D (FFT/heightfield); detect breaking/intersection events; spawn local particle bubble seeded by surface state; feed results back into surface (foam density, impulses). Matches hierarchical LOD mindset (L0–L5).

**MPM (Material Point Method):** Particle–grid method; P2G, grid update, G2P; stable for large deformation and thin sheets; used in Splash (MLS-MPM). See Vol II, MLS_MPM_Physics_and_Algorithms.

---

## Summary

Model selection map: sines/Gerstner (cheap), FFT (spectra), SWE (shoreline/wakes), SWE+dispersive (deep+shallow), SPH/FLIP/MPM (breaking). Linear wave theory gives dispersion; procedural/kinematic give cheap base; spectral FFT gives spectra; heightfield PDE gives bulk flow; volumetric/particle methods give breaking and splashes. MPM is used in Splash for high-fidelity breach layer.


# Validation Rules and Symptom Index — Ocean Sim Expansion

**Volume IV — Wave Physics Reference**  
**Consolidated from:** wave-physics-encyclopedia WAVE_VALIDATION_RULES, WAVE_SYMPTOM_TO_FIX_INDEX, HYBRID_WAVE_SIMULATION_SYSTEM_MAP (debuggability)

---

## Debuggability Requirements (Per Tier)

For each tier/module (L0–L5):

- **State contract** (units, ranges, cadence) → DATA_DICTIONARY.yaml.
- **Owner symptoms** → WAVE_SYMPTOM_TO_FIX_INDEX.yaml.
- **Validation rules** → WAVE_VALIDATION_RULES.md.
- **Cross references** (physics ↔ math ↔ code) → WAVE_CROSS_REFERENCE_INDEX.yaml.
- **Scenarios** → CANONICAL_SCENARIOS.yaml.

---

## Validation Rules (Summary)

- **Units:** All state in canonical units (e.g. meters, seconds); no “dt hacks” that break scale.
- **Ranges:** State variables within defined ranges; CFL and stability checks.
- **Cadence:** Update frequency and ordering (frame pipeline) explicit; no stale buffers.
- **Conservation:** Energy drain at spawn; impact-gated feedback; no free energy (see BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC).
- **Performance:** No GPU readback stalls in hot path; LOD/budget enforced (see BREACH_LOD_AND_BUDGET_POLICY_SPEC, BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC).

---

## Symptom-to-Fix Index (Concept)

- **Symptom:** e.g. “breach looks like VFX on top,” “runaway waves,” “stale normals,” “frame spike.”
- **Diagnostic flow:** Which module owns the symptom; which state/contract to check; which validation rule applies.
- **Validation scenario:** Canonical test (e.g. drop test, scale invariance, breaking onset) that reproduces or rules out the symptom.

Exact mapping: WAVE_SYMPTOM_TO_FIX_INDEX.yaml; WAVE_VALIDATION_RULES.md.

---

## Cross Reference (Physics ↔ Math ↔ Code)

- **Physics:** e.g. η (surface height), η̇ (vertical velocity), u (horizontal velocity), steepness |∇η|, curvature ∇²η.
- **Math:** Dispersion ω(k), Tait pressure, P2G/G2P formulas, SF0/SF1 channel formulas.
- **Code:** Shader uniforms (uHeightTex, uVelocityTex, etc.); hooks (useBreachFeedback, useWaterSimulation); specs (BREACH_*, HEIGHTFIELD_*, MLS_*).

WAVE_CROSS_REFERENCE_INDEX.yaml and DATA_DICTIONARY.yaml link physics, math, and code.

---

## Summary

Validation: state contracts, symptom-to-fix index, validation rules, cross references, canonical scenarios. Rules cover units, ranges, cadence, conservation, and performance. Debuggability is enforced per tier via DATA_DICTIONARY, WAVE_SYMPTOM_TO_FIX_INDEX, WAVE_VALIDATION_RULES, WAVE_CROSS_REFERENCE_INDEX, CANONICAL_SCENARIOS.


# Data Dictionary and Cross Reference — Ocean Sim Expansion

**Volume IV — Wave Physics Reference**  
**Consolidated from:** wave-physics-encyclopedia DATA_DICTIONARY, WAVE_CROSS_REFERENCE_INDEX, MASTER_KNOWLEDGE_INDEX

---

## Key Symbols and State (Summary)

- **η (eta)** — Surface height (meters); heightfield state.
- **η̇ (eta dot)** — Vertical velocity of surface (m/s); used for breach triggers and wave-inherited particle velocity.
- **u** — Horizontal velocity (m/s); depth-averaged in SWE; used for seeding L4 particles.
- **h** — Water depth (meters); used in SWE and dispersion.
- **k** — Wavenumber (1/m); used in dispersion ω(k).
- **ω** — Angular frequency (1/s); dispersion relation ω(k).
- **BAT** — Breach Analysis Texture; channels for steepness, curvature, η̇ proxy; trigger gates.
- **BFT** — Breach Feedback Texture; feedback from L4 (particles) to L3 (heightfield); ring waves, aftermath.
- **EBT** — Event Buffer Textures; GPU layouts for breach events; spawn pass wiring.
- **SF0, SF1** — Spawn Field textures; channels (X, C, L, Ω, F); SF → ribbon sheet parcel mapping.

---

## Units and Cadence

- **Space:** Meters (world).
- **Time:** Seconds.
- **Grid:** uWorldCellSize (meters per cell); uHeightScaleMeters (height scale).
- **Cadence:** Frame pipeline (L0 → L1/L2 → L3 → event detection → L4 → L5 → compose → render); no stale buffers; update frequency per tier (e.g. 60 Hz base, 120 Hz L4 substeps).

---

## Cross Reference (Physics ↔ Math ↔ Code)

- **Physics** — η, η̇, u, steepness, curvature, energy; breach trigger families (crest breaking, object impact, wall slap, wind whitecaps).
- **Math** — Dispersion ω² = g k; Tait pressure; P2G/G2P; SF0/SF1 formulas; normalization ranges.
- **Code** — Shader uniforms (uHeightTex, uVelocityTex, uBAT, uBFT, uSF0, uSF1); hooks (useBreachFeedback, useWaterSimulation, useMLSMPMSimulation); specs (BREACH_*, HEIGHTFIELD_*, MLS_*).

Exact mapping: WAVE_CROSS_REFERENCE_INDEX.yaml; DATA_DICTIONARY.yaml; MASTER_KNOWLEDGE_INDEX.md.

---

## References PDF Library

wave-physics-encyclopedia REFERENCES_PDF_LIBRARY.md lists external references (e.g. Dispersive_Waves_in_SWE.pdf). Use for deep dives on dispersive SWE and related methods.

---

## Summary

Data dictionary: η, η̇, u, h, k, ω, BAT, BFT, EBT, SF0/SF1; units (meters, seconds) and cadence. Cross reference links physics, math, and code; WAVE_CROSS_REFERENCE_INDEX and DATA_DICTIONARY are the authoritative sources.


# Canonical Scenarios — Ocean Sim Expansion

**Volume IV — Wave Physics Reference**  
**Consolidated from:** wave-physics-encyclopedia CANONICAL_SCENARIOS, specs (verification criteria), MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC

---

## Purpose

Canonical scenarios are **reference tests** for validation: they reproduce or rule out symptoms, verify scale invariance, and check that state contracts and validation rules hold.

---

## Scenarios (Summary)

1. **Drop test** — Single drop into pool; check splash shape, decay, no runaway; verify MLS-MPM timing and scale (MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC).
2. **Scale invariance** — Same setup at different world scales; behavior should scale with meters/seconds; no “slow-motion” or “speed-up” from wrong dt/scale.
3. **Breaking onset** — Ramp steepness/curvature until breach triggers; check trigger threshold, spawn shape, wave-inherited velocity; verify BAT/η̇ calibration (HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC).
4. **Object impact** — Object hits surface; check impact trigger, spawn shape (crown, sheet), energy drain and feedback; verify BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC.
5. **Ride window** — Particle sheet “rides” wave briefly then detaches; check ride window timing, cohesive phase → yield; verify BREACH_GENESIS_WAVE_DRIVEN_ORGANIC_SPAWN_SPEC and SF0/SF1 (BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC).
6. **No GPU readback stall** — Run with debug/telemetry enabled; confirm no frame spike from readback; verify BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC.

---

## Verification Criteria (from Specs)

- **MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC:** Drop test, scale invariance, no new stalls.
- **BREACH_*_SPEC:** Trigger/spawn/energy/visual/LOD/debug as per each spec.
- **HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC:** η̇ extraction in m/s; sanity checks.

---

## Summary

Canonical scenarios: drop test, scale invariance, breaking onset, object impact, ride window, no readback stall. They validate state contracts, calibration, and performance; exact list and steps are in CANONICAL_SCENARIOS.yaml and the breach/heightfield/MLS specs.


---

# Volume V — Breach, Spawn & Effects

# Breach Genesis and Organic Spawn — Ocean Sim Expansion

**Volume V — Breach, Spawn & Effects**  
**Consolidated from:** BREACH_GENESIS_WAVE_DRIVEN_ORGANIC_SPAWN_SPEC, BREACH_SPAWN_SHAPE_LIBRARY_AND_DEFAULTS_SPEC, SPAWN_FIELD_INTEGRATION_SUMMARY

---

## Wave-Driven Breach Genesis

**Goal:** Breach particles are born from wave/object state in an **organic** way: wave-driven organic spawn shape + wave-inherited inertia + ride window.

**Spawn primitives:**

- **Radial crown** — Impact splash (e.g. object drop).
- **Crest ribbon (surf lip)** — Wave crest overturning; ribbon along crest.
- **Whitecaps** — Wind-driven micro-break.
- **Wall impact sheet** — Wall slap; sheet along wall.
- **Object splash** — Object intersection; impulse map, planing sheets, crown.

**GPU-friendly measurement:** η (height), η̇ proxy (vertical velocity), slope |∇η|, curvature |∇²η|, crest heuristics. Used for trigger gates and spawn shape (see Vol V, Article 02).

**Ride window:** Brief attachment of particles to wave surface before full 3D; wave-inherited velocity; then detachment (cohesive phase → yield).

**Energy accounting:** Drain carrier wave energy when spawning breach particles; avoid double-counting and runaway (see Vol V, Article 04).

---

## Spawn Shape Library and Defaults

**World-unit parameter defaults:** Meters, m/s, seconds; no “magic constants.”

**Energy01 → radius/particleCount/velocity/thickness/rideTau mapping curves:** Spawn intensity (0–1) maps to spawn geometry and timing; “organic guarantees” to avoid perfect coin symmetry (annulus bias, anisotropy, edge noise).

**Spawn primitives (concrete):** Radial crown, crest ribbon/surf lip, wall impact sheet, whitecap microbreak; default parameter ranges; energy01 mapping.

---

## SF0/SF1 (Spawn Field) — First Principles

**Unified GPU-driven Spawn Field (SF0/SF1) texture system** for deterministic sheet birth:

- **SF0/SF1 texture layout:** Channels (X, C, L, Ω, F) with exact formulas; normalization ranges (stable across scene scales); running percentile adaptation.
- **SF → ribbon sheet parcel mapping:** Geometry (crest-aligned basis, curling momentum); initial velocity (wave-inherited); cohesive phase (material locking + release via φ scalar).
- **Cohesive phase → yield → liquid evolution:** Particles “ride” then detach; yield when stress or time threshold; then full MLS-MPM.
- **Conservation bridge:** Energy drain at spawn; return on impact (impact-gated feedback).
- **Visibility rules:** Only render above-surface particles.
- **Object specialization:** Impulse map, planing sheets, crown splashes.
- **Taxonomy:** One system with modes (whitecap/spill/plunge/slam). Supersedes BAT and unifies wave-driven + object-driven breaches.

**Spec:** BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC (authoritative).

---

## Summary

Breach genesis: wave-driven organic spawn (radial crown, crest ribbon, whitecaps, wall impact, object splash); ride window and wave-inherited inertia; energy accounting. Spawn shape library and defaults in world units; energy01 mapping and organic guarantees. SF0/SF1 first-principles emitter: texture layout, SF → ribbon parcel mapping, cohesive phase → yield, conservation bridge, visibility rules, object specialization; one system with modes.


# Trigger, Measurement and Event Contract — Ocean Sim Expansion

**Volume V — Breach, Spawn & Effects**  
**Consolidated from:** BREACH_TRIGGER_AND_MEASUREMENT_CATALOG_SPEC, BREACH_EVENT_CONTRACT_AND_GPU_DATA_LAYOUT_SPEC, HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC

---

## Breach Analysis Texture (BAT)

**Channels:** Steepness |∇η|, curvature |∇²η|, η̇ proxy (vertical velocity); optional energy, crest heuristics.

**Update frequency:** Per frame or substep; resolution tiers (LOD).

**Derived metrics:** Steepness, curvature, η̇ proxy calibration (see HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC for η̇ extraction in m/s).

---

## Trigger Families

- **Crest breaking** — Steepness/Jacobian threshold (breaking onset).
- **Object impacts** — Object intersection + impact energy.
- **Wall slap** — Wall intersection + velocity.
- **Wind whitecaps** — Wind-driven micro-break (optional).

**Hysteresis/cooldowns:** Avoid rapid on/off; energy accounting to avoid runaway (see BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC).

**Spawn event schema:** Event type, position, energy, shape; extraction strategies (probe/reduction); **no hot readbacks** (see BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC).

---

## Event Contract and GPU Data Layouts

**Event Buffer Textures (EBT):** Fixed-slot layouts + packing; staged event production: CPU-authored (manual/object) → probe-based → BAT reduction.

**Spawn pass inputs/outputs:** Position/velocity textures; “life/alive” concept; no hot readbacks.

**Breach windows + substeps scheduling:** When to run MLS; when to run spawn; when to run BFT; breach window scheduling to protect FPS (see BREACH_LOD_AND_BUDGET_POLICY_SPEC).

**Energy accounting hooks:** Drain at spawn; impact-gated feedback (see BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC).

---

## η̇ Calibration (Heightfield)

**info.g:** Solver accumulator (typically Δη per step for v7-style integrator).

**Two extraction methods:** Finite difference on η (preferred) vs info.g / dt_step.

**dt_step_seconds:** Definition under multi-substep scheduling.

**heightScaleMeters:** Definition and sanity checks.

**Spec:** HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC. Required for breach triggers + wave-inherited MLS inertia (no dt hacks).

---

## Summary

Trigger catalog: BAT channels (steepness, curvature, η̇); trigger families (crest, object, wall, whitecaps); hysteresis/cooldowns; spawn event schema; extraction strategies (no hot readbacks). Event contract: EBT layouts; spawn pass I/O; breach windows and substeps; energy accounting hooks. η̇ calibration: info.g, dt_step, heightScaleMeters; exact extraction and sanity checks in HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC.


# Spawn Field SF0/SF1 First Principles — Ocean Sim Expansion

**Volume V — Breach, Spawn & Effects**  
**Consolidated from:** BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC, SPAWN_FIELD_INTEGRATION_SUMMARY

---

## SF0/SF1 Texture Layout

**Channels (X, C, L, Ω, F):** Exact formulas per channel; normalization ranges (stable across scene scales); running percentile adaptation.

**Purpose:** GPU-driven Spawn Field for deterministic sheet birth; supersedes BAT for spawn geometry and initial state.

---

## SF → Ribbon Sheet Parcel Mapping

**Geometry:** Crest-aligned basis; curling momentum; coherent water structures (ribbon, not blob).

**Initial state:** Position from SF; velocity from wave-inherited + SF; cohesive phase (material locking + release via φ scalar).

**Cohesive phase → yield → liquid evolution:** Particles “ride” wave briefly (ride window); yield when stress or time threshold; then full MLS-MPM (liquid).

---

## Conservation Bridge

**Energy drain at spawn:** When spawning breach particles, drain carrier wave energy (η̇ first; optional η volume drain) so no free energy.

**Return on impact:** Impact-gated feedback via BFT; deposit impulses back into heightfield; no continuous pumping by default.

**Stability:** Dissipation requirements (BFT decay, turbulence damping); guardrails + stability alarms (detect monotonic growth). See BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC.

---

## Visibility Rules

**Only render above-surface particles:** Below-surface particles are not rendered (or use separate underwater path); avoids “floating” artifacts and keeps one coherent surface.

---

## Object Specialization

**Impulse map:** Object impact → impulse direction and magnitude; spawn shape (crown, sheet) from impulse.

**Planing sheets:** Object planing on surface → sheet along contact; velocity from object + wave.

**Crown splashes:** Object penetration → radial crown; energy from impact.

---

## Taxonomy: One System with Modes

**Modes:** Whitecap (wind micro-break), spill (crest spill), plunge (crest plunge), slam (object/wall impact). One SF0/SF1 system with mode selection per event; no duplicate spawn systems.

---

## Integration with Other Specs

**Supersedes:** BAT for spawn geometry and initial state (BAT still used for trigger detection).

**Enhanced:** BREACH_GENESIS_WAVE_DRIVEN_ORGANIC_SPAWN_SPEC (spawn primitives, ride window); BREACH_SPAWN_SHAPE_LIBRARY_AND_DEFAULTS_SPEC (defaults, energy01 mapping).

**Unchanged:** Trigger catalog (BAT, trigger families); event contract (EBT); energy accounting; LOD/budget; visual/foam/bubble contracts.

---

## Summary

SF0/SF1: texture layout (X, C, L, Ω, F); SF → ribbon sheet parcel mapping (geometry, initial state, cohesive phase → yield → liquid); conservation bridge (drain at spawn, impact-gated feedback); visibility rules; object specialization (impulse map, planing sheets, crown); one system with modes (whitecap/spill/plunge/slam). Authoritative spec: BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC.


# Foam, Bubble, Energy and Visual Contracts — Ocean Sim Expansion

**Volume V — Breach, Spawn & Effects**  
**Consolidated from:** BREACH_FOAM_PIPELINE_CONTRACT_SPEC, BREACH_BUBBLE_AIR_ENTRAINMENT_CONTRACT_SPEC, BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC, BREACH_VISUAL_INTEGRATION_CONTRACT_SPEC

---

## One Foam Truth (Foam Pipeline)

**Breach deposits → persistent foam field → uBubbleFoamTex.** One coherent foam pipeline; no duplicate foam systems.

**BFT.B as foam deposit channel:** Breach deposits into BFT.B; foam field consumes it; decay + staged advection (wind first, richer flow later).

**LOD/budget tie-in:** Foam resolution and update frequency per tier; foam-first fallback when particle budget exhausted. See BREACH_LOD_AND_BUDGET_POLICY_SPEC.

---

## Bubble Air Entrainment

**Breach → subsurface air entrainment:** Bubble density field feeding underwater scattering/glints (and optional bubble particles).

**Deposit model:** From impacts/sheets (airAdd); depth distribution; staged rise/decay evolution.

**Integration options:** Reuse v7 bubble pool vs GPU air-field RT (recommended for OceanSimV1).

**Foam surfacing transfer:** Air → foam when bubbles surface; consistent with one foam truth.

**LOD/budget integration:** Bubble field resolution and update per tier; seam pitfalls (e.g. uBubbleStrength coupling). See BREACH_BUBBLE_AIR_ENTRAINMENT_CONTRACT_SPEC.

---

## Energy Accounting

**Heightfield energy proxies:** η and η̇; normalized energy01 usage for spawn intensity.

**Mandatory drain at spawn:** Drain η̇ first; optional η volume drain; no free energy.

**Impact-gated feedback via BFT:** No continuous pumping by default; deposit impulses on impact; dissipation requirements (BFT decay, turbulence damping).

**Guardrails + stability alarms:** Detect monotonic growth; prevent runaway. See BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC.

---

## Visual Integration Contract

**Canonical shared inputs:** IOR, sky, light, tone-mapping, underwater mode. Splash and ocean use same inputs so reflection/refraction match.

**Post-style composite ordering (preferred):** Avoid depth lies; correct ordering of heightfield, breach, foam, caustics.

**Refraction/reflection contract:** Avoid “double water”; one coherent surface.

**Caustics + foam continuity:** Breach foam and ocean foam from one pipeline; caustics continuous across breach/ocean.

**Underwater continuity:** Underwater view sees breach aftermath (bubbles, foam) consistently.

**Debug views:** Required views (η, BFT, BAT, spawn, drain, foam, air) without GPU readback stalls. See BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC.

---

## Summary

Foam: one foam truth (breach → foam field → uBubbleFoamTex); BFT.B deposits; decay/advection; LOD/budget. Bubble: air entrainment from breach; deposit model; rise/decay; foam surfacing transfer; LOD/budget. Energy: drain at spawn; impact-gated feedback; dissipation; guardrails. Visual: shared inputs; composite ordering; refraction/reflection; caustics/foam/underwater continuity; debug views.


# Phase 2 Implementation Sequence — Ocean Sim Expansion

**Volume V — Breach, Spawn & Effects**  
**Consolidated from:** BREACH_PHASE2_IMPLEMENTATION_SEQUENCE_CHECKLIST_SPEC, MASTER_INDEX (Phase 2 status)

---

## Ordered Steps (Execution Checklist)

1. **Scale/timing** — Unit system (meters, seconds); world-scaled gravity and grid (MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC); dt_step and heightScaleMeters (HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC).
2. **η̇ calibration** — On-GPU extraction of η̇ in m/s; sanity checks; no dt hacks.
3. **Events** — BAT channels; trigger families; hysteresis/cooldowns; event contract and EBT layouts (BREACH_TRIGGER_AND_MEASUREMENT_CATALOG_SPEC, BREACH_EVENT_CONTRACT_AND_GPU_DATA_LAYOUT_SPEC).
4. **Wave-shaped spawn** — SF0/SF1; SF → ribbon sheet parcel mapping; wave-conforming spawn (Step 2.5); wave-inherited velocities (Step 2.6) (BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC, BREACH_GENESIS_WAVE_DRIVEN_ORGANIC_SPAWN_SPEC).
5. **Inertia** — Wave-inherited initial velocity; ride window; cohesive phase → yield.
6. **Ride window** — Tuning (TUNING_GUIDE); success criteria (genesis correct, physics stable).
7. **Drain** — Mandatory energy drain at spawn; impact-gated feedback (BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC).
8. **Foam/bubbles** — Foam pipeline (BFT.B → foam field); bubble air entrainment; LOD/budget (BREACH_FOAM_PIPELINE_CONTRACT_SPEC, BREACH_BUBBLE_AIR_ENTRAINMENT_CONTRACT_SPEC).
9. **Visuals** — Visual integration contract; composite ordering; seam elimination (BREACH_VISUAL_INTEGRATION_CONTRACT_SPEC).
10. **LOD/budget** — Hard caps; distance/hardware tiers; breach window scheduling (BREACH_LOD_AND_BUDGET_POLICY_SPEC).

---

## Stop Conditions and Verification Gates

- **Stop if:** Genesis (2.5, 2.6) not correct; runaway or monotonic growth; GPU readback stall; scale/timing wrong.
- **Verification gates:** Drop test; scale invariance; breaking onset; object impact; ride window; no readback stall (CANONICAL_SCENARIOS, MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC).
- **Drift prevention:** Genesis before feedback; visual success criteria; do not skip to 2.8 until 2.7 stable (DRIFT_PREVENTION_PROTOCOL, PROJECT_STATE_CONSOLIDATION).

---

## Current Status (Summary)

- **2.1–2.6:** ✅ Complete (unit system, η̇, spawn field, wave-conforming spawn, wave-inherited velocities).
- **2.7 Ride window:** ⚠️ In progress (tuning; TUNING_GUIDE).
- **2.8 Cohesive phase:** ❌ Not started (after 2.7 stable).

---

## Summary

Phase 2 sequence: scale/timing → η̇ → events → wave-shaped spawn → inertia → ride window → drain → foam/bubbles → visuals → LOD. Stop conditions and verification gates prevent drift; current status: 2.1–2.6 complete, 2.7 in progress, 2.8 not started. Authoritative checklist: BREACH_PHASE2_IMPLEMENTATION_SEQUENCE_CHECKLIST_SPEC.


# LOD, Budget and Debug/Telemetry — Ocean Sim Expansion

**Volume V — Breach, Spawn & Effects**  
**Consolidated from:** BREACH_LOD_AND_BUDGET_POLICY_SPEC, BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC, OCEANSIMV1_BREACH_SETTINGS_SCHEMA_AND_UI_BINDINGS_SPEC

---

## Hard Caps (LOD and Budget)

**Global caps:** Events/frame; spawn/frame; spawn/sec; active particle caps; MLS substeps; BAT/BFT/EBT resolution and frequency tiers; screen-space fluid render RT tiers; fallback strategy (e.g. foam-first when particle budget exhausted).

**Distance tiers:** Near/mid/far; reduce resolution or disable breach at far distance.

**Hardware tiers (H0/H1/H2):** Low/mid/high; caps and resolution per tier.

**Breach window scheduling:** Run MLS only when active; avoid running full breach pipeline when no breach events; protects FPS.

**Spec:** BREACH_LOD_AND_BUDGET_POLICY_SPEC. Makes breach realism shippable on varied hardware.

---

## Debug and Telemetry — No Stall Contract

**Telemetry levels:**

- **L0 — CPU-only:** No GPU readback; CPU-side counters only.
- **L1 — GPU-visual:** Debug views (η, BFT, BAT, spawn, drain, foam, air) rendered to texture; no readback to CPU in hot path.
- **L2 — Throttled micro-readback:** Occasional 1×1 reduction or inset readback at low Hz; never in hot loop.
- **L3 — Forbidden:** No heavy readback in frame-critical path; no synchronous readback in hot chain.

**Canonical GPU-safe patterns:** Probe textures; 1×1 reductions; inset views; Hz throttling.

**Stall tripwires:** Code banners; audit grep rules; no readback in buoyancy sampling path or breach spawn hot path.

**Required debug views:** η, BFT, BAT, spawn, drain, foam, air (see BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC). Protects performance while enabling deep tuning.

---

## Settings Schema and UI Bindings (oceansimv1.breach.*)

**Authoritative settings tree:** trigger/BAT, events/EBT, spawn shapes, inertia/ride window, energy drain, coupling/BFT, foam, air, visuals, LOD, debug/telemetry.

**Defaults, units, relationships:** World units (meters, m/s, seconds); safe baseline defaults (stable, worth-seeing, H1-friendly).

**RightDrawer bindings:** NL/Syntax mapping for perfect settings ↔ physics ↔ visuals. See OCEANSIMV1_BREACH_SETTINGS_SCHEMA_AND_UI_BINDINGS_SPEC.

---

## Summary

LOD/budget: hard caps (events, spawn, particles, MLS, BAT/BFT/EBT resolution, fluid RT tiers); distance and hardware tiers; breach window scheduling. Debug/telemetry: no-stall contract (L0–L3); GPU-safe patterns; required debug views; stall tripwires. Settings: oceansimv1.breach.* schema and UI bindings; defaults and units; NL/Syntax mapping.


---

# Volume VI — Implementation, Specs & Apps

# Specs Index and Contracts — Ocean Sim Expansion

**Volume VI — Implementation, Specs & Apps**  
**Consolidated from:** specs/* (all BREACH_*, MLS_*, HEIGHTFIELD_*, OCEANSIMV1_*), MASTER_INDEX (specs section)

---

## Full List of Specs (oceansim/docs/specs/)

| Spec | Purpose (short) |
|------|------------------|
| **MLS_WORLD_UNITS_TIMING_AND_SCALE_SPEC** | Meters/seconds; world-scaled grid and gravity; CFL and dt invariance; drop test, scale invariance, no stalls. |
| **BREACH_GENESIS_WAVE_DRIVEN_ORGANIC_SPAWN_SPEC** | Wave-driven breach genesis; spawn primitives; ride window; energy accounting. |
| **BREACH_TRIGGER_AND_MEASUREMENT_CATALOG_SPEC** | BAT channels; derived metrics; trigger families; hysteresis/cooldowns; spawn event schema; no hot readbacks. |
| **HEIGHTFIELD_INFOG_ETADOT_CALIBRATION_SPEC** | info.g; η̇ extraction in m/s; dt_step_seconds; heightScaleMeters; sanity checks. |
| **BREACH_EVENT_CONTRACT_AND_GPU_DATA_LAYOUT_SPEC** | EBT layouts; spawn pass I/O; breach windows; energy accounting hooks. |
| **BREACH_SPAWN_SHAPE_LIBRARY_AND_DEFAULTS_SPEC** | Spawn primitives; world-unit defaults; energy01 mapping; organic guarantees. |
| **BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC** | SF0/SF1 layout (X, C, L, Ω, F); SF → ribbon parcel mapping; cohesive phase → yield; conservation bridge; visibility; object specialization; one system with modes. **Authoritative.** |
| **BREACH_LOD_AND_BUDGET_POLICY_SPEC** | Hard caps; distance/hardware tiers; breach window scheduling. |
| **BREACH_VISUAL_INTEGRATION_CONTRACT_SPEC** | Shared inputs; composite ordering; refraction/reflection; caustics/foam/underwater continuity; debug views. |
| **BREACH_FOAM_PIPELINE_CONTRACT_SPEC** | One foam truth; BFT.B deposits; decay/advection; LOD/budget. |
| **BREACH_BUBBLE_AIR_ENTRAINMENT_CONTRACT_SPEC** | Air entrainment; deposit model; rise/decay; foam surfacing; LOD/budget. |
| **BREACH_ENERGY_ACCOUNTING_CONTRACT_SPEC** | Drain at spawn; impact-gated feedback; dissipation; guardrails; no free energy. |
| **BREACH_PHASE2_IMPLEMENTATION_SEQUENCE_CHECKLIST_SPEC** | Ordered steps; stop conditions; verification gates. **Execution checklist.** |
| **BREACH_DEBUG_AND_TELEMETRY_NO_STALL_CONTRACT_SPEC** | L0–L3 telemetry; GPU-safe patterns; required debug views; stall tripwires. |
| **OCEANSIMV1_BREACH_SETTINGS_SCHEMA_AND_UI_BINDINGS_SPEC** | oceansimv1.breach.* tree; defaults, units, relationships; RightDrawer bindings; NL/Syntax mapping. |
| **BOAT_COUPLING_EVOLUTION_OUTLINE** | Boat coupling evolution (optional; secondary focus). |

---

## Where to Find What

- **Genesis, spawn shapes, ride window:** BREACH_GENESIS_*, BREACH_SPAWN_*, BREACH_SPAWN_FIELD_*.
- **Triggers, events, BAT, EBT:** BREACH_TRIGGER_*, BREACH_EVENT_*, HEIGHTFIELD_*.
- **Foam, bubble, energy, visual:** BREACH_FOAM_*, BREACH_BUBBLE_*, BREACH_ENERGY_*, BREACH_VISUAL_*.
- **LOD, budget, debug:** BREACH_LOD_*, BREACH_DEBUG_*, OCEANSIMV1_BREACH_*.
- **Execution order:** BREACH_PHASE2_IMPLEMENTATION_SEQUENCE_CHECKLIST_SPEC.
- **Scale/timing:** MLS_WORLD_UNITS_*, HEIGHTFIELD_*.

---

## Summary

All breach/splash/MLS and heightfield specs are listed above with short purpose. Authoritative first-principles emitter: BREACH_SPAWN_FIELD_FIRST_PRINCIPLES_EMITTER_SPEC. Execution checklist: BREACH_PHASE2_IMPLEMENTATION_SEQUENCE_CHECKLIST_SPEC. Settings schema: OCEANSIMV1_BREACH_SETTINGS_SCHEMA_AND_UI_BINDINGS_SPEC.


# Codebase Monoliths Index — Ocean Sim Expansion

**Volume VI — Implementation, Specs & Apps**  
**Consolidated from:** codebase/CODEBASE_MONOLITHS_INDEX, MASTER_INDEX (codebase monoliths section)

---

## Location

**Path:** `oceansim/docs/codebase/`

**Index:** `codebase/CODEBASE_MONOLITHS_INDEX.md`

---

## Complete Monoliths (11/11)

| Monolith | Purpose (short) |
|----------|------------------|
| **GPTWAVES_V7_CODEBASE_MONOLITH** | GPTWAVES-V7 complete code documentation; main wave engine; GptwavesV7Scene.tsx + hooks + shaders. |
| **OPUS_WAVES_CODEBASE_MONOLITH** | Opus Waves (Bezier curves); dynamic modulation layer; graph outputs → settings bindings. |
| **BREACHABLE_EFFECTS_CODEBASE_MONOLITH** | Breachable effects; breach, bubbles, foam; BFT/BAT integration. |
| **BUBBLES_CODEBASE_MONOLITH** | Bubbles; entrainment, rise/decay; bubble pool or GPU air-field. |
| **FOAM_CODEBASE_MONOLITH** | Foam; one foam truth; BFT.B → foam field; decay/advection. |
| **CAUSTICS_CODEBASE_MONOLITH** | Caustics; lighting; continuity across breach/ocean. |
| **LIGHTING_CODEBASE_MONOLITH** | Lighting; shared IOR, sky, light; reflection/refraction. |
| **UNDERWATER_EFFECTS_CODEBASE_MONOLITH** | Underwater effects; scattering, glints; continuity. |
| **VOLUMETRIC_CLOUDS_V8_CODEBASE_MONOLITH** | Volumetric clouds V8; semi-isolated; integration later. |
| **PROCEDURAL_SAND_CODEBASE_MONOLITH** | Procedural sand; semi-isolated; integration later. |
| **SAILBOAT_CODEBASE_MONOLITH** | Sailboat; semi-isolated; integration later. |

---

## Source Code Locations (Typical)

- **Main app:** water-showcase-unified (or copyunifiedwaves/water-showcase-unified); React + TypeScript + Three.js (and BabylonJS for WebTide).
- **GPTWAVES-V7 engine:** `src/engines/gptwaves-v7/` (GptwavesV7Scene.tsx, components, shaders, hooks, boats, physics, utils, config).
- **OceanSimV1 / breach:** oceansim-app or water-showcase-unified oceansimv1 engine; MLS-MPM, BFT, breach shaders, spawn field.
- **WebTide:** `src/engines/webtide/` (WebTideEngine.tsx, waterMaterial, spectrum); WebGPU FFT ocean (BabylonJS).
- **Settings type:** `src/types/WaterSettings.ts` (UnifiedWaterSettings, webtide, splash, breach, etc.).

---

## Summary

Eleven codebase monoliths document GPTWAVES_V7, OPUS_WAVES, BREACHABLE_EFFECTS, BUBBLES, FOAM, CAUSTICS, LIGHTING, UNDERWATER_EFFECTS, VOLUMETRIC_CLOUDS_V8, PROCEDURAL_SAND, SAILBOAT. Index and file locations in codebase/CODEBASE_MONOLITHS_INDEX.md and MASTER_INDEX.


# Apps and Engines — Ocean Sim Expansion

**Volume VI — Implementation, Specs & Apps**  
**Consolidated from:** MASTER_INDEX (code & app references), OCEANSIM_DOCS_AND_WEBTIDE_INVESTIGATION, oceansim-app docs

---

## water-showcase-unified (Unified Water App)

**Path:** `oceansim/water-showcase-unified` or `oceansim/copyunifiedwaves/water-showcase-unified`

**Type:** React + TypeScript + Three.js (and BabylonJS for WebTide).

**Engines (simulation backends):**

- **GPT-V7 (sim-gptwaves-v7)** — GPTWAVES-V7; heightfield waves; main wave engine.
- **Opus (opus-waves)** — Opus Waves; Bezier curves; dynamic modulation.
- **WebTide (sim-webtide)** — WebGPU FFT ocean (BabylonJS); Tessendorf-style spectrum; selectable as “WebTide (WebGPU FFT)” in UI.
- **Splash** — MLS-MPM fluid (breach/splash); optional; performance-gated.
- **Others** — Per App.tsx and EngineSelector (e.g. standalone sand, volumetric clouds).

**Docs:** Documentation/ (and webtide/ under Documentation for WebTide); UNIFIED_WATER_APP_IMPROVEMENT_PLAN; WATER_SHOWCASE_UNIFIED_MASTER_INDEX (if present).

---

## oceansim-app (Splash Calibration / OceanSimV1)

**Path:** `oceansim/oceansim-app/`

**Purpose:** Dedicated app for Splash calibration and hybrid ocean development; OceanSimV1 breach engine; MLS-MPM, BFT, spawn field, breach settings.

**Docs:** `oceansim-app/docs/` (MASTER_INDEX, MIGRATION_AUDIT, MIGRATION_PLAN, SETTINGS_ARCHITECTURE, MLS_MPM_TEST_SCENARIOS, REPLACEMENT_PROGRESS, HARDCODED_DEFAULTS_APPROACH); `oceansim-app/SPLASH_CALIBRATION_APP_SETUP.md`.

**Status:** Documentation phase complete; migration and tuning in progress (see MASTER_INDEX, PROJECT_STATE_CONSOLIDATION).

---

## standalone-wave-sim

**Path:** `oceansim/standalone-wave-sim/`

**Purpose:** Standalone wave simulation; clean testbed; GPT-V7 port; integration roadmap for MLS-MPM. Docs: COMPLETE_USAGE_GUIDE, GPT_5_2_*, INTEGRATION_ROADMAP, LAUNCHER_INFO, PORT_STATUS, etc.

---

## wave-to-3d

**Path:** `oceansim/wave-to-3d/`

**Purpose:** Wave-to-3D comparison and R3F implementations. Docs: GPTWAVES_VS_WAVE_TO_3D_FINAL_COMPARISON, R3F_COMPARISON_*, WAVE_TO_3D_ANALYSIS_AND_COMPARISON.

---

## WebTide (WebGPU FFT Ocean)

**Code:** `oceansim/copyunifiedwaves/water-showcase-unified/src/engines/webtide/` (WebTideEngine.tsx, waterMaterial.ts, spectrum/); WebTidePage; WebTideSettingsDrawer; WaterSettings.webtide.

**Docs:** `Documentation/webtide/` (WEBTIDE_OVERVIEW, WEBTIDE_SETTINGS_AND_PARAMS, WEBTIDE_IMPROVEMENT_PLAN). No token limit; WebTide is one engine in the unified app.

---

## Summary

Unified water app (water-showcase-unified) hosts GPT-V7, Opus, WebTide, Splash, and other engines. oceansim-app is the Splash calibration / OceanSimV1 app. standalone-wave-sim and wave-to-3d are standalone/test apps. WebTide is WebGPU FFT (BabylonJS); docs under Documentation/webtide/.


# Settings Architecture and NL/Syntax — Ocean Sim Expansion

**Volume VI — Implementation, Specs & Apps**  
**Consolidated from:** NL_SYNTAX_MAPPING_COMPREHENSIVE, COMPLETE_SETTINGS_AUDIT, SETTINGS_COMPLETENESS_AUDIT, OCEANSIMV1_BREACH_SETTINGS_SCHEMA_AND_UI_BINDINGS_SPEC

---

## UnifiedWaterSettings (Typical)

**Path:** water-showcase-unified `src/types/WaterSettings.ts` (or equivalent).

**Structure:** ~500+ individual parameters; 18+ major groups (e.g. waves, sphere, breach, foam, bubbles, caustics, lighting, webtide, splash, boats, volumetric clouds, procedural sand, sailboat, etc.).

**Breach settings tree:** `oceansimv1.breach.*` — trigger/BAT, events/EBT, spawn shapes, inertia/ride window, energy drain, coupling/BFT, foam, air, visuals, LOD, debug/telemetry. Authoritative schema: OCEANSIMV1_BREACH_SETTINGS_SCHEMA_AND_UI_BINDINGS_SPEC.

---

## NL/Syntax Mapping

**Purpose:** Map every setting to natural language and syntax; 275+ settings; 13 major categories; NL descriptions, syntax, relationships, physics, visual effects.

**Document:** NL_SYNTAX_MAPPING_COMPREHENSIVE.md (master reference). Status: complete (100%) per MASTER_INDEX.

**Requirements:** Database-quality tracking; perfect mapping (settings ↔ physics ↔ visuals ↔ relationships); mistake prevention (e.g. ripples vs main waves).

---

## Settings Audits

- **COMPLETE_SETTINGS_AUDIT:** All settings documented; descriptions; missing settings identified.
- **SETTINGS_COMPLETENESS_AUDIT:** Missing/simplified/hardcoded settings; breachable effects complete audit; priority settings to add.
- **System-specific audits:** VOLUMETRIC_CLOUDS_V8_*, PROCEDURAL_SAND_*, SAILBOAT_*, BREACHABLE_EFFECTS_* (complete settings audits per system).

---

## Physics and Visual Mapping

- **PHYSICS_MAPPING_COMPREHENSIVE:** Map every setting to real physics; core physics models; wave systems; wind & ripples (separate from main waves); sphere-water coupling; breachable effects; bubble, foam, wake, caustics, lighting, underwater, sailboat physics.
- **VISUAL_MAPPING_COMPREHENSIVE:** Map every setting to expected visual effects; wave system visuals; wind ripples (separate); breachable visuals; bubble, foam, wake, caustics, lighting, underwater visuals; visual validation checklist.
- **SYSTEM_RELATIONSHIP_MAP:** Core system relationships; wave system relationships; wind & ripples relationships; effects system relationships; physics/visual system relationships; relationship matrix; mistake prevention rules.

---

## Summary

Settings: UnifiedWaterSettings (~500+ params); oceansimv1.breach.* tree (authoritative schema). NL/Syntax mapping: 275+ settings; 13 categories; NL_SYNTAX_MAPPING_COMPREHENSIVE. Audits: COMPLETE_SETTINGS_AUDIT, SETTINGS_COMPLETENESS_AUDIT, system-specific audits. Physics and visual mapping: PHYSICS_MAPPING_COMPREHENSIVE, VISUAL_MAPPING_COMPREHENSIVE, SYSTEM_RELATIONSHIP_MAP.


# Blueprints and Focus Areas — Ocean Sim Expansion

**Volume VI — Implementation, Specs & Apps**  
**Consolidated from:** blueprints/*, MASTER_INDEX (focus areas, blueprints), FOCUS_AREAS_AND_BLUEPRINTS

---

## Blueprints Location

**Path:** `oceansim/docs/blueprints/`

**Index:** T1_blueprints_overview.md (blueprint navigation hub).

---

## Blueprint List

| Blueprint | Purpose (short) |
|-----------|------------------|
| **T1_blueprints_overview** | Index; water/object interaction evolution; navigation. |
| **T2_blueprint_sphere_water_coupling** | Depth + speed + Froude-aware coupling; explicit wake forcing model. |
| **T2_blueprint_bezier_dynamic_settings** | Opus Waves integration; graph outputs → settings bindings; dynamic modulation. |
| **T2_blueprint_bubbles_and_foam** | Event-driven bubbles + foam; entrainment model; LOD tiers. |
| **T2_blueprint_wave_systems_consolidation** | WaveStack layering + isolation; ripples as wind micro normal-only effect; LOD + scaling. |
| **T2_blueprint_breachable_effects** | Breach evolution; eliminate GPU readback stalls; tiered renderer; taxonomy fix. |
| **T2_blueprint_splash_breaching_integration** | Splash breaching integration; hybrid ocean; two-way coupling; visual blending. |

---

## Focus Areas (Primary: Water & Object Interaction)

1. **Sphere–water coupling** — Depth-dependent, speed-dependent, Froude-based wave-making; Bezier curve integration; wake structure. Priority: HIGH.
2. **Bezier & dynamic settings** — Integrate Opus Waves Bezier system; dynamic settings from physics; real-time parameter modulation. Priority: HIGH.
3. **Bubbles & foam** — Event-driven entrainment; foam generation; coalescence; surface interaction. Priority: HIGH.
4. **Animated ocean waves** — Consolidate wave systems; wind-driven waves; ripples (wind effect, separate from main waves); WaveStack. Priority: HIGH.
5. **Breach effects** — Eliminate GPU readback stalls; increase blob limit; optimize ray marching; better spray/splash physics; Splash integration (optional). Priority: HIGH.

---

## Focus Areas (Secondary: Semi-Isolated)

- **Volumetric clouds** — Master variables independently; integrate after water/object interaction mastered.
- **Procedural sand** — Same.
- **Sailboat** — Same; deep physics domain.

---

## Summary

Blueprints: T1 overview + T2 blueprints (sphere-water, Bezier, bubbles/foam, wave systems, breachable effects, splash breaching). Focus areas: primary = sphere-water, Bezier, bubbles/foam, waves, breach; secondary = volumetric clouds, procedural sand, sailboat. Index and status in blueprints/T1_blueprints_overview.md and MASTER_INDEX.


# Quality Assurance and Drift Prevention — Ocean Sim Expansion

**Volume VI — Implementation, Specs & Apps**  
**Consolidated from:** DEVELOPMENT_QUALITY_ASSURANCE_PROTOCOL, DRIFT_PREVENTION_PROTOCOL, MULTI_AI_COORDINATION_PROTOCOL, GPT_5_2_HANDOFF_PACKET, AUTO_MODE_TASK_QUEUE

---

## Development Quality Assurance Protocol

**Purpose:** Prevent development mistakes through systematic validation.

**Pre-development:** Validate physics mapping, relationship mapping, settings completeness; check for category mistakes (e.g. ripples vs main waves).

**During development:** Validate physics, NL/Syntax, visual mapping; avoid mixing ripples/main waves; follow specs (BREACH_*, MLS_*, HEIGHTFIELD_*).

**Post-development:** Validate completeness, relationships, mistake-prevention rules; run canonical scenarios; check for GPU readback stalls.

**Document:** DEVELOPMENT_QUALITY_ASSURANCE_PROTOCOL.md. Priority: CRITICAL.

---

## Drift Prevention Protocol

**Rules:**

1. **Genesis before feedback** — Do not tune feedback until genesis is correct.
2. **Visual success criteria** — “Wave crest becomes sheet” is success, not “no runaway waves.”
3. **Stop conditions** — Check Step 2.5/2.6 (wave-conforming spawn, wave-inherited velocities) success before proceeding to 2.7/2.8.
4. **Drift tripwires** — Self-guidance requirements; checkpoint before major steps; reference PROJECT_STATE_CONSOLIDATION (Drift Analysis section).

**Document:** DRIFT_PREVENTION_PROTOCOL.md. Status: CRITICAL — mandatory.

---

## Multi-AI Coordination Protocol

**Purpose:** How Opus 4.5, Sonnet 4.5, GPT-5.2, and Auto Mode work together; when to use each AI; handoff protocols; drift prevention rules.

**Document:** MULTI_AI_COORDINATION_PROTOCOL.md. Status: Active.

---

## GPT_5_2 Handoff Packet

**Purpose:** Copy/paste for GPT-5.2; mission statement; scope constraints; key source docs; tooling constraints; drift tripwires; example task format.

**Contents:** Mission; scope; key docs (OCEANSIM_MASTER_PLAN, PROJECT_STATE_CONSOLIDATION, DRIFT_PREVENTION_PROTOCOL, HANDOFF_TO_GPT5_2, TUNING_GUIDE, specs); tooling; drift tripwires; task format.

**Document:** GPT_5_2_HANDOFF_PACKET.md. Status: Active (needs drift prevention section update per MASTER_INDEX).

---

## Auto-Mode Task Queue

**Purpose:** Concrete tasks with clear deliverables; code scanning instructions; MCP tools guidance; progress tracking.

**Related:** AUTO_MODE_TASK_QUEUE.md; AUTO_MODE_TASK_QUEUE_PHASE2.md; integrations/splash GPT_5_2_PHASE_0_1_TASK_QUEUE (complete); GPT_5_2_PHASE_2_TASK_QUEUE (ready).

**Document:** AUTO_MODE_TASK_QUEUE.md. Status: Active — tasks ready for execution.

---

## Summary

QA: DEVELOPMENT_QUALITY_ASSURANCE_PROTOCOL (pre/during/post validation; mistake prevention). Drift prevention: DRIFT_PREVENTION_PROTOCOL (genesis before feedback; visual success criteria; stop conditions; drift tripwires). Coordination: MULTI_AI_COORDINATION_PROTOCOL; GPT_5_2_HANDOFF_PACKET; AUTO_MODE_TASK_QUEUE. All mandatory for aligned, drift-free development.


---

