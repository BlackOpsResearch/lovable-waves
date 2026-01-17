/**
 * Enhanced Water Surface Shaders
 * Complete water rendering with Fresnel, subsurface scattering, foam, and caustics
 */

export const WATER_HELPER_FUNCTIONS = `
  const vec3 abovewaterColor = vec3(0.25, 1.0, 1.25);
  const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
  const vec3 deepOceanColor = vec3(0.0, 0.05, 0.15);
  const float poolHeight = 1.0;
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float PI = 3.14159265359;
  
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform sampler2D water;
  uniform float time;
  uniform float causticsScale;
  uniform float causticsStrength;
  uniform float dispersionStrength;
  uniform float foamStrength;
  uniform float foamScale;
  
  // Fast hash
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
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
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  float intersectSphere(vec3 origin, vec3 ray, vec3 center, float radius) {
    vec3 toSphere = origin - center;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - radius * radius;
    float discriminant = b * b - 4.0 * a * c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
  
  vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);
    
    // Ambient occlusion
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    
    // Caustics on sphere
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec2 causticUv = causticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5;
      float c = texture2D(causticTex, causticUv).r;
      vec3 causticRgb = vec3(c);
      
      if (dispersionStrength > 0.0) {
        vec2 delta = dispersionStrength * normalize(refractedLight.xz);
        causticRgb.r = texture2D(causticTex, causticUv + delta).r;
        causticRgb.g = c;
        causticRgb.b = texture2D(causticTex, causticUv - delta).r;
      }
      color += diffuse * causticRgb * (4.0 * causticsStrength);
    } else {
      color += diffuse;
    }
    
    return color;
  }
  
  vec3 getWallColor(vec3 point) {
    float scale = 0.5;
    vec3 wallColor;
    vec3 normal;
    
    if (abs(point.x) > 0.999) {
      wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > 0.999) {
      wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }
    
    scale /= length(point);
    scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0);
    
    // Caustics on walls/floor
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    
    if (point.y < info.r) {
      vec4 caustic = texture2D(causticTex, causticsScale * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      scale += diffuse * caustic.r * (2.0 * causticsStrength) * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
`;

export const WATER_VERTEX = `
  uniform sampler2D water;
  uniform float time;
  varying vec3 position;
  
  void main() {
    vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
    position = gl_Vertex.xzy;
    
    // Add Gerstner-style wave displacement
    float w1 = sin(position.x * 2.0 + position.z * 0.5 + time * 1.5) * 0.08;
    float w2 = sin(position.x * 1.5 - position.z * 1.0 + time * 1.2) * 0.06;
    float w3 = sin(position.x * 3.0 + position.z * 2.0 + time * 2.0) * 0.04;
    float w4 = sin(position.x * 0.5 + position.z * 3.0 + time * 0.8) * 0.05;
    
    position.y += info.r + w1 + w2 + w3 + w4;
    
    gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
  }
`;

export const WATER_FRAGMENT_ABOVE = `
  precision highp float;
  ${WATER_HELPER_FUNCTIONS}
  
  uniform vec3 eye;
  uniform vec3 sunDir;
  uniform samplerCube sky;
  uniform float turbidity;
  uniform float rayleighCoef;
  uniform float mieCoef;
  uniform float mieG;
  varying vec3 position;
  
  // Atmospheric scattering
  const float e = 2.71828182845904523536;
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
  
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + pow(cosTheta, 2.0));
  }
  
  float hgPhase(float cosTheta, float g) {
    float g2 = pow(g, 2.0);
    float inverse = 1.0 / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
    return (1.0 / (4.0 * PI)) * ((1.0 - g2) * inverse);
  }
  
  vec3 Uncharted2Tonemap(vec3 x) {
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
  }
  
  vec3 getAtmosphericColor(vec3 direction) {
    vec3 up = vec3(0.0, 1.0, 0.0);
    float sunE = sunIntensity(dot(sunDir, up));
    float sunfade = 1.0 - clamp(1.0 - exp(sunDir.y * 0.1), 0.0, 1.0);
    float rayleighC = rayleighCoef - (1.0 * (1.0 - sunfade));
    
    vec3 betaR = totalRayleigh * rayleighC;
    vec3 betaM = totalMie(turbidity) * mieCoef;
    
    float zenithAngle = acos(max(0.0, dot(up, direction)));
    float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / PI), -1.253));
    float sR = 8400.0 * inverse;
    float sM = 1200.0 * inverse;
    
    vec3 Fex = exp(-(betaR * sR + betaM * sM));
    float cosTheta = dot(direction, sunDir);
    float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
    vec3 betaRTheta = betaR * rPhase;
    float mPhase = hgPhase(cosTheta, mieG);
    vec3 betaMTheta = betaM * mPhase;
    
    vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3(1.5));
    Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(0.5)), clamp(pow(1.0 - dot(up, sunDir), 5.0), 0.0, 1.0));
    
    vec3 L0 = vec3(0.1) * Fex;
    float sundisk = smoothstep(0.9995, 0.9999, cosTheta);
    L0 += (sunE * 19000.0 * Fex) * sundisk;
    
    vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
    vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * sunfade))));
    return Uncharted2Tonemap(retColor * 0.5) * 1.0748724675633854;
  }
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      color = getWallColor(hit);
    } else {
      color = getAtmosphericColor(ray);
      float sunSpec = pow(max(0.0, dot(ray, sunDir)), 500.0);
      color += vec3(1.0, 0.9, 0.7) * sunSpec * 5.0;
    }
    
    if (ray.y < 0.0) {
      color *= waterColor;
    }
    
    return color;
  }
  
  void main() {
    vec2 coord = position.xz * 0.5 + 0.5;
    vec4 info = texture2D(water, coord);
    
    // Refine normal with iterations
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(water, coord);
    }
    
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    
    // Add wave normal perturbation
    normal.x += sin(position.x * 5.0 + time * 2.0) * 0.02;
    normal.z += cos(position.z * 5.0 + time * 1.8) * 0.02;
    normal = normalize(normal);
    
    vec3 incomingRay = normalize(position - eye);
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    
    // Fresnel with physically based equation
    float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, abovewaterColor);
    vec3 refractedColor = getSurfaceRayColor(position, refractedRay, abovewaterColor);
    
    vec3 color = mix(refractedColor, reflectedColor, fresnel);
    
    // Add foam on wave peaks
    float foam = smoothstep(0.1, 0.25, position.y);
    float foamNoise = 0.85 + 0.15 * fbm(position.xz * foamScale + vec2(time * 0.25), 4);
    foam *= foamNoise * foamStrength;
    vec3 foamColor = vec3(0.95, 0.98, 1.0);
    color = mix(color, foamColor, foam * 0.5);
    
    // Subsurface scattering hint
    float sss = max(0.0, dot(normalize(eye - position), sunDir));
    sss = pow(sss, 8.0) * 0.3;
    color += vec3(0.1, 0.4, 0.5) * sss * (1.0 - fresnel);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const WATER_FRAGMENT_UNDERWATER = `
  precision highp float;
  ${WATER_HELPER_FUNCTIONS}
  
  uniform vec3 eye;
  uniform vec3 sunDir;
  uniform samplerCube sky;
  uniform float turbidity;
  uniform float rayleighCoef;
  uniform float mieCoef;
  uniform float mieG;
  varying vec3 position;
  
  vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
    
    if (q < 1.0e6) {
      color = getSphereColor(origin + ray * q);
    } else if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      vec3 hit = origin + ray * t.y;
      color = getWallColor(hit);
    } else {
      color = textureCube(sky, ray).rgb;
      float sunSpec = pow(max(0.0, dot(ray, sunDir)), 500.0);
      color += vec3(1.0, 0.9, 0.7) * sunSpec * 5.0;
    }
    
    if (ray.y < 0.0) {
      color *= waterColor;
    }
    
    return color;
  }
  
  void main() {
    vec2 coord = position.xz * 0.5 + 0.5;
    vec4 info = texture2D(water, coord);
    
    for (int i = 0; i < 5; i++) {
      coord += info.ba * 0.005;
      info = texture2D(water, coord);
    }
    
    vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
    normal = -normal;
    
    vec3 incomingRay = normalize(position - eye);
    vec3 reflectedRay = reflect(incomingRay, normal);
    vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
    
    vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, underwaterColor);
    vec3 refractedColor = getSurfaceRayColor(position, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
    
    vec3 color = mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay));
    
    // Underwater fog
    float fogDist = length(position - eye);
    vec3 fogColor = underwaterColor * 0.5;
    color = mix(color, fogColor, 1.0 - exp(-fogDist * 0.3));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Cube/pool rendering shader
export const CUBE_VERTEX = `
  varying vec3 vPosition;
  const float poolHeight = 1.0;
  
  void main() {
    vPosition = gl_Vertex.xyz;
    vPosition.y = ((1.0 - vPosition.y) * (7.0 / 12.0) - 1.0) * poolHeight;
    gl_Position = gl_ModelViewProjectionMatrix * vec4(vPosition, 1.0);
  }
`;

export const CUBE_FRAGMENT = `
  precision highp float;
  ${WATER_HELPER_FUNCTIONS}
  
  varying vec3 vPosition;
  
  void main() {
    gl_FragColor = vec4(getWallColor(vPosition), 1.0);
    vec4 info = texture2D(water, vPosition.xz * 0.5 + 0.5);
    if (vPosition.y < info.r) {
      gl_FragColor.rgb *= underwaterColor * 1.2;
    }
  }
`;

// Sphere shader
export const SPHERE_VERTEX = `
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  varying vec3 vPosition;
  
  void main() {
    vPosition = sphereCenter + gl_Vertex.xyz * sphereRadius;
    gl_Position = gl_ModelViewProjectionMatrix * vec4(vPosition, 1.0);
  }
`;

export const SPHERE_FRAGMENT = `
  precision highp float;
  ${WATER_HELPER_FUNCTIONS}
  
  varying vec3 vPosition;
  
  void main() {
    gl_FragColor = vec4(getSphereColor(vPosition), 1.0);
    vec4 info = texture2D(water, vPosition.xz * 0.5 + 0.5);
    if (vPosition.y < info.r) {
      gl_FragColor.rgb *= underwaterColor * 1.2;
    }
  }
`;
