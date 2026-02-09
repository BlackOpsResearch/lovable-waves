/**
 * OPUS Sheet Topology, Hull Contact, and Spray Shaders
 * Reference: docs/OPUS_GROUPS_3_4.html, docs/OPUS_GROUPS_5_8_COMPLETE.html
 * 
 * Sheet system tracks water surface topology: intact vs broken seams,
 * thickness redistribution, viscosity diffusion, and spray ejection sources.
 * Hull system creates displacement fields for objects cutting through water.
 */

// ═══════════════════════════════════════════════════════════════
// PASS 3-4: Sheet Seam Update
// Texture packing: R=seamState(0=intact,1=broken), G=thickness, B=viscosity, A=pressure
// ═══════════════════════════════════════════════════════════════
export const SHEET_UPDATE_FRAG = `
  uniform sampler2D u_sheet;
  uniform sampler2D u_hf;
  uniform sampler2D u_diag;
  uniform vec2 u_res;
  uniform float u_worldSize;
  uniform float u_dt;
  uniform float u_breakRate;
  uniform float u_healRate;
  uniform float u_waveStrainThresh;
  uniform float u_waveBreakRate;
  uniform float u_viscosity;
  uniform float u_damping;
  uniform float u_hfCoupling;
  uniform float u_minThick;
  uniform float u_maxThick;
  uniform float u_redistRate;
  varying vec2 v_uv;
  
  void main() {
    vec2 tx = 1.0 / u_res;
    float dx = u_worldSize / u_res.x;
    
    vec4 C = texture2D(u_sheet, v_uv);
    vec4 L = texture2D(u_sheet, v_uv + vec2(-tx.x, 0.0));
    vec4 R = texture2D(u_sheet, v_uv + vec2( tx.x, 0.0));
    vec4 D = texture2D(u_sheet, v_uv + vec2(0.0, -tx.y));
    vec4 U = texture2D(u_sheet, v_uv + vec2(0.0,  tx.y));
    
    // Diagnostics: steepness and Jacobian
    vec4 diag = texture2D(u_diag, v_uv);
    float steep = diag.r;
    float jac = diag.b;
    float etaRate = diag.a;
    
    // HF velocity for coupling
    vec4 hfData = texture2D(u_hf, v_uv);
    float eta = hfData.r;
    
    float seamState = C.r;
    float thickness = C.g;
    float visc = C.b;
    float pressure = C.a;
    
    // ── Seam Breaking Logic ──
    // Wave strain: steep waves with low Jacobian cause breaking
    float waveStrain = steep / max(jac, 0.01);
    if (waveStrain > u_waveStrainThresh) {
      float breakAmount = (waveStrain - u_waveStrainThresh) * u_waveBreakRate * u_dt;
      seamState = min(seamState + breakAmount, 1.0);
    }
    
    // Rapid ascent causes surface rupture
    if (etaRate > 2.0) {
      seamState = min(seamState + etaRate * u_breakRate * u_dt * 0.1, 1.0);
    }
    
    // ── Seam Healing ──
    // Neighbors with intact seams heal this cell
    float neighborIntact = (1.0 - L.r) + (1.0 - R.r) + (1.0 - D.r) + (1.0 - U.r);
    float healFactor = neighborIntact * 0.25 * u_healRate * u_dt;
    seamState = max(seamState - healFactor, 0.0);
    
    // Natural healing over time (slow)
    seamState *= (1.0 - 0.05 * u_dt);
    
    // ── Thickness Redistribution ──
    // Laplacian diffusion of thickness
    float thickLap = (L.g + R.g + D.g + U.g - 4.0 * thickness) / (dx * dx);
    thickness += thickLap * u_redistRate * u_dt;
    
    // Thickness grows where water is intact, thins where broken
    thickness += (1.0 - seamState) * 0.1 * u_dt;
    thickness -= seamState * 0.3 * u_dt;
    thickness = clamp(thickness, u_minThick, u_maxThick);
    
    // ── Viscosity Diffusion ──
    float viscLap = (L.b + R.b + D.b + U.b - 4.0 * visc) / (dx * dx);
    visc += viscLap * u_viscosity * u_dt;
    visc *= u_damping;
    
    // Viscosity source from wave breaking
    if (seamState > 0.3) {
      visc += seamState * 0.5 * u_dt;
    }
    visc = clamp(visc, 0.0, 5.0);
    
    // ── Pressure from HF coupling ──
    pressure = eta * u_hfCoupling + steep * 0.5;
    
    gl_FragColor = vec4(seamState, thickness, visc, pressure);
  }
`;

// ═══════════════════════════════════════════════════════════════
// PASS 5: Hull Contact / Displacement Field
// Writes displacement where hull intersects water surface
// Output: R=displacement, G=wake_strength, B=bow_wave, A=spray_source
// ═══════════════════════════════════════════════════════════════
export const HULL_CONTACT_FRAG = `
  uniform sampler2D u_hull;
  uniform sampler2D u_hf;
  uniform vec2 u_res;
  uniform float u_worldSize;
  uniform float u_dt;
  uniform vec3 u_sphereCenter;
  uniform float u_sphereRadius;
  uniform vec3 u_sphereVel;
  uniform float u_hullStiffness;
  uniform float u_barrierStiffness;
  uniform float u_slapDamping;
  varying vec2 v_uv;
  
  void main() {
    vec2 tx = 1.0 / u_res;
    vec4 prev = texture2D(u_hull, v_uv);
    
    // World position of this texel
    vec2 worldPos = (v_uv - 0.5) * u_worldSize;
    float eta = texture2D(u_hf, v_uv).r;
    
    // Distance from sphere center (projected onto XZ plane)
    vec2 toSphere = worldPos - u_sphereCenter.xz;
    float distXZ = length(toSphere);
    vec2 dirFromSphere = distXZ > 0.001 ? toSphere / distXZ : vec2(0.0);
    
    // Sphere intersection with water plane
    float sphereBottom = u_sphereCenter.y - u_sphereRadius;
    float submersion = max(0.0, eta - sphereBottom);
    float inSphere = smoothstep(u_sphereRadius * 1.2, u_sphereRadius * 0.8, distXZ);
    
    // ── Hull Displacement ──
    // Push water down where sphere is submerged
    float displacement = 0.0;
    if (inSphere > 0.0 && submersion > 0.0) {
      float sphereDepth = u_sphereRadius - sqrt(max(0.0, u_sphereRadius * u_sphereRadius - distXZ * distXZ));
      displacement = -submersion * inSphere * u_hullStiffness * u_dt;
    }
    
    // ── Wake Generation ──
    float speed = length(u_sphereVel.xz);
    float wake = 0.0;
    if (speed > 0.01) {
      vec2 velDir = normalize(u_sphereVel.xz);
      
      // Behind the sphere: Kelvin wake pattern
      float behindDot = -dot(dirFromSphere, velDir);
      float lateralDist = abs(dot(dirFromSphere, vec2(-velDir.y, velDir.x)));
      
      // Wake angle (~19.47° Kelvin wake)
      float kelvinAngle = 0.3398; // sin(19.47°)
      float wakeZone = smoothstep(u_sphereRadius, u_sphereRadius * 8.0, distXZ);
      
      if (behindDot > 0.0 && distXZ > u_sphereRadius) {
        float wakePattern = sin(distXZ * 0.5 - lateralDist * 2.0) * 0.5 + 0.5;
        float kelvinEnvelope = smoothstep(kelvinAngle + 0.1, kelvinAngle - 0.05, lateralDist / distXZ);
        wake = speed * behindDot * kelvinEnvelope * wakePattern * wakeZone * 0.3;
      }
      
      // ── Bow Wave ──
      float bowWave = 0.0;
      float frontDot = dot(dirFromSphere, velDir);
      if (frontDot > 0.0 && distXZ < u_sphereRadius * 3.0) {
        float bowStrength = smoothstep(u_sphereRadius * 3.0, u_sphereRadius * 0.9, distXZ);
        bowWave = speed * frontDot * bowStrength * 2.0;
      }
      
      displacement += (wake - bowWave * 0.5) * u_dt;
    }
    
    // ── Spray Source Detection ──
    float spraySource = 0.0;
    // Spray where bow wave is strong and water is steep
    if (speed > 0.5 && inSphere > 0.0) {
      float frontFacing = max(0.0, dot(dirFromSphere, normalize(u_sphereVel.xz)));
      float rimZone = smoothstep(u_sphereRadius * 0.7, u_sphereRadius * 1.1, distXZ);
      spraySource = frontFacing * rimZone * speed * inSphere;
    }
    
    // Decay previous values
    float prevDisp = prev.r * (1.0 - u_slapDamping * u_dt);
    float prevWake = prev.g * (1.0 - 0.5 * u_dt);
    
    gl_FragColor = vec4(
      prevDisp + displacement,
      prevWake + wake * u_dt,
      0.0,
      spraySource
    );
  }
`;

// ═══════════════════════════════════════════════════════════════
// PASS 6: Hull → Heightfield Feedback
// Applies hull displacement back to SWE as source term
// ═══════════════════════════════════════════════════════════════
export const HULL_FEEDBACK_FRAG = `
  uniform sampler2D u_hf;
  uniform sampler2D u_hull;
  uniform vec2 u_res;
  uniform float u_dt;
  uniform float u_feedbackStrength;
  varying vec2 v_uv;
  
  void main() {
    vec4 hf = texture2D(u_hf, v_uv);
    vec4 hull = texture2D(u_hull, v_uv);
    
    // Apply hull displacement as eta source
    float hullForce = hull.r * u_feedbackStrength;
    
    // Wake adds positive displacement behind hull
    float wakeForce = hull.g * u_feedbackStrength * 0.5;
    
    float newEta = hf.r + (hullForce + wakeForce) * u_dt;
    
    gl_FragColor = vec4(newEta, hf.g, hf.b, hf.a);
  }
`;

// ═══════════════════════════════════════════════════════════════
// Enhanced Foam with Sheet + Hull sources
// ═══════════════════════════════════════════════════════════════
export const ENHANCED_FOAM_FRAG = `
  uniform sampler2D u_foam;
  uniform sampler2D u_hf;
  uniform sampler2D u_diag;
  uniform sampler2D u_sheet;
  uniform sampler2D u_hull;
  uniform vec2 u_res;
  uniform float u_worldSize;
  uniform float u_dt;
  uniform float u_decay;
  uniform float u_edgeGen;
  varying vec2 v_uv;
  
  void main() {
    vec2 tx = 1.0 / u_res;
    
    // Advect along heightfield velocity
    vec2 hfVel = texture2D(u_hf, v_uv).ba;
    vec2 uvBack = clamp(v_uv - hfVel * u_dt / u_worldSize, tx * 0.5, 1.0 - tx * 0.5);
    float foam = texture2D(u_foam, uvBack).r;
    
    // Decay
    foam *= exp(-u_decay * u_dt);
    
    // Source 1: Wave diagnostics (steepness + Jacobian)
    vec4 diag = texture2D(u_diag, v_uv);
    float steep = diag.r;
    float jac = diag.b;
    
    if (steep > 0.25 && jac < 0.4) {
      foam += steep * 0.8 * u_dt;
    }
    if (steep > 0.5) {
      foam += (steep - 0.5) * 2.0 * u_dt;
    }
    
    // Source 2: Sheet seam edges generate foam
    vec4 sheet = texture2D(u_sheet, v_uv);
    float seamState = sheet.r;
    float seamL = texture2D(u_sheet, v_uv + vec2(-tx.x, 0.0)).r;
    float seamR = texture2D(u_sheet, v_uv + vec2( tx.x, 0.0)).r;
    float seamD = texture2D(u_sheet, v_uv + vec2(0.0, -tx.y)).r;
    float seamU = texture2D(u_sheet, v_uv + vec2(0.0,  tx.y)).r;
    
    // Seam edge detection (gradient of seam state)
    float seamGrad = abs(seamR - seamL) + abs(seamU - seamD);
    foam += seamGrad * u_edgeGen * u_dt;
    
    // Broken seams produce foam
    foam += seamState * 0.5 * u_dt;
    
    // Source 3: Hull wake foam
    vec4 hull = texture2D(u_hull, v_uv);
    foam += hull.g * 2.0 * u_dt; // Wake generates foam
    foam += hull.a * 3.0 * u_dt; // Spray source zones
    
    foam = clamp(foam, 0.0, 4.0);
    gl_FragColor = vec4(foam, seamState, sheet.g, 0.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// SPRAY PARTICLE VERTEX (point sprite rendering)
// ═══════════════════════════════════════════════════════════════
export const SPRAY_VERT = `
  attribute vec3 a_position;
  attribute vec3 a_velocity;
  attribute float a_life;
  attribute float a_size;
  
  uniform float u_pointScale;
  uniform vec3 u_cameraPos;
  
  varying float v_life;
  varying float v_speed;
  varying float v_altitude;
  
  void main() {
    v_life = a_life;
    v_speed = length(a_velocity);
    v_altitude = a_position.y;
    
    vec4 worldPos = vec4(a_position, 1.0);
    gl_Position = gl_ModelViewProjectionMatrix * worldPos;
    
    // Point size based on distance and life
    float dist = length(u_cameraPos - a_position);
    gl_PointSize = max(1.0, u_pointScale * a_size * a_life / max(dist, 1.0));
  }
`;

export const SPRAY_FRAG = `
  uniform vec3 u_sunDir;
  uniform vec3 u_sunColor;
  
  varying float v_life;
  varying float v_speed;
  varying float v_altitude;
  
  void main() {
    // Circular point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord);
    if (r > 0.5) discard;
    
    // Soft edges
    float alpha = smoothstep(0.5, 0.3, r) * v_life;
    
    // Spray color: bright white with slight blue tint
    vec3 color = vec3(0.85, 0.9, 0.95);
    
    // Sun-lit spray sparkle
    float sparkle = pow(max(0.0, 1.0 - r * 2.0), 3.0);
    color += u_sunColor * sparkle * 0.5;
    
    // Higher spray is more transparent (mist)
    alpha *= mix(0.8, 0.3, clamp(v_altitude * 0.2, 0.0, 1.0));
    
    gl_FragColor = vec4(color, alpha * 0.7);
  }
`;

export default {
  SHEET_UPDATE_FRAG,
  HULL_CONTACT_FRAG,
  HULL_FEEDBACK_FRAG,
  ENHANCED_FOAM_FRAG,
  SPRAY_VERT,
  SPRAY_FRAG,
};
