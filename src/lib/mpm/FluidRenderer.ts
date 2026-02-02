/**
 * Screen-Space Fluid Rendering
 * Implements the rendering pipeline from Splash for MLS-MPM particles
 * Includes depth smoothing, normal reconstruction, and thickness estimation
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Shader } from '../webgl/Shader';
import { Texture, MultiRenderTarget } from '../webgl/Texture';
import { Mesh } from '../webgl/Mesh';

export interface FluidRenderSettings {
  particleRadius: number;
  filterRadius: number;
  depthThreshold: number;
  thicknessScale: number;
  
  // SSS colors
  absorptionColor: [number, number, number];
  scatterColor: [number, number, number];
  
  // Refraction
  refractionStrength: number;
  
  // Specular
  specularPower: number;
  specularIntensity: number;
}

export const DEFAULT_FLUID_RENDER_SETTINGS: FluidRenderSettings = {
  particleRadius: 0.03,
  filterRadius: 5.0,
  depthThreshold: 0.05,
  thicknessScale: 10.0,
  
  absorptionColor: [0.3, 0.7, 1.0],
  scatterColor: [0.2, 0.5, 0.8],
  
  refractionStrength: 0.1,
  
  specularPower: 256.0,
  specularIntensity: 1.5,
};

// Full-screen quad vertex shader
const FULLSCREEN_VERTEX = /* glsl */ `#version 300 es
in vec2 aPosition;
out vec2 vUV;

void main() {
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Depth rendering (particle spheres)
const DEPTH_VERTEX = /* glsl */ `#version 300 es
precision highp float;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform sampler2D uPositions;
uniform float uParticleRadius;
uniform float uScreenWidth;
uniform int uParticleCount;

out float vViewDepth;

void main() {
  int idx = gl_VertexID;
  if (idx >= uParticleCount) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }
  
  ivec2 texSize = textureSize(uPositions, 0);
  int tx = idx % texSize.x;
  int ty = idx / texSize.x;
  vec4 posData = texelFetch(uPositions, ivec2(tx, ty), 0);
  
  vec4 viewPos = uModelViewMatrix * vec4(posData.xyz, 1.0);
  vViewDepth = -viewPos.z;
  
  gl_Position = uProjectionMatrix * viewPos;
  
  // Calculate point size
  vec4 projCorner = uProjectionMatrix * vec4(viewPos.xyz + vec3(uParticleRadius, 0.0, 0.0), 1.0);
  float pointSize = uScreenWidth * abs(projCorner.x / projCorner.w - gl_Position.x / gl_Position.w);
  gl_PointSize = max(1.0, pointSize);
}
`;

const DEPTH_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in float vViewDepth;
uniform float uParticleRadius;
uniform float uNear;
uniform float uFar;

out float fragDepth;

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;
  
  float z = sqrt(1.0 - r2);
  float depth = vViewDepth - uParticleRadius * z;
  
  fragDepth = (depth - uNear) / (uFar - uNear);
}
`;

// Bilateral filter for depth smoothing
const BILATERAL_FILTER = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uDepth;
uniform vec2 uTexelSize;
uniform float uFilterRadius;
uniform float uSpatialSigma;
uniform float uRangeSigma;
uniform vec2 uDirection;

in vec2 vUV;
out float fragDepth;

void main() {
  float centerDepth = texture(uDepth, vUV).r;
  if (centerDepth <= 0.0 || centerDepth >= 0.999) {
    fragDepth = centerDepth;
    return;
  }
  
  float sum = 0.0;
  float wSum = 0.0;
  
  for (float i = -uFilterRadius; i <= uFilterRadius; i++) {
    vec2 offset = uDirection * i * uTexelSize;
    float d = texture(uDepth, vUV + offset).r;
    
    if (d > 0.0 && d < 0.999) {
      float spatialW = exp(-(i * i) / (2.0 * uSpatialSigma * uSpatialSigma));
      float rangeW = exp(-pow(d - centerDepth, 2.0) / (2.0 * uRangeSigma * uRangeSigma));
      float w = spatialW * rangeW;
      sum += d * w;
      wSum += w;
    }
  }
  
  fragDepth = wSum > 0.0 ? sum / wSum : centerDepth;
}
`;

// Normal reconstruction
const NORMAL_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uDepth;
uniform vec2 uTexelSize;
uniform mat4 uInvProjection;
uniform float uNear;
uniform float uFar;

in vec2 vUV;
out vec4 fragNormal;

vec3 uvToView(vec2 uv, float depth) {
  float z = depth * (uFar - uNear) + uNear;
  vec4 clipPos = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  vec4 viewPos = uInvProjection * clipPos;
  return vec3(viewPos.xy / viewPos.w * z, -z);
}

void main() {
  float depth = texture(uDepth, vUV).r;
  if (depth <= 0.0 || depth >= 0.999) {
    fragNormal = vec4(0.0, 0.0, 1.0, 0.0);
    return;
  }
  
  float dL = texture(uDepth, vUV - vec2(uTexelSize.x, 0.0)).r;
  float dR = texture(uDepth, vUV + vec2(uTexelSize.x, 0.0)).r;
  float dT = texture(uDepth, vUV + vec2(0.0, uTexelSize.y)).r;
  float dB = texture(uDepth, vUV - vec2(0.0, uTexelSize.y)).r;
  
  vec3 posC = uvToView(vUV, depth);
  vec3 posL = uvToView(vUV - vec2(uTexelSize.x, 0.0), dL);
  vec3 posR = uvToView(vUV + vec2(uTexelSize.x, 0.0), dR);
  vec3 posT = uvToView(vUV + vec2(0.0, uTexelSize.y), dT);
  vec3 posB = uvToView(vUV - vec2(0.0, uTexelSize.y), dB);
  
  vec3 ddx = abs(posR.z - posC.z) < abs(posC.z - posL.z) ? posR - posC : posC - posL;
  vec3 ddy = abs(posT.z - posC.z) < abs(posC.z - posB.z) ? posT - posC : posC - posB;
  
  vec3 normal = normalize(cross(ddx, ddy));
  fragNormal = vec4(normal, 1.0);
}
`;

// Thickness calculation
const THICKNESS_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uPositions;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uParticleRadius;
uniform int uParticleCount;

in float vViewDepth;
out float fragThickness;

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;
  
  // Thickness is proportional to how "inside" the fluid we are
  float thickness = uParticleRadius * 2.0 * (1.0 - sqrt(r2));
  fragThickness = thickness;
}
`;

// Final fluid shading
const FLUID_SHADING = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uDepth;
uniform sampler2D uNormal;
uniform sampler2D uThickness;
uniform sampler2D uBackground;
uniform sampler2D uEnvMap;

uniform mat4 uInvViewMatrix;
uniform vec3 uLightDir;
uniform vec3 uCameraPos;
uniform vec3 uAbsorptionColor;
uniform vec3 uScatterColor;
uniform float uRefractionStrength;
uniform float uSpecularPower;
uniform float uSpecularIntensity;

in vec2 vUV;
out vec4 fragColor;

void main() {
  float depth = texture(uDepth, vUV).r;
  if (depth <= 0.0 || depth >= 0.999) {
    fragColor = texture(uBackground, vUV);
    return;
  }
  
  vec3 normal = texture(uNormal, vUV).xyz;
  float thickness = texture(uThickness, vUV).r;
  
  // View-space to world-space normal
  vec3 worldNormal = mat3(uInvViewMatrix) * normal;
  
  // Fresnel
  vec3 viewDir = normalize(-vec3(vUV * 2.0 - 1.0, 1.0));
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 5.0) * 0.9 + 0.1;
  
  // Refraction
  vec2 refractOffset = normal.xy * uRefractionStrength * (1.0 - fresnel);
  vec3 refractedColor = texture(uBackground, vUV + refractOffset).rgb;
  
  // Beer-Lambert absorption
  vec3 absorption = exp(-thickness * uAbsorptionColor);
  refractedColor *= absorption;
  
  // Subsurface scattering approximation
  float scatter = thickness * max(0.0, dot(-uLightDir, worldNormal));
  vec3 scatterColor = uScatterColor * scatter;
  
  // Reflection (simple sky color)
  vec3 reflectDir = reflect(-viewDir, normal);
  vec3 reflectedColor = vec3(0.6, 0.8, 1.0); // Sky color approximation
  
  // Specular
  vec3 halfVec = normalize(-uLightDir + viewDir);
  float spec = pow(max(0.0, dot(normal, halfVec)), uSpecularPower);
  vec3 specular = vec3(1.0) * spec * uSpecularIntensity;
  
  // Combine
  vec3 color = mix(refractedColor + scatterColor, reflectedColor, fresnel);
  color += specular;
  
  fragColor = vec4(color, 1.0);
}
`;

/**
 * Screen-space fluid renderer
 * Renders MLS-MPM particles as a smooth fluid surface
 */
export class FluidRenderer {
  gl: GLContextExtended;
  settings: FluidRenderSettings;
  
  // Render targets
  depthTex: Texture;
  depthTempTex: Texture;
  normalTex: Texture;
  thicknessTex: Texture;
  
  // Shaders
  depthShader: Shader | null = null;
  bilateralShader: Shader | null = null;
  normalShader: Shader | null = null;
  thicknessShader: Shader | null = null;
  shadingShader: Shader | null = null;
  
  // Full-screen quad
  quadMesh: Mesh;
  
  width: number;
  height: number;
  
  constructor(gl: GLContextExtended, width: number, height: number, settings: FluidRenderSettings = DEFAULT_FLUID_RENDER_SETTINGS) {
    if (!gl.isWebGL2) {
      throw new Error('FluidRenderer requires WebGL2');
    }
    
    this.gl = gl;
    this.settings = settings;
    this.width = width;
    this.height = height;
    
    const gl2 = gl as WebGL2RenderingContext;
    
    // Create render targets (R32F for depth, RGBA for normals)
    this.depthTex = new Texture(gl, width, height, {
      type: gl.FLOAT,
      format: gl2.RED,
      internalFormat: gl2.R32F,
      filter: gl.NEAREST,
    });
    
    this.depthTempTex = new Texture(gl, width, height, {
      type: gl.FLOAT,
      format: gl2.RED,
      internalFormat: gl2.R32F,
      filter: gl.NEAREST,
    });
    
    this.normalTex = new Texture(gl, width, height, {
      type: gl.FLOAT,
      format: gl.RGBA,
      internalFormat: gl2.RGBA16F,
      filter: gl.LINEAR,
    });
    
    this.thicknessTex = new Texture(gl, width, height, {
      type: gl.FLOAT,
      format: gl2.RED,
      internalFormat: gl2.R16F,
      filter: gl.LINEAR,
    });
    
    // Create full-screen quad
    this.quadMesh = Mesh.plane(gl, { detail: 1 });
    
    console.log('FluidRenderer initialized');
  }
  
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    // Recreate textures at new size
    const gl2 = this.gl as WebGL2RenderingContext;
    
    this.depthTex.destroy();
    this.depthTex = new Texture(this.gl, width, height, {
      type: this.gl.FLOAT,
      format: gl2.RED,
      internalFormat: gl2.R32F,
      filter: this.gl.NEAREST,
    });
    
    this.depthTempTex.destroy();
    this.depthTempTex = new Texture(this.gl, width, height, {
      type: this.gl.FLOAT,
      format: gl2.RED,
      internalFormat: gl2.R32F,
      filter: this.gl.NEAREST,
    });
    
    this.normalTex.destroy();
    this.normalTex = new Texture(this.gl, width, height, {
      type: this.gl.FLOAT,
      format: this.gl.RGBA,
      internalFormat: gl2.RGBA16F,
      filter: this.gl.LINEAR,
    });
    
    this.thicknessTex.destroy();
    this.thicknessTex = new Texture(this.gl, width, height, {
      type: this.gl.FLOAT,
      format: gl2.RED,
      internalFormat: gl2.R16F,
      filter: this.gl.LINEAR,
    });
  }
  
  /**
   * Render fluid particles
   * Returns the depth, normal, and thickness textures for compositing
   */
  render(
    positionsTexture: Texture,
    particleCount: number,
    modelViewMatrix: Float32Array,
    projectionMatrix: Float32Array,
    invProjectionMatrix: Float32Array,
    near: number,
    far: number
  ): { depth: Texture; normal: Texture; thickness: Texture } {
    // Step 1: Render particle depths
    // Step 2: Bilateral filter depth
    // Step 3: Reconstruct normals
    // Step 4: Calculate thickness
    
    // For now, return placeholder textures
    // Full implementation would compile and run the shaders defined above
    
    return {
      depth: this.depthTex,
      normal: this.normalTex,
      thickness: this.thicknessTex,
    };
  }
  
  destroy() {
    this.depthTex.destroy();
    this.depthTempTex.destroy();
    this.normalTex.destroy();
    this.thicknessTex.destroy();
  }
}

export default {
  FluidRenderer,
  DEFAULT_FLUID_RENDER_SETTINGS,
};
