/**
 * Water simulation with GPU-based physics
 * Extended with configurable parameters and animated wave hybrid system
 * Ported from Evan Wallace's webgl-water
 */
import { GLContextExtended } from './GLContext';
import { Mesh } from './Mesh';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { Vector } from './Vector';

export interface WaterSettings {
  waveSpeed: number;      // 0.5 - 3.0
  damping: number;        // 0.9 - 0.999
  dropRadius: number;     // 0.01 - 0.1
  dropStrength: number;   // 0.005 - 0.05
  // Animated wave settings (for hybrid system)
  animatedWaveEnabled: boolean;
  animatedWaveAmplitude: number;
  animatedWaveFrequency: number;
  animatedWaveSpeed: number;
  nearFieldRadius: number;  // Distance from camera where simulated waves dominate
}

export const DEFAULT_WATER_SETTINGS: WaterSettings = {
  waveSpeed: 2.0,
  damping: 0.995,
  dropRadius: 0.03,
  dropStrength: 0.01,
  animatedWaveEnabled: true,
  animatedWaveAmplitude: 0.015,
  animatedWaveFrequency: 2.0,
  animatedWaveSpeed: 1.0,
  nearFieldRadius: 0.5, // Simulated waves dominate within 0.5 units of interaction point
};

export class Water {
  gl: GLContextExtended;
  plane: Mesh;
  textureA: Texture;
  textureB: Texture;
  dropShader: Shader;
  updateShader: Shader;
  normalShader: Shader;
  sphereShader: Shader;
  animatedWaveShader: Shader;
  settings: WaterSettings;

  constructor(gl: GLContextExtended, settings?: Partial<WaterSettings>) {
    this.gl = gl;
    this.settings = { ...DEFAULT_WATER_SETTINGS, ...settings };

    const vertexShader = `
      varying vec2 coord;
      void main() {
        coord = gl_Vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(gl_Vertex.xyz, 1.0);
      }
    `;

    this.plane = Mesh.plane(gl);

    if (!Texture.canUseFloatingPointTextures(gl)) {
      throw new Error('This demo requires the OES_texture_float extension');
    }

    let filter = Texture.canUseFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
    this.textureA = new Texture(gl, 256, 256, { type: gl.FLOAT, filter });
    this.textureB = new Texture(gl, 256, 256, { type: gl.FLOAT, filter });

    if ((!this.textureA.canDrawTo() || !this.textureB.canDrawTo()) && Texture.canUseHalfFloatingPointTextures(gl)) {
      filter = Texture.canUseHalfFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
      this.textureA = new Texture(gl, 256, 256, { type: gl.HALF_FLOAT_OES, filter });
      this.textureB = new Texture(gl, 256, 256, { type: gl.HALF_FLOAT_OES, filter });
    }

    this.dropShader = new Shader(gl, vertexShader, `
      const float PI = 3.141592653589793;
      uniform sampler2D texture;
      uniform vec2 center;
      uniform float radius;
      uniform float strength;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
        drop = 0.5 - cos(drop * PI) * 0.5;
        info.r += drop * strength;
        gl_FragColor = info;
      }
    `);

    // Update shader with configurable wave speed and damping
    this.updateShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
      uniform float waveSpeed;
      uniform float damping;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec2 dx = vec2(delta.x, 0.0);
        vec2 dy = vec2(0.0, delta.y);
        float average = (
          texture2D(texture, coord - dx).r +
          texture2D(texture, coord - dy).r +
          texture2D(texture, coord + dx).r +
          texture2D(texture, coord + dy).r
        ) * 0.25;
        info.g += (average - info.r) * waveSpeed;
        info.g *= damping;
        info.r += info.g;
        gl_FragColor = info;
      }
    `);

    this.normalShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
        vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
        info.ba = normalize(cross(dy, dx)).xz;
        gl_FragColor = info;
      }
    `);

    this.sphereShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec3 oldCenter;
      uniform vec3 newCenter;
      uniform float radius;
      varying vec2 coord;
      
      float volumeInSphere(vec3 center) {
        vec3 toCenter = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0) - center;
        float t = length(toCenter) / radius;
        float dy = exp(-pow(t * 1.5, 6.0));
        float ymin = min(0.0, center.y - dy);
        float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
        return (ymax - ymin) * 0.1;
      }
      
      void main() {
        vec4 info = texture2D(texture, coord);
        info.r += volumeInSphere(oldCenter);
        info.r -= volumeInSphere(newCenter);
        gl_FragColor = info;
      }
    `);

    // Animated wave shader for hybrid LOD system
    // Adds procedural animated waves that blend with simulated waves
    this.animatedWaveShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform float time;
      uniform float amplitude;
      uniform float frequency;
      uniform float speed;
      uniform vec2 interactionCenter;
      uniform float nearFieldRadius;
      varying vec2 coord;
      
      // Gerstner-like animated wave function
      float animatedWave(vec2 pos, float t) {
        float wave = 0.0;
        
        // 8-frequency turbulence similar to Cosmic Ocean
        wave += sin(t * 0.3 * speed + pos.x * 0.5 * frequency) * cos(t * 0.25 * speed + pos.y * 0.5 * frequency) * 0.35;
        wave += sin(t * 0.5 * speed + pos.x * 1.2 * frequency) * cos(t * 0.4 * speed + pos.y * 0.8 * frequency) * 0.20;
        wave += sin(t * 0.8 * speed + pos.x * 2.0 * frequency) * cos(t * 0.6 * speed + pos.y * 1.8 * frequency) * 0.12;
        wave += sin(t * 0.7 * speed + pos.y * 1.5 * frequency) * cos(t * 0.55 * speed + pos.x * 0.5 * frequency) * 0.08;
        wave += sin(t * 1.0 * speed + pos.x * 3.0 * frequency) * cos(t * 0.9 * speed + pos.y * 2.5 * frequency) * 0.06;
        wave += sin(t * 1.3 * speed + pos.x * 4.5 * frequency) * cos(t * 1.1 * speed + pos.y * 4.0 * frequency) * 0.04;
        wave += sin(t * 1.6 * speed + pos.x * 6.0 * frequency + pos.y * 0.5) * 0.025;
        wave += sin(t * 2.0 * speed + pos.x * 8.0 * frequency) * cos(t * 1.8 * speed + pos.y * 7.0 * frequency) * 0.015;
        
        return wave * amplitude;
      }
      
      void main() {
        vec4 info = texture2D(texture, coord);
        
        // Get position in -1 to 1 range
        vec2 pos = coord * 2.0 - 1.0;
        
        // Calculate distance from interaction center
        float distFromInteraction = length(pos - interactionCenter);
        
        // Blend factor: 0 = full simulated (near), 1 = full animated (far)
        // Use smoothstep for smooth transition
        float blendFactor = smoothstep(nearFieldRadius * 0.5, nearFieldRadius * 2.0, distFromInteraction);
        
        // Calculate animated wave
        float animatedHeight = animatedWave(pos, time);
        
        // Blend: near interaction = simulated waves dominate
        // Far from interaction = animated waves dominate
        // The simulated info.r stays, we ADD animated wave scaled by blend
        info.r = mix(info.r, info.r + animatedHeight, blendFactor);
        
        gl_FragColor = info;
      }
    `);
  }

  updateSettings(settings: Partial<WaterSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  addDrop(x: number, y: number, radius?: number, strength?: number) {
    const self = this;
    const r = radius ?? this.settings.dropRadius;
    const s = strength ?? this.settings.dropStrength;
    
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.dropShader.uniforms({
        center: [x, y],
        radius: r,
        strength: s
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  moveSphere(oldCenter: Vector, newCenter: Vector, radius: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.sphereShader.uniforms({
        oldCenter,
        newCenter,
        radius
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  stepSimulation() {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.updateShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height],
        waveSpeed: self.settings.waveSpeed,
        damping: self.settings.damping
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  // Apply animated waves (for hybrid LOD system)
  applyAnimatedWaves(time: number, interactionCenter: Vector = new Vector(0, 0, 0)) {
    if (!this.settings.animatedWaveEnabled) return;
    
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.animatedWaveShader.uniforms({
        time,
        amplitude: self.settings.animatedWaveAmplitude,
        frequency: self.settings.animatedWaveFrequency,
        speed: self.settings.animatedWaveSpeed,
        interactionCenter: [interactionCenter.x, interactionCenter.z],
        nearFieldRadius: self.settings.nearFieldRadius
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  updateNormals() {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.normalShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height]
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
}
