/**
 * Enhanced Gerstner Wave System - Hyperrealistic ocean wave displacement
 * Implements authentic ocean physics with configurable wave spectra and LOD support
 * Per Encyclopedia Vol II: Hybrid LOD Architecture
 */

// GLSL Gerstner wave functions for vertex displacement
export const GERSTNER_WAVE_FUNCTIONS = /* glsl */ `
  #ifndef GERSTNER_PI_DEFINED
  #define GERSTNER_PI_DEFINED
  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;
  #endif
  
  // Wave spectrum parameters (JONSWAP-inspired)
  struct GerstnerWave {
    vec2 direction;     // Normalized wave direction
    float steepness;    // Q factor (0-1, controls choppiness)
    float wavelength;   // Lambda in meters
    float amplitude;    // Wave height
    float speed;        // Phase speed multiplier
  };
  
  // Physics constants
  const float GRAVITY = 9.81;
  
  // Single Gerstner wave calculation with full displacement
  vec3 gerstnerWave(vec2 position, float time, GerstnerWave wave, inout vec3 normal) {
    float k = TAU / wave.wavelength;
    float c = sqrt(GRAVITY / k); // Deep water dispersion relation
    float f = k * (dot(wave.direction, position) - c * wave.speed * time);
    float a = wave.steepness / k;
    
    float sinF = sin(f);
    float cosF = cos(f);
    
    vec3 offset = vec3(
      wave.direction.x * a * cosF,
      wave.amplitude * sinF,
      wave.direction.y * a * cosF
    );
    
    // Analytical normal contribution (Jacobian-based)
    normal.x -= wave.direction.x * wave.amplitude * k * cosF;
    normal.z -= wave.direction.y * wave.amplitude * k * cosF;
    normal.y -= wave.steepness * sinF;
    
    return offset;
  }
  
  // Wind-driven direction distribution (cosine-squared spread)
  vec2 getWaveDirection(float windRad, float spreadAngle, float index, float total) {
    float t = (index / (total - 1.0)) - 0.5; // -0.5 to 0.5
    float angleOffset = t * spreadAngle;
    return vec2(cos(windRad + angleOffset), sin(windRad + angleOffset));
  }
  
  // JONSWAP-like spectrum amplitude distribution
  float getSpectrumAmplitude(float wavelength, float peakWavelength, float windSpeed) {
    float alpha = 0.0081; // Phillips constant
    float gamma = 3.3; // Peak enhancement
    float sigma = wavelength > peakWavelength ? 0.09 : 0.07;
    
    float omega = sqrt(GRAVITY * TAU / wavelength);
    float omegaP = sqrt(GRAVITY * TAU / peakWavelength);
    
    float phillips = alpha * GRAVITY * GRAVITY / pow(omega, 5.0);
    float pierson = exp(-1.25 * pow(omegaP / omega, 4.0));
    
    float r = exp(-pow(omega - omegaP, 2.0) / (2.0 * sigma * sigma * omegaP * omegaP));
    float jonswap = phillips * pierson * pow(gamma, r);
    
    return sqrt(2.0 * jonswap * 0.1); // Convert spectrum to amplitude
  }
  
  // Calculate combined Gerstner wave offset and normal (8 wave layers)
  vec4 calculateGerstnerWaves(vec2 worldPos, float time, float amplitude, float steepness, float windDir) {
    vec3 offset = vec3(0.0);
    vec3 normal = vec3(0.0, 1.0, 0.0);
    
    // Wind direction in radians
    float windRad = windDir * PI / 180.0;
    vec2 primaryDir = vec2(cos(windRad), sin(windRad));
    
    // Wave 1: Primary swell (longest, most energy)
    GerstnerWave wave1;
    wave1.direction = primaryDir;
    wave1.steepness = steepness * 0.8;
    wave1.wavelength = 60.0;
    wave1.amplitude = amplitude * 1.2;
    wave1.speed = 1.0;
    offset += gerstnerWave(worldPos, time, wave1, normal);
    
    // Wave 2: Secondary swell (slightly off-angle)
    GerstnerWave wave2;
    wave2.direction = normalize(primaryDir + vec2(0.3, -0.2));
    wave2.steepness = steepness * 0.6;
    wave2.wavelength = 40.0;
    wave2.amplitude = amplitude * 0.8;
    wave2.speed = 1.1;
    offset += gerstnerWave(worldPos, time, wave2, normal);
    
    // Wave 3: Cross-swell
    GerstnerWave wave3;
    wave3.direction = normalize(vec2(-primaryDir.y, primaryDir.x) * 0.7 + primaryDir * 0.3);
    wave3.steepness = steepness * 0.5;
    wave3.wavelength = 25.0;
    wave3.amplitude = amplitude * 0.5;
    wave3.speed = 1.2;
    offset += gerstnerWave(worldPos, time, wave3, normal);
    
    // Wave 4: Medium wind waves
    GerstnerWave wave4;
    wave4.direction = normalize(primaryDir + vec2(-0.1, 0.4));
    wave4.steepness = steepness * 0.4;
    wave4.wavelength = 15.0;
    wave4.amplitude = amplitude * 0.35;
    wave4.speed = 1.3;
    offset += gerstnerWave(worldPos, time, wave4, normal);
    
    // Wave 5: Short chop
    GerstnerWave wave5;
    wave5.direction = normalize(primaryDir + vec2(0.5, 0.1));
    wave5.steepness = steepness * 0.3;
    wave5.wavelength = 8.0;
    wave5.amplitude = amplitude * 0.2;
    wave5.speed = 1.4;
    offset += gerstnerWave(worldPos, time, wave5, normal);
    
    // Wave 6: Fine detail ripples
    GerstnerWave wave6;
    wave6.direction = normalize(primaryDir * 0.8 + vec2(-0.2, 0.6));
    wave6.steepness = steepness * 0.25;
    wave6.wavelength = 4.0;
    wave6.amplitude = amplitude * 0.12;
    wave6.speed = 1.6;
    offset += gerstnerWave(worldPos, time, wave6, normal);
    
    // Wave 7: Micro-chop
    GerstnerWave wave7;
    wave7.direction = normalize(vec2(-primaryDir.y * 0.5, primaryDir.x));
    wave7.steepness = steepness * 0.2;
    wave7.wavelength = 2.0;
    wave7.amplitude = amplitude * 0.06;
    wave7.speed = 1.8;
    offset += gerstnerWave(worldPos, time, wave7, normal);
    
    // Wave 8: Ultra-fine detail
    GerstnerWave wave8;
    wave8.direction = normalize(primaryDir + vec2(0.7, -0.3));
    wave8.steepness = steepness * 0.15;
    wave8.wavelength = 1.0;
    wave8.amplitude = amplitude * 0.03;
    wave8.speed = 2.0;
    offset += gerstnerWave(worldPos, time, wave8, normal);
    
    normal = normalize(normal);
    
    // Foam factor based on wave steepness and height
    float jacobian = 1.0 - steepness * (
      sin(TAU / 60.0 * (dot(primaryDir, worldPos) - time)) +
      sin(TAU / 40.0 * (dot(normalize(primaryDir + vec2(0.3, -0.2)), worldPos) - time * 1.1)) * 0.5
    );
    float foamFactor = pow(max(0.0, 1.0 - jacobian), 2.0) + pow(max(0.0, offset.y / (amplitude * 2.0)), 2.0);
    
    return vec4(offset, foamFactor);
  }
  
  // LOD-aware Gerstner waves (fewer waves at distance)
  vec4 calculateGerstnerWavesLOD(vec2 worldPos, float time, float amplitude, float steepness, float windDir, float lodFactor) {
    vec3 offset = vec3(0.0);
    vec3 normal = vec3(0.0, 1.0, 0.0);
    
    float windRad = windDir * PI / 180.0;
    vec2 primaryDir = vec2(cos(windRad), sin(windRad));
    
    // Number of waves based on LOD (1.0 = close/full detail, 0.0 = far/minimal)
    int numWaves = int(mix(2.0, 8.0, lodFactor));
    
    // Wave parameters arrays (precomputed for consistency)
    float wavelengths[8];
    wavelengths[0] = 60.0;
    wavelengths[1] = 40.0;
    wavelengths[2] = 25.0;
    wavelengths[3] = 15.0;
    wavelengths[4] = 8.0;
    wavelengths[5] = 4.0;
    wavelengths[6] = 2.0;
    wavelengths[7] = 1.0;
    
    float amplitudes[8];
    amplitudes[0] = 1.2;
    amplitudes[1] = 0.8;
    amplitudes[2] = 0.5;
    amplitudes[3] = 0.35;
    amplitudes[4] = 0.2;
    amplitudes[5] = 0.12;
    amplitudes[6] = 0.06;
    amplitudes[7] = 0.03;
    
    float steepnesses[8];
    steepnesses[0] = 0.8;
    steepnesses[1] = 0.6;
    steepnesses[2] = 0.5;
    steepnesses[3] = 0.4;
    steepnesses[4] = 0.3;
    steepnesses[5] = 0.25;
    steepnesses[6] = 0.2;
    steepnesses[7] = 0.15;
    
    float speeds[8];
    speeds[0] = 1.0;
    speeds[1] = 1.1;
    speeds[2] = 1.2;
    speeds[3] = 1.3;
    speeds[4] = 1.4;
    speeds[5] = 1.6;
    speeds[6] = 1.8;
    speeds[7] = 2.0;
    
    for (int i = 0; i < 8; i++) {
      if (i >= numWaves) break;
      
      // Vary direction for each wave
      float angleOffset = float(i) * 0.3 - 0.6;
      vec2 dir = normalize(vec2(
        cos(windRad + angleOffset),
        sin(windRad + angleOffset)
      ));
      
      // Add cross-waves for waves 2 and 5
      if (i == 2 || i == 5) {
        dir = normalize(vec2(-primaryDir.y, primaryDir.x) * 0.7 + primaryDir * 0.3);
      }
      
      GerstnerWave wave;
      wave.direction = dir;
      wave.steepness = steepness * steepnesses[i];
      wave.wavelength = wavelengths[i];
      wave.amplitude = amplitude * amplitudes[i];
      wave.speed = speeds[i];
      
      offset += gerstnerWave(worldPos, time, wave, normal);
    }
    
    normal = normalize(normal);
    float foamFactor = pow(max(0.0, offset.y / (amplitude * 2.0)), 2.0);
    
    return vec4(offset, foamFactor);
  }
  
  // Get Gerstner wave normal only (for normal mapping)
  vec3 calculateGerstnerNormal(vec2 worldPos, float time, float amplitude, float steepness, float windDir) {
    vec3 normal = vec3(0.0, 1.0, 0.0);
    vec3 dummy;
    
    float windRad = windDir * PI / 180.0;
    vec2 primaryDir = vec2(cos(windRad), sin(windRad));
    
    // Calculate just the primary waves for normal
    GerstnerWave wave1;
    wave1.direction = primaryDir;
    wave1.steepness = steepness * 0.8;
    wave1.wavelength = 60.0;
    wave1.amplitude = amplitude * 1.2;
    wave1.speed = 1.0;
    gerstnerWave(worldPos, time, wave1, normal);
    
    GerstnerWave wave2;
    wave2.direction = normalize(primaryDir + vec2(0.3, -0.2));
    wave2.steepness = steepness * 0.6;
    wave2.wavelength = 40.0;
    wave2.amplitude = amplitude * 0.8;
    wave2.speed = 1.1;
    gerstnerWave(worldPos, time, wave2, normal);
    
    GerstnerWave wave3;
    wave3.direction = normalize(vec2(-primaryDir.y, primaryDir.x) * 0.7 + primaryDir * 0.3);
    wave3.steepness = steepness * 0.5;
    wave3.wavelength = 25.0;
    wave3.amplitude = amplitude * 0.5;
    wave3.speed = 1.2;
    gerstnerWave(worldPos, time, wave3, normal);
    
    return normalize(normal);
  }
`;

// Simplex noise for fine detail
export const NOISE_FUNCTIONS = /* glsl */ `
  // Simplex 2D noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), 
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  // FBM (Fractal Brownian Motion) for realistic detail
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value / maxValue;
  }
  
  // Flowing noise for detail waves
  float flowNoise(vec2 uv, float time, float flowSpeed) {
    vec2 flow = vec2(time * flowSpeed, time * flowSpeed * 0.7);
    float n1 = snoise(uv * 2.0 + flow);
    float n2 = snoise(uv * 4.0 - flow * 1.3);
    float n3 = snoise(uv * 8.0 + flow * 0.5);
    return n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  }
  
  // Detail normal perturbation (L0 layer - shading only)
  vec3 getDetailNormal(vec2 uv, float time, float scale, float strength) {
    float eps = 0.01;
    float h = flowNoise(uv * scale, time, 0.1);
    float hx = flowNoise((uv + vec2(eps, 0.0)) * scale, time, 0.1);
    float hz = flowNoise((uv + vec2(0.0, eps)) * scale, time, 0.1);
    
    vec3 normal;
    normal.x = (h - hx) * strength / eps;
    normal.z = (h - hz) * strength / eps;
    normal.y = 1.0;
    
    return normalize(normal);
  }
`;

// Infinite ocean vertex shader with Gerstner waves
export const INFINITE_OCEAN_VERTEX = /* glsl */ `
  uniform sampler2D water;
  uniform float time;
  uniform float amplitude;
  uniform float steepness;
  uniform float windDirection;
  uniform float oceanScale;
  uniform vec3 cameraPosition;
  uniform vec2 tileOffset;
  uniform float lodLevel;
  
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUV;
  varying float vFoamFactor;
  varying float vWaveHeight;
  varying float vDistanceToCamera;
  
  ${GERSTNER_WAVE_FUNCTIONS}
  
  void main() {
    // Get vertex position in world space
    vec3 worldPos = gl_Vertex.xyz;
    worldPos.xz += tileOffset;
    worldPos.xz *= oceanScale;
    
    // Sample heightfield simulation at local position
    vec2 simUV = gl_Vertex.xy * 0.5 + 0.5;
    vec4 info = texture2D(water, simUV);
    
    // Calculate distance to camera for LOD
    float distToCamera = length(worldPos.xz - cameraPosition.xz);
    float lodFactor = 1.0 - smoothstep(0.0, 2000.0, distToCamera);
    
    // Calculate Gerstner waves with LOD
    vec4 gerstnerResult = calculateGerstnerWavesLOD(
      worldPos.xz, time, amplitude, steepness, windDirection, lodFactor
    );
    
    // Apply displacement
    worldPos.x += gerstnerResult.x;
    worldPos.z += gerstnerResult.z;
    worldPos.y = info.r + gerstnerResult.y;
    
    // Pass to fragment shader
    vPosition = worldPos;
    vWorldPosition = worldPos;
    vUV = simUV;
    vFoamFactor = gerstnerResult.w;
    vWaveHeight = worldPos.y;
    vDistanceToCamera = distToCamera;
    
    gl_Position = gl_ModelViewProjectionMatrix * vec4(worldPos, 1.0);
  }
`;

export default {
  GERSTNER_WAVE_FUNCTIONS,
  NOISE_FUNCTIONS,
  INFINITE_OCEAN_VERTEX
};
