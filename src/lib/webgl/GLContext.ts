/**
 * Enhanced WebGL2 Context with matrix stack and utilities
 * Upgraded from WebGL1 to WebGL2 with fallback support
 * Ported from Evan Wallace's lightgl.js with WebGL2 extensions
 */
import { Matrix } from './Matrix';
import { Vector } from './Vector';

const ENUM = 0x12340000;

export interface GLContextExtended extends WebGL2RenderingContext {
  // Matrix stack extensions
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
  
  // WebGL2 feature flags
  isWebGL2: boolean;
  hasFloatBlend: boolean;
  hasColorBufferFloat: boolean;
  hasFloatLinear: boolean;
  maxTextureUnits: number;
  maxVertexTextureUnits: number;
  maxDrawBuffers: number;
}

export interface WebGL2Features {
  isWebGL2: boolean;
  hasFloatTextures: boolean;
  hasFloatLinear: boolean;
  hasFloatBlend: boolean;
  hasColorBufferFloat: boolean;
  has3DTextures: boolean;
  hasTransformFeedback: boolean;
  hasVertexArrayObject: boolean;
  hasMultipleRenderTargets: boolean;
  maxTextureUnits: number;
  maxVertexTextureUnits: number;
  maxDrawBuffers: number;
  maxTextureSize: number;
  max3DTextureSize: number;
}

export function getWebGL2Features(gl: GLContextExtended): WebGL2Features {
  return {
    isWebGL2: gl.isWebGL2,
    hasFloatTextures: true, // Always available in WebGL2
    hasFloatLinear: gl.hasFloatLinear,
    hasFloatBlend: gl.hasFloatBlend,
    hasColorBufferFloat: gl.hasColorBufferFloat,
    has3DTextures: gl.isWebGL2,
    hasTransformFeedback: gl.isWebGL2,
    hasVertexArrayObject: gl.isWebGL2,
    hasMultipleRenderTargets: gl.isWebGL2,
    maxTextureUnits: gl.maxTextureUnits,
    maxVertexTextureUnits: gl.maxVertexTextureUnits,
    maxDrawBuffers: gl.maxDrawBuffers,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    max3DTextureSize: gl.isWebGL2 ? gl.getParameter(gl.MAX_3D_TEXTURE_SIZE) : 0,
  };
}

export function createGLContext(canvas: HTMLCanvasElement, options: WebGLContextAttributes = {}): GLContextExtended | null {
  if (!('alpha' in options)) options.alpha = false;
  if (!('antialias' in options)) options.antialias = true;
  if (!('depth' in options)) options.depth = true;
  if (!('stencil' in options)) options.stencil = false;
  if (!('preserveDrawingBuffer' in options)) options.preserveDrawingBuffer = false;
  
  let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  let isWebGL2 = false;
  
  // Try WebGL2 first
  try {
    gl = canvas.getContext('webgl2', options);
    if (gl) {
      isWebGL2 = true;
      console.log('WebGL2 context created successfully');
    }
  } catch (e) {
    console.warn('WebGL2 not available, falling back to WebGL1');
  }
  
  // Fall back to WebGL1
  if (!gl) {
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
  }
  
  if (!gl) {
    console.error('WebGL not supported');
    return null;
  }

  const glExt = gl as GLContextExtended;
  glExt.isWebGL2 = isWebGL2;
  
  // Setup extensions and feature flags
  if (isWebGL2) {
    // WebGL2 has HALF_FLOAT built-in
    glExt.HALF_FLOAT_OES = (gl as WebGL2RenderingContext).HALF_FLOAT;
    
    // Enable WebGL2 extensions
    glExt.hasColorBufferFloat = !!gl.getExtension('EXT_color_buffer_float');
    glExt.hasFloatBlend = !!gl.getExtension('EXT_float_blend');
    glExt.hasFloatLinear = true; // Built into WebGL2
    
    // Get standard derivatives (built into WebGL2)
    // OES_standard_derivatives is part of WebGL2 core
  } else {
    // WebGL1 extensions
    const halfFloatExt = gl.getExtension('OES_texture_half_float');
    glExt.HALF_FLOAT_OES = halfFloatExt ? halfFloatExt.HALF_FLOAT_OES : 0x8d61;
    
    gl.getExtension('OES_texture_float');
    glExt.hasFloatLinear = !!gl.getExtension('OES_texture_float_linear');
    gl.getExtension('OES_texture_half_float_linear');
    gl.getExtension('OES_standard_derivatives');
    
    glExt.hasColorBufferFloat = false;
    glExt.hasFloatBlend = false;
  }
  
  // Get capability limits
  glExt.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  glExt.maxVertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  glExt.maxDrawBuffers = isWebGL2 ? gl.getParameter((gl as WebGL2RenderingContext).MAX_DRAW_BUFFERS) : 1;
  
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

// Transform Feedback utilities for WebGL2
export class TransformFeedback {
  gl: GLContextExtended;
  transformFeedback: WebGLTransformFeedback | null = null;
  buffers: WebGLBuffer[] = [];
  
  constructor(gl: GLContextExtended, bufferCount: number = 1) {
    this.gl = gl;
    
    if (!gl.isWebGL2) {
      console.warn('Transform Feedback requires WebGL2');
      return;
    }
    
    const gl2 = gl as WebGL2RenderingContext;
    this.transformFeedback = gl2.createTransformFeedback();
    
    for (let i = 0; i < bufferCount; i++) {
      const buffer = gl2.createBuffer();
      if (buffer) this.buffers.push(buffer);
    }
  }
  
  bind() {
    if (!this.transformFeedback || !this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.bindTransformFeedback(gl2.TRANSFORM_FEEDBACK, this.transformFeedback);
  }
  
  unbind() {
    if (!this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.bindTransformFeedback(gl2.TRANSFORM_FEEDBACK, null);
  }
  
  bindBufferBase(index: number, buffer: WebGLBuffer) {
    if (!this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.bindBufferBase(gl2.TRANSFORM_FEEDBACK_BUFFER, index, buffer);
  }
  
  begin(primitiveMode: number) {
    if (!this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.beginTransformFeedback(primitiveMode);
  }
  
  end() {
    if (!this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.endTransformFeedback();
  }
  
  destroy() {
    if (!this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    if (this.transformFeedback) {
      gl2.deleteTransformFeedback(this.transformFeedback);
    }
    for (const buffer of this.buffers) {
      gl2.deleteBuffer(buffer);
    }
  }
}

// Vertex Array Object utilities
export class VertexArrayObject {
  gl: GLContextExtended;
  vao: WebGLVertexArrayObject | null = null;
  
  constructor(gl: GLContextExtended) {
    this.gl = gl;
    
    if (!gl.isWebGL2) {
      console.warn('Vertex Array Objects require WebGL2');
      return;
    }
    
    const gl2 = gl as WebGL2RenderingContext;
    this.vao = gl2.createVertexArray();
  }
  
  bind() {
    if (!this.vao || !this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.bindVertexArray(this.vao);
  }
  
  unbind() {
    if (!this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.bindVertexArray(null);
  }
  
  destroy() {
    if (!this.vao || !this.gl.isWebGL2) return;
    const gl2 = this.gl as WebGL2RenderingContext;
    gl2.deleteVertexArray(this.vao);
  }
}
