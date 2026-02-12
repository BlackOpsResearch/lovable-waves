/**
 * JONSWAP Spectrum — Physically-based ocean wave generation
 * 
 * Generates Gerstner wave parameters from wind speed and fetch length
 * using the JONSWAP (Joint North Sea Wave Project) spectral model.
 * 
 * References:
 * - Hasselmann et al., 1973 (JONSWAP)
 * - Tessendorf, "Simulating Ocean Water" (2001)
 * - Bruneton, "An improved ocean rendering" (2020)
 */

// GLSL functions for JONSWAP-driven Gerstner waves
export const JONSWAP_GERSTNER_FUNCTIONS = /* glsl */ `
  // Physics
  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;
  const float GRAVITY = 9.81;

  // JONSWAP spectral density S(ω)
  // α = Phillips constant, γ = peak enhancement, σ = spectral width
  float jonswapSpectrum(float omega, float omegaP, float alpha, float gamma) {
    float sigma = omega <= omegaP ? 0.07 : 0.09;
    float r = exp(-pow(omega - omegaP, 2.0) / (2.0 * sigma * sigma * omegaP * omegaP));
    
    // Pierson-Moskowitz base
    float pm = (alpha * GRAVITY * GRAVITY / pow(omega, 5.0))
             * exp(-1.25 * pow(omegaP / omega, 4.0));
    
    // JONSWAP peak enhancement
    return pm * pow(gamma, r);
  }

  // Compute peak angular frequency from wind speed and fetch
  // ωₚ = 22 × (g²/(U×F))^(1/3)
  float peakOmega(float windSpeed, float fetch) {
    float ws = max(windSpeed, 0.5);
    return 22.0 * pow((GRAVITY * GRAVITY) / (ws * fetch), 0.333);
  }
  
  // Phillips constant from wind speed
  float phillipsAlpha(float windSpeed, float fetch) {
    float ws = max(windSpeed, 0.5);
    float dimlessFetch = GRAVITY * fetch / (ws * ws);
    return 0.076 * pow(dimlessFetch, -0.22);
  }

  // Single Gerstner wave displacement with analytical normal
  vec3 gerstnerWaveJONSWAP(vec2 pos, float t, vec2 dir, float omega, float amp, float steep, inout vec3 normal) {
    float k = omega * omega / GRAVITY; // deep water dispersion: ω² = gk
    float phase = k * dot(dir, pos) - omega * t;
    float sinP = sin(phase);
    float cosP = cos(phase);
    float Q = steep / max(k, 0.001);
    
    // Analytical normal contribution
    normal.x -= dir.x * amp * k * cosP;
    normal.z -= dir.y * amp * k * cosP;
    normal.y -= steep * sinP;
    
    return vec3(dir.x * Q * cosP, amp * sinP, dir.y * Q * cosP);
  }

  // JONSWAP-driven multi-wave Gerstner displacement
  // windSpeed in m/s, fetch in meters, windDir in degrees
  vec4 calculateJONSWAPWaves(
    vec2 worldPos, float time,
    float windSpeed, float windDir, float fetch,
    float amplitudeScale, float steepnessScale,
    float lodFactor
  ) {
    vec3 offset = vec3(0.0);
    vec3 normal = vec3(0.0, 1.0, 0.0);
    
    float windRad = windDir * PI / 180.0;
    vec2 primaryDir = vec2(cos(windRad), sin(windRad));
    
    // Spectrum parameters from wind/fetch
    float omegaP = peakOmega(windSpeed, fetch);
    float alpha = phillipsAlpha(windSpeed, fetch);
    float gamma = 3.3; // Standard JONSWAP peak enhancement
    
    // Number of wave components (LOD-adaptive)
    int numWaves = int(mix(3.0, 12.0, lodFactor));
    
    // Wave component frequencies (logarithmically spaced around peak)
    // Range: 0.5ωₚ to 4ωₚ
    float omegaMin = omegaP * 0.5;
    float omegaMax = omegaP * 4.0;
    float logMin = log(omegaMin);
    float logMax = log(omegaMax);
    
    float totalEnergy = 0.0;
    
    // Pre-defined direction offsets for wave spreading
    // Cosine-squared directional spread
    float spreadAngles[12];
    spreadAngles[0]  =  0.0;
    spreadAngles[1]  =  0.15;
    spreadAngles[2]  = -0.25;
    spreadAngles[3]  =  0.4;
    spreadAngles[4]  = -0.1;
    spreadAngles[5]  =  0.55;
    spreadAngles[6]  = -0.45;
    spreadAngles[7]  =  0.7;
    spreadAngles[8]  = -0.6;
    spreadAngles[9]  =  0.3;
    spreadAngles[10] = -0.35;
    spreadAngles[11] =  0.8;
    
    float speedMults[12];
    speedMults[0]  = 1.0;
    speedMults[1]  = 1.05;
    speedMults[2]  = 1.1;
    speedMults[3]  = 0.95;
    speedMults[4]  = 1.15;
    speedMults[5]  = 0.9;
    speedMults[6]  = 1.2;
    speedMults[7]  = 0.85;
    speedMults[8]  = 1.25;
    speedMults[9]  = 1.08;
    speedMults[10] = 0.92;
    speedMults[11] = 1.3;
    
    for (int i = 0; i < 12; i++) {
      if (i >= numWaves) break;
      
      // Logarithmically spaced frequency
      float t = float(i) / max(float(numWaves - 1), 1.0);
      float omega = exp(mix(logMin, logMax, t));
      
      // JONSWAP spectral amplitude
      float S = jonswapSpectrum(omega, omegaP, alpha, gamma);
      float dOmega = (logMax - logMin) / float(numWaves) * omega; // Jacobian for log spacing
      float amplitude = sqrt(2.0 * S * dOmega) * amplitudeScale;
      
      // Direction with cosine-squared spread
      float spreadAngle = spreadAngles[i] * (1.0 + 0.5 * (omega / omegaP - 1.0));
      vec2 dir = vec2(
        cos(windRad + spreadAngle),
        sin(windRad + spreadAngle)
      );
      
      // Steepness (higher for shorter waves)
      float steepPerWave = steepnessScale * min(1.0, 0.4 + 0.6 * omega / omegaP);
      
      offset += gerstnerWaveJONSWAP(worldPos, time * speedMults[i], dir, omega, amplitude, steepPerWave, normal);
      totalEnergy += amplitude;
    }
    
    normal = normalize(normal);
    
    // Foam diagnostic: Jacobian-based breaking detection
    float foamFactor = 0.0;
    if (totalEnergy > 0.001) {
      // Vertical displacement relative to expected height
      float relHeight = offset.y / max(totalEnergy * 2.0, 0.01);
      foamFactor = pow(max(0.0, relHeight), 2.0);
      
      // Breaking criterion: when lateral compression exceeds threshold
      float lateralCompression = length(vec2(offset.x, offset.z)) / max(totalEnergy, 0.01);
      foamFactor += smoothstep(0.8, 1.2, lateralCompression) * 0.5;
    }
    
    return vec4(offset, foamFactor);
  }
  
  // Simplified version for CPU-side height readback (3 primary waves)
  vec4 calculateJONSWAPSimple(vec2 worldPos, float time, float windSpeed, float windDir, float fetch, float ampScale) {
    float windRad = windDir * PI / 180.0;
    vec2 wd = vec2(cos(windRad), sin(windRad));
    float omegaP = peakOmega(windSpeed, fetch);
    float alpha = phillipsAlpha(windSpeed, fetch);
    
    vec3 offset = vec3(0.0);
    vec3 normal = vec3(0.0, 1.0, 0.0);
    
    // 3 dominant waves around peak
    float S1 = jonswapSpectrum(omegaP, omegaP, alpha, 3.3);
    float S2 = jonswapSpectrum(omegaP * 0.7, omegaP, alpha, 3.3);
    float S3 = jonswapSpectrum(omegaP * 1.4, omegaP, alpha, 3.3);
    
    float a1 = sqrt(2.0 * S1 * omegaP * 0.3) * ampScale;
    float a2 = sqrt(2.0 * S2 * omegaP * 0.3) * ampScale;
    float a3 = sqrt(2.0 * S3 * omegaP * 0.3) * ampScale;
    
    offset += gerstnerWaveJONSWAP(worldPos, time, wd, omegaP, a1, 0.4, normal);
    offset += gerstnerWaveJONSWAP(worldPos, time * 1.1, normalize(wd + vec2(0.3, -0.2)), omegaP * 0.7, a2, 0.3, normal);
    offset += gerstnerWaveJONSWAP(worldPos, time * 1.2, normalize(vec2(-wd.y, wd.x) * 0.5 + wd * 0.5), omegaP * 1.4, a3, 0.25, normal);
    
    return vec4(offset, 0.0);
  }
`;

/**
 * CPU-side JONSWAP spectrum calculations for height readback
 */
export function computeJONSWAPHeight(
  worldX: number, worldZ: number, time: number,
  windSpeed: number, windDir: number, fetch: number,
  amplitudeScale: number
): number {
  const G = 9.81;
  const ws = Math.max(windSpeed, 0.5);
  const omegaP = 22 * Math.pow((G * G) / (ws * fetch), 1/3);
  const alpha = 0.076 * Math.pow(G * fetch / (ws * ws), -0.22);
  const gamma = 3.3;
  
  const windRad = windDir * Math.PI / 180;
  const wd = [Math.cos(windRad), Math.sin(windRad)];
  
  function jonswap(omega: number): number {
    const sigma = omega <= omegaP ? 0.07 : 0.09;
    const r = Math.exp(-Math.pow(omega - omegaP, 2) / (2 * sigma * sigma * omegaP * omegaP));
    const pm = (alpha * G * G / Math.pow(omega, 5)) * Math.exp(-1.25 * Math.pow(omegaP / omega, 4));
    return pm * Math.pow(gamma, r);
  }
  
  function wave(pos: number[], t: number, dir: number[], omega: number, amp: number): number {
    const k = omega * omega / G;
    const phase = k * (dir[0] * pos[0] + dir[1] * pos[1]) - omega * t;
    return amp * Math.sin(phase);
  }
  
  const pos = [worldX, worldZ];
  const S1 = jonswap(omegaP);
  const S2 = jonswap(omegaP * 0.7);
  const S3 = jonswap(omegaP * 1.4);
  
  const a1 = Math.sqrt(2 * S1 * omegaP * 0.3) * amplitudeScale;
  const a2 = Math.sqrt(2 * S2 * omegaP * 0.3) * amplitudeScale;
  const a3 = Math.sqrt(2 * S3 * omegaP * 0.3) * amplitudeScale;
  
  const len2 = Math.sqrt((wd[0] + 0.3) ** 2 + (wd[1] - 0.2) ** 2);
  const wd2 = [(wd[0] + 0.3) / len2, (wd[1] - 0.2) / len2];
  const cx = -wd[1] * 0.5 + wd[0] * 0.5;
  const cz = wd[0] * 0.5 + wd[1] * 0.5;
  const len3 = Math.sqrt(cx * cx + cz * cz);
  const wd3 = [cx / len3, cz / len3];
  
  let h = 0;
  h += wave(pos, time, wd, omegaP, a1);
  h += wave(pos, time * 1.1, wd2, omegaP * 0.7, a2);
  h += wave(pos, time * 1.2, wd3, omegaP * 1.4, a3);
  
  return h;
}
