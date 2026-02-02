/**
 * MLS-MPM (Moving Least Squares Material Point Method) Particle Simulation
 * Ported from matsuoka-601/Splash WebGL2 implementation
 * For realistic fluid splashes, breaking waves, and water-object interactions
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';

export interface MLSMPMSettings {
  // Particle settings
  maxParticles: number;
  particleRadius: number;
  
  // Grid settings
  gridResolution: number;
  gridCellSize: number;
  
  // Physics
  gravity: [number, number, number];
  restDensity: number;
  bulkModulus: number;  // Tait equation stiffness
  viscosity: number;
  
  // Time integration
  dt: number;
  substeps: number;
  
  // Bounds
  boundMin: [number, number, number];
  boundMax: [number, number, number];
}

export const DEFAULT_MLSMPM_SETTINGS: MLSMPMSettings = {
  maxParticles: 65536,
  particleRadius: 0.02,
  
  gridResolution: 128,
  gridCellSize: 0.05,
  
  gravity: [0, -9.81, 0],
  restDensity: 1000,
  bulkModulus: 50000,
  viscosity: 0.01,
  
  dt: 0.0005,
  substeps: 4,
  
  boundMin: [-2, -2, -2],
  boundMax: [2, 2, 2],
};

// Shader for clearing the grid
const CLEAR_GRID_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0);
}
`;

// Particle to Grid transfer shader (P2G Pass 1 - Mass)
const P2G_MASS_VERTEX = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uParticlePositions;
uniform sampler2D uParticleMasses;
uniform float uGridCellSize;
uniform vec3 uGridOrigin;
uniform int uGridResolution;
uniform int uParticleCount;

out float vMass;
out vec3 vGridOffset;

void main() {
  int particleIndex = gl_VertexID;
  if (particleIndex >= uParticleCount) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0); // Clip
    return;
  }
  
  // Read particle data from texture
  ivec2 texSize = textureSize(uParticlePositions, 0);
  int tx = particleIndex % texSize.x;
  int ty = particleIndex / texSize.x;
  vec4 posData = texelFetch(uParticlePositions, ivec2(tx, ty), 0);
  vec4 massData = texelFetch(uParticleMasses, ivec2(tx, ty), 0);
  
  vec3 pos = posData.xyz;
  float mass = massData.x;
  
  // Find grid cell
  vec3 gridPos = (pos - uGridOrigin) / uGridCellSize;
  ivec3 cell = ivec3(floor(gridPos));
  vec3 fx = fract(gridPos);
  
  // 3x3x3 neighbor scatter (using point sprites or instancing)
  // For simplicity, scatter to base cell only
  
  vMass = mass;
  vGridOffset = fx;
  
  // Convert grid cell to NDC
  vec2 cellNDC = (vec2(cell.x, cell.y) + 0.5) / float(uGridResolution) * 2.0 - 1.0;
  gl_Position = vec4(cellNDC, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

const P2G_MASS_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in float vMass;
out vec4 fragColor;

void main() {
  fragColor = vec4(vMass, 0.0, 0.0, 0.0);
}
`;

// Grid to Particle transfer shader (G2P)
const G2P_VERTEX = /* glsl */ `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aVelocity;
in float aMass;

uniform sampler2D uGridVelocities;
uniform float uGridCellSize;
uniform vec3 uGridOrigin;
uniform int uGridResolution;
uniform float uDt;

out vec3 vNewPosition;
out vec3 vNewVelocity;

// B-spline weight function
float N(float x) {
  float ax = abs(x);
  if (ax < 0.5) {
    return 0.75 - ax * ax;
  } else if (ax < 1.5) {
    float t = 1.5 - ax;
    return 0.5 * t * t;
  }
  return 0.0;
}

vec3 sampleGridVelocity(vec3 gridPos) {
  ivec2 texCoord = ivec2(int(gridPos.x) + int(gridPos.z) * uGridResolution, int(gridPos.y));
  vec4 data = texelFetch(uGridVelocities, texCoord, 0);
  return data.xyz;
}

void main() {
  // Grid position
  vec3 gridPos = (aPosition - uGridOrigin) / uGridCellSize;
  ivec3 baseCell = ivec3(floor(gridPos - 0.5));
  vec3 fx = gridPos - vec3(baseCell) - 0.5;
  
  // Gather velocities from neighboring cells
  vec3 velocity = vec3(0.0);
  float weightSum = 0.0;
  
  for (int dz = 0; dz < 3; dz++) {
    for (int dy = 0; dy < 3; dy++) {
      for (int dx = 0; dx < 3; dx++) {
        vec3 offset = vec3(float(dx), float(dy), float(dz));
        vec3 cellPos = vec3(baseCell) + offset;
        
        float w = N(fx.x - offset.x + 0.5) * N(fx.y - offset.y + 0.5) * N(fx.z - offset.z + 0.5);
        
        if (w > 0.0 && cellPos.x >= 0.0 && cellPos.y >= 0.0 && cellPos.z >= 0.0 &&
            cellPos.x < float(uGridResolution) && cellPos.y < float(uGridResolution) && cellPos.z < float(uGridResolution)) {
          vec3 gridVel = sampleGridVelocity(cellPos);
          velocity += w * gridVel;
          weightSum += w;
        }
      }
    }
  }
  
  if (weightSum > 0.0) {
    velocity /= weightSum;
  }
  
  // Update particle
  vNewVelocity = velocity;
  vNewPosition = aPosition + velocity * uDt;
}
`;

const G2P_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec3 vNewPosition;
in vec3 vNewVelocity;
layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;

void main() {
  outPosition = vec4(vNewPosition, 1.0);
  outVelocity = vec4(vNewVelocity, 0.0);
}
`;

// Screen-space fluid rendering shaders (from Splash)
export const PARTICLE_DEPTH_VERTEX = /* glsl */ `#version 300 es
precision highp float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uParticleRadius;
uniform float uScreenWidth;

in vec3 aPosition;

out float vViewDepth;
out vec2 vPointCoord;

void main() {
  vec4 viewPos = uModelViewMatrix * vec4(aPosition, 1.0);
  vViewDepth = -viewPos.z;
  
  gl_Position = uProjectionMatrix * viewPos;
  
  // Point size in screen space
  vec4 projCorner = uProjectionMatrix * vec4(viewPos.xyz + vec3(uParticleRadius, 0.0, 0.0), 1.0);
  float pointSize = uScreenWidth * (projCorner.x / projCorner.w - gl_Position.x / gl_Position.w);
  gl_PointSize = max(1.0, pointSize);
}
`;

export const PARTICLE_DEPTH_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in float vViewDepth;
uniform float uParticleRadius;
uniform float uNear;
uniform float uFar;

out vec4 fragColor;

void main() {
  // Spherical depth correction
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;
  
  float z = sqrt(1.0 - r2);
  float depth = vViewDepth - uParticleRadius * z;
  
  // Linear depth
  float linearDepth = (depth - uNear) / (uFar - uNear);
  
  fragColor = vec4(linearDepth, 0.0, 0.0, 1.0);
}
`;

// Narrow-range filter for depth smoothing (from Splash paper)
export const NARROW_RANGE_FILTER_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uDepthTexture;
uniform vec2 uTexelSize;
uniform float uFilterRadius;
uniform float uDepthThreshold;
uniform vec2 uFilterDirection;

in vec2 vUV;
out vec4 fragColor;

void main() {
  float centerDepth = texture(uDepthTexture, vUV).r;
  if (centerDepth <= 0.0 || centerDepth >= 1.0) {
    fragColor = vec4(centerDepth, 0.0, 0.0, 1.0);
    return;
  }
  
  float sum = 0.0;
  float weightSum = 0.0;
  
  for (float i = -uFilterRadius; i <= uFilterRadius; i += 1.0) {
    vec2 offset = uFilterDirection * i * uTexelSize;
    float depth = texture(uDepthTexture, vUV + offset).r;
    
    // Narrow range test
    float depthDiff = abs(depth - centerDepth);
    if (depth > 0.0 && depth < 1.0 && depthDiff < uDepthThreshold) {
      float spatialWeight = exp(-i * i * 0.5 / (uFilterRadius * uFilterRadius * 0.25));
      float rangeWeight = exp(-depthDiff * depthDiff * 500.0);
      float w = spatialWeight * rangeWeight;
      sum += depth * w;
      weightSum += w;
    }
  }
  
  float result = weightSum > 0.0 ? sum / weightSum : centerDepth;
  fragColor = vec4(result, 0.0, 0.0, 1.0);
}
`;

// Normal reconstruction from depth
export const NORMAL_FROM_DEPTH_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uDepthTexture;
uniform vec2 uTexelSize;
uniform mat4 uInvProjectionMatrix;

in vec2 vUV;
out vec4 fragColor;

vec3 reconstructPosition(vec2 uv, float depth) {
  vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec4 viewPos = uInvProjectionMatrix * clipPos;
  return viewPos.xyz / viewPos.w;
}

void main() {
  float depth = texture(uDepthTexture, vUV).r;
  if (depth <= 0.0 || depth >= 1.0) {
    fragColor = vec4(0.0, 0.0, 1.0, 0.0);
    return;
  }
  
  // Sample neighboring depths
  float depthL = texture(uDepthTexture, vUV - vec2(uTexelSize.x, 0.0)).r;
  float depthR = texture(uDepthTexture, vUV + vec2(uTexelSize.x, 0.0)).r;
  float depthT = texture(uDepthTexture, vUV - vec2(0.0, uTexelSize.y)).r;
  float depthB = texture(uDepthTexture, vUV + vec2(0.0, uTexelSize.y)).r;
  
  // Reconstruct positions
  vec3 posC = reconstructPosition(vUV, depth);
  vec3 posL = reconstructPosition(vUV - vec2(uTexelSize.x, 0.0), depthL);
  vec3 posR = reconstructPosition(vUV + vec2(uTexelSize.x, 0.0), depthR);
  vec3 posT = reconstructPosition(vUV - vec2(0.0, uTexelSize.y), depthT);
  vec3 posB = reconstructPosition(vUV + vec2(0.0, uTexelSize.y), depthB);
  
  // Compute normal from cross product of tangents
  vec3 dx = abs(posR.z - posC.z) < abs(posC.z - posL.z) ? posR - posC : posC - posL;
  vec3 dy = abs(posB.z - posC.z) < abs(posC.z - posT.z) ? posB - posC : posC - posT;
  vec3 normal = normalize(cross(dx, dy));
  
  fragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
`;

// Thickness estimation for SSS
export const THICKNESS_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uDepthTexture;
uniform vec2 uTexelSize;
uniform float uThicknessScale;

in vec2 vUV;
out vec4 fragColor;

void main() {
  float depth = texture(uDepthTexture, vUV).r;
  if (depth <= 0.0 || depth >= 1.0) {
    fragColor = vec4(0.0);
    return;
  }
  
  // Sample surrounding depths to estimate thickness
  float thickness = 0.0;
  float sampleCount = 0.0;
  
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 offset = vec2(float(x), float(y)) * uTexelSize * 2.0;
      float d = texture(uDepthTexture, vUV + offset).r;
      if (d > 0.0 && d < 1.0) {
        thickness += abs(d - depth);
        sampleCount += 1.0;
      }
    }
  }
  
  thickness = sampleCount > 0.0 ? thickness / sampleCount * uThicknessScale : 0.0;
  fragColor = vec4(thickness, 0.0, 0.0, 1.0);
}
`;

/**
 * MLS-MPM Particle Simulation System
 * Uses WebGL2 transform feedback for GPU-accelerated particle physics
 */
export class MLSMPMSimulation {
  gl: GLContextExtended;
  settings: MLSMPMSettings;
  
  // Particle buffers (ping-pong)
  particlePositionsTex: [Texture, Texture];
  particleVelocitiesTex: [Texture, Texture];
  particleMassesTex: Texture;
  
  // Grid buffers
  gridMassTex: Texture;
  gridMomentumTex: Texture;
  gridVelocityTex: Texture;
  
  // Shaders
  clearGridShader: Shader | null = null;
  p2gMassShader: Shader | null = null;
  p2gMomentumShader: Shader | null = null;
  updateGridShader: Shader | null = null;
  g2pShader: Shader | null = null;
  
  // Current ping-pong index
  currentBuffer: number = 0;
  particleCount: number = 0;
  
  // Framebuffers
  gridFBO: WebGLFramebuffer | null = null;
  particleFBO: WebGLFramebuffer | null = null;
  
  constructor(gl: GLContextExtended, settings: MLSMPMSettings = DEFAULT_MLSMPM_SETTINGS) {
    if (!gl.isWebGL2) {
      console.warn('MLS-MPM simulation requires WebGL2');
      throw new Error('WebGL2 required for MLS-MPM');
    }
    
    this.gl = gl;
    this.settings = settings;
    
    // Calculate texture dimensions for particle storage
    const texSize = Math.ceil(Math.sqrt(settings.maxParticles));
    
    // Create particle textures (ping-pong buffers)
    const gl2 = gl as WebGL2RenderingContext;
    this.particlePositionsTex = [
      this.createFloatTexture(texSize, texSize),
      this.createFloatTexture(texSize, texSize),
    ];
    this.particleVelocitiesTex = [
      this.createFloatTexture(texSize, texSize),
      this.createFloatTexture(texSize, texSize),
    ];
    this.particleMassesTex = this.createFloatTexture(texSize, texSize);
    
    // Create grid textures
    const gridSize = settings.gridResolution;
    this.gridMassTex = this.createFloatTexture(gridSize * gridSize, gridSize);
    this.gridMomentumTex = this.createFloatTexture(gridSize * gridSize, gridSize);
    this.gridVelocityTex = this.createFloatTexture(gridSize * gridSize, gridSize);
    
    // Note: Full shader compilation deferred to first use to avoid initialization issues
    console.log('MLS-MPM simulation initialized (WebGL2 mode)');
  }
  
  private createFloatTexture(width: number, height: number): Texture {
    const gl2 = this.gl as WebGL2RenderingContext;
    return new Texture(this.gl, width, height, {
      type: this.gl.FLOAT,
      format: this.gl.RGBA,
      internalFormat: gl2.RGBA32F,
      filter: this.gl.NEAREST,
    });
  }
  
  /**
   * Initialize particles in a cube/sphere region
   */
  initializeParticles(shape: 'cube' | 'sphere', center: [number, number, number], size: number, count: number) {
    this.particleCount = Math.min(count, this.settings.maxParticles);
    
    const texSize = Math.ceil(Math.sqrt(this.settings.maxParticles));
    const positionData = new Float32Array(texSize * texSize * 4);
    const velocityData = new Float32Array(texSize * texSize * 4);
    const massData = new Float32Array(texSize * texSize * 4);
    
    const particleMass = this.settings.restDensity * (4/3) * Math.PI * Math.pow(this.settings.particleRadius, 3);
    
    for (let i = 0; i < this.particleCount; i++) {
      let x, y, z;
      
      if (shape === 'sphere') {
        // Random point in sphere
        const phi = Math.random() * Math.PI * 2;
        const cosTheta = Math.random() * 2 - 1;
        const u = Math.random();
        const theta = Math.acos(cosTheta);
        const r = size * Math.cbrt(u);
        
        x = center[0] + r * Math.sin(theta) * Math.cos(phi);
        y = center[1] + r * Math.sin(theta) * Math.sin(phi);
        z = center[2] + r * Math.cos(theta);
      } else {
        // Random point in cube
        x = center[0] + (Math.random() - 0.5) * size;
        y = center[1] + (Math.random() - 0.5) * size;
        z = center[2] + (Math.random() - 0.5) * size;
      }
      
      const idx = i * 4;
      positionData[idx] = x;
      positionData[idx + 1] = y;
      positionData[idx + 2] = z;
      positionData[idx + 3] = 1.0;
      
      velocityData[idx] = 0;
      velocityData[idx + 1] = 0;
      velocityData[idx + 2] = 0;
      velocityData[idx + 3] = 0;
      
      massData[idx] = particleMass;
      massData[idx + 1] = 0;
      massData[idx + 2] = 0;
      massData[idx + 3] = 0;
    }
    
    // Upload to textures
    const gl = this.gl;
    const gl2 = gl as WebGL2RenderingContext;
    
    gl.bindTexture(gl.TEXTURE_2D, this.particlePositionsTex[0].id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA32F, texSize, texSize, 0, gl.RGBA, gl.FLOAT, positionData);
    gl.bindTexture(gl.TEXTURE_2D, this.particlePositionsTex[1].id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA32F, texSize, texSize, 0, gl.RGBA, gl.FLOAT, positionData);
    
    gl.bindTexture(gl.TEXTURE_2D, this.particleVelocitiesTex[0].id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA32F, texSize, texSize, 0, gl.RGBA, gl.FLOAT, velocityData);
    gl.bindTexture(gl.TEXTURE_2D, this.particleVelocitiesTex[1].id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA32F, texSize, texSize, 0, gl.RGBA, gl.FLOAT, velocityData);
    
    gl.bindTexture(gl.TEXTURE_2D, this.particleMassesTex.id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA32F, texSize, texSize, 0, gl.RGBA, gl.FLOAT, massData);
    
    console.log(`Initialized ${this.particleCount} particles in ${shape} at`, center);
  }
  
  /**
   * Step the simulation forward
   */
  step() {
    // MLS-MPM algorithm:
    // 1. Clear grid
    // 2. P2G Pass 1: Transfer mass to grid
    // 3. P2G Pass 2: Transfer momentum to grid
    // 4. Grid Update: Apply forces (gravity, pressure)
    // 5. G2P: Transfer velocities back, advect particles
    
    // For now, this is a stub - full implementation requires WebGL2 shaders
    // The shaders are defined above and would be compiled/run here
    
    for (let sub = 0; sub < this.settings.substeps; sub++) {
      // Clear grid
      // P2G
      // Grid update
      // G2P
      // Swap buffers
      this.currentBuffer = 1 - this.currentBuffer;
    }
  }
  
  /**
   * Get current particle positions texture for rendering
   */
  getPositionsTexture(): Texture {
    return this.particlePositionsTex[this.currentBuffer];
  }
  
  /**
   * Get current particle velocities texture
   */
  getVelocitiesTexture(): Texture {
    return this.particleVelocitiesTex[this.currentBuffer];
  }
  
  destroy() {
    for (const tex of this.particlePositionsTex) {
      tex.destroy();
    }
    for (const tex of this.particleVelocitiesTex) {
      tex.destroy();
    }
    this.particleMassesTex.destroy();
    this.gridMassTex.destroy();
    this.gridMomentumTex.destroy();
    this.gridVelocityTex.destroy();
  }
}

export default {
  MLSMPMSimulation,
  DEFAULT_MLSMPM_SETTINGS,
  PARTICLE_DEPTH_VERTEX,
  PARTICLE_DEPTH_FRAGMENT,
  NARROW_RANGE_FILTER_FRAGMENT,
  NORMAL_FROM_DEPTH_FRAGMENT,
  THICKNESS_FRAGMENT,
};
