# OPUS Water Engine — Cursor Agent Orchestration Document
## The Single Source of Truth for Implementation

**Prepared by:** Lead Dev (Opus)  
**For:** Cursor IDE AI Coding Agent  
**Date:** 2026-02-08  
**Rule:** If this document conflicts with any other document, THIS document wins.

---

## TABLE OF CONTENTS

1. [What We're Building](#1-what-were-building)
2. [Architecture Decisions (Conflicts Resolved)](#2-architecture-decisions)
3. [Technology & Constraints](#3-technology--constraints)
4. [Canonical Texture Atlas](#4-canonical-texture-atlas)
5. [Canonical Frame Pipeline](#5-canonical-frame-pipeline)
6. [File Structure](#6-file-structure)
7. [Group 1: Infrastructure](#7-group-1-infrastructure)
8. [Group 2: Heightfield Foundation](#8-group-2-heightfield-foundation)
9. [Group 3: Sheet Core](#9-group-3-sheet-core)
10. [Group 4: Seam Engine + Hull](#10-group-4-seam-engine--hull)
11. [Group 5: Self-Envelope + Thickness](#11-group-5-self-envelope--thickness)
12. [Group 6: Spray + Foam + Edge/Phi](#12-group-6-spray--foam--edgephi)
13. [Group 7: Rendering Pipeline](#13-group-7-rendering-pipeline)
14. [Group 8: Orchestrator + Debug](#14-group-8-orchestrator--debug)
15. [Configuration Reference](#15-configuration-reference)
16. [Validation Tests](#16-validation-tests)
17. [Debug Visualization Modes](#17-debug-visualization-modes)
18. [Symptom → Fix Index](#18-symptom--fix-index)
19. [Future: GPT Waves v7 Integration](#19-future-gpt-waves-v7-integration)

---

## 1. What We're Building

A GPU-driven water simulation engine with three layers:

```
LAYER A: HEIGHTFIELD (512², always on, 2-3ms)
  - SWE or FFT ocean simulation
  - The "truth" — never modified by layers below
  - Covers entire visible ocean
  
     ↓ one-way read
  
LAYER B: DETAIL SHEET ZONES (128² each, 2-3 zones max, 3-5ms)
  - GPU texture-grid patches near camera (10-20m)
  - Splits into seams at hulls and breaking waves
  - Folds via self-envelope barrier
  - Link-mask topology (texture, not data structure)
  
     ↓ eject when fully disconnected
  
LAYER C: SPRAY + FOAM (512 particles + 512² foam, 0.5-2ms)
  - Ballistic spray particles
  - Foam overlay on heightfield
  - Edge-driven foam at seam boundaries
```

**Target:** 60 FPS sustained on GTX 1060 / RX 580  
**Platform:** React Three Fiber + three.js + WebGL2  
**Total budget:** ~12ms per frame

---

## 2. Architecture Decisions

These are FINAL. Do not revisit.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Self-collision method | **Self-envelope barrier** (not density field) | Cheaper (no 3D splat), simpler, sufficient for fold/slap. Density field is future WebGPU enhancement only. |
| Velocity buffers | **Double ping-pong** (not triple) | OPUS pass ordering with swap between Pass 6→7 avoids read-after-write. |
| Texture precision | **RGBA16F everywhere** unless proven otherwise | Bandwidth savings on low-end GPUs. Upgrade posTex to RGBA32F only if quantization is visually demonstrated. |
| Hull texture packing | **OPUS format**: R=hullY, G=ascentAngle, B=faceIncidence, A=speed | Face incidence is critical for realistic spray/break behavior. |
| Seam hiding | **Φ fusion + edge foam** (PLANWATER V18) | Proven visually effective, low cost. |
| Heightfield solver (Phase 1) | **SWE (Shallow Water Equations)** | Simpler, bounded, testable. FFT is Phase 2 enhancement. |
| Sheet resolution | **128×128** default | 16K surface elements is the sweet spot for quality/perf. |
| Max detail zones | **2** (hard cap for Phase 1) | Predictable GPU budget. |

### Non-Negotiable Rules

These rules prevent architectural drift. The Cursor agent MUST follow them:

1. **Genesis before feedback** — Get initialization right before tuning feedback loops
2. **One-way coupling** — Heightfield is NEVER modified by sheet or spray
3. **No synchronous GPU readbacks** — NEVER call `gl.readPixels` in the render loop
4. **Topology is a texture** — Links are `[0,1]` floats in RG16F, not data structures
5. **Diagnostics are macro-filtered** — Use heightfield-resolution diagnostics, never micro-ripple gradients for topology decisions
6. **RGBA16F default** — No RGBA32F unless precision failure is proven
7. **Hard zone caps** — Never exceed `maxZones` regardless of demand

---

## 3. Technology & Constraints

### Stack
- **React Three Fiber** (R3F) — scene management
- **three.js** — WebGL2 renderer
- **GLSL 300 es** — all shaders use `#version 300 es`
- **TypeScript** — all engine code

### WebGL2 Constraints

| Constraint | Impact | Our Workaround |
|------------|--------|----------------|
| No compute shaders | Can't do scatter/gather | All passes are fullscreen fragment shaders |
| Max 4 MRT draw buffers | Limits simultaneous outputs | Largest pass uses 2 MRT (pos+vel). No pass exceeds 4. |
| No atomics in frag shader | Can't do exact scatter | Additive blending for density (future path only) |
| Max 16 texture units | Limits per-pass inputs | Largest pass samples 8 textures — within limit |
| RGBA32F may lack linear filter | Must use NEAREST | Use NEAREST for any RGBA32F, LINEAR for RGBA16F |
| EXT_color_buffer_float needed | Float render targets | Check at init, fatal error if missing |

### Package Dependencies
```json
{
  "three": "^0.162.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.100.0",
  "leva": "^0.9.35"
}
```

---

## 4. Canonical Texture Atlas

This is the SINGLE authoritative list. If other documents disagree, this wins.

```
TEXTURE          FORMAT    DIMS       PING-PONG  CHANNEL PACKING
─────────────────────────────────────────────────────────────────
heightfieldTex   RGBA16F   512×512    Yes(×2)    R=η, G=∂η/∂t, B=u_vel, A=v_vel
diagnosticTex    RGBA16F   512×512    No         R=steepness, G=curvature, B=jacobian, A=etaRate
posTex           RGBA16F   128×128    Yes(×2)    RGB=worldPos, A=mass (0=dead)
velTex           RGBA16F   128×128    Yes(×2)    RGB=velocity, A=stress
linkTex          RG16F     128×128    Yes(×2)    R=link_+U [0..1], G=link_+V [0..1]
thickTex         R16F      128×128    Yes(×2)    scalar thickness (meters)
normalTex        RGBA16F   128×128    No         RGB=normal, A=curvatureSign
pressureTex      RG16F     128×128    No         R=P_below, G=P_above
hullTex          RGBA16F   128×128    No         R=hullY, G=ascentAngle, B=faceIncidence, A=speed
envTex           R16F      128×128    No         self-envelope barrier height
edgePhiTex       RG16F     128×128    No         R=edge strength, G=phi fusion scalar
sprayPosTex      RGBA16F   512×1      Yes(×2)    RGB=position, A=lifetime
sprayVelTex      RGBA16F   512×1      Yes(×2)    RGB=velocity, A=size
foamTex          R16F      512×512    Yes(×2)    foam density
─────────────────────────────────────────────────────────────────
TOTAL per zone: ~9 MB GPU memory
```

### Ping-Pong Convention

Every ping-pong pair has `.read` and `.write` targets. The convention:
- **Read** from `.read` at start of frame
- **Write** to `.write` during passes
- **Swap** at end of frame (or between dependent passes)

```typescript
// Standard pattern for every ping-pong pass:
material.uniforms.u_input.value = pingPong.read.texture;
passRunner.renderPass(material, pingPong.write);
pingPong.swap();
```

---

## 5. Canonical Frame Pipeline

17 passes per frame. This is the EXACT ordering.

```
Frame N (dt clamped to [0.001, 0.033])
│
├─ Pass 1:  HeightfieldUpdate          hfPP.read → hfPP.write → swap       2.0 ms
├─ Pass 2:  HeightfieldDiagnostics     hfPP.read → diagnosticTex           0.5 ms
├─ Pass 3:  HullContactRender          hull geometry → hullTex              0.5 ms
├─ Pass 4:  SheetPressure              posPP.read + hfTex + diagTex → pressTex  0.3 ms
├─ Pass 5:  SheetLinkUpdate            linkPP.read + hullTex + ... → linkPP.write → swap  0.4 ms
├─ Pass 6:  SheetViscosity             velPP.read + linkPP.read → velPP.write → swap  0.4 ms
├─ Pass 7:  SheetForceIntegrate        posPP.read + velPP.read + ... → posPP.write + velPP.write (MRT) → swap both  1.0 ms
├─ Pass 8:  SheetSelfEnvelope          posPP.read + normalTex → envTex      0.3 ms
├─ Pass 9:  SheetBarrierContact        posPP.read + velPP.read + envTex → posPP.write + velPP.write (MRT) → swap both  0.5 ms
├─ Pass 10: SheetThickness             thickPP.read + velPP.read + linkPP.read → thickPP.write → swap  0.3 ms
├─ Pass 11: SheetNormals               posPP.read + linkPP.read → normalTex  0.3 ms
├─ Pass 12: SheetEdgePhi               linkPP.read + thickPP.read + pressTex → edgePhiTex  0.3 ms
├─ Pass 13: SprayDetectEject           posPP.read + velPP.read + linkPP.read + thickPP.read → sprayBuf append  0.3 ms
├─ Pass 14: SprayUpdate                sprayPP.read → sprayPP.write → swap  0.2 ms
├─ Pass 15: FoamAdvect                 foamPP.read + hfTex + edgePhiTex → foamPP.write → swap  0.3 ms
├─ Pass 16: RenderScene                all textures → screen                4.0 ms
├─ Pass 17: Composite                  layers → final output               0.5 ms
│
└─ Total: ~11.3 ms typical → 88 FPS
          ~16 ms with hull + breaking → 62 FPS
```

### Pass Dependency Verification (No Hazards)

```
Pass 1:  reads hfPP.read,     writes hfPP.write     → SWAP hf
Pass 2:  reads hfPP.read(new) writes diagnosticTex   → no swap needed
Pass 3:  reads hull geometry,  writes hullTex         → no swap needed
Pass 4:  reads posPP.read,     writes pressureTex     → no swap needed
Pass 5:  reads linkPP.read,    writes linkPP.write    → SWAP link
Pass 6:  reads velPP.read,     writes velPP.write     → SWAP vel
Pass 7:  reads posPP.read + velPP.read, writes posPP.write + velPP.write (MRT) → SWAP both
Pass 8:  reads posPP.read,     writes envTex          → no swap needed
Pass 9:  reads posPP.read + velPP.read, writes posPP.write + velPP.write (MRT) → SWAP both
Pass 10: reads thickPP.read,   writes thickPP.write   → SWAP thick
Pass 11: reads posPP.read,     writes normalTex       → no swap needed
Pass 12: reads linkPP.read,    writes edgePhiTex      → no swap needed
Pass 13: reads posPP/velPP/linkPP/thickPP.read → spray append → no swap needed
Pass 14: reads sprayPP.read,   writes sprayPP.write   → SWAP spray
Pass 15: reads foamPP.read,    writes foamPP.write    → SWAP foam

✅ Every pass reads ONLY from .read targets and writes ONLY to .write targets (or non-ping-pong targets).
✅ Swaps happen AFTER each write, BEFORE next read of same texture.
✅ No read-after-write hazard anywhere.
```

---

## 6. File Structure

Create this EXACT directory structure. Do not rename files.

```
src/
├── engine/
│   ├── OpusConfig.ts              ← [GROUP 1] Types + defaults + merge utility
│   ├── PingPong.ts                ← [GROUP 1] Double-buffer render target pair
│   ├── PassRunner.ts              ← [GROUP 1] Fullscreen quad pass dispatcher
│   ├── GPUProfiler.ts             ← [GROUP 1] Per-pass timing (optional, EXT-based)
│   └── OpusEngine.ts              ← [GROUP 8] Main 17-pass orchestrator
│
├── foundation/
│   ├── HeightfieldUpdate.ts       ← [GROUP 2] ✅ EXISTS — Pass 1: SWE solver
│   ├── HeightfieldDiagnostics.ts  ← [GROUP 2] ✅ EXISTS — Pass 2: diagnosticTex
│   └── HeightfieldRenderer.ts     ← [GROUP 2] ✅ EXISTS — Displaced mesh + PBR
│
├── sheet/
│   ├── SheetInitializer.ts        ← [GROUP 3] Initialize all sheet textures
│   ├── PressureCompute.ts         ← [GROUP 3] Pass 4: hydrostatic + wave boost
│   ├── ForceIntegrate.ts          ← [GROUP 3] Pass 7: all forces + symplectic Euler
│   ├── NormalCompute.ts           ← [GROUP 3] Pass 11: link-weighted normals
│   ├── LinkUpdate.ts              ← [GROUP 4] Pass 5: ★ THE SEAM ENGINE ★
│   ├── ViscosityDiffuse.ts        ← [GROUP 4] Pass 6: link-weighted diffusion
│   ├── SelfEnvelope.ts            ← [GROUP 5] Pass 8: fold barrier field
│   ├── BarrierContact.ts          ← [GROUP 5] Pass 9: fold/slap momentum
│   ├── ThicknessAdvect.ts         ← [GROUP 5] Pass 10: div-corrected advection
│   └── EdgePhiCompute.ts          ← [GROUP 6] Pass 12: seam hiding fields
│
├── hull/
│   ├── HullContactPass.ts         ← [GROUP 4] Pass 3: geometry → hullTex
│   └── HullManager.ts             ← [GROUP 4] Multi-hull registry
│
├── detail/
│   ├── SprayDetect.ts             ← [GROUP 6] Pass 13: spray ejection
│   ├── SprayUpdate.ts             ← [GROUP 6] Pass 14: ballistic update
│   └── FoamSystem.ts              ← [GROUP 6] Pass 15: foam advect + decay
│
├── rendering/
│   ├── SheetRenderer.ts           ← [GROUP 7] Grid mesh + Φ normals + edge foam
│   ├── SprayRenderer.ts           ← [GROUP 7] Point sprites for spray
│   └── Compositor.ts              ← [GROUP 7] Final depth-aware blend
│
├── debug/
│   ├── TextureVisualizer.ts       ← [GROUP 8] Render any texture as overlay
│   └── PerformanceOverlay.ts      ← [GROUP 8] Frame time bars per pass
│
└── app/
    ├── OpusDemo.tsx               ← [GROUP 8] R3F scene component
    └── DebugPanel.tsx             ← [GROUP 8] Leva controls
```

---

## 7. Group 1: Infrastructure

**Dependencies:** None  
**Gate:** PingPong swap test passes. PassRunner renders solid color to target.

### File: `src/engine/PingPong.ts`

```typescript
/**
 * PingPong.ts — Double-buffered WebGLRenderTarget pair.
 * 
 * Usage:
 *   const pp = new PingPong(renderer, 512, 512, { type: HalfFloatType, ... });
 *   // In render loop:
 *   material.uniforms.u_input.value = pp.read.texture;
 *   passRunner.renderPass(material, pp.write);
 *   pp.swap();
 */

import * as THREE from 'three';

export class PingPong {
  private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private index = 0;

  constructor(
    _renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    options?: Partial<THREE.RenderTargetOptions>
  ) {
    const defaults: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    };
    const opts = { ...defaults, ...options };
    this.targets = [
      new THREE.WebGLRenderTarget(width, height, opts),
      new THREE.WebGLRenderTarget(width, height, opts),
    ];
  }

  get read(): THREE.WebGLRenderTarget {
    return this.targets[this.index];
  }

  get write(): THREE.WebGLRenderTarget {
    return this.targets[1 - this.index];
  }

  swap(): void {
    this.index = 1 - this.index;
  }

  dispose(): void {
    this.targets[0].dispose();
    this.targets[1].dispose();
  }
}
```

### File: `src/engine/PassRunner.ts`

```typescript
/**
 * PassRunner.ts — Renders a ShaderMaterial to a render target using a fullscreen quad.
 * 
 * All OPUS GPU passes use this. It manages a single fullscreen triangle (not quad — 
 * a single triangle that covers the screen is cheaper than two triangles).
 * 
 * Usage:
 *   const runner = new PassRunner(renderer);
 *   runner.renderPass(myMaterial, myTarget);
 */

import * as THREE from 'three';

export class PassRunner {
  /**
   * Fullscreen vertex shader (GLSL 300 es).
   * Outputs v_uv as vec2 in [0,1].
   * Uses a single fullscreen triangle (3 vertices, no index buffer).
   */
  static readonly FULLSCREEN_VERT = /* glsl */ `#version 300 es
    precision highp float;
    out vec2 v_uv;
    void main() {
      // Fullscreen triangle: vertex 0=(−1,−1), 1=(3,−1), 2=(−1,3)
      float x = -1.0 + float((gl_VertexID & 1) << 2);
      float y = -1.0 + float((gl_VertexID & 2) << 1);
      v_uv = vec2(x, y) * 0.5 + 0.5;
      gl_Position = vec4(x, y, 0.0, 1.0);
    }
  `;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private mesh: THREE.Mesh;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera(); // identity camera — not used, vertex shader does all work

    // Fullscreen triangle geometry (3 verts, no attributes needed — gl_VertexID drives it)
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(
      [-1, -1, 0,  3, -1, 0,  -1, 3, 0], 3
    ));
    // Dummy material — replaced per pass
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    this.scene.add(this.mesh);
  }

  /**
   * Render `material` as a fullscreen pass to `target`.
   * If target is null, renders to the canvas (screen).
   */
  renderPass(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget | null
  ): void {
    const prevTarget = this.renderer.getRenderTarget();
    this.mesh.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(prevTarget);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
  }
}
```

**IMPORTANT NOTE FOR CURSOR AGENT:** The fullscreen triangle approach using `gl_VertexID` may not work with three.js's default rendering pipeline because three.js expects geometry attributes. If you encounter issues, fall back to a standard PlaneGeometry approach:

```typescript
// Fallback: use PlaneGeometry instead
const geo = new THREE.PlaneGeometry(2, 2);
```

And use this simpler vertex shader:
```glsl
#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
```

### File: `src/engine/GPUProfiler.ts`

```typescript
/**
 * GPUProfiler.ts — Optional per-pass GPU timing.
 * Uses EXT_disjoint_timer_query_webgl2 if available, else falls back to Date.now().
 * 
 * Usage:
 *   profiler.begin('Pass1_Heightfield');
 *   // ... render pass ...
 *   profiler.end('Pass1_Heightfield');
 *   // Later:
 *   const results = profiler.getResults(); // { 'Pass1_Heightfield': 2.1, ... } in ms
 */

export class GPUProfiler {
  private gl: WebGL2RenderingContext | null = null;
  private ext: any = null; // EXT_disjoint_timer_query_webgl2
  private queries: Map<string, { query: WebGLQuery; startTime: number }> = new Map();
  private results: Map<string, number> = new Map();
  private enabled: boolean;

  constructor(renderer: THREE.WebGLRenderer, enabled = false) {
    this.enabled = enabled;
    if (!enabled) return;
    
    const gl = renderer.getContext() as WebGL2RenderingContext;
    this.gl = gl;
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    // If extension not available, we'll use CPU timing as fallback
  }

  begin(label: string): void {
    if (!this.enabled) return;
    
    if (this.ext && this.gl) {
      const query = this.gl.createQuery()!;
      this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query);
      this.queries.set(label, { query, startTime: 0 });
    } else {
      this.queries.set(label, { query: null as any, startTime: performance.now() });
    }
  }

  end(label: string): void {
    if (!this.enabled) return;
    
    const entry = this.queries.get(label);
    if (!entry) return;

    if (this.ext && this.gl) {
      this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
      // Result available next frame — store query for later retrieval
    } else {
      this.results.set(label, performance.now() - entry.startTime);
    }
  }

  /** Returns timing results in milliseconds. GPU results may be 1-2 frames delayed. */
  getResults(): Map<string, number> {
    return new Map(this.results);
  }

  dispose(): void {
    this.queries.clear();
    this.results.clear();
  }
}
```

### File: `src/engine/OpusConfig.ts`

**STATUS: ✅ ALREADY EXISTS in the provided docs. Use the version from the docs.**

Key points for Cursor agent:
- The `OpusConfig` interface and `DEFAULT_CONFIG` constant are already defined
- The `mergeConfig()` and `deepMerge()` utilities are already defined
- Use `DEFAULT_CONFIG` as the starting point for all instances
- The `TelemetryLevel` enum controls debug readback policy

**One fix needed:** The existing OpusConfig is missing a few fields that OPUS Master Plan references. Add these to the `sheet` section:

```typescript
// Add to sheet config interface:
gravityY: number;           // -9.81

// Add to sheet config interface:
pressureStiffness: number;  // 100.0
waveBoostScale: number;     // 0.5
centripetalLift: number;    // 0.2
```

### Group 1 Gate Test

```typescript
// gate1_test.ts
function testGroup1(renderer: THREE.WebGLRenderer): boolean {
  const passRunner = new PassRunner(renderer);
  
  // Test 1: PingPong swap
  const pp = new PingPong(renderer, 4, 4);
  const readBefore = pp.read;
  const writeBefore = pp.write;
  pp.swap();
  console.assert(pp.read === writeBefore, 'PingPong swap failed: read should be previous write');
  console.assert(pp.write === readBefore, 'PingPong swap failed: write should be previous read');
  
  // Test 2: PassRunner renders solid red to target
  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, format: THREE.RGBAFormat });
  const solidRedMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: PassRunner.FULLSCREEN_VERT,
    fragmentShader: `#version 300 es
      precision highp float;
      out vec4 fragColor;
      void main() { fragColor = vec4(1.0, 0.0, 0.0, 1.0); }
    `,
  });
  passRunner.renderPass(solidRedMat, target);
  // Visual check: target should be solid red
  
  pp.dispose();
  target.dispose();
  solidRedMat.dispose();
  passRunner.dispose();
  return true;
}
```

---

## 8. Group 2: Heightfield Foundation

**Dependencies:** Group 1  
**Status:** ✅ THREE FILES ALREADY EXIST with good quality code.

### Existing Files (USE AS-IS, with minor fixes noted)

1. **`src/foundation/HeightfieldUpdate.ts`** — SWE Lax-Friedrichs solver
2. **`src/foundation/HeightfieldDiagnostics.ts`** — Steepness, curvature, Jacobian, etaRate  
3. **`src/foundation/HeightfieldRenderer.ts`** — Displaced mesh + PBR water

### Fixes Needed in Existing Code

**HeightfieldUpdate.ts — Fix 1:** The sponge boundary uses `worldPos` = `v_uv * u_worldSize`. But the shader also has `u_worldOrigin`. The sponge should operate on local coordinates within the heightfield patch, not absolute world coordinates. The latest version in the docs handles this correctly with `localPos`. **Ensure the version with `u_worldOrigin` and `localPos` for sponge is used.**

**HeightfieldUpdate.ts — Fix 2:** The damping uniform calculation. Use this formula:
```typescript
u.u_damping.value = Math.pow(this.config.heightfield.damping, subDt * 60.0);
```
This normalizes damping across variable sub-step counts. The `damping` config value (default 0.995) represents per-60Hz-step damping.

**HeightfieldDiagnostics.ts — Verify:** The `u_stride` uniform should be present:
```typescript
u_stride: { value: res >= 1024 ? 2.0 : 1.0 },
```

**HeightfieldRenderer.ts — No changes needed.** The PBR material with Fresnel, specular, and foam from steepness is solid.

### Group 2 Gate Tests

| ID | Test | Pass Criteria |
|----|------|---------------|
| G2-1 | Impulse → expanding ring | Center impulse at (0,0) with radius=3, strength=50. Wave travels outward. After 60 frames, wavefront visible at ~14m from center (√(9.81×20) ≈ 14 m/s). |
| G2-2 | Steepness > 0 at crests | diagnosticTex.R > 0.01 at wave crest locations |
| G2-3 | Jacobian < 0 at steep crests | With strength=200, diagnosticTex.B < 0 at steepest points |
| G2-4 | Sponge absorbs at edges | Wave reaching outer 5% border attenuates; no visible reflection |
| G2-5 | Energy decays | Sum of η² across all texels decreases monotonically (allow 0.1% tolerance per frame) |

---

## 9. Group 3: Sheet Core

**Dependencies:** Groups 1, 2  
**Gate:** Sheet at y=1 above flat HF settles to η within 0.1m by frame 180. Sheet follows sine-wave HF with < 0.1m average error.

### File: `src/sheet/SheetInitializer.ts`

**Purpose:** Creates and initializes all sheet textures for a detail zone.

```typescript
/**
 * SheetInitializer.ts — Initialize all sheet textures for a detail zone.
 * 
 * Creates: posPP, velPP, linkPP, thickPP, normalTex, pressureTex, envTex, edgePhiTex
 * 
 * Initial state:
 *   - posTex: grid of positions on heightfield surface, mass=1.0
 *   - velTex: zero velocity
 *   - linkTex: all links = 1.0 (fully bonded)
 *   - thickTex: uniform thickness = 0.5m
 *   - normalTex: (0,1,0) everywhere (pointing up)
 *   - pressureTex: (ATM, ATM) everywhere
 */

// Key interface:
export class SheetInitializer {
  constructor(config: OpusConfig, passRunner: PassRunner, renderer: THREE.WebGLRenderer);
  
  /**
   * Create a new sheet zone.
   * @param worldOrigin XZ world-space origin of zone bottom-left corner
   * @param worldSize XZ extent of zone in meters
   * @param heightfieldTexture Current HF texture for initial height sampling
   * @returns SheetZone object containing all textures
   */
  createZone(
    worldOrigin: THREE.Vector2,
    worldSize: THREE.Vector2,
    heightfieldTexture: THREE.Texture
  ): SheetZone;
  
  dispose(): void;
}

export interface SheetZone {
  id: string;
  worldOrigin: THREE.Vector2;
  worldSize: THREE.Vector2;
  resolution: number;
  
  posPP: PingPong;
  velPP: PingPong;
  linkPP: PingPong;
  thickPP: PingPong;
  
  normalTex: THREE.WebGLRenderTarget;
  pressureTex: THREE.WebGLRenderTarget;
  envTex: THREE.WebGLRenderTarget;
  edgePhiTex: THREE.WebGLRenderTarget;
  
  dispose(): void;
}
```

**Initialization shader (run once per zone creation):**

```glsl
// sheetInit.frag — Initialize posTex
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_heightfield;
uniform vec2 u_sheetRes;           // vec2(128.0)
uniform vec2 u_sheetWorldOrigin;   // XZ corner
uniform vec2 u_sheetWorldSize;     // XZ extent
uniform vec2 u_hfWorldOrigin;
uniform vec2 u_hfWorldSize;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    // World XZ for this texel
    vec2 worldXZ = u_sheetWorldOrigin + v_uv * u_sheetWorldSize;
    
    // Sample heightfield at this world position
    vec2 hfUV = clamp((worldXZ - u_hfWorldOrigin) / u_hfWorldSize, 0.0, 1.0);
    float eta = texture(u_heightfield, hfUV).r;
    
    // Initialize: position on surface, mass = 1.0
    fragColor = vec4(worldXZ.x, eta, worldXZ.y, 1.0);
}
```

```glsl
// sheetInitLink.frag — Initialize linkTex (all links = 1.0)
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
void main() {
    fragColor = vec4(1.0, 1.0, 0.0, 0.0); // RG = link strengths = fully bonded
}
```

```glsl
// sheetInitThick.frag — Initialize thickTex
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.5, 0.0, 0.0, 0.0); // 0.5 meters uniform thickness
}
```

### File: `src/sheet/PressureCompute.ts`

**Purpose:** Pass 4 — Compute pressure below and above each sheet texel.

**Key physics:**
- `P_below = ATM + ρ·g·max(0, η - posY)` — hydrostatic from water column
- When texel is above η: reduced pull-back with exponential taper
- `P_above = ATM` (simple case; self-envelope handles folds)
- Wave momentum boost: `P_below += etaRate × waveBoostScale` (rising waves push harder)

```glsl
// sheetPressure.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_posTex;
uniform sampler2D u_heightfield;
uniform sampler2D u_diagnosticTex;
uniform vec2 u_sheetRes;
uniform vec2 u_sheetWorldOrigin;
uniform vec2 u_sheetWorldSize;
uniform vec2 u_hfWorldOrigin;
uniform vec2 u_hfWorldSize;
uniform float u_pressureStiffness;  // 100.0
uniform float u_waveBoostScale;     // 0.5

in vec2 v_uv;
out vec4 fragColor;

const float ATM = 101325.0;
const float RHO = 1000.0;
const float G   = 9.81;

void main() {
    vec4 pos = texture(u_posTex, v_uv);
    
    if (pos.w < 0.001) { // dead texel
        fragColor = vec4(ATM, ATM, 0.0, 0.0);
        return;
    }
    
    // Map to heightfield UV
    vec2 worldXZ = pos.xz;
    vec2 hfUV = clamp((worldXZ - u_hfWorldOrigin) / u_hfWorldSize, 0.001, 0.999);
    
    float eta = texture(u_heightfield, hfUV).r;
    float depth = eta - pos.y;
    
    // Diagnostics for wave momentum boost
    vec4 diag = texture(u_diagnosticTex, hfUV);
    float etaRate = diag.a; // positive = rising wave
    
    float P_below;
    if (depth > 0.0) {
        // Below surface: hydrostatic
        P_below = ATM + RHO * G * depth;
    } else {
        // Above surface: soft pull-back (exponential taper prevents overshoot)
        P_below = ATM - u_pressureStiffness * abs(depth) * exp(-abs(depth) * 2.0);
    }
    
    // Wave momentum boost: rising waves add extra upward pressure
    P_below += max(etaRate, 0.0) * u_waveBoostScale * RHO;
    
    float P_above = ATM; // simple; fold/slap handled by self-envelope (Pass 8-9)
    
    fragColor = vec4(P_below, P_above, 0.0, 0.0);
}
```

### File: `src/sheet/ForceIntegrate.ts`

**Purpose:** Pass 7 — Apply all forces, integrate with symplectic Euler. MRT output: posTex + velTex.

**Forces applied:**
1. Gravity: `F.y -= G × mass`
2. Pressure: `F += normal × (P_below - P_above) × area × thickness`
3. Hull contact: stiff normal push + tangential squeeze along ascent direction
4. Heightfield coupling: gentle horizontal velocity steering
5. Global damping: `-c × v`

**Integration:** Symplectic Euler (velocity first, then position with new velocity).

```glsl
// sheetForceIntegrate.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_pressureTex;
uniform sampler2D u_normalTex;
uniform sampler2D u_thickTex;
uniform sampler2D u_hullTex;
uniform sampler2D u_heightfield;

uniform vec2  u_sheetRes;
uniform vec2  u_sheetWorldOrigin;
uniform vec2  u_sheetWorldSize;
uniform vec2  u_hfWorldOrigin;
uniform vec2  u_hfWorldSize;
uniform float u_dt;
uniform float u_gravityY;         // -9.81
uniform float u_hullStiffness;    // 2000
uniform float u_hfCoupling;       // 0.1
uniform float u_damping;          // 0.5

in vec2 v_uv;

// MRT: two outputs
layout(location = 0) out vec4 out_pos;
layout(location = 1) out vec4 out_vel;

void main() {
    vec4 pos  = texture(u_posTex, v_uv);
    vec4 vel  = texture(u_velTex, v_uv);
    vec2 P    = texture(u_pressureTex, v_uv).rg;
    vec3 norm = texture(u_normalTex, v_uv).xyz;
    float thick = texture(u_thickTex, v_uv).r;
    vec4 hull = texture(u_hullTex, v_uv);
    
    float mass = pos.w;
    
    // Dead texel: pass through
    if (mass < 0.001) {
        out_pos = pos;
        out_vel = vel;
        return;
    }
    
    vec3 force = vec3(0.0);
    float cellSize = u_sheetWorldSize.x / u_sheetRes.x;
    float area = cellSize * cellSize;
    
    // F1: Gravity
    force.y += u_gravityY * mass;
    
    // F2: Pressure
    float dP = P.r - P.g; // P_below - P_above
    vec3 safeNorm = normalize(norm + vec3(0.0, 0.001, 0.0));
    force += safeNorm * dP * area * thick;
    
    // F3: Hull contact
    if (hull.a > 0.0) { // hull present (speed > 0)
        float penetration = hull.r - pos.y; // hullY - sheetY
        if (penetration > 0.0) {
            // Normal: push sheet below hull
            force.y -= penetration * u_hullStiffness * mass;
            
            // Tangential: squeeze along ascent direction
            float ascentAngle = hull.g * 6.2832 - 3.1416; // unpack [0,1] → [-π,π]
            vec2 ascentDir = vec2(cos(ascentAngle), sin(ascentAngle));
            float faceInc = hull.b; // 0=glancing, 1=blunt
            float tangentMag = penetration * u_hullStiffness * 0.3 * (1.0 + faceInc);
            force.xz += ascentDir * tangentMag * mass;
        }
    }
    
    // F4: Heightfield coupling (gentle horizontal steering)
    vec2 hfUV = clamp((pos.xz - u_hfWorldOrigin) / u_hfWorldSize, 0.001, 0.999);
    vec2 hfVel = texture(u_heightfield, hfUV).ba;
    force.xz += (hfVel - vel.xz) * u_hfCoupling * mass;
    
    // F5: Damping
    force -= vel.xyz * u_damping * mass;
    
    // === Symplectic Euler ===
    vec3 newVel = vel.xyz + (force / mass) * u_dt;
    
    // Velocity clamp
    float maxSpeed = 30.0;
    float speed = length(newVel);
    if (speed > maxSpeed) newVel *= maxSpeed / speed;
    
    vec3 newPos = pos.xyz + newVel * u_dt; // uses NEW velocity
    
    float stress = abs(newPos.y - texture(u_heightfield, hfUV).r);
    
    out_pos = vec4(newPos, mass);
    out_vel = vec4(newVel, stress);
}
```

**IMPORTANT for Cursor agent:** This pass uses MRT (Multiple Render Targets). In three.js, use `WebGLMultipleRenderTargets`:

```typescript
import { WebGLMultipleRenderTargets } from 'three';

// Create MRT for Pass 7 (and Pass 9):
const mrt = new WebGLMultipleRenderTargets(128, 128, 2, {
  type: THREE.HalfFloatType,
  format: THREE.RGBAFormat,
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
});
// mrt.texture[0] = posTex output
// mrt.texture[1] = velTex output
```

**Alternative if MRT causes issues:** Split Pass 7 into two passes:
- Pass 7a: compute forces → velTex.write (swap vel)  
- Pass 7b: read new vel, integrate position → posTex.write (swap pos)

### File: `src/sheet/NormalCompute.ts`

**Purpose:** Pass 11 — Compute surface normals from position texture, weighted by link health.

**Key insight:** Broken links contribute ZERO to the normal computation. This prevents garbage normals across seams.

```glsl
// sheetNormals.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_posTex;
uniform sampler2D u_linkTex;
uniform vec2 u_sheetRes;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 tx = 1.0 / u_sheetRes;
    
    vec3 posC  = texture(u_posTex, v_uv).xyz;
    vec3 posPX = texture(u_posTex, v_uv + vec2( tx.x, 0.0)).xyz;
    vec3 posNX = texture(u_posTex, v_uv + vec2(-tx.x, 0.0)).xyz;
    vec3 posPY = texture(u_posTex, v_uv + vec2(0.0,  tx.y)).xyz;
    vec3 posNY = texture(u_posTex, v_uv + vec2(0.0, -tx.y)).xyz;
    
    // Link weights
    vec2 linkHere = texture(u_linkTex, v_uv).rg;                    // +X, +Y
    float linkFromNX = texture(u_linkTex, v_uv - vec2(tx.x, 0.0)).r; // -X neighbor's +X link
    float linkFromNY = texture(u_linkTex, v_uv - vec2(0.0, tx.y)).g; // -Y neighbor's +Y link
    
    // Weighted tangent U (+X direction)
    float wPX = linkHere.r;
    float wNX = linkFromNX;
    vec3 tangentU;
    if (wPX + wNX > 0.01) {
        tangentU = normalize((posPX - posC) * wPX + (posC - posNX) * wNX);
    } else {
        tangentU = vec3(1.0, 0.0, 0.0); // fallback
    }
    
    // Weighted tangent V (+Y direction)
    float wPY = linkHere.g;
    float wNY = linkFromNY;
    vec3 tangentV;
    if (wPY + wNY > 0.01) {
        tangentV = normalize((posPY - posC) * wPY + (posC - posNY) * wNY);
    } else {
        tangentV = vec3(0.0, 0.0, 1.0); // fallback
    }
    
    vec3 normal = normalize(cross(tangentV, tangentU));
    float curvatureSign = normal.y > 0.0 ? 1.0 : -1.0;
    
    fragColor = vec4(normal, curvatureSign);
}
```

### Group 3 Gate Tests

| ID | Test | Setup | Pass Criteria |
|----|------|-------|---------------|
| G3-1 | Flat sheet stable | Init sheet at y=η on flat HF (η=0). All links=1. Run 300 frames. | max(abs(pos.y - 0)) < 0.01m |
| G3-2 | Sheet settles from above | Init sheet at y=1.0, flat HF at y=0. Run 180 frames. | avg(abs(pos.y - 0)) < 0.1m |
| G3-3 | Sheet tracks waves | Run HF with active waves (impulse). Init sheet on surface. Run 600 frames. | RMS(pos.y - η) < 0.3m |
| G3-4 | No velocity explosion | Any scenario: after 600 frames, no NaN in any texture, no pos with abs > 1000 | All values finite and bounded |

---

## 10. Group 4: Seam Engine + Hull

**Dependencies:** Groups 1, 2, 3  
**Gate:** Hull creates seam, seam heals after hull removal, velocity isolation across broken links.

### File: `src/hull/HullContactPass.ts`

**Purpose:** Pass 3 — Render hull geometry into hullTex (RGBA16F, 128×128).

**How it works:** Each hull mesh is rendered with a special shader that:
1. Transforms hull vertices to sheet UV clip space (not camera clip space)
2. Outputs hull surface data: Y height, ascent direction, face incidence, speed

```glsl
// hullContact.vert
#version 300 es
precision highp float;

uniform mat4 u_hullModelMatrix;
uniform vec3 u_hullVelocity;
uniform vec2 u_sheetWorldOrigin;
uniform vec2 u_sheetWorldSize;

in vec3 position;
in vec3 normal;

out float v_hullY;
out float v_ascentAngle;
out float v_faceIncidence;
out float v_speed;

void main() {
    vec4 worldPos = u_hullModelMatrix * vec4(position, 1.0);
    v_hullY = worldPos.y;
    
    // Map to sheet UV clip space
    vec2 sheetUV = (worldPos.xz - u_sheetWorldOrigin) / u_sheetWorldSize;
    gl_Position = vec4(sheetUV * 2.0 - 1.0, 0.0, 1.0);
    
    // Ascent direction: project world-up onto hull tangent plane
    vec3 N = normalize(mat3(u_hullModelMatrix) * normal);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 ascent3D = normalize(up - N * dot(up, N) + vec3(0.0001)); // avoid zero
    float angle = atan(ascent3D.z, ascent3D.x); // [-π, π]
    v_ascentAngle = angle / 6.2832 + 0.5; // pack to [0, 1]
    
    // Face incidence: how bluntly hull faces the velocity
    vec3 velDir = normalize(u_hullVelocity + vec3(0.0001));
    v_faceIncidence = max(0.0, -dot(N, velDir)); // 0=glancing, 1=head-on
    
    v_speed = length(u_hullVelocity);
}
```

```glsl
// hullContact.frag
#version 300 es
precision highp float;

in float v_hullY;
in float v_ascentAngle;
in float v_faceIncidence;
in float v_speed;

out vec4 fragColor;

void main() {
    // R=hullY, G=ascentAngle [0,1], B=faceIncidence [0,1], A=speed (>0 = hull present)
    fragColor = vec4(v_hullY, v_ascentAngle, v_faceIncidence, max(v_speed, 0.001));
}
```

**Implementation notes for Cursor agent:**
- The hull contact pass renders to a separate render target (hullTex), NOT to screen
- Before rendering hulls, CLEAR hullTex to `vec4(0,0,0,0)` (A=0 means "no hull")
- Render ALL hull meshes in the same pass (just multiple draw calls)
- Use `gl.DEPTH_TEST` with `gl.LESS` so closest hull surface wins
- The hull mesh should be whatever geometry the user provides (box, boat shape, etc.)

### File: `src/hull/HullManager.ts`

```typescript
/**
 * HullManager.ts — Registry of hull objects.
 * 
 * Manages hull meshes, their transforms, and velocities.
 * Provides the list of hulls to HullContactPass each frame.
 */
export class HullManager {
  private hulls: Map<string, HullDescriptor> = new Map();
  
  addHull(id: string, mesh: THREE.Mesh, velocity?: THREE.Vector3): void;
  removeHull(id: string): void;
  updateHull(id: string, position: THREE.Vector3, velocity: THREE.Vector3): void;
  getHulls(): HullDescriptor[];
  
  dispose(): void;
}

export interface HullDescriptor {
  id: string;
  mesh: THREE.Mesh;
  modelMatrix: THREE.Matrix4;
  velocity: THREE.Vector3;
}
```

### File: `src/sheet/LinkUpdate.ts`

**Purpose:** Pass 5 — ★ THE SEAM ENGINE ★ — The heart of the entire system.

**This is the OPUS Master Plan version with ALL break/heal conditions.**

Break conditions (link → 0, fast):
- **B1:** Hull silhouette boundary (hull on one side, not the other)
- **B2:** Ascent direction disagreement (V-hull keel line)
- **B3:** Face incidence (blunt bow hit breaks harder)
- **B4:** Wave strain (autonomous breaking — heightfield steepness between neighbors)
- **B5:** Jacobian fold (heightfield surface overturning)

Heal conditions (link → 1, slow):
- **H1:** No hull at either side
- **H2:** Both sides close to heightfield equilibrium
- **H3:** Both sides have low relative displacement

**Use the GLSL from OPUS Master Plan Section 6.2 EXACTLY.** It is provided in the source documents. Key uniforms:

```typescript
uniforms: {
  u_linkTex:              { value: null },  // linkPP.read
  u_hullTex:              { value: null },  // hullTex
  u_posTex:               { value: null },  // posPP.read
  u_heightfield:          { value: null },  // hfPP.read
  u_diagnosticTex:        { value: null },  // diagnosticTex
  u_sheetRes:             { value: new THREE.Vector2(128, 128) },
  u_sheetWorldOrigin:     { value: new THREE.Vector2() },
  u_sheetWorldSize:       { value: new THREE.Vector2() },
  u_hfWorldOrigin:        { value: new THREE.Vector2() },
  u_hfWorldSize:          { value: new THREE.Vector2() },
  u_dt:                   { value: 0 },
  u_breakRate:            { value: 5.0 },
  u_healRate:             { value: 0.5 },
  u_ascentThreshold:      { value: 0.3 },
  u_healProximity:        { value: 0.2 },
  u_waveStrainThreshold:  { value: 0.6 },
  u_waveBreakRate:        { value: 2.0 },
  u_froudeBreakScale:     { value: 3.0 },
  u_faceIncidenceWeight:  { value: 2.0 },
}
```

### File: `src/sheet/ViscosityDiffuse.ts`

**Purpose:** Pass 6 — Velocity diffusion across LIVE links only.

**Critical behavior:** When a link is broken (0.0), NO velocity diffuses across it. This creates complete force isolation between separated sheet regions.

```glsl
// sheetViscosity.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_velTex;
uniform sampler2D u_linkTex;
uniform vec2 u_sheetRes;
uniform float u_viscosity; // 0.05

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 tx = 1.0 / u_sheetRes;
    
    vec4 velC = texture(u_velTex, v_uv);
    vec3 vel = velC.xyz;
    
    // Link values: this texel's connections to +X and +Y
    vec2 linkHere = texture(u_linkTex, v_uv).rg;
    // Neighbor's connections TO us (their +X/-Y links)
    float linkFromNX = texture(u_linkTex, v_uv - vec2(tx.x, 0.0)).r;
    float linkFromNY = texture(u_linkTex, v_uv - vec2(0.0, tx.y)).g;
    
    vec3 velPX = texture(u_velTex, v_uv + vec2( tx.x, 0.0)).xyz;
    vec3 velNX = texture(u_velTex, v_uv + vec2(-tx.x, 0.0)).xyz;
    vec3 velPY = texture(u_velTex, v_uv + vec2(0.0,  tx.y)).xyz;
    vec3 velNY = texture(u_velTex, v_uv + vec2(0.0, -tx.y)).xyz;
    
    vec3 diffusion = vec3(0.0);
    diffusion += linkHere.r  * (velPX - vel);
    diffusion += linkFromNX  * (velNX - vel);
    diffusion += linkHere.g  * (velPY - vel);
    diffusion += linkFromNY  * (velNY - vel);
    
    vel += u_viscosity * diffusion;
    
    fragColor = vec4(vel, velC.w); // preserve stress in .w
}
```

### Group 4 Gate Tests

| ID | Test | Setup | Pass Criteria |
|----|------|-------|---------------|
| G4-1 | Hull creates bilateral seam | Place static hull at center. Run 60 frames. | linkTex values at keel line < 0.1 |
| G4-2 | Seam heals after hull removal | Break links with hull, remove hull. Run 300 frames. | Average link > 0.8 |
| G4-3 | Force isolation | Break all linkU in a column (set to 0). Apply velocity to one side. Run 120 frames. | Velocity on other side stays < 0.01 m/s |
| G4-4 | Face incidence affects break | Blunt hull (faceInc=1.0) breaks faster than glancing (faceInc=0.1) | Blunt-side links reach 0 in fewer frames |

---

## 11. Group 5: Self-Envelope + Thickness

**Dependencies:** Groups 1, 3  
**Gate:** Fold stops at barrier, momentum transfers smoothly, thickness conserved within 10%.

### File: `src/sheet/SelfEnvelope.ts`

**Purpose:** Pass 8 — Build self-envelope barrier field.

**Algorithm:** For each texel, find the maximum Y height of all upright-facing (normal.y > 0) sheet nodes within a 3-texel radius. This becomes the "floor" that underside nodes cannot penetrate.

**Use the GLSL from OPUS Master Plan Section 6.3 EXACTLY.**

Key detail: The nested loop `for dx in [-3..3], dy in [-3..3]` is 49 texture samples. This is acceptable at 128×128 (128² × 49 = 802K samples). At 256×256, consider reducing radius to 2.

### File: `src/sheet/BarrierContact.ts`

**Purpose:** Pass 9 — Apply fold/slap forces when underside nodes hit the barrier.

**Use the GLSL from OPUS Master Plan Section 6.4.** Key behavior:
- Only affects underside nodes (normal.y < 0)
- Barrier = max(heightfield η, envelope height) + thickness offset
- Penetrating nodes get pushed up with `BARRIER_STIFFNESS` (500)
- Heavy damping on contact (`SLAP_DAMPING` = 5.0) prevents bouncing

This pass uses MRT (same as Pass 7): outputs posTex + velTex.

### File: `src/sheet/ThicknessAdvect.ts`

**Purpose:** Pass 10 — Mass-conserving thickness advection with divergence correction.

**Use the GLSL from OPUS Master Plan Section 6.6.** Key features:
- Semi-Lagrangian advection (trace back along velocity)
- Divergence correction: `advected *= (1 - divergence × dt × 0.5)`
- Link-weighted redistribution (thickness equalizes across live links only)
- Dead texel respawn: texels below `MIN_T × 0.5` with live neighbors regain mass

### Group 5 Gate Tests

| ID | Test | Setup | Pass Criteria |
|----|------|-------|---------------|
| G5-1 | Barrier stops penetration | Create artificial fold (set some texel normals to point down, positions below envelope). Run 120 frames. | All underside texels stay above barrier |
| G5-2 | No jitter at barrier | Same setup as G5-1. | Underside texel velocities converge to 0 within 60 frames (no oscillation) |
| G5-3 | Thickness conservation | Uniform init thickness=0.5, no hull, no spray ejection. Run 300 frames. | sum(thickness) changes < 10% |
| G5-4 | Divergent flow thins | Set radially divergent velocity. Run 120 frames. | Center thickness < initial |

---

## 12. Group 6: Spray + Foam + Edge/Phi

**Dependencies:** Groups 1, 2, 3, 4  
**Gate:** Only fully-disconnected texels eject spray. Seams produce foam. Phi field is smooth.

### File: `src/sheet/EdgePhiCompute.ts`

**Purpose:** Pass 12 — Compute edge strength and Φ fusion scalar for seam hiding.

**Use the GLSL from OPUS Master Plan Section 6.5.**

- `edge = 1.0 - min(all 4 link neighbors)` — higher where links are broken
- `phi = thickScale × thickness + edgeScale × edge + pressScale × |pressure|` — metaball-like continuity field
- Blur phi with 5-tap average (done in same pass for simplicity)

### File: `src/detail/SprayDetect.ts`

**Purpose:** Pass 13 — Detect texels that should become spray particles.

**Ejection criteria (ALL must be true):**
1. All 4 links dead (linkU to +X, linkU from -X, linkV to +Y, linkV from -Y) < `linkDeadThreshold` (0.1)
2. Upward velocity > `minEjectVY` (2.0 m/s)
3. Thickness < `minViableThickness` (0.08m)

**When ejecting:**
- Create spray particle at texel's world position with texel's velocity
- Set texel mass to 0 (kill it in posTex)
- Reduce thickness to 0

```glsl
// sprayDetect.frag — outputs modified posTex (dead texels where spray was emitted)
// Spray buffer append is handled on CPU side by scanning for newly-dead texels
// OR by a separate transform-feedback pass

// SIMPLIFICATION FOR PHASE 1: Don't actually create spray particles yet.
// Just kill the texels (set mass=0). Spray visuals come in Group 6 full implementation.
// This way Group 3-5 can test without spray complexity.
```

**Full spray implementation:**

```glsl
// sprayDetect.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_linkTex;
uniform sampler2D u_thickTex;
uniform vec2 u_sheetRes;
uniform float u_linkDeadThreshold;      // 0.1
uniform float u_minEjectVY;            // 2.0
uniform float u_minViableThickness;    // 0.08

in vec2 v_uv;
out vec4 fragColor; // modified posTex

void main() {
    vec2 tx = 1.0 / u_sheetRes;
    
    vec4 pos = texture(u_posTex, v_uv);
    vec4 vel = texture(u_velTex, v_uv);
    float thick = texture(u_thickTex, v_uv).r;
    
    if (pos.w < 0.001) { fragColor = pos; return; } // already dead
    
    // Check all 4 links
    vec2 linkHere = texture(u_linkTex, v_uv).rg;
    float linkFromNX = texture(u_linkTex, v_uv - vec2(tx.x, 0.0)).r;
    float linkFromNY = texture(u_linkTex, v_uv - vec2(0.0, tx.y)).g;
    
    bool allDead = linkHere.r < u_linkDeadThreshold
                && linkHere.g < u_linkDeadThreshold
                && linkFromNX < u_linkDeadThreshold
                && linkFromNY < u_linkDeadThreshold;
    
    bool fastUp = vel.y > u_minEjectVY;
    bool thin = thick < u_minViableThickness;
    
    if (allDead && fastUp && thin) {
        // EJECT: kill texel (spray creation happens in SprayUpdate)
        fragColor = vec4(pos.xyz, 0.0); // mass = 0 = dead
    } else {
        fragColor = pos; // no change
    }
}
```

### File: `src/detail/SprayUpdate.ts`

**Purpose:** Pass 14 — Ballistic update of spray particles.

```glsl
// sprayUpdate.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_sprayPos;  // RGB=pos, A=lifetime
uniform sampler2D u_sprayVel;  // RGB=vel, A=size
uniform float u_dt;
uniform float u_gravity;       // 9.81
uniform float u_drag;          // 0.5

in vec2 v_uv;

layout(location = 0) out vec4 out_pos;
layout(location = 1) out vec4 out_vel;

void main() {
    vec4 posLife = texture(u_sprayPos, v_uv);
    vec4 velSize = texture(u_sprayVel, v_uv);
    
    if (posLife.w <= 0.0) { // dead particle
        out_pos = vec4(0.0);
        out_vel = vec4(0.0);
        return;
    }
    
    vec3 vel = velSize.xyz;
    
    // Gravity
    vel.y -= u_gravity * u_dt;
    
    // Air drag
    float speed = length(vel);
    if (speed > 0.01) {
        vel -= normalize(vel) * u_drag * speed * speed * u_dt;
    }
    
    vec3 pos = posLife.xyz + vel * u_dt;
    float life = posLife.w - u_dt;
    float size = velSize.w * (1.0 - 0.3 * u_dt);
    
    out_pos = vec4(pos, max(life, 0.0));
    out_vel = vec4(vel, size);
}
```

### File: `src/detail/FoamSystem.ts`

**Purpose:** Pass 15 — Foam advection, decay, and generation.

```glsl
// foamAdvect.frag
#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_foamTex;
uniform sampler2D u_heightfield;
uniform sampler2D u_diagnosticTex;
uniform sampler2D u_edgePhiTex;    // R=edge strength at sheet resolution
uniform vec2 u_resolution;         // 512×512
uniform float u_worldSize;
uniform float u_dt;
uniform float u_decayRate;         // 0.3

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 tx = 1.0 / u_resolution;
    
    // Advect along heightfield velocity
    vec2 hfVel = texture(u_heightfield, v_uv).ba;
    vec2 uvBack = clamp(v_uv - hfVel * u_dt / u_worldSize, tx * 0.5, 1.0 - tx * 0.5);
    float foam = texture(u_foamTex, uvBack).r;
    
    // Decay
    foam *= exp(-u_decayRate * u_dt);
    
    // Source: wave steepness (autonomous whitecaps)
    vec4 diag = texture(u_diagnosticTex, v_uv);
    if (diag.r > 0.4 && diag.b < 0.2) { // steep + folding
        foam += diag.r * 0.5 * u_dt;
    }
    
    // Source: edge strength from sheet (broken links = white water)
    // Note: edgePhiTex is at sheet resolution (128²), foamTex is at HF resolution (512²)
    // This sampling will be bilinear-interpolated automatically
    float edge = texture(u_edgePhiTex, v_uv).r; // may need UV remapping if sheet covers different area
    foam += edge * 2.0 * u_dt;
    
    foam = clamp(foam, 0.0, 3.0);
    
    fragColor = vec4(foam, 0.0, 0.0, 0.0);
}
```

### Group 6 Gate Tests

| ID | Test | Pass Criteria |
|----|------|---------------|
| G6-1 | Only fully-disconnected texels eject | Texel with 1 live link: does NOT eject. Texel with 0 live links + vy > 2 + thin: DOES eject. |
| G6-2 | Spray follows ballistic arc | Spawn spray at (0, 5, 0) with vel=(5, 10, 0). After 2s, pos.y ≈ 5+10×2−½×9.81×4 = 5.38 (accounting for drag). |
| G6-3 | Foam decays to 0 | Generate foam=1.0 at a point. After 10s with no new sources: foam < 0.05. |
| G6-4 | Edge strength > 0 at broken links | Break links in a line. edgePhiTex.R > 0.3 along that line. |

---

## 13. Group 7: Rendering Pipeline

**Dependencies:** Groups 1, 2, 3  
**Gate:** No visible seams between HF and sheet in calm water. Broken links show heightfield through gaps.

### File: `src/rendering/SheetRenderer.ts`

**Purpose:** Render the sheet as a displaced grid mesh with:
- Vertex positions from posTex
- Normals from normalTex (link-weighted)
- Alpha from link health + thickness
- Edge foam from edgePhiTex
- Φ fusion for smooth normals across seams

**Use the vertex/fragment shaders from OPUS Master Plan Section 7.2**, adapted to GLSL 300 es.

**Mesh construction:**
```typescript
// Create (res-1)×(res-1) quad grid
// Each vertex gets a UV attribute for sampling posTex
// Index buffer creates 2 triangles per quad
const res = config.sheet.resolution; // 128
const geo = new THREE.BufferGeometry();

// UV attribute: texel center coordinates
const uvs = new Float32Array(res * res * 2);
for (let y = 0; y < res; y++) {
  for (let x = 0; x < res; x++) {
    const i = y * res + x;
    uvs[i * 2]     = (x + 0.5) / res;
    uvs[i * 2 + 1] = (y + 0.5) / res;
  }
}
geo.setAttribute('texelUV', new THREE.BufferAttribute(uvs, 2));

// Index buffer
const indices = new Uint32Array((res - 1) * (res - 1) * 6);
let idx = 0;
for (let y = 0; y < res - 1; y++) {
  for (let x = 0; x < res - 1; x++) {
    const i00 = y * res + x;
    const i10 = i00 + 1;
    const i01 = i00 + res;
    const i11 = i01 + 1;
    indices[idx++] = i00; indices[idx++] = i10; indices[idx++] = i11;
    indices[idx++] = i00; indices[idx++] = i11; indices[idx++] = i01;
  }
}
geo.setIndex(new THREE.BufferAttribute(indices, 1));
```

### File: `src/rendering/SprayRenderer.ts`

Render spray particles as point sprites. Read sprayPosTex/sprayVelTex in vertex shader.

### File: `src/rendering/Compositor.ts`

Final composite pass:
1. Render heightfield ocean (opaque, full screen)
2. Render sheet mesh on top (alpha-blended, depth-tested)
3. Render spray on top (additive-blended)
4. Foam overlay (screen-space blend)

---

## 14. Group 8: Orchestrator + Debug

### File: `src/engine/OpusEngine.ts`

**Purpose:** The main engine class that runs all 17 passes in order.

```typescript
export class OpusEngine {
  // Systems
  private heightfieldUpdate: HeightfieldUpdate;
  private heightfieldDiag: HeightfieldDiagnostics;
  private heightfieldRenderer: HeightfieldRenderer;
  private sheetZones: SheetZone[] = [];
  private hullManager: HullManager;
  // ... all pass classes
  
  constructor(config: OpusConfig, renderer: THREE.WebGLRenderer, scene: THREE.Scene);
  
  /**
   * Run one complete frame.
   * Call this in your R3F useFrame() or requestAnimationFrame loop.
   */
  update(dt: number): void {
    const cappedDt = Math.min(dt, 0.033);
    
    // Pass 1: Heightfield
    this.heightfieldUpdate.update(cappedDt);
    
    // Pass 2: Diagnostics
    this.heightfieldDiag.update(this.heightfieldUpdate.texture);
    
    // Update renderer textures
    this.heightfieldRenderer.updateTextures(
      this.heightfieldUpdate.texture,
      this.heightfieldDiag.texture
    );
    
    // Per-zone passes (3-15)
    for (const zone of this.sheetZones) {
      this.updateZone(zone, cappedDt);
    }
  }
  
  private updateZone(zone: SheetZone, dt: number): void {
    // Pass 3: Hull contact
    // Pass 4: Pressure
    // Pass 5: Link update
    // Pass 6: Viscosity
    // Pass 7: Force integrate (MRT → swap pos + vel)
    // Pass 8: Self-envelope
    // Pass 9: Barrier contact (MRT → swap pos + vel)
    // Pass 10: Thickness
    // Pass 11: Normals
    // Pass 12: Edge/Phi
    // Pass 13: Spray detect
    // Pass 14: Spray update
    // Pass 15: Foam
  }
  
  // Public API
  addImpulse(x: number, z: number, radius: number, strength: number): void;
  addHull(id: string, mesh: THREE.Mesh): void;
  removeHull(id: string): void;
  
  dispose(): void;
}
```

### File: `src/app/OpusDemo.tsx`

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';

function WaterScene() {
  const engineRef = useRef<OpusEngine | null>(null);
  const { gl, scene } = useThree();
  
  useEffect(() => {
    engineRef.current = new OpusEngine(DEFAULT_CONFIG, gl, scene);
    return () => engineRef.current?.dispose();
  }, []);
  
  useFrame((_, delta) => {
    engineRef.current?.update(delta);
  });
  
  // Click to add impulse
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    engineRef.current?.addImpulse(e.point.x, e.point.z, 3.0, 50.0);
  };
  
  return (
    <mesh onClick={handleClick} rotation={[-Math.PI/2, 0, 0]} position={[0, -10, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function OpusDemo() {
  return (
    <Canvas camera={{ position: [0, 20, 40], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 80, 30]} intensity={1.2} />
      <WaterScene />
      <OrbitControls />
    </Canvas>
  );
}
```

---

## 15. Configuration Reference

Use `DEFAULT_CONFIG` from `OpusConfig.ts`. Here are the most important tuning knobs:

### Heightfield
| Param | Default | Range | Effect |
|-------|---------|-------|--------|
| resolution | 512 | 256/512/1024 | Wave detail. 512 is sweet spot. |
| worldSize | 200 | 50-500 | Ocean extent in meters |
| depth | 20 | 1-100 | Wave speed = √(g×depth). Deeper = faster waves. |
| damping | 0.995 | 0.99-1.0 | Energy loss per 60Hz step. Lower = faster decay. |

### Sheet Physics
| Param | Default | Range | Effect |
|-------|---------|-------|--------|
| breakRate | 5.0 | 1-10 | Link break speed (higher = snappier seams) |
| healRate | 0.5 | 0.1-2.0 | Link heal speed (lower = longer wake persistence) |
| viscosity | 0.05 | 0.01-0.2 | Velocity diffusion (higher = more cohesive) |
| damping | 0.5 | 0.1-2.0 | Global velocity damping (higher = calmer) |
| hfCoupling | 0.1 | 0.01-0.5 | How strongly sheet follows heightfield horizontally |
| hullStiffness | 2000 | 500-5000 | Hull push-back force (higher = stiffer contact) |
| pressureStiffness | 100 | 10-500 | Above-surface pull-back strength |

### Self-Envelope
| Param | Default | Range | Effect |
|-------|---------|-------|--------|
| barrierStiffness | 500 | 100-2000 | Fold contact force |
| slapDamping | 5.0 | 1-20 | Contact damping (higher = less bounce) |
| envelopeDilationRadius | 3 | 1-5 | Barrier field reach in texels |

---

## 16. Validation Tests

### Priority Order (build tests in this order):

1. **Equilibrium** (Group 3 gate) — Sheet settles on flat water
2. **Wave tracking** (Group 3 gate) — Sheet follows waves
3. **Seam split** (Group 4 gate) — Hull creates seam
4. **Seam heal** (Group 4 gate) — Links recover after hull removal
5. **Force isolation** (Group 4 gate) — No velocity leaks across seams
6. **Fold barrier** (Group 5 gate) — Underside stops at envelope
7. **Thickness conservation** (Group 5 gate) — Mass stays bounded
8. **Spray ejection rules** (Group 6 gate) — Only fully-disconnected eject
9. **Foam decay** (Group 6 gate) — Foam doesn't persist forever
10. **60 FPS** (Group 8 gate) — Full pipeline under budget

### The Ultimate Integration Test

**Scenario:** V-hull in moderate waves, 10m from camera. ALL must pass simultaneously:

- [x] Heightfield shows natural waves
- [x] Sheet tracks heightfield within 0.3m RMS
- [x] Links break at keel (< 0.1 within 1m)
- [x] Break scales with hull speed (Froude)
- [x] Separated sides move independently
- [x] Links heal within 3s behind stopped hull
- [x] Steep waves create autonomous foam (no hull needed)
- [x] Fold transfers momentum via barrier (no jitter)
- [x] Thickness thins at stretched regions
- [x] Dead texels respawn from neighbors
- [x] Spray emits only from fully-disconnected texels
- [x] Seams hidden by Φ fusion + edge foam at 10m
- [x] Frame time < 16.67ms on GTX 1060
- [x] No NaN or Inf in any texture after 600 frames

---

## 17. Debug Visualization Modes

Toggle with keyboard keys. Each renders as a 50% opacity fullscreen overlay.

```
Key  Mode                    Texture           Encoding
───  ─────────────────────   ───────────────   ──────────────────────────
[1]  Height Heatmap          heightfieldTex.r  Blue(-2m) → Green(0) → Red(+2m)
[2]  Steepness               diagnosticTex.r   Black(0) → Yellow(0.4) → Red(1.0)
[3]  Curvature               diagnosticTex.g   Blue(concave) → White(0) → Red(convex)
[4]  Jacobian                diagnosticTex.b   Green(>0 safe) → Red(<0 folding)
[5]  Sheet Position Y        posTex.y          Same as [1]
[6]  Link Health ★           linkTex.rg        Green(1.0) → Yellow(0.5) → Red(0.0)
[7]  Pressure Delta          P_below - P_above Blue(up) → White(0) → Red(down)
[8]  Thickness               thickTex.r        Transparent(0) → Blue(0.5) → White(2.0)
[9]  Hull Contact            hullTex.a         Black(no hull) → White(hull)
[A]  Self-Envelope           envTex.r          Green intensity = barrier height
[B]  Edge Strength           edgePhiTex.r      Red intensity = broken edges
[C]  Phi Fusion              edgePhiTex.g      Cyan intensity = fusion field
[0]  Performance             per-pass timing   Horizontal bars with ms labels
```

Implementation: A single `TextureVisualizer` class with a mode switch:

```typescript
class TextureVisualizer {
  setMode(mode: number): void;         // 0-12
  setTexture(tex: THREE.Texture): void; // which texture to visualize
  render(): void;                       // render overlay
}
```

---

## 18. Symptom → Fix Index

### Sheet Explodes (positions go to infinity/NaN)
1. Check velocity clamping in ForceIntegrate (maxSpeed = 30)
2. Check dt clamping (must be ≤ 0.033)
3. Check pressure sign (P_below should be ≥ 0)
4. Check hull stiffness (reduce to 1000 if unstable)
5. Ensure symplectic Euler order (velocity THEN position)

### Sheet Sinks Below Heightfield
1. Check pressure formula sign: `depth = η - pos.y`, `P_below = ATM + ρg×depth` when depth > 0
2. Check normal direction (should point toward low pressure = upward)
3. Reduce damping to 0.3

### Sheet Oscillates Forever
1. Increase damping to 0.8
2. Increase viscosity to 0.1

### Seams Never Heal
1. Which heal condition is failing? Visualize with [6]
2. Reduce healProximity threshold (0.2 → 0.5)
3. Reduce healRate requirement — it's too strict
4. Is sheet actually settling? Check with [5]

### Visible Grid Lines on Sheet
1. Sheet resolution too low — increase to 192 or 256
2. Normal computation wrong — check link-weighted normals
3. Consider adding heightfield normal detail to sheet surface

### Frame Time Too High
1. Enable [0] performance overlay
2. Check which pass is the bottleneck
3. Reduce sheet resolution first (biggest impact)
4. Disable self-envelope (Pass 8-9) if not needed
5. Reduce foam resolution

### Texture Readback Stall (random 100ms+ spikes)
1. **NEVER** call `gl.readPixels` in the render loop
2. Use GPU-only pipeline (no CPU reads)
3. For debug, use L1 telemetry (visual overlays only)

---

## 19. Future: GPT Waves v7 Integration

The existing GPT Waves v7 app has strengths that OPUS should eventually absorb:

| v7 Feature | OPUS Equivalent | Integration Plan |
|------------|----------------|------------------|
| Object interaction (sphere, walls) | Hull contact pass | Hull geometry can be ANY mesh — just render it to hullTex |
| Caustics | Not yet in OPUS | Add as post-process pass after compositor |
| Gerstner waves | SWE heightfield | Can add Gerstner sum to heightfield η as an overlay |
| Water color/reflection/refraction | HeightfieldRenderer PBR | v7's appearance quality should be ported to OPUS renderer |
| Wind-driven waves | HeightfieldUpdate | Add wind forcing term to SWE |

**Phase 1 priority:** Get OPUS running standalone with SWE + sheet + hull.  
**Phase 2:** Port v7's rendering quality (caustics, refraction, colors) into OPUS's renderer.  
**Phase 3:** Replace v7's simulation with OPUS's simulation, keeping v7's visual quality.

---

## IMPLEMENTATION ORDER CHECKLIST

```
□ Group 1: PingPong.ts, PassRunner.ts, GPUProfiler.ts, verify OpusConfig.ts
  └─ Gate: swap test, solid-color render test

□ Group 2: Verify existing HeightfieldUpdate/Diagnostics/Renderer files
  └─ Gate: impulse → ring, steepness > 0, energy decay

□ Group 3: SheetInitializer.ts, PressureCompute.ts, ForceIntegrate.ts, NormalCompute.ts
  └─ Gate: sheet settles, tracks waves, no explosion

□ Group 4: HullContactPass.ts, HullManager.ts, LinkUpdate.ts, ViscosityDiffuse.ts
  └─ Gate: hull splits seam, seam heals, force isolation

□ Group 5: SelfEnvelope.ts, BarrierContact.ts, ThicknessAdvect.ts
  └─ Gate: fold stops at barrier, thickness conserved

□ Group 6: EdgePhiCompute.ts, SprayDetect.ts, SprayUpdate.ts, FoamSystem.ts
  └─ Gate: correct ejection rules, foam decays

□ Group 7: SheetRenderer.ts, SprayRenderer.ts, Compositor.ts
  └─ Gate: no visible seams, alpha fade at breaks

□ Group 8: OpusEngine.ts, TextureVisualizer.ts, OpusDemo.tsx, DebugPanel.tsx
  └─ Gate: 60 FPS, ultimate integration test passes
```

**DO NOT skip gates. DO NOT proceed to Group N+1 until Group N's gate passes.**

---

## COMMON GLSL HEADER

Every sheet shader should include this preamble (inline, not as a separate file, since WebGL2 doesn't support `#include`):

```glsl
// ── Common OPUS utilities (copy into every sheet shader) ──
vec2 texel(vec2 res) { return 1.0 / res; }

vec2 sheetToWorld(vec2 uv, vec2 origin, vec2 size) {
    return origin + uv * size;
}

vec2 worldToHfUV(vec2 worldXZ, vec2 hfOrigin, vec2 hfSize) {
    return clamp((worldXZ - hfOrigin) / hfSize, 0.001, 0.999);
}

float sampleEta(sampler2D hfTex, vec2 sheetUV, vec2 sheetOrigin, vec2 sheetSize, vec2 hfOrigin, vec2 hfSize) {
    vec2 worldXZ = sheetToWorld(sheetUV, sheetOrigin, sheetSize);
    return texture(hfTex, worldToHfUV(worldXZ, hfOrigin, hfSize)).r;
}
```

**Cursor agent:** Copy this block into the top of every sheet shader file. Do NOT try to use `#include`.

---

*End of orchestration document. Build it group by group. Gate by gate. This is the engine.*