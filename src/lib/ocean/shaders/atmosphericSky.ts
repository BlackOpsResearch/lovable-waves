/**
 * Atmospheric Scattering Sky System
 * Implements physically-based Rayleigh and Mie scattering
 */

export const ATMOSPHERIC_SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vSunDirection;
  varying vec3 vBetaR;
  varying vec3 vBetaM;
  varying float vSunE;
  
  uniform vec3 uSunPosition;
  uniform float uRayleigh;
  uniform float uTurbidity;
  uniform float uMieCoefficient;
  
  const float e = 2.71828182845904523536;
  const float pi = 3.141592653589793;
  const float cutoffAngle = 1.6110731556870734;
  const float steepness = 1.5;
  const float EE = 1000.0;
  
  const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
  const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
  
  float sunIntensity(float zenithAngleCos) {
    zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
    return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(zenithAngleCos)) / steepness)));
  }
  
  vec3 totalMie(float T) {
    float c = (0.2 * T) * 10E-18;
    return 0.434 * c * MieConst;
  }
  
  void main() {
    vec4 worldPosition = gl_ModelViewMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vSunDirection = normalize(uSunPosition);
    vSunE = sunIntensity(dot(vSunDirection, vec3(0.0, 1.0, 0.0)));
    
    float sunfade = 1.0 - clamp(1.0 - exp(vSunDirection.y * 0.1), 0.0, 1.0);
    float rayleighCoefficient = uRayleigh - (1.0 * (1.0 - sunfade));
    
    vBetaR = totalRayleigh * rayleighCoefficient;
    vBetaM = totalMie(uTurbidity) * uMieCoefficient;
    
    gl_Position = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
    gl_Position.z = gl_Position.w; // Sky at far plane
  }
`;

export const ATMOSPHERIC_SKY_FRAGMENT = /* glsl */ `
  precision highp float;
  
  varying vec3 vWorldPosition;
  varying vec3 vSunDirection;
  varying vec3 vBetaR;
  varying vec3 vBetaM;
  varying float vSunE;
  
  uniform float uMieDirectionalG;
  uniform vec3 uSunColor;
  uniform float uExposure;
  
  const float pi = 3.141592653589793;
  const float n = 1.0003; // refractive index of air
  const float N = 2.545E25; // number of molecules per unit volume
  const float pn = 0.035; // depolatization factor
  
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
  }
  
  float hgPhase(float cosTheta, float g) {
    float g2 = pow(g, 2.0);
    float inverse = 1.0 / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
    return (1.0 / (4.0 * pi)) * ((1.0 - g2) * inverse);
  }
  
  // Uncharted 2 Tonemap
  vec3 Uncharted2Tonemap(vec3 x) {
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    const float W = 11.2;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
  }
  
  void main() {
    vec3 direction = normalize(vWorldPosition);
    
    // Optical length
    float zenithAngle = acos(max(0.0, dot(vec3(0.0, 1.0, 0.0), direction)));
    float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
    float sR = 8400.0 * inverse;
    float sM = 1200.0 * inverse;
    
    // Combined extinction factor
    vec3 Fex = exp(-(vBetaR * sR + vBetaM * sM));
    
    // In-scattering
    float cosTheta = dot(direction, vSunDirection);
    float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
    vec3 betaRTheta = vBetaR * rPhase;
    
    float mPhase = hgPhase(cosTheta, uMieDirectionalG);
    vec3 betaMTheta = vBetaM * mPhase;
    
    vec3 Lin = pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex), vec3(1.5));
    Lin *= mix(
      vec3(1.0),
      pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex, vec3(0.5)),
      clamp(pow(1.0 - dot(vec3(0.0, 1.0, 0.0), vSunDirection), 5.0), 0.0, 1.0)
    );
    
    // Night sky
    float theta = acos(direction.y);
    float phi = atan(direction.z, direction.x);
    vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
    vec3 L0 = vec3(0.1) * Fex;
    
    // Sun disk
    float sundisk = smoothstep(0.99985, 0.99999, cosTheta);
    L0 += (vSunE * 20000.0 * Fex) * sundisk * uSunColor;
    
    vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
    
    float sunfade = 1.0 - clamp(1.0 - exp(vSunDirection.y * 0.1), 0.0, 1.0);
    vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * sunfade))));
    
    // Tone mapping
    retColor = Uncharted2Tonemap(retColor * uExposure) / Uncharted2Tonemap(vec3(11.2));
    
    gl_FragColor = vec4(retColor, 1.0);
  }
`;

// Atmospheric color calculation for water shader integration
export const ATMOSPHERIC_FUNCTIONS = /* glsl */ `
  const float E = 2.71828182845904523536;
  const float PI = 3.141592653589793;
  const float SKY_CUTOFF_ANGLE = 1.6110731556870734;
  const float SKY_STEEPNESS = 1.5;
  const float SKY_EE = 1000.0;
  
  const vec3 TOTAL_RAYLEIGH = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
  const vec3 MIE_CONST = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);
  
  float skyIntensity(float zenithAngleCos) {
    zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
    return SKY_EE * max(0.0, 1.0 - pow(E, -((SKY_CUTOFF_ANGLE - acos(zenithAngleCos)) / SKY_STEEPNESS)));
  }
  
  vec3 skyMie(float T) {
    float c = (0.2 * T) * 10E-18;
    return 0.434 * c * MIE_CONST;
  }
  
  float skyRayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + pow(cosTheta, 2.0));
  }
  
  float skyHgPhase(float cosTheta, float g) {
    float g2 = pow(g, 2.0);
    float inverse = 1.0 / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
    return (1.0 / (4.0 * PI)) * ((1.0 - g2) * inverse);
  }
  
  vec3 skyUncharted2Tonemap(vec3 x) {
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
  }
  
  vec3 getAtmosphericSkyColor(vec3 direction, vec3 sunDir, float turbidity, float rayleigh, float mieCoefficient, float mieG) {
    vec3 up = vec3(0.0, 1.0, 0.0);
    
    float sunE = skyIntensity(dot(sunDir, up));
    float sunfade = 1.0 - clamp(1.0 - exp(sunDir.y * 0.1), 0.0, 1.0);
    float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
    
    vec3 betaR = TOTAL_RAYLEIGH * rayleighCoefficient;
    vec3 betaM = skyMie(turbidity) * mieCoefficient;
    
    float zenithAngle = acos(max(0.0, dot(up, direction)));
    float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / PI), -1.253));
    float sR = 8400.0 * inverse;
    float sM = 1200.0 * inverse;
    
    vec3 Fex = exp(-(betaR * sR + betaM * sM));
    
    float cosTheta = dot(direction, sunDir);
    float rPhase = skyRayleighPhase(cosTheta * 0.5 + 0.5);
    vec3 betaRTheta = betaR * rPhase;
    
    float mPhase = skyHgPhase(cosTheta, mieG);
    vec3 betaMTheta = betaM * mPhase;
    
    vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5));
    Lin *= mix(
      vec3(1.0),
      pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(0.5)),
      clamp(pow(1.0 - dot(up, sunDir), 5.0), 0.0, 1.0)
    );
    
    vec3 L0 = vec3(0.1) * Fex;
    
    // Sun disk
    float sundisk = smoothstep(0.9995, 0.9999, cosTheta);
    L0 += (sunE * 19000.0 * Fex) * sundisk;
    
    vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
    vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * sunfade))));
    
    return skyUncharted2Tonemap(retColor * 0.5) * 1.0748724675633854;
  }
`;

export default {
  ATMOSPHERIC_SKY_VERTEX,
  ATMOSPHERIC_SKY_FRAGMENT,
  ATMOSPHERIC_FUNCTIONS
};
