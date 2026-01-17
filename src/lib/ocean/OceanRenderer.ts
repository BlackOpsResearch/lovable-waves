/**
 * Enhanced Ocean Renderer with sky, caustics, and atmospheric effects
 * Ported from GPT Waves V7 with full water rendering pipeline
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Cubemap } from '../webgl/Cubemap';
import { Mesh } from '../webgl/Mesh';
import { Raytracer } from '../webgl/Raytracer';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Vector } from '../webgl/Vector';
import { OceanSimulation } from './OceanSimulation';
import {
  WATER_VERTEX,
  WATER_FRAGMENT_ABOVE,
  WATER_FRAGMENT_UNDERWATER,
  CUBE_VERTEX,
  CUBE_FRAGMENT,
  SPHERE_VERTEX,
  SPHERE_FRAGMENT,
  WATER_HELPER_FUNCTIONS
} from './shaders/waterShaders';
import {
  CAUSTICS_VERTEX,
  CAUSTICS_FRAGMENT,
  CAUSTICS_FRAGMENT_FALLBACK
} from './shaders/causticsShaders';

export interface OceanRenderSettings {
  // Caustics
  causticsScale: number;
  causticsStrength: number;
  causticsBaseGain: number;
  causticsIntensity: number;
  dispersionStrength: number;
  transmissionEnabled: boolean;
  absorptionEnabled: boolean;
  absorptionSigma: number;
  
  // Foam
  foamStrength: number;
  foamScale: number;
  
  // Atmosphere
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  
  // Pool
  poolHeight: number;
}

const DEFAULT_RENDER_SETTINGS: OceanRenderSettings = {
  causticsScale: 0.75,
  causticsStrength: 1.0,
  causticsBaseGain: 0.2,
  causticsIntensity: 1.0,
  dispersionStrength: 0.02,
  transmissionEnabled: true,
  absorptionEnabled: true,
  absorptionSigma: 0.3,
  foamStrength: 0.5,
  foamScale: 8.0,
  turbidity: 2.0,
  rayleigh: 1.0,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  poolHeight: 1.0
};

// Sky atmospheric scattering functions
const SKY_FUNCTIONS = `
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
  
  vec3 getAtmosphericColor(vec3 direction, vec3 sunDir, float turbidity, float rayleighCoef, float mieCoef, float mieG) {
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
`;

export class OceanRenderer {
  gl: GLContextExtended;
  settings: OceanRenderSettings;
  
  // Textures
  tileTexture: Texture;
  causticTex: Texture;
  
  // State
  lightDir: Vector;
  sphereCenter: Vector;
  sphereRadius: number;
  time: number = 0;
  
  // Meshes
  waterMesh: Mesh;
  sphereMesh: Mesh;
  cubeMesh: Mesh;
  skyMesh: Mesh;
  
  // Shaders
  waterShaderAbove: Shader;
  waterShaderUnderwater: Shader;
  sphereShader: Shader;
  cubeShader: Shader;
  skyShader: Shader;
  causticsShader: Shader;
  
  constructor(gl: GLContextExtended, tileCanvas: HTMLCanvasElement, settings: Partial<OceanRenderSettings> = {}) {
    this.gl = gl;
    this.settings = { ...DEFAULT_RENDER_SETTINGS, ...settings };
    
    // Create tile texture
    this.tileTexture = Texture.fromImage(gl, tileCanvas, {
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      wrap: gl.REPEAT,
      format: gl.RGB
    });
    
    // Initialize state
    this.lightDir = new Vector(50, 30, 50).unit();
    this.sphereCenter = new Vector(0, 0.5, 0);
    this.sphereRadius = 0.25;
    
    // Create caustics render target
    this.causticTex = new Texture(gl, 1024, 1024);
    
    // Create meshes
    this.waterMesh = Mesh.plane(gl, { detail: 200 });
    this.sphereMesh = Mesh.sphere(gl, { detail: 10 });
    this.cubeMesh = Mesh.cube(gl);
    this.skyMesh = Mesh.sphere(gl, { detail: 32 });
    
    // Create water shaders
    this.waterShaderAbove = new Shader(gl, WATER_VERTEX, WATER_FRAGMENT_ABOVE);
    this.waterShaderUnderwater = new Shader(gl, WATER_VERTEX, WATER_FRAGMENT_UNDERWATER);
    
    // Create sphere shader
    this.sphereShader = new Shader(gl, SPHERE_VERTEX, SPHERE_FRAGMENT);
    
    // Create cube/pool shader
    this.cubeShader = new Shader(gl, CUBE_VERTEX, CUBE_FRAGMENT);
    
    // Create sky shader with atmospheric scattering
    this.skyShader = new Shader(gl, `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = gl_ModelViewMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(gl_Vertex.xyz * 1000.0, 1.0);
        gl_Position.z = gl_Position.w;
      }
    `, `
      precision highp float;
      const float PI = 3.14159265359;
      ${SKY_FUNCTIONS}
      
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
    
    // Create caustics shader
    const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
    const causticsFragment = hasDerivatives 
      ? '#extension GL_OES_standard_derivatives : enable\n' + CAUSTICS_FRAGMENT 
      : CAUSTICS_FRAGMENT_FALLBACK;
    
    this.causticsShader = new Shader(gl, CAUSTICS_VERTEX, causticsFragment);
  }
  
  updateCaustics(simulation: OceanSimulation) {
    const self = this;
    const s = this.settings;
    
    this.causticTex.drawTo(() => {
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
      simulation.textureA.bind(0);
      
      self.causticsShader.uniforms({
        water: 0,
        light: self.lightDir,
        sphereCenter: self.sphereCenter,
        sphereRadius: self.sphereRadius,
        poolHeight: s.poolHeight,
        projectionScale: s.causticsScale,
        baseGain: s.causticsBaseGain,
        intensity: s.causticsIntensity,
        sampleWeight: 1.0,
        outputAlpha: 1.0,
        areaMode: 1.0,
        focusEpsilon: 0.0001,
        maxFocus: 10.0,
        transmissionEnabled: s.transmissionEnabled ? 1.0 : 0.0,
        fresnelF0: 0.02,
        absorptionEnabled: s.absorptionEnabled ? 1.0 : 0.0,
        absorptionSigma: s.absorptionSigma
      }).draw(self.waterMesh);
    });
  }
  
  renderSky() {
    const gl = this.gl;
    const s = this.settings;
    
    gl.depthMask(false);
    
    this.skyShader.uniforms({
      sunDir: this.lightDir,
      turbidity: s.turbidity,
      rayleighCoef: s.rayleigh,
      mieCoef: s.mieCoefficient,
      mieG: s.mieDirectionalG
    }).draw(this.skyMesh);
    
    gl.depthMask(true);
  }
  
  renderWater(simulation: OceanSimulation, sky: Cubemap) {
    const gl = this.gl;
    const tracer = new Raytracer(gl);
    const s = this.settings;
    
    simulation.textureA.bind(0);
    this.tileTexture.bind(1);
    sky.bind(2);
    this.causticTex.bind(3);
    
    const commonUniforms = {
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
      turbidity: s.turbidity,
      rayleighCoef: s.rayleigh,
      mieCoef: s.mieCoefficient,
      mieG: s.mieDirectionalG,
      causticsScale: s.causticsScale,
      causticsStrength: s.causticsStrength,
      dispersionStrength: s.dispersionStrength,
      foamStrength: s.foamStrength,
      foamScale: s.foamScale
    };
    
    gl.enable(gl.CULL_FACE);
    
    // Render front face (above water view)
    gl.cullFace(gl.BACK);
    this.waterShaderAbove.uniforms(commonUniforms).draw(this.waterMesh);
    
    // Render back face (underwater view)
    gl.cullFace(gl.FRONT);
    this.waterShaderUnderwater.uniforms(commonUniforms).draw(this.waterMesh);
    
    gl.disable(gl.CULL_FACE);
  }
  
  renderCube(simulation: OceanSimulation) {
    const s = this.settings;
    
    simulation.textureA.bind(0);
    this.tileTexture.bind(1);
    this.causticTex.bind(2);
    
    this.cubeShader.uniforms({
      light: this.lightDir,
      water: 0,
      tiles: 1,
      causticTex: 2,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius,
      time: this.time,
      causticsScale: s.causticsScale,
      causticsStrength: s.causticsStrength,
      dispersionStrength: s.dispersionStrength
    }).draw(this.cubeMesh);
  }
  
  renderSphere(simulation: OceanSimulation) {
    const s = this.settings;
    
    simulation.textureA.bind(0);
    this.causticTex.bind(1);
    
    this.sphereShader.uniforms({
      light: this.lightDir,
      water: 0,
      causticTex: 1,
      sphereCenter: this.sphereCenter,
      sphereRadius: this.sphereRadius,
      time: this.time,
      causticsScale: s.causticsScale,
      causticsStrength: s.causticsStrength,
      dispersionStrength: s.dispersionStrength
    }).draw(this.sphereMesh);
  }
  
  update(deltaTime: number) {
    this.time += deltaTime;
  }
  
  setSunPosition(x: number, y: number, z: number) {
    this.lightDir = new Vector(x, y, z).unit();
  }
  
  setSunAngle(azimuth: number, elevation: number) {
    const x = Math.cos(elevation) * Math.sin(azimuth);
    const y = Math.sin(elevation);
    const z = Math.cos(elevation) * Math.cos(azimuth);
    this.lightDir = new Vector(x, y, z).unit();
  }
  
  setAtmosphere(turbidity: number, rayleigh: number, mieCoef: number, mieG: number) {
    this.settings.turbidity = turbidity;
    this.settings.rayleigh = rayleigh;
    this.settings.mieCoefficient = mieCoef;
    this.settings.mieDirectionalG = mieG;
  }
  
  setCausticsStrength(strength: number) {
    this.settings.causticsStrength = strength;
  }
  
  setFoamStrength(strength: number) {
    this.settings.foamStrength = strength;
  }
}
