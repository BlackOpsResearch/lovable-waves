/**
 * Hyperrealistic Infinite Ocean Renderer
 * Advanced ocean rendering with Gerstner waves, atmospheric sky, LOD, and full water effects
 * WebGL2 upgraded with infinite ocean mesh support
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Cubemap } from '../webgl/Cubemap';
import { Mesh } from '../webgl/Mesh';
import { Raytracer } from '../webgl/Raytracer';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Vector } from '../webgl/Vector';
import { OceanSimulation } from './OceanSimulation';
import { OceanSettings, DEFAULT_OCEAN_SETTINGS, calculateSunPosition } from './OceanConfig';
import { OceanMesh, createInfiniteOceanPlane } from './OceanMesh';

// Import shader modules
import { GERSTNER_WAVE_FUNCTIONS, NOISE_FUNCTIONS, INFINITE_OCEAN_VERTEX } from './shaders/gerstnerWaves';
import { ATMOSPHERIC_FUNCTIONS } from './shaders/atmosphericSky';

export interface InfiniteOceanOptions {
  enableInfiniteOcean: boolean;
  enableLOD: boolean;
  oceanScale: number;
  horizonDistance: number;
  renderSeabed: boolean;
  seabedDepth: number;
}

export const DEFAULT_INFINITE_OPTIONS: InfiniteOceanOptions = {
  enableInfiniteOcean: true,
  enableLOD: true,
  oceanScale: 100,
  horizonDistance: 10000,
  renderSeabed: true,
  seabedDepth: 50,
};

export class HyperOceanRenderer {
  gl: GLContextExtended;
  settings: OceanSettings;
  infiniteOptions: InfiniteOceanOptions;
  
  // Textures
  tileTexture: Texture;
  causticTex: Texture;
  
  // Light and camera
  sunDirection: Vector;
  sphereCenter: Vector;
  sphereRadius: number;
  time: number = 0;
  cameraPosition: Vector = new Vector(0, 2, 5);
  
  // Meshes
  waterMesh: Mesh;
  infiniteOceanMesh: OceanMesh | null = null;
  sphereMesh: Mesh;
  skyMesh: Mesh;
  seabedMesh: Mesh | null = null;
  
  // Shaders
  waterShaderAbove: Shader;
  waterShaderBelow: Shader;
  infiniteWaterShader: Shader | null = null;
  sphereShader: Shader;
  skyShader: Shader;
  seabedShader: Shader | null = null;
  causticsShader: Shader;
  
  constructor(
    gl: GLContextExtended, 
    tileCanvas: HTMLCanvasElement, 
    settings: OceanSettings = DEFAULT_OCEAN_SETTINGS,
    infiniteOptions: InfiniteOceanOptions = DEFAULT_INFINITE_OPTIONS
  ) {
    this.gl = gl;
    this.settings = settings;
    this.infiniteOptions = infiniteOptions;
    
    // Initialize textures
    this.tileTexture = Texture.fromImage(gl, tileCanvas, {
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      wrap: gl.REPEAT,
      format: gl.RGB,
    });
    
    this.causticTex = new Texture(gl, settings.caustics.resolution, settings.caustics.resolution);
    
    // Calculate initial sun position
    const sunPos = calculateSunPosition(settings.atmosphere.sunElevation, settings.atmosphere.sunAzimuth);
    this.sunDirection = new Vector(sunPos[0], sunPos[1], sunPos[2]).unit();
    
    this.sphereCenter = new Vector(0, 0.5, 0);
    this.sphereRadius = settings.physics.sphereRadius;
    
    // Create meshes
    this.waterMesh = Mesh.plane(gl, { detail: settings.lod.maxDetail });
    this.sphereMesh = Mesh.sphere(gl, { detail: 16 });
    this.skyMesh = Mesh.sphere(gl, { detail: 32 });
    
    // Create infinite ocean mesh if enabled
    if (infiniteOptions.enableInfiniteOcean) {
      this.infiniteOceanMesh = new OceanMesh(gl);
      
      // Create seabed mesh
      if (infiniteOptions.renderSeabed) {
        this.seabedMesh = createInfiniteOceanPlane(gl, 64);
      }
    }
    
    // Initialize shaders
    this.initShaders();
  }
  
  private initShaders() {
    const gl = this.gl;
    
    // Helper functions for all shaders
    const helperFunctions = `
      const float IOR_AIR = 1.0;
      const float IOR_WATER = 1.333;
      
      uniform vec3 light;
      uniform vec3 sphereCenter;
      uniform float sphereRadius;
      uniform sampler2D water;
      uniform sampler2D causticTex;
      uniform float time;
      
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
    
    // Atmospheric scattering functions
    const skyFunctions = ATMOSPHERIC_FUNCTIONS;
    
    // Water vertex shader with Gerstner waves
    const waterVertexShader = `
      uniform sampler2D water;
      uniform float time;
      uniform float amplitude;
      uniform float steepness;
      uniform float windDirection;
      uniform float oceanScale;
      
      varying vec3 position;
      varying float foamFactor;
      varying float waveHeight;
      
      ${GERSTNER_WAVE_FUNCTIONS}
      
      void main() {
        vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
        position = gl_Vertex.xzy;
        
        // Calculate Gerstner waves
        vec2 worldXZ = gl_Vertex.xz * oceanScale;
        vec4 gerstnerResult = calculateGerstnerWaves(worldXZ, time, amplitude, steepness, windDirection);
        
        // Apply displacement
        position.x += gerstnerResult.x;
        position.z += gerstnerResult.z;
        position.y += info.r + gerstnerResult.y;
        
        foamFactor = gerstnerResult.w;
        waveHeight = position.y;
        
        gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
      }
    `;
    
    // Above water fragment shader with infinite ocean support
    const aboveWaterFragment = helperFunctions + skyFunctions + `
      uniform vec3 eye;
      uniform vec3 sunDir;
      uniform float turbidity;
      uniform float rayleighCoef;
      uniform float mieCoef;
      uniform float mieG;
      uniform vec3 shallowColor;
      uniform vec3 deepColor;
      uniform vec3 scatterColor;
      uniform float foamIntensity;
      uniform float seabedDepth;
      uniform float horizonDistance;
      
      varying vec3 position;
      varying float foamFactor;
      varying float waveHeight;
      uniform samplerCube sky;
      
      // Horizon fog for infinite ocean
      vec3 applyHorizonFog(vec3 color, float distance, vec3 fogColor) {
        float fogFactor = 1.0 - exp(-distance * 0.0001);
        fogFactor = clamp(fogFactor, 0.0, 0.95);
        return mix(color, fogColor, fogFactor);
      }
      
      vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
        vec3 color;
        float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
        if (q < 1.0e6) {
          color = getSphereColor(origin + ray * q);
        } else if (ray.y < 0.0) {
          // Infinite seabed
          float depth = (-origin.y - seabedDepth) / ray.y;
          if (depth > 0.0 && depth < horizonDistance) {
            vec3 floorPoint = origin + ray * depth;
            float dist = length(floorPoint - origin);
            
            // Caustics on seabed
            vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
            vec4 caustic = texture2D(causticTex, floorPoint.xz * 0.02);
            
            vec3 seabedColor = deepColor * 0.3;
            seabedColor += caustic.rgb * 0.5 * exp(-dist * 0.05);
            color = seabedColor;
          } else {
            color = deepColor * 0.1;
          }
        } else {
          color = getAtmosphericSkyColor(ray, sunDir, turbidity, rayleighCoef, mieCoef, mieG);
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
        
        // Fresnel
        float NdotV = max(0.0, dot(normal, -incomingRay));
        float fresnel = mix(0.25, 1.0, pow(1.0 - NdotV, 3.0));
        
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, shallowColor);
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, shallowColor);
        
        // Subsurface scattering
        float sss = pow(max(0.0, dot(-incomingRay, sunDir)), 4.0);
        vec3 sssColor = scatterColor * sss * 0.3;
        
        vec3 finalColor = mix(refractedColor, reflectedColor, fresnel);
        finalColor += sssColor;
        
        // Foam
        float foam = foamFactor + smoothstep(0.1, 0.3, waveHeight) * foamIntensity;
        vec3 foamColor = vec3(0.95, 0.98, 1.0);
        finalColor = mix(finalColor, foamColor, clamp(foam, 0.0, 1.0) * 0.7);
        
        // Sun specular
        vec3 halfVec = normalize(-incomingRay + sunDir);
        float spec = pow(max(0.0, dot(normal, halfVec)), 256.0);
        finalColor += vec3(1.0, 0.95, 0.8) * spec * 2.0;
        
        // Horizon fog
        float distToCamera = length(position - eye);
        vec3 horizonColor = getAtmosphericSkyColor(vec3(0.0, 0.1, 1.0), sunDir, turbidity, rayleighCoef, mieCoef, mieG);
        finalColor = applyHorizonFog(finalColor, distToCamera, horizonColor);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    // Below water fragment shader
    const belowWaterFragment = helperFunctions + skyFunctions + `
      uniform vec3 eye;
      uniform vec3 sunDir;
      uniform float turbidity;
      uniform float rayleighCoef;
      uniform float mieCoef;
      uniform float mieG;
      uniform vec3 underwaterColor;
      uniform float fogDensity;
      
      varying vec3 position;
      varying float foamFactor;
      varying float waveHeight;
      uniform samplerCube sky;
      
      vec3 getSurfaceRayColorUnderwater(vec3 origin, vec3 ray, vec3 waterColor) {
        vec3 color;
        float q = intersectSphere(origin, ray, sphereCenter, sphereRadius);
        if (q < 1.0e6) {
          color = getSphereColor(origin + ray * q);
        } else if (ray.y < 0.0) {
          float depth = -origin.y / ray.y;
          vec3 floorPoint = origin + ray * depth;
          float dist = length(floorPoint - origin);
          color = vec3(0.0, 0.05, 0.15);
          vec4 caustic = texture2D(causticTex, floorPoint.xz * 0.1);
          color += caustic.rgb * 0.4 * exp(-dist * 0.2);
        } else {
          color = getAtmosphericSkyColor(ray, sunDir, turbidity, rayleighCoef, mieCoef, mieG);
          color *= vec3(0.8, 1.0, 1.1);
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
        
        vec3 normal = -vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
        vec3 incomingRay = normalize(position - eye);
        
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
        float fresnel = mix(0.5, 1.0, pow(1.0 - max(0.0, dot(normal, -incomingRay)), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColorUnderwater(position, reflectedRay, underwaterColor);
        vec3 refractedColor = getSurfaceRayColorUnderwater(position, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
        
        vec3 finalColor = mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay));
        
        // Caustics
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        vec4 caustic = texture2D(causticTex, position.xz * 0.1);
        finalColor += caustic.rgb * 0.3;
        
        // Underwater fog
        float dist = length(position - eye);
        float fogFactor = 1.0 - exp(-dist * fogDensity);
        finalColor = mix(finalColor, underwaterColor, fogFactor);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    // Create water shaders
    this.waterShaderAbove = new Shader(gl, waterVertexShader, aboveWaterFragment);
    this.waterShaderBelow = new Shader(gl, waterVertexShader, belowWaterFragment);
    
    // Sphere shader
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
    
    // Sky shader
    this.skyShader = new Shader(gl, `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = gl_ModelViewMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
        gl_Position.z = gl_Position.w;
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
        vec3 color = getAtmosphericSkyColor(direction, sunDir, turbidity, rayleighCoef, mieCoef, mieG);
        gl_FragColor = vec4(color, 1.0);
      }
    `);
    
    // Seabed shader for infinite ocean
    if (this.infiniteOptions.renderSeabed) {
      this.seabedShader = new Shader(gl, `
        uniform float seabedDepth;
        uniform vec2 tileOffset;
        uniform float oceanScale;
        varying vec3 position;
        varying vec2 vUV;
        
        void main() {
          position = gl_Vertex.xyz;
          position.xz = position.xz * oceanScale + tileOffset;
          position.y = -seabedDepth;
          vUV = gl_Vertex.xz * 0.5 + 0.5;
          gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
        }
      `, helperFunctions + `
        uniform sampler2D tiles;
        uniform vec3 underwaterColor;
        uniform float seabedDepth;
        varying vec3 position;
        varying vec2 vUV;
        
        void main() {
          vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
          float diffuse = max(0.0, dot(-refractedLight, vec3(0.0, 1.0, 0.0)));
          
          // Caustics
          vec4 caustic = texture2D(causticTex, position.xz * 0.02);
          
          // Sand texture
          vec4 sandColor = texture2D(tiles, position.xz * 0.05);
          
          vec3 color = sandColor.rgb * (diffuse * 0.5 + 0.3);
          color += caustic.rgb * 0.4;
          
          // Depth fog
          float depth = seabedDepth;
          float fogFactor = 1.0 - exp(-depth * 0.02);
          color = mix(color, underwaterColor * 0.3, fogFactor);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `);
    }
    
    // Caustics shader
    const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
    this.causticsShader = new Shader(gl, helperFunctions + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      
      vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
        vec2 tcube = intersectCube(origin, ray, vec3(-100.0, -100.0, -100.0), vec3(100.0, 2.0, 100.0));
        origin += ray * tcube.y;
        float tplane = (-origin.y - 1.0) / refractedLight.y;
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
  
  updateSettings(settings: Partial<OceanSettings>) {
    this.settings = { ...this.settings, ...settings };
    
    // Update sun position
    const sunPos = calculateSunPosition(
      this.settings.atmosphere.sunElevation,
      this.settings.atmosphere.sunAzimuth
    );
    this.sunDirection = new Vector(sunPos[0], sunPos[1], sunPos[2]).unit();
  }
  
  updateInfiniteOptions(options: Partial<InfiniteOceanOptions>) {
    this.infiniteOptions = { ...this.infiniteOptions, ...options };
  }
  
  updateCameraPosition(x: number, y: number, z: number) {
    this.cameraPosition = new Vector(x, y, z);
    
    if (this.infiniteOceanMesh) {
      this.infiniteOceanMesh.updateCameraPosition(x, z);
    }
  }
  
  updateCaustics(simulation: OceanSimulation) {
    if (!this.settings.caustics.enabled) return;
    
    const self = this;
    this.causticTex.drawTo(() => {
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
      simulation.textureA.bind(0);
      self.causticsShader.uniforms({
        light: self.sunDirection,
        water: 0,
        sphereCenter: self.sphereCenter,
        sphereRadius: self.sphereRadius,
      }).draw(self.waterMesh);
    });
  }
  
  renderSky() {
    const gl = this.gl;
    gl.depthMask(false);
    
    this.skyShader.uniforms({
      sunDir: this.sunDirection,
      turbidity: this.settings.atmosphere.turbidity,
      rayleighCoef: this.settings.atmosphere.rayleigh,
      mieCoef: this.settings.atmosphere.mieCoefficient,
      mieG: this.settings.atmosphere.mieDirectionalG,
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
    
    const commonUniforms = {
      light: this.sunDirection,
      water: 0,
      tiles: 1,
      sky: 2,
      causticTex: 3,
      eye: tracer.eye,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius,
      time: this.time,
      sunDir: this.sunDirection,
      turbidity: this.settings.atmosphere.turbidity,
      rayleighCoef: this.settings.atmosphere.rayleigh,
      mieCoef: this.settings.atmosphere.mieCoefficient,
      mieG: this.settings.atmosphere.mieDirectionalG,
      amplitude: this.settings.waves.amplitude,
      steepness: this.settings.waves.steepness,
      windDirection: this.settings.waves.windDirection,
      oceanScale: this.settings.oceanScale,
      shallowColor: this.settings.material.shallowColor,
      deepColor: this.settings.material.deepColor,
      scatterColor: this.settings.material.scatterColor,
      foamIntensity: this.settings.material.foamIntensity,
      underwaterColor: this.settings.material.underwaterColor,
      fogDensity: this.settings.material.underwaterFogDensity,
      seabedDepth: this.infiniteOptions.seabedDepth,
      horizonDistance: this.infiniteOptions.horizonDistance,
    };
    
    // Render both sides
    gl.cullFace(gl.FRONT);
    this.waterShaderAbove.uniforms(commonUniforms).draw(this.waterMesh);
    
    gl.cullFace(gl.BACK);
    this.waterShaderBelow.uniforms(commonUniforms).draw(this.waterMesh);
    
    gl.disable(gl.CULL_FACE);
  }
  
  renderSeabed(simulation: OceanSimulation) {
    if (!this.seabedShader || !this.seabedMesh) return;
    
    simulation.textureA.bind(0);
    this.tileTexture.bind(1);
    this.causticTex.bind(2);
    
    const tileOffset = this.infiniteOceanMesh 
      ? [this.infiniteOceanMesh.tileOffset.x, this.infiniteOceanMesh.tileOffset.z]
      : [0, 0];
    
    this.seabedShader.uniforms({
      light: this.sunDirection,
      water: 0,
      tiles: 1,
      causticTex: 2,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius,
      underwaterColor: this.settings.material.underwaterColor,
      seabedDepth: this.infiniteOptions.seabedDepth,
      tileOffset: tileOffset,
      oceanScale: this.infiniteOptions.oceanScale,
    }).draw(this.seabedMesh);
  }
  
  renderSphere(simulation: OceanSimulation) {
    simulation.textureA.bind(0);
    this.causticTex.bind(1);
    
    this.sphereShader.uniforms({
      light: this.sunDirection,
      water: 0,
      causticTex: 1,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius,
      time: this.time,
    }).draw(this.sphereMesh);
  }
  
  update(deltaTime: number) {
    this.time += deltaTime;
  }
  
  setSunPosition(elevation: number, azimuth: number) {
    this.settings.atmosphere.sunElevation = elevation;
    this.settings.atmosphere.sunAzimuth = azimuth;
    const sunPos = calculateSunPosition(elevation, azimuth);
    this.sunDirection = new Vector(sunPos[0], sunPos[1], sunPos[2]).unit();
  }
  
  destroy() {
    this.causticTex.destroy();
    if (this.infiniteOceanMesh) {
      this.infiniteOceanMesh.destroy();
    }
  }
}
