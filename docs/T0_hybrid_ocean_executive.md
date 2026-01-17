---
id: "water_showcase_unified_T0_hybrid_ocean_executive"
system: "water-showcase-unified"
component: "gptwaves-vpro"
level: "T0"
type: "executive"
title: "Hybrid Ocean (vPRO) — Executive"
description: "T0 (executive) describing the Hybrid Ocean goal: far-field ocean + near-field breaching/splashes around characters/boats."
audience: "Braden, core implementers"
confidence_threshold: 0.80
token_cost: 350
word_count: 130
created: "2025-12-29T00:00:00Z"
updated: "2025-12-29T00:00:00Z"
author: "aether"
status: "in_progress"
tags: ["water", "ocean", "hybrid", "breaching", "mpm", "webgpu", "t0-t4", "transitional"]
dependencies:
  - "Documentation/appexamples/water-showcase-unified/WAVE_SIMULATION_ADVANCED_DISCUSSION.md"
  - "Documentation/appexamples/water-showcase-unified/ADVANCED_WATER_SYSTEMS_DESIGN.md"
related_docs:
  - "Documentation/appexamples/water-showcase-unified/T1_hybrid_ocean_overview.md"
version: "v0.1.0"
---

> **TRANSITIONAL T-LEVEL DOCUMENT** – Do not overwrite existing L-level docs. This T-level will supersede L-level after review/acceptance.

## Intent
Build a **Hybrid Ocean** in `gptwaves-vpro`: keep our fast **heightfield** water surface for the “everywhere” ocean/waves, but add a localized, physically-plausible **near-field volumetric breaching system** around characters/boats for the “hero moments” (curling crests, splashes, sheets, spray, foam).

## Core idea
- **Far-field**: cheap, stable base ocean (FFT/procedural) + our current 2.5D solver where needed.
- **Near-field bubble**: event-driven, high-detail volumetric sim only near the player (inspired by matsuoka-601’s WebGPU MLS‑MPM projects).
- **Coupling**: far→near seeds volumetric events; near→far stamps back persistent foam/wakes and surface impulses.

## Success criteria
Breaching waves look physically grounded, integrate with lighting/caustics/foam, and remain real-time by constraining volumetric work to a small, LOD-controlled “bubble”.


