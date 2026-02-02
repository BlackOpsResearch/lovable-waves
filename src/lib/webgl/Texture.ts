/**
 * WebGL2 Texture wrapper with render-to-texture, 3D textures, and texture arrays
 * Upgraded from Evan Wallace's lightgl.js with WebGL2 features
 */
import { GLContextExtended } from './GLContext';

export interface TextureOptions {
  format?: number;
  internalFormat?: number;
  type?: number;
  filter?: number;
  magFilter?: number;
  minFilter?: number;
  wrap?: number;
  wrapS?: number;
  wrapT?: number;
  wrapR?: number; // For 3D textures
  generateMipmaps?: boolean;
}

let framebuffer: WebGLFramebuffer | null = null;
let renderbuffer: WebGLRenderbuffer | null = null;

// Shared framebuffers for MRT
const mrtFramebuffers: Map<string, WebGLFramebuffer> = new Map();

export class Texture {
  gl: GLContextExtended;
  id: WebGLTexture;
  width: number;
  height: number;
  depth: number; // For 3D textures
  format: number;
  internalFormat: number;
  type: number;
  target: number;

  constructor(gl: GLContextExtended, width: number, height: number, options: TextureOptions = {}) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.depth = 1;
    this.target = gl.TEXTURE_2D;
    this.format = options.format || gl.RGBA;
    this.type = options.type || gl.UNSIGNED_BYTE;
    
    // WebGL2 internal format handling
    if (gl.isWebGL2 && options.internalFormat) {
      this.internalFormat = options.internalFormat;
    } else {
      this.internalFormat = this.format;
    }

    const magFilter = options.filter || options.magFilter || gl.LINEAR;
    const minFilter = options.filter || options.minFilter || gl.LINEAR;

    // Validate float texture support
    if (this.type === gl.FLOAT) {
      if (!gl.isWebGL2 && !Texture.canUseFloatingPointTextures(gl)) {
        throw new Error('Float textures require WebGL2 or OES_texture_float extension');
      }
      if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
          !gl.hasFloatLinear) {
        console.warn('Float linear filtering not supported, falling back to NEAREST');
      }
    } else if (this.type === gl.HALF_FLOAT_OES) {
      if (!gl.isWebGL2 && !Texture.canUseHalfFloatingPointTextures(gl)) {
        throw new Error('Half float textures require WebGL2 or OES_texture_half_float extension');
      }
    }

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture');
    this.id = texture;

    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap || options.wrapS || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap || options.wrapT || gl.CLAMP_TO_EDGE);
    
    if (gl.isWebGL2) {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.internalFormat, width, height, 0, this.format, this.type, null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
    }
    
    if (options.generateMipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
  }

  bind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.target, this.id);
  }

  unbind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.target, null);
  }

  canDrawTo(): boolean {
    const gl = this.gl;
    framebuffer = framebuffer || gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    const result = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return result;
  }

  drawTo(callback: () => void) {
    const gl = this.gl;
    const v = gl.getParameter(gl.VIEWPORT);

    framebuffer = framebuffer || gl.createFramebuffer();
    renderbuffer = renderbuffer || gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

    if (this.width !== (renderbuffer as unknown as { width?: number }).width ||
        this.height !== (renderbuffer as unknown as { height?: number }).height) {
      (renderbuffer as unknown as { width: number }).width = this.width;
      (renderbuffer as unknown as { height: number }).height = this.height;
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.viewport(0, 0, this.width, this.height);

    callback();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.viewport(v[0], v[1], v[2], v[3]);
  }

  swapWith(other: Texture) {
    let temp: WebGLTexture;
    temp = other.id; other.id = this.id; this.id = temp;
    
    let tempNum: number;
    tempNum = other.width; other.width = this.width; this.width = tempNum;
    tempNum = other.height; other.height = this.height; this.height = tempNum;
  }

  destroy() {
    this.gl.deleteTexture(this.id);
  }

  static fromImage(gl: GLContextExtended, image: HTMLImageElement | HTMLCanvasElement, options: TextureOptions = {}): Texture {
    const texture = new Texture(gl, image.width, image.height, options);
    gl.bindTexture(gl.TEXTURE_2D, texture.id);
    gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, texture.type, image);
    if (options.minFilter && options.minFilter !== gl.NEAREST && options.minFilter !== gl.LINEAR) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    return texture;
  }

  static fromFloatArray(gl: GLContextExtended, data: Float32Array, width: number, height: number, options: TextureOptions = {}): Texture {
    // Enable float textures extension for WebGL1
    if (!gl.isWebGL2) {
      gl.getExtension('OES_texture_float');
      gl.getExtension('OES_texture_float_linear');
    }
    
    const internalFormat = gl.isWebGL2 ? (gl as WebGL2RenderingContext).RGBA32F : gl.RGBA;
    
    const texture = new Texture(gl, width, height, { 
      ...options, 
      type: gl.FLOAT,
      format: gl.RGBA,
      internalFormat,
      filter: gl.hasFloatLinear ? gl.LINEAR : gl.NEAREST
    });
    
    gl.bindTexture(gl.TEXTURE_2D, texture.id);
    if (gl.isWebGL2) {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, gl.FLOAT, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);
    }
    return texture;
  }

  static fromCanvas(gl: GLContextExtended, canvas: HTMLCanvasElement, options: TextureOptions = {}): Texture {
    const texture = new Texture(gl, canvas.width, canvas.height, options);
    gl.bindTexture(gl.TEXTURE_2D, texture.id);
    gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, texture.type, canvas);
    return texture;
  }

  static canUseFloatingPointTextures(gl: GLContextExtended): boolean {
    return gl.isWebGL2 || !!gl.getExtension('OES_texture_float');
  }

  static canUseFloatingPointLinearFiltering(gl: GLContextExtended): boolean {
    return gl.isWebGL2 || !!gl.getExtension('OES_texture_float_linear');
  }

  static canUseHalfFloatingPointTextures(gl: GLContextExtended): boolean {
    return gl.isWebGL2 || !!gl.getExtension('OES_texture_half_float');
  }

  static canUseHalfFloatingPointLinearFiltering(gl: GLContextExtended): boolean {
    return gl.isWebGL2 || !!gl.getExtension('OES_texture_half_float_linear');
  }
}

/**
 * 3D Texture for volumetric effects (WebGL2 only)
 */
export class Texture3D {
  gl: GLContextExtended;
  id: WebGLTexture;
  width: number;
  height: number;
  depth: number;
  format: number;
  internalFormat: number;
  type: number;

  constructor(gl: GLContextExtended, width: number, height: number, depth: number, options: TextureOptions = {}) {
    if (!gl.isWebGL2) {
      throw new Error('3D textures require WebGL2');
    }
    
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.format = options.format || gl.RGBA;
    this.type = options.type || gl.UNSIGNED_BYTE;
    
    const gl2 = gl as WebGL2RenderingContext;
    this.internalFormat = options.internalFormat || this.format;

    const magFilter = options.filter || options.magFilter || gl.LINEAR;
    const minFilter = options.filter || options.minFilter || gl.LINEAR;

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create 3D texture');
    this.id = texture;

    gl.bindTexture(gl2.TEXTURE_3D, this.id);
    gl.texParameteri(gl2.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl2.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl2.TEXTURE_3D, gl.TEXTURE_WRAP_S, options.wrap || options.wrapS || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl2.TEXTURE_3D, gl.TEXTURE_WRAP_T, options.wrap || options.wrapT || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl2.TEXTURE_3D, gl2.TEXTURE_WRAP_R, options.wrap || options.wrapR || gl.CLAMP_TO_EDGE);
    
    gl2.texImage3D(gl2.TEXTURE_3D, 0, this.internalFormat, width, height, depth, 0, this.format, this.type, null);
  }

  bind(unit = 0) {
    const gl2 = this.gl as WebGL2RenderingContext;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(gl2.TEXTURE_3D, this.id);
  }

  unbind(unit = 0) {
    const gl2 = this.gl as WebGL2RenderingContext;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(gl2.TEXTURE_3D, null);
  }

  setData(data: ArrayBufferView | null) {
    const gl2 = this.gl as WebGL2RenderingContext;
    this.gl.bindTexture(gl2.TEXTURE_3D, this.id);
    gl2.texImage3D(gl2.TEXTURE_3D, 0, this.internalFormat, this.width, this.height, this.depth, 0, this.format, this.type, data);
  }

  destroy() {
    this.gl.deleteTexture(this.id);
  }

  static fromFloatArray(gl: GLContextExtended, data: Float32Array, width: number, height: number, depth: number): Texture3D {
    if (!gl.isWebGL2) {
      throw new Error('3D textures require WebGL2');
    }
    
    const gl2 = gl as WebGL2RenderingContext;
    const texture = new Texture3D(gl, width, height, depth, {
      type: gl.FLOAT,
      format: gl.RGBA,
      internalFormat: gl2.RGBA32F,
      filter: gl.hasFloatLinear ? gl.LINEAR : gl.NEAREST
    });
    
    texture.setData(data);
    return texture;
  }
}

/**
 * Texture Array for LOD systems (WebGL2 only)
 */
export class TextureArray {
  gl: GLContextExtended;
  id: WebGLTexture;
  width: number;
  height: number;
  layers: number;
  format: number;
  internalFormat: number;
  type: number;

  constructor(gl: GLContextExtended, width: number, height: number, layers: number, options: TextureOptions = {}) {
    if (!gl.isWebGL2) {
      throw new Error('Texture arrays require WebGL2');
    }
    
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.layers = layers;
    this.format = options.format || gl.RGBA;
    this.type = options.type || gl.UNSIGNED_BYTE;
    
    const gl2 = gl as WebGL2RenderingContext;
    this.internalFormat = options.internalFormat || this.format;

    const magFilter = options.filter || options.magFilter || gl.LINEAR;
    const minFilter = options.filter || options.minFilter || gl.LINEAR;

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture array');
    this.id = texture;

    gl.bindTexture(gl2.TEXTURE_2D_ARRAY, this.id);
    gl.texParameteri(gl2.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl2.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl2.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, options.wrap || options.wrapS || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl2.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, options.wrap || options.wrapT || gl.CLAMP_TO_EDGE);
    
    gl2.texImage3D(gl2.TEXTURE_2D_ARRAY, 0, this.internalFormat, width, height, layers, 0, this.format, this.type, null);
  }

  bind(unit = 0) {
    const gl2 = this.gl as WebGL2RenderingContext;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(gl2.TEXTURE_2D_ARRAY, this.id);
  }

  unbind(unit = 0) {
    const gl2 = this.gl as WebGL2RenderingContext;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(gl2.TEXTURE_2D_ARRAY, null);
  }

  setLayerData(layer: number, data: ArrayBufferView) {
    const gl2 = this.gl as WebGL2RenderingContext;
    this.gl.bindTexture(gl2.TEXTURE_2D_ARRAY, this.id);
    gl2.texSubImage3D(gl2.TEXTURE_2D_ARRAY, 0, 0, 0, layer, this.width, this.height, 1, this.format, this.type, data);
  }

  destroy() {
    this.gl.deleteTexture(this.id);
  }
}

/**
 * Multi-Render Target (MRT) framebuffer for WebGL2
 */
export class MultiRenderTarget {
  gl: GLContextExtended;
  framebuffer: WebGLFramebuffer;
  textures: Texture[];
  depthBuffer: WebGLRenderbuffer | null = null;
  width: number;
  height: number;

  constructor(gl: GLContextExtended, width: number, height: number, colorAttachments: number, options: TextureOptions = {}) {
    if (!gl.isWebGL2) {
      throw new Error('Multiple render targets require WebGL2');
    }
    
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.textures = [];
    
    const gl2 = gl as WebGL2RenderingContext;
    
    const fb = gl.createFramebuffer();
    if (!fb) throw new Error('Failed to create framebuffer');
    this.framebuffer = fb;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    
    const drawBuffers: number[] = [];
    
    for (let i = 0; i < colorAttachments; i++) {
      const texture = new Texture(gl, width, height, options);
      this.textures.push(texture);
      
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture.id, 0);
      drawBuffers.push(gl.COLOR_ATTACHMENT0 + i);
    }
    
    gl2.drawBuffers(drawBuffers);
    
    // Create depth buffer
    this.depthBuffer = gl.createRenderbuffer();
    if (this.depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
    }
    
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer not complete: ' + status);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.width, this.height);
  }

  unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  drawTo(callback: () => void) {
    const v = this.gl.getParameter(this.gl.VIEWPORT);
    this.bind();
    callback();
    this.unbind();
    this.gl.viewport(v[0], v[1], v[2], v[3]);
  }

  getTexture(index: number): Texture {
    return this.textures[index];
  }

  destroy() {
    for (const texture of this.textures) {
      texture.destroy();
    }
    if (this.depthBuffer) {
      this.gl.deleteRenderbuffer(this.depthBuffer);
    }
    this.gl.deleteFramebuffer(this.framebuffer);
  }
}
