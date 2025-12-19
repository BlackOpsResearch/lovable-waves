/**
 * Water simulation with GPU-based physics
 * Ported from Evan Wallace's webgl-water
 */
import { GLContextExtended } from './GLContext';
import { Mesh } from './Mesh';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { Vector } from './Vector';

export class Water {
  gl: GLContextExtended;
  plane: Mesh;
  textureA: Texture;
  textureB: Texture;
  dropShader: Shader;
  updateShader: Shader;
  normalShader: Shader;
  sphereShader: Shader;

  constructor(gl: GLContextExtended) {
    this.gl = gl;

    const vertexShader = `
      varying vec2 coord;
      void main() {
        coord = gl_Vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(gl_Vertex.xyz, 1.0);
      }
    `;

    this.plane = Mesh.plane(gl);

    if (!Texture.canUseFloatingPointTextures(gl)) {
      throw new Error('This demo requires the OES_texture_float extension');
    }

    let filter = Texture.canUseFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
    this.textureA = new Texture(gl, 256, 256, { type: gl.FLOAT, filter });
    this.textureB = new Texture(gl, 256, 256, { type: gl.FLOAT, filter });

    if ((!this.textureA.canDrawTo() || !this.textureB.canDrawTo()) && Texture.canUseHalfFloatingPointTextures(gl)) {
      filter = Texture.canUseHalfFloatingPointLinearFiltering(gl) ? gl.LINEAR : gl.NEAREST;
      this.textureA = new Texture(gl, 256, 256, { type: gl.HALF_FLOAT_OES, filter });
      this.textureB = new Texture(gl, 256, 256, { type: gl.HALF_FLOAT_OES, filter });
    }

    this.dropShader = new Shader(gl, vertexShader, `
      const float PI = 3.141592653589793;
      uniform sampler2D texture;
      uniform vec2 center;
      uniform float radius;
      uniform float strength;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
        drop = 0.5 - cos(drop * PI) * 0.5;
        info.r += drop * strength;
        gl_FragColor = info;
      }
    `);

    this.updateShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec2 dx = vec2(delta.x, 0.0);
        vec2 dy = vec2(0.0, delta.y);
        float average = (
          texture2D(texture, coord - dx).r +
          texture2D(texture, coord - dy).r +
          texture2D(texture, coord + dx).r +
          texture2D(texture, coord + dy).r
        ) * 0.25;
        info.g += (average - info.r) * 2.0;
        info.g *= 0.995;
        info.r += info.g;
        gl_FragColor = info;
      }
    `);

    this.normalShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec2 delta;
      varying vec2 coord;
      void main() {
        vec4 info = texture2D(texture, coord);
        vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
        vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
        info.ba = normalize(cross(dy, dx)).xz;
        gl_FragColor = info;
      }
    `);

    this.sphereShader = new Shader(gl, vertexShader, `
      uniform sampler2D texture;
      uniform vec3 oldCenter;
      uniform vec3 newCenter;
      uniform float radius;
      varying vec2 coord;
      
      float volumeInSphere(vec3 center) {
        vec3 toCenter = vec3(coord.x * 2.0 - 1.0, 0.0, coord.y * 2.0 - 1.0) - center;
        float t = length(toCenter) / radius;
        float dy = exp(-pow(t * 1.5, 6.0));
        float ymin = min(0.0, center.y - dy);
        float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
        return (ymax - ymin) * 0.1;
      }
      
      void main() {
        vec4 info = texture2D(texture, coord);
        info.r += volumeInSphere(oldCenter);
        info.r -= volumeInSphere(newCenter);
        gl_FragColor = info;
      }
    `);
  }

  addDrop(x: number, y: number, radius: number, strength: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.dropShader.uniforms({
        center: [x, y],
        radius,
        strength
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  moveSphere(oldCenter: Vector, newCenter: Vector, radius: number) {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.sphereShader.uniforms({
        oldCenter,
        newCenter,
        radius
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  stepSimulation() {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.updateShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height]
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }

  updateNormals() {
    const self = this;
    this.textureB.drawTo(() => {
      self.textureA.bind();
      self.normalShader.uniforms({
        delta: [1 / self.textureA.width, 1 / self.textureA.height]
      }).draw(self.plane);
    });
    this.textureB.swapWith(this.textureA);
  }
}
