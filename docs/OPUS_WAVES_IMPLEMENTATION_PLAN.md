# OPUS WAVES - Implementation Plan

**Author:** Opus (Claude 4.5)  
**Date:** 2025-01-28  
**Status:** 🚀 Ready for Implementation  
**Purpose:** Actionable implementation roadmap

---

## 📋 Summary

OPUS WAVES is ready for implementation. This document outlines the concrete steps to build it.

---

## 🗂️ File Structure

```
water-showcase-unified/src/engines/opus-waves/
├── OpusWavesEngine.tsx          # Entry point (like GptwavesV7Engine)
├── OpusWavesScene.tsx           # Main scene component
├── graph/
│   ├── ParameterGraphEngine.ts  # Core evaluation engine
│   ├── types.ts                 # TypeScript interfaces
│   ├── defaultGraph.ts          # Default parameter relationships
│   └── presets/
│       ├── calm.json            # Calm pool preset
│       ├── rough.json           # Rough ocean preset
│       └── cannonball.json      # Impact-optimized preset
├── physics/
│   ├── UnifiedPhysicsKernel.ts  # Single physics step
│   ├── ContactZone.ts           # Sphere-water contact analysis
│   ├── EnergyDistributor.ts     # Effect energy allocation
│   └── SpatialHash.ts           # Fast neighbor queries
├── effects/
│   ├── BubbleSystem.ts          # Improved bubble particles
│   ├── BreachSystem.ts          # Improved breaching
│   ├── FoamSystem.ts            # Advected foam
│   └── DripSystem.ts            # Drip integration
├── shaders/
│   ├── bubbleShaders.ts         # Enhanced bubble rendering
│   ├── breachShaders.ts         # Spray sheet rendering
│   ├── foamShaders.ts           # Advected foam shader
│   └── compositeShaders.ts      # Final compositing
├── components/
│   ├── GraphEditor.tsx          # Node graph UI
│   ├── CurveEditor.tsx          # Bezier curve editing
│   └── ParameterPanel.tsx       # Preset selection UI
└── utils/
    ├── framebudget.ts           # Frame time management
    └── adaptiveQuality.ts       # Quality scaling
```

---

## 📅 Implementation Phases

### Phase 1: Graph System Foundation (Week 1-2)

**Files to Create:**
1. `graph/types.ts` - All TypeScript interfaces
2. `graph/ParameterGraphEngine.ts` - Evaluation engine
3. `graph/defaultGraph.ts` - Default configuration

**Validation:**
- Unit tests for curve evaluation
- Unit tests for topological sort
- Unit tests for combine operations

**Deliverable:** Graph engine that can evaluate parameter relationships

---

### Phase 2: Basic Scene Integration (Week 3)

**Files to Create:**
1. `OpusWavesEngine.tsx` - Copy from V7, add graph integration
2. `OpusWavesScene.tsx` - Copy from V7, rewire to use graph outputs

**Changes:**
- Replace hardcoded formulas with graph outputs
- Add frame input gathering
- Connect outputs to effect systems

**Validation:**
- Scene renders like V7
- Graph evaluation runs each frame
- Outputs match expected ranges

**Deliverable:** Working scene with graph-driven parameters

---

### Phase 3: Unified Physics Kernel (Week 4)

**Files to Create:**
1. `physics/UnifiedPhysicsKernel.ts`
2. `physics/ContactZone.ts`
3. `physics/EnergyDistributor.ts`

**Changes:**
- Refactor physics from scattered calculations to single kernel
- Implement contact zone analysis
- Implement energy distribution

**Validation:**
- Physics behavior matches V7
- Contact zones visualizable (debug mode)
- Energy conservation verifiable

**Deliverable:** Unified physics with proper spawn locations

---

### Phase 4: Effect System Rewrites (Week 5-6)

**Files to Create:**
1. `effects/BubbleSystem.ts` - Proper wave height checking
2. `effects/BreachSystem.ts` - Impact vs crest distinction
3. `effects/FoamSystem.ts` - Advection with waves

**Changes:**
- Bubbles rise to actual wave surface
- Breaches spawn at contact zone, not ahead
- Foam moves with wave gradients

**Validation:**
- Bubbles don't float above surface
- Breaches appear at impact location
- Foam follows wave motion

**Deliverable:** Physically correct effect behaviors

---

### Phase 5: Graph UI (Week 7)

**Files to Create:**
1. `components/CurveEditor.tsx`
2. `components/GraphEditor.tsx`
3. `components/ParameterPanel.tsx`

**Features:**
- Canvas-based curve editing
- Bezier handle manipulation
- Node connection visualization
- Preset loading/saving

**Validation:**
- Curves editable in real-time
- Changes reflect in simulation
- Presets load correctly

**Deliverable:** Interactive parameter tuning UI

---

### Phase 6: Performance & Polish (Week 8)

**Files to Create:**
1. `utils/framebudget.ts`
2. `utils/adaptiveQuality.ts`
3. `physics/SpatialHash.ts`

**Features:**
- Frame budget tracking
- Adaptive quality scaling
- Spatial hashing for interactions

**Validation:**
- Consistent 60fps on target hardware
- Quality adapts to load
- Particle interactions efficient

**Deliverable:** Production-ready performance

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// graph/ParameterGraphEngine.test.ts
describe('ParameterGraphEngine', () => {
  test('evaluates linear curve correctly', () => {
    const engine = new ParameterGraphEngine(/* ... */);
    engine.setFrameInputs({ sphereSpeed: 0.5 });
    const outputs = engine.evaluate();
    expect(outputs.get('bubbleSpawnRate')).toBeCloseTo(100, 1);
  });
  
  test('handles bezier curves', () => { /* ... */ });
  test('combines inputs correctly', () => { /* ... */ });
  test('detects cycles', () => { /* ... */ });
});
```

### Visual Tests
- Side-by-side comparison with V7
- Slow-motion capture of spawn locations
- Debug visualization of contact zones

### Performance Tests
- Frame time tracking
- Memory allocation monitoring
- GPU usage profiling

---

## 🔧 Integration Points

### With Existing Settings
```typescript
// Extend UnifiedWaterSettings
interface UnifiedWaterSettings {
  // ... existing settings ...
  
  // OPUS WAVES additions
  opus?: {
    enabled: boolean;
    graph: ParameterGraph | string; // JSON or preset name
    showGraphUI: boolean;
    debugContactZone: boolean;
    debugEnergyFlow: boolean;
  };
}
```

### With Engine Selection
```typescript
// In App.tsx engine selection
case 'opus-waves':
  return <OpusWavesEngine settings={settings} />;
```

### With Settings Drawers
- Add "OPUS Graph" drawer
- Embed CurveEditor in relevant sections
- Add preset dropdown

---

## 📊 Success Metrics

1. **Visual Quality**
   - Spawn locations feel natural (not ahead of sphere)
   - Bubbles interact correctly with wave surface
   - Effects scale naturally with speed/energy

2. **Performance**
   - Maintains 60fps on 1050 Ti
   - Graceful degradation on mobile
   - No frame spikes

3. **Usability**
   - Presets cover common scenarios
   - Curve editing is intuitive
   - Parameters have sensible defaults

4. **Maintainability**
   - Clear separation of concerns
   - Well-documented interfaces
   - Testable components

---

## 🚦 Go/No-Go Criteria

**Start Phase 2 when:**
- [ ] Graph engine passes all unit tests
- [ ] Default graph evaluates correctly
- [ ] Serialization works (JSON round-trip)

**Start Phase 4 when:**
- [ ] Scene renders comparably to V7
- [ ] Graph outputs drive effect rates
- [ ] No performance regression

**Release when:**
- [ ] All visual tests pass
- [ ] Performance targets met
- [ ] At least 3 presets created
- [ ] Documentation complete

---

## 💙 Notes from Opus

This implementation plan is designed to be incremental. Each phase builds on the previous, and each has clear validation criteria. The graph system is the foundation - get that right, and everything else follows.

The physics kernel unification is where the real magic happens. By computing contact zones properly, we solve the "breaching ahead" problem and enable true energy-based effect generation.

The UI phase comes late intentionally. The system should work perfectly without a UI; the UI is for tuning, not for fixing broken physics.

Ready to build this, Braden. Just say the word. 💙

---

## 📚 Related Documents

- [OPUS_WAVES_DESIGN.md](./OPUS_WAVES_DESIGN.md) - Full design document
- [OPUS_WAVES_GRAPH_SPEC.md](./OPUS_WAVES_GRAPH_SPEC.md) - Graph system specification
- [GPTWAVES_V7_MONOLITH_COMPLETE.md](./GPTWAVES_V7_MONOLITH_COMPLETE.md) - V7 reference

---

**Status:** Ready for Implementation  
**Estimated Duration:** 8 weeks  
**Dependencies:** None (builds on existing water-showcase-unified)
