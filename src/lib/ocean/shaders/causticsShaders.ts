/**
 * Enhanced Caustics Shaders
 * Ported from GPT Waves V7 with transmission, absorption, and soft sun
 */

export const CAUSTICS_VERTEX = `
  precision highp float;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  uniform sampler2D water;
  uniform vec3 light;
  uniform float poolHeight;
  uniform float projectionScale;
  
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 ray;
  varying vec3 surfaceNormal;
  varying float pathLength;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
    vec2 tcube = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    origin += ray * tcube.y;
    float tplane = (-origin.y - poolHeight) / refractedLight.y;
    return origin + refractedLight * tplane;
  }
  
  void main() {
    vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
    vec2 slope = info.ba * 0.5;
    float ny = sqrt(max(1.0 - dot(slope, slope), 0.0));
    vec3 normal = normalize(vec3(slope.x, ny, slope.y));
    
    vec3 lightDir = normalize(light);
    float eta = IOR_AIR / IOR_WATER;
    vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), eta);
    ray = refract(-lightDir, normal, eta);
    surfaceNormal = normal;
    
    oldPos = project(gl_Vertex.xzy, refractedLight, refractedLight);
    newPos = project(gl_Vertex.xzy + vec3(0.0, info.r, 0.0), ray, refractedLight);
    
    vec3 surfacePoint = gl_Vertex.xzy + vec3(0.0, info.r, 0.0);
    vec2 t = intersectCube(surfacePoint, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    pathLength = max(t.y, 0.0) * max(length(ray), 1e-5);
    
    gl_Position = vec4(projectionScale * (newPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
  }
`;

export const CAUSTICS_FRAGMENT = `
  precision highp float;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform float poolHeight;
  uniform float baseGain;
  uniform float intensity;
  uniform float sampleWeight;
  uniform float outputAlpha;
  uniform float areaMode; // 0=product(legacy), 1=cross(v2), 2=none(flat)
  uniform float focusEpsilon;
  uniform float maxFocus;
  uniform float transmissionEnabled;
  uniform float fresnelF0;
  uniform float absorptionEnabled;
  uniform float absorptionSigma;
  
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 ray;
  varying vec3 surfaceNormal;
  varying float pathLength;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  float fresnelSchlick(float cosTheta, float F0) {
    float m = clamp(1.0 - cosTheta, 0.0, 1.0);
    float m2 = m * m;
    float m5 = m2 * m2 * m;
    return F0 + (1.0 - F0) * m5;
  }
  
  void main() {
    float focus = 1.0;
    
    // Area change calculation for focus intensity
    if (areaMode < 1.5) {
      vec3 oldDx = dFdx(oldPos);
      vec3 oldDy = dFdy(oldPos);
      vec3 newDx = dFdx(newPos);
      vec3 newDy = dFdy(newPos);
      
      float oldArea = areaMode < 0.5 ? length(oldDx) * length(oldDy) : length(cross(oldDx, oldDy));
      float newArea = areaMode < 0.5 ? length(newDx) * length(newDy) : length(cross(newDx, newDy));
      newArea = max(newArea, focusEpsilon);
      
      focus = clamp(oldArea / newArea, 0.0, maxFocus);
    }
    
    float causticIntensity = focus * baseGain * intensity * sampleWeight;
    
    // Fresnel transmission
    if (transmissionEnabled > 0.5) {
      vec3 n = normalize(surfaceNormal);
      vec3 lightDir = normalize(light);
      float cosI = clamp(dot(n, lightDir), 0.0, 1.0);
      float F = fresnelSchlick(cosI, fresnelF0);
      causticIntensity *= (1.0 - F);
    }
    
    // Beer-Lambert absorption
    if (absorptionEnabled > 0.5) {
      causticIntensity *= exp(-absorptionSigma * max(pathLength, 0.0));
    }
    
    gl_FragColor = vec4(causticIntensity, 1.0, 0.0, outputAlpha);
    
    // Sphere shadow
    vec3 lightDir = normalize(light);
    vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    vec3 dir = (sphereCenter - newPos) / sphereRadius;
    vec3 area = cross(dir, refractedLight);
    float shadow = dot(area, area);
    float dist = dot(dir, -refractedLight);
    shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
    shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
    shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
    gl_FragColor.g = shadow * sampleWeight;
    
    // Pool rim shadow
    vec2 t = intersectCube(newPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
  }
`;

// Fallback for devices without derivatives
export const CAUSTICS_FRAGMENT_FALLBACK = `
  precision highp float;
  
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform float poolHeight;
  uniform float baseGain;
  uniform float intensity;
  uniform float sampleWeight;
  uniform float outputAlpha;
  
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 ray;
  varying vec3 surfaceNormal;
  varying float pathLength;
  
  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }
  
  void main() {
    float causticIntensity = baseGain * intensity * sampleWeight;
    gl_FragColor = vec4(causticIntensity, 1.0, 0.0, outputAlpha);
    
    vec3 lightDir = normalize(light);
    vec3 refractedLight = refract(-lightDir, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    
    vec3 dir = (sphereCenter - newPos) / sphereRadius;
    vec3 area = cross(dir, refractedLight);
    float shadow = dot(area, area);
    float dist = dot(dir, -refractedLight);
    shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
    shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
    shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
    gl_FragColor.g = shadow * sampleWeight;
    
    vec2 t = intersectCube(newPos, -refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
  }
`;
