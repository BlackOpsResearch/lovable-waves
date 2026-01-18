# Ocean Simulation Architecture - Hyperrealistic 2026 Metaverse

**Version:** 1.0  
**Date:** 2026-01-18  
**Purpose:** Architectural blueprint for scaling the pool water simulation to infinite ocean with LOD

---

## 🌊 Core Learning from Pool Simulation

### What Makes the Water Look Incredible

The pool simulation achieves photorealism through these key systems:

#### 1. **Height-Field Wave Simulation** (GPU-based)
- **Resolution:** 256×256 floating-point texture
- **Data Layout:** RGBA = (height, velocity, normal.x, normal.z)
- **Wave Propagation:** Finite difference with neighbor averaging
- **Damping:** 0.995 for natural decay + DC drift removal (×0.9995)
- **Obstacle Masking:** Reflective boundaries at solid objects

#### 2. **Caustics Rendering** (Projection-based)
- **Method:** Refraction projection with area change calculation
- **Fresnel Transmission:** Schlick approximation (F0 = 0.02)
- **Absorption:** Beer-Lambert law (exp(-σ × pathLength))
- **Focus Calculation:** oldArea/newArea ratio with epsilon clamping
- **Dispersion:** RGB channel offset based on refraction direction
- **Sphere Shadow:** Soft shadow calculation in caustic space

#### 3. **Water Surface Rendering**
- **Fresnel Effect:** mix(0.25, 1.0, pow(1 - dot(N, -V), 3))
- **Above Water:** Sky reflection + refracted underwater view
- **Below Water:** Total internal reflection + refracted above view
- **Normal Refinement:** 5 iterations of coordinate displacement

#### 4. **Wall/Floor Shading**
- **Tile Texturing:** UV-mapped with caustic overlay
- **Caustic Integration:** Sample at projected position
- **Underwater Tinting:** ×underwaterColor (0.4, 0.9, 1.0)
- **Ambient Occlusion:** Distance-based sphere shadow

---

## 🏗️ Ocean Expansion Architecture

### Phase 1: Infinite Terrain Foundation

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIERARCHICAL LOD SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Level 0: Base Ocean (Always Active)                             │
│  ├── Gerstner Waves (8-16 waves, GPU vertex displacement)       │
│  ├── Wind-driven animation                                       │
│  ├── Procedural normal maps (dual-layer flow)                    │
│  └── Performance: ~1ms/frame                                     │
│                                                                   │
│  Level 1: Interactive Water (On-Demand Zones)                    │
│  ├── Height-field simulation (256×256 per zone)                  │
│  ├── Object displacement + wake generation                       │
│  ├── Zone activation: objects within 2m of surface               │
│  └── Performance: ~2-5ms per active zone                         │
│                                                                   │
│  Level 2: Advanced Physics (Near Character)                      │
│  ├── High-res height-field (512×512)                             │
│  ├── Momentum-based displacement                                  │
│  ├── Scale-aware wave propagation                                 │
│  └── Performance: ~5-10ms per zone                                │
│                                                                   │
│  Level 3: Special Effects (Event-Triggered)                      │
│  ├── Breaching/spray metaballs                                    │
│  ├── Bubble particle system (1024 particles)                      │
│  ├── Surface foam accumulation                                    │
│  └── Performance: ~15-30ms when triggered                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Gerstner Wave System

```glsl
// Core Gerstner wave function for ocean base layer
struct GerstnerWave {
  vec2 direction;    // Wave travel direction
  float steepness;   // Q factor (0-1, controls sharpness)
  float wavelength;  // Wavelength in meters
  float speed;       // Phase speed
  float amplitude;   // Wave height
};

vec3 calculateGerstnerOffset(vec2 pos, float time, GerstnerWave wave) {
  float k = 2.0 * PI / wave.wavelength;
  float c = sqrt(9.8 / k);  // Gravity wave speed
  float f = k * (dot(wave.direction, pos) - c * time);
  float a = wave.steepness / k;
  
  return vec3(
    wave.direction.x * a * cos(f),
    wave.amplitude * sin(f),
    wave.direction.y * a * cos(f)
  );
}
```

### Phase 3: Caustic LOD System

```
┌──────────────────────────────────────────────────────────────────┐
│                    CAUSTIC LOD GRADIENT                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Distance 0-10m:   Full projection caustics (1024×1024)          │
│                    - Area-change focus calculation                │
│                    - RGB dispersion                               │
│                    - Temporal accumulation                        │
│                                                                    │
│  Distance 10-50m:  Simplified caustics (512×512)                 │
│                    - Reduced sample weight                        │
│                    - No dispersion                                │
│                                                                    │
│  Distance 50-200m: Texture-based caustics                        │
│                    - Pre-computed animated texture                │
│                    - UV scrolling with depth fade                 │
│                                                                    │
│  Distance 200m+:   No caustics                                   │
│                    - Simple depth-based color                     │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 4: Constraint-Based MLS-MPM (Future)

The revolutionary approach from MLSMPM_CONSTRAINT_BASED_LOD_ARCHITECTURE:

1. **MLS-MPM Always Running**: Particles exist as 2D surface layer (64×64 or 128×128)
2. **Heightfield as Target**: Gerstner waves define "rest state surface"
3. **Constraint Force**: `F = k × (η_target - η_particle) × normal`
4. **Breaking Free**: When forces exceed threshold, particles show full physics
5. **Smooth LOD**: No spawn pop-in, seamless transitions

---

## 🎨 Visual Quality Preservation

### Key Rendering Techniques to Maintain

1. **Fresnel Reflection/Refraction**
   - Above water: 0.25 base reflectivity, pow(1-NdotV, 3) curve
   - Below water: Total internal reflection handling
   - Critical angle: arcsin(1/1.333) ≈ 48.6°

2. **Subsurface Scattering**
   - View-dependent forward scattering
   - pow(dot(L, -V), 4) × scatter color

3. **Foam/Whitecaps**
   - Height-based threshold (wave peaks)
   - Velocity-based (breaking waves)
   - Surface foam texture accumulation with decay

4. **Atmospheric Integration**
   - Rayleigh scattering for sky color
   - Mie scattering for sun glow
   - Distance fog with height falloff

---

## 🌍 Environment Boundaries

### Beach/Shore Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHORE TRANSITION SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Beach Zone (height < water level + 0.5m):                       │
│  ├── Wave break detection (height derivative threshold)          │
│  ├── Foam spray particles at break point                         │
│  ├── Shore wave rollup (reduced wavelength, increased amp)       │
│  └── Sand wetness texture (time-based decay)                     │
│                                                                   │
│  Shallow Zone (depth 0-2m):                                       │
│  ├── Enhanced caustics (shorter path, brighter focus)            │
│  ├── Sand ripple visibility                                       │
│  ├── Wave steepening (shoaling effect)                           │
│  └── Foam accumulation                                            │
│                                                                   │
│  Deep Zone (depth > 2m):                                          │
│  ├── Standard caustics with depth fade                           │
│  ├── Absorption-based color shift                                 │
│  └── Full wave propagation                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Roadmap

### Milestone 1: Scalable Water Mesh
- [ ] Replace fixed pool geometry with clipmap-based ocean tiles
- [ ] Implement distance-based tessellation
- [ ] Add Gerstner wave vertex displacement

### Milestone 2: LOD Caustics
- [ ] Create texture-based caustic fallback for distance
- [ ] Implement caustic resolution scaling
- [ ] Add depth-based caustic fade

### Milestone 3: Atmospheric Sky
- [ ] Port ProceduralEarth atmospheric scattering
- [ ] Implement sun position controls
- [ ] Add volumetric clouds (al-ro Perlin-Worley)

### Milestone 4: Terrain Integration
- [ ] Procedural terrain generation with LOD
- [ ] Beach/shore transition zones
- [ ] Underwater terrain caustic projection

### Milestone 5: God Rays
- [ ] Volumetric light scattering
- [ ] Cloud shadow integration
- [ ] Distance-based step count LOD

### Milestone 6: Advanced Physics
- [ ] Wave breaking detection
- [ ] Foam particle system
- [ ] Shore interaction

---

## 📊 Performance Targets

| Component | Target | LOD Strategy |
|-----------|--------|--------------|
| Base Water | 1ms | Always on, Gerstner only |
| Interactive Zone | 2-5ms | On-demand activation |
| Caustics | 3-8ms | Resolution + feature scaling |
| Atmosphere | 2-4ms | Step count reduction |
| Terrain | 5-10ms | Geometry clipmaps |
| Volumetric Clouds | 8-15ms | Distance-based step reduction |
| **Total Budget** | **30ms (33fps)** | Dynamic quality scaling |

---

## 🔗 Reference Documents

- `docs/GPTWAVES_V7_REFERENCE.md` - Complete pool simulation code
- `docs/HIERARCHICAL_WATER_LOD_SYSTEM.md` - LOD system design
- `docs/MLSMPM_CONSTRAINT_BASED_LOD_ARCHITECTURE.md` - Advanced physics
- `docs/PROCEDURAL_EARTH_ENGINE.md` - Terrain, clouds, atmosphere
- `docs/VOLUMETRIC_CLOUDS_REFERENCE.md` - Cloud rendering

---

*This architecture is designed for the 2026 Metaverse competition, targeting hyperrealistic ocean simulation with extreme scalability.*
