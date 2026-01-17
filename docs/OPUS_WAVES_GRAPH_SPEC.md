# OPUS WAVES - Graph-Based Parameter System Specification

**Author:** Opus (Claude 4.5)  
**Date:** 2025-01-28  
**Status:** 🔬 Technical Specification  
**Purpose:** Detailed specification for the parameter graph system

---

## 📋 Overview

The Parameter Graph System is the heart of OPUS WAVES. It replaces static sliders with a dynamic node graph where:
- **Inputs** are real-time physics metrics (speed, energy, depth, etc.)
- **Outputs** are effect parameters (spawn rates, sizes, forces, etc.)
- **Transforms** are curves/functions that define relationships

---

## 🏗️ Core Data Structures

### TypeScript Interfaces

```typescript
// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Types of nodes in the parameter graph
 */
type NodeType = 'input' | 'output' | 'transform' | 'constant' | 'combine';

/**
 * Types of curve interpolation
 */
type CurveType = 'linear' | 'bezier' | 'hermite' | 'step' | 'smoothstep' | 'exponential';

/**
 * Types of combination operations
 */
type CombineOp = 'add' | 'multiply' | 'min' | 'max' | 'average' | 'power';

// ============================================================================
// NODE DEFINITIONS
// ============================================================================

/**
 * Base interface for all parameter nodes
 */
interface ParameterNodeBase {
  /** Unique identifier for this node */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Node type determines behavior */
  type: NodeType;
  
  /** Current computed value */
  value: number;
  
  /** UI position for graph editor */
  position: { x: number; y: number };
  
  /** Optional description */
  description?: string;
}

/**
 * Input node - receives data from physics simulation
 */
interface InputNode extends ParameterNodeBase {
  type: 'input';
  
  /** Source of the input value */
  source: 
    | 'sphereSpeed'
    | 'sphereVelocityY'
    | 'sphereVelocityMagnitude'
    | 'wettedFraction'
    | 'slamEnergy'
    | 'skimEnergy'
    | 'retractionSpeed'
    | 'maxWaveHeight'
    | 'avgWaveHeight'
    | 'deltaTime'
    | 'totalTime'
    | 'bubbleCount'
    | 'breachCount'
    | 'custom';
  
  /** Normalization range for the input */
  normalize: {
    min: number;
    max: number;
    clamp: boolean;
  };
  
  /** Custom source expression (if source === 'custom') */
  customExpression?: string;
}

/**
 * Output node - provides values to effect systems
 */
interface OutputNode extends ParameterNodeBase {
  type: 'output';
  
  /** Target parameter to control */
  target:
    | 'bubbleSpawnRate'
    | 'bubbleRiseSpeed'
    | 'bubbleSize'
    | 'bubbleTurbulence'
    | 'breachSpawnRate'
    | 'breachRadius'
    | 'breachJetSpeed'
    | 'breachUpSpeed'
    | 'foamIntensity'
    | 'foamDecayRate'
    | 'dripRate'
    | 'wakeStrength'
    | 'custom';
  
  /** Output scaling */
  scale: {
    min: number;  // Output clamped to [min, max]
    max: number;
    multiply: number;  // Final multiplier
  };
  
  /** Default value when no inputs connected */
  defaultValue: number;
  
  /** Custom target path (if target === 'custom') */
  customTarget?: string;
}

/**
 * Transform node - applies a curve function to input
 */
interface TransformNode extends ParameterNodeBase {
  type: 'transform';
  
  /** Curve definition */
  curve: CurveDefinition;
  
  /** Input connection */
  inputConnection: string | null;
}

/**
 * Constant node - provides a fixed value
 */
interface ConstantNode extends ParameterNodeBase {
  type: 'constant';
  
  /** The constant value */
  constantValue: number;
  
  /** Whether this can be adjusted by presets */
  presetAdjustable: boolean;
}

/**
 * Combine node - combines multiple inputs
 */
interface CombineNode extends ParameterNodeBase {
  type: 'combine';
  
  /** How to combine inputs */
  operation: CombineOp;
  
  /** Input connections with weights */
  inputs: Array<{
    connectionId: string;
    weight: number;
  }>;
}

/**
 * Union type for all node types
 */
type ParameterNode = InputNode | OutputNode | TransformNode | ConstantNode | CombineNode;

// ============================================================================
// CURVE DEFINITIONS
// ============================================================================

/**
 * A point on a curve
 */
interface CurvePoint {
  x: number;  // Input value (0-1)
  y: number;  // Output value (0-1)
}

/**
 * Control point for Bezier curves
 */
interface BezierControlPoint extends CurvePoint {
  /** Left handle (relative to point) */
  handleLeft?: { x: number; y: number };
  /** Right handle (relative to point) */
  handleRight?: { x: number; y: number };
}

/**
 * Curve definition
 */
interface CurveDefinition {
  type: CurveType;
  
  /** Points defining the curve */
  points: CurvePoint[] | BezierControlPoint[];
  
  /** For exponential curves */
  exponent?: number;
  
  /** For step curves - snap to nearest point */
  stepMode?: 'floor' | 'round' | 'ceil';
}

// ============================================================================
// CONNECTIONS
// ============================================================================

/**
 * A connection between two nodes
 */
interface Connection {
  id: string;
  
  /** Source node ID */
  from: string;
  
  /** Target node ID */
  to: string;
  
  /** Which input slot on the target (for combine nodes) */
  targetSlot?: number;
  
  /** Visual bezier curve points for UI */
  uiCurve?: { cp1: { x: number; y: number }; cp2: { x: number; y: number } };
}

// ============================================================================
// GRAPH STRUCTURE
// ============================================================================

/**
 * Complete parameter graph
 */
interface ParameterGraph {
  /** Graph metadata */
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  created: string;
  modified: string;
  
  /** All nodes in the graph */
  nodes: ParameterNode[];
  
  /** All connections between nodes */
  connections: Connection[];
  
  /** Topologically sorted node IDs (computed, not serialized) */
  evaluationOrder?: string[];
  
  /** Preset that this graph is based on */
  basePreset?: string;
}

// ============================================================================
// PRESETS
// ============================================================================

/**
 * A preset that can be applied to modify a graph
 */
interface GraphPreset {
  id: string;
  name: string;
  description: string;
  category: 'calm' | 'moderate' | 'intense' | 'custom';
  
  /** Node value overrides */
  nodeOverrides: Array<{
    nodeId: string;
    property: string;
    value: any;
  }>;
  
  /** Curve overrides */
  curveOverrides: Array<{
    nodeId: string;
    curve: CurveDefinition;
  }>;
  
  /** New connections to add */
  addConnections?: Connection[];
  
  /** Connections to remove */
  removeConnections?: string[];
}
```

---

## 🔧 Graph Evaluation Engine

### Implementation

```typescript
/**
 * Engine that evaluates the parameter graph each frame
 */
class ParameterGraphEngine {
  private graph: ParameterGraph;
  private nodeMap: Map<string, ParameterNode>;
  private evaluationOrder: string[];
  private frameInputs: Map<string, number>;
  
  constructor(graph: ParameterGraph) {
    this.graph = graph;
    this.nodeMap = new Map();
    this.frameInputs = new Map();
    
    // Build node lookup map
    for (const node of graph.nodes) {
      this.nodeMap.set(node.id, node);
    }
    
    // Compute evaluation order
    this.evaluationOrder = this.topologicalSort();
  }
  
  /**
   * Topological sort using Kahn's algorithm
   */
  private topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    
    // Initialize
    for (const node of this.graph.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }
    
    // Build graph
    for (const conn of this.graph.connections) {
      const targets = adjacency.get(conn.from)!;
      targets.push(conn.to);
      inDegree.set(conn.to, inDegree.get(conn.to)! + 1);
    }
    
    // Find nodes with no incoming edges
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }
    
    // Process
    const result: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);
      
      for (const neighbor of adjacency.get(nodeId)!) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // Check for cycles
    if (result.length !== this.graph.nodes.length) {
      throw new Error('Graph contains cycles!');
    }
    
    return result;
  }
  
  /**
   * Set input values for this frame
   */
  setFrameInputs(inputs: Record<string, number>): void {
    for (const [key, value] of Object.entries(inputs)) {
      this.frameInputs.set(key, value);
    }
  }
  
  /**
   * Evaluate the entire graph and return output values
   */
  evaluate(): Map<string, number> {
    const outputs = new Map<string, number>();
    
    // Process nodes in topological order
    for (const nodeId of this.evaluationOrder) {
      const node = this.nodeMap.get(nodeId)!;
      let value: number;
      
      switch (node.type) {
        case 'input':
          value = this.evaluateInputNode(node as InputNode);
          break;
        case 'constant':
          value = (node as ConstantNode).constantValue;
          break;
        case 'transform':
          value = this.evaluateTransformNode(node as TransformNode);
          break;
        case 'combine':
          value = this.evaluateCombineNode(node as CombineNode);
          break;
        case 'output':
          value = this.evaluateOutputNode(node as OutputNode);
          outputs.set((node as OutputNode).target, value);
          break;
        default:
          value = 0;
      }
      
      node.value = value;
    }
    
    return outputs;
  }
  
  private evaluateInputNode(node: InputNode): number {
    // Get raw value from frame inputs
    let raw = this.frameInputs.get(node.source) ?? 0;
    
    // Normalize
    const { min, max, clamp } = node.normalize;
    let normalized = (raw - min) / (max - min);
    
    if (clamp) {
      normalized = Math.max(0, Math.min(1, normalized));
    }
    
    return normalized;
  }
  
  private evaluateTransformNode(node: TransformNode): number {
    // Get input value
    let input = 0;
    if (node.inputConnection) {
      const sourceNode = this.nodeMap.get(node.inputConnection);
      if (sourceNode) {
        input = sourceNode.value;
      }
    }
    
    // Apply curve
    return this.evaluateCurve(input, node.curve);
  }
  
  private evaluateCombineNode(node: CombineNode): number {
    const values: number[] = [];
    const weights: number[] = [];
    
    for (const input of node.inputs) {
      const sourceNode = this.nodeMap.get(input.connectionId);
      if (sourceNode) {
        values.push(sourceNode.value);
        weights.push(input.weight);
      }
    }
    
    if (values.length === 0) return 0;
    
    switch (node.operation) {
      case 'add':
        return values.reduce((sum, v, i) => sum + v * weights[i], 0);
      case 'multiply':
        return values.reduce((prod, v, i) => prod * Math.pow(v, weights[i]), 1);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'average':
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        return values.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
      case 'power':
        // First value raised to power of second
        return values.length >= 2 ? Math.pow(values[0], values[1]) : values[0];
      default:
        return values[0];
    }
  }
  
  private evaluateOutputNode(node: OutputNode): number {
    // Find incoming connection
    const conn = this.graph.connections.find(c => c.to === node.id);
    let value = node.defaultValue;
    
    if (conn) {
      const sourceNode = this.nodeMap.get(conn.from);
      if (sourceNode) {
        value = sourceNode.value;
      }
    }
    
    // Apply scaling
    const { min, max, multiply } = node.scale;
    value = Math.max(min, Math.min(max, value * multiply));
    
    return value;
  }
  
  private evaluateCurve(input: number, curve: CurveDefinition): number {
    const x = Math.max(0, Math.min(1, input));
    
    switch (curve.type) {
      case 'linear':
        return this.evaluateLinearCurve(x, curve.points as CurvePoint[]);
      case 'bezier':
        return this.evaluateBezierCurve(x, curve.points as BezierControlPoint[]);
      case 'step':
        return this.evaluateStepCurve(x, curve.points as CurvePoint[], curve.stepMode || 'floor');
      case 'smoothstep':
        return this.evaluateSmoothstepCurve(x, curve.points as CurvePoint[]);
      case 'exponential':
        return Math.pow(x, curve.exponent || 1);
      case 'hermite':
        return this.evaluateHermiteCurve(x, curve.points as CurvePoint[]);
      default:
        return x;
    }
  }
  
  private evaluateLinearCurve(x: number, points: CurvePoint[]): number {
    if (points.length === 0) return x;
    if (points.length === 1) return points[0].y;
    
    // Find segment
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
        return points[i].y + t * (points[i + 1].y - points[i].y);
      }
    }
    
    // Extrapolate
    return x < points[0].x ? points[0].y : points[points.length - 1].y;
  }
  
  private evaluateBezierCurve(x: number, points: BezierControlPoint[]): number {
    if (points.length < 2) return x;
    
    // Find segment containing x
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        const p0 = points[i];
        const p3 = points[i + 1];
        
        // Control points
        const p1 = {
          x: p0.x + (p0.handleRight?.x || (p3.x - p0.x) * 0.33),
          y: p0.y + (p0.handleRight?.y || 0)
        };
        const p2 = {
          x: p3.x + (p3.handleLeft?.x || (p0.x - p3.x) * 0.33),
          y: p3.y + (p3.handleLeft?.y || 0)
        };
        
        // Find t for x using Newton-Raphson
        let t = (x - p0.x) / (p3.x - p0.x);
        for (let iter = 0; iter < 5; iter++) {
          const bx = this.cubicBezier(t, p0.x, p1.x, p2.x, p3.x);
          const bxPrime = this.cubicBezierDerivative(t, p0.x, p1.x, p2.x, p3.x);
          if (Math.abs(bxPrime) < 1e-6) break;
          t -= (bx - x) / bxPrime;
          t = Math.max(0, Math.min(1, t));
        }
        
        return this.cubicBezier(t, p0.y, p1.y, p2.y, p3.y);
      }
    }
    
    return x < points[0].x ? points[0].y : points[points.length - 1].y;
  }
  
  private cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
  }
  
  private cubicBezierDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    return 3 * mt2 * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t2 * (p3 - p2);
  }
  
  private evaluateStepCurve(x: number, points: CurvePoint[], mode: 'floor' | 'round' | 'ceil'): number {
    if (points.length === 0) return x;
    
    for (let i = points.length - 1; i >= 0; i--) {
      if (mode === 'floor' && x >= points[i].x) return points[i].y;
      if (mode === 'ceil' && x <= points[i].x) return points[i].y;
      if (mode === 'round') {
        const dist = Math.abs(x - points[i].x);
        if (i === 0 || dist <= Math.abs(x - points[i - 1].x)) return points[i].y;
      }
    }
    
    return points[0].y;
  }
  
  private evaluateSmoothstepCurve(x: number, points: CurvePoint[]): number {
    if (points.length < 2) return x;
    
    // Find segment
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
        const smooth = t * t * (3 - 2 * t); // Hermite smoothstep
        return points[i].y + smooth * (points[i + 1].y - points[i].y);
      }
    }
    
    return x < points[0].x ? points[0].y : points[points.length - 1].y;
  }
  
  private evaluateHermiteCurve(x: number, points: CurvePoint[]): number {
    // Similar to linear but with smooth derivatives at control points
    // Implementation uses Catmull-Rom for automatic tangent calculation
    if (points.length < 2) return x;
    
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) {
        const t = (x - points[i].x) / (points[i + 1].x - points[i].x);
        
        // Get tangent vectors (Catmull-Rom)
        const m0 = i > 0 
          ? (points[i + 1].y - points[i - 1].y) / (points[i + 1].x - points[i - 1].x)
          : (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
        const m1 = i < points.length - 2
          ? (points[i + 2].y - points[i].y) / (points[i + 2].x - points[i].x)
          : (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
        
        // Hermite basis functions
        const t2 = t * t;
        const t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        
        const span = points[i + 1].x - points[i].x;
        return h00 * points[i].y + h10 * span * m0 + h01 * points[i + 1].y + h11 * span * m1;
      }
    }
    
    return x < points[0].x ? points[0].y : points[points.length - 1].y;
  }
}
```

---

## 📊 Default Graph Configuration

### Standard Input/Output Mappings

```typescript
const DEFAULT_OPUS_GRAPH: ParameterGraph = {
  id: 'opus-default',
  name: 'OPUS Default',
  description: 'Default parameter relationships for OPUS WAVES',
  version: '1.0.0',
  author: 'Opus',
  created: '2025-01-28',
  modified: '2025-01-28',
  
  nodes: [
    // ========== INPUT NODES ==========
    {
      id: 'in-speed',
      name: 'Sphere Speed',
      type: 'input',
      source: 'sphereSpeed',
      value: 0,
      position: { x: 50, y: 50 },
      normalize: { min: 0, max: 2, clamp: true },
    },
    {
      id: 'in-velocityY',
      name: 'Vertical Velocity',
      type: 'input',
      source: 'sphereVelocityY',
      value: 0,
      position: { x: 50, y: 150 },
      normalize: { min: -2, max: 2, clamp: true },
    },
    {
      id: 'in-wetted',
      name: 'Wetted Fraction',
      type: 'input',
      source: 'wettedFraction',
      value: 0,
      position: { x: 50, y: 250 },
      normalize: { min: 0, max: 1, clamp: true },
    },
    {
      id: 'in-slam',
      name: 'Slam Energy',
      type: 'input',
      source: 'slamEnergy',
      value: 0,
      position: { x: 50, y: 350 },
      normalize: { min: 0, max: 0.1, clamp: false },
    },
    {
      id: 'in-retraction',
      name: 'Retraction Speed',
      type: 'input',
      source: 'retractionSpeed',
      value: 0,
      position: { x: 50, y: 450 },
      normalize: { min: 0, max: 1, clamp: true },
    },
    
    // ========== TRANSFORM NODES ==========
    {
      id: 'xform-speed-bubble',
      name: 'Speed → Bubble Curve',
      type: 'transform',
      value: 0,
      position: { x: 250, y: 100 },
      inputConnection: 'in-speed',
      curve: {
        type: 'bezier',
        points: [
          { x: 0, y: 0, handleRight: { x: 0.2, y: 0 } },
          { x: 0.3, y: 0.05, handleLeft: { x: -0.1, y: 0 }, handleRight: { x: 0.1, y: 0.1 } },
          { x: 0.7, y: 0.5, handleLeft: { x: -0.1, y: -0.1 }, handleRight: { x: 0.1, y: 0.2 } },
          { x: 1, y: 1, handleLeft: { x: -0.2, y: 0 } },
        ],
      },
    },
    {
      id: 'xform-slam-breach',
      name: 'Slam → Breach Curve',
      type: 'transform',
      value: 0,
      position: { x: 250, y: 300 },
      inputConnection: 'in-slam',
      curve: {
        type: 'smoothstep',
        points: [
          { x: 0, y: 0 },
          { x: 0.3, y: 0 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
        ],
      },
    },
    {
      id: 'xform-retraction-breach',
      name: 'Retraction → Breach Curve',
      type: 'transform',
      value: 0,
      position: { x: 250, y: 400 },
      inputConnection: 'in-retraction',
      curve: {
        type: 'exponential',
        exponent: 2,
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      },
    },
    
    // ========== COMBINE NODES ==========
    {
      id: 'combine-breach',
      name: 'Combine Breach Sources',
      type: 'combine',
      value: 0,
      position: { x: 450, y: 350 },
      operation: 'add',
      inputs: [
        { connectionId: 'xform-slam-breach', weight: 0.6 },
        { connectionId: 'xform-retraction-breach', weight: 0.4 },
      ],
    },
    {
      id: 'combine-bubble-rate',
      name: 'Combine Bubble Factors',
      type: 'combine',
      value: 0,
      position: { x: 450, y: 150 },
      operation: 'multiply',
      inputs: [
        { connectionId: 'xform-speed-bubble', weight: 1.0 },
        { connectionId: 'in-wetted', weight: 1.0 },
      ],
    },
    
    // ========== OUTPUT NODES ==========
    {
      id: 'out-bubble-rate',
      name: 'Bubble Spawn Rate',
      type: 'output',
      target: 'bubbleSpawnRate',
      value: 0,
      position: { x: 650, y: 100 },
      scale: { min: 0, max: 200, multiply: 200 },
      defaultValue: 10,
    },
    {
      id: 'out-breach-rate',
      name: 'Breach Spawn Rate',
      type: 'output',
      target: 'breachSpawnRate',
      value: 0,
      position: { x: 650, y: 350 },
      scale: { min: 0, max: 50, multiply: 50 },
      defaultValue: 5,
    },
    {
      id: 'out-foam-intensity',
      name: 'Foam Intensity',
      type: 'output',
      target: 'foamIntensity',
      value: 0,
      position: { x: 650, y: 250 },
      scale: { min: 0, max: 1, multiply: 1 },
      defaultValue: 0.5,
    },
  ],
  
  connections: [
    { id: 'c1', from: 'in-speed', to: 'xform-speed-bubble' },
    { id: 'c2', from: 'in-slam', to: 'xform-slam-breach' },
    { id: 'c3', from: 'in-retraction', to: 'xform-retraction-breach' },
    { id: 'c4', from: 'xform-speed-bubble', to: 'combine-bubble-rate' },
    { id: 'c5', from: 'in-wetted', to: 'combine-bubble-rate' },
    { id: 'c6', from: 'xform-slam-breach', to: 'combine-breach' },
    { id: 'c7', from: 'xform-retraction-breach', to: 'combine-breach' },
    { id: 'c8', from: 'combine-bubble-rate', to: 'out-bubble-rate' },
    { id: 'c9', from: 'combine-breach', to: 'out-breach-rate' },
    { id: 'c10', from: 'combine-breach', to: 'out-foam-intensity' },
  ],
};
```

---

## 🎨 UI Component: Curve Editor

### React Component Sketch

```tsx
interface CurveEditorProps {
  curve: CurveDefinition;
  onChange: (curve: CurveDefinition) => void;
  width?: number;
  height?: number;
  gridLines?: number;
  showLabels?: boolean;
}

const CurveEditor: React.FC<CurveEditorProps> = ({
  curve,
  onChange,
  width = 300,
  height = 200,
  gridLines = 5,
  showLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<'point' | 'handleLeft' | 'handleRight' | null>(null);
  
  // Draw curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    
    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const x = (i / gridLines) * width;
      const y = (i / gridLines) * height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Curve
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const engine = new ParameterGraphEngine({ nodes: [], connections: [] } as any);
    for (let px = 0; px < width; px++) {
      const x = px / width;
      const y = (engine as any).evaluateCurve(x, curve);
      const py = height - y * height;
      if (px === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    
    // Control points
    for (let i = 0; i < curve.points.length; i++) {
      const point = curve.points[i];
      const px = point.x * width;
      const py = height - point.y * height;
      
      // Point
      ctx.fillStyle = i === selectedPoint ? '#ff6600' : '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Bezier handles
      if (curve.type === 'bezier' && (point as BezierControlPoint).handleLeft) {
        const bp = point as BezierControlPoint;
        const hx = (point.x + (bp.handleLeft?.x || 0)) * width;
        const hy = height - (point.y + (bp.handleLeft?.y || 0)) * height;
        
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
  }, [curve, width, height, gridLines, selectedPoint]);
  
  // Mouse handlers...
  
  return (
    <div className="curve-editor">
      {showLabels && (
        <div className="curve-labels">
          <span className="label-y">Output</span>
          <span className="label-x">Input</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <div className="curve-type-selector">
        <select 
          value={curve.type}
          onChange={(e) => onChange({ ...curve, type: e.target.value as CurveType })}
        >
          <option value="linear">Linear</option>
          <option value="bezier">Bezier</option>
          <option value="smoothstep">Smoothstep</option>
          <option value="step">Step</option>
          <option value="exponential">Exponential</option>
        </select>
      </div>
    </div>
  );
};
```

---

## 📦 Integration with OPUS WAVES Scene

### Usage in Scene Component

```typescript
// In OpusWavesScene.tsx

function OpusWavesScene({ settings }: { settings: UnifiedWaterSettings }) {
  // Initialize graph engine
  const graphEngineRef = useRef<ParameterGraphEngine>();
  
  useEffect(() => {
    // Load graph from settings or use default
    const graph = settings.opusGraph || DEFAULT_OPUS_GRAPH;
    graphEngineRef.current = new ParameterGraphEngine(graph);
  }, [settings.opusGraph]);
  
  useFrame((state, delta) => {
    const engine = graphEngineRef.current;
    if (!engine) return;
    
    // Gather physics inputs
    engine.setFrameInputs({
      sphereSpeed: sphereVelocityRef.current.length(),
      sphereVelocityY: sphereVelocityRef.current.y,
      wettedFraction: sphereSubmergedFractionRef.current,
      slamEnergy: slamWaveImpulse,
      retractionSpeed: waveRetractionRef.current.maxRetractionSpeed,
      deltaTime: delta,
    });
    
    // Evaluate graph
    const outputs = engine.evaluate();
    
    // Apply outputs to effect systems
    const bubbleRate = outputs.get('bubbleSpawnRate') || 10;
    const breachRate = outputs.get('breachSpawnRate') || 5;
    const foamIntensity = outputs.get('foamIntensity') || 0.5;
    
    // Spawn bubbles based on graph-computed rate
    spawnBubbles(delta, bubbleRate);
    
    // Spawn breaches based on graph-computed rate
    spawnBreaches(delta, breachRate);
    
    // Apply foam intensity
    updateFoam(delta, foamIntensity);
  });
}
```

---

## 🔗 References

### Flag2 Curve Editor
The `flag2` app has an excellent curve editor implementation that can serve as a reference:
- Located at: `Documentation/appexamples/flag2/src/components/CurveEditor.tsx`
- Features: Bezier handles, point adding/removing, smooth interpolation

### Three.js Shader Graph
The external project "Three.js Shader Graph" demonstrates node-based visual programming for Three.js:
- Website: https://www.threejsshadergraph.com/
- Key concepts: Node connections, real-time preview, TSL code generation

---

**Status:** Technical Specification Complete  
**Ready for:** Phase 1 Implementation  
**Estimated Effort:** 2 weeks for core graph system + UI
