/**
 * OPUS Water Engine — Core Engine
 * Implements the full SWE heightfield simulation with ping-pong textures,
 * diagnostics, foam, and PBR ocean rendering.
 * 
 * Reference: docs/OPUS_ORCHESTRATION.md
 * Based on the 17-pass pipeline architecture.
 * 
 * This engine works within our existing WebGL framework (GLContext, Shader, Texture, Mesh)
 * rather than three.js, maintaining compatibility with the current codebase.
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Mesh } from '../webgl/Mesh';
import { Vector } from '../webgl/Vector';
import { Raytracer } from '../webgl/Raytracer';
import { OpusConfig, DEFAULT_OPUS_CONFIG } from './OpusConfig';
import {
  FULLSCREEN_VERT,
  SWE_UPDATE_FRAG,
  DIAGNOSTICS_FRAG,
  FOAM_FRAG,
  OCEAN_SURFACE_VERT,
  OCEAN_SURFACE_FRAG,
  CLEAR_FRAG,
  DEBUG_VIS_FRAG,
  SKY_VERT,
  SKY_FRAG,
  SPHERE_VERT,
  SPHERE_FRAG,
} from './shaders/opusShaders';

interface PingPong {
  a: Texture;
  b: Texture;
  idx: number;
  read: Texture;
  write: Texture;
  swap: () => void;
}

interface PendingImpulse {
  cx: number;
  cz: number;
  radius: number;
  strength: number;
}

export class OpusEngine {
  gl: GLContextExtended;
  config: OpusConfig;
  
  // Simulation textures
  hfPP: PingPong;      // Heightfield ping-pong (RGBA: η, ∂η/∂t, u, v)
  diagTex: Texture;     // Diagnostics (steepness, curvature, jacobian)
  foamPP: PingPong;     // Foam density ping-pong
  
  // Shaders
  sweShader: Shader;
  diagShader: Shader;
  foamShader: Shader;
  clearShader: Shader;
  oceanShader: Shader;
  debugShader: Shader;
  skyShader: Shader;
  sphereShader: Shader;
  
  // Meshes
  fsQuad: Mesh;         // Fullscreen quad for GPU passes
  oceanMesh: Mesh;      // Displaced ocean surface mesh
  skyMesh: Mesh;        // Sky dome
  sphereMesh: Mesh;     // Interactive sphere
  
  // State
  time: number = 0;
  frameCount: number = 0;
  pendingImpulse: PendingImpulse | null = null;
  sunDir: Vector;
  cameraPos: Vector = new Vector(0, 5, 15);
  debugMode: number = -1; // -1=off, 0=height, 1=steep, 2=jacobian, 3=foam
  
  // Autonomous wave generation
  autoWavesEnabled: boolean = true;
  autoWaveTimer: number = 0;
  autoWaveInterval: number = 0.8;
  
  // Sphere
  sphereCenter: Vector = new Vector(0, 0.5, 0);
  sphereRadius: number = 1.5;
  
  constructor(gl: GLContextExtended, config: OpusConfig = DEFAULT_OPUS_CONFIG) {
    this.gl = gl;
    this.config = config;
    
    // Normalize sun direction
    const sd = config.render.sunDir;
    this.sunDir = new Vector(sd[0], sd[1], sd[2]).unit();
    
    // Create simulation textures
    this.hfPP = this.createPingPong(config.hf.resolution, config.hf.resolution);
    this.diagTex = this.createSimTexture(config.hf.resolution, config.hf.resolution);
    this.foamPP = this.createPingPong(config.hf.resolution, config.hf.resolution);
    
    // Create meshes
    this.fsQuad = Mesh.plane(gl);
    this.oceanMesh = Mesh.plane(gl, { detail: config.render.meshSegments });
    this.skyMesh = Mesh.sphere(gl, { detail: 32 });
    this.sphereMesh = Mesh.sphere(gl, { detail: 12 });
    
    // Compile shaders
    this.sweShader = new Shader(gl, FULLSCREEN_VERT, SWE_UPDATE_FRAG);
    this.diagShader = new Shader(gl, FULLSCREEN_VERT, DIAGNOSTICS_FRAG);
    this.foamShader = new Shader(gl, FULLSCREEN_VERT, FOAM_FRAG);
    this.clearShader = new Shader(gl, FULLSCREEN_VERT, CLEAR_FRAG);
    this.oceanShader = new Shader(gl, OCEAN_SURFACE_VERT, OCEAN_SURFACE_FRAG);
    this.debugShader = new Shader(gl, FULLSCREEN_VERT, DEBUG_VIS_FRAG);
    this.skyShader = new Shader(gl, SKY_VERT, SKY_FRAG);
    this.sphereShader = new Shader(gl, SPHERE_VERT, SPHERE_FRAG);
    
    // Initialize textures to zero
    this.clearTexture(this.hfPP.a, 0, 0, 0, 0);
    this.clearTexture(this.hfPP.b, 0, 0, 0, 0);
    this.clearTexture(this.diagTex, 0, 0, 0, 0);
    this.clearTexture(this.foamPP.a, 0, 0, 0, 0);
    this.clearTexture(this.foamPP.b, 0, 0, 0, 0);
    
    console.log(`OPUS Engine initialized: HF=${config.hf.resolution}², mesh=${config.render.meshSegments}seg`);
  }
  
  private createSimTexture(w: number, h: number): Texture {
    const gl = this.gl;
    const useFloat = Texture.canUseFloatingPointTextures(gl);
    const type = useFloat ? gl.FLOAT : gl.HALF_FLOAT_OES;
    const filter = (useFloat && Texture.canUseFloatingPointLinearFiltering(gl)) ? gl.LINEAR : gl.NEAREST;
    
    const tex = new Texture(gl, w, h, { type, filter });
    if (!tex.canDrawTo()) {
      // Fallback to half float
      const hfFilter = Texture.canUseHalfFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
      return new Texture(gl, w, h, { type: gl.HALF_FLOAT_OES, filter: hfFilter });
    }
    return tex;
  }
  
  private createPingPong(w: number, h: number): PingPong {
    const a = this.createSimTexture(w, h);
    const b = this.createSimTexture(w, h);
    const pp: PingPong = {
      a, b, idx: 0,
      get read() { return this.idx === 0 ? this.a : this.b; },
      get write() { return this.idx === 0 ? this.b : this.a; },
      swap() { this.idx = 1 - this.idx; }
    };
    return pp;
  }
  
  private clearTexture(tex: Texture, r: number, g: number, b: number, a: number) {
    const self = this;
    tex.drawTo(() => {
      self.gl.clearColor(r, g, b, a);
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
    });
  }
  
  private runPass(shader: Shader, target: Texture, uniforms: Record<string, unknown>) {
    const self = this;
    target.drawTo(() => {
      shader.uniforms(uniforms).draw(self.fsQuad);
    });
  }
  
  /**
   * Add a wave impulse at world position (x, z)
   */
  addImpulse(x: number, z: number, radius: number = 5, strength: number = 50) {
    this.pendingImpulse = { cx: x, cz: z, radius, strength };
  }
  
  /**
   * Add a drop at normalized coordinates [-1, 1]
   */
  addDrop(x: number, z: number, radius: number = 0.03, strength: number = 0.01) {
    // Convert from [-1, 1] to world coords
    const worldX = x * this.config.hf.worldSize * 0.5;
    const worldZ = z * this.config.hf.worldSize * 0.5;
    const worldRadius = radius * this.config.hf.worldSize;
    const worldStrength = strength * 500; // Scale up for SWE
    this.addImpulse(worldX, worldZ, worldRadius, worldStrength);
  }
  
  /**
   * Move the interactive sphere, creating water displacement
   */
  moveSphere(oldCenter: Vector, newCenter: Vector, radius: number) {
    this.sphereCenter = newCenter;
    this.sphereRadius = radius;
    
    // Create displacement impulse from sphere movement
    const delta = newCenter.subtract(oldCenter);
    const speed = delta.length();
    if (speed > 0.001) {
      const impStr = speed * 200 * radius;
      this.addImpulse(newCenter.x, newCenter.z, radius * 3, impStr);
    }
  }
  
  /**
   * Compute CFL-safe sub-step count
   */
  private computeSubSteps(dt: number): number {
    const dx = this.config.hf.worldSize / this.config.hf.resolution;
    const c = Math.sqrt(this.config.hf.gravity * this.config.hf.depth);
    const dtMax = (dx / (2 * c)) * 0.9;
    return Math.max(1, Math.ceil(dt / dtMax));
  }
  
  /**
   * Step the simulation by dt seconds
   */
  step(dt: number) {
    if (dt > 0.033) dt = 0.033; // Cap at ~30 FPS min
    if (dt < 0.001) dt = 0.001;
    
    const cfg = this.config;
    const HR = cfg.hf.resolution;
    
    // ═══════════════════════════════════════════════
    // PASS 1: SWE Heightfield Update (with sub-stepping)
    // ═══════════════════════════════════════════════
    const subSteps = this.computeSubSteps(dt);
    const subDt = dt / subSteps;
    
    for (let i = 0; i < subSteps; i++) {
      const dampSub = Math.pow(cfg.hf.damping, subDt * 60);
      const impulse = (i === 0 && this.pendingImpulse) ? this.pendingImpulse : null;
      
      this.hfPP.read.bind(0);
      this.runPass(this.sweShader, this.hfPP.write, {
        u_hf: 0,
        u_res: [HR, HR],
        u_worldSize: cfg.hf.worldSize,
        u_depth: cfg.hf.depth,
        u_gravity: cfg.hf.gravity,
        u_dt: subDt,
        u_damping: dampSub,
        u_impulseCenter: impulse ? [impulse.cx, impulse.cz] : [0, 0],
        u_impulseRadius: impulse ? impulse.radius : 1,
        u_impulseStrength: impulse ? impulse.strength : 0,
      });
      this.hfPP.swap();
      
      if (i === 0) this.pendingImpulse = null;
    }
    
    // ═══════════════════════════════════════════════
    // PASS 2: Heightfield Diagnostics
    // ═══════════════════════════════════════════════
    this.hfPP.read.bind(0);
    this.runPass(this.diagShader, this.diagTex, {
      u_hf: 0,
      u_res: [HR, HR],
      u_worldSize: cfg.hf.worldSize,
      u_stride: HR >= 1024 ? 2.0 : 1.0,
    });
    
    // ═══════════════════════════════════════════════
    // PASS 15: Foam Advect + Generation
    // ═══════════════════════════════════════════════
    this.foamPP.read.bind(0);
    this.hfPP.read.bind(1);
    this.diagTex.bind(2);
    this.runPass(this.foamShader, this.foamPP.write, {
      u_foam: 0,
      u_hf: 1,
      u_diag: 2,
      u_res: [HR, HR],
      u_worldSize: cfg.hf.worldSize,
      u_dt: dt,
      u_decay: cfg.foam.decay,
    });
    this.foamPP.swap();
    
    // Autonomous wave generation
    if (this.autoWavesEnabled) {
      this.autoWaveTimer += dt;
      if (this.autoWaveTimer >= this.autoWaveInterval) {
        this.autoWaveTimer -= this.autoWaveInterval;
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.3 + Math.random() * 0.5;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const sign = Math.random() > 0.5 ? 1 : -1;
        this.addDrop(x, z, 0.015 + Math.random() * 0.025, sign * (0.005 + Math.random() * 0.01));
      }
    }
    
    this.time += dt;
    this.frameCount++;
  }
  
  /**
   * Render the complete ocean scene
   */
  render() {
    const gl = this.gl;
    const cfg = this.config;
    
    gl.enable(gl.DEPTH_TEST);
    
    // ═══════════════════════════════════════════════
    // Render sky dome
    // ═══════════════════════════════════════════════
    gl.depthMask(false);
    this.skyShader.uniforms({
      u_sunDir: this.sunDir,
      u_sunColor: cfg.render.sunColor,
    }).draw(this.skyMesh);
    gl.depthMask(true);
    
    // ═══════════════════════════════════════════════
    // Render ocean surface
    // ═══════════════════════════════════════════════
    this.hfPP.read.bind(0);
    this.diagTex.bind(1);
    this.foamPP.read.bind(2);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    this.oceanShader.uniforms({
      u_hf: 0,
      u_diag: 1,
      u_foam: 2,
      u_oceanScale: cfg.hf.worldSize,
      u_hfRes: [cfg.hf.resolution, cfg.hf.resolution],
      u_cameraPos: this.cameraPos,
      u_time: this.time,
      u_sunDir: this.sunDir,
      u_sunColor: cfg.render.sunColor,
      u_deepColor: cfg.render.deepColor,
      u_shallowColor: cfg.render.shallowColor,
      u_foamThresh: cfg.render.foamThresh,
      u_foamIntensity: cfg.render.foamIntensity,
      u_specPow: cfg.render.specularPower,
      u_envRefl: cfg.render.envReflection,
    }).draw(this.oceanMesh);
    
    gl.disable(gl.CULL_FACE);
    
    // ═══════════════════════════════════════════════
    // Render interactive sphere (with water line clipping)
    // ═══════════════════════════════════════════════
    this.hfPP.read.bind(0);
    this.sphereShader.uniforms({
      u_sphereCenter: this.sphereCenter,
      u_sphereRadius: this.sphereRadius,
      u_sunDir: this.sunDir,
      u_sunColor: cfg.render.sunColor,
      u_hf: 0,
      u_oceanScale: cfg.hf.worldSize,
    }).draw(this.sphereMesh);
    
    // ═══════════════════════════════════════════════
    // Debug overlay (if enabled)
    // ═══════════════════════════════════════════════
    if (this.debugMode >= 0) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      
      const debugTex = this.debugMode === 3 ? this.foamPP.read : 
                        this.debugMode === 0 ? this.hfPP.read : this.diagTex;
      debugTex.bind(0);
      this.debugShader.uniforms({
        u_tex: 0,
        u_mode: this.debugMode,
      }).draw(this.fsQuad);
      
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    
    gl.disable(gl.DEPTH_TEST);
  }
  
  /**
   * Set debug visualization mode
   * -1=off, 0=height, 1=steepness, 2=jacobian, 3=foam
   */
  setDebugMode(mode: number) {
    this.debugMode = mode;
  }
  
  /**
   * Get the heightfield texture for external use (e.g., caustics)
   */
  getHeightfieldTexture(): Texture {
    return this.hfPP.read;
  }
  
  /**
   * Get diagnostics texture
   */
  getDiagnosticsTexture(): Texture {
    return this.diagTex;
  }
  
  /**
   * Get foam texture
   */
  getFoamTexture(): Texture {
    return this.foamPP.read;
  }
  
  /**
   * Sample height at a world position (approximate, CPU-side)
   * Note: This is only for camera/sphere logic, NOT for GPU passes
   */
  getApproxHeight(_worldX: number, _worldZ: number): number {
    // In a full implementation, we'd readback a small region
    // For now, return 0 (sea level)
    return 0;
  }
  
  /**
   * Set sun direction
   */
  setSunDirection(dir: Vector) {
    this.sunDir = dir.unit();
  }
  
  /**
   * Reset simulation
   */
  reset() {
    this.clearTexture(this.hfPP.a, 0, 0, 0, 0);
    this.clearTexture(this.hfPP.b, 0, 0, 0, 0);
    this.clearTexture(this.diagTex, 0, 0, 0, 0);
    this.clearTexture(this.foamPP.a, 0, 0, 0, 0);
    this.clearTexture(this.foamPP.b, 0, 0, 0, 0);
    this.pendingImpulse = null;
    this.time = 0;
    this.frameCount = 0;
  }
  
  /**
   * Dispose all GPU resources
   */
  dispose() {
    // Textures will be garbage collected with GL context
    console.log('OPUS Engine disposed');
  }
}

export default OpusEngine;
