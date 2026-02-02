

# Hyperrealistic Ocean Expansion: Complete Implementation Plan

## Executive Summary

This plan transforms the current pool-based water simulation into an infinite, hyperrealistic ocean with LOD systems, Gerstner wave animation, MLS-MPM particle simulation (ported from Splash), and WebGL2 support. The goal is to create the most advanced browser-based ocean simulation for the 2026 Metaverse competition.

---

## Phase 1: Foundation - WebGL2 Upgrade & Encyclopedia Reference

### 1.1 Save Encyclopedia Reference Document
- Save `ENCYCLOPEDIA_OCEAN_SIM_EXPANSION_MONOLITH.md` to `docs/` folder
- This becomes the authoritative reference for all implementation decisions

### 1.2 WebGL2 Context Upgrade
**File: `src/lib/webgl/GLContext.ts`**
- Upgrade from WebGL1 to WebGL2 with fallback
- Add WebGL2-specific features:
  - `gl.HALF_FLOAT` native support (no extension)
  - Transform feedback for particle systems
  - Multiple render targets (MRT)
  - 3D textures for volumetric effects
  - Integer textures for particle indexing

### 1.3 Texture System Enhancement
**File: `src/lib/webgl/Texture.ts`**
- Add 3D texture support (`TEXTURE_3D`)
- Add texture arrays (`TEXTURE_2D_ARRAY`)
- Add R16F/R32F single-channel formats
- Support for compute-style ping-pong buffers

---

## Phase 2: Animated Gerstner Wave System

### 2.1 Enhanced Gerstner Wave Vertex Shader
**File: `src/lib/ocean/shaders/gerstnerWaves.ts`**
- Already have 8-layer Gerstner waves
- Add LOD-aware wave calculation (`calculateGerstnerWavesLOD`)
- Add wind direction influence
- Add spectrum-based amplitude distribution

### 2.2 Wave Integration into Water Surface
**Files affected:**
- `src/lib/ocean/HyperOceanRenderer.ts`
- `src/lib/webgl/Renderer.ts`

**Implementation:**
- Pass time, amplitude, steepness, windDirection uniforms to vertex shader
- Combine heightfield simulation displacement with Gerstner animation
- Formula: `finalHeight = simulatedHeight + gerstnerOffset.y`
- Apply horizontal displacement for authentic wave shapes

### 2.3 Multi-Layer Wave System (L0-L3)
Per the encyclopedia hybrid ladder:
- **L0 (Shading-only)**: Animated normal maps for micro-detail
- **L1 (Kinematic)**: Gerstner waves for base motion
- **L2 (Spectral - future)**: FFT-based wave spectra
- **L3 (Heightfield PDE)**: Current simulation for interactions

---

## Phase 3: Infinite Ocean with LOD Mesh System

### 3.1 Create LOD Ocean Mesh Generator
**New File: `src/lib/ocean/OceanMesh.ts`**

```text
Architecture:
- Concentric ring mesh around camera
- High detail near camera (256x256 grid)
- Lower detail at distance (32x32 grid)
- Seamless LOD transitions with morph weights
- Support for up to 10km horizon distance
```

**LOD Rings:**
| Ring | Distance | Grid Size | Wave Layers |
|------|----------|-----------|-------------|
| 0 | 0-50m | 256x256 | 8 Gerstner |
| 1 | 50-200m | 128x128 | 6 Gerstner |
| 2 | 200-500m | 64x64 | 4 Gerstner |
| 3 | 500-2000m | 32x32 | 2 Gerstner |
| 4 | 2000m+ | 16x16 | 1 Gerstner |

### 3.2 Remove Pool Boundaries
**Files affected:**
- `src/lib/webgl/Renderer.ts` - Remove cube/pool rendering
- `src/hooks/useHyperOcean.ts` - Remove pool wall constraints
- `src/lib/ocean/HyperOceanRenderer.ts` - Add infinite horizon rendering

**Implementation:**
- Replace `Mesh.cube()` pool with open ocean floor
- Modify sphere physics for open water
- Add horizon fog/atmospheric fade
- Optional: Shore/beach boundary system

### 3.3 Camera-Following Ocean Mesh
**File: `src/lib/ocean/OceanMesh.ts`**
- Mesh tiles follow camera position
- Seamless tiling using modulo coordinates
- No visible seams or popping

---

## Phase 4: LOD Caustics System

### 4.1 Distance-Based Caustics Quality
**File: `src/lib/ocean/shaders/enhancedCaustics.ts`**

**LOD Tiers:**
- Near (0-20m): Full dispersion caustics, high resolution
- Mid (20-100m): Simple caustics, reduced resolution
- Far (100m+): Pre-baked caustic texture animation

### 4.2 Caustic Resolution Scaling
**File: `src/lib/ocean/HyperOceanRenderer.ts`**
- Create multiple caustic render targets at different resolutions
- Blend between LOD levels
- Use lower resolution for underwater fog regions

---

## Phase 5: MLS-MPM Particle System (Splash Port)

### 5.1 MLS-MPM Core Implementation
**New Files:**
- `src/lib/mpm/MLSMPMSimulation.ts` - Core simulation engine
- `src/lib/mpm/ParticleBuffer.ts` - GPU particle management
- `src/lib/mpm/GridBuffer.ts` - MAC grid management

**Algorithm (from Splash reference):**
```text
1. P2G Pass 1: Transfer mass to grid
2. P2G Pass 2: Transfer momentum to grid
3. Grid Update: Apply forces (gravity, pressure via Tait equation)
4. G2P: Transfer velocities back, advect particles
5. Copy Position: Update render buffers
```

### 5.2 WebGL2 Compute Shaders (via Transform Feedback)
**New File: `src/lib/mpm/shaders/mpmShaders.ts`**

Since WebGL2 doesn't have compute shaders, we use:
- **Transform feedback** for particle updates
- **Floating-point textures** for grid data
- **Multi-pass rendering** for grid operations

**Shader Pipeline:**
- `clearGrid.glsl` - Grid initialization
- `p2g1.glsl` - Particle to Grid (mass)
- `p2g2.glsl` - Particle to Grid (momentum)
- `updateGrid.glsl` - Grid forces (Tait pressure)
- `g2p.glsl` - Grid to Particle (advect)

### 5.3 Screen-Space Fluid Rendering
**New File: `src/lib/mpm/shaders/fluidRender.ts`**

Port from Splash:
- Depth map rendering (particle depth)
- Narrow-Range Filter for depth smoothing
- Screen-space normals from filtered depth
- Thickness estimation for SSS

### 5.4 Hybrid Heightfield-MPM Integration
**File: `src/lib/ocean/OceanSimulation.ts`**

Per encyclopedia Vol III (Hybrid Ocean):
- Base ocean (heightfield) always active
- MPM particles for breach events only
- BFT (Breach Feedback Texture) couples back to heightfield
- Delta layering: `η_total = η_base + δ_sim + δ_breach`

---

## Phase 6: Advanced Visual Effects

### 6.1 Subsurface Scattering Enhancement
**File: `src/lib/ocean/shaders/oceanSurface.ts`**
- Enhanced SSS based on sun angle and wave height
- Light transmission through wave crests
- Color shift based on water depth

### 6.2 Foam System
**New File: `src/lib/ocean/FoamRenderer.ts`**
- Wave crest foam (Jacobian-based detection)
- Wake foam from moving objects
- Beach foam at shorelines
- Foam advection and decay

### 6.3 Volumetric Clouds Integration
**File: `src/lib/ocean/CloudRenderer.ts`**
- Already implemented volumetric clouds
- Add god rays through clouds
- Cloud shadows on water surface

---

## Phase 7: Settings & UI

### 7.1 Extended Ocean Settings
**File: `src/lib/ocean/OceanConfig.ts`**

Add settings for:
- Wave amplitude per frequency band
- Wind direction and speed
- Ocean scale (infinite vs bounded)
- LOD distance thresholds
- MPM particle budget
- Caustic quality level

### 7.2 Updated Controls Panel
**File: `src/components/OceanControls.tsx`**
- Add LOD visualization toggle
- Add wave layer toggles
- Add particle system controls
- Add ocean boundary mode (infinite/beach/pool)

---

## Technical Details

### WebGL2 Extension Requirements
```text
- EXT_color_buffer_float (for float render targets)
- OES_texture_float_linear (for float texture filtering)
- EXT_float_blend (for additive blending)
```

### Performance Targets
- 60 FPS on desktop (GTX 1060+)
- 30 FPS on mobile (iPhone 12+)
- LOD system enables 10+ km visible ocean
- MPM limited to 100K particles max

### Memory Budget
| System | VRAM Usage |
|--------|------------|
| Heightfield (256x256 RGBA32F) | 1 MB |
| Caustics (1024x1024 RGBA8) | 4 MB |
| LOD Ocean Mesh | 10 MB |
| MPM Particles (100K) | 8 MB |
| 3D Noise (256^3) | 16 MB |
| Skybox + Textures | 24 MB |
| **Total** | **~63 MB** |

---

## File Creation Summary

### New Files to Create:
1. `docs/ENCYCLOPEDIA_OCEAN_SIM_EXPANSION_MONOLITH.md` - Reference document
2. `src/lib/ocean/OceanMesh.ts` - LOD mesh system
3. `src/lib/ocean/FoamRenderer.ts` - Foam system
4. `src/lib/mpm/MLSMPMSimulation.ts` - MLS-MPM core
5. `src/lib/mpm/ParticleBuffer.ts` - Particle management
6. `src/lib/mpm/GridBuffer.ts` - Grid management
7. `src/lib/mpm/shaders/mpmShaders.ts` - MPM shaders
8. `src/lib/mpm/shaders/fluidRender.ts` - Screen-space rendering
9. `src/lib/mpm/NarrowRangeFilter.ts` - Depth smoothing filter

### Files to Modify:
1. `src/lib/webgl/GLContext.ts` - WebGL2 upgrade
2. `src/lib/webgl/Texture.ts` - 3D texture support
3. `src/lib/webgl/Mesh.ts` - LOD mesh generation
4. `src/lib/ocean/HyperOceanRenderer.ts` - Infinite ocean rendering
5. `src/lib/ocean/OceanConfig.ts` - Extended settings
6. `src/hooks/useHyperOcean.ts` - MPM integration
7. `src/components/OceanControls.tsx` - New controls
8. `src/lib/ocean/shaders/gerstnerWaves.ts` - Wave enhancements

---

## Implementation Order

1. **Phase 1** (Foundation): WebGL2 + Save encyclopedia
2. **Phase 2** (Waves): Gerstner integration into vertex shader  
3. **Phase 3** (LOD): Infinite ocean mesh with camera following
4. **Phase 4** (Caustics): Distance-based caustic LOD
5. **Phase 5** (MPM): MLS-MPM particle system port
6. **Phase 6** (VFX): Foam, SSS, clouds integration
7. **Phase 7** (Polish): Settings, UI, presets

Each phase builds on the previous, with the simulation remaining functional after each phase.

