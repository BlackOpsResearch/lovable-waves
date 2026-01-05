/**
 * Improved 3D Perlin Noise Generator
 * Used for volumetric cloud generation
 */

export class ImprovedNoise {
  private p: Uint8Array;

  constructor(seededRandom: () => number = Math.random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Fisher-Yates shuffle with seeded random
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    // Duplicate for overflow handling
    this.p = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[i] = this.p[i + 256] = p[i];
    }
  }

  noise(x: number, y: number, z: number): number {
    const p = this.p;
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);
    
    const aaa = p[p[p[xi] + yi] + zi];
    const aab = p[p[p[xi] + yi] + zi + 1];
    const aba = p[p[p[xi] + yi + 1] + zi];
    const abb = p[p[p[xi] + yi + 1] + zi + 1];
    const baa = p[p[p[xi + 1] + yi] + zi];
    const bab = p[p[p[xi + 1] + yi] + zi + 1];
    const bba = p[p[p[xi + 1] + yi + 1] + zi];
    const bbb = p[p[p[xi + 1] + yi + 1] + zi + 1];
    
    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(p[aaa], xf, yf, zf), this.grad(p[baa], xf - 1, yf, zf)),
        this.lerp(u, this.grad(p[aba], xf, yf - 1, zf), this.grad(p[bba], xf - 1, yf - 1, zf))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(p[aab], xf, yf, zf - 1), this.grad(p[bab], xf - 1, yf, zf - 1)),
        this.lerp(u, this.grad(p[abb], xf, yf - 1, zf - 1), this.grad(p[bbb], xf - 1, yf - 1, zf - 1))
      )
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

/**
 * Create a seeded random number generator
 */
export function createSeededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Fractional Brownian Motion for layered noise
 */
export function fbm(
  perlin: ImprovedNoise,
  x: number,
  y: number,
  z: number,
  octaves: number = 5,
  persistence: number = 0.5,
  lacunarity: number = 2.0
): number {
  let total = 0.0;
  let frequency = 1.0;
  let amplitude = 1.0;
  let maxValue = 0.0;

  for (let i = 0; i < octaves; i++) {
    total += perlin.noise(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

/**
 * Generate 3D noise texture for clouds
 */
export function generate3DNoiseTexture(
  size: number = 64,
  seed: number = 42,
  octaves: number = 5,
  persistence: number = 0.5,
  lacunarity: number = 2.0,
  scale: number = 3.5
): Float32Array {
  const data = new Float32Array(size * size * size);
  const random = createSeededRandom(seed);
  const perlin = new ImprovedNoise(random);
  
  let min = Infinity;
  let max = -Infinity;
  
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x / size) * scale;
        const ny = (y / size) * scale;
        const nz = (z / size) * scale;
        
        const value = fbm(perlin, nx, ny, nz, octaves, persistence, lacunarity);
        const index = x + y * size + z * size * size;
        data[index] = value;
        
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
  }
  
  // Normalize to 0-1
  const range = max - min;
  for (let i = 0; i < data.length; i++) {
    data[i] = (data[i] - min) / range;
  }
  
  return data;
}
