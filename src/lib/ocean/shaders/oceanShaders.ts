/**
 * Ocean Surface Shaders
 * Gerstner waves, reflections, refractions, foam, caustics
 */

export const GERSTNER_FUNCTIONS = /* glsl */ `
// Gerstner wave implementation for realistic ocean waves
struct GerstnerWave {
  vec2 direction;
  float steepness;
  float wavelength;
  float speed;
  float amplitude;
};

vec3 gerstnerWave(GerstnerWave wave, vec3 p, float time, inout vec3 tangent, inout vec3 binormal) {
  float k = 2.0 * 3.14159265 / wave.wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.direction);
  float f = k * (dot(d, p.xz) - c * wave.speed * time);
  float a = wave.steepness / k;
  
  tangent += vec3(
    -d.x * d.x * (wave.steepness * sin(f)),
    d.x * (wave.steepness * cos(f)),
    -d.x * d.y * (wave.steepness * sin(f))
  );
  
  binormal += vec3(
    -d.x * d.y * (wave.steepness * sin(f)),
    d.y * (wave.steepness * cos(f)),
    -d.y * d.y * (wave.steepness * sin(f))
  );
  
  return vec3(
    d.x * (a * cos(f)),
    a * sin(f) * wave.amplitude,
    d.y * (a * cos(f))
  );
}

// Calculate multiple superimposed Gerstner waves
vec3 calculateWaves(vec3 position, float time, float amplitude, float steepness, int numWaves, 
                    out vec3 normal, out float foamFactor) {
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  vec3 offset = vec3(0.0);
  
  foamFactor = 0.0;
  
  // Primary wave
  GerstnerWave wave1;
  wave1.direction = vec2(1.0, 0.3);
  wave1.steepness = steepness;
  wave1.wavelength = 8.0;
  wave1.speed = 1.0;
  wave1.amplitude = amplitude;
  offset += gerstnerWave(wave1, position, time, tangent, binormal);
  
  // Secondary waves
  GerstnerWave wave2;
  wave2.direction = vec2(0.8, 0.6);
  wave2.steepness = steepness * 0.8;
  wave2.wavelength = 5.0;
  wave2.speed = 1.2;
  wave2.amplitude = amplitude * 0.7;
  offset += gerstnerWave(wave2, position, time, tangent, binormal);
  
  GerstnerWave wave3;
  wave3.direction = vec2(-0.3, 0.9);
  wave3.steepness = steepness * 0.6;
  wave3.wavelength = 3.0;
  wave3.speed = 0.8;
  wave3.amplitude = amplitude * 0.5;
  offset += gerstnerWave(wave3, position, time, tangent, binormal);
  
  GerstnerWave wave4;
  wave4.direction = vec2(0.4, -0.7);
  wave4.steepness = steepness * 0.4;
  wave4.wavelength = 2.0;
  wave4.speed = 1.5;
  wave4.amplitude = amplitude * 0.3;
  offset += gerstnerWave(wave4, position, time, tangent, binormal);
  
  // Fine detail waves
  for (int i = 0; i < 4; i++) {
    float angle = float(i) * 1.5708 + time * 0.1;
    GerstnerWave detailWave;
    detailWave.direction = vec2(cos(angle), sin(angle));
    detailWave.steepness = steepness * 0.2;
    detailWave.wavelength = 1.0 + float(i) * 0.3;
    detailWave.speed = 2.0;
    detailWave.amplitude = amplitude * 0.15;
    offset += gerstnerWave(detailWave, position, time, tangent, binormal);
  }
  
  normal = normalize(cross(binormal, tangent));
  
  // Calculate foam factor based on wave peaks
  float jacobian = (tangent.x * binormal.z - tangent.z * binormal.x);
  foamFactor = max(0.0, -jacobian + 0.5);
  foamFactor = pow(foamFactor, 2.0);
  
  return offset;
}
`;

export const OCEAN_VERTEX_SHADER = /* glsl */ `
${GERSTNER_FUNCTIONS}

uniform float uTime;
uniform float uAmplitude;
uniform float uSteepness;
uniform int uNumWaves;
uniform sampler2D uHeightMap;
uniform float uHeightMapInfluence;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vFoamFactor;
varying float vHeight;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  vec3 normal;
  float foamFactor;
  
  // Apply Gerstner waves
  vec3 waveOffset = calculateWaves(pos, uTime, uAmplitude, uSteepness, uNumWaves, normal, foamFactor);
  pos += waveOffset;
  
  // Sample height map for local disturbances (sphere interaction)
  vec4 heightInfo = texture2D(uHeightMap, uv);
  pos.y += heightInfo.r * uHeightMapInfluence;
  
  // Blend normals from Gerstner with height map normals
  vec3 heightNormal = vec3(heightInfo.b, sqrt(1.0 - dot(heightInfo.ba, heightInfo.ba)), heightInfo.a);
  normal = normalize(mix(normal, heightNormal, uHeightMapInfluence * 2.0));
  
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  vFoamFactor = foamFactor;
  vHeight = pos.y;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const OCEAN_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;

uniform vec3 uEyePosition;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uLightIntensity;

uniform samplerCube uSkybox;
uniform sampler2D uCaustics;
uniform sampler2D uFoamTexture;

uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform float uFoamIntensity;
uniform float uFresnelPower;
uniform float uReflectivity;
uniform float uSpecularPower;
uniform float uSpecularIntensity;

// Atmosphere
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogNear;
uniform float uFogFar;

// Subsurface scattering
uniform float uSSSIntensity;
uniform vec3 uSSSColor;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vFoamFactor;
varying float vHeight;

// Schlick's Fresnel approximation
float fresnel(vec3 viewDir, vec3 normal) {
  float cosTheta = max(dot(viewDir, normal), 0.0);
  float R0 = pow((IOR_AIR - IOR_WATER) / (IOR_AIR + IOR_WATER), 2.0);
  return R0 + (1.0 - R0) * pow(1.0 - cosTheta, uFresnelPower);
}

// Subsurface scattering approximation
vec3 subsurfaceScatter(vec3 lightDir, vec3 viewDir, vec3 normal, float thickness) {
  vec3 H = normalize(lightDir + normal * 0.3);
  float VdotH = pow(clamp(dot(viewDir, -H), 0.0, 1.0), 3.0);
  return uSSSColor * VdotH * uSSSIntensity * thickness;
}

void main() {
  vec3 viewDir = normalize(uEyePosition - vWorldPosition);
  vec3 normal = normalize(vNormal);
  
  // Fresnel for reflection/refraction blend
  float F = fresnel(viewDir, normal);
  
  // Reflection
  vec3 reflectDir = reflect(-viewDir, normal);
  vec3 reflectionColor = textureCube(uSkybox, reflectDir).rgb;
  
  // Add specular highlight from sun
  float specular = pow(max(0.0, dot(reflectDir, uLightDir)), uSpecularPower);
  vec3 specularColor = uLightColor * specular * uSpecularIntensity;
  
  // Refraction (water depth coloring)
  vec3 refractDir = refract(-viewDir, normal, IOR_AIR / IOR_WATER);
  float depth = max(0.0, -vHeight);
  float depthFactor = 1.0 - exp(-depth * 2.0);
  vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);
  
  // Subsurface scattering
  vec3 sss = subsurfaceScatter(uLightDir, viewDir, normal, 1.0 - depthFactor);
  
  // Caustics (sampled on the water surface looking down)
  vec2 causticsUV = vWorldPosition.xz * 0.1 + normal.xz * 0.05;
  vec3 caustics = texture2D(uCaustics, causticsUV).rgb * (1.0 - depthFactor) * uLightIntensity;
  
  // Combine reflection and refraction
  vec3 baseColor = mix(waterColor + caustics, reflectionColor, F * uReflectivity);
  baseColor += specularColor + sss;
  
  // Foam
  float foam = vFoamFactor * uFoamIntensity;
  vec2 foamUV = vWorldPosition.xz * 0.5;
  float foamTex = texture2D(uFoamTexture, foamUV).r;
  foam *= foamTex;
  baseColor = mix(baseColor, uFoamColor, clamp(foam, 0.0, 1.0));
  
  // Atmospheric fog
  float dist = length(uEyePosition - vWorldPosition);
  float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  baseColor = mix(baseColor, uFogColor, fogFactor);
  
  gl_FragColor = vec4(baseColor, 1.0);
}
`;

// Simplified ocean for underwater rendering
export const OCEAN_UNDERWATER_FRAGMENT = /* glsl */ `
precision highp float;

const float IOR_AIR = 1.0;
const float IOR_WATER = 1.333;

uniform vec3 uEyePosition;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uLightIntensity;

uniform samplerCube uSkybox;
uniform sampler2D uCaustics;

uniform vec3 uUnderwaterColor;
uniform float uUnderwaterFogDensity;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vHeight;

void main() {
  vec3 viewDir = normalize(uEyePosition - vWorldPosition);
  vec3 normal = -normalize(vNormal); // Flip for underwater
  
  // Refract to see above water
  vec3 refractDir = refract(-viewDir, normal, IOR_WATER / IOR_AIR);
  vec3 aboveWaterColor = textureCube(uSkybox, refractDir).rgb;
  
  // Total internal reflection
  float criticalAngle = asin(IOR_AIR / IOR_WATER);
  float viewAngle = acos(dot(viewDir, normal));
  float reflectionAmount = smoothstep(criticalAngle - 0.2, criticalAngle, viewAngle);
  
  vec3 reflectDir = reflect(-viewDir, normal);
  vec3 reflectionColor = textureCube(uSkybox, reflectDir).rgb * 0.5 + uUnderwaterColor * 0.5;
  
  vec3 color = mix(aboveWaterColor, reflectionColor, reflectionAmount);
  
  // Caustics from above
  vec2 causticsUV = vWorldPosition.xz * 0.1;
  vec3 caustics = texture2D(uCaustics, causticsUV).rgb * uLightIntensity * 2.0;
  color += caustics * (1.0 - reflectionAmount);
  
  // Underwater fog
  float dist = length(uEyePosition - vWorldPosition);
  float fogFactor = 1.0 - exp(-dist * uUnderwaterFogDensity);
  color = mix(color, uUnderwaterColor, clamp(fogFactor, 0.0, 0.9));
  
  gl_FragColor = vec4(color, 1.0);
}
`;
