/**
 * Water Renderer with caustics, reflections, and refractions
 * Extended to support multiple spheres with different colors
 * Ported from Evan Wallace's webgl-water
 */
import { GLContextExtended } from './GLContext';
import { Cubemap } from './Cubemap';
import { Mesh } from './Mesh';
import { Raytracer } from './Raytracer';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { Vector } from './Vector';
import { Water } from './Water';

export interface SphereData {
  center: Vector;
  radius: number;
  color: [number, number, number]; // RGB 0-1
  velocity: Vector;
  oldCenter: Vector;
}

export interface RenderSettings {
  refractionIndex: number;  // IOR_WATER: 1.0 - 2.0
  abovewaterColor: [number, number, number];
  underwaterColor: [number, number, number];
}

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  refractionIndex: 1.333,
  abovewaterColor: [0.25, 1.0, 1.25],
  underwaterColor: [0.4, 0.9, 1.0],
};

const createHelperFunctions = (settings: RenderSettings, maxSpheres: number) => `
  const float IOR_AIR = 1.0;
  uniform float IOR_WATER;
  uniform vec3 abovewaterColor;
  uniform vec3 underwaterColor;
  const float poolHeight = 1.0;
  uniform vec3 light;
  
  // Sphere data arrays
  uniform vec3 sphereCenters[${maxSpheres}];
  uniform float sphereRadii[${maxSpheres}];
  uniform vec3 sphereColors[${maxSpheres}];
  uniform int sphereCount;
  
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform sampler2D water;
  
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
  
  // Find closest sphere intersection
  int findClosestSphere(vec3 origin, vec3 ray, out float minT) {
    int closestIdx = -1;
    minT = 1.0e6;
    for (int i = 0; i < ${maxSpheres}; i++) {
      if (i >= sphereCount) break;
      float t = intersectSphere(origin, ray, sphereCenters[i], sphereRadii[i]);
      if (t < minT) {
        minT = t;
        closestIdx = i;
      }
    }
    return closestIdx;
  }
  
  vec3 getSphereColor(vec3 point, int sphereIdx) {
    if (sphereIdx < 0 || sphereIdx >= sphereCount) return vec3(0.5);
    
    vec3 sphereCenter = sphereCenters[sphereIdx];
    float sphereRadius = sphereRadii[sphereIdx];
    vec3 baseColor = sphereColors[sphereIdx];
    
    vec3 color = baseColor;
    
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
    
    // Shadow from all spheres
    for (int i = 0; i < ${maxSpheres}; i++) {
      if (i >= sphereCount) break;
      scale *= 1.0 - 0.9 / pow(length(point - sphereCenters[i]) / sphereRadii[i], 4.0);
    }
    
    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));
    vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
    if (point.y < info.r) {
      vec4 caustic = texture2D(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
      scale += diffuse * 0.5;
    }
    
    return wallColor * scale;
  }
`;

export class Renderer {
  gl: GLContextExtended;
  tileTexture: Texture;
  lightDir: Vector;
  causticTex: Texture;
  waterMesh: Mesh;
  waterShaders: Shader[];
  spheres: SphereData[];
  maxSpheres: number;
  sphereMesh: Mesh;
  sphereShader: Shader;
  cubeMesh: Mesh;
  cubeShader: Shader;
  causticsShader: Shader;
  settings: RenderSettings;

  constructor(gl: GLContextExtended, tileCanvas: HTMLCanvasElement, maxSpheres: number = 8) {
    this.gl = gl;
    this.maxSpheres = maxSpheres;
    this.settings = { ...DEFAULT_RENDER_SETTINGS };
    this.spheres = [];
    
    this.tileTexture = Texture.fromImage(gl, tileCanvas, {
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      wrap: gl.REPEAT,
      format: gl.RGB
    });
    
    this.lightDir = new Vector(2.0, 2.0, -1.0).unit();
    this.causticTex = new Texture(gl, 1024, 1024);
    this.waterMesh = Mesh.plane(gl, { detail: 200 });
    this.waterShaders = [];

    const helperFunctions = createHelperFunctions(this.settings, maxSpheres);

    // Create water shaders for above and below water views
    for (let i = 0; i < 2; i++) {
      const underwaterCode = i ? `
        normal = -normal;
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
        float fresnel = mix(0.5, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, underwaterColor);
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, vec3(1.0)) * vec3(0.8, 1.0, 1.1);
        
        gl_FragColor = vec4(mix(reflectedColor, refractedColor, (1.0 - fresnel) * length(refractedRay)), 1.0);
      ` : `
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
        float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        
        vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, abovewaterColor);
        vec3 refractedColor = getSurfaceRayColor(position, refractedRay, abovewaterColor);
        
        gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
      `;

      this.waterShaders[i] = new Shader(gl, `
        uniform sampler2D water;
        varying vec3 position;
        void main() {
          vec4 info = texture2D(water, gl_Vertex.xy * 0.5 + 0.5);
          position = gl_Vertex.xzy;
          position.y += info.r;
          gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
        }
      `, helperFunctions + `
        uniform vec3 eye;
        varying vec3 position;
        uniform samplerCube sky;
        
        vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
          vec3 color;
          float minT;
          int sphereIdx = findClosestSphere(origin, ray, minT);
          
          if (minT < 1.0e6) {
            color = getSphereColor(origin + ray * minT, sphereIdx);
          } else if (ray.y < 0.0) {
            vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
            color = getWallColor(origin + ray * t.y);
          } else {
            vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
            vec3 hit = origin + ray * t.y;
            if (hit.y < 2.0 / 12.0) {
              color = getWallColor(hit);
            } else {
              color = textureCube(sky, ray).rgb;
              color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
            }
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
          vec3 incomingRay = normalize(position - eye);
          
          ${underwaterCode}
        }
      `);
    }

    // Sphere shader and mesh - renders all spheres
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
      uniform int currentSphereIdx;
      varying vec3 position;
      void main() {
        gl_FragColor = vec4(getSphereColor(position, currentSphereIdx), 1.0);
      }
    `);

    // Cube shader and mesh
    this.cubeMesh = Mesh.cube(gl);
    this.cubeMesh.triangles?.reverse();
    this.cubeMesh.compile();

    this.cubeShader = new Shader(gl, `
      const float poolHeight = 1.0;
      varying vec3 position;
      void main() {
        position = gl_Vertex.xyz;
        position.y = ((gl_Vertex.y + 1.0) * (gl_Vertex.y - poolHeight) / 4.0) * 2.0 - 1.0;
        gl_Position = gl_ModelViewProjectionMatrix * vec4(position, 1.0);
      }
    `, helperFunctions + `
      varying vec3 position;
      void main() {
        gl_FragColor = vec4(getWallColor(position), 1.0);
        vec4 info = texture2D(water, position.xz * 0.5 + 0.5);
        if (position.y < info.r) {
          gl_FragColor.rgb *= underwaterColor * 1.2;
        }
      }
    `);

    // Caustics shader - accounts for all spheres
    const hasDerivatives = !!gl.getExtension('OES_standard_derivatives');
    this.causticsShader = new Shader(gl, helperFunctions + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      
      vec3 project(vec3 origin, vec3 ray, vec3 refractedLight) {
        vec2 tcube = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
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
        
        gl_Position = vec4(0.75 * (newPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
      }
    `, (hasDerivatives ? '#extension GL_OES_standard_derivatives : enable\n' : '') + helperFunctions + `
      varying vec3 oldPos;
      varying vec3 newPos;
      varying vec3 ray;
      
      void main() {
        ${hasDerivatives ? `
          float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
          float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
          gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);
        ` : `
          gl_FragColor = vec4(0.2, 0.2, 0.0, 0.0);
        `}
        
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        
        // Shadow from all spheres
        float shadow = 1.0;
        for (int i = 0; i < ${maxSpheres}; i++) {
          if (i >= sphereCount) break;
          vec3 dir = (sphereCenters[i] - newPos) / sphereRadii[i];
          vec3 area = cross(dir, refractedLight);
          float s = dot(area, area);
          float dist = dot(dir, -refractedLight);
          s = 1.0 + (s - 1.0) / (0.05 + dist * 0.025);
          s = clamp(1.0 / (1.0 + exp(-s)), 0.0, 1.0);
          s = mix(1.0, s, clamp(dist * 2.0, 0.0, 1.0));
          shadow *= s;
        }
        gl_FragColor.g = shadow;
        
        vec3 refractedLightNeg = -refractedLight;
        vec2 t = intersectCube(newPos, refractedLightNeg, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
        gl_FragColor.r *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLightNeg.y * t.y - 2.0 / 12.0)));
      }
    `);
  }

  updateSettings(settings: Partial<RenderSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  addSphere(center: Vector, radius: number, color: [number, number, number]): number {
    if (this.spheres.length >= this.maxSpheres) {
      console.warn('Maximum sphere count reached');
      return -1;
    }
    this.spheres.push({
      center: center.clone(),
      radius,
      color,
      velocity: new Vector(),
      oldCenter: center.clone()
    });
    return this.spheres.length - 1;
  }

  removeSphere(index: number) {
    if (index >= 0 && index < this.spheres.length) {
      this.spheres.splice(index, 1);
    }
  }

  private getSphereUniforms(): Record<string, any> {
    const centers: number[] = [];
    const radii: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i < this.maxSpheres; i++) {
      if (i < this.spheres.length) {
        const s = this.spheres[i];
        centers.push(s.center.x, s.center.y, s.center.z);
        radii.push(s.radius);
        colors.push(s.color[0], s.color[1], s.color[2]);
      } else {
        centers.push(0, 0, 0);
        radii.push(0);
        colors.push(0, 0, 0);
      }
    }
    
    return {
      sphereCenters: centers,
      sphereRadii: radii,
      sphereColors: colors,
      sphereCount: this.spheres.length,
      IOR_WATER: this.settings.refractionIndex,
      abovewaterColor: this.settings.abovewaterColor,
      underwaterColor: this.settings.underwaterColor
    };
  }

  updateCaustics(water: Water) {
    if (!this.causticsShader) return;
    const self = this;
    this.causticTex.drawTo(() => {
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);
      water.textureA.bind(0);
      self.causticsShader.uniforms({
        light: self.lightDir,
        water: 0,
        ...self.getSphereUniforms()
      }).draw(self.waterMesh);
    });
  }

  renderWater(water: Water, sky: Cubemap) {
    const gl = this.gl;
    const tracer = new Raytracer(gl);
    water.textureA.bind(0);
    this.tileTexture.bind(1);
    sky.bind(2);
    this.causticTex.bind(3);
    gl.enable(gl.CULL_FACE);
    
    const sphereUniforms = this.getSphereUniforms();
    
    for (let i = 0; i < 2; i++) {
      gl.cullFace(i ? gl.BACK : gl.FRONT);
      this.waterShaders[i].uniforms({
        light: this.lightDir,
        water: 0,
        tiles: 1,
        sky: 2,
        causticTex: 3,
        eye: tracer.eye,
        ...sphereUniforms
      }).draw(this.waterMesh);
    }
    gl.disable(gl.CULL_FACE);
  }

  renderSpheres(water: Water) {
    water.textureA.bind(0);
    this.causticTex.bind(1);
    
    const sphereUniforms = this.getSphereUniforms();
    
    for (let i = 0; i < this.spheres.length; i++) {
      const sphere = this.spheres[i];
      this.sphereShader.uniforms({
        light: this.lightDir,
        water: 0,
        causticTex: 1,
        sphereCenter: sphere.center,
        sphereRadius: sphere.radius,
        currentSphereIdx: i,
        ...sphereUniforms
      }).draw(this.sphereMesh);
    }
  }

  renderCube(water: Water) {
    const gl = this.gl;
    gl.enable(gl.CULL_FACE);
    water.textureA.bind(0);
    this.tileTexture.bind(1);
    this.causticTex.bind(2);
    this.cubeShader.uniforms({
      light: this.lightDir,
      water: 0,
      tiles: 1,
      causticTex: 2,
      ...this.getSphereUniforms()
    }).draw(this.cubeMesh);
    gl.disable(gl.CULL_FACE);
  }
}
