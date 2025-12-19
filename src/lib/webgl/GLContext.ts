/**
 * Enhanced WebGL Context with matrix stack and utilities
 * Ported from Evan Wallace's lightgl.js
 */
import { Matrix } from './Matrix';
import { Vector } from './Vector';

const ENUM = 0x12340000;

export interface GLContextExtended extends WebGLRenderingContext {
  MODELVIEW: number;
  PROJECTION: number;
  HALF_FLOAT_OES: number;
  modelviewMatrix: Matrix;
  projectionMatrix: Matrix;
  matrixMode: (mode: number) => void;
  loadIdentity: () => void;
  loadMatrix: (m: Matrix) => void;
  multMatrix: (m: Matrix) => void;
  perspective: (fov: number, aspect: number, near: number, far: number) => void;
  frustum: (l: number, r: number, b: number, t: number, n: number, f: number) => void;
  ortho: (l: number, r: number, b: number, t: number, n: number, f: number) => void;
  scale: (x: number, y: number, z: number) => void;
  translate: (x: number, y: number, z: number) => void;
  rotate: (a: number, x: number, y: number, z: number) => void;
  lookAt: (ex: number, ey: number, ez: number, cx: number, cy: number, cz: number, ux: number, uy: number, uz: number) => void;
  pushMatrix: () => void;
  popMatrix: () => void;
  project: (objX: number, objY: number, objZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]) => Vector;
  unProject: (winX: number, winY: number, winZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]) => Vector;
}

export function createGLContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes = {}): GLContextExtended | null {
  if (!('alpha' in options)) options.alpha = false;
  
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', options);
  } catch (e) {
    // Ignore
  }
  try {
    gl = gl || canvas.getContext('experimental-webgl', options) as WebGLRenderingContext;
  } catch (e) {
    // Ignore
  }
  
  if (!gl) return null;

  const glExt = gl as GLContextExtended;
  glExt.HALF_FLOAT_OES = 0x8d61;
  
  addMatrixStack(glExt);
  
  return glExt;
}

function addMatrixStack(gl: GLContextExtended) {
  gl.MODELVIEW = ENUM | 1;
  gl.PROJECTION = ENUM | 2;
  
  const tempMatrix = new Matrix();
  const resultMatrix = new Matrix();
  gl.modelviewMatrix = new Matrix();
  gl.projectionMatrix = new Matrix();
  const modelviewStack: number[][] = [];
  const projectionStack: number[][] = [];
  let matrix: 'modelviewMatrix' | 'projectionMatrix' = 'modelviewMatrix';
  let stack = modelviewStack;

  gl.matrixMode = function (mode: number) {
    switch (mode) {
      case gl.MODELVIEW:
        matrix = 'modelviewMatrix';
        stack = modelviewStack;
        break;
      case gl.PROJECTION:
        matrix = 'projectionMatrix';
        stack = projectionStack;
        break;
      default:
        throw new Error('invalid matrix mode ' + mode);
    }
  };

  gl.loadIdentity = function () {
    Matrix.identity(gl[matrix]);
  };

  gl.loadMatrix = function (m: Matrix) {
    const from = m.m;
    const to = gl[matrix].m;
    for (let i = 0; i < 16; i++) {
      to[i] = from[i];
    }
  };

  gl.multMatrix = function (m: Matrix) {
    gl.loadMatrix(Matrix.multiply(gl[matrix], m, resultMatrix));
  };

  gl.perspective = function (fov: number, aspect: number, near: number, far: number) {
    gl.multMatrix(Matrix.perspective(fov, aspect, near, far, tempMatrix));
  };

  gl.frustum = function (l: number, r: number, b: number, t: number, n: number, f: number) {
    gl.multMatrix(Matrix.frustum(l, r, b, t, n, f, tempMatrix));
  };

  gl.ortho = function (l: number, r: number, b: number, t: number, n: number, f: number) {
    gl.multMatrix(Matrix.ortho(l, r, b, t, n, f, tempMatrix));
  };

  gl.scale = function (x: number, y: number, z: number) {
    gl.multMatrix(Matrix.scale(x, y, z, tempMatrix));
  };

  gl.translate = function (x: number, y: number, z: number) {
    gl.multMatrix(Matrix.translate(x, y, z, tempMatrix));
  };

  gl.rotate = function (a: number, x: number, y: number, z: number) {
    gl.multMatrix(Matrix.rotate(a, x, y, z, tempMatrix));
  };

  gl.lookAt = function (ex: number, ey: number, ez: number, cx: number, cy: number, cz: number, ux: number, uy: number, uz: number) {
    gl.multMatrix(Matrix.lookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz, tempMatrix));
  };

  gl.pushMatrix = function () {
    stack.push(Array.prototype.slice.call(gl[matrix].m));
  };

  gl.popMatrix = function () {
    const m = stack.pop();
    if (m) {
      gl[matrix].m = new Float32Array(m);
    }
  };

  gl.project = function (objX: number, objY: number, objZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]): Vector {
    modelview = modelview || gl.modelviewMatrix;
    projection = projection || gl.projectionMatrix;
    viewport = viewport || (gl.getParameter(gl.VIEWPORT) as number[]);
    const point = projection.transformPoint(modelview.transformPoint(new Vector(objX, objY, objZ)));
    return new Vector(
      viewport[0] + viewport[2] * (point.x * 0.5 + 0.5),
      viewport[1] + viewport[3] * (point.y * 0.5 + 0.5),
      point.z * 0.5 + 0.5
    );
  };

  gl.unProject = function (winX: number, winY: number, winZ: number, modelview?: Matrix, projection?: Matrix, viewport?: number[]): Vector {
    modelview = modelview || gl.modelviewMatrix;
    projection = projection || gl.projectionMatrix;
    viewport = viewport || (gl.getParameter(gl.VIEWPORT) as number[]);
    const point = new Vector(
      ((winX - viewport[0]) / viewport[2]) * 2 - 1,
      ((winY - viewport[1]) / viewport[3]) * 2 - 1,
      winZ * 2 - 1
    );
    return Matrix.inverse(Matrix.multiply(projection, modelview, tempMatrix), resultMatrix).transformPoint(point);
  };

  gl.matrixMode(gl.MODELVIEW);
}
