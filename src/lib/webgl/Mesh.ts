/**
 * WebGL Mesh wrapper for geometry data
 * Ported from Evan Wallace's lightgl.js
 */
import { GLContextExtended } from './GLContext';
import { Vector } from './Vector';

interface BufferInfo {
  buffer: WebGLBuffer | null;
  length: number;
  spacing: number;
  name: string;
}

interface IndexBufferInfo {
  buffer: WebGLBuffer | null;
  length: number;
}

export interface MeshOptions {
  coords?: boolean;
  normals?: boolean;
  colors?: boolean;
  triangles?: boolean;
  lines?: boolean;
  detail?: number;
  detailX?: number;
  detailY?: number;
}

export class Mesh {
  gl: GLContextExtended;
  vertexBuffers: { [key: string]: BufferInfo } = {};
  indexBuffers: { [key: string]: IndexBufferInfo } = {};
  vertices: number[][] = [];
  coords?: number[][];
  normals?: number[][];
  colors?: number[][];
  triangles?: number[][];
  lines?: number[][];

  constructor(gl: GLContextExtended, options: MeshOptions = {}) {
    this.gl = gl;
    this.addVertexBuffer('vertices', 'gl_Vertex');
    if (options.coords) this.addVertexBuffer('coords', 'gl_TexCoord');
    if (options.normals) this.addVertexBuffer('normals', 'gl_Normal');
    if (options.colors) this.addVertexBuffer('colors', 'gl_Color');
    if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
    if (options.lines) this.addIndexBuffer('lines');
  }

  addVertexBuffer(name: string, attribute: string) {
    this.vertexBuffers[attribute] = {
      buffer: null,
      length: 0,
      spacing: 0,
      name
    };
    (this as Record<string, unknown>)[name] = [];
  }

  addIndexBuffer(name: string) {
    this.indexBuffers[name] = {
      buffer: null,
      length: 0
    };
    (this as Record<string, unknown>)[name] = [];
  }

  compile(type?: number) {
    const gl = this.gl;

    for (const attribute in this.vertexBuffers) {
      const bufferInfo = this.vertexBuffers[attribute];
      const data = (this as Record<string, unknown>)[bufferInfo.name] as number[][];
      
      if (!data || data.length === 0) continue;

      // Flatten data
      const flattened: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (Array.isArray(item)) {
          flattened.push(...item);
        } else {
          flattened.push(item as number);
        }
      }

      const spacing = data.length ? flattened.length / data.length : 0;
      
      if (!bufferInfo.buffer) {
        bufferInfo.buffer = gl.createBuffer();
      }
      bufferInfo.length = flattened.length;
      bufferInfo.spacing = spacing;
      
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flattened), type || gl.STATIC_DRAW);
    }

    for (const name in this.indexBuffers) {
      const bufferInfo = this.indexBuffers[name];
      const data = (this as Record<string, unknown>)[name] as number[][];
      
      if (!data || data.length === 0) continue;

      // Flatten data
      const flattened: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (Array.isArray(item)) {
          flattened.push(...item);
        } else {
          flattened.push(item as number);
        }
      }

      if (!bufferInfo.buffer) {
        bufferInfo.buffer = gl.createBuffer();
      }
      bufferInfo.length = flattened.length;
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flattened), type || gl.STATIC_DRAW);
    }
  }

  transform(matrix: { transformPoint: (v: Vector) => Vector; inverse: () => { transpose: () => { transformVector: (v: Vector) => Vector } } }) {
    this.vertices = this.vertices.map((v) => {
      return matrix.transformPoint(Vector.fromArray(v)).toArray();
    });
    if (this.normals) {
      const invTrans = matrix.inverse().transpose();
      this.normals = this.normals.map((n) => {
        return invTrans.transformVector(Vector.fromArray(n)).unit().toArray();
      });
    }
    this.compile();
    return this;
  }

  computeNormals() {
    if (!this.normals) this.addVertexBuffer('normals', 'gl_Normal');
    this.normals = [];
    for (let i = 0; i < this.vertices.length; i++) {
      this.normals[i] = [0, 0, 0];
    }
    if (this.triangles) {
      for (let i = 0; i < this.triangles.length; i++) {
        const t = this.triangles[i];
        const a = Vector.fromArray(this.vertices[t[0]]);
        const b = Vector.fromArray(this.vertices[t[1]]);
        const c = Vector.fromArray(this.vertices[t[2]]);
        const normal = b.subtract(a).cross(c.subtract(a)).unit();
        this.normals[t[0]] = Vector.fromArray(this.normals[t[0]]).add(normal).toArray();
        this.normals[t[1]] = Vector.fromArray(this.normals[t[1]]).add(normal).toArray();
        this.normals[t[2]] = Vector.fromArray(this.normals[t[2]]).add(normal).toArray();
      }
    }
    for (let i = 0; i < this.vertices.length; i++) {
      this.normals[i] = Vector.fromArray(this.normals[i]).unit().toArray();
    }
    this.compile();
    return this;
  }

  static plane(gl: GLContextExtended, options: MeshOptions = {}): Mesh {
    const mesh = new Mesh(gl, options);
    const detailX = options.detailX || options.detail || 1;
    const detailY = options.detailY || options.detail || 1;

    for (let y = 0; y <= detailY; y++) {
      const t = y / detailY;
      for (let x = 0; x <= detailX; x++) {
        const s = x / detailX;
        mesh.vertices.push([2 * s - 1, 2 * t - 1, 0]);
        if (mesh.coords) mesh.coords.push([s, t]);
        if (mesh.normals) mesh.normals.push([0, 0, 1]);
        if (x < detailX && y < detailY) {
          const i = x + y * (detailX + 1);
          if (mesh.triangles) {
            mesh.triangles.push([i, i + 1, i + detailX + 1]);
            mesh.triangles.push([i + detailX + 1, i + 1, i + detailX + 2]);
          }
        }
      }
    }

    mesh.compile();
    return mesh;
  }

  static cube(gl: GLContextExtended, options: MeshOptions = {}): Mesh {
    const mesh = new Mesh(gl, options);
    const cubeData = [
      [0, 4, 2, 6, -1, 0, 0], // -x
      [1, 3, 5, 7, +1, 0, 0], // +x
      [0, 1, 4, 5, 0, -1, 0], // -y
      [2, 6, 3, 7, 0, +1, 0], // +y
      [0, 2, 1, 3, 0, 0, -1], // -z
      [4, 5, 6, 7, 0, 0, +1]  // +z
    ];

    function pickOctant(i: number): Vector {
      return new Vector((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);
    }

    for (let i = 0; i < cubeData.length; i++) {
      const data = cubeData[i];
      const v = i * 4;
      for (let j = 0; j < 4; j++) {
        const d = data[j];
        mesh.vertices.push(pickOctant(d).toArray());
        if (mesh.coords) mesh.coords.push([j & 1, (j & 2) / 2]);
        if (mesh.normals) mesh.normals.push(data.slice(4, 7));
      }
      if (mesh.triangles) {
        mesh.triangles.push([v, v + 1, v + 2]);
        mesh.triangles.push([v + 2, v + 1, v + 3]);
      }
    }

    mesh.compile();
    return mesh;
  }

  static sphere(gl: GLContextExtended, options: MeshOptions = {}): Mesh {
    const mesh = new Mesh(gl, options);
    const detail = options.detail || 6;

    function pickOctant(i: number): Vector {
      return new Vector((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);
    }

    function fix(x: number): number {
      return x + (x - x * x) / 2;
    }

    interface VertexData {
      vertex: number[];
      coord?: number[];
    }

    const unique: VertexData[] = [];
    const map: { [key: string]: number } = {};

    function addVertex(obj: VertexData): number {
      const key = JSON.stringify(obj);
      if (!(key in map)) {
        map[key] = unique.length;
        unique.push(obj);
      }
      return map[key];
    }

    for (let octant = 0; octant < 8; octant++) {
      const scale = pickOctant(octant);
      const flip = scale.x * scale.y * scale.z > 0;
      const data: number[] = [];

      for (let i = 0; i <= detail; i++) {
        for (let j = 0; i + j <= detail; j++) {
          const a = i / detail;
          const b = j / detail;
          const c = (detail - i - j) / detail;
          const vertexData: VertexData = {
            vertex: new Vector(fix(a), fix(b), fix(c)).unit().multiply(scale).toArray()
          };
          if (mesh.coords) {
            vertexData.coord = scale.y > 0 ? [1 - a, c] : [c, 1 - a];
          }
          data.push(addVertex(vertexData));
        }

        if (i > 0) {
          for (let j = 0; i + j <= detail; j++) {
            const a = (i - 1) * (detail + 1) + ((i - 1) - (i - 1) * (i - 1)) / 2 + j;
            const b = i * (detail + 1) + (i - i * i) / 2 + j;
            const tri = flip ? [data[a], data[b], data[a + 1]] : [data[a], data[a + 1], data[b]];
            if (mesh.triangles) mesh.triangles.push(tri);
            if (i + j < detail) {
              const tri2 = flip ? [data[b], data[b + 1], data[a + 1]] : [data[b], data[a + 1], data[b + 1]];
              if (mesh.triangles) mesh.triangles.push(tri2);
            }
          }
        }
      }
    }

    mesh.vertices = unique.map((v) => v.vertex);
    if (mesh.coords) mesh.coords = unique.map((v) => v.coord!);
    if (mesh.normals) mesh.normals = mesh.vertices;

    mesh.compile();
    return mesh;
  }
}
