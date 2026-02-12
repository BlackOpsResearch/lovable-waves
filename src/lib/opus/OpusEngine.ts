/**
 * OPUS Water Engine — Core Engine
 * Full SWE + Sheet + Hull + Spray + Gerstner pipeline
 * 
 * Reference: docs/OPUS_ORCHESTRATION.md
 * 17-pass GPU pipeline with CPU spray particles.
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Mesh } from '../webgl/Mesh';
import { Vector } from '../webgl/Vector';
import { Raytracer } from '../webgl/Raytracer';
import { OpusConfig, DEFAULT_OPUS_CONFIG } from './OpusConfig';
import { computeJONSWAPHeight } from './shaders/jonswapSpectrum';
import { SpraySystem } from './SpraySystem';
import {
  FULLSCREEN_VERT,
  SWE_UPDATE_FRAG,
  DIAGNOSTICS_FRAG,
  OCEAN_SURFACE_VERT,
  OCEAN_SURFACE_FRAG,
  CLEAR_FRAG,
  DEBUG_VIS_FRAG,
  SKY_VERT,
  SKY_FRAG,
  SPHERE_VERT,
  SPHERE_FRAG,
} from './shaders/opusShaders';
import {
  SHEET_UPDATE_FRAG,
  HULL_CONTACT_FRAG,
  HULL_FEEDBACK_FRAG,
  ENHANCED_FOAM_FRAG,
  SPRAY_VERT,
  SPRAY_FRAG,
} from './shaders/sheetShaders';

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
  hfPP: PingPong;      // Heightfield (RGBA: η, ∂η/∂t, u, v)
  diagTex: Texture;     // Diagnostics (steepness, curvature, jacobian, etaRate)
  foamPP: PingPong;     // Foam density
  sheetPP: PingPong;    // Sheet topology (seamState, thickness, viscosity, pressure)
  hullPP: PingPong;     // Hull displacement field (displacement, wake, bow, spray_src)
  
  // Shaders
  sweShader: Shader;
  diagShader: Shader;
  foamShader: Shader;
  clearShader: Shader;
  oceanShader: Shader;
  debugShader: Shader;
  skyShader: Shader;
  sphereShader: Shader;
  sheetShader: Shader;
  hullShader: Shader;
  hullFeedbackShader: Shader;
  
  // Spray system
  spraySystem: SpraySystem;
  sprayShader: Shader | null = null;
  sprayPosBuf: WebGLBuffer | null = null;
  sprayVelBuf: WebGLBuffer | null = null;
  sprayLifeBuf: WebGLBuffer | null = null;
  spraySizeBuf: WebGLBuffer | null = null;
  
  // Meshes
  fsQuad: Mesh;
  oceanMesh: Mesh;
  skyMesh: Mesh;
  sphereMesh: Mesh;
  
  // State
  time: number = 0;
  frameCount: number = 0;
  pendingImpulse: PendingImpulse | null = null;
  sunDir: Vector;
  cameraPos: Vector = new Vector(0, 5, 15);
  debugMode: number = -1;
  
  // Autonomous wave generation
  autoWavesEnabled: boolean = true;
  autoWaveTimer: number = 0;
  autoWaveInterval: number = 0.8;
  
  // Feature toggles
  sheetEnabled: boolean = true;
  hullEnabled: boolean = true;
  sprayEnabled: boolean = true;
  gerstnerEnabled: boolean = true;
  gerstnerAmplitude: number = 0.3;
  gerstnerSteepness: number = 0.4;
  windDirection: number = 45;
  windSpeed: number = 8.0;     // m/s — drives JONSWAP spectrum
  fetch: number = 100000.0;    // meters — wave development distance
  
  // Atmosphere parameters
  turbidity: number = 2.0;
  rayleighScale: number = 1.0;
  mieCoeff: number = 0.005;
  mieG: number = 0.8;
  sunIntensity: number = 22.0;
  sunElevation: number = 0.785; // radians (~45°)
  
  // Sphere
  sphereCenter: Vector = new Vector(0, 0.5, 0);
  sphereRadius: number = 1.5;
  sphereVelocity: Vector = new Vector();
  
  constructor(gl: GLContextExtended, config: OpusConfig = DEFAULT_OPUS_CONFIG) {
    this.gl = gl;
    this.config = config;
    
    const sd = config.render.sunDir;
    this.sunDir = new Vector(sd[0], sd[1], sd[2]).unit();
    
    const HR = config.hf.resolution;
    const SR = config.sheet.resolution;
    
    // Create simulation textures
    this.hfPP = this.createPingPong(HR, HR);
    this.diagTex = this.createSimTexture(HR, HR);
    this.foamPP = this.createPingPong(HR, HR);
    this.sheetPP = this.createPingPong(SR, SR);
    this.hullPP = this.createPingPong(HR, HR);
    
    // Create meshes
    this.fsQuad = Mesh.plane(gl);
    this.oceanMesh = Mesh.plane(gl, { detail: config.render.meshSegments });
    this.skyMesh = Mesh.sphere(gl, { detail: 32 });
    this.sphereMesh = Mesh.sphere(gl, { detail: 12 });
    
    // Compile core shaders
    this.sweShader = new Shader(gl, FULLSCREEN_VERT, SWE_UPDATE_FRAG);
    this.diagShader = new Shader(gl, FULLSCREEN_VERT, DIAGNOSTICS_FRAG);
    this.clearShader = new Shader(gl, FULLSCREEN_VERT, CLEAR_FRAG);
    this.oceanShader = new Shader(gl, OCEAN_SURFACE_VERT, OCEAN_SURFACE_FRAG);
    this.debugShader = new Shader(gl, FULLSCREEN_VERT, DEBUG_VIS_FRAG);
    this.skyShader = new Shader(gl, SKY_VERT, SKY_FRAG);
    this.sphereShader = new Shader(gl, SPHERE_VERT, SPHERE_FRAG);
    
    // Compile new system shaders
    this.sheetShader = new Shader(gl, FULLSCREEN_VERT, SHEET_UPDATE_FRAG);
    this.hullShader = new Shader(gl, FULLSCREEN_VERT, HULL_CONTACT_FRAG);
    this.hullFeedbackShader = new Shader(gl, FULLSCREEN_VERT, HULL_FEEDBACK_FRAG);
    this.foamShader = new Shader(gl, FULLSCREEN_VERT, ENHANCED_FOAM_FRAG);
    
    // Initialize spray system
    this.spraySystem = new SpraySystem({
      maxParticles: config.spray.max,
      gravity: config.spray.gravity,
      drag: config.spray.drag,
      minVY: config.spray.minVY,
      lifetime: config.spray.lifetime,
    });
    this.initSprayBuffers();
    
    // Initialize textures to zero
    this.clearAllTextures();
    
    // Initialize sheet with thickness = 1
    this.clearTexture(this.sheetPP.a, 0, 1, 0, 0);
    this.clearTexture(this.sheetPP.b, 0, 1, 0, 0);
    
    console.log(`OPUS Engine initialized: HF=${HR}², Sheet=${SR}², Spray=${config.spray.max}, Gerstner=ON`);
  }
  
  private initSprayBuffers() {
    const gl = this.gl;
    
    try {
      this.sprayShader = new Shader(gl, SPRAY_VERT, SPRAY_FRAG);
    } catch (e) {
      console.warn('Spray shader failed (point sprites may not be supported):', e);
      this.sprayEnabled = false;
      return;
    }
    
    this.sprayPosBuf = gl.createBuffer();
    this.sprayVelBuf = gl.createBuffer();
    this.sprayLifeBuf = gl.createBuffer();
    this.spraySizeBuf = gl.createBuffer();
  }
  
  private createSimTexture(w: number, h: number): Texture {
    const gl = this.gl;
    const useFloat = Texture.canUseFloatingPointTextures(gl);
    
    if (gl.isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      // Try RGBA32F first
      try {
        const filter = gl.hasFloatLinear ? gl.LINEAR : gl.NEAREST;
        const tex = new Texture(gl, w, h, { 
          type: gl.FLOAT, 
          format: gl.RGBA, 
          internalFormat: gl2.RGBA32F, 
          filter 
        });
        if (tex.canDrawTo()) return tex;
      } catch (e) { /* fall through */ }
      
      // Try RGBA16F
      try {
        const tex = new Texture(gl, w, h, { 
          type: gl2.HALF_FLOAT, 
          format: gl.RGBA, 
          internalFormat: gl2.RGBA16F, 
          filter: gl.LINEAR 
        });
        if (tex.canDrawTo()) return tex;
      } catch (e) { /* fall through */ }
    }
    
    // WebGL1 fallback
    const type = useFloat ? gl.FLOAT : gl.HALF_FLOAT_OES;
    const filter = (useFloat && Texture.canUseFloatingPointLinearFiltering(gl)) ? gl.LINEAR : gl.NEAREST;
    
    const tex = new Texture(gl, w, h, { type, filter });
    if (!tex.canDrawTo()) {
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
  
  private clearAllTextures() {
    this.clearTexture(this.hfPP.a, 0, 0, 0, 0);
    this.clearTexture(this.hfPP.b, 0, 0, 0, 0);
    this.clearTexture(this.diagTex, 0, 0, 0, 0);
    this.clearTexture(this.foamPP.a, 0, 0, 0, 0);
    this.clearTexture(this.foamPP.b, 0, 0, 0, 0);
    this.clearTexture(this.hullPP.a, 0, 0, 0, 0);
    this.clearTexture(this.hullPP.b, 0, 0, 0, 0);
  }
  
  private runPass(shader: Shader, target: Texture, uniforms: Record<string, unknown>) {
    const self = this;
    target.drawTo(() => {
      shader.uniforms(uniforms).draw(self.fsQuad);
    });
  }
  
  addImpulse(x: number, z: number, radius: number = 5, strength: number = 50) {
    this.pendingImpulse = { cx: x, cz: z, radius, strength };
  }
  
  addDrop(x: number, z: number, radius: number = 0.03, strength: number = 0.01) {
    const worldX = x * this.config.hf.worldSize * 0.5;
    const worldZ = z * this.config.hf.worldSize * 0.5;
    const worldRadius = radius * this.config.hf.worldSize;
    const worldStrength = strength * 500;
    this.addImpulse(worldX, worldZ, worldRadius, worldStrength);
  }
  
  moveSphere(oldCenter: Vector, newCenter: Vector, radius: number) {
    this.sphereVelocity = newCenter.subtract(oldCenter);
    this.sphereCenter = newCenter;
    this.sphereRadius = radius;
    
    const speed = this.sphereVelocity.length();
    if (speed > 0.001) {
      // Hull displacement creates wake, no more simple impulse
      if (!this.hullEnabled) {
        this.addImpulse(newCenter.x, newCenter.z, radius * 3, speed * 200 * radius);
      }
      
      // Emit spray from hull contact
      if (this.sprayEnabled && speed > 0.1) {
        this.spraySystem.emitFromHull(
          newCenter.x, newCenter.y, newCenter.z,
          this.sphereVelocity.x, this.sphereVelocity.z,
          radius, speed * 30
        );
      }
    }
  }
  
  private computeSubSteps(dt: number): number {
    const dx = this.config.hf.worldSize / this.config.hf.resolution;
    const c = Math.sqrt(this.config.hf.gravity * this.config.hf.depth);
    const dtMax = (dx / (2 * c)) * 0.9;
    return Math.max(1, Math.ceil(dt / dtMax));
  }
  
  /**
   * Step the full simulation pipeline
   */
  step(dt: number) {
    if (dt > 0.033) dt = 0.033;
    if (dt < 0.001) dt = 0.001;
    
    const cfg = this.config;
    const HR = cfg.hf.resolution;
    const SR = cfg.sheet.resolution;
    
    // ═══════════════════════════════════════════════
    // PASS 1: SWE Heightfield Update (sub-stepped)
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
    // PASS 2: Diagnostics
    // ═══════════════════════════════════════════════
    this.hfPP.read.bind(0);
    this.runPass(this.diagShader, this.diagTex, {
      u_hf: 0,
      u_res: [HR, HR],
      u_worldSize: cfg.hf.worldSize,
      u_stride: HR >= 1024 ? 2.0 : 1.0,
    });
    
    // ═══════════════════════════════════════════════
    // PASS 3-4: Sheet Topology Update
    // ═══════════════════════════════════════════════
    if (this.sheetEnabled) {
      this.sheetPP.read.bind(0);
      this.hfPP.read.bind(1);
      this.diagTex.bind(2);
      this.runPass(this.sheetShader, this.sheetPP.write, {
        u_sheet: 0,
        u_hf: 1,
        u_diag: 2,
        u_res: [SR, SR],
        u_worldSize: cfg.sheet.worldSize,
        u_dt: dt,
        u_breakRate: cfg.sheet.breakRate,
        u_healRate: cfg.sheet.healRate,
        u_waveStrainThresh: cfg.sheet.waveStrainThresh,
        u_waveBreakRate: cfg.sheet.waveBreakRate,
        u_viscosity: cfg.sheet.viscosity,
        u_damping: cfg.sheet.damping,
        u_hfCoupling: cfg.sheet.hfCoupling,
        u_minThick: cfg.sheet.minThick,
        u_maxThick: cfg.sheet.maxThick,
        u_redistRate: cfg.sheet.redistRate,
      });
      this.sheetPP.swap();
    }
    
    // ═══════════════════════════════════════════════
    // PASS 5: Hull Contact
    // ═══════════════════════════════════════════════
    if (this.hullEnabled) {
      this.hullPP.read.bind(0);
      this.hfPP.read.bind(1);
      
      this.runPass(this.hullShader, this.hullPP.write, {
        u_hull: 0,
        u_hf: 1,
        u_res: [HR, HR],
        u_worldSize: cfg.hf.worldSize,
        u_dt: dt,
        u_sphereCenter: this.sphereCenter,
        u_sphereRadius: this.sphereRadius,
        u_sphereVel: this.sphereVelocity,
        u_hullStiffness: cfg.sheet.hullStiffness,
        u_barrierStiffness: cfg.sheet.barrierStiffness,
        u_slapDamping: cfg.sheet.slapDamping,
      });
      this.hullPP.swap();
      
      // PASS 6: Hull → HF Feedback
      this.hfPP.read.bind(0);
      this.hullPP.read.bind(1);
      this.runPass(this.hullFeedbackShader, this.hfPP.write, {
        u_hf: 0,
        u_hull: 1,
        u_res: [HR, HR],
        u_dt: dt,
        u_feedbackStrength: 0.5,
      });
      this.hfPP.swap();
    }
    
    // ═══════════════════════════════════════════════
    // PASS 15: Enhanced Foam (with sheet + hull sources)
    // ═══════════════════════════════════════════════
    this.foamPP.read.bind(0);
    this.hfPP.read.bind(1);
    this.diagTex.bind(2);
    this.sheetPP.read.bind(3);
    this.hullPP.read.bind(4);
    this.runPass(this.foamShader, this.foamPP.write, {
      u_foam: 0,
      u_hf: 1,
      u_diag: 2,
      u_sheet: 3,
      u_hull: 4,
      u_res: [HR, HR],
      u_worldSize: cfg.hf.worldSize,
      u_dt: dt,
      u_decay: cfg.foam.decay,
      u_edgeGen: cfg.foam.edgeGen,
    });
    this.foamPP.swap();
    
    // ═══════════════════════════════════════════════
    // CPU: Spray particle update
    // ═══════════════════════════════════════════════
    if (this.sprayEnabled) {
      // Emit spray from autonomous wave breaking
      if (this.autoWavesEnabled && Math.random() < 0.05) {
        const x = (Math.random() - 0.5) * this.config.hf.worldSize * 0.6;
        const z = (Math.random() - 0.5) * this.config.hf.worldSize * 0.6;
        this.spraySystem.emitFromBreaking(x, z, 0.5 + Math.random() * 0.3);
      }
      this.spraySystem.update(dt);
    }
    
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
    // Sky dome
    // ═══════════════════════════════════════════════
    gl.depthMask(false);
    this.skyShader.uniforms({
      u_sunDir: this.sunDir,
      u_sunColor: cfg.render.sunColor,
      u_sunIntensity: this.sunIntensity,
      u_turbidity: this.turbidity,
      u_rayleighScale: this.rayleighScale,
      u_mieCoeff: this.mieCoeff,
      u_mieG: this.mieG,
      u_sunElevation: this.sunElevation,
    }).draw(this.skyMesh);
    gl.depthMask(true);
    
    // ═══════════════════════════════════════════════
    // Ocean surface (with Gerstner blend)
    // ═══════════════════════════════════════════════
    this.hfPP.read.bind(0);
    this.diagTex.bind(1);
    this.foamPP.read.bind(2);
    this.hullPP.read.bind(3);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    this.oceanShader.uniforms({
      u_hf: 0,
      u_diag: 1,
      u_foam: 2,
      u_hull: 3,
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
      u_gerstnerAmp: this.gerstnerEnabled ? this.gerstnerAmplitude : 0,
      u_gerstnerSteep: this.gerstnerSteepness,
      u_windDir: this.windDirection,
      u_windSpeed: this.windSpeed,
      u_fetch: this.fetch,
      u_turbidity: this.turbidity,
      u_rayleighScale: this.rayleighScale,
      u_sunIntensity: this.sunIntensity,
    }).draw(this.oceanMesh);
    
    gl.disable(gl.CULL_FACE);
    
    // ═══════════════════════════════════════════════
    // Interactive sphere
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
    // Spray particles
    // ═══════════════════════════════════════════════
    if (this.sprayEnabled && this.sprayShader && this.spraySystem.activeCount > 0) {
      this.renderSpray();
    }
    
    // ═══════════════════════════════════════════════
    // Debug overlay
    // ═══════════════════════════════════════════════
    if (this.debugMode >= 0) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      
      const debugTex = this.debugMode === 3 ? this.foamPP.read : 
                        this.debugMode === 0 ? this.hfPP.read :
                        this.debugMode === 4 ? this.sheetPP.read :
                        this.debugMode === 5 ? this.hullPP.read : this.diagTex;
      debugTex.bind(0);
      this.debugShader.uniforms({
        u_tex: 0,
        u_mode: Math.min(this.debugMode, 4),
      }).draw(this.fsQuad);
      
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    
    gl.disable(gl.DEPTH_TEST);
  }
  
  private renderSpray() {
    const gl = this.gl;
    const spray = this.spraySystem;
    const shader = this.sprayShader!;
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    
    gl.useProgram(shader.program);
    
    // Upload position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sprayPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, spray.positionData.subarray(0, spray.activeCount * 3), gl.DYNAMIC_DRAW);
    const posLoc = gl.getAttribLocation(shader.program, 'a_position');
    if (posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Upload velocity buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sprayVelBuf);
    gl.bufferData(gl.ARRAY_BUFFER, spray.velocityData.subarray(0, spray.activeCount * 3), gl.DYNAMIC_DRAW);
    const velLoc = gl.getAttribLocation(shader.program, 'a_velocity');
    if (velLoc >= 0) {
      gl.enableVertexAttribArray(velLoc);
      gl.vertexAttribPointer(velLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Upload life buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sprayLifeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, spray.lifeData.subarray(0, spray.activeCount), gl.DYNAMIC_DRAW);
    const lifeLoc = gl.getAttribLocation(shader.program, 'a_life');
    if (lifeLoc >= 0) {
      gl.enableVertexAttribArray(lifeLoc);
      gl.vertexAttribPointer(lifeLoc, 1, gl.FLOAT, false, 0, 0);
    }
    
    // Upload size buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spraySizeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, spray.sizeData.subarray(0, spray.activeCount), gl.DYNAMIC_DRAW);
    const sizeLoc = gl.getAttribLocation(shader.program, 'a_size');
    if (sizeLoc >= 0) {
      gl.enableVertexAttribArray(sizeLoc);
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
    }
    
    // Set uniforms using the shader wrapper's matrix system
    shader.uniforms({
      u_pointScale: 50.0,
      u_cameraPos: this.cameraPos,
      u_sunDir: this.sunDir,
      u_sunColor: this.config.render.sunColor,
    });
    
    // We need to set modelview/projection matrices
    // The shader.uniforms call above handles matrix upload through the wrapper
    gl.drawArrays(gl.POINTS, 0, spray.activeCount);
    
    // Cleanup
    if (posLoc >= 0) gl.disableVertexAttribArray(posLoc);
    if (velLoc >= 0) gl.disableVertexAttribArray(velLoc);
    if (lifeLoc >= 0) gl.disableVertexAttribArray(lifeLoc);
    if (sizeLoc >= 0) gl.disableVertexAttribArray(sizeLoc);
    
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  
  setDebugMode(mode: number) { this.debugMode = mode; }
  getHeightfieldTexture(): Texture { return this.hfPP.read; }
  getDiagnosticsTexture(): Texture { return this.diagTex; }
  getFoamTexture(): Texture { return this.foamPP.read; }
  getSheetTexture(): Texture { return this.sheetPP.read; }
  getHullTexture(): Texture { return this.hullPP.read; }
  
  /**
   * GPU readback: read heightfield value at a world position
   * Returns the water surface height (η) at the given XZ coordinate
   */
  readHeightAt(worldX: number, worldZ: number): number {
    const gl = this.gl;
    const cfg = this.config;
    const HR = cfg.hf.resolution;
    
    // Convert world coords to UV
    const u = (worldX / cfg.hf.worldSize) + 0.5;
    const v = (worldZ / cfg.hf.worldSize) + 0.5;
    
    // Clamp to valid range
    const px = Math.max(0, Math.min(HR - 1, Math.floor(u * HR)));
    const py = Math.max(0, Math.min(HR - 1, Math.floor(v * HR)));
    
    // Read single pixel from heightfield texture
    const pixels = new Float32Array(4);
    this.hfPP.read.drawTo(() => {
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.FLOAT, pixels);
    });
    
    return pixels[0]; // η value
  }
  
  /**
   * Get combined height including Gerstner contribution at a world position
   */
  getHeightAt(worldX: number, worldZ: number): number {
    let h = this.readHeightAt(worldX, worldZ);
    
    // Add JONSWAP-driven Gerstner contribution
    if (this.gerstnerEnabled && this.gerstnerAmplitude > 0.001) {
      h += computeJONSWAPHeight(
        worldX, worldZ, this.time,
        this.windSpeed, this.windDirection, this.fetch,
        this.gerstnerAmplitude
      );
    }
    
    return h;
  }
  
  getApproxHeight(_worldX: number, _worldZ: number): number { return this.getHeightAt(_worldX, _worldZ); }
  
  setSunDirection(dir: Vector) { this.sunDir = dir.unit(); }
  
  reset() {
    this.clearAllTextures();
    this.clearTexture(this.sheetPP.a, 0, 1, 0, 0);
    this.clearTexture(this.sheetPP.b, 0, 1, 0, 0);
    this.pendingImpulse = null;
    this.time = 0;
    this.frameCount = 0;
  }
  
  dispose() {
    console.log('OPUS Engine disposed');
  }
}

export default OpusEngine;
