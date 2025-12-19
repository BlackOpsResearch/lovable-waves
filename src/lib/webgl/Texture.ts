/**
 * WebGL Texture wrapper with render-to-texture support
 * Ported from Evan Wallace's lightgl.js
 */
import { GLContextExtended } from './GLContext';

export interface TextureOptions {
  format?: number;
  type?: number;
  filter?: number;
  magFilter?: number;
  minFilter?: number;
  wrap?: number;
  wrapS?: number;
  wrapT?: number;
}

let framebuffer: WebGLFramebuffer | null = null;
let renderbuffer: WebGLRenderbuffer | null = null;

export class Texture {
  gl: GLContextExtended;
  id: WebGLTexture;
  width: number;
  height: number;
  format: number;
  type: number;

  constructor(gl: GLContextExtended, width: number, height: number, options: TextureOptions = {}) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.format = options.format || gl.RGBA;
    this.type = options.type || gl.UNSIGNED_BYTE;

    const magFilter = options.filter || options.magFilter || gl.LINEAR;
    const minFilter = options.filter || options.minFilter || gl.LINEAR;

    if (this.type === gl.FLOAT) {
      if (!Texture.canUseFloatingPointTextures(gl)) {
        throw new Error('OES_texture_float is required but not supported');
      }
      if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
          !Texture.canUseFloatingPointLinearFiltering(gl)) {
        throw new Error('OES_texture_float_linear is required but not supported');
      }
    } else if (this.type === gl.HALF_FLOAT_OES) {
      if (!Texture.canUseHalfFloatingPointTextures(gl)) {
        throw new Error('OES_texture_half_float is required but not supported');
      }
      if ((minFilter !== gl.NEAREST || magFilter !== gl.NEAREST) &&
          !Texture.canUseHalfFloatingPointLinearFiltering(gl)) {
        throw new Error('OES_texture_half_float_linear is required but not supported');
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
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
  }

  bind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
  }

  unbind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
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

  static fromImage(gl: GLContextExtended, image: HTMLImageElement | HTMLCanvasElement, options: TextureOptions = {}): Texture {
    const texture = new Texture(gl, image.width, image.height, options);
    gl.texImage2D(gl.TEXTURE_2D, 0, texture.format, texture.format, texture.type, image);
    if (options.minFilter && options.minFilter !== gl.NEAREST && options.minFilter !== gl.LINEAR) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    return texture;
  }

  static canUseFloatingPointTextures(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_float');
  }

  static canUseFloatingPointLinearFiltering(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_float_linear');
  }

  static canUseHalfFloatingPointTextures(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_half_float');
  }

  static canUseHalfFloatingPointLinearFiltering(gl: GLContextExtended): boolean {
    return !!gl.getExtension('OES_texture_half_float_linear');
  }
}
