/**
 * Enhanced Ocean Simulation Shaders
 * Ported from GPT Waves V7 with improvements for realistic ocean physics
 */

// Common vertex shader for simulation passes
export const SIMULATION_VERTEX = `
  varying vec2 coord;
  void main() {
    coord = gl_Vertex.xy * 0.5 + 0.5;
    gl_Position = vec4(gl_Vertex.xyz, 1.0);
  }
`;

// Drop shader - add ripples with smooth falloff
export const DROP_FRAGMENT = `
  precision highp float;
  const float PI = 3.141592653589793;
  
  uniform sampler2D texture;
  uniform vec2 center;
  uniform float radius;
  uniform float strength;
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
    drop = 0.5 - cos(drop * PI) * 0.5;
    info.r += drop * strength;
    gl_FragColor = info;
  }
`;

// Impulse shader - injects velocity instead of height (for wakes/impacts)
export const IMPULSE_FRAGMENT = `
  precision highp float;
  const float PI = 3.141592653589793;
  
  uniform sampler2D texture;
  uniform vec2 center;
  uniform float radius;
  uniform float strength;
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
    drop = 0.5 - cos(drop * PI) * 0.5;
    // Inject into velocity channel
    info.g += drop * strength;
    gl_FragColor = info;
  }
`;

// Update shader - wave propagation with realistic ocean damping
export const UPDATE_FRAGMENT = `
  precision highp float;
  
  uniform sampler2D texture;
  uniform vec2 delta;
  uniform float damping;
  uniform float waveSpeed;
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    vec2 dx = vec2(delta.x, 0.0);
    vec2 dy = vec2(0.0, delta.y);
    
    // Sample neighbors with edge handling
    float hL = texture2D(texture, coord - dx).r;
    float hD = texture2D(texture, coord - dy).r;
    float hR = texture2D(texture, coord + dx).r;
    float hU = texture2D(texture, coord + dy).r;
    
    // Wave equation: acceleration = c² * laplacian
    float average = (hL + hD + hR + hU) * 0.25;
    float laplacian = (hL + hD + hR + hU - 4.0 * info.r);
    
    // Update velocity with wave speed factor
    info.g += laplacian * waveSpeed;
    
    // Apply damping (ocean waves persist longer than pool waves)
    info.g *= damping;
    
    // Update height
    info.r += info.g;
    
    // Remove DC drift - gently pulls surface back to equilibrium
    info.r *= 0.9995;
    
    gl_FragColor = info;
  }
`;

// Normal calculation shader with improved gradient
export const NORMAL_FRAGMENT = `
  precision highp float;
  
  uniform sampler2D texture;
  uniform vec2 delta;
  varying vec2 coord;
  
  void main() {
    vec4 info = texture2D(texture, coord);
    
    // Central difference for more accurate normals
    float hL = texture2D(texture, coord - vec2(delta.x, 0.0)).r;
    float hR = texture2D(texture, coord + vec2(delta.x, 0.0)).r;
    float hD = texture2D(texture, coord - vec2(0.0, delta.y)).r;
    float hU = texture2D(texture, coord + vec2(0.0, delta.y)).r;
    
    vec3 dx = vec3(delta.x * 2.0, hR - hL, 0.0);
    vec3 dy = vec3(0.0, hU - hD, delta.y * 2.0);
    
    vec3 normal = normalize(cross(dy, dx));
    info.ba = normal.xz;
    
    gl_FragColor = info;
  }
`;

// Enhanced sphere displacement shader with physically grounded displacement
export const SPHERE_FRAGMENT = `
  precision highp float;
  
  uniform sampler2D texture;
  uniform vec3 oldCenter;
  uniform vec3 newCenter;
  uniform float radius;
  uniform float displacementScale;
  varying vec2 coord;
  
  float volumeInSphere(vec3 center) {
    // Physically grounded sphere cross-section
    vec3 p = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0);
    vec2 dXZ = p.xz - center.xz;
    float d = length(dXZ);
    
    // Soft edge to reduce aliasing
    float edge = max(0.02, radius * 0.18);
    float inside = 1.0 - smoothstep(radius - edge, radius + edge, d);
    if (inside <= 0.0) return 0.0;
    inside *= inside; // Soften further
    
    float r2 = max(0.0, radius * radius - d * d);
    float halfChord = sqrt(r2);
    float yBottom = center.y - halfChord;
    float yTop = center.y + halfChord;
    
    // Only count the portion below water surface (y=0)
    float ymin = min(0.0, yBottom);
    float ymax = min(0.0, yTop);
    float submergedHeight = max(0.0, ymax - ymin);
    
    return submergedHeight * inside * displacementScale * 0.65;
  }
  
  void main() {
    vec4 info = texture2D(texture, coord);
    info.r += volumeInSphere(oldCenter);
    info.r -= volumeInSphere(newCenter);
    gl_FragColor = info;
  }
`;

// Ocean wind waves shader - adds procedural surface detail
export const WIND_WAVES_FRAGMENT = `
  precision highp float;
  const float PI = 3.141592653589793;
  
  uniform sampler2D texture;
  uniform float time;
  uniform vec2 windDir;
  uniform float windStrength;
  uniform float waveScale;
  varying vec2 coord;
  
  // Fast hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  // Simplex-like noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  float fbm(vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
  
  void main() {
    vec4 info = texture2D(texture, coord);
    vec2 worldPos = (coord - 0.5) * 2.0;
    
    // Multi-frequency wind-driven waves
    float waves = 0.0;
    
    // Primary swell
    vec2 windOffset = windDir * time * 0.5;
    waves += sin(dot(worldPos + windOffset, windDir) * waveScale + time) * windStrength * 0.5;
    
    // Secondary chop
    waves += fbm((worldPos + windOffset * 0.7) * waveScale * 2.0, 4) * windStrength * 0.3;
    
    // High frequency ripples
    waves += noise((worldPos + windOffset * 1.5) * waveScale * 8.0) * windStrength * 0.1;
    
    info.r += waves * 0.02;
    gl_FragColor = info;
  }
`;
