/**
 * OPUS Water Engine — All GPU Pass Shaders
 * Reference: docs/OPUS_ORCHESTRATION.md, docs/OPUS_GROUPS_5_8_COMPLETE.html
 * 
 * All shaders use GLSL 100 (compatible with our Shader wrapper which adds gl_ prefixes)
 * The Shader class auto-prepends precision and matrix uniforms.
 */

// ═══════════════════════════════════════════════════════════════
// FULLSCREEN VERTEX — used by all simulation passes
// ═══════════════════════════════════════════════════════════════
export const FULLSCREEN_VERT = `
  varying vec2 v_uv;
  void main() {
    v_uv = gl_Vertex.xy * 0.5 + 0.5;
    gl_Position = vec4(gl_Vertex.xyz, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// PASS 1: SWE Heightfield Update (Lax-Friedrichs)
// Texture packing: R=η, G=∂η/∂t, B=u_vel, A=v_vel
// ═══════════════════════════════════════════════════════════════
export const SWE_UPDATE_FRAG = `
  uniform sampler2D u_hf;
  uniform vec2 u_res;
  uniform float u_worldSize;
  uniform float u_depth;
  uniform float u_gravity;
  uniform float u_dt;
  uniform float u_damping;
  uniform vec2 u_impulseCenter;
  uniform float u_impulseRadius;
  uniform float u_impulseStrength;
  varying vec2 v_uv;
  
  void main() {
    vec2 tx = 1.0 / u_res;
    float dx = u_worldSize / u_res.x;
    
    vec4 C  = texture2D(u_hf, v_uv);
    vec4 L  = texture2D(u_hf, v_uv + vec2(-tx.x, 0.0));
    vec4 R  = texture2D(u_hf, v_uv + vec2( tx.x, 0.0));
    vec4 D  = texture2D(u_hf, v_uv + vec2(0.0, -tx.y));
    vec4 U  = texture2D(u_hf, v_uv + vec2(0.0,  tx.y));
    
    // Lax-Friedrichs averaging
    float ea = 0.25 * (L.r + R.r + D.r + U.r);
    float ua = 0.25 * (L.b + R.b + D.b + U.b);
    float va = 0.25 * (L.a + R.a + D.a + U.a);
    
    // Continuity: ∂η/∂t = -H₀(∂u/∂x + ∂v/∂z)
    float dudx = (R.b - L.b) / (2.0 * dx);
    float dvdz = (U.a - D.a) / (2.0 * dx);
    float etaRate = -u_depth * (dudx + dvdz);
    
    // Momentum: ∂u/∂t = -g(∂η/∂x), ∂v/∂t = -g(∂η/∂z)
    float dedx = (R.r - L.r) / (2.0 * dx);
    float dedz = (U.r - D.r) / (2.0 * dx);
    
    float newEta = ea + etaRate * u_dt;
    float newU   = ua - u_gravity * dedx * u_dt;
    float newV   = va - u_gravity * dedz * u_dt;
    
    // Sponge boundary absorption (outer 5%)
    vec2 localPos = v_uv * u_worldSize;
    float sw = u_worldSize * 0.05;
    float sponge = smoothstep(0.0, sw, localPos.x) 
                 * smoothstep(0.0, sw, u_worldSize - localPos.x)
                 * smoothstep(0.0, sw, localPos.y) 
                 * smoothstep(0.0, sw, u_worldSize - localPos.y);
    
    newEta *= sponge * u_damping;
    newU   *= sponge * u_damping;
    newV   *= sponge * u_damping;
    
    // Impulse injection
    if (u_impulseStrength != 0.0) {
      vec2 worldPos = (v_uv - 0.5) * u_worldSize;
      vec2 d = worldPos - u_impulseCenter;
      float r2 = dot(d, d);
      float s2 = u_impulseRadius * u_impulseRadius;
      newEta += u_impulseStrength * exp(-r2 / s2) * u_dt;
    }
    
    // Store ∂η/∂t for diagnostics
    float etaRateOut = (newEta - C.r) / max(u_dt, 1e-6);
    
    gl_FragColor = vec4(newEta, etaRateOut, newU, newV);
  }
`;

// ═══════════════════════════════════════════════════════════════
// PASS 2: Heightfield Diagnostics
// Output: R=steepness, G=curvature, B=jacobian, A=etaRate
// ═══════════════════════════════════════════════════════════════
export const DIAGNOSTICS_FRAG = `
  uniform sampler2D u_hf;
  uniform vec2 u_res;
  uniform float u_worldSize;
  uniform float u_stride;
  varying vec2 v_uv;
  
  void main() {
    vec2 tx = 1.0 / u_res;
    vec2 st = tx * u_stride;
    float dx = u_worldSize / u_res.x;
    float dxE = dx * u_stride;
    
    float C = texture2D(u_hf, v_uv).r;
    float L = texture2D(u_hf, v_uv + vec2(-st.x, 0.0)).r;
    float R = texture2D(u_hf, v_uv + vec2( st.x, 0.0)).r;
    float D = texture2D(u_hf, v_uv + vec2(0.0, -st.y)).r;
    float U = texture2D(u_hf, v_uv + vec2(0.0,  st.y)).r;
    
    float gx = (R - L) / (2.0 * dxE);
    float gz = (U - D) / (2.0 * dxE);
    float steepness = sqrt(gx * gx + gz * gz);
    float curvature = (L + R + D + U - 4.0 * C) / (dxE * dxE);
    float jacobian = 1.0 - steepness * steepness - abs(curvature) * dxE;
    float etaRate = texture2D(u_hf, v_uv).g;
    
    gl_FragColor = vec4(steepness, curvature, jacobian, etaRate);
  }
`;

// ═══════════════════════════════════════════════════════════════
// PASS 15: Foam Advect + Decay + Generation
// ═══════════════════════════════════════════════════════════════
export const FOAM_FRAG = `
  uniform sampler2D u_foam;
  uniform sampler2D u_hf;
  uniform sampler2D u_diag;
  uniform vec2 u_res;
  uniform float u_worldSize;
  uniform float u_dt;
  uniform float u_decay;
  varying vec2 v_uv;
  
  void main() {
    vec2 tx = 1.0 / u_res;
    
    // Advect along heightfield velocity
    vec2 hfVel = texture2D(u_hf, v_uv).ba;
    vec2 uvBack = clamp(v_uv - hfVel * u_dt / u_worldSize, tx * 0.5, 1.0 - tx * 0.5);
    float foam = texture2D(u_foam, uvBack).r;
    
    // Decay
    foam *= exp(-u_decay * u_dt);
    
    // Source: wave steepness (autonomous whitecaps)
    vec4 diag = texture2D(u_diag, v_uv);
    float steep = diag.r;
    float jac = diag.b;
    
    // Steep waves with low Jacobian → whitecapping
    if (steep > 0.3 && jac < 0.3) {
      foam += steep * 0.8 * u_dt;
    }
    
    // Breaking crests
    if (steep > 0.5) {
      foam += (steep - 0.5) * 2.0 * u_dt;
    }
    
    foam = clamp(foam, 0.0, 3.0);
    gl_FragColor = vec4(foam, 0.0, 0.0, 0.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// OCEAN SURFACE VERTEX SHADER (SWE + Gerstner blend + hull)
// ═══════════════════════════════════════════════════════════════
export const OCEAN_SURFACE_VERT = `
  uniform sampler2D u_hf;
  uniform sampler2D u_diag;
  uniform sampler2D u_foam;
  uniform sampler2D u_hull;
  uniform float u_oceanScale;
  uniform vec2 u_hfRes;
  uniform vec3 u_cameraPos;
  uniform float u_time;
  uniform float u_gerstnerAmp;
  uniform float u_gerstnerSteep;
  uniform float u_windDir;
  
  varying vec3 v_worldPos;
  varying vec3 v_normal;
  varying float v_steepness;
  varying float v_eta;
  varying float v_foam;
  varying float v_distToCamera;
  varying vec2 v_uv;
  
  // Inline Gerstner for vertex shader (3 primary waves for performance)
  vec3 gerstner(vec2 pos, float t, vec2 dir, float wl, float amp, float steep) {
    float k = 6.28318 / wl;
    float c = sqrt(9.81 / k);
    float f = k * (dot(dir, pos) - c * t);
    float a = steep / k;
    return vec3(dir.x * a * cos(f), amp * sin(f), dir.y * a * cos(f));
  }
  
  void main() {
    v_uv = gl_Vertex.xy * 0.5 + 0.5;
    
    // Sample SWE heightfield
    vec4 hfData = texture2D(u_hf, v_uv);
    float eta = hfData.r;
    
    // Compute world position
    vec2 worldXZ = (v_uv - 0.5) * u_oceanScale;
    
    // ── Gerstner Wave Blend ──
    vec3 gerstnerOffset = vec3(0.0);
    if (u_gerstnerAmp > 0.001) {
      float windRad = u_windDir * 3.14159 / 180.0;
      vec2 wd = vec2(cos(windRad), sin(windRad));
      vec2 wd2 = normalize(wd + vec2(0.3, -0.2));
      vec2 wd3 = normalize(vec2(-wd.y, wd.x) * 0.7 + wd * 0.3);
      
      gerstnerOffset += gerstner(worldXZ, u_time, wd, 60.0, u_gerstnerAmp * 1.2, u_gerstnerSteep * 0.8);
      gerstnerOffset += gerstner(worldXZ, u_time * 1.1, wd2, 40.0, u_gerstnerAmp * 0.8, u_gerstnerSteep * 0.6);
      gerstnerOffset += gerstner(worldXZ, u_time * 1.2, wd3, 25.0, u_gerstnerAmp * 0.5, u_gerstnerSteep * 0.5);
      gerstnerOffset += gerstner(worldXZ, u_time * 1.3, normalize(wd + vec2(-0.1, 0.4)), 15.0, u_gerstnerAmp * 0.3, u_gerstnerSteep * 0.4);
      gerstnerOffset += gerstner(worldXZ, u_time * 1.5, normalize(wd + vec2(0.5, 0.1)), 8.0, u_gerstnerAmp * 0.15, u_gerstnerSteep * 0.3);
    }
    
    // Hull displacement
    vec4 hullData = texture2D(u_hull, v_uv);
    float hullDisp = hullData.r;
    
    // Delta layering: η_total = η_swe + δ_gerstner + δ_hull
    float totalEta = eta + gerstnerOffset.y + hullDisp;
    
    v_worldPos = vec3(worldXZ.x + gerstnerOffset.x, totalEta, worldXZ.y + gerstnerOffset.z);
    v_eta = totalEta;
    
    // Compute normal from combined heightfield
    float dx = u_oceanScale / u_hfRes.x;
    vec2 tx = 1.0 / u_hfRes;
    float hL = texture2D(u_hf, v_uv + vec2(-tx.x, 0.0)).r;
    float hR = texture2D(u_hf, v_uv + vec2( tx.x, 0.0)).r;
    float hD = texture2D(u_hf, v_uv + vec2(0.0, -tx.y)).r;
    float hU = texture2D(u_hf, v_uv + vec2(0.0,  tx.y)).r;
    
    // Add Gerstner normal contribution
    float gNx = 0.0, gNz = 0.0;
    if (u_gerstnerAmp > 0.001) {
      float eps = dx;
      float windRad = u_windDir * 3.14159 / 180.0;
      vec2 wd = vec2(cos(windRad), sin(windRad));
      float hGC = gerstner(worldXZ, u_time, wd, 60.0, u_gerstnerAmp * 1.2, u_gerstnerSteep * 0.8).y;
      float hGL = gerstner(worldXZ + vec2(-eps, 0.0), u_time, wd, 60.0, u_gerstnerAmp * 1.2, u_gerstnerSteep * 0.8).y;
      float hGR = gerstner(worldXZ + vec2(eps, 0.0), u_time, wd, 60.0, u_gerstnerAmp * 1.2, u_gerstnerSteep * 0.8).y;
      float hGD = gerstner(worldXZ + vec2(0.0, -eps), u_time, wd, 60.0, u_gerstnerAmp * 1.2, u_gerstnerSteep * 0.8).y;
      float hGU = gerstner(worldXZ + vec2(0.0, eps), u_time, wd, 60.0, u_gerstnerAmp * 1.2, u_gerstnerSteep * 0.8).y;
      gNx = (hGL - hGR) / (2.0 * eps);
      gNz = (hGD - hGU) / (2.0 * eps);
    }
    
    v_normal = normalize(vec3(
      (hL - hR) / (2.0 * dx) + gNx,
      1.0,
      (hD - hU) / (2.0 * dx) + gNz
    ));
    
    // Diagnostics
    vec4 diagData = texture2D(u_diag, v_uv);
    v_steepness = diagData.r;
    
    // Foam
    v_foam = texture2D(u_foam, v_uv).r;
    
    // Distance for LOD/fog
    v_distToCamera = length(u_cameraPos - v_worldPos);
    
    gl_Position = gl_ModelViewProjectionMatrix * vec4(v_worldPos, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// OCEAN SURFACE FRAGMENT SHADER (PBR water with foam + atmospheric)
// ═══════════════════════════════════════════════════════════════
export const OCEAN_SURFACE_FRAG = `
  uniform vec3 u_cameraPos;
  uniform vec3 u_sunDir;
  uniform vec3 u_sunColor;
  uniform vec3 u_deepColor;
  uniform vec3 u_shallowColor;
  uniform float u_foamThresh;
  uniform float u_foamIntensity;
  uniform float u_specPow;
  uniform float u_envRefl;
  uniform float u_time;
  uniform sampler2D u_hf;
  uniform sampler2D u_foam;
  
  varying vec3 v_worldPos;
  varying vec3 v_normal;
  varying float v_steepness;
  varying float v_eta;
  varying float v_foam;
  varying float v_distToCamera;
  varying vec2 v_uv;
  
  // Schlick Fresnel
  float schlickFresnel(vec3 N, vec3 V, float F0) {
    float cosTheta = max(dot(N, V), 0.0);
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }
  
  // Simple sky color for reflections
  vec3 getSkyColor(vec3 dir) {
    float sunFade = clamp(1.0 - exp(-u_sunDir.y * 10.0), 0.0, 1.0);
    float skyFade = max(dir.y, 0.0);
    
    vec3 skyBlue = vec3(0.3, 0.55, 0.8) * sunFade;
    vec3 horizon = vec3(0.6, 0.7, 0.8) * sunFade;
    vec3 sunGlow = vec3(1.0, 0.7, 0.4) * sunFade;
    
    vec3 sky = mix(horizon, skyBlue, skyFade);
    
    // Sun glow near horizon
    float sunAngle = max(dot(dir, u_sunDir), 0.0);
    sky += sunGlow * pow(sunAngle, 8.0) * 0.5;
    
    // Sun disc
    sky += u_sunColor * pow(sunAngle, 2048.0) * 10.0;
    
    return sky;
  }
  
  void main() {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_cameraPos - v_worldPos);
    vec3 L = normalize(u_sunDir);
    vec3 H = normalize(V + L);
    
    // Fresnel
    float F = schlickFresnel(N, V, 0.02);
    
    // Water base color from depth
    float depthFactor = smoothstep(-3.0, 3.0, v_eta);
    vec3 baseColor = mix(u_deepColor, u_shallowColor, depthFactor);
    
    // Wrapped diffuse lighting
    float wrap = max((dot(N, L) + 0.3) / 1.3, 0.0);
    vec3 diffuse = baseColor * wrap * u_sunColor;
    
    // Specular (Blinn-Phong)
    float NdotH = max(dot(N, H), 0.0);
    vec3 specular = u_sunColor * pow(NdotH, u_specPow) * F;
    
    // Environment reflection
    vec3 reflDir = reflect(-V, N);
    vec3 skyRefl = getSkyColor(reflDir);
    vec3 envColor = skyRefl * F * u_envRefl;
    
    // Subsurface scattering
    float sss = pow(max(0.0, dot(-V, L)), 4.0);
    vec3 sssColor = vec3(0.1, 0.4, 0.3) * sss * 0.3;
    
    // Foam from steepness + foam texture
    float foamFromSteep = smoothstep(u_foamThresh, u_foamThresh + 0.15, v_steepness);
    float totalFoam = max(foamFromSteep, v_foam) * u_foamIntensity;
    totalFoam = clamp(totalFoam, 0.0, 1.0);
    vec3 foamColor = vec3(0.9, 0.95, 1.0);
    
    // Combine
    vec3 waterSurface = diffuse + specular + envColor + sssColor;
    
    // ── Shore/Beach System ──
    // Shore detection: edges of the simulation domain act as shoreline
    vec2 shoreUV = v_uv;
    float shoreDist = min(min(shoreUV.x, 1.0 - shoreUV.x), min(shoreUV.y, 1.0 - shoreUV.y));
    float shoreZone = smoothstep(0.12, 0.02, shoreDist);
    
    // Shallow water depth for shore
    float shoreDepth = shoreDist * 20.0; // depth decreases near shore
    
    // Shore foam accumulation (waves pile up at shore)
    float shoreFoam = shoreZone * (0.3 + 0.5 * abs(sin(v_worldPos.x * 0.5 + u_time * 1.5)))
                    * (0.5 + v_steepness * 2.0);
    totalFoam = max(totalFoam, shoreFoam);
    
    // Sand color blending near shore
    vec3 sandColor = vec3(0.76, 0.70, 0.50);
    vec3 wetSandColor = vec3(0.55, 0.50, 0.35);
    float sandBlend = smoothstep(0.06, 0.01, shoreDist);
    vec3 shoreColor = mix(sandColor, wetSandColor, clamp(v_eta * 2.0 + 0.5, 0.0, 1.0));
    
    // Sand caustics in shallow water near shore
    float causticsPattern = 0.0;
    if (shoreZone > 0.0) {
      // Animated caustic pattern from overlapping sine waves
      float c1 = sin(v_worldPos.x * 3.0 + v_worldPos.z * 2.0 + u_time * 2.0);
      float c2 = sin(v_worldPos.x * 2.5 - v_worldPos.z * 3.5 + u_time * 1.7);
      float c3 = sin(v_worldPos.x * 1.8 + v_worldPos.z * 4.0 - u_time * 2.3);
      causticsPattern = pow(max(0.0, (c1 + c2 + c3) / 3.0), 2.0);
      causticsPattern *= shoreZone * smoothstep(0.0, 0.05, shoreDist); // fade at very edge
    }
    
    // Shallow water color shift (wave refraction effect)
    if (shoreZone > 0.0) {
      // Water gets more turquoise/green in shallows
      vec3 shallowTint = vec3(0.15, 0.55, 0.50);
      waterSurface = mix(waterSurface, shallowTint * (wrap * 0.8 + 0.4), shoreZone * 0.5);
      // Add caustics
      waterSurface += vec3(0.8, 0.9, 1.0) * causticsPattern * 0.3 * shoreZone;
    }
    
    // Combine water, foam, and shore
    vec3 finalColor = mix(waterSurface, foamColor, totalFoam);
    finalColor = mix(finalColor, shoreColor, sandBlend * (1.0 - clamp(v_eta * 5.0 + 0.5, 0.0, 1.0)));
    
    // Atmospheric distance fog
    float fogFactor = 1.0 - exp(-v_distToCamera * 0.002);
    fogFactor = clamp(fogFactor, 0.0, 0.85);
    vec3 fogColor = getSkyColor(vec3(0.0, 0.1, 1.0));
    finalColor = mix(finalColor, fogColor, fogFactor);
    
    // Tone mapping (Reinhard)
    finalColor = finalColor / (finalColor + vec3(1.0));
    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// CLEAR SHADER — fills target with uniform color
// ═══════════════════════════════════════════════════════════════
export const CLEAR_FRAG = `
  uniform vec4 u_clearColor;
  varying vec2 v_uv;
  void main() {
    gl_FragColor = u_clearColor;
  }
`;

// ═══════════════════════════════════════════════════════════════
// DEBUG VISUALIZATION SHADER
// ═══════════════════════════════════════════════════════════════
export const DEBUG_VIS_FRAG = `
  uniform sampler2D u_tex;
  uniform float u_mode;
  varying vec2 v_uv;
  
  vec3 heatmap(float t) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.25) return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), t * 4.0);
    if (t < 0.5)  return mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 1.0, 0.0), (t - 0.25) * 4.0);
    if (t < 0.75) return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.5) * 4.0);
    return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.75) * 4.0);
  }
  
  void main() {
    vec4 d = texture2D(u_tex, v_uv);
    vec3 c;
    
    if (u_mode < 0.5) {
      // Height η
      c = heatmap(d.r * 0.25 + 0.5);
    } else if (u_mode < 1.5) {
      // Steepness
      c = heatmap(d.r * 2.0);
    } else if (u_mode < 2.5) {
      // Jacobian (inverted: red = overturning)
      c = heatmap(1.0 - d.b);
    } else if (u_mode < 3.5) {
      // Foam density
      c = vec3(d.r);
    } else {
      c = vec3(d.rgb);
    }
    
    gl_FragColor = vec4(c, 0.65);
  }
`;

// ═══════════════════════════════════════════════════════════════
// SKY DOME SHADER
// ═══════════════════════════════════════════════════════════════
export const SKY_VERT = `
  varying vec3 v_worldDir;
  void main() {
    v_worldDir = gl_Vertex.xyz;
    vec4 pos = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
    gl_Position = vec4(pos.xy, pos.w, pos.w); // force to far plane
  }
`;

export const SKY_FRAG = `
  uniform vec3 u_sunDir;
  uniform vec3 u_sunColor;
  varying vec3 v_worldDir;
  
  void main() {
    vec3 dir = normalize(v_worldDir);
    
    float sunFade = clamp(1.0 - exp(-u_sunDir.y * 10.0), 0.0, 1.0);
    float skyFade = max(dir.y, 0.0);
    
    // Sky gradient  
    vec3 skyTop = vec3(0.2, 0.4, 0.8) * sunFade;
    vec3 skyHorizon = vec3(0.6, 0.7, 0.8) * sunFade;
    vec3 sky = mix(skyHorizon, skyTop, pow(skyFade, 0.5));
    
    // Sun glow
    float sunAngle = max(dot(dir, u_sunDir), 0.0);
    vec3 sunGlow = vec3(1.0, 0.7, 0.3) * pow(sunAngle, 8.0) * sunFade;
    sky += sunGlow * 0.6;
    
    // Sun disc
    sky += u_sunColor * pow(sunAngle, 4096.0) * 15.0;
    
    // Below horizon: dark
    if (dir.y < 0.0) {
      sky = mix(skyHorizon * sunFade, vec3(0.01, 0.03, 0.05), clamp(-dir.y * 5.0, 0.0, 1.0));
    }
    
    // Tone map
    sky = sky / (sky + vec3(1.0));
    sky = pow(sky, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(sky, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════
// SPHERE SHADER (interactive object)
// ═══════════════════════════════════════════════════════════════
export const SPHERE_VERT = `
  uniform vec3 u_sphereCenter;
  uniform float u_sphereRadius;
  varying vec3 v_position;
  varying vec3 v_normal;
  
  void main() {
    v_position = u_sphereCenter + gl_Vertex.xyz * u_sphereRadius;
    v_normal = normalize(gl_Vertex.xyz);
    gl_Position = gl_ModelViewProjectionMatrix * vec4(v_position, 1.0);
  }
`;

export const SPHERE_FRAG = `
  uniform vec3 u_sunDir;
  uniform vec3 u_sunColor;
  uniform sampler2D u_hf;
  uniform float u_oceanScale;
  varying vec3 v_position;
  varying vec3 v_normal;
  
  void main() {
    vec3 N = normalize(v_normal);
    vec3 L = normalize(u_sunDir);
    
    // Base sphere color
    vec3 color = vec3(0.4, 0.45, 0.5);
    
    // Diffuse
    float diff = max(dot(N, L), 0.0) * 0.6;
    
    // Ambient
    float amb = 0.3 + 0.1 * N.y;
    
    // Check if underwater
    vec2 hfUV = (v_position.xz / u_oceanScale) + 0.5;
    hfUV = clamp(hfUV, 0.001, 0.999);
    float eta = texture2D(u_hf, hfUV).r;
    
    if (v_position.y < eta) {
      // Underwater tint
      float depth = eta - v_position.y;
      color *= mix(vec3(0.6, 0.8, 1.0), vec3(0.2, 0.4, 0.6), clamp(depth * 0.5, 0.0, 1.0));
    }
    
    color *= (diff + amb);
    
    // Simple specular
    vec3 V = normalize(vec3(0.0, 2.0, 5.0) - v_position);
    vec3 H = normalize(V + L);
    float spec = pow(max(dot(N, H), 0.0), 64.0);
    color += u_sunColor * spec * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default {
  FULLSCREEN_VERT,
  SWE_UPDATE_FRAG,
  DIAGNOSTICS_FRAG,
  FOAM_FRAG,
  OCEAN_SURFACE_VERT,
  OCEAN_SURFACE_FRAG,
  CLEAR_FRAG,
  DEBUG_VIS_FRAG,
  SKY_VERT,
  SKY_FRAG,
  SPHERE_VERT,
  SPHERE_FRAG,
};
