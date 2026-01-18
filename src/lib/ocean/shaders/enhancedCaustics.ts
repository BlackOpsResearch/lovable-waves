/**
 * Enhanced Caustics System with LOD support
 * Implements projection-based caustics with focus, dispersion, and temporal accumulation
 */

// Common helpers for caustics
const CAUSTIC_HELPERS = /* glsl */ `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float PI = 3.14159265359;
  
  uniform vec3 uLight;
  uniform sampler2D uWaterTexture;
  uniform float uPoolHeight;
  uniform vec3 uSphereCenter;
  uniform float uSphereRadius;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  // Project point onto floor
  vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
    vec2 tcube = intersectCube(origin, ray, vec3(-100.0, -100.0, -100.0), vec3(100.0, 2.0, 100.0));
    origin += ray * tcube.y;
    float tplane = (-origin.y - uPoolHeight) / refractedLight.y;
    return origin + refractedLight * tplane;
  }
`;

// Enhanced caustics vertex shader
export const CAUSTICS_VERTEX_SHADER = CAUSTIC_HELPERS + /* glsl */ `
  varying vec3 vOldPos;
  varying vec3 vNewPos;
  varying vec3 vRay;
  varying float vDepth;
  
  uniform float uCausticsScale;
  
  void main() {
    vec4 info = texture2D(uWaterTexture, gl_Vertex.xy * 0.5 + 0.5);
    info.ba *= 0.5;
    
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    
    // Refracted light direction
    vec3 refractedLight = refract(-uLight, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vRay = refract(-uLight, normal, IOR_AIR / IOR_WATER);
    
    // Project old and new positions
    vOldPos = project(gl_Vertex.xzy, refractedLight, refractedLight);
    vNewPos = project(gl_Vertex.xzy + vec3(0.0, info.r, 0.0), vRay, refractedLight);
    
    // Calculate depth for absorption
    vDepth = length(vNewPos - gl_Vertex.xzy) * 0.5;
    
    gl_Position = vec4(uCausticsScale * (vNewPos.xz + refractedLight.xz / refractedLight.y) * 0.1, 0.0, 1.0);
  }
`;

// Enhanced caustics fragment shader with dispersion and soft sun
export const CAUSTICS_FRAGMENT_SHADER = /* glsl */ `
  #extension GL_OES_standard_derivatives : enable
  
  precision highp float;
  
  varying vec3 vOldPos;
  varying vec3 vNewPos;
  varying vec3 vRay;
  varying float vDepth;
  
  uniform vec3 uLight;
  uniform vec3 uSphereCenter;
  uniform float uSphereRadius;
  uniform float uPoolHeight;
  uniform float uCausticsIntensity;
  uniform float uAbsorptionCoeff;
  uniform float uDispersionStrength;
  uniform vec3 uAbsorptionColor;
  
  // Fresnel transmission (Schlick)
  float fresnelTransmit(vec3 normal, vec3 incident) {
    float r0 = 0.02;
    float cosTheta = max(0.0, dot(-incident, normal));
    return 1.0 - (r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5.0));
  }
  
  void main() {
    // Calculate focus (area change ratio)
    float oldArea = length(dFdx(vOldPos)) * length(dFdy(vOldPos));
    float newArea = length(dFdx(vNewPos)) * length(dFdy(vNewPos));
    
    // Clamp to avoid infinities
    float focus = clamp(oldArea / max(newArea, 0.0001), 0.0, 100.0);
    
    // Fresnel transmission
    float transmission = fresnelTransmit(vec3(0.0, 1.0, 0.0), -uLight);
    
    // Absorption (Beer-Lambert)
    vec3 absorption = exp(-uAbsorptionCoeff * vDepth * uAbsorptionColor);
    
    // Dispersion effect (RGB wavelength offset)
    vec3 dispersion = vec3(1.0);
    if (uDispersionStrength > 0.0) {
      float dispOffset = uDispersionStrength * 0.01;
      float focusR = focus * (1.0 + dispOffset);
      float focusB = focus * (1.0 - dispOffset);
      dispersion = vec3(focusR / focus, 1.0, focusB / focus);
    }
    
    // Sphere shadow
    float sphereShadow = 1.0;
    vec3 sphereToPoint = vNewPos - uSphereCenter;
    float distToSphere = length(sphereToPoint);
    if (distToSphere < uSphereRadius * 1.5) {
      sphereShadow = smoothstep(0.0, uSphereRadius * 0.5, distToSphere - uSphereRadius);
    }
    
    // Final caustic intensity
    float baseIntensity = focus * uCausticsIntensity * transmission * sphereShadow;
    vec3 causticColor = baseIntensity * absorption * dispersion;
    
    gl_FragColor = vec4(causticColor, 1.0);
  }
`;

// Fallback for devices without derivatives
export const CAUSTICS_FRAGMENT_FALLBACK = /* glsl */ `
  precision highp float;
  
  varying vec3 vOldPos;
  varying vec3 vNewPos;
  varying vec3 vRay;
  varying float vDepth;
  
  uniform vec3 uLight;
  uniform vec3 uSphereCenter;
  uniform float uSphereRadius;
  uniform float uCausticsIntensity;
  
  void main() {
    // Simplified caustic without derivatives
    float intensity = uCausticsIntensity * 0.2;
    
    // Sphere shadow
    float sphereShadow = 1.0;
    vec3 sphereToPoint = vNewPos - uSphereCenter;
    float distToSphere = length(sphereToPoint);
    if (distToSphere < uSphereRadius * 1.5) {
      sphereShadow = smoothstep(0.0, uSphereRadius * 0.5, distToSphere - uSphereRadius);
    }
    
    gl_FragColor = vec4(vec3(intensity * sphereShadow), 1.0);
  }
`;

// LOD-based caustic texture shader (for distant water)
export const CAUSTICS_LOD_FRAGMENT = /* glsl */ `
  precision highp float;
  
  varying vec2 vUV;
  uniform float uTime;
  uniform float uCausticsSpeed;
  uniform float uCausticsScale;
  
  // Simple animated caustic pattern
  float causticPattern(vec2 uv, float time) {
    vec2 p = uv * uCausticsScale;
    float c = 0.0;
    
    // Multi-layer sine waves
    for (float i = 1.0; i <= 4.0; i++) {
      float t = time * uCausticsSpeed * (0.5 + i * 0.2);
      c += sin(p.x * i + t) * sin(p.y * i * 1.2 - t * 0.7);
      p = p.yx * 1.3;
    }
    
    return c * 0.25 + 0.5;
  }
  
  void main() {
    float caustic = causticPattern(vUV, uTime);
    caustic = pow(caustic, 2.0); // Sharpen
    gl_FragColor = vec4(vec3(caustic), 1.0);
  }
`;

export default {
  CAUSTICS_VERTEX_SHADER,
  CAUSTICS_FRAGMENT_SHADER,
  CAUSTICS_FRAGMENT_FALLBACK,
  CAUSTICS_LOD_FRAGMENT
};
