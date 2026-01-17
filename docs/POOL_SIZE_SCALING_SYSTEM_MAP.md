# Pool Size Scaling System Map
## Comprehensive Analysis for Variable Pool Dimensions (X, Y, Z)

**Date:** 2025-01-27  
**Purpose:** Map all systems that depend on pool dimensions to enable variable pool sizes without skewing shaders, textures, caustics, reflections, or magnification.

---

## 🎯 **CURRENT STATE: Fixed Pool Size**

### **Current Pool Size Implementation**
- **Default Size:** `poolSize = 2.0` (passed as prop to `GptwavesV7Scene`)
- **Scaling Factor:** `groupScale = poolSize / 2` (line 903 in `GptwavesV7Scene.tsx`)
- **Geometry:** Unit cube (-1 to +1 in all axes) scaled by `groupScale`
- **Water Surface:** `PlaneGeometry(2, 2, 200, 200)` - hardcoded 2x2 plane

### **Key Scaling Point**
```typescript
// GptwavesV7Scene.tsx:903
const groupScale = poolSizeRef.current / 2;
groupRef.current.scale.setScalar(groupScale);
```
**All child objects** (Pool, WaterSurface, Sphere, etc.) are inside `groupRef`, so they all scale uniformly.

---

## 📊 **SYSTEM DEPENDENCIES MAP**

### **1. GEOMETRY SYSTEMS**

#### **1.1 Pool Geometry (`Pool.tsx`)**
- **Current:** Unit cube (-1 to +1) created manually
- **Scaling:** Inherits from `groupRef.scale` (uniform scale)
- **Shader Uniforms:** None (geometry is scaled, shader uses world-space)
- **Dependencies:**
  - `CUBE_VERTEX_SHADER` / `CUBE_FRAGMENT_SHADER` (rendererShaders.ts)
  - Uses world-space coordinates directly
  - Hardcoded cube bounds in shader: `vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0)`
- **Impact:** ✅ **WORKS** - Geometry scales, shader uses world-space
- **Issue:** ⚠️ Hardcoded `poolHeight = 1.0` in shader helper functions

#### **1.2 Water Surface (`WaterSurface.tsx`)**
- **Current:** `PlaneGeometry(2, 2, 200, 200)` - hardcoded 2x2
- **Scaling:** Inherits from `groupRef.scale`
- **Vertex Shader:** `WATER_VERTEX_SHADER` samples water texture at `position.xy * 0.5 + 0.5`
- **Dependencies:**
  - Water simulation texture (256x256, UV space 0-1)
  - UV mapping assumes -1 to +1 world space → 0-1 UV space
- **Impact:** ✅ **WORKS** - Plane scales, UV mapping preserved
- **Issue:** None (UV mapping is relative)

#### **1.3 Sphere (`Sphere.tsx`)**
- **Current:** Sphere radius from settings, position in world space
- **Scaling:** Inherits from `groupRef.scale`
- **Dependencies:** None (sphere is independent)
- **Impact:** ✅ **WORKS** - Sphere scales with pool

---

### **2. SHADER SYSTEMS**

#### **2.1 Renderer Shaders (`rendererShaders.ts`)**

##### **2.1.1 Helper Functions**
```glsl
const float poolHeight = 1.0;  // ⚠️ HARDCODED
```
- **Used in:** `intersectCube()` calls throughout
- **Cube Bounds:** `vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0)`
- **Impact:** ❌ **BROKEN** - Hardcoded pool height doesn't scale
- **Fix Required:** Pass `uPoolHeight` uniform, use `uPoolSize` for X/Z

##### **2.1.2 UV Mapping**
```glsl
vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
```
- **Assumption:** World space -1 to +1 → UV 0 to 1
- **Impact:** ✅ **WORKS** - UV mapping is relative, scales correctly
- **Note:** This works because geometry scales, so world-space coordinates stay in -1 to +1 range

##### **2.1.3 Caustics UV Mapping**
```glsl
vec2 causticUv = uCausticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
```
- **Dependencies:** `uCausticsScale` (projection scale), world-space coordinates
- **Impact:** ✅ **WORKS** - Relative mapping, scales with pool
- **Note:** `uCausticsScale` is independent of pool size (user setting)

##### **2.1.4 Sand Albedo (Beach Mode)**
```glsl
vec2 uv = point.xz * uSandScale;
```
- **Dependencies:** `uSandScale` uniform (independent of pool size)
- **Impact:** ✅ **WORKS** - Scales with pool (world-space coordinates)

#### **2.2 Caustics Shaders (`causticsShaders.ts`)**

##### **2.2.1 Pool Height Uniform**
```glsl
uniform float uPoolHeight;  // ✅ Already a uniform!
```
- **Current Value:** `poolHeight = 1.0` (default in `useCaustics.ts:85`)
- **Used in:**
  - `intersectCube()` calls: `vec3(-1.0, -uPoolHeight, -1.0), vec3(1.0, 2.0, 1.0)`
  - `project()` function: `(-origin.y - uPoolHeight) / refractedLight.y`
- **Impact:** ⚠️ **PARTIAL** - Height is uniform, but X/Z are hardcoded to -1/+1
- **Fix Required:** Add `uPoolSizeX`, `uPoolSizeZ` uniforms

##### **2.2.2 Caustics Projection**
```glsl
gl_Position = vec4(uProjectionScale * (vNewPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
```
- **Dependencies:** `uProjectionScale` (user setting, independent)
- **Impact:** ✅ **WORKS** - Scales with pool (world-space coordinates)

##### **2.2.3 Cube Intersection**
```glsl
vec2 t = intersectCube(vNewPos, -refractedLight, vec3(-1.0, -uPoolHeight, -1.0), vec3(1.0, 2.0, 1.0));
```
- **Impact:** ❌ **BROKEN** - X/Z bounds hardcoded to -1/+1
- **Fix Required:** Use `uPoolSizeX`, `uPoolSizeZ` uniforms

#### **2.3 Simulation Shaders (`simulationShaders.ts`)**
- **Current:** Operates in UV space (0-1), independent of pool size
- **Resolution:** 256x256 texture (fixed)
- **Impact:** ✅ **WORKS** - Simulation is resolution-based, not size-based
- **Note:** Simulation resolution could be scaled with pool size for better quality on large pools

---

### **3. TEXTURE SYSTEMS**

#### **3.1 Water Simulation Texture**
- **Size:** 256x256 (configurable via `useWaterSimulation({ resolution })`)
- **UV Space:** 0-1 (normalized)
- **World Mapping:** `point.xz * 0.5 + 0.5` (assumes -1 to +1 world space)
- **Impact:** ✅ **WORKS** - UV mapping is relative, scales correctly
- **Note:** Resolution could scale with pool size for better detail

#### **3.2 Caustics Texture**
- **Size:** 1024x1024 (configurable via `useCaustics({ resolution })`)
- **UV Space:** 0-1 (normalized)
- **World Mapping:** Uses `uCausticsScale` and world-space coordinates
- **Impact:** ✅ **WORKS** - Scales with pool
- **Note:** Resolution could scale with pool size

#### **3.3 Bubble Field Texture**
- **Size:** 96x96 (fixed: `BUBBLE_FIELD_SIZE = 96`)
- **Layers:** 12 (fixed: `BUBBLE_FIELD_LAYERS = 12`)
- **UV Mapping:** `clamp(p.xz * 0.5 + 0.5, 0.0, 1.0)` (assumes -1 to +1 world space)
- **Impact:** ✅ **WORKS** - UV mapping is relative
- **Note:** Resolution could scale with pool size for better bubble detail

#### **3.4 Surface Foam Texture**
- **Size:** 256x256 (fixed)
- **UV Mapping:** Same as bubble field
- **Impact:** ✅ **WORKS** - UV mapping is relative

---

### **4. COORDINATE TRANSFORMATIONS**

#### **4.1 World Space → UV Space**
```glsl
vec2 uv = point.xz * 0.5 + 0.5;  // -1 to +1 → 0 to 1
```
- **Assumption:** Pool spans -1 to +1 in X and Z
- **Impact:** ✅ **WORKS** - This is preserved because geometry scales
- **Why:** When pool scales, world-space coordinates still span -1 to +1 (relative to scaled geometry)

#### **4.2 World Space → Pool Local Space**
- **Current:** Pool is unit cube (-1 to +1) scaled by `groupScale`
- **Impact:** ✅ **WORKS** - Scaling preserves relative coordinates

#### **4.3 Camera Space**
```typescript
const camDist = cameraDistanceRef.current;
groupMatrix.makeTranslation(0, 0, -camDist * groupScale);
```
- **Dependencies:** `groupScale` (poolSize / 2)
- **Impact:** ✅ **WORKS** - Camera distance scales with pool
- **Note:** This maintains correct magnification

---

### **5. PHYSICS SYSTEMS**

#### **5.1 Water Simulation**
- **Resolution:** 256x256 (fixed)
- **UV Space:** 0-1 (normalized)
- **Impact:** ✅ **WORKS** - Independent of pool size
- **Note:** Could scale resolution with pool size for better detail

#### **5.2 Sphere Physics**
- **Position:** World space (scales with pool)
- **Radius:** World units (scales with pool)
- **Impact:** ✅ **WORKS** - Sphere scales with pool

#### **5.3 Bubble Physics**
- **Spawn Position:** World space (scales with pool)
- **Rise Speed:** World units per second (scales with pool)
- **Impact:** ✅ **WORKS** - Bubbles scale with pool

---

### **6. RENDERING SYSTEMS**

#### **6.1 Reflections (Sky Cubemap)**
- **Source:** `CubeCamera` captures sky
- **UV Mapping:** Uses world-space coordinates
- **Impact:** ✅ **WORKS** - Scales with pool (world-space)

#### **6.2 Caustics Rendering**
- **Projection:** Uses world-space coordinates
- **Impact:** ✅ **WORKS** - Scales with pool
- **Issue:** ⚠️ Hardcoded X/Z bounds in cube intersection

#### **6.3 Magnification (Camera Zoom)**
```typescript
groupMatrix.makeTranslation(0, 0, -camDist * groupScale);
```
- **Dependencies:** `groupScale` (poolSize / 2)
- **Impact:** ✅ **WORKS** - Camera distance scales, maintaining correct magnification

---

## 🚨 **CRITICAL ISSUES IDENTIFIED**

### **Issue 1: Hardcoded Pool Height in Renderer Shaders**
**Location:** `rendererShaders.ts:12`
```glsl
const float poolHeight = 1.0;  // ⚠️ HARDCODED
```
**Impact:** Pool height doesn't scale when `poolSize` changes Y dimension
**Fix:** Convert to uniform `uPoolHeight`, pass from component

### **Issue 2: Hardcoded X/Z Bounds in Cube Intersections**
**Locations:**
- `rendererShaders.ts:167` - `intersectCube(..., vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0))`
- `causticsShaders.ts:32, 54, 148, 199` - Multiple `intersectCube()` calls with hardcoded -1/+1
**Impact:** Pool X/Z dimensions don't scale correctly in shader calculations
**Fix:** Add `uPoolSizeX`, `uPoolSizeZ` uniforms, replace hardcoded values

### **Issue 3: Boat Material Inverse Scale**
**Location:** `GptwavesV7Scene.tsx:982`
```typescript
uInvScale.value = poolSizeRef.current > 0 ? 2 / poolSizeRef.current : 1;
```
**Impact:** Assumes uniform scaling (poolSize applies to all dimensions)
**Fix:** Support separate X/Y/Z scaling factors

---

## ✅ **SYSTEMS THAT WORK CORRECTLY**

1. **Geometry Scaling** - All geometries scale via `groupRef.scale`
2. **UV Mapping** - Relative mapping (0-1) preserved
3. **Water Simulation** - Resolution-based, independent of pool size
4. **Caustics Projection** - Uses world-space, scales correctly
5. **Reflections** - World-space based, scales correctly
6. **Camera Magnification** - Scales with `groupScale`
7. **Sphere Physics** - World-space, scales correctly
8. **Bubble Physics** - World-space, scales correctly

---

## 🎯 **PROPOSED SOLUTION: Variable Pool Dimensions**

### **Design Principles**
1. **Maintain UV Mapping** - Keep 0-1 UV space regardless of pool size
2. **Scale Uniformly** - Use separate X/Y/Z scale factors
3. **Update Shader Uniforms** - Pass pool dimensions to shaders
4. **Preserve Simulation** - Keep simulation resolution independent (or scale proportionally)

### **Implementation Plan**

#### **Phase 1: Add Pool Dimension Settings**
```typescript
// In WaterSettings.ts
pool: {
  sizeX: number;  // Default: 2.0
  sizeY: number;  // Default: 2.0 (height)
  sizeZ: number;  // Default: 2.0
}
```

#### **Phase 2: Update Geometry Scaling**
```typescript
// GptwavesV7Scene.tsx
const groupScaleX = poolSizeX / 2;
const groupScaleY = poolSizeY / 2;
const groupScaleZ = poolSizeZ / 2;
groupRef.current.scale.set(groupScaleX, groupScaleY, groupScaleZ);
```

#### **Phase 3: Update Shader Uniforms**
- Add `uPoolSizeX`, `uPoolSizeY`, `uPoolSizeZ` uniforms
- Replace hardcoded `poolHeight = 1.0` with `uPoolSizeY`
- Replace hardcoded `-1.0, +1.0` X/Z bounds with `-uPoolSizeX/2, +uPoolSizeX/2` and `-uPoolSizeZ/2, +uPoolSizeZ/2`

#### **Phase 4: Update All Cube Intersections**
- `rendererShaders.ts`: Update `intersectCube()` calls
- `causticsShaders.ts`: Update `intersectCube()` calls
- Use `vec3(-uPoolSizeX/2, -uPoolSizeY, -uPoolSizeZ/2), vec3(uPoolSizeX/2, 2.0, uPoolSizeZ/2)`

#### **Phase 5: Update Boat Material**
```typescript
uInvScaleX.value = poolSizeX > 0 ? 2 / poolSizeX : 1;
uInvScaleY.value = poolSizeY > 0 ? 2 / poolSizeY : 1;
uInvScaleZ.value = poolSizeZ > 0 ? 2 / poolSizeZ : 1;
```

---

## 📋 **CHECKLIST FOR IMPLEMENTATION**

### **Geometry & Scaling**
- [ ] Add `poolSizeX`, `poolSizeY`, `poolSizeZ` to settings
- [ ] Update `groupRef.scale` to use separate X/Y/Z scales
- [ ] Verify all child geometries scale correctly

### **Shader Uniforms**
- [ ] Add `uPoolSizeX`, `uPoolSizeY`, `uPoolSizeZ` to all shader materials
- [ ] Replace hardcoded `poolHeight = 1.0` with `uPoolSizeY`
- [ ] Update `Pool.tsx` to pass pool dimension uniforms
- [ ] Update `WaterSurface.tsx` to pass pool dimension uniforms

### **Cube Intersections**
- [ ] Update `rendererShaders.ts` `intersectCube()` calls
- [ ] Update `causticsShaders.ts` `intersectCube()` calls
- [ ] Update `causticsShaders.ts` `project()` function
- [ ] Test all cube intersection calculations

### **Caustics System**
- [ ] Update `useCaustics.ts` to accept `poolSizeX`, `poolSizeY`, `poolSizeZ`
- [ ] Pass pool dimensions to caustics material uniforms
- [ ] Verify caustics projection scales correctly

### **Boat Material**
- [ ] Update `uInvScale` to separate X/Y/Z scales (if needed)
- [ ] Verify boat rendering scales correctly

### **Testing**
- [ ] Test pool size X scaling (width)
- [ ] Test pool size Y scaling (height/depth)
- [ ] Test pool size Z scaling (length)
- [ ] Test combined X/Y/Z scaling
- [ ] Verify caustics scale correctly
- [ ] Verify reflections scale correctly
- [ ] Verify magnification is preserved
- [ ] Verify textures don't skew
- [ ] Verify shaders don't break

---

## 🔍 **DETAILED FILE CHANGES**

### **Files to Modify**

1. **`types/WaterSettings.ts`**
   - Add `poolSizeX`, `poolSizeY`, `poolSizeZ` to `PoolSettings`

2. **`engines/gptwaves-v7/GptwavesV7Scene.tsx`**
   - Accept `poolSizeX`, `poolSizeY`, `poolSizeZ` props
   - Update `groupRef.scale` to use separate scales
   - Pass pool dimensions to child components

3. **`engines/gptwaves-v7/components/Pool.tsx`**
   - Accept `poolSizeX`, `poolSizeY`, `poolSizeZ` props
   - Add `uPoolSizeX`, `uPoolSizeY`, `uPoolSizeZ` uniforms
   - Update material uniforms

4. **`engines/gptwaves-v7/components/WaterSurface.tsx`**
   - Accept `poolSizeX`, `poolSizeY`, `poolSizeZ` props
   - Add `uPoolSizeX`, `uPoolSizeY`, `uPoolSizeZ` uniforms
   - Update material uniforms

5. **`engines/gptwaves-v7/shaders/rendererShaders.ts`**
   - Replace `const float poolHeight = 1.0;` with `uniform float uPoolSizeY;`
   - Add `uniform float uPoolSizeX;` and `uniform float uPoolSizeZ;`
   - Update all `intersectCube()` calls to use uniforms

6. **`engines/gptwaves-v7/shaders/causticsShaders.ts`**
   - Add `uniform float uPoolSizeX;`, `uniform float uPoolSizeZ;`
   - Update all `intersectCube()` calls to use uniforms
   - Update `project()` function

7. **`engines/gptwaves-v7/hooks/useCaustics.ts`**
   - Accept `poolSizeX`, `poolSizeY`, `poolSizeZ` parameters
   - Pass to caustics material uniforms

---

## 🎓 **KEY INSIGHTS**

1. **UV Mapping is Preserved** - Because geometry scales, world-space coordinates stay in -1 to +1 range, so UV mapping (0-1) is preserved automatically.

2. **Simulation is Resolution-Based** - Water simulation operates in UV space (0-1), so it's independent of pool size. Resolution could scale for better quality.

3. **Hardcoded Values are the Problem** - The main issues are hardcoded pool dimensions in shaders, not the scaling mechanism itself.

4. **Camera Scaling Works** - Camera distance scales with `groupScale`, maintaining correct magnification.

5. **Reflections Scale Correctly** - Sky cubemap reflections use world-space coordinates, so they scale automatically.

---

## 📝 **NEXT STEPS**

1. **Review this system map** with user
2. **Discuss implementation approach** (phased vs. all-at-once)
3. **Decide on simulation resolution scaling** (fixed vs. proportional)
4. **Implement changes** following the checklist
5. **Test thoroughly** with various pool size combinations

---

**Status:** ✅ System map complete - ready for implementation discussion

