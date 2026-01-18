# MLS-MPM Constraint-Based LOD Architecture
## Hypergraph-Style Wave Surface as "Rest State Target"

**Date:** 2026-01-08  
**Status:** 🟢 **CONCEPTUAL BREAKTHROUGH** - Revolutionary Approach  
**Purpose:** Define architecture where MLS-MPM uses heightfield/animated waves as its "rest state target surface"

---

## Core Concept

### The Revolutionary Idea

**Instead of:**
- Heightfield simulation (cheap) + MLS-MPM particles (expensive, only for breaches)
- Spawning particles on wave surface when breaches occur
- Two separate systems that need coupling

**We do:**
- MLS-MPM simulation ALWAYS running (particles always exist)
- Heightfield/animated waves define the "target rest state surface"
- MLS-MPM conforms to this target surface when at rest
- When forces are applied (touch, impact, breaching), MLS-MPM breaks free and shows full physics
- Heightfield becomes MLS-MPM's "normal" at rest

### The Hypergraph Analogy

**Like a hypergraph constraint system:**
- Heightfield/animated waves = "target surface template" (the desired geometry)
- MLS-MPM particles = "actual physics simulation"
- Constraint force = "attachment" that keeps particles near target surface when forces are small
- When forces exceed threshold, particles can break free and show full MLS-MPM behavior

---

## Architecture Overview

### Current Architecture (Two-System Coupling)

```
Heightfield Simulation (cheap)
    ↓ (spawn particles)
MLS-MPM Simulation (expensive, only for breaches)
    ↓ (feedback via BFT)
Heightfield Simulation
```

**Problems:**
- Spawning overhead
- Visual discontinuity when particles spawn
- Complex coupling logic
- LOD discontinuity (heightfield → MLS-MPM jump)

### New Architecture (Constraint-Based LOD)

```
Heightfield/Animated Waves (defines "target surface")
    ↓ (constraint force)
MLS-MPM Simulation (always running, conforms to target)
    ↓ (when forces applied)
Full MLS-MPM Physics (particles break free, show realistic behavior)
```

**Benefits:**
- No spawning overhead (particles always exist)
- Smooth LOD transitions (no visual jump)
- Seamless surface (heightfield → MLS-MPM looks continuous)
- Heightfield acts as "rest state template" for MLS-MPM

---

## How It Works

### 1. MLS-MPM Always Running

**Current:** Particles only exist when spawned (breach events)  
**New:** Particles always exist in a 2D surface layer

**Implementation:**
- Fixed particle count (e.g., 64×64 or 128×128 grid over pool surface)
- Particles are always in simulation (no spawn/respawn logic)
- Particle positions initialized to match heightfield surface at start

### 2. Heightfield as "Target Surface"

**Heightfield/animated waves define the "desired surface shape":**
- Heightfield η(x,z) = target surface height at rest
- Animated waves = target surface shape for background waves
- Combined = `η_target(x,z,t)` = complete target surface shape

**MLS-MPM particles "conform" to this target:**
- Constraint force pulls particles toward `η_target(x,z,t)`
- When forces are small (at rest), particles stay close to target
- Surface looks exactly like heightfield/animated waves
- But it's ACTUALLY MLS-MPM (so it can break free when needed)

### 3. Constraint Force (Hypergraph-Style)

**Constraint equation:**
```
F_constraint = k * (η_target(x,z,t) - η_particle) * n
```

Where:
- `k` = constraint stiffness (high = tight attachment, low = loose attachment)
- `η_target(x,z,t)` = target surface height (from heightfield/animated waves)
- `η_particle` = particle's current height
- `n` = surface normal (from target surface)

**Behavior:**
- High `k` = particles tightly attached to target (looks exactly like heightfield)
- Low `k` = particles can deviate from target (full MLS-MPM physics)
- `k` can be spatially varying (higher in "cheap" regions, lower in "detailed" regions)

### 4. Force Threshold (Breaking Free)

**When forces exceed threshold, particles break free:**
- Object impact force > threshold → particles detach from target
- Breach forces > threshold → particles show full MLS-MPM behavior
- After forces subside, constraint gradually re-attaches particles to target

**Threshold can be:**
- Constant (simple)
- Spatially varying (higher in "cheap" regions, lower in "detailed" regions)
- Time-varying (based on recent activity)

### 5. Smooth LOD Transitions

**No visual jump between heightfield and MLS-MPM:**
- At rest, MLS-MPM surface = heightfield surface (seamless)
- When forces applied, MLS-MPM surface deviates smoothly (no spawn pop-in)
- After forces subside, MLS-MPM surface smoothly returns to heightfield (no visual jump)

**LOD regions:**
- **Cheap regions** (far from camera/interactions):
  - High constraint stiffness (`k` = high)
  - Particles tightly attached to heightfield
  - Minimal MLS-MPM computation (just constraint force)
  
- **Detailed regions** (near camera/interactions):
  - Low constraint stiffness (`k` = low)
  - Particles can break free and show full physics
  - Full MLS-MPM computation (P2G, grid update, G2P)

---

## Implementation Strategy

### Phase 1: Basic Constraint System

**Goal:** Make MLS-MPM conform to heightfield at rest

**Implementation:**
1. Keep fixed particle count (always running)
2. Add constraint force in MLS-MPM grid update:
   ```glsl
   // In grid update shader:
   vec3 constraintForce = k * (eta_target - particle_height) * normal;
   grid_velocity += constraintForce * dt;
   ```
3. Sample heightfield at particle's XZ position to get `eta_target`
4. Test: At rest, MLS-MPM surface should match heightfield exactly

### Phase 2: Force Threshold

**Goal:** Particles break free when forces applied

**Implementation:**
1. Measure force magnitude at each particle
2. If force > threshold, reduce `k` (weaken constraint)
3. After force subsides, gradually increase `k` back to default
4. Test: Impact should cause particles to break free and show physics

### Phase 3: Spatially Varying LOD

**Goal:** Different constraint stiffness in different regions

**Implementation:**
1. Compute distance from camera/interaction points
2. High `k` in cheap regions (far away)
3. Low `k` in detailed regions (near camera/interactions)
4. Smooth transition between regions
5. Test: Smooth LOD with no visual pop-in

### Phase 4: Animated Waves Integration

**Goal:** Animated waves also define target surface

**Implementation:**
1. Combine heightfield + animated waves into single `η_target(x,z,t)`
2. Sample both at particle's XZ position
3. Blend based on region/time
4. Test: MLS-MPM surface matches animated waves at rest

---

## Comparison with Current Approach

### Current: Event-Driven Spawning

**Workflow:**
1. Heightfield simulation runs (cheap)
2. Breach detected → spawn MLS-MPM particles
3. Particles interact with heightfield
4. Particles eventually despawn/merge back

**Problems:**
- Spawn overhead (create particles, initialize positions/velocities)
- Visual discontinuity (particles pop in)
- Complex coupling (BFT feedback system)
- LOD jump (heightfield → MLS-MPM transition)

### New: Constraint-Based Always-On

**Workflow:**
1. Heightfield/animated waves define target surface
2. MLS-MPM always running, constrained to target surface
3. When forces applied, particles break free
4. After forces subside, particles re-attach to target

**Benefits:**
- No spawn overhead (particles always exist)
- Smooth transitions (no visual pop-in)
- Simpler coupling (just constraint force)
- Seamless LOD (gradual transition, not jump)

---

## Technical Details

### Particle Initialization

**At start:**
- Initialize particle positions to match heightfield surface
- `particle_pos.y = η_target(particle_pos.xz)`
- Particles already "attached" to target surface

**No respawn needed:**
- Particles stay in simulation forever
- Constraint keeps them on target surface at rest
- Forces allow them to break free when needed

### Constraint Force Calculation

**Per particle:**
1. Sample heightfield at particle's XZ: `eta_target = η(x,z,t)`
2. Get particle's current height: `eta_particle = particle_pos.y`
3. Compute constraint force: `F = k * (eta_target - eta_particle) * normal`
4. Apply to grid (or directly to particle velocity)

**Normal calculation:**
- Sample heightfield gradient to get surface normal
- Normal points "up" from target surface
- Constraint force pulls particle toward target surface

### Force Threshold Logic

**Per particle:**
1. Measure applied forces (from objects, other particles, etc.)
2. Compute force magnitude: `F_mag = |F_applied|`
3. If `F_mag > threshold`:
   - Reduce constraint stiffness: `k_effective = k * (1 - (F_mag / threshold))`
   - Particles can deviate from target
4. If `F_mag < threshold`:
   - Gradually restore constraint: `k_effective = lerp(k_effective, k, dt * recovery_rate)`

### LOD Regions

**Distance-based LOD:**
```glsl
float dist_to_camera = length(particle_pos - camera_pos);
float dist_to_interaction = min(dist_to_sphere, dist_to_other_particles);

float k_cheap = 100.0;   // High stiffness (tight attachment)
float k_detailed = 1.0;  // Low stiffness (loose attachment)
float transition_distance = 2.0;  // Meters

float k = mix(k_detailed, k_cheap, 
              smoothstep(0.0, transition_distance, 
                         max(dist_to_camera, dist_to_interaction)));
```

---

## Integration with Current System

### What Changes

**Removed:**
- ❌ Spawn/respawn logic (`respawnRibbonFromSurface`)
- ❌ BFT feedback system (no longer needed for coupling)
- ❌ Spawn Field computation (no event-driven spawning)

**Added:**
- ✅ Constraint force in MLS-MPM grid update
- ✅ Heightfield sampling in grid update (for target surface)
- ✅ Force threshold logic (breaking free)

**Kept:**
- ✅ MLS-MPM core (P2G, grid update, G2P)
- ✅ Heightfield simulation (defines target surface)
- ✅ Screen-space fluid renderer (renders MLS-MPM surface)

### Migration Path

**Step 1: Add Constraint Force**
- Modify `MLSMPM_GRID_UPDATE_FRAGMENT` to include constraint force
- Sample heightfield at grid cell positions
- Apply constraint force to grid velocity

**Step 2: Remove Spawn Logic**
- Keep particles initialized at start (match heightfield surface)
- Remove `respawnRibbonFromSurface` call
- Particles stay in simulation forever

**Step 3: Test Constraint**
- Verify particles stay on heightfield surface at rest
- Verify particles can break free when forces applied
- Verify smooth transitions

**Step 4: Add LOD**
- Implement distance-based constraint stiffness
- Test LOD transitions are smooth
- Optimize performance in cheap regions

---

## Performance Considerations

### Always-On MLS-MPM Cost

**Fixed cost per frame:**
- P2G transfer: O(N_particles)
- Grid update: O(N_grid_cells)
- G2P transfer: O(N_particles)

**But with constraint-based LOD:**
- Cheap regions: High constraint stiffness → particles stay near target → minimal computation
- Detailed regions: Low constraint stiffness → full MLS-MPM physics → full computation

**Overall:** Similar cost to current system, but better LOD distribution

### Optimization Opportunities

**Cheap regions:**
- Skip expensive computations (stress, plasticity)
- Only apply constraint force (cheap)
- Use simplified grid update

**Detailed regions:**
- Full MLS-MPM computation
- All features enabled (stress, plasticity, etc.)

---

## Visual Quality

### At Rest

**Heightfield/animated waves:**
- MLS-MPM surface matches exactly (constraint is tight)
- No visual difference from pure heightfield
- Full optics/reflections work (MLS-MPM surface is the actual surface)

### Under Forces

**When forces applied:**
- Particles break free smoothly (no spawn pop-in)
- Full MLS-MPM physics visible (realistic deformation, splashing)
- Smooth transition back to rest state (constraint re-attaches)

### LOD Transitions

**Distance-based:**
- Far from camera: Tight constraint, looks like heightfield
- Near camera: Loose constraint, full physics visible
- Smooth transition between (no visual pop-in)

---

## Comparison with Heightfield + Animated Waves

### Current: Heightfield + Animated Waves (Separate)

**Rendering:**
- Heightfield surface (from simulation)
- Animated waves (procedural)
- Blended together for final surface

**Limitations:**
- Surface is just geometry (no physics)
- Can't deform under forces
- Breaches require separate MLS-MPM system

### New: MLS-MPM Constrained to Heightfield/Waves

**Rendering:**
- MLS-MPM surface (the actual surface)
- Constrained to match heightfield/animated waves at rest
- Can break free and show physics when forces applied

**Benefits:**
- Surface IS physics (MLS-MPM)
- Can deform under forces naturally
- Breaches are just particles breaking free (no spawn needed)

---

## Next Steps

### Research Questions

1. **Constraint Stiffness (`k`):**
   - What values work well? (too high = unstable, too low = doesn't conform)
   - How to make it spatially varying?
   - How to transition smoothly between regions?

2. **Force Threshold:**
   - What threshold works well? (too high = never breaks free, too low = always breaking free)
   - How to compute force magnitude? (object impact, particle collisions, etc.)
   - How to recover smoothly after forces subside?

3. **Performance:**
   - How many particles needed? (64×64? 128×128?)
   - Can we optimize cheap regions further?
   - Is always-on MLS-MPM acceptable cost?

### Implementation Plan

1. **Phase 1: Proof of Concept**
   - Add basic constraint force to MLS-MPM grid update
   - Test: Particles conform to heightfield at rest
   - Test: Particles can break free when forces applied

2. **Phase 2: Integration**
   - Remove spawn logic
   - Keep particles initialized at start
   - Test: Smooth transitions

3. **Phase 3: LOD**
   - Add distance-based constraint stiffness
   - Test: Smooth LOD transitions
   - Optimize performance

4. **Phase 4: Polish**
   - Add animated waves support
   - Fine-tune constraint parameters
   - Test: Visual quality matches or exceeds current system

---

## Conclusion

**This is a revolutionary approach that:**
- Eliminates spawn overhead
- Provides seamless LOD transitions
- Makes heightfield/animated waves the "rest state template" for MLS-MPM
- Allows particles to break free and show full physics when needed
- Maintains visual quality (MLS-MPM surface matches heightfield at rest)

**It's what we've been driving towards:**
- Unified surface (no heightfield/MLS-MPM distinction visually)
- Smooth LOD (gradual transition, not jump)
- Efficient computation (constraint in cheap regions, full physics in detailed regions)

**Next:** Research constraint stiffness values, implement proof of concept, test with user.

---

**Last Updated:** 2026-01-08  
**Status:** 🟢 **CONCEPTUAL BREAKTHROUGH**  
**Priority:** **HIGHEST** - This could be the ultimate solution




import { Camera } from './camera'
import { mlsmpmParticleStructSize, MLSMPMSimulator } from './mls-mpm/mls-mpm'
import { renderUniformsViews, renderUniformsValues } from './camera'
import { FluidRenderer } from './render/fluidRender'
import GUI from 'lil-gui';

/// <reference types="@webgpu/types" />


async function init() {
	const canvas: HTMLCanvasElement = document.querySelector('canvas')!

	if (!navigator.gpu) {
		alert("WebGPU is not supported on your browser.");
		throw new Error()
	}

	const adapter = await navigator.gpu.requestAdapter()

	if (!adapter) {
		alert("Adapter is not available.");
		throw new Error()
	}

	const device = await adapter.requestDevice()
	// const device = await adapter.requestDevice({
	// 	requiredFeatures: ["float32-filterable"],
	// });

	if (!device) {
		alert("float-32-filterable is not supported")
		throw new Error()
	}

	const context = canvas.getContext('webgpu') as GPUCanvasContext

	if (!context) {
		throw new Error()	
	}

	let devicePixelRatio  = 0.7;
	canvas.width = devicePixelRatio * canvas.clientWidth
	canvas.height = devicePixelRatio * canvas.clientHeight

	console.log(canvas.width, canvas.height)

	const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

	context.configure({
		device,
		format: presentationFormat,
	})

	return { canvas, device, presentationFormat, context }
}

function initGui(particleCountTexts: string[]) {
	const gui = new GUI();

	const params = {
		sigma: 1.3,
		running: true,
		r: 140, 
		g:220, 
		b:240,  
		speed: 0.8, 
		colorDensity: 0.7, 
		numParticles: particleCountTexts[1],
		// Variable Particle Sizes
		sizeDistribution: 'uniform' as 'uniform' | 'linear' | 'exponential' | 'logarithmic',
		minRadius: 0.01,
		maxRadius: 0.5,
		// Calm Pool
		restBlend: 1.0, // Strong attractor
		restDamping: 4.0, // Fast convergence
		toggleSimulation: () => {
			params.running = !params.running;
		}
	};	

	const numParticlesFolder = gui.addFolder('Number of Particles');
	numParticlesFolder.add(params, 'numParticles', particleCountTexts)
  		.name('Number of Particles')
	
	const sizeFolder = gui.addFolder('Particle Sizes ⭐ NEW');
	sizeFolder.add(params, 'sizeDistribution', ['uniform', 'linear', 'exponential', 'logarithmic'])
		.name('Size Distribution')
		.setValue('uniform') // Default
	sizeFolder.add(params, 'minRadius', 0.005, 0.3, 0.005).name('Min Radius (m)')
		.setValue(0.01)
		.listen() // Update on change
	sizeFolder.add(params, 'maxRadius', 0.1, 2.0, 0.05).name('Max Radius (m)')
		.setValue(0.5)
		.listen() // Update on change
	sizeFolder.add({ note: () => {
		const ratio = params.maxRadius / params.minRadius;
		if (ratio > 50) {
			return '⚠️ Large size ratio may cause instability';
		}
		return `Size ratio: ${ratio.toFixed(1)}x`;
	}}, 'note').name('Status').listen();
	sizeFolder.open(); // Keep open by default for easy testing
	
	const calmPoolFolder = gui.addFolder('Calm Pool ⭐ NEW');
	calmPoolFolder.add(params, 'restBlend', 0.0, 1.0, 0.05).name('Rest Blend').onChange((value: number) => {
		// Access mlsmpmSimulator through the frame function scope - need to pass device
		// This will be set up after simulator is created
	});
	calmPoolFolder.add(params, 'restDamping', 0.0, 10.0, 0.5).name('Rest Damping').onChange((value: number) => {
		// Access mlsmpmSimulator through the frame function scope - need to pass device
		// This will be set up after simulator is created
	});
	calmPoolFolder.open();
	
	const speedFolder = gui.addFolder('Speed');
	speedFolder.add(params, 'speed', 0.3, 1.0, 0.1).name('Simlation Speed')
	const colorFolder = gui.addFolder('Diffuse Color');
	colorFolder.add(params, 'r', 0, 255, 1).name('R')
	colorFolder.add(params, 'g', 0, 255, 1).name('G')
	colorFolder.add(params, 'b', 0, 255, 1).name('B')
	colorFolder.add(params, 'colorDensity', 0.0, 6.0, 0.1).name('Density')
	colorFolder.close();

	document.addEventListener('keydown', (event) => {
		if (event.code === 'KeyP') { 
		  params.toggleSimulation(); 
		}
	});

	return params
}

async function main() {
	const { canvas, device, presentationFormat, context } = await init();
	
	console.log("initialization done")

	context.configure({
		device,
		format: presentationFormat,
	})

	let cubemapTexture: GPUTexture;
	{
		// The order of the array layers is [+X, -X, +Y, -Y, +Z, -Z]
		const imgSrcs = [
			'cubemap/posx.png',
			'cubemap/negx.png',
			'cubemap/posy.png',
			'cubemap/negy.png',
			'cubemap/posz.png',
			'cubemap/negz.png',
		];
		const promises = imgSrcs.map(async (src) => {
			const response = await fetch(src);
			return createImageBitmap(await response.blob());
		});
		const imageBitmaps = await Promise.all(promises);

		cubemapTexture = device.createTexture({
			dimension: '2d',
			// Create a 2d array texture.
			// Assume each image has the same size.
			size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
			format: 'rgba8unorm',
			usage:
			GPUTextureUsage.TEXTURE_BINDING |
			GPUTextureUsage.COPY_DST |
			GPUTextureUsage.RENDER_ATTACHMENT,
		});

		for (let i = 0; i < imageBitmaps.length; i++) {
			const imageBitmap = imageBitmaps[i];
			device.queue.copyExternalImageToTexture(
				{ source: imageBitmap },
				{ texture: cubemapTexture, origin: [0, 0, i] },
				[imageBitmap.width, imageBitmap.height]
			);
		}
	}

	const cubemapTextureView = cubemapTexture.createView({
		dimension: 'cube',
	});
	console.log("cubemap initialization done")


	interface simulationParam {
		particleCount: number, 
		initBoxSize: number[], 
		initDistance: number, 
		mouseRadius: number,
		cameraTargetY: number, 
		guiText: string, 
	}

	let simulationParams: simulationParam[] = [
		{ particleCount: 40000, initBoxSize: [60, 50, 60], initDistance: 50, mouseRadius: 15, cameraTargetY: 10, guiText: 'Small (40,000 particles)' }, 
		{ particleCount: 70000, initBoxSize: [70, 50, 70], initDistance: 60, mouseRadius: 15, cameraTargetY: 12, guiText: 'Medium (70,000 particles)'}, 
		{ particleCount: 100000, initBoxSize: [80, 70, 80], initDistance: 70, mouseRadius: 15, cameraTargetY: 12, guiText: 'Large (100,000 particles)'}, 
		{ particleCount: 180000, initBoxSize: [90, 70, 90], initDistance: 80, mouseRadius: 18, cameraTargetY: 15, guiText: 'Very Large (180,000 particles)'}, 
	]
	const particleCountTexts = simulationParams.map(param => param.guiText)
	const guiParams = initGui(particleCountTexts)
	const maxParticleCount = Math.max(...simulationParams.map(param => param.particleCount));
	const maxGridCount = Math.max(...simulationParams.map(param => param.initBoxSize[0] * param.initBoxSize[1] * param.initBoxSize[2]));

	// シミュレーションとレンダリングで使いまわすバッファ
	const maxParticleStructSize = mlsmpmParticleStructSize
	const particleBuffer = device.createBuffer({
		label: 'particles buffer', 
		size: maxParticleStructSize * maxParticleCount, 
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	})
	const posvelBuffer = device.createBuffer({
		label: 'posvel buffer', 
		size: 32 * maxParticleCount,  
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	})
	const renderUniformBuffer = device.createBuffer({
		label: 'filter uniform buffer', 
		size: renderUniformsValues.byteLength, 
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	const initBoxSizeBuffer = device.createBuffer({
		label: 'init box size buffer', 
		size: 12,  // vec3f
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	// texture for depthmap
	const depthMapTexture = device.createTexture({
		label: 'depth map texture', 
		size: [canvas.width, canvas.height, 1],
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		format: 'r32float',
	});
	const depthMapTextureView = depthMapTexture.createView()

	// texture for density grid
	// const densityGridSizeX = Math.ceil(Math.max(...simulationParams.map(param => param.initBoxSize[0])) / 64) * 64; // コピーのために切り上げ
	const densityGridSizeX = Math.max(...simulationParams.map(param => param.initBoxSize[0])); // コピーのために切り上げ
	const densityGridSizeY = Math.max(...simulationParams.map(param => param.initBoxSize[1]));
	const densityGridSizeZ = Math.ceil(Math.max(...simulationParams.map(param => param.initBoxSize[2])) / 128) * 128;
	const densityGridSize = [densityGridSizeX, densityGridSizeY, densityGridSizeZ]
	const densityGridBuffer = device.createBuffer({
		label: 'density grid buffer', 
		size: 4 * densityGridSizeX * densityGridSizeY * densityGridSizeZ, 
		usage: GPUBufferUsage.STORAGE, // コピー元
	})
	const castedDensityGridBuffer = device.createBuffer({
		label: 'casted density grid buffer', 
		size: 2 * densityGridSizeX * densityGridSizeY * densityGridSizeZ, 
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, // コピー元
	})
	const densityGridSizeBuffer = device.createBuffer({
		label: 'density grid size buffer', 
		size: 12, 
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, 
	})
	const densityGridSizeDataArray = new Float32Array(densityGridSize)
	device.queue.writeBuffer(densityGridSizeBuffer, 0, densityGridSizeDataArray)
	const densityGridTexture = device.createTexture({ 
		label: 'density grid texture', 
		size: [densityGridSizeZ, densityGridSizeY, densityGridSizeX], // これでいい？
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST, // コピー先
		format: 'r16float',
		dimension: '3d'
	})
	const densityGridTextureView = densityGridTexture.createView()
	console.log("buffer allocating done")

	const canvasElement = document.getElementById("fluidCanvas") as HTMLCanvasElement;
	// シミュレーション，カメラの初期化
	const mlsmpmFov = 60 * Math.PI / 180
	const mlsmpmRadius = 0.6
	const mlsmpmDiameter = 2 * mlsmpmRadius
	const mlsmpmZoomRate = 0.7
	const fixedPointMultiplier = 1e7
	const mlsmpmSimulator = new MLSMPMSimulator(
		particleBuffer, posvelBuffer, renderUniformBuffer, densityGridBuffer, castedDensityGridBuffer, 
		initBoxSizeBuffer, densityGridSizeBuffer, 
		device, depthMapTextureView, canvas, 
		maxGridCount, maxParticleCount, fixedPointMultiplier, mlsmpmDiameter
	)
	const mlsmpmRenderer = new FluidRenderer(
		renderUniformBuffer, posvelBuffer, particleBuffer, densityGridSizeBuffer, initBoxSizeBuffer, 
		device, 
		depthMapTextureView, cubemapTextureView, densityGridTextureView, 
		canvas, 
		presentationFormat, 
		mlsmpmRadius, mlsmpmFov, fixedPointMultiplier
	)

	console.log("simulator initialization done")

	const camera = new Camera(canvasElement)

	// デバイスロストの監視
	let errorLog = document.getElementById('error-reason') as HTMLSpanElement
	errorLog.textContent = ""
	device.lost.then(info => {
		const reason = info.reason ? `reason: ${info.reason}` : 'unknown reason';
		errorLog.textContent = reason;
	});

	let paramsIdx = -1
	let realBoxSize = [0, 0, 0]
	let initBoxSize = [0, 0, 0]
	let simulationParam = simulationParams[0]
	
	// Variable particle sizes - exposed for GUI control
	let currentSizeDistribution: 'uniform' | 'linear' | 'exponential' | 'logarithmic' = guiParams.sizeDistribution
	let currentMinRadius = guiParams.minRadius
	let currentMaxRadius = guiParams.maxRadius

	let sphereRenderFl = false
	let rotateFl = false
	let boxWidthRatio = 1.

	console.log("simulation start")
	let closingSpeed = 0.
	let prevClosingSpeed = 0.

	
	async function frame() {
		const selectedValue = particleCountTexts.indexOf(guiParams.numParticles);
		
		// Check if size distribution or radius changed
		const sizeChanged = (
			currentSizeDistribution !== guiParams.sizeDistribution ||
			currentMinRadius !== guiParams.minRadius ||
			currentMaxRadius !== guiParams.maxRadius
		);
		
		// Reset simulation if particle count or size settings changed
		if (guiParams.running && (Number(selectedValue) != paramsIdx || sizeChanged)) {
			paramsIdx = Number(selectedValue)
			simulationParam = simulationParams[paramsIdx]
			initBoxSize = simulationParam.initBoxSize
			
			// Variable particle sizes with stratification
			// Now controlled via GUI - use 'linear' to see stratification
			currentSizeDistribution = guiParams.sizeDistribution
			currentMinRadius = guiParams.minRadius
			currentMaxRadius = guiParams.maxRadius
			
			console.log(`Resetting simulation with size distribution: ${currentSizeDistribution}, radius: ${currentMinRadius}-${currentMaxRadius}m`)
			
			mlsmpmSimulator.reset(initBoxSize, simulationParam.particleCount, currentSizeDistribution, currentMinRadius, currentMaxRadius)
			camera.reset(simulationParam.initDistance, [initBoxSize[0] / 2, simulationParam.cameraTargetY, initBoxSize[2] / 2], 
				mlsmpmFov, mlsmpmZoomRate)
			realBoxSize = [...initBoxSize]
			let slider = document.getElementById("slider") as HTMLInputElement
			slider.value = "100"
		}

		const particle = document.getElementById("particle") as HTMLInputElement
		sphereRenderFl = particle.checked
		if (guiParams.running) {
			const slider = document.getElementById("slider") as HTMLInputElement
			let curBoxWidthRatio = parseInt(slider.value) / 200 + 0.5
			const maxClosingSpeed = 0.007 * guiParams.speed
			closingSpeed = Math.min(maxClosingSpeed, prevClosingSpeed + maxClosingSpeed / 40.)
			let dVal = Math.min(boxWidthRatio - curBoxWidthRatio, closingSpeed)
			boxWidthRatio -= dVal
			if (dVal <= 0.) {
				closingSpeed = 0.
				prevClosingSpeed = 0.
			} else {
				prevClosingSpeed = closingSpeed
			}	
		}

		realBoxSize[2] = initBoxSize[2] * boxWidthRatio
		mlsmpmSimulator.changeBoxSize(realBoxSize)

		// Update calm pool uniforms from GUI
		mlsmpmSimulator.calmPoolUniformViews.restBlend.set([guiParams.restBlend]);
		mlsmpmSimulator.calmPoolUniformViews.restDamping.set([guiParams.restDamping]);
		device.queue.writeBuffer(mlsmpmSimulator.calmPoolUniformBuffer, 0, mlsmpmSimulator.calmPoolUniformValues);

		// matrices are written by camera.ts
		renderUniformsViews.texelSize.set([1.0 / canvas.width, 1.0 / canvas.height]);
		renderUniformsViews.sphereSize.set([mlsmpmDiameter])
		device.queue.writeBuffer(renderUniformBuffer, 0, renderUniformsValues) 

		const commandEncoder = device.createCommandEncoder()

		let maxDt = 0.4;
		mlsmpmSimulator.execute(commandEncoder, 
			[camera.currentHoverX / canvas.clientWidth, camera.currentHoverY / canvas.clientHeight], 
			camera.calcMouseVelocity(), simulationParam.mouseRadius, sphereRenderFl, maxDt * guiParams.speed, guiParams.running,
			densityGridSize
		)	
		let normalizedDiffuseColor = [guiParams.r / 255, guiParams.g / 255, guiParams.b / 255];
		mlsmpmRenderer.execute(context, commandEncoder, mlsmpmSimulator.numParticles, sphereRenderFl, normalizedDiffuseColor, 
			guiParams.colorDensity, mlsmpmSimulator.getSimOrigin())

		device.queue.submit([commandEncoder.finish()])

		if (sphereRenderFl) {
			const copyCommandEncoder = device.createCommandEncoder()
			// グリッドをテクスチャへコピー
			copyCommandEncoder.copyBufferToTexture(
				{
					buffer: castedDensityGridBuffer,
					bytesPerRow: densityGridSize[2] * 2,
					rowsPerImage: densityGridSize[1]
				},
				{
					texture: densityGridTexture
				},
				{
					width: densityGridSize[2],
					height: densityGridSize[1],
					depthOrArrayLayers: densityGridSize[0]
				}
			);
			device.queue.submit([copyCommandEncoder.finish()])
		}


		camera.setNewPrevMouseCoord();
		if (rotateFl) {
			camera.stepAngle();
		}

		requestAnimationFrame(frame)
	} 
	requestAnimationFrame(frame)
}

main()

