/**
 * Ocean Renderer with sky, clouds, god rays, and atmospheric effects
 * Complete oceanic rendering system
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Cubemap } from '../webgl/Cubemap';
import { Mesh } from '../webgl/Mesh';
import { Raytracer } from '../webgl/Raytracer';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Vector } from '../webgl/Vector';
import { OceanSimulation } from './OceanSimulation';
import { OceanSettings } from './types';

const helperFunctions = `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float PI = 3.14159265359;
  
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform sampler2D water;
  uniform sampler2D causticTex;
  uniform float time;
  
  // Gerstner wave calculation (simplified for shader)
  vec3 gerstnerOffset(vec3 pos, float t) {
    vec3 offset = vec3(0.0);
    
    // Multiple wave contributions
    float w1 = sin(pos.x * 2.0 + pos.z * 0.5 + t * 1.5) * 0.1;
    float w2 = sin(pos.x * 1.5 - pos.z * 1.0 + t * 1.2) * 0.08;
    float w3 = sin(pos.x * 3.0 + pos.z * 2.0 + t * 2.0) * 0.05;
    float w4 = sin(pos.x * 0.5 + pos.z * 3.0 + t * 0.8) * 0.07;
    
    offset.y = w1 + w2 + w3 + w4;
    offset.x = cos(pos.x * 2.0 + t) * 0.03;
    offset.z = cos(pos.z * 2.0 + t * 0.9) * 0.03;
    
    return offset;
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
    float discriminant = b*b - 4.0*a*c;
    if (discriminant > 0.0) {
      float t = (-b - sqrt(discriminant)) / (2.0 * a);
      if (t > 0.0) return t;
    }
    return 1.0e6;
  }
  
  vec3 getSphereColor(vec3 point) {
    vec3 color = vec3(0.5);
    
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
    color *= 1.0 - 0.9 / pow((point.y + 1.0 + sphereRadius) / sphereRadius, 3.0);
    
    vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      diffuse *= caustic.r * 4.0;
    }
    color += diffuse;
    
    return color;
  }
`;

// Atmospheric scattering for sky
const skyFunctions = `
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
  
  vec3 getAtmosphericColor(vec3 direction, vec3 sunDir, float turbidity, float rayleigh, float mieCoefficient, float mieG) {
    vec3 up = vec3(0.0, 1.0, 0.0);
    
    float sunE = sunIntensity(dot(sunDir, up));
    float sunfade = 1.0 - clamp(1.0 - exp(sunDir.y * 0.1), 0.0, 1.0);
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
    
    float mPhase = hgPhase(cosTheta, mieG);
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
    
    return Uncharted2Tonemap(retColor * 0.5) * 1.0748724675633854;
  }
`;

export class OceanRenderer {
  gl: GLContextExtended;
  tileTexture: Texture;
  causticTex: Texture;
  lightDir: Vector;
  sphereCenter: Vector;
  sphereRadius: number;
  time: number = 0;
  
  // Meshes
  waterMesh: Mesh;
  sphereMesh: Mesh;
  skyMesh: Mesh;
  
  // Shaders
  waterShaders: Shader[];
  sphereShader: Shader;
  skyShader: Shader;
  causticsShader: Shader;
  
  // Sky settings
  turbidity: number = 2.0;
  rayleigh: number = 1.0;
  mieCoefficient: number = 0.005;
  mieDirectionalG: number = 0.8;
  
  constructor(gl: GLContextExtended, tileCanvas: HTMLCanvasElement) {
    this.gl = gl;
    
    this.tileTexture = Texture.fromImage(gl, tileCanvas, {
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      wrap: gl.REPEAT,
      format: gl.RGB
    });
    
    this.lightDir = new Vector(50, 30, 50).unit();
    this.causticTex = new Texture(gl, 1024, 1024);
    this.waterMesh = Mesh.plane(gl, { detail: 200 });
    this.sphereCenter = new Vector();
    this.sphereRadius = 0.25;
    this.waterShaders = [];
    
    // Create sky dome mesh
    this.skyMesh = Mesh.sphere(gl, { detail: 32 });
    
    // Above and below water shaders with atmospheric effects
    for (let i = 0; i < 2; i++) {
      const underwaterCode = i ? `
        normal = -normal;
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
        float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, vec3(0.2, 0.4, 0.5));
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
        
        gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);
      ` : `
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
        float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, vec3(0.25, 0.8, 1.0));
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, vec3(0.25, 0.8, 1.0));
        
        // Add foam on wave peaks
        float foam = smoothstep(0.1, 0.3, position.y) * 0.5;
        vec3 foamColor = vec3(0.95, 0.98, 1.0);
        
        vec3 finalColor = mix(refractedColor, reflectedColor, fresnel);
        finalColor = mix(finalColor, foamColor, foam);
        
        gl_FragColor = vec4(finalColor, 1.0);
      `;

      this.waterShaders[i] = new Shader(gl, `
        uniform sampler2D water;
        uniform float time;
        varying vec3 position;
        
        void main() {
          vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
          position = gl_Vertex.xzy;
          
          // Add Gerstner wave displacement
          float w1 = sin(position.x * 2.0 + position.z * 0.5 + time * 1.5) * 0.08;
          float w2 = sin(position.x * 1.5 - position.z * 1.0 + time * 1.2) * 0.06;
          float w3 = sin(position.x * 3.0 + position.z * 2.0 + time * 2.0) * 0.04;
          float w4 = sin(position.x * 0.5 + position.z * 3.0 + time * 0.8) * 0.05;
          
          position.y += info.r + w1 + w2 + w3 + w4;
          
          gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
        }
      `, helperFunctions + skyFunctions + `
        uniform vec3 eye;
        uniform vec3 sunDir;
        uniform float turbidity;
        uniform float rayleighCoef;
        uniform float mieCoef;
        uniform float mieG;
        varying vec3 position;
        uniform samplerCube sky;
        
        vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
          vec3 color;
          float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
          if (q < 1.0e6) {
            color = getSphereColor(origin + ray * q);
          } else if (ray.y < 0.0) {
            // Ocean floor (deep water effect)
            float depth = -origin.y / ray.y;
            vec3 floorPoint = origin + ray * depth;
            float dist = length(floorPoint - origin);
            
            // Deep ocean color with caustics
            vec3 deepColor = vec3(0.0, 0.05, 0.15);
            vec4 caustic = texture2D(causticTex, floorPoint.xz * 0.1);
            deepColor += caustic.rgb * 0.3 * exp(-dist * 0.5);
            
            color = deepColor;
          } else {
            // Sky with atmospheric scattering
            color = getAtmosphericColor(ray, sunDir, turbidity, rayleighCoef, mieCoef, mieG);
            
            // Add specular sun reflection
            float sunSpec = pow(max(0.0, dot(ray, sunDir)), 500.0);
            color += vec3(1.0, 0.9, 0.7) * sunSpec * 5.0;
          }
          if (ray.y < 0.0) color *= waterColor;
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
          
          // Add wave normal perturbation
          float t = time;
          normal.x += sin(position.x * 5.0 + t * 2.0) * 0.02;
          normal.z += cos(position.z * 5.0 + t * 1.8) * 0.02;
          normal = normalize(normal);
          
          vec3 incomingRay = normalize(position - eye);
          
          ${underwaterCode}
        }
      `);
    }

    // Sphere shader
    this.sphereMesh = Mesh.sphere(gl, { detail: 10 });
    this.sphereShader = new Shader(gl, `
      uniform vec3 sphereCenter;
      uniform float sphereRadius;
      varying vec3 position;
      void main() {
        position = sphereCenter + gl_Vertex.xyz * sphereRadius;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
      }
    `, helperFunctions + `
      varying vec3 position;
      void main() {
        gl_FragColor = vec4(getSphereColor(position), 1.0);
      }
    `);
    
    // Sky shader with atmospheric scattering
    this.skyShader = new Shader(gl, `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = gl_ModelViewMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
        gl_Position.z = gl_Position.w; // Sky at far plane
      }
    `, skyFunctions + `
      varying vec3 vWorldPosition;
      uniform vec3 sunDir;
      uniform float turbidity;
      uniform float rayleighCoef;
      uniform float mieCoef;
      uniform float mieG;
      
      void main() {
        vec3 direction = normalize(vWorldPosition);
        vec3 color = getAtmosphericColor(direction, sunDir, turbidity, rayleighCoef, mieCoef, mieG);
        gl_FragColor = vec4(color, 1.0);
      }
    `);
    
    // Caustics shader
    const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
    this.causticsShader = new Shader(gl, helperFunctions + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      
      vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
        vec2 tcube = intersectCube(origin, ray, vec3(-100.0, -100.0, -100.0), vec3(100.0, 2.0, 100.0));
        origin += ray * tcube.y;
        float tplane = (-origin.y - 10.0) / refractedLight.y;
        return origin + refractedLight * tplane;
      }
      
      void main() {
        vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
        info.ba *= 0.5;
        vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
        
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        ray = refract(-light, normal, IOR_AIR / IOR_WATER);
        oldPos = project(gl_Vertex.xzy, refractedLight, refractedLight);
        newPos = project(gl_Vertex.xzy + vec3(0.0, info.r, 0.0), ray, refractedLight);
        
        gl_Position = vec4(0.75 * (newPos.xz + refractedLight.xz / refractedLight.y) * 0.1, 0.0, 1.0);
      }
    `, (hasDerivatives ? '#extension GL_OES_standard_derivatives : enable\n' : '') + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      uniform vec3 light;
      
      void main() {
        ${hasDerivatives ? `
          float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
          float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
          gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);
        ` : `
          gl_FragColor = vec4(0.2, 0.2, 0.0, 0.0);
        `}
      }
    `);
  }
  
  updateCaustics(simulation: OceanSimulation) {
    if (!this.causticsShader) return;
    const self = this;
    this.causticTex.drawTo(() => {
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
      simulation.textureA.bind(0);
      self.causticsShader.uniforms({
        light: self.lightDir,
        water: 0,
        sphereCenter: self.sphereCenter,
        sphereRadius: self.sphereRadius
      }).draw(self.waterMesh);
    });
  }
  
  renderSky(sky: Cubemap) {
    const gl = this.gl;
    gl.depthMask(false);
    
    this.skyShader.uniforms({
      sunDir: this.lightDir,
      turbidity: this.turbidity,
      rayleighCoef: this.rayleigh,
      mieCoef: this.mieCoefficient,
      mieG: this.mieDirectionalG
    }).draw(this.skyMesh);
    
    gl.depthMask(true);
  }
  
  renderWater(simulation: OceanSimulation, sky: Cubemap) {
    const gl = this.gl;
    const tracer = new Raytracer(gl);
    simulation.textureA.bind(0);
    this.tileTexture.bind(1);
    sky.bind(2);
    this.causticTex.bind(3);
    gl.enable(gl.CULL_FACE);
    
    for (let i = 0; i < 2; i++) {
      gl.cullFace(i ? gl.BACK : gl.FRONT);
      this.waterShaders[i].uniforms({
        light: this.lightDir,
        water: 0,
        tiles: 1,
        sky: 2,
        causticTex: 3,
        eye: tracer.eye,
        sphereCenter: this.sphereCenter,
        sphereRadius: this.sphereRadius,
        time: this.time,
        sunDir: this.lightDir,
        turbidity: this.turbidity,
        rayleighCoef: this.rayleigh,
        mieCoef: this.mieCoefficient,
        mieG: this.mieDirectionalG
      }).draw(this.waterMesh);
    }
    gl.disable(gl.CULL_FACE);
  }
  
  renderSphere(simulation: OceanSimulation) {
    simulation.textureA.bind(0);
    this.causticTex.bind(1);
    this.sphereShader.uniforms({
      light: this.lightDir,
      water: 0,
      causticTex: 1,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius,
      time: this.time
    }).draw(this.sphereMesh);
  }
  
  update(deltaTime: number) {
    this.time += deltaTime;
  }
  
  setSunPosition(x: number, y: number, z: number) {
    this.lightDir = new Vector(x, y, z).unit();
  }
  
  setAtmosphere(turbidity: number, rayleigh: number, mieCoef: number, mieG: number) {
    this.turbidity = turbidity;
    this.rayleigh = rayleigh;
    this.mieCoefficient = mieCoef;
    this.mieDirectionalG = mieG;
  }
}
