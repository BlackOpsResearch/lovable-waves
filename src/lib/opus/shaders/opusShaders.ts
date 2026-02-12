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
// OCEAN SURFACE VERTEX SHADER (SWE + JONSWAP Gerstner + hull)
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
  uniform float u_windSpeed;
  uniform float u_fetch;
  
  varying vec3 v_worldPos;
  varying vec3 v_normal;
  varying float v_steepness;
  varying float v_eta;
  varying float v_foam;
  varying float v_distToCamera;
  varying vec2 v_uv;
  
  // ── JONSWAP Spectrum Gerstner ──
  const float PI_W = 3.14159265359;
  const float GRAV = 9.81;
  
  float jonswapS(float omega, float omegaP, float alpha) {
    float sigma = omega <= omegaP ? 0.07 : 0.09;
    float r = exp(-pow(omega - omegaP, 2.0) / (2.0 * sigma * sigma * omegaP * omegaP));
    float pm = (alpha * GRAV * GRAV / pow(omega, 5.0)) * exp(-1.25 * pow(omegaP / omega, 4.0));
    return pm * pow(3.3, r);
  }
  
  vec3 gerstnerJ(vec2 pos, float t, vec2 dir, float omega, float amp, float steep) {
    float k = omega * omega / GRAV;
    float phase = k * dot(dir, pos) - omega * t;
    float Q = steep / max(k, 0.001);
    return vec3(dir.x * Q * cos(phase), amp * sin(phase), dir.y * Q * cos(phase));
  }
  
  void main() {
    v_uv = gl_Vertex.xy * 0.5 + 0.5;
    
    // Sample SWE heightfield
    vec4 hfData = texture2D(u_hf, v_uv);
    float eta = hfData.r;
    
    // Compute world position
    vec2 worldXZ = (v_uv - 0.5) * u_oceanScale;
    
    // ── JONSWAP-driven Gerstner Wave Blend ──
    vec3 gerstnerOffset = vec3(0.0);
    if (u_gerstnerAmp > 0.001) {
      float windRad = u_windDir * PI_W / 180.0;
      vec2 wd = vec2(cos(windRad), sin(windRad));
      
      // Compute JONSWAP parameters from wind/fetch
      float ws = max(u_windSpeed, 0.5);
      float omegaP = 22.0 * pow((GRAV * GRAV) / (ws * u_fetch), 0.333);
      float alpha = 0.076 * pow(GRAV * u_fetch / (ws * ws), -0.22);
      
      // Generate wave components from spectrum (8 waves for vertex shader)
      float omegaMin = omegaP * 0.5;
      float omegaMax = omegaP * 4.0;
      float logMin = log(omegaMin);
      float logMax = log(omegaMax);
      
      // Direction offsets for spread
      float angles[8];
      angles[0] = 0.0; angles[1] = 0.15; angles[2] = -0.25; angles[3] = 0.4;
      angles[4] = -0.1; angles[5] = 0.55; angles[6] = -0.45; angles[7] = 0.7;
      
      float speeds[8];
      speeds[0] = 1.0; speeds[1] = 1.05; speeds[2] = 1.1; speeds[3] = 0.95;
      speeds[4] = 1.15; speeds[5] = 0.9; speeds[6] = 1.2; speeds[7] = 0.85;
      
      // LOD: fewer waves at distance
      float dist = length(u_cameraPos.xz - worldXZ);
      int numWaves = int(mix(3.0, 8.0, 1.0 - smoothstep(0.0, 500.0, dist)));
      
      for (int i = 0; i < 8; i++) {
        if (i >= numWaves) break;
        float t = float(i) / 7.0;
        float omega = exp(mix(logMin, logMax, t));
        float S = jonswapS(omega, omegaP, alpha);
        float dOmega = (logMax - logMin) / 8.0 * omega;
        float amp = sqrt(2.0 * S * dOmega) * u_gerstnerAmp;
        vec2 dir = vec2(cos(windRad + angles[i]), sin(windRad + angles[i]));
        float steep = u_gerstnerSteep * min(1.0, 0.4 + 0.6 * omega / omegaP);
        gerstnerOffset += gerstnerJ(worldXZ, u_time * speeds[i], dir, omega, amp, steep);
      }
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
    
    // Add Gerstner normal contribution (finite difference on dominant wave)
    float gNx = 0.0, gNz = 0.0;
    if (u_gerstnerAmp > 0.001) {
      float eps = dx;
      float windRad = u_windDir * PI_W / 180.0;
      vec2 wd = vec2(cos(windRad), sin(windRad));
      float ws = max(u_windSpeed, 0.5);
      float omegaP = 22.0 * pow((GRAV * GRAV) / (ws * u_fetch), 0.333);
      float alpha = 0.076 * pow(GRAV * u_fetch / (ws * ws), -0.22);
      float S = jonswapS(omegaP, omegaP, alpha);
      float amp = sqrt(2.0 * S * omegaP * 0.3) * u_gerstnerAmp;
      
      float hGC = gerstnerJ(worldXZ, u_time, wd, omegaP, amp, u_gerstnerSteep * 0.5).y;
      float hGL = gerstnerJ(worldXZ + vec2(-eps, 0.0), u_time, wd, omegaP, amp, u_gerstnerSteep * 0.5).y;
      float hGR = gerstnerJ(worldXZ + vec2(eps, 0.0), u_time, wd, omegaP, amp, u_gerstnerSteep * 0.5).y;
      float hGD = gerstnerJ(worldXZ + vec2(0.0, -eps), u_time, wd, omegaP, amp, u_gerstnerSteep * 0.5).y;
      float hGU = gerstnerJ(worldXZ + vec2(0.0, eps), u_time, wd, omegaP, amp, u_gerstnerSteep * 0.5).y;
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
  uniform float u_turbidity;
  uniform float u_rayleighScale;
  uniform float u_sunIntensity;
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
  
  // Physically-based sky color for reflections (Rayleigh+Mie approximation)
  vec3 getSkyColor(vec3 dir) {
    vec3 sunDir = normalize(u_sunDir);
    float cosTheta = dot(dir, sunDir);
    float sunFade = clamp(1.0 - exp(-sunDir.y * 10.0), 0.0, 1.0);
    float skyFade = max(dir.y, 0.0);
    
    // Rayleigh-dominated blue sky
    vec3 rayleighColor = vec3(0.15, 0.35, 0.65) * u_rayleighScale * sunFade;
    
    // Horizon warm band (Mie forward-scatter)
    float horizonGlow = exp(-skyFade * 3.0) * sunFade;
    vec3 horizonColor = mix(vec3(0.5, 0.4, 0.3), vec3(0.7, 0.5, 0.3), u_turbidity * 0.1) * horizonGlow;
    
    vec3 sky = mix(horizonColor, rayleighColor, pow(skyFade, 0.5 + u_turbidity * 0.02));
    
    // Mie glow around sun
    float mieGlow = pow(max(cosTheta, 0.0), 8.0);
    sky += vec3(1.0, 0.7, 0.3) * mieGlow * u_turbidity * 0.05 * sunFade;
    
    // Sun disc
    sky += u_sunColor * pow(max(cosTheta, 0.0), 4096.0) * u_sunIntensity * 10.0;
    
    // Sunset coloring
    if (sunDir.y < 0.2 && sunDir.y > -0.1) {
      float sunsetFactor = 1.0 - smoothstep(-0.1, 0.2, sunDir.y);
      float angularDist = 1.0 - max(cosTheta, 0.0);
      sky += vec3(1.0, 0.4, 0.1) * sunsetFactor * exp(-angularDist * 2.0) * 0.5;
    }
    
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
    vec3 diffuse = baseColor * wrap * u_sunColor * u_sunIntensity;
    
    // Specular (Blinn-Phong)
    float NdotH = max(dot(N, H), 0.0);
    vec3 specular = u_sunColor * pow(NdotH, u_specPow) * F * u_sunIntensity;
    
    // Environment reflection
    vec3 reflDir = reflect(-V, N);
    vec3 skyRefl = getSkyColor(reflDir);
    vec3 envColor = skyRefl * F * u_envRefl;
    
    // Subsurface scattering
    float sss = pow(max(0.0, dot(-V, L)), 4.0);
    vec3 sssColor = vec3(0.1, 0.4, 0.3) * sss * 0.3 * u_sunIntensity;
    
    // Foam
    float foamFromSteep = smoothstep(u_foamThresh, u_foamThresh + 0.15, v_steepness);
    float totalFoam = max(foamFromSteep, v_foam) * u_foamIntensity;
    totalFoam = clamp(totalFoam, 0.0, 1.0);
    vec3 foamColor = vec3(0.9, 0.95, 1.0);
    
    // Combine
    vec3 waterSurface = diffuse + specular + envColor + sssColor;
    
    // ── Shore/Beach System ──
    vec2 shoreUV = v_uv;
    float shoreDist = min(min(shoreUV.x, 1.0 - shoreUV.x), min(shoreUV.y, 1.0 - shoreUV.y));
    float shoreZone = smoothstep(0.12, 0.02, shoreDist);
    
    float shoreFoam = shoreZone * (0.3 + 0.5 * abs(sin(v_worldPos.x * 0.5 + u_time * 1.5)))
                    * (0.5 + v_steepness * 2.0);
    totalFoam = max(totalFoam, shoreFoam);
    
    vec3 sandColor = vec3(0.76, 0.70, 0.50);
    vec3 wetSandColor = vec3(0.55, 0.50, 0.35);
    float sandBlend = smoothstep(0.06, 0.01, shoreDist);
    vec3 shoreColor = mix(sandColor, wetSandColor, clamp(v_eta * 2.0 + 0.5, 0.0, 1.0));
    
    // Sand caustics
    float causticsPattern = 0.0;
    if (shoreZone > 0.0) {
      float c1 = sin(v_worldPos.x * 3.0 + v_worldPos.z * 2.0 + u_time * 2.0);
      float c2 = sin(v_worldPos.x * 2.5 - v_worldPos.z * 3.5 + u_time * 1.7);
      float c3 = sin(v_worldPos.x * 1.8 + v_worldPos.z * 4.0 - u_time * 2.3);
      causticsPattern = pow(max(0.0, (c1 + c2 + c3) / 3.0), 2.0);
      causticsPattern *= shoreZone * smoothstep(0.0, 0.05, shoreDist);
    }
    
    if (shoreZone > 0.0) {
      vec3 shallowTint = vec3(0.15, 0.55, 0.50);
      waterSurface = mix(waterSurface, shallowTint * (wrap * 0.8 + 0.4), shoreZone * 0.5);
      waterSurface += vec3(0.8, 0.9, 1.0) * causticsPattern * 0.3 * shoreZone;
    }
    
    vec3 finalColor = mix(waterSurface, foamColor, totalFoam);
    finalColor = mix(finalColor, shoreColor, sandBlend * (1.0 - clamp(v_eta * 5.0 + 0.5, 0.0, 1.0)));
    
    // ── Atmospheric Perspective (Rayleigh/Mie fog) ──
    vec3 viewDir = normalize(v_worldPos - u_cameraPos);
    float dist = v_distToCamera;
    
    // Rayleigh extinction
    vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6) * u_rayleighScale;
    float betaM = u_turbidity * 2e-6;
    vec3 extinction = exp(-(betaR + vec3(betaM * 1.1)) * dist * 0.0003);
    
    // Inscattered fog color
    float cosTheta = dot(viewDir, L);
    float phaseR = (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
    float g = 0.76;
    float g2 = g * g;
    float phaseM = (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
    float sunFadeF = clamp(L.y * 3.0 + 0.3, 0.0, 1.0);
    vec3 inscatter = (betaR * phaseR + vec3(betaM) * phaseM) * sunFadeF * 25.0;
    
    finalColor = finalColor * extinction + inscatter * (vec3(1.0) - extinction);
    
    // Tone mapping (ACES filmic)
    finalColor = finalColor * 0.6;
    vec3 a = finalColor * (finalColor + vec3(0.0245786)) - vec3(0.000090537);
    vec3 b = finalColor * (0.983729 * finalColor + vec3(0.4329510)) + vec3(0.238081);
    finalColor = a / b;
    
    // Gamma
    finalColor = pow(max(finalColor, vec3(0.0)), vec3(1.0 / 2.2));
    
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
export { ATMOSPHERE_SKY_VERT as SKY_VERT, ATMOSPHERE_SKY_FRAG as SKY_FRAG } from './atmosphereShaders';

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

// Re-exported from atmosphereShaders via named exports above (SKY_VERT, SKY_FRAG)
export default {
  FULLSCREEN_VERT,
  SWE_UPDATE_FRAG,
  DIAGNOSTICS_FRAG,
  FOAM_FRAG,
  OCEAN_SURFACE_VERT,
  OCEAN_SURFACE_FRAG,
  CLEAR_FRAG,
  DEBUG_VIS_FRAG,
  SPHERE_VERT,
  SPHERE_FRAG,
};
