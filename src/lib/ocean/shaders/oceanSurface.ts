/**
 * Ocean Surface Shaders
 * Complete water rendering with Fresnel, SSS, foam, caustics, atmospheric integration
 */

import { GERSTNER_WAVE_FUNCTIONS, NOISE_FUNCTIONS } from './gerstnerWaves';
import { ATMOSPHERIC_FUNCTIONS } from './atmosphericSky';

// Common uniforms and helpers
const OCEAN_COMMON = /* glsl */ `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float PI = 3.14159265359;
  
  uniform sampler2D uWaterTexture;    // Height field simulation
  uniform sampler2D uCausticTexture;   // Caustics
  uniform sampler2D uFoamTexture;      // Foam noise
  uniform samplerCube uSkyCubemap;     // Sky reflection
  
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uWaterColorShallow;
  uniform vec3 uWaterColorDeep;
  uniform vec3 uScatterColor;
  
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uSteepness;
  uniform float uWindDirection;
  
  uniform vec3 uSphereCenter;
  uniform float uSphereRadius;
  
  uniform float uTurbidity;
  uniform float uRayleigh;
  uniform float uMieCoefficient;
  uniform float uMieDirectionalG;
  
  uniform vec3 uCameraPosition;
  uniform float uOceanScale;
`;

// Ray-geometry intersection helpers
const RAY_HELPERS = /* glsl */ `
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  float intersectSphere(vec3 origin, vec3 ray, vec3 center, float radius) {
    vec3 toSphere = origin - center;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - radius * radius;
    float discriminant = b*b - 4.0*a*c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
`;

// Sphere color calculation with caustics
const SPHERE_COLOR = /* glsl */ `
  vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);
    
    // Ambient occlusion from pool walls
    color *= 1.0 - 0.9 / pow((1.0 + uSphereRadius - abs(point.x)) / uSphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + uSphereRadius - abs(point.z)) / uSphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + uSphereRadius) / uSphereRadius, 3.0);
    
    vec3 sphereNormal = (point - uSphereCenter) / uSphereRadius;
    vec3 refractedLight = refract(-uSunDirection, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    vec4 info = texture2D(uWaterTexture, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(uCausticTexture, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    
    return color;
  }
`;

// Ocean vertex shader with Gerstner waves
export const OCEAN_VERTEX_SHADER = GERSTNER_WAVE_FUNCTIONS + NOISE_FUNCTIONS + /* glsl */ `
  ${OCEAN_COMMON}
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vFoamFactor;
  varying float vHeight;
  varying vec2 vUV;
  varying float vDistanceToCamera;
  
  void main() {
    vec2 worldXZ = gl_Vertex.xz * uOceanScale;
    vUV = gl_Vertex.xy * 0.5 + 0.5;
    
    // Sample height field simulation (interactive zone)
    vec4 simData = texture2D(uWaterTexture, vUV);
    float simHeight = simData.r;
    vec2 simNormal = simData.ba;
    
    // Calculate Gerstner waves
    vec4 gerstnerResult = calculateGerstnerWaves(worldXZ, uTime, uAmplitude, uSteepness, uWindDirection);
    vec3 gerstnerOffset = gerstnerResult.xyz;
    float gerstnerFoam = gerstnerResult.w;
    
    // Add fine noise detail
    float noiseDetail = fbm(worldXZ * 0.1 + uTime * 0.3, 3) * uAmplitude * 0.1;
    
    // Combine all height contributions
    vec3 worldPos = gl_Vertex.xyz;
    worldPos.x += gerstnerOffset.x;
    worldPos.z += gerstnerOffset.z;
    worldPos.y = simHeight + gerstnerOffset.y + noiseDetail;
    
    vWorldPosition = worldPos;
    vHeight = worldPos.y;
    vFoamFactor = gerstnerFoam + smoothstep(0.1, 0.3, worldPos.y) * 0.5;
    
    // Calculate normal (blend simulation + gerstner)
    vec3 gerstnerNormal = vec3(0.0, 1.0, 0.0);
    calculateGerstnerWaves(worldXZ, uTime, uAmplitude, uSteepness, uWindDirection); // re-calculate for normal
    
    vNormal = normalize(vec3(simNormal.x, 1.0, simNormal.y) + gerstnerNormal * 0.5);
    
    vDistanceToCamera = length(uCameraPosition - worldPos);
    
    gl_Position = gl_ModelViewProjectionMatrix * vec4(worldPos, 1.0);
  }
`;

// Ocean fragment shader - above water
export const OCEAN_FRAGMENT_ABOVE = OCEAN_COMMON + RAY_HELPERS + SPHERE_COLOR + ATMOSPHERIC_FUNCTIONS + NOISE_FUNCTIONS + /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vFoamFactor;
  varying float vHeight;
  varying vec2 vUV;
  varying float vDistanceToCamera;
  
  // Get surface ray color for reflections/refractions
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    
    // Check sphere intersection
    float sphereT = intersectSphere(origin, ray, uSphereCenter, uSphereRadius);
    if (sphereT < 1.0e6) {
      color = getSphereColor(origin + ray * sphereT);
    } else if (ray.y < 0.0) {
      // Looking down - ocean floor/deep water
      float depth = -origin.y / ray.y;
      vec3 floorPoint = origin + ray * depth;
      float dist = length(floorPoint - origin);
      
      // Deep ocean color with caustics
      vec3 deepColor = uWaterColorDeep;
      vec4 caustic = texture2D(uCausticTexture, floorPoint.xz * 0.1);
      
      // Absorption based on depth
      float absorption = exp(-dist * 0.15);
      deepColor += caustic.rgb * 0.5 * absorption;
      
      color = deepColor;
    } else {
      // Looking up - sky with atmospheric scattering
      color = getAtmosphericSkyColor(ray, uSunDirection, uTurbidity, uRayleigh, uMieCoefficient, uMieDirectionalG);
      
      // Sun specular
      float sunSpec = pow(max(0.0, dot(ray, uSunDirection)), 500.0);
      color += uSunColor * sunSpec * 5.0;
    }
    
    // Underwater color tint
    if (ray.y < 0.0) {
      color *= waterColor;
    }
    
    return color;
  }
  
  void main() {
    // Refine normal using texture lookups
    vec2 coord = vWorldPosition.xz * 0.5 + 0.5;
    vec4 info = texture2D(uWaterTexture, coord);
    
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(uWaterTexture, coord);
    }
    
    vec3 normal = normalize(vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a));
    
    // Add wave normal perturbation
    float noiseNormal = snoise(vWorldPosition.xz * 5.0 + uTime * 2.0) * 0.02;
    normal.x += noiseNormal;
    normal.z += snoise(vWorldPosition.xz * 5.0 + uTime * 1.8) * 0.02;
    normal = normalize(normal);
    
    // Fresnel effect (Schlick approximation)
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(normal, viewDir));
    float fresnel = mix(0.02, 1.0, pow(1.0 - NdotV, 5.0));
    fresnel = mix(0.25, 1.0, fresnel); // Bias toward reflection
    
    // Reflection
    vec3 reflectedRay = reflect(-viewDir, normal);
    vec3 reflectedColor = getSurfaceRayColor(vWorldPosition, reflectedRay, uWaterColorShallow);
    
    // Refraction
    vec3 refractedRay = refract(-viewDir, normal, IOR_AIR / IOR_WATER);
    vec3 refractedColor = getSurfaceRayColor(vWorldPosition, refractedRay, uWaterColorShallow);
    
    // Subsurface scattering
    float sss = pow(max(0.0, dot(-viewDir, uSunDirection)), 4.0);
    vec3 scatterColor = uScatterColor * sss * 0.3;
    
    // Blend reflection and refraction
    vec3 finalColor = mix(refractedColor, reflectedColor, fresnel);
    finalColor += scatterColor;
    
    // Foam
    float foam = vFoamFactor;
    foam += smoothstep(0.1, 0.3, vHeight) * 0.3;
    float foamNoise = snoise(vWorldPosition.xz * 20.0 + uTime * 0.5) * 0.5 + 0.5;
    foam *= foamNoise;
    foam = clamp(foam, 0.0, 1.0);
    
    vec3 foamColor = vec3(0.95, 0.98, 1.0);
    finalColor = mix(finalColor, foamColor, foam * 0.7);
    
    // Distance fog (atmospheric)
    float fogFactor = 1.0 - exp(-vDistanceToCamera * 0.001);
    vec3 fogColor = getAtmosphericSkyColor(vec3(0.0, 0.3, 0.0), uSunDirection, uTurbidity, uRayleigh, uMieCoefficient, uMieDirectionalG);
    finalColor = mix(finalColor, fogColor, fogFactor * 0.5);
    
    // Specular highlight
    vec3 halfVec = normalize(viewDir + uSunDirection);
    float spec = pow(max(0.0, dot(normal, halfVec)), 256.0);
    finalColor += uSunColor * spec * 2.0;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Ocean fragment shader - underwater view
export const OCEAN_FRAGMENT_UNDERWATER = OCEAN_COMMON + RAY_HELPERS + SPHERE_COLOR + ATMOSPHERIC_FUNCTIONS + NOISE_FUNCTIONS + /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vFoamFactor;
  varying float vHeight;
  varying vec2 vUV;
  varying float vDistanceToCamera;
  
  uniform vec3 uUnderwaterColor;
  uniform float uUnderwaterFogDensity;
  
  vec3 getSurfaceRayColorUnderwater(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    
    float sphereT = intersectSphere(origin, ray, uSphereCenter, uSphereRadius);
    if (sphereT < 1.0e6) {
      color = getSphereColor(origin + ray * sphereT);
    } else if (ray.y < 0.0) {
      // Ocean floor
      float depth = -origin.y / ray.y;
      vec3 floorPoint = origin + ray * depth;
      float dist = length(floorPoint - origin);
      
      vec3 deepColor = uWaterColorDeep;
      vec4 caustic = texture2D(uCausticTexture, floorPoint.xz * 0.1);
      float absorption = exp(-dist * 0.2);
      deepColor += caustic.rgb * 0.4 * absorption;
      
      color = deepColor;
    } else {
      // Looking up through water surface
      vec3 skyColor = getAtmosphericSkyColor(ray, uSunDirection, uTurbidity, uRayleigh, uMieCoefficient, uMieDirectionalG);
      color = skyColor * vec3(0.8, 1.0, 1.1); // Chromatic shift
    }
    
    return color;
  }
  
  void main() {
    vec2 coord = vWorldPosition.xz * 0.5 + 0.5;
    vec4 info = texture2D(uWaterTexture, coord);
    
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(uWaterTexture, coord);
    }
    
    vec3 normal = -normalize(vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a));
    
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    
    // Total internal reflection check
    float criticalAngle = asin(IOR_AIR / IOR_WATER);
    float angle = acos(max(0.0, dot(normal, viewDir)));
    
    vec3 reflectedRay = reflect(-viewDir, normal);
    vec3 refractedRay = refract(-viewDir, normal, IOR_WATER / IOR_AIR);
    
    float fresnel = mix(0.5, 1.0, pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0));
    
    vec3 reflectedColor = getSurfaceRayColorUnderwater(vWorldPosition, reflectedRay, uUnderwaterColor);
    vec3 refractedColor = getSurfaceRayColorUnderwater(vWorldPosition, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
    
    vec3 finalColor;
    if (length(refractedRay) < 0.5) {
      // Total internal reflection
      finalColor = reflectedColor;
    } else {
      finalColor = mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay));
    }
    
    // Underwater caustics
    vec3 refractedLight = refract(-uSunDirection, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    vec4 caustic = texture2D(uCausticTexture, vWorldPosition.xz * 0.1);
    finalColor += caustic.rgb * 0.3;
    
    // Underwater fog
    float fogFactor = 1.0 - exp(-vDistanceToCamera * uUnderwaterFogDensity);
    finalColor = mix(finalColor, uUnderwaterColor, fogFactor);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default {
  OCEAN_VERTEX_SHADER,
  OCEAN_FRAGMENT_ABOVE,
  OCEAN_FRAGMENT_UNDERWATER
};
