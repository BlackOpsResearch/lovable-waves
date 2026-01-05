/**
 * Procedural Sky Shaders
 * Atmospheric scattering with Preetham/Hosek model
 */

export const SKY_VERTEX_SHADER = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying float vSunE;

uniform vec3 sunPosition;
uniform float rayleigh;
uniform float turbidity;
uniform float mieCoefficient;

const vec3 up = vec3(0.0, 1.0, 0.0);

// Constants for atmospheric scattering
const float e = 2.71828182845904523536028747135266249775724709369995957;
const float pi = 3.141592653589793238462643383279502884197169;

// Mie scattering constant
const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);
const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);

const float v = 4.0;
const vec3 K = vec3(0.686, 0.678, 0.666);
const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);

const float cutoffAngle = 1.6110731556870734;
const float steepness = 1.5;
const float EE = 1000.0;

float sunIntensity(float zenithAngleCos) {
  zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
  return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(zenithAngleCos)) / steepness)));
}

vec3 totalMie(float T) {
  float c = (0.2 * T) * 10E-18;
  return 0.434 * c * MieConst;
}

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z = gl_Position.w; // Set z to camera far plane

  vSunDirection = normalize(sunPosition);

  vSunE = sunIntensity(dot(vSunDirection, up));

  vSunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);

  float rayleighCoefficient = rayleigh - (1.0 * (1.0 - vSunfade));

  vBetaR = totalRayleigh * rayleighCoefficient;
  vBetaM = totalMie(turbidity) * mieCoefficient;
}
`;

export const SKY_FRAGMENT_SHADER = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying float vSunE;

uniform float mieDirectionalG;
uniform vec3 sunColor;
uniform float sunIntensityMultiplier;
uniform float exposure;

const vec3 up = vec3(0.0, 1.0, 0.0);
const float pi = 3.141592653589793238462643383279502884197169;

// Filmic tone mapping
const float whiteScale = 1.0748724675633854;

vec3 Uncharted2Tonemap(vec3 x) {
  const float A = 0.15;
  const float B = 0.50;
  const float C = 0.10;
  const float D = 0.20;
  const float E = 0.02;
  const float F = 0.30;
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

float rayleighPhase(float cosTheta) {
  return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
}

float hgPhase(float cosTheta, float g) {
  float g2 = pow(g, 2.0);
  float inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
  return (1.0 / (4.0 * pi)) * ((1.0 - g2) * inverse);
}

void main() {
  vec3 direction = normalize(vWorldPosition);
  
  float zenithAngle = acos(max(0.0, dot(up, direction)));
  float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
  float sR = 8400.0 * inverse;
  float sM = 1200.0 * inverse;

  vec3 Fex = exp(-(vBetaR * sR + vBetaM * sM));

  float cosTheta = dot(direction, vSunDirection);

  float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
  vec3 betaRTheta = vBetaR * rPhase;

  float mPhase = hgPhase(cosTheta, mieDirectionalG);
  vec3 betaMTheta = vBetaM * mPhase;

  vec3 Lin = pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex), vec3(1.5));
  Lin *= mix(
    vec3(1.0),
    pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex, vec3(1.0 / 2.0)),
    clamp(pow(1.0 - dot(up, vSunDirection), 5.0), 0.0, 1.0)
  );

  // Nightsky
  float theta = acos(direction.y);
  float phi = atan(direction.z, direction.x);
  vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
  vec3 L0 = vec3(0.1) * Fex;

  // Sun disk
  float sundisk = smoothstep(0.9997, 0.9998, cosTheta);
  L0 += (vSunE * 19000.0 * Fex) * sundisk * sunColor * sunIntensityMultiplier;

  vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);

  vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * vSunfade))));

  // Tone mapping
  retColor = Uncharted2Tonemap(retColor * exposure) * whiteScale;
  
  gl_FragColor = vec4(retColor, 1.0);
}
`;

// Procedural skybox generator for cubemap
export const SKYBOX_GENERATOR_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec3 sunPosition;
uniform float turbidity;
uniform float rayleigh;
uniform float mieCoefficient;
uniform float mieDirectionalG;
uniform vec3 sunColor;
uniform float exposure;
uniform int face;

varying vec2 vUv;

const vec3 up = vec3(0.0, 1.0, 0.0);
const float pi = 3.141592653589793;
const float e = 2.71828182845904523536;
const float EE = 1000.0;
const float cutoffAngle = 1.6110731556870734;
const float steepness = 1.5;

const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);
const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);

float sunIntensityCalc(float zenithAngleCos) {
  zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
  return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(zenithAngleCos)) / steepness)));
}

vec3 totalMie(float T) {
  float c = (0.2 * T) * 10E-18;
  return 0.434 * c * MieConst;
}

float rayleighPhase(float cosTheta) {
  return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
}

float hgPhase(float cosTheta, float g) {
  float g2 = pow(g, 2.0);
  float inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
  return (1.0 / (4.0 * pi)) * ((1.0 - g2) * inverse);
}

vec3 Uncharted2Tonemap(vec3 x) {
  const float A = 0.15;
  const float B = 0.50;
  const float C = 0.10;
  const float D = 0.20;
  const float EE = 0.02;
  const float F = 0.30;
  return ((x * (A * x + C * B) + D * EE) / (x * (A * x + B) + D * F)) - EE / F;
}

vec3 getCubeDirection(int faceIndex, vec2 uv) {
  // Convert UV to direction based on cube face
  vec2 coord = uv * 2.0 - 1.0;
  vec3 dir;
  
  if (faceIndex == 0) { // +X
    dir = vec3(1.0, -coord.y, -coord.x);
  } else if (faceIndex == 1) { // -X
    dir = vec3(-1.0, -coord.y, coord.x);
  } else if (faceIndex == 2) { // +Y
    dir = vec3(coord.x, 1.0, coord.y);
  } else if (faceIndex == 3) { // -Y
    dir = vec3(coord.x, -1.0, -coord.y);
  } else if (faceIndex == 4) { // +Z
    dir = vec3(coord.x, -coord.y, 1.0);
  } else { // -Z
    dir = vec3(-coord.x, -coord.y, -1.0);
  }
  
  return normalize(dir);
}

void main() {
  vec3 direction = getCubeDirection(face, vUv);
  vec3 sunDir = normalize(sunPosition);
  
  float sunE = sunIntensityCalc(dot(sunDir, up));
  float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
  float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
  
  vec3 betaR = totalRayleigh * rayleighCoefficient;
  vec3 betaM = totalMie(turbidity) * mieCoefficient;
  
  float zenithAngle = acos(max(0.0, dot(up, direction)));
  float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
  float sR = 8400.0 * inverse;
  float sM = 1200.0 * inverse;
  
  vec3 Fex = exp(-(betaR * sR + betaM * sM));
  
  float cosTheta = dot(direction, sunDir);
  float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
  vec3 betaRTheta = betaR * rPhase;
  
  float mPhase = hgPhase(cosTheta, mieDirectionalG);
  vec3 betaMTheta = betaM * mPhase;
  
  vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5));
  Lin *= mix(
    vec3(1.0),
    pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(0.5)),
    clamp(pow(1.0 - dot(up, sunDir), 5.0), 0.0, 1.0)
  );
  
  vec3 L0 = vec3(0.1) * Fex;
  
  // Sun disk
  float sundisk = smoothstep(0.9997, 0.9998, cosTheta);
  L0 += (sunE * 19000.0 * Fex) * sundisk * sunColor;
  
  vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
  vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * sunfade))));
  retColor = Uncharted2Tonemap(retColor * exposure) * 1.0748724675633854;
  
  gl_FragColor = vec4(retColor, 1.0);
}
`;
