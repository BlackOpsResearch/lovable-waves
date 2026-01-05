/**
 * Volumetric Cloud Shaders
 * Raymarched volumetric clouds with 3D noise
 */

export const CLOUD_VERTEX_SHADER = /* glsl */ `
uniform vec3 cameraPos;

varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPos, 1.0)).xyz;
  vDirection = position - vOrigin;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const CLOUD_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
precision highp sampler3D;

in vec3 vOrigin;
in vec3 vDirection;

out vec4 fragColor;

// Textures
uniform highp sampler3D uNoiseTexture;
uniform sampler2D uBlueNoise;

// Scene
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uLightDir;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform float uTime;

// Cloud parameters
uniform float uCoverage;
uniform float uDensity;
uniform float uCloudScale;
uniform vec3 uWindSpeed;
uniform int uRaymarchSteps;
uniform int uLightSteps;
uniform float uOpacity;

// Container
uniform vec3 uBoundsMin;
uniform vec3 uBoundsMax;

// Blue noise size
uniform vec2 uBlueNoiseSize;

#define PI 3.14159265359

// Phase function for cloud scattering
float HenyeyGreenstein(float g, float cosTheta) {
  float g2 = g * g;
  return (1.0 / (4.0 * PI)) * ((1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

float dualLobePhase(float g, float cosTheta) {
  return mix(HenyeyGreenstein(-g * 0.5, cosTheta), HenyeyGreenstein(g, cosTheta), 0.7);
}

// Ray-box intersection
vec2 hitBox(vec3 origin, vec3 dir, vec3 boxMin, vec3 boxMax) {
  vec3 invDir = 1.0 / dir;
  vec3 tMin = (boxMin - origin) * invDir;
  vec3 tMax = (boxMax - origin) * invDir;
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  return vec2(tNear, tFar);
}

// Sample 3D noise texture with animation
float sampleNoise(vec3 p) {
  vec3 animatedPos = p + uWindSpeed * uTime;
  vec3 texCoord = animatedPos * uCloudScale;
  return texture(uNoiseTexture, fract(texCoord)).r;
}

// Get cloud density at a point
float getCloudDensity(vec3 p) {
  // Normalize position to 0-1 range within bounds
  vec3 normalizedPos = (p - uBoundsMin) / (uBoundsMax - uBoundsMin);
  
  // Height gradient for realistic cloud shape
  float heightGradient = normalizedPos.y;
  float bottomFade = smoothstep(0.0, 0.2, heightGradient);
  float topFade = 1.0 - smoothstep(0.8, 1.0, heightGradient);
  float heightMask = bottomFade * topFade;
  
  // Edge fade for softer cloud boundaries
  vec3 edgeDist = min(normalizedPos, 1.0 - normalizedPos);
  float edgeFade = smoothstep(0.0, 0.15, min(min(edgeDist.x, edgeDist.y), edgeDist.z));
  
  // Sample base noise
  float noise = sampleNoise(p);
  
  // Apply coverage threshold
  float density = noise - (1.0 - uCoverage);
  density = max(0.0, density) / uCoverage;
  
  // Apply height and edge masks
  density *= heightMask * edgeFade;
  
  return density * uDensity;
}

// Calculate light energy reaching a point
float calculateLightEnergy(vec3 pos) {
  float stepLength = length(uBoundsMax - uBoundsMin) / float(uLightSteps) * 0.5;
  float accumDensity = 0.0;
  
  for (int i = 0; i < uLightSteps; i++) {
    vec3 samplePos = pos + uLightDir * (float(i) + 0.5) * stepLength;
    
    // Check if inside bounds
    if (all(greaterThan(samplePos, uBoundsMin)) && all(lessThan(samplePos, uBoundsMax))) {
      accumDensity += getCloudDensity(samplePos) * stepLength;
    }
  }
  
  return exp(-accumDensity * 2.0);
}

void main() {
  vec3 rayDir = normalize(vDirection);
  vec2 bounds = hitBox(vOrigin, rayDir, uBoundsMin, uBoundsMax);
  
  if (bounds.x >= bounds.y) {
    discard;
  }
  
  bounds.x = max(bounds.x, 0.0);
  
  float rayLength = bounds.y - bounds.x;
  float stepSize = rayLength / float(uRaymarchSteps);
  
  // Blue noise jitter to reduce banding
  vec2 noiseUV = mod(gl_FragCoord.xy, uBlueNoiseSize) / uBlueNoiseSize;
  float jitter = texture(uBlueNoise, noiseUV).r;
  
  vec3 pos = vOrigin + (bounds.x + jitter * stepSize) * rayDir;
  
  vec3 accumColor = vec3(0.0);
  vec3 transmittance = vec3(1.0);
  float mu = dot(rayDir, uLightDir);
  
  for (int i = 0; i < uRaymarchSteps; i++) {
    float density = getCloudDensity(pos);
    
    if (density > 0.001) {
      // Calculate lighting
      float lightEnergy = calculateLightEnergy(pos);
      
      // Sun contribution with phase function
      vec3 sunLight = uSunColor * uSunIntensity * lightEnergy;
      float phase = dualLobePhase(0.35, mu);
      vec3 sunScatter = sunLight * phase;
      
      // Ambient contribution
      vec3 ambientScatter = uAmbientColor * uAmbientIntensity;
      
      // Total scattering
      vec3 scattering = (sunScatter + ambientScatter) * density * stepSize;
      
      // Absorption
      vec3 absorption = exp(-density * stepSize * vec3(0.6, 0.65, 0.7) * uOpacity);
      
      // Accumulate
      accumColor += transmittance * scattering;
      transmittance *= absorption;
      
      // Early exit if opaque
      if (length(transmittance) < 0.01) break;
    }
    
    pos += rayDir * stepSize;
  }
  
  float alpha = 1.0 - (transmittance.r + transmittance.g + transmittance.b) / 3.0;
  fragColor = vec4(accumColor, alpha);
}
`;

// God rays post-processing shader
export const GODRAY_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const GODRAY_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D tDiffuse;
uniform sampler2D tOcclusion;
uniform vec2 uLightScreenPos;
uniform vec3 uSunColor;
uniform float uDensity;
uniform float uDecay;
uniform float uWeight;
uniform float uExposure;
uniform int uSamples;

varying vec2 vUv;

void main() {
  // Convert light position from NDC to UV space
  vec2 lightPos = uLightScreenPos * 0.5 + 0.5;
  
  // Direction from current pixel to light
  vec2 deltaTexCoord = (lightPos - vUv);
  deltaTexCoord /= float(uSamples);
  deltaTexCoord *= uDensity;
  
  vec2 texCoord = vUv;
  float illuminationDecay = 1.0;
  vec3 godRays = vec3(0.0);
  
  for (int i = 0; i < uSamples; i++) {
    texCoord += deltaTexCoord;
    
    // Only sample if within screen bounds
    if (texCoord.x >= 0.0 && texCoord.x <= 1.0 && texCoord.y >= 0.0 && texCoord.y <= 1.0) {
      // Sample the occlusion texture (bright where light comes through)
      float occlusion = 1.0 - texture2D(tOcclusion, texCoord).a;
      occlusion *= illuminationDecay * uWeight;
      godRays += vec3(occlusion);
    }
    
    illuminationDecay *= uDecay;
  }
  
  // Get original scene color
  vec3 sceneColor = texture2D(tDiffuse, vUv).rgb;
  
  // Add god rays
  vec3 finalColor = sceneColor + godRays * uSunColor * uExposure;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Occlusion pass shader (renders scene elements that block light)
export const OCCLUSION_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform float uOpacity;

void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, uOpacity);
}
`;
