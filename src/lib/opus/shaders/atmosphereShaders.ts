/**
 * Physically-Based Atmospheric Scattering Shaders
 * 
 * Implements Rayleigh + Mie single-scattering for the sky dome.
 * Adapted from Bruneton/Nishita models for raw WebGL GLSL 100.
 * 
 * Features:
 * - Rayleigh scattering (wavelength-dependent, blue sky)
 * - Mie scattering (aerosol forward-scattering, sun glow/haze)
 * - Henyey-Greenstein phase function
 * - Ozone absorption (sunset reddening)
 * - Sun disk with limb darkening
 * - Twilight/sunset/sunrise transitions
 * - Volumetric fog integration for ocean surface
 * 
 * References:
 * - Nishita et al., "Display of the Earth Taking into Account Atmospheric Scattering"
 * - Bruneton & Neyret, "Precomputed Atmospheric Scattering" (2008)
 * - Preetham, Shirley, Smits, "A Practical Analytic Model for Daylight" (1999)
 */

// ═══════════════════════════════════════════════════════════════
// SKY DOME VERTEX SHADER (Rayleigh/Mie atmosphere)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SKY_VERT = `
  varying vec3 v_worldDir;
  varying vec3 v_viewDir;
  void main() {
    v_worldDir = gl_Vertex.xyz;
    v_viewDir = normalize(gl_Vertex.xyz);
    vec4 pos = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
    gl_Position = vec4(pos.xy, pos.w, pos.w); // force to far plane
  }
`;

// ═══════════════════════════════════════════════════════════════
// SKY DOME FRAGMENT SHADER (full Rayleigh+Mie scattering)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SKY_FRAG = `
  uniform vec3 u_sunDir;
  uniform vec3 u_sunColor;
  uniform float u_sunIntensity;
  uniform float u_turbidity;
  uniform float u_rayleighScale;
  uniform float u_mieCoeff;
  uniform float u_mieG;
  uniform float u_sunElevation; // radians
  
  varying vec3 v_worldDir;
  varying vec3 v_viewDir;
  
  const float PI = 3.14159265359;
  
  // Physical constants (sea-level, SI-inspired but scaled for visual)
  const float EARTH_RADIUS = 6371000.0;
  const float ATMO_HEIGHT = 100000.0;
  const float ATMO_RADIUS = EARTH_RADIUS + ATMO_HEIGHT;
  
  // Rayleigh scattering coefficients at sea level [1/m] (RGB: 680nm, 550nm, 440nm)
  const vec3 RAYLEIGH_BETA = vec3(5.8e-6, 13.5e-6, 33.1e-6);
  const float RAYLEIGH_SCALE_H = 8000.0;
  
  // Mie scattering (aerosol)
  const float MIE_SCALE_H = 1200.0;
  
  // Ozone absorption cross-section (adds warmth to low-sun colors)
  const vec3 OZONE_BETA = vec3(0.65e-6, 1.88e-6, 0.085e-6);
  
  // Ray-sphere intersection (returns near/far t, or -1 if miss)
  vec2 raySphereIntersect(vec3 ro, vec3 rd, float radius) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - radius * radius;
    float disc = b * b - c;
    if (disc < 0.0) return vec2(-1.0);
    float sqrtDisc = sqrt(disc);
    return vec2(-b - sqrtDisc, -b + sqrtDisc);
  }
  
  // Rayleigh phase function
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
  }
  
  // Henyey-Greenstein phase function (Mie)
  float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * PI * pow(denom, 1.5));
  }
  
  // Kasten-Young optical air mass
  float airMass(float cosZenith) {
    float hDeg = max(0.001, asin(max(0.0, cosZenith))) * 180.0 / PI;
    float sinH = max(0.001, cosZenith);
    return min(38.0, 1.0 / (sinH + 0.50572 * pow(hDeg + 6.07995, -1.6364)));
  }
  
  vec3 computeAtmosphere(vec3 rd) {
    vec3 sunDir = normalize(u_sunDir);
    
    // Camera at sea level, looking out
    vec3 ro = vec3(0.0, EARTH_RADIUS + 10.0, 0.0);
    
    // Intersect atmosphere
    vec2 atmoHit = raySphereIntersect(ro, rd, ATMO_RADIUS);
    if (atmoHit.y < 0.0) return vec3(0.0);
    
    float t0 = max(atmoHit.x, 0.0);
    float t1 = atmoHit.y;
    
    // Check ground intersection
    vec2 groundHit = raySphereIntersect(ro, rd, EARTH_RADIUS);
    if (groundHit.x > 0.0) {
      t1 = min(t1, groundHit.x);
    }
    
    // Ray-march parameters
    const int STEPS = 16;
    float stepSize = (t1 - t0) / float(STEPS);
    
    vec3 rayleighAccum = vec3(0.0);
    vec3 mieAccum = vec3(0.0);
    float viewOptDepthR = 0.0;
    float viewOptDepthM = 0.0;
    
    // Rayleigh and Mie coefficients scaled by user controls
    vec3 betaR = RAYLEIGH_BETA * u_rayleighScale;
    float betaM = u_mieCoeff * 21e-6; // base Mie extinction scaled by coefficient
    
    for (int i = 0; i < STEPS; i++) {
      float t = t0 + (float(i) + 0.5) * stepSize;
      vec3 pos = ro + rd * t;
      float altitude = length(pos) - EARTH_RADIUS;
      
      if (altitude < 0.0) break;
      
      // Density at this altitude
      float rhoR = exp(-altitude / RAYLEIGH_SCALE_H);
      float rhoM = exp(-altitude / MIE_SCALE_H);
      
      // Accumulate view optical depth
      viewOptDepthR += rhoR * stepSize;
      viewOptDepthM += rhoM * stepSize;
      
      // Light optical depth to sun (simplified: use air mass approximation)
      float cosZenithSun = dot(normalize(pos), sunDir);
      float AM = airMass(cosZenithSun);
      float sunOptDepthR = AM * RAYLEIGH_SCALE_H;
      float sunOptDepthM = AM * MIE_SCALE_H;
      
      // Combined transmittance (view + sun)
      vec3 tau = betaR * (viewOptDepthR + sunOptDepthR)
               + vec3(betaM * 1.1) * (viewOptDepthM + sunOptDepthM); // 1.1 = extinction/scattering ratio
      vec3 attenuation = exp(-tau);
      
      // Ozone absorption (subtle reddening at high air mass)
      vec3 ozoneAtten = exp(-OZONE_BETA * AM * 25000.0 * 0.001);
      attenuation *= ozoneAtten;
      
      rayleighAccum += rhoR * attenuation * stepSize;
      mieAccum += rhoM * attenuation * stepSize;
    }
    
    // Phase functions
    float cosTheta = dot(rd, sunDir);
    float phaseR = rayleighPhase(cosTheta);
    float phaseM = hgPhase(cosTheta, u_mieG);
    
    // Final inscattered radiance
    float intensity = u_sunIntensity;
    vec3 rayleigh = rayleighAccum * betaR * phaseR * intensity;
    vec3 mie = mieAccum * vec3(betaM) * phaseM * intensity;
    
    return rayleigh + mie;
  }
  
  void main() {
    vec3 dir = normalize(v_worldDir);
    vec3 sunDir = normalize(u_sunDir);
    
    // Compute atmospheric scattering
    vec3 color = computeAtmosphere(dir);
    
    // Sun disk with limb darkening
    float cosAngle = dot(dir, sunDir);
    float sunAngularRadius = 0.00467; // ~0.533° / 2
    float sunDisk = smoothstep(cos(sunAngularRadius * 3.0), cos(sunAngularRadius * 0.5), cosAngle);
    if (sunDisk > 0.0) {
      // Limb darkening: u-coefficient ~0.6 for solar photosphere
      float limbDist = 1.0 - (acos(clamp(cosAngle, -1.0, 1.0)) / sunAngularRadius);
      limbDist = clamp(limbDist, 0.0, 1.0);
      float limbDarkening = 1.0 - 0.6 * (1.0 - sqrt(limbDist));
      
      // Sun color: warm at low elevation via transmittance
      float AM = airMass(max(0.0, sunDir.y));
      vec3 sunTrans = exp(-RAYLEIGH_BETA * u_rayleighScale * AM * RAYLEIGH_SCALE_H
                         - vec3(u_mieCoeff * 21e-6 * 1.1) * AM * MIE_SCALE_H);
      
      color += sunTrans * u_sunColor * sunDisk * limbDarkening * u_sunIntensity * 2.0;
    }
    
    // Corona glow (extended Mie forward scattering around sun)
    float corona = pow(max(cosAngle, 0.0), 256.0);
    float AM = airMass(max(0.0, sunDir.y));
    vec3 coronaTrans = exp(-RAYLEIGH_BETA * u_rayleighScale * AM * RAYLEIGH_SCALE_H * 0.5);
    color += coronaTrans * u_sunColor * corona * u_sunIntensity * 0.5;
    
    // Below horizon: ground/ocean tint (don't render pitch black)
    if (dir.y < 0.0) {
      // Reflected atmosphere from horizon band
      vec3 horizonDir = normalize(vec3(dir.x, 0.001, dir.z));
      vec3 horizonColor = computeAtmosphere(horizonDir);
      float belowFade = clamp(-dir.y * 8.0, 0.0, 1.0);
      vec3 groundColor = horizonColor * 0.15; // dark ocean reflection
      color = mix(horizonColor * 0.7, groundColor, belowFade);
    }
    
    // Tone mapping (ACES-inspired filmic)
    color = color * 0.6; // exposure
    vec3 a = color * (color + vec3(0.0245786)) - vec3(0.000090537);
    vec3 b = color * (0.983729 * color + vec3(0.4329510)) + vec3(0.238081);
    color = a / b;
    
    // Gamma correction
    color = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// ATMOSPHERIC FOG FUNCTIONS (for ocean surface fragment shader)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERIC_FOG_GLSL = /* glsl */ `
  // Compute atmospheric fog color and extinction for a given view direction and distance
  // Used by the ocean surface shader for distance fog
  vec3 computeAtmosphericFog(vec3 viewDir, vec3 sunDir, float distance, float turbidity, float rayleighScale) {
    float cosTheta = dot(normalize(viewDir), normalize(sunDir));
    
    // Rayleigh scattering color (blue atmosphere)
    vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6) * rayleighScale;
    float phaseR = (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
    
    // Mie scattering (warm haze)
    float betaM = turbidity * 2e-6;
    float g = 0.76;
    float g2 = g * g;
    float phaseM = (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
    
    // Sun height influence
    float sunFade = clamp(sunDir.y * 3.0 + 0.3, 0.0, 1.0);
    
    // Inscattered light
    vec3 inscatter = (betaR * phaseR + vec3(betaM) * phaseM) * sunFade * 25.0;
    
    // Extinction
    vec3 extinction = exp(-(betaR + vec3(betaM * 1.1)) * distance * 0.0001);
    
    return inscatter;
  }
  
  // Apply atmospheric perspective to a surface color
  vec3 applyAtmosphericPerspective(vec3 surfaceColor, vec3 viewDir, vec3 sunDir, float distance, float turbidity, float rayleighScale) {
    vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6) * rayleighScale;
    float betaM = turbidity * 2e-6;
    
    // Extinction along view ray
    vec3 extinction = exp(-(betaR + vec3(betaM * 1.1)) * distance * 0.0003);
    
    // Inscattered light (fog color)
    vec3 fogColor = computeAtmosphericFog(viewDir, sunDir, distance, turbidity, rayleighScale);
    
    return surfaceColor * extinction + fogColor * (vec3(1.0) - extinction);
  }
`;

// ═══════════════════════════════════════════════════════════════
// SKY COLOR FUNCTION for water reflections
// ═══════════════════════════════════════════════════════════════
export const SKY_REFLECTION_GLSL = /* glsl */ `
  // Simplified sky color for water reflection lookups
  vec3 getAtmosphericSkyColor(vec3 dir, vec3 sunDir, float turbidity, float rayleighScale, float sunIntensity) {
    float cosTheta = dot(dir, normalize(sunDir));
    float sunFade = clamp(1.0 - exp(-sunDir.y * 10.0), 0.0, 1.0);
    float skyFade = max(dir.y, 0.0);
    
    // Rayleigh blue
    vec3 rayleighColor = vec3(0.15, 0.35, 0.65) * rayleighScale * sunFade;
    
    // Horizon warm band (Mie forward scattering at horizon)
    float horizonGlow = exp(-skyFade * 3.0) * sunFade;
    vec3 horizonColor = mix(vec3(0.5, 0.4, 0.3), vec3(0.7, 0.5, 0.3), turbidity * 0.1) * horizonGlow;
    
    // Height gradient
    vec3 sky = mix(horizonColor, rayleighColor, pow(skyFade, 0.5 + turbidity * 0.02));
    
    // Mie glow around sun
    float mieGlow = pow(max(cosTheta, 0.0), 8.0);
    sky += vec3(1.0, 0.7, 0.3) * mieGlow * turbidity * 0.05 * sunFade;
    
    // Sun disc
    float sunDisk = pow(max(cosTheta, 0.0), 4096.0);
    sky += vec3(1.0, 0.95, 0.85) * sunDisk * sunIntensity * 10.0;
    
    // Sunset/sunrise coloring
    if (sunDir.y < 0.2 && sunDir.y > -0.1) {
      float sunsetFactor = 1.0 - smoothstep(-0.1, 0.2, sunDir.y);
      float angularDist = 1.0 - max(cosTheta, 0.0);
      vec3 sunsetColor = vec3(1.0, 0.4, 0.1) * sunsetFactor * exp(-angularDist * 2.0);
      sky += sunsetColor * 0.5;
    }
    
    return sky;
  }
`;
