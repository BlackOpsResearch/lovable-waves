/**
 * Enhanced Ocean Simulation Engine
 * GPU-accelerated ocean waves with wind, caustics, and sphere interaction
 * Ported from GPT Waves V7
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Mesh } from '../webgl/Mesh';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Vector } from '../webgl/Vector';
import { generate3DNoiseTexture } from './noise/ImprovedNoise';
import {
  SIMULATION_VERTEX,
  DROP_FRAGMENT,
  IMPULSE_FRAGMENT,
  UPDATE_FRAGMENT,
  NORMAL_FRAGMENT,
  SPHERE_FRAGMENT,
  WIND_WAVES_FRAGMENT
} from './shaders/simulationShaders';

export interface OceanSimulationSettings {
  resolution: number;
  damping: number;
  waveSpeed: number;
  windDirection: [number, number];
  windStrength: number;
  waveScale: number;
  enableWindWaves: boolean;
}

const DEFAULT_SETTINGS: OceanSimulationSettings = {
  resolution: 256,
  damping: 0.997,
  waveSpeed: 0.5,
  windDirection: [1.0, 0.3],
  windStrength: 0.15,
  waveScale: 3.0,
  enableWindWaves: true
};

export class OceanSimulation {
  gl: GLContextExtended;
  plane: Mesh;
  textureA: Texture;
  textureB: Texture;
  settings: OceanSimulationSettings;
  
  // Simulation shaders
  dropShader: Shader;
  impulseShader: Shader;
  updateShader: Shader;
  normalShader: Shader;
  sphereShader: Shader;
  windShader: Shader | null = null;
  
  // Cloud noise texture (2D packed for WebGL1 compatibility)
  noiseTexture: Texture | null = null;
  
  // Animation
  time: number = 0;
  
  constructor(gl: GLContextExtended, settings: Partial<OceanSimulationSettings> = {}) {
    this.gl = gl;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    const resolution = this.settings.resolution;
    
    this.plane = Mesh.plane(gl);
    
    if (!Texture.canUseFloatingPointTextures(gl)) {
      throw new Error('This simulation requires the OES_texture_float extension');
    }
    
    let filter = Texture.canUseFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
    this.textureA = new Texture(gl, resolution, resolution, { type: gl.FLOAT, filter });
    this.textureB = new Texture(gl, resolution, resolution, { type: gl.FLOAT, filter });
    
    // Fallback to half float if full float doesn't work
    if ((!this.textureA.canDrawTo() || !this.textureB.canDrawTo()) && 
        Texture.canUseHalfFloatingPointTextures(gl)) {
      filter = Texture.canUseHalfFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
      this.textureA = new Texture(gl, resolution, resolution, { type: gl.HALF_FLOAT_OES, filter });
      this.textureB = new Texture(gl, resolution, resolution, { type: gl.HALF_FLOAT_OES, filter });
    }
    
    // Create simulation shaders
    this.dropShader = new Shader(gl, SIMULATION_VERTEX, DROP_FRAGMENT);
    this.impulseShader = new Shader(gl, SIMULATION_VERTEX, IMPULSE_FRAGMENT);
    this.updateShader = new Shader(gl, SIMULATION_VERTEX, UPDATE_FRAGMENT);
    this.normalShader = new Shader(gl, SIMULATION_VERTEX, NORMAL_FRAGMENT);
    this.sphereShader = new Shader(gl, SIMULATION_VERTEX, SPHERE_FRAGMENT);
    
    // Wind waves shader (optional)
    if (this.settings.enableWindWaves) {
      try {
        this.windShader = new Shader(gl, SIMULATION_VERTEX, WIND_WAVES_FRAGMENT);
      } catch (e) {
        console.warn('Wind waves shader failed to compile, disabling:', e);
        this.windShader = null;
      }
    }
    
    // Generate noise texture for clouds
    this.generateNoiseTexture();
  }
  
  private generateNoiseTexture() {
    const data = generate3DNoiseTexture(64, Date.now(), 5, 0.5, 2.0, 3.5);
    
    // Pack 3D noise into 2D atlas (8x8 slices of 64x64)
    const atlasSize = 512; // 8 * 64
    const slices = 64;
    const slicesPerRow = 8;
    
    const atlasData = new Float32Array(atlasSize * atlasSize * 4);
    
    for (let z = 0; z < slices; z++) {
      const sliceRow = Math.floor(z / slicesPerRow);
      const sliceCol = z % slicesPerRow;
      const baseX = sliceCol * 64;
      const baseY = sliceRow * 64;
      
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const srcIdx = x + y * 64 + z * 64 * 64;
          const dstIdx = ((baseY + y) * atlasSize + (baseX + x)) * 4;
          const value = data[srcIdx];
          atlasData[dstIdx] = value;
          atlasData[dstIdx + 1] = value;
          atlasData[dstIdx + 2] = value;
          atlasData[dstIdx + 3] = 1.0;
        }
      }
    }
    
    this.noiseTexture = Texture.fromFloatArray(this.gl, atlasData, atlasSize, atlasSize);
  }
  
  addDrop(x: number, y: number, radius: number, strength: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.dropShader.uniforms({
        texture: 0,
        center: [x, y],
        radius,
        strength
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
  
  addImpulse(x: number, y: number, radius: number, strength: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.impulseShader.uniforms({
        texture: 0,
        center: [x, y],
        radius,
        strength
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
  
  moveSphere(oldCenter: Vector, newCenter: Vector, radius: number, displacementScale: number = 1.0) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.sphereShader.uniforms({
        texture: 0,
        oldCenter,
        newCenter,
        radius,
        displacementScale
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
  
  stepSimulation() {
    const self = this;
    const delta = [1 / this.textureA.width, 1 / this.textureA.height];
    
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.updateShader.uniforms({
        texture: 0,
        delta,
        damping: self.settings.damping,
        waveSpeed: self.settings.waveSpeed
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
  
  applyWindWaves(deltaTime: number) {
    if (!this.windShader) return;
    
    const self = this;
    const windDir = this.settings.windDirection;
    const len = Math.sqrt(windDir[0] * windDir[0] + windDir[1] * windDir[1]);
    const normalizedWind = len > 0 ? [windDir[0] / len, windDir[1] / len] : [1, 0];
    
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.windShader!.uniforms({
        texture: 0,
        time: self.time,
        windDir: normalizedWind,
        windStrength: self.settings.windStrength * deltaTime,
        waveScale: self.settings.waveScale
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
  
  updateNormals() {
    const self = this;
    const delta = [1 / this.textureA.width, 1 / this.textureA.height];
    
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.normalShader.uniforms({
        texture: 0,
        delta
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
  
  update(deltaTime: number) {
    this.time += deltaTime;
    
    // Apply wind-driven waves periodically
    if (this.settings.enableWindWaves && this.windShader) {
      this.applyWindWaves(deltaTime);
    }
    
    this.stepSimulation();
    this.updateNormals();
  }
  
  getTexture(): Texture {
    return this.textureA;
  }
  
  getNoiseTexture(): Texture | null {
    return this.noiseTexture;
  }
  
  getTime(): number {
    return this.time;
  }
  
  setWindDirection(x: number, z: number) {
    this.settings.windDirection = [x, z];
  }
  
  setWindStrength(strength: number) {
    this.settings.windStrength = strength;
  }
  
  setDamping(damping: number) {
    this.settings.damping = damping;
  }
}
