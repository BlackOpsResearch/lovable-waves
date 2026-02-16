/**
 * Physically-Inspired Analytical Sky Shaders
 * 
 * Uses a robust analytical model (no ray-marching, no large-number precision issues).
 * Produces visually convincing Rayleigh/Mie colors without numerical instability.
 * 
 * References:
 * - Preetham, Shirley, Smits "A Practical Analytic Model for Daylight" (1999)
 * - Bruneton & Neyret "Precomputed Atmospheric Scattering" (2008) — simplified
 */

// ═══════════════════════════════════════════════════════════════
// SKY DOME VERTEX SHADER
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SKY_VERT = `
  varying vec3 v_worldDir;
  void main() {
    v_worldDir = normalize(gl_Vertex.xyz);
    vec4 pos = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 500.0, 1.0);
    // Force to far plane (z = w * 0.9999 to pass LEQUAL depth test)
    gl_Position = vec4(pos.xy, pos.w * 0.9999, pos.w);
  }
`;

// ═══════════════════════════════════════════════════════════════
// SKY DOME FRAGMENT SHADER — Analytical Preetham-inspired model
// No ray-marching, no huge constants, robust on all GPUs.
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SKY_FRAG = `
  uniform vec3 u_sunDir;
  uniform vec3 u_sunColor;
  uniform float u_sunIntensity;
  uniform float u_turbidity;
  uniform float u_rayleighScale;
  uniform float u_mieCoeff;
  uniform float u_mieG;
  uniform float u_sunElevation;
  
  varying vec3 v_worldDir;
  
  const float PI = 3.14159265359;
  
  // Henyey-Greenstein phase function
  float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * PI * pow(denom, 1.5));
  }
  
  // Rayleigh phase
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
  }
  
  void main() {
    vec3 dir = normalize(v_worldDir);
    vec3 sunDir = normalize(u_sunDir);
    
    float cosTheta = dot(dir, sunDir);
    float sunAltitude = sunDir.y; // -1 to 1
    float viewAltitude = dir.y;   // -1 to 1
    
    // ── Sun influence ──
    float sunFade = clamp(sunAltitude * 5.0 + 0.5, 0.0, 1.0); // 0 at night, 1 during day
    float sunsetFade = clamp(1.0 - abs(sunAltitude) * 5.0, 0.0, 1.0); // peaks near horizon
    
    // ── Rayleigh scattering (blue sky) ──
    // Higher altitude = more blue, horizon = whiter/warmer
    float skyGradient = max(viewAltitude, 0.0);
    float rayleighStrength = u_rayleighScale * sunFade;
    
    // Deep blue zenith, lighter blue at horizon
    vec3 zenithColor = vec3(0.05, 0.15, 0.45) * rayleighStrength;
    vec3 horizonBlue = vec3(0.35, 0.55, 0.75) * rayleighStrength;
    
    // Turbidity warms and desaturates the sky
    float turbidityEffect = u_turbidity * 0.08;
    horizonBlue = mix(horizonBlue, vec3(0.6, 0.55, 0.5) * rayleighStrength, turbidityEffect);
    
    vec3 rayleighColor = mix(horizonBlue, zenithColor, pow(skyGradient, 0.4));
    
    // ── Mie scattering (haze/glow around sun) ──
    float miePhase = hgPhase(cosTheta, u_mieG);
    float mieStrength = u_mieCoeff * 200.0; // scale for visibility
    vec3 mieColor = vec3(1.0, 0.85, 0.6) * miePhase * mieStrength * sunFade;
    
    // ── Sunset/sunrise coloring ──
    // Sun transmittance through atmosphere (more red at low angles)
    float opticalDepth = 1.0 / max(sunAltitude + 0.15, 0.01);
    opticalDepth = min(opticalDepth, 40.0);
    
    vec3 sunTransmittance = exp(-vec3(0.08, 0.18, 0.40) * opticalDepth * 0.15 * u_turbidity);
    
    // Warm horizon glow during sunset
    vec3 sunsetGlow = vec3(0.0);
    if (sunsetFade > 0.0) {
      float horizonProximity = exp(-abs(viewAltitude) * 4.0);
      float sunProximity = pow(max(cosTheta, 0.0), 2.0);
      vec3 sunsetColor = vec3(1.0, 0.4, 0.1) * sunsetFade * horizonProximity;
      vec3 twilightColor = vec3(0.6, 0.3, 0.5) * sunsetFade * horizonProximity * (1.0 - sunProximity);
      sunsetGlow = (sunsetColor * sunProximity + twilightColor * 0.3) * u_sunIntensity * 0.15;
    }
    
    // ── Combine sky color ──
    vec3 skyColor = rayleighColor * sunTransmittance * u_sunIntensity * 0.3
                  + mieColor * sunTransmittance * u_sunIntensity * 0.1
                  + sunsetGlow;
    
    // ── Sun disk with limb darkening ──
    float sunAngularRadius = 0.0047; // ~0.27°
    float sunDisk = smoothstep(cos(sunAngularRadius * 3.0), cos(sunAngularRadius * 0.5), cosTheta);
    if (sunDisk > 0.0) {
      float limbDist = clamp((cosTheta - cos(sunAngularRadius)) / (1.0 - cos(sunAngularRadius)), 0.0, 1.0);
      float limbDarkening = 1.0 - 0.6 * (1.0 - sqrt(limbDist));
      skyColor += u_sunColor * sunTransmittance * sunDisk * limbDarkening * u_sunIntensity * 2.0;
    }
    
    // ── Corona glow ──
    float corona = pow(max(cosTheta, 0.0), 128.0);
    skyColor += u_sunColor * sunTransmittance * corona * u_sunIntensity * 0.3;
    
    // ── Below horizon: dark ocean/ground reflection ──
    if (viewAltitude < 0.0) {
      vec3 horizonDir = normalize(vec3(dir.x, 0.001, dir.z));
      float hCosTheta = dot(horizonDir, sunDir);
      float hSunFade = clamp(sunAltitude * 5.0 + 0.5, 0.0, 1.0);
      vec3 horizonColor = mix(
        vec3(0.35, 0.55, 0.75) * u_rayleighScale,
        vec3(0.05, 0.15, 0.45) * u_rayleighScale,
        0.3
      ) * sunTransmittance * u_sunIntensity * 0.3 * hSunFade;
      
      float belowFade = clamp(-viewAltitude * 6.0, 0.0, 1.0);
      vec3 groundColor = horizonColor * 0.12; // dark ocean
      skyColor = mix(horizonColor * 0.6, groundColor, belowFade);
    }
    
    // ── Tone mapping (ACES filmic) ──
    skyColor *= 0.7; // exposure
    vec3 a = skyColor * (skyColor + vec3(0.0245786)) - vec3(0.000090537);
    vec3 b = skyColor * (0.983729 * skyColor + vec3(0.4329510)) + vec3(0.238081);
    skyColor = max(a / b, vec3(0.0));
    
    // Gamma
    skyColor = pow(skyColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// ATMOSPHERIC FOG FUNCTIONS (for ocean surface fragment shader)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERIC_FOG_GLSL = /* glsl */ `
  vec3 computeAtmosphericFog(vec3 viewDir, vec3 sunDir, float distance, float turbidity, float rayleighScale) {
    float cosTheta = dot(normalize(viewDir), normalize(sunDir));
    
    vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6) * rayleighScale;
    float phaseR = (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
    
    float betaM = turbidity * 2e-6;
    float g = 0.76;
    float g2 = g * g;
    float phaseM = (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
    
    float sunFade = clamp(sunDir.y * 3.0 + 0.3, 0.0, 1.0);
    vec3 inscatter = (betaR * phaseR + vec3(betaM) * phaseM) * sunFade * 25.0;
    
    return inscatter;
  }
  
  vec3 applyAtmosphericPerspective(vec3 surfaceColor, vec3 viewDir, vec3 sunDir, float distance, float turbidity, float rayleighScale) {
    vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6) * rayleighScale;
    float betaM = turbidity * 2e-6;
    
    vec3 extinction = exp(-(betaR + vec3(betaM * 1.1)) * distance * 0.0003);
    vec3 fogColor = computeAtmosphericFog(viewDir, sunDir, distance, turbidity, rayleighScale);
    
    return surfaceColor * extinction + fogColor * (vec3(1.0) - extinction);
  }
`;

// ═══════════════════════════════════════════════════════════════
// SKY COLOR FUNCTION for water reflections
// ═══════════════════════════════════════════════════════════════
export const SKY_REFLECTION_GLSL = /* glsl */ `
  vec3 getAtmosphericSkyColor(vec3 dir, vec3 sunDir, float turbidity, float rayleighScale, float sunIntensity) {
    float cosTheta = dot(dir, normalize(sunDir));
    float sunFade = clamp(1.0 - exp(-sunDir.y * 10.0), 0.0, 1.0);
    float skyFade = max(dir.y, 0.0);
    
    vec3 rayleighColor = vec3(0.15, 0.35, 0.65) * rayleighScale * sunFade;
    
    float horizonGlow = exp(-skyFade * 3.0) * sunFade;
    vec3 horizonColor = mix(vec3(0.5, 0.4, 0.3), vec3(0.7, 0.5, 0.3), turbidity * 0.1) * horizonGlow;
    
    vec3 sky = mix(horizonColor, rayleighColor, pow(skyFade, 0.5 + turbidity * 0.02));
    
    float mieGlow = pow(max(cosTheta, 0.0), 8.0);
    sky += vec3(1.0, 0.7, 0.3) * mieGlow * turbidity * 0.05 * sunFade;
    
    sky += vec3(1.0, 0.95, 0.85) * pow(max(cosTheta, 0.0), 4096.0) * sunIntensity * 10.0;
    
    if (sunDir.y < 0.2 && sunDir.y > -0.1) {
      float sunsetFactor = 1.0 - smoothstep(-0.1, 0.2, sunDir.y);
      float angularDist = 1.0 - max(cosTheta, 0.0);
      sky += vec3(1.0, 0.4, 0.1) * sunsetFactor * exp(-angularDist * 2.0) * 0.5;
    }
    
    return sky;
  }
`;
