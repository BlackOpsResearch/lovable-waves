/**
 * Volumetric Cloud Renderer
 * Raymarched clouds with god rays, using 2D noise atlas for WebGL1 compatibility
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Mesh } from '../webgl/Mesh';
import { Shader } from '../webgl/Shader';
import { Texture } from '../webgl/Texture';
import { Vector } from '../webgl/Vector';
import { Raytracer } from '../webgl/Raytracer';

export interface CloudSettings {
  enabled: boolean;
  coverage: number;      // 0-1, how much sky is covered
  density: number;       // Cloud density multiplier
  altitude: number;      // Base cloud altitude
  thickness: number;     // Cloud layer thickness
  scale: number;         // Noise scale
  windSpeed: [number, number, number];
  opacity: number;
  shadowIntensity: number;
  godRaysEnabled: boolean;
  godRaysIntensity: number;
}

export const DEFAULT_CLOUD_SETTINGS: CloudSettings = {
  enabled: true,
  coverage: 0.5,
  density: 1.0,
  altitude: 2.0,
  thickness: 1.5,
  scale: 0.02,
  windSpeed: [0.02, 0, 0.01],
  opacity: 0.8,
  shadowIntensity: 0.5,
  godRaysEnabled: true,
  godRaysIntensity: 0.3,
};

export class CloudRenderer {
  gl: GLContextExtended;
  settings: CloudSettings;
  
  // Textures
  noiseAtlas: Texture;
  blueNoise: Texture;
  cloudFBO: Texture;
  godRayFBO: Texture;
  
  // Meshes
  cloudBox: Mesh;
  fullscreenQuad: Mesh;
  
  // Shaders
  cloudShader: Shader;
  godRayShader: Shader;
  
  // State
  time: number = 0;
  sunDirection: Vector;
  
  constructor(gl: GLContextExtended, settings: CloudSettings = DEFAULT_CLOUD_SETTINGS) {
    this.gl = gl;
    this.settings = settings;
    this.sunDirection = new Vector(0.5, 0.7, 0.3).unit();
    
    // Create noise atlas texture (2D representation of 3D noise)
    this.noiseAtlas = this.createNoiseAtlas();
    this.blueNoise = this.createBlueNoise();
    
    // FBOs for cloud rendering
    const width = Math.floor(gl.canvas.width / 2);
    const height = Math.floor(gl.canvas.height / 2);
    this.cloudFBO = new Texture(gl, Math.max(256, width), Math.max(256, height));
    this.godRayFBO = new Texture(gl, Math.max(256, width), Math.max(256, height));
    
    // Create cloud box mesh (large box surrounding scene)
    this.cloudBox = Mesh.cube(gl, { coords: true });
    this.fullscreenQuad = Mesh.plane(gl);
    
    // Initialize shaders
    this.initShaders();
  }
  
  private createNoiseAtlas(): Texture {
    const size = 128;
    const slices = 16;
    const atlasSize = size * 4; // 4x4 grid of slices
    const data = new Float32Array(atlasSize * atlasSize * 4);
    
    // Generate 3D Perlin-like noise packed into 2D atlas
    for (let z = 0; z < slices; z++) {
      const sliceX = (z % 4) * size;
      const sliceY = Math.floor(z / 4) * size;
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const fx = x / size;
          const fy = y / size;
          const fz = z / slices;
          
          // Multi-octave noise
          let value = 0;
          let amplitude = 1;
          let frequency = 1;
          let maxValue = 0;
          
          for (let o = 0; o < 4; o++) {
            value += this.noise3D(fx * frequency * 4, fy * frequency * 4, fz * frequency * 4) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
          }
          
          value = (value / maxValue + 1) * 0.5; // Normalize to 0-1
          
          const idx = ((sliceY + y) * atlasSize + (sliceX + x)) * 4;
          data[idx] = value;
          data[idx + 1] = value;
          data[idx + 2] = value;
          data[idx + 3] = 1.0;
        }
      }
    }
    
    return Texture.fromFloatArray(this.gl, data, atlasSize, atlasSize);
  }
  
  private createBlueNoise(): Texture {
    const size = 64;
    const data = new Float32Array(size * size * 4);
    
    // Simple blue noise approximation using halton sequence
    for (let i = 0; i < size * size; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      
      // Halton sequence base 2 and 3
      let h2 = 0, h3 = 0;
      let f2 = 0.5, f3 = 1/3;
      let i2 = i + 1, i3 = i + 1;
      
      while (i2 > 0) {
        h2 += f2 * (i2 % 2);
        i2 = Math.floor(i2 / 2);
        f2 /= 2;
      }
      while (i3 > 0) {
        h3 += f3 * (i3 % 3);
        i3 = Math.floor(i3 / 3);
        f3 /= 3;
      }
      
      const idx = (y * size + x) * 4;
      data[idx] = h2;
      data[idx + 1] = h3;
      data[idx + 2] = (h2 + h3) * 0.5;
      data[idx + 3] = 1.0;
    }
    
    return Texture.fromFloatArray(this.gl, data, size, size);
  }
  
  private noise3D(x: number, y: number, z: number): number {
    // Simple 3D noise using sine waves (for texture generation)
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return n - Math.floor(n);
  }
  
  private initShaders() {
    const gl = this.gl;
    
    // Cloud raymarching shader
    this.cloudShader = new Shader(gl, `
      uniform vec3 cameraPos;
      uniform mat4 invViewProj;
      varying vec3 vRayDir;
      varying vec2 vUv;
      
      void main() {
        vUv = gl_Vertex.xy * 0.5 + 0.5;
        
        // Calculate ray direction for this vertex
        vec4 clipPos = vec4(gl_Vertex.xy, 1.0, 1.0);
        vec4 worldPos = invViewProj * clipPos;
        worldPos /= worldPos.w;
        vRayDir = normalize(worldPos.xyz - cameraPos);
        
        gl_Position = vec4(gl_Vertex.xy, 0.0, 1.0);
      }
    `, `
      precision highp float;
      
      uniform sampler2D noiseAtlas;
      uniform sampler2D blueNoise;
      uniform vec3 cameraPos;
      uniform vec3 sunDir;
      uniform vec3 sunColor;
      uniform float time;
      uniform float coverage;
      uniform float density;
      uniform float cloudAltitude;
      uniform float cloudThickness;
      uniform float cloudScale;
      uniform vec3 windSpeed;
      uniform float opacity;
      
      varying vec3 vRayDir;
      varying vec2 vUv;
      
      const int MARCH_STEPS = 32;
      const int LIGHT_STEPS = 6;
      const float PI = 3.14159265359;
      
      // Sample 3D noise from 2D atlas
      float sampleNoise(vec3 p) {
        vec3 pos = p * cloudScale + windSpeed * time;
        pos = fract(pos);
        
        float z = pos.z * 15.0; // 16 slices (0-15)
        float zFloor = floor(z);
        float zFrac = fract(z);
        
        // Get UV for two slices
        vec2 uv1 = vec2(mod(zFloor, 4.0), floor(zFloor / 4.0)) / 4.0 + pos.xy / 4.0;
        float nextZ = mod(zFloor + 1.0, 16.0);
        vec2 uv2 = vec2(mod(nextZ, 4.0), floor(nextZ / 4.0)) / 4.0 + pos.xy / 4.0;
        
        // Sample and interpolate
        float n1 = texture2D(noiseAtlas, uv1).r;
        float n2 = texture2D(noiseAtlas, uv2).r;
        
        return mix(n1, n2, zFrac);
      }
      
      // Henyey-Greenstein phase function
      float hgPhase(float cosTheta, float g) {
        float g2 = g * g;
        return (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
      }
      
      // Get cloud density at a point
      float getCloudDensity(vec3 pos) {
        float altitude = (pos.y - cloudAltitude) / cloudThickness;
        if (altitude < 0.0 || altitude > 1.0) return 0.0;
        
        // Height gradient
        float heightGrad = 4.0 * altitude * (1.0 - altitude);
        
        // Sample noise
        float noise = sampleNoise(pos);
        
        // Add detail octaves
        noise += sampleNoise(pos * 2.0) * 0.5;
        noise += sampleNoise(pos * 4.0) * 0.25;
        noise /= 1.75;
        
        // Apply coverage
        float cloudDensity = noise - (1.0 - coverage);
        cloudDensity = max(0.0, cloudDensity) * heightGrad * density;
        
        return cloudDensity;
      }
      
      // Calculate light reaching a point
      float lightMarch(vec3 pos) {
        float stepSize = cloudThickness / float(LIGHT_STEPS);
        float totalDensity = 0.0;
        
        for (int i = 0; i < LIGHT_STEPS; i++) {
          pos += sunDir * stepSize;
          totalDensity += getCloudDensity(pos) * stepSize;
        }
        
        return exp(-totalDensity * 2.0);
      }
      
      void main() {
        vec3 rayDir = normalize(vRayDir);
        
        // Ray-plane intersection for cloud layer
        float tBottom = (cloudAltitude - cameraPos.y) / rayDir.y;
        float tTop = (cloudAltitude + cloudThickness - cameraPos.y) / rayDir.y;
        
        if (tBottom > tTop) {
          float temp = tBottom;
          tBottom = tTop;
          tTop = temp;
        }
        
        if (tTop < 0.0 || rayDir.y == 0.0) {
          gl_FragColor = vec4(0.0);
          return;
        }
        
        float tStart = max(0.0, tBottom);
        float tEnd = tTop;
        float rayLength = tEnd - tStart;
        
        if (rayLength <= 0.0) {
          gl_FragColor = vec4(0.0);
          return;
        }
        
        // Blue noise jitter
        vec2 noiseUv = mod(gl_FragCoord.xy / 64.0, 1.0);
        float jitter = texture2D(blueNoise, noiseUv).r;
        
        float stepSize = rayLength / float(MARCH_STEPS);
        vec3 pos = cameraPos + rayDir * (tStart + jitter * stepSize);
        
        vec3 accColor = vec3(0.0);
        float accTransmittance = 1.0;
        float cosTheta = dot(rayDir, sunDir);
        float phase = mix(hgPhase(cosTheta, 0.3), hgPhase(cosTheta, -0.3), 0.5);
        
        for (int i = 0; i < MARCH_STEPS; i++) {
          float cloudDensity = getCloudDensity(pos);
          
          if (cloudDensity > 0.001) {
            float lightEnergy = lightMarch(pos);
            
            // Scattering
            vec3 ambient = vec3(0.5, 0.6, 0.7) * 0.3;
            vec3 sunLight = sunColor * lightEnergy * phase;
            vec3 scattering = (ambient + sunLight) * cloudDensity * stepSize;
            
            // Beer-Lambert absorption
            float transmittance = exp(-cloudDensity * stepSize * opacity);
            
            accColor += accTransmittance * scattering;
            accTransmittance *= transmittance;
            
            if (accTransmittance < 0.01) break;
          }
          
          pos += rayDir * stepSize;
        }
        
        float alpha = 1.0 - accTransmittance;
        gl_FragColor = vec4(accColor, alpha);
      }
    `);
    
    // God rays shader (radial blur from sun position)
    this.godRayShader = new Shader(gl, `
      varying vec2 vUv;
      void main() {
        vUv = gl_Vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(gl_Vertex.xy, 0.0, 1.0);
      }
    `, `
      precision highp float;
      
      uniform sampler2D cloudTex;
      uniform sampler2D sceneTex;
      uniform vec2 sunScreenPos;
      uniform vec3 sunColor;
      uniform float intensity;
      uniform float decay;
      uniform float density;
      uniform int samples;
      
      varying vec2 vUv;
      
      void main() {
        vec2 deltaTexCoord = (sunScreenPos - vUv);
        float dist = length(deltaTexCoord);
        deltaTexCoord /= float(samples);
        deltaTexCoord *= density;
        
        vec2 texCoord = vUv;
        float illuminationDecay = 1.0;
        vec3 godRays = vec3(0.0);
        
        for (int i = 0; i < 64; i++) {
          if (i >= samples) break;
          texCoord += deltaTexCoord;
          
          if (texCoord.x >= 0.0 && texCoord.x <= 1.0 && texCoord.y >= 0.0 && texCoord.y <= 1.0) {
            vec4 cloudSample = texture2D(cloudTex, texCoord);
            float occlusion = 1.0 - cloudSample.a;
            godRays += vec3(occlusion * illuminationDecay);
          }
          
          illuminationDecay *= decay;
        }
        
        vec3 sceneColor = texture2D(sceneTex, vUv).rgb;
        vec3 finalColor = sceneColor + godRays * sunColor * intensity * 0.5;
        
        // Fade god rays based on distance from sun
        float sunFade = 1.0 - smoothstep(0.3, 1.0, dist);
        finalColor = mix(sceneColor, finalColor, sunFade);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `);
  }
  
  setSunDirection(dir: Vector) {
    this.sunDirection = dir.unit();
  }
  
  update(deltaTime: number) {
    this.time += deltaTime;
  }
  
  updateSettings(settings: Partial<CloudSettings>) {
    this.settings = { ...this.settings, ...settings };
  }
  
  render(tracer: Raytracer, sunColor: [number, number, number] = [1, 0.95, 0.8]) {
    if (!this.settings.enabled) return;
    
    const gl = this.gl;
    
    // Bind textures
    this.noiseAtlas.bind(0);
    this.blueNoise.bind(1);
    
    // Calculate inverse for ray direction
    // For simplicity, we pass camera position and compute in shader
    const cameraPos = tracer.eye;
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    
    this.cloudShader.uniforms({
      noiseAtlas: 0,
      blueNoise: 1,
      cameraPos: cameraPos,
      sunDir: this.sunDirection,
      sunColor: sunColor,
      time: this.time,
      coverage: this.settings.coverage,
      density: this.settings.density,
      cloudAltitude: this.settings.altitude,
      cloudThickness: this.settings.thickness,
      cloudScale: this.settings.scale,
      windSpeed: this.settings.windSpeed,
      opacity: this.settings.opacity,
    }).draw(this.fullscreenQuad);
    
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
}

export default CloudRenderer;
