/**
 * Ocean Simulation Engine
 * Manages GPU-accelerated ocean waves, caustics, and sphere interaction
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Mesh } from '../webgl/Mesh';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Vector } from '../webgl/Vector';
import { generate3DNoiseTexture } from './noise/ImprovedNoise';

export class OceanSimulation {
  gl: GLContextExtended;
  plane: Mesh;
  textureA: Texture;
  textureB: Texture;
  
  // Simulation shaders
  dropShader: Shader;
  updateShader: Shader;
  normalShader: Shader;
  sphereShader: Shader;
  
  // Cloud noise texture (2D packed for WebGL1 compatibility)
  noiseTexture: Texture | null = null;
  
  // Animation
  time: number = 0;
  
  constructor(gl: GLContextExtended, resolution: number = 256) {
    this.gl = gl;
    
    const vertexShader = `
      varying vec2 coord;
      void main() {
        coord = gl_Vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(gl_Vertex.xyz, 1.0);
      }
    `;
    
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
    
    // Drop shader - add ripples
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
    
    // Update shader - wave propagation with ocean-like damping
    this.updateShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
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
        
        info.g += (average - info.r) * 2.0;
        info.g *= damping; // Ocean waves persist longer
        info.r += info.g;
        
        gl_FragColor = info;
      }
    `);
    
    // Normal calculation shader
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
    
    // Sphere displacement shader
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
    
    // Generate noise texture for clouds (2D atlas for WebGL1)
    this.generateNoiseTexture();
  }
  
  private generateNoiseTexture() {
    const size = 256;
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
    
    this.noiseTexture = Texture.fromFloatArray(this.gl, atlasSize, atlasSize, atlasData);
  }
  
  addDrop(x: number, y: number, radius: number, strength: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.dropShader.uniforms({
        center: [x, y],
        radius,
        strength
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
  
  stepSimulation(damping: number = 0.997) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.updateShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height],
        damping
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
  
  update(deltaTime: number) {
    this.time += deltaTime;
    this.stepSimulation();
    this.updateNormals();
  }
  
  getTexture(): Texture {
    return this.textureA;
  }
  
  getNoiseTexture(): Texture | null {
    return this.noiseTexture;
  }
}
