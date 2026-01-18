# Hierarchical Water LOD System - Design Document
**Date:** 2025-12-17  
**Purpose:** Design a multi-tier water system that uses computation efficiently, activating advanced effects only when triggered

---

## 🎯 CORE CONCEPT

**Hierarchical LOD Water System:**
- **Base Layer:** Realistic-looking water with minimal physics (always active)
- **Interactive Layer:** Enhanced physics when objects interact (activated on demand)
- **Special Effects Layer:** Advanced effects (elongation, detachment, splashes) only when triggered by specific events

**Key Principle:** **Compute only what's needed, when it's needed**

---

## 🏗️ SYSTEM ARCHITECTURE

```
Hierarchical Water LOD System
│
├── Level 0: Base Water (Always Active)
│   ├── Purpose: Visual realism without complex physics
│   ├── Method: Pre-computed or simple procedural waves
│   ├── Features: Wind-driven waves, basic animation
│   ├── Performance: ~1ms per frame
│   └── Activation: Always on
│
├── Level 1: Interactive Water (On-Demand)
│   ├── Purpose: Realistic interaction with objects
│   ├── Method: Height field simulation (current system)
│   ├── Features: Object displacement, wake generation, ripples
│   ├── Performance: ~2-5ms per frame (only active zones)
│   └── Activation: When objects are near water surface
│
├── Level 2: Advanced Physics (Event-Triggered)
│   ├── Purpose: Momentum-based effects, realistic wave behavior
│   ├── Method: Enhanced height field with momentum tracking
│   ├── Features: Speed-based displacement, wake patterns, scale-aware
│   ├── Performance: ~5-10ms per frame (only active zones)
│   └── Activation: When objects move fast or interact strongly
│
├── Level 3: Special Effects (Conditional)
│   ├── Purpose: Elongation, detachment, splashes, droplets
│   ├── Method: SPH particles or advanced mesh deformation
│   ├── Features: 3D volume, surface tension, momentum transfer
│   ├── Performance: ~15-30ms per frame (only when triggered)
│   └── Activation: Only when specific conditions are met
│
└── Level 4: Ultra Effects (Rare Events)
    ├── Purpose: Extreme effects (large splashes, breaking waves)
    ├── Method: Full SPH/FLIP simulation
    ├── Features: Complete 3D fluid simulation
    ├── Performance: ~30-50ms per frame (very rare)
    └── Activation: Only for dramatic events (large impacts, etc.)
```

---

## 📊 LEVEL 0: BASE WATER (Always Active)

### **Purpose**
Provide realistic-looking water that requires minimal computation. This is the "background" water that's always visible.

### **Implementation**

**Method 1: Pre-computed Wave Animation**
```glsl
// Simple procedural waves - no simulation needed
vec3 getBaseWaterHeight(vec2 position, float time) {
  float wave1 = sin(position.x * 0.1 + time * 0.5) * 0.05;
  float wave2 = sin(position.z * 0.15 + time * 0.3) * 0.03;
  float wave3 = sin((position.x + position.z) * 0.2 + time * 0.4) * 0.02;
  
  return vec3(0.0, wave1 + wave2 + wave3, 0.0);
}
```

**Method 2: Gerstner Waves (More Realistic)**
```glsl
// Gerstner waves - realistic ocean waves without simulation
vec3 getGerstnerWave(vec2 position, float time, vec2 direction, float amplitude, float frequency, float speed) {
  float phase = dot(direction, position) * frequency + time * speed;
  float height = amplitude * sin(phase);
  vec2 displacement = direction * amplitude * cos(phase);
  
  return vec3(displacement.x, height, displacement.y);
}

vec3 getBaseWaterHeight(vec2 position, float time) {
  vec3 wave1 = getGerstnerWave(position, time, vec2(1.0, 0.0), 0.1, 0.05, 0.5);
  vec3 wave2 = getGerstnerWave(position, time, vec2(0.7, 0.7), 0.08, 0.08, 0.4);
  vec3 wave3 = getGerstnerWave(position, time, vec2(-0.5, 0.9), 0.06, 0.12, 0.3);
  
  return wave1 + wave2 + wave3;
}
```

**Method 3: Texture-Based Animation**
```glsl
// Animated normal map - very cheap
vec3 getBaseWaterNormal(vec2 uv, float time) {
  vec2 flow = vec2(time * 0.1, time * 0.05);
  vec3 normal1 = texture2D(normalMap1, uv + flow).rgb;
  vec3 normal2 = texture2D(normalMap2, uv - flow * 0.7).rgb;
  return normalize(normal1 + normal2 - 1.0);
}
```

### **Features**
- ✅ Wind-driven waves (procedural or texture-based)
- ✅ Basic animation (time-based)
- ✅ Realistic appearance
- ✅ No physics simulation
- ✅ Very low cost (~1ms per frame)

### **Activation**
- **Always active** - this is the base layer
- No conditions needed
- Provides background water appearance

---

## 🎮 LEVEL 1: INTERACTIVE WATER (On-Demand)

### **Purpose**
Handle basic interactions with objects - displacement, ripples, wake generation.

### **Activation Conditions**
```javascript
function shouldActivateLevel1(objects, camera) {
  // Activate if any object is near water surface
  for (var obj of objects) {
    var distToWater = Math.abs(obj.position.y - waterLevel);
    if (distToWater < 2.0) {  // Within 2 meters
      return true;
    }
  }
  
  // Activate if camera is close to water
  var cameraDistToWater = Math.abs(camera.position.y - waterLevel);
  if (cameraDistToWater < 10.0) {  // Within 10 meters
    return true;
  }
  
  return false;
}
```

### **Implementation**

**Zone-Based Activation:**
```javascript
class InteractiveWaterZone {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
    this.texture = new GL.Texture(256, 256, { type: gl.FLOAT });
    this.active = false;
  }
  
  update(objects) {
    // Check if any object is in this zone
    this.active = false;
    for (var obj of objects) {
      var dist = distance(obj.position, this.center);
      if (dist < this.radius) {
        this.active = true;
        this.simulate(obj);
        break;
      }
    }
  }
  
  simulate(object) {
    // Standard height field simulation
    this.stepSimulation();
    this.updateNormals();
    this.applyObjectDisplacement(object);
  }
}
```

**Texture Management:**
```javascript
// Only allocate textures for active zones
var activeZones = [];
function updateInteractiveWater(objects) {
  // Deactivate zones with no objects
  for (var zone of interactiveZones) {
    zone.update(objects);
    if (!zone.active) {
      // Can even free texture memory if zone inactive for > 1 second
      zone.inactiveTime += deltaTime;
      if (zone.inactiveTime > 1.0) {
        zone.texture = null;  // Free memory
      }
    } else {
      zone.inactiveTime = 0;
      if (!zone.texture) {
        zone.texture = new GL.Texture(256, 256, { type: gl.FLOAT });  // Reallocate
      }
    }
  }
}
```

### **Features**
- ✅ Object displacement (volume-based)
- ✅ Ripple generation (drop interaction)
- ✅ Basic wake patterns
- ✅ Height field simulation (256×256)
- ✅ Zone-based activation

### **Performance**
- **Inactive zones:** 0ms (no computation)
- **Active zones:** ~2ms per zone
- **Typical scene:** 1-3 active zones = ~2-6ms total

---

## ⚡ LEVEL 2: ADVANCED PHYSICS (Event-Triggered)

### **Purpose**
Enhanced physics when objects move fast or interact strongly - momentum-based displacement, scale-aware waves, realistic wake patterns.

### **Activation Conditions**
```javascript
function shouldActivateLevel2(object, waterZone) {
  // Activate if object is moving fast
  var speed = vec3.length(object.velocity);
  if (speed > 2.0) {  // Faster than 2 m/s
    return true;
  }
  
  // Activate if object has high momentum
  var momentum = speed * object.mass;
  if (momentum > 10.0) {  // High momentum
    return true;
  }
  
  // Activate if object just entered water (impact)
  if (object.justEnteredWater) {
    return true;
  }
  
  // Activate if object is large
  if (object.radius > 0.5) {  // Large object
    return true;
  }
  
  return false;
}
```

### **Implementation**

**Momentum Tracking:**
```javascript
class AdvancedWaterZone extends InteractiveWaterZone {
  constructor(center, radius) {
    super(center, radius);
    this.momentumTexture = new GL.Texture(256, 256, { type: gl.FLOAT });
    this.velocityTexture = new GL.Texture(256, 256, { type: gl.FLOAT });
  }
  
  applyObjectDisplacement(object) {
    // Calculate object momentum
    var velocity = vec3.subtract(object.position, object.previousPosition);
    var speed = vec3.length(velocity);
    var momentum = speed * object.mass;
    
    // Scale displacement by momentum
    var displacementStrength = momentum * 0.01;
    
    // Apply with momentum-based scaling
    this.applyDisplacement(object.position, object.radius, displacementStrength);
    
    // Create wake pattern based on speed
    if (speed > 1.0) {
      this.createWakePattern(object.position, object.velocity, speed);
    }
  }
  
  createWakePattern(position, velocity, speed) {
    // Faster objects create longer, narrower wakes
    var wakeLength = speed * 0.5;
    var wakeWidth = 1.0 / (1.0 + speed * 0.1);
    
    // Create wake texture
    this.renderWake(position, velocity, wakeLength, wakeWidth);
  }
}
```

**Scale-Aware Simulation:**
```glsl
// Enhanced shader with scale awareness
uniform float uPoolSize;  // Physical size in meters
uniform float uTimeScale;

void main() {
  vec4 info = texture2D(texture, coord);
  
  // Scale-aware wave speed
  float waveSpeed = 1.0 / sqrt(uPoolSize);
  float timeStep = uDeltaTime * uTimeScale * waveSpeed;
  
  // Scale-aware damping
  float damping = 0.995 + (uPoolSize * 0.001);
  info.g *= damping;
  
  // Scale-aware displacement
  float displacementScale = 1.0 / uPoolSize;
  info.r += displacement * displacementScale;
  
  gl_FragColor = info;
}
```

### **Features**
- ✅ Momentum-based displacement
- ✅ Speed-based wake patterns
- ✅ Scale-aware wave propagation
- ✅ Enhanced damping (larger pools)
- ✅ Impact detection (entry into water)

### **Performance**
- **Inactive:** 0ms
- **Active:** ~5-10ms per zone
- **Typical scene:** 0-2 active zones = ~0-20ms total

---

## 🌊 LEVEL 3: SPECIAL EFFECTS (Conditional)

### **Purpose**
Advanced effects like elongation, detachment, splashes, droplets - only when specific conditions trigger them.

### **Activation Conditions**
```javascript
function shouldActivateLevel3(object, waterState) {
  // Condition 1: Fast upward movement (elongation possible)
  if (object.velocity.y > 3.0 && object.position.y > waterLevel) {
    return 'ELONGATION';
  }
  
  // Condition 2: High-speed impact (splash possible)
  if (object.velocity.y < -5.0 && object.position.y < waterLevel + 0.5) {
    return 'SPLASH';
  }
  
  // Condition 3: Fast horizontal movement (detachment possible)
  var horizontalSpeed = Math.sqrt(object.velocity.x**2 + object.velocity.z**2);
  if (horizontalSpeed > 4.0 && object.position.y > waterLevel) {
    return 'DETACHMENT';
  }
  
  // Condition 4: Large object entering water (big splash)
  if (object.justEnteredWater && object.radius > 0.3) {
    return 'LARGE_SPLASH';
  }
  
  // Condition 5: Object breaking surface (cavitation)
  if (object.breakingSurface && object.velocity.y > 2.0) {
    return 'CAVITATION';
  }
  
  return null;  // No special effect needed
}
```

### **Implementation**

**Elongation Effect:**
```javascript
class ElongationEffect {
  constructor(position, velocity, strength) {
    this.position = position;
    this.velocity = velocity;
    this.strength = strength;
    this.particles = [];  // SPH particles for elongation
    this.active = true;
  }
  
  update(dt) {
    // Simulate water stretching upward
    for (var particle of this.particles) {
      // Apply upward momentum
      particle.velocity.y += this.strength * dt;
      
      // Surface tension resists stretching
      var tension = calculateSurfaceTension(particle, this.particles);
      particle.velocity -= tension * dt;
      
      // Update position
      particle.position += particle.velocity * dt;
      
      // Check for detachment
      if (particle.position.y > waterLevel + 0.5 && particle.velocity.y > 2.0) {
        this.createDroplet(particle);
      }
    }
    
    // Deactivate if elongation is complete
    if (this.particles.length === 0) {
      this.active = false;
    }
  }
  
  createDroplet(particle) {
    // Convert particle to droplet
    var droplet = new Droplet(particle.position, particle.velocity);
    dropletSystem.add(droplet);
    this.particles.remove(particle);
  }
}
```

**Splash Effect:**
```javascript
class SplashEffect {
  constructor(impactPoint, impactVelocity, objectRadius) {
    this.impactPoint = impactPoint;
    this.impactVelocity = impactVelocity;
    this.radius = objectRadius;
    this.particles = [];
    this.active = true;
    
    // Generate splash particles
    this.generateSplashParticles();
  }
  
  generateSplashParticles() {
    var numParticles = Math.floor(this.radius * 50);  // More particles for larger impacts
    for (var i = 0; i < numParticles; i++) {
      // Random direction around impact point
      var angle = Math.random() * Math.PI * 2;
      var elevation = (Math.random() - 0.5) * Math.PI * 0.5;
      var speed = Math.random() * vec3.length(this.impactVelocity) * 0.5;
      
      var direction = vec3.create([
        Math.cos(angle) * Math.cos(elevation),
        Math.sin(elevation),
        Math.sin(angle) * Math.cos(elevation)
      ]);
      
      var particle = new SplashParticle(
        this.impactPoint,
        vec3.scale(direction, speed)
      );
      
      this.particles.push(particle);
    }
  }
  
  update(dt) {
    // Update splash particles
    for (var particle of this.particles) {
      // Gravity
      particle.velocity.y -= 9.8 * dt;
      
      // Air resistance
      particle.velocity = vec3.scale(particle.velocity, 0.98);
      
      // Update position
      particle.position += particle.velocity * dt;
      
      // Remove if below water or too far
      if (particle.position.y < waterLevel || vec3.length(particle.position - this.impactPoint) > 10.0) {
        this.particles.remove(particle);
      }
    }
    
    // Deactivate if no particles left
    if (this.particles.length === 0) {
      this.active = false;
    }
  }
}
```

**Detachment Effect:**
```javascript
class DetachmentEffect {
  constructor(position, velocity, waterSurface) {
    this.position = position;
    this.velocity = velocity;
    this.waterSurface = waterSurface;
    this.detachedParticles = [];
    this.active = true;
  }
  
  update(dt) {
    // Check if water should detach
    var surfaceHeight = this.waterSurface.getHeight(this.position.x, this.position.z);
    var waterVelocity = this.waterSurface.getVelocity(this.position.x, this.position.z);
    
    // High upward velocity + surface tension breaking = detachment
    if (waterVelocity.y > 3.0 && surfaceHeight > waterLevel + 0.3) {
      this.createDetachedParticle(this.position, waterVelocity);
    }
    
    // Update detached particles
    for (var particle of this.detachedParticles) {
      particle.velocity.y -= 9.8 * dt;  // Gravity
      particle.position += particle.velocity * dt;
      
      // Rejoin water if falls back
      if (particle.position.y < waterLevel) {
        this.waterSurface.addParticle(particle);
        this.detachedParticles.remove(particle);
      }
    }
    
    // Deactivate if complete
    if (this.detachedParticles.length === 0 && !this.checkDetachment()) {
      this.active = false;
    }
  }
}
```

### **Features**
- ✅ Elongation (water stretching upward)
- ✅ Detachment (water breaking away)
- ✅ Splashes (impact effects)
- ✅ Droplets (particle system)
- ✅ Surface tension (resistance to stretching)
- ✅ Cavitation (bubbles from breaking surface)

### **Performance**
- **Inactive:** 0ms
- **Active (per effect):** ~15-30ms
- **Typical scene:** 0-1 active effects = ~0-30ms total
- **Rare events only** - most frames have 0ms cost

---

## 💥 LEVEL 4: ULTRA EFFECTS (Rare Events)

### **Purpose**
Extreme effects for dramatic events - large splashes, breaking waves, major impacts.

### **Activation Conditions**
```javascript
function shouldActivateLevel4(event) {
  // Large object impact
  if (event.type === 'LARGE_IMPACT' && event.momentum > 100.0) {
    return true;
  }
  
  // Breaking wave
  if (event.type === 'WAVE_BREAK' && event.waveHeight > 2.0) {
    return true;
  }
  
  // Explosion near water
  if (event.type === 'EXPLOSION' && distance(event.position, waterLevel) < 5.0) {
    return true;
  }
  
  return false;
}
```

### **Implementation**

**Full SPH Simulation:**
```javascript
class UltraEffect {
  constructor(event) {
    this.event = event;
    this.sphSystem = new SPHSystem(1000);  // 1000 particles
    this.active = true;
    this.duration = 2.0;  // 2 seconds
    this.time = 0.0;
  }
  
  update(dt) {
    // Full SPH simulation
    this.sphSystem.update(dt);
    
    // Render particles
    this.renderParticles();
    
    // Deactivate after duration
    this.time += dt;
    if (this.time > this.duration) {
      this.active = false;
    }
  }
}
```

### **Features**
- ✅ Full 3D fluid simulation
- ✅ Complete SPH/FLIP system
- ✅ Realistic splashes and waves
- ✅ Particle rendering
- ✅ Very expensive but only for rare events

### **Performance**
- **Inactive:** 0ms
- **Active:** ~30-50ms per event
- **Very rare** - maybe once per minute or less
- **Acceptable** because it's so infrequent

---

## 🔄 SYSTEM INTEGRATION

### **Unified Water Manager**

```javascript
class HierarchicalWaterSystem {
  constructor() {
    this.baseWater = new BaseWater();
    this.interactiveZones = [];
    this.advancedZones = [];
    this.specialEffects = [];
    this.ultraEffects = [];
  }
  
  update(objects, camera, dt) {
    // Always update base water (cheap)
    this.baseWater.update(dt);
    
    // Update interactive zones (on-demand)
    for (var zone of this.interactiveZones) {
      if (this.shouldActivateLevel1(zone, objects, camera)) {
        zone.update(objects, dt);
      }
    }
    
    // Update advanced zones (event-triggered)
    for (var zone of this.advancedZones) {
      if (this.shouldActivateLevel2(zone, objects)) {
        zone.update(objects, dt);
      }
    }
    
    // Update special effects (conditional)
    for (var effect of this.specialEffects) {
      if (effect.active) {
        effect.update(dt);
      } else {
        // Remove inactive effects
        this.specialEffects.remove(effect);
      }
    }
    
    // Check for new special effects
    this.checkSpecialEffects(objects);
    
    // Update ultra effects (rare events)
    for (var effect of this.ultraEffects) {
      if (effect.active) {
        effect.update(dt);
      } else {
        this.ultraEffects.remove(effect);
      }
    }
  }
  
  checkSpecialEffects(objects) {
    for (var obj of objects) {
      var effectType = this.shouldActivateLevel3(obj, this.waterState);
      if (effectType) {
        var effect = this.createSpecialEffect(effectType, obj);
        this.specialEffects.push(effect);
      }
    }
  }
  
  render() {
    // Render base water (always)
    this.baseWater.render();
    
    // Render interactive zones (blended)
    for (var zone of this.interactiveZones) {
      if (zone.active) {
        this.blendZone(zone);
      }
    }
    
    // Render advanced zones (blended)
    for (var zone of this.advancedZones) {
      if (zone.active) {
        this.blendZone(zone);
      }
    }
    
    // Render special effects (additive)
    for (var effect of this.specialEffects) {
      if (effect.active) {
        effect.render();
      }
    }
    
    // Render ultra effects (additive)
    for (var effect of this.ultraEffects) {
      if (effect.active) {
        effect.render();
      }
    }
  }
  
  blendZone(zone) {
    // Smooth blending between base and zone
    var dist = distance(camera.position, zone.center);
    var blendFactor = smoothstep(zone.radius * 0.8, zone.radius, dist);
    
    // Blend heights
    var baseHeight = this.baseWater.getHeight(zone.position);
    var zoneHeight = zone.getHeight(zone.position);
    var finalHeight = mix(baseHeight, zoneHeight, blendFactor);
    
    return finalHeight;
  }
}
```

---

## 📊 PERFORMANCE ANALYSIS

### **Typical Frame Breakdown**

**Scenario 1: Calm Water (No Objects)**
- Level 0 (Base): ~1ms
- Level 1 (Interactive): 0ms (no objects)
- Level 2 (Advanced): 0ms (no fast objects)
- Level 3 (Special): 0ms (no triggers)
- Level 4 (Ultra): 0ms (no events)
- **Total: ~1ms per frame** ✅

**Scenario 2: Slow Object Movement**
- Level 0 (Base): ~1ms
- Level 1 (Interactive): ~2ms (1 zone active)
- Level 2 (Advanced): 0ms (object too slow)
- Level 3 (Special): 0ms (no triggers)
- Level 4 (Ultra): 0ms (no events)
- **Total: ~3ms per frame** ✅

**Scenario 3: Fast Object Movement**
- Level 0 (Base): ~1ms
- Level 1 (Interactive): ~2ms (1 zone active)
- Level 2 (Advanced): ~5ms (1 zone active)
- Level 3 (Special): 0ms (no triggers yet)
- Level 4 (Ultra): 0ms (no events)
- **Total: ~8ms per frame** ✅

**Scenario 4: Object Breaking Surface (Elongation)**
- Level 0 (Base): ~1ms
- Level 1 (Interactive): ~2ms (1 zone active)
- Level 2 (Advanced): ~5ms (1 zone active)
- Level 3 (Special): ~20ms (elongation effect)
- Level 4 (Ultra): 0ms (not extreme enough)
- **Total: ~28ms per frame** ⚠️ (acceptable for special moment)

**Scenario 5: Large Impact (Ultra Effect)**
- Level 0 (Base): ~1ms
- Level 1 (Interactive): ~2ms (1 zone active)
- Level 2 (Advanced): ~5ms (1 zone active)
- Level 3 (Special): ~25ms (splash effect)
- Level 4 (Ultra): ~40ms (full SPH)
- **Total: ~73ms per frame** ⚠️ (acceptable for rare dramatic event)

### **Average Performance**
- **Most frames:** ~1-5ms (calm or slow movement)
- **Common frames:** ~8-15ms (fast movement)
- **Special frames:** ~25-30ms (effects triggered)
- **Rare frames:** ~50-75ms (ultra effects)

**Result:** Maintains 60 FPS most of the time, with occasional drops during special moments (which is acceptable for dramatic effect)

---

## 🎯 IMPLEMENTATION PRIORITIES

### **Phase 1: Base + Interactive (Essential)**
1. ✅ Implement Level 0 (Base Water)
2. ✅ Implement Level 1 (Interactive Zones)
3. ✅ Zone activation system
4. ✅ Blending between levels

**Time Estimate:** 8-12 hours  
**Performance Target:** ~1-5ms per frame

### **Phase 2: Advanced Physics (Important)**
1. ✅ Implement Level 2 (Advanced Zones)
2. ✅ Momentum tracking
3. ✅ Scale-aware simulation
4. ✅ Wake pattern generation

**Time Estimate:** 6-8 hours  
**Performance Target:** ~8-15ms per frame

### **Phase 3: Special Effects (Enhancement)**
1. ✅ Implement Level 3 (Special Effects)
2. ✅ Elongation system
3. ✅ Splash system
4. ✅ Detachment system

**Time Estimate:** 12-16 hours  
**Performance Target:** ~25-30ms when active

### **Phase 4: Ultra Effects (Optional)**
1. ✅ Implement Level 4 (Ultra Effects)
2. ✅ Full SPH integration
3. ✅ Rare event detection
4. ✅ Performance optimization

**Time Estimate:** 20-30 hours  
**Performance Target:** ~50-75ms for rare events

---

## 💡 KEY INSIGHTS

### **Efficiency Principles:**

1. **Compute Only What's Needed:**
   - Base water always (cheap)
   - Interactive only when objects present
   - Advanced only when objects move fast
   - Special effects only when triggered
   - Ultra effects only for rare events

2. **Zone-Based Activation:**
   - Don't simulate entire ocean
   - Only simulate areas with activity
   - Deactivate zones when empty
   - Free memory for inactive zones

3. **Conditional Effects:**
   - Check conditions before activating
   - Deactivate immediately when done
   - Reuse effect objects when possible
   - Pool particle systems

4. **Smooth Transitions:**
   - Blend between levels
   - No popping or artifacts
   - Seamless visual experience

### **Benefits:**

- ✅ **Hyper-realistic** when needed
- ✅ **Efficient** most of the time
- ✅ **Scalable** to any scene size
- ✅ **Flexible** - easy to add new effects
- ✅ **Maintainable** - clear separation of concerns

---

## 📚 REFERENCES

- **Gerstner Waves:** https://en.wikipedia.org/wiki/Gerstner_wave
- **SPH (Smoothed Particle Hydrodynamics):** https://en.wikipedia.org/wiki/Smoothed-particle_hydrodynamics
- **FLIP (Fluid Implicit Particle):** https://en.wikipedia.org/wiki/FLIP_fluid_solver
- **LOD (Level of Detail):** https://en.wikipedia.org/wiki/Level_of_detail
- **Surface Tension:** https://en.wikipedia.org/wiki/Surface_tension

---

**END OF DESIGN DOCUMENT**

