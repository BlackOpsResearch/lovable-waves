/**
 * WebGL Shader wrapper with automatic uniform handling
 * Ported from Evan Wallace's lightgl.js
 */
import { GLContextExtended } from './GLContext';
import { Matrix } from './Matrix';
import { Vector } from './Vector';
import { Mesh } from './Mesh';

const LIGHTGL_PREFIX = 'LIGHTGL';

function regexMap(regex: RegExp, text: string, callback: (groups: RegExpExecArray) => void) {
  let result;
  while ((result = regex.exec(text)) !== null) {
    callback(result);
  }
}

function isArray(obj: unknown): obj is number[] | Float32Array {
  const str = Object.prototype.toString.call(obj);
  return str === '[object Array]' || str === '[object Float32Array]';
}

function isNumber(obj: unknown): obj is number | boolean {
  const str = Object.prototype.toString.call(obj);
  return str === '[object Number]' || str === '[object Boolean]';
}

export class Shader {
  gl: GLContextExtended;
  program: WebGLProgram;
  attributes: { [key: string]: number } = {};
  uniformLocations: { [key: string]: WebGLUniformLocation | null } = {};
  isSampler: { [key: string]: number } = {};
  usedMatrices: { [key: string]: string } = {};

  constructor(gl: GLContextExtended, vertexSource: string, fragmentSource: string) {
    this.gl = gl;

    const header = `
      uniform mat3 gl_NormalMatrix;
      uniform mat4 gl_ModelViewMatrix;
      uniform mat4 gl_ProjectionMatrix;
      uniform mat4 gl_ModelViewProjectionMatrix;
      uniform mat4 gl_ModelViewMatrixInverse;
      uniform mat4 gl_ProjectionMatrixInverse;
      uniform mat4 gl_ModelViewProjectionMatrixInverse;
    `;
    
    const vertexHeader = header + `
      attribute vec4 gl_Vertex;
      attribute vec4 gl_TexCoord;
      attribute vec3 gl_Normal;
      attribute vec4 gl_Color;
      vec4 ftransform() {
        return gl_ModelViewProjectionMatrix * gl_Vertex;
      }
    `;
    
    const fragmentHeader = `
      precision highp float;
    ` + header;

    // Check for the use of built-in matrices
    const source = vertexSource + fragmentSource;
    const usedMatrices: { [key: string]: string } = {};
    regexMap(/\b(gl_[^;]*)\b;/g, header, (groups) => {
      const name = groups[1];
      if (source.indexOf(name) !== -1) {
        const capitalLetters = name.replace(/[a-z_]/g, '');
        usedMatrices[capitalLetters] = LIGHTGL_PREFIX + name;
      }
    });
    if (source.indexOf('ftransform') !== -1) {
      usedMatrices['MVPM'] = LIGHTGL_PREFIX + 'gl_ModelViewProjectionMatrix';
    }
    this.usedMatrices = usedMatrices;

    function fix(header: string, source: string): string {
      const replaced: { [key: string]: boolean } = {};
      const match = /^((\s*\/\/.*\n|\s*#extension.*\n)+)[^]*$/.exec(source);
      source = match ? match[1] + header + source.substr(match[1].length) : header + source;
      regexMap(/\bgl_\w+\b/g, header, (result) => {
        if (!(result[0] in replaced)) {
          source = source.replace(new RegExp('\\b' + result[0] + '\\b', 'g'), LIGHTGL_PREFIX + result[0]);
          replaced[result[0]] = true;
        }
      });
      return source;
    }

    vertexSource = fix(vertexHeader, vertexSource);
    fragmentSource = fix(fragmentHeader, fragmentSource);

    const compileSource = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Failed to create shader');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('compile error: ' + gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');
    
    this.program = program;
    gl.attachShader(program, compileSource(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileSource(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('link error: ' + gl.getProgramInfoLog(program));
    }

    // Detect sampler uniforms
    const samplerRegex = /uniform\s+sampler(1D|2D|3D|Cube)\s+(\w+)\s*;/g;
    regexMap(samplerRegex, vertexSource + fragmentSource, (groups) => {
      this.isSampler[groups[2]] = 1;
    });
  }

  uniforms(uniforms: { [key: string]: unknown }): this {
    const gl = this.gl;
    gl.useProgram(this.program);

    for (const name in uniforms) {
      const location = this.uniformLocations[name] || gl.getUniformLocation(this.program, name);
      if (!location) continue;
      this.uniformLocations[name] = location;
      let value = uniforms[name];
      
      if (value instanceof Vector) {
        value = [value.x, value.y, value.z];
      } else if (value instanceof Matrix) {
        value = value.m;
      }
      
      if (isArray(value)) {
        switch (value.length) {
          case 1: gl.uniform1fv(location, new Float32Array(value as number[])); break;
          case 2: gl.uniform2fv(location, new Float32Array(value as number[])); break;
          case 3: gl.uniform3fv(location, new Float32Array(value as number[])); break;
          case 4: gl.uniform4fv(location, new Float32Array(value as number[])); break;
          case 9: gl.uniformMatrix3fv(location, false, new Float32Array([
            value[0], value[3], value[6],
            value[1], value[4], value[7],
            value[2], value[5], value[8]
          ])); break;
          case 16: gl.uniformMatrix4fv(location, false, new Float32Array([
            value[0], value[4], value[8], value[12],
            value[1], value[5], value[9], value[13],
            value[2], value[6], value[10], value[14],
            value[3], value[7], value[11], value[15]
          ])); break;
          default: throw new Error(`don't know how to load uniform "${name}" of length ${value.length}`);
        }
      } else if (isNumber(value)) {
        (this.isSampler[name] ? gl.uniform1i : gl.uniform1f).call(gl, location, value as number);
      } else {
        throw new Error(`attempted to set uniform "${name}" to invalid value ${value}`);
      }
    }

    return this;
  }

  draw(mesh: Mesh, mode?: number): this {
    return this.drawBuffers(
      mesh.vertexBuffers,
      mesh.indexBuffers[mode === this.gl.LINES ? 'lines' : 'triangles'],
      mode === undefined ? this.gl.TRIANGLES : mode
    );
  }

  drawBuffers(
    vertexBuffers: Mesh['vertexBuffers'],
    indexBuffer: { buffer: WebGLBuffer | null; length: number } | undefined,
    mode: number
  ): this {
    const gl = this.gl;
    const used = this.usedMatrices;
    const MVM = gl.modelviewMatrix;
    const PM = gl.projectionMatrix;
    const MVMI = (used['MVMI'] || used['NM']) ? MVM.inverse() : null;
    const PMI = used['PMI'] ? PM.inverse() : null;
    const MVPM = (used['MVPM'] || used['MVPMI']) ? PM.multiply(MVM) : null;
    
    const matrices: { [key: string]: Matrix | number[] } = {};
    if (used['MVM']) matrices[used['MVM']] = MVM;
    if (used['MVMI'] && MVMI) matrices[used['MVMI']] = MVMI;
    if (used['PM']) matrices[used['PM']] = PM;
    if (used['PMI'] && PMI) matrices[used['PMI']] = PMI;
    if (used['MVPM'] && MVPM) matrices[used['MVPM']] = MVPM;
    if (used['MVPMI'] && MVPM) matrices[used['MVPMI']] = MVPM.inverse();
    if (used['NM'] && MVMI) {
      const m = MVMI.m;
      matrices[used['NM']] = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
    }
    this.uniforms(matrices);

    // Create and enable attribute pointers
    let length = 0;
    for (const attribute in vertexBuffers) {
      const buffer = vertexBuffers[attribute];
      const location = this.attributes[attribute] ??
        gl.getAttribLocation(this.program, attribute.replace(/^(gl_.*)$/, LIGHTGL_PREFIX + '$1'));
      if (location === -1 || !buffer.buffer) continue;
      this.attributes[attribute] = location;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, buffer.spacing, gl.FLOAT, false, 0, 0);
      length = buffer.length / buffer.spacing;
    }

    // Disable unused attribute pointers
    for (const attribute in this.attributes) {
      if (!(attribute in vertexBuffers)) {
        gl.disableVertexAttribArray(this.attributes[attribute]);
      }
    }

    // Draw the geometry
    if (length && (!indexBuffer || indexBuffer.buffer)) {
      if (indexBuffer) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
        gl.drawElements(mode, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(mode, 0, length);
      }
    }

    return this;
  }
}
