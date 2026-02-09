/**
 * OPUS Spray Particle System (CPU-side)
 * Reference: docs/OPUS_GROUPS_5_8_COMPLETE.html §Group 7
 * 
 * Manages spray particles ejected from breaking waves and hull contact.
 * Particles are updated on CPU and rendered as GL_POINTS.
 */

export interface SprayParticle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
}

export interface SprayConfig {
  maxParticles: number;
  gravity: number;
  drag: number;
  minVY: number;
  lifetime: number;
}

const DEFAULT_SPRAY_CONFIG: SprayConfig = {
  maxParticles: 512,
  gravity: 9.81,
  drag: 0.5,
  minVY: 2.0,
  lifetime: 2.0,
};

export class SpraySystem {
  particles: SprayParticle[];
  config: SprayConfig;
  activeCount: number = 0;
  
  // Buffers for GPU upload
  positionData: Float32Array;
  velocityData: Float32Array;
  lifeData: Float32Array;
  sizeData: Float32Array;
  
  constructor(config: SprayConfig = DEFAULT_SPRAY_CONFIG) {
    this.config = config;
    this.particles = [];
    
    for (let i = 0; i < config.maxParticles; i++) {
      this.particles.push({
        x: 0, y: -100, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0,
        maxLife: config.lifetime,
        size: 1,
        active: false,
      });
    }
    
    this.positionData = new Float32Array(config.maxParticles * 3);
    this.velocityData = new Float32Array(config.maxParticles * 3);
    this.lifeData = new Float32Array(config.maxParticles);
    this.sizeData = new Float32Array(config.maxParticles);
  }
  
  /**
   * Emit spray particles from a world position
   */
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, count: number = 1) {
    for (let i = 0; i < count; i++) {
      const p = this.findInactive();
      if (!p) return;
      
      // Add randomness to velocity
      const spread = 0.3;
      p.x = x + (Math.random() - 0.5) * 0.5;
      p.y = y + Math.random() * 0.2;
      p.z = z + (Math.random() - 0.5) * 0.5;
      p.vx = vx + (Math.random() - 0.5) * spread * Math.abs(vx + 1);
      p.vy = Math.max(this.config.minVY, vy + Math.random() * 2);
      p.vz = vz + (Math.random() - 0.5) * spread * Math.abs(vz + 1);
      p.life = this.config.lifetime * (0.5 + Math.random() * 0.5);
      p.maxLife = p.life;
      p.size = 0.5 + Math.random() * 1.5;
      p.active = true;
    }
  }
  
  /**
   * Emit from sphere hull contact
   */
  emitFromHull(
    sphereX: number, sphereY: number, sphereZ: number,
    sphereVX: number, sphereVZ: number,
    sphereRadius: number, speed: number
  ) {
    if (speed < 0.3) return;
    
    // Spray count scales with speed
    const count = Math.min(8, Math.floor(speed * 3));
    
    // Emit at bow (front of sphere motion)
    const velLen = Math.sqrt(sphereVX * sphereVX + sphereVZ * sphereVZ);
    if (velLen < 0.001) return;
    
    const dirX = sphereVX / velLen;
    const dirZ = sphereVZ / velLen;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.6;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      
      const ejX = dirX * cosA - dirZ * sinA;
      const ejZ = dirX * sinA + dirZ * cosA;
      
      const rimX = sphereX + ejX * sphereRadius * 1.1;
      const rimZ = sphereZ + ejZ * sphereRadius * 1.1;
      
      this.emit(
        rimX, sphereY + sphereRadius * 0.5, rimZ,
        ejX * speed * 2, speed * 1.5, ejZ * speed * 2,
        1
      );
    }
  }
  
  /**
   * Emit from wave breaking at a world position
   */
  emitFromBreaking(x: number, z: number, steepness: number) {
    if (steepness < 0.4) return;
    const count = Math.min(4, Math.floor((steepness - 0.4) * 10));
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = steepness * 3;
      this.emit(
        x + (Math.random() - 0.5) * 2,
        0.1,
        z + (Math.random() - 0.5) * 2,
        Math.cos(angle) * speed,
        speed * 2,
        Math.sin(angle) * speed,
        1
      );
    }
  }
  
  /**
   * Update all particles
   */
  update(dt: number) {
    this.activeCount = 0;
    const g = this.config.gravity;
    const drag = this.config.drag;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      
      p.life -= dt;
      if (p.life <= 0 || p.y < -1) {
        p.active = false;
        p.y = -100;
        continue;
      }
      
      // Gravity
      p.vy -= g * dt;
      
      // Air drag
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
      if (speed > 0.01) {
        const dragForce = drag * speed * dt;
        p.vx -= p.vx / speed * dragForce;
        p.vy -= p.vy / speed * dragForce;
        p.vz -= p.vz / speed * dragForce;
      }
      
      // Integrate
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      
      // Pack into buffers
      const idx = this.activeCount;
      this.positionData[idx * 3] = p.x;
      this.positionData[idx * 3 + 1] = p.y;
      this.positionData[idx * 3 + 2] = p.z;
      this.velocityData[idx * 3] = p.vx;
      this.velocityData[idx * 3 + 1] = p.vy;
      this.velocityData[idx * 3 + 2] = p.vz;
      this.lifeData[idx] = p.life / p.maxLife;
      this.sizeData[idx] = p.size;
      
      this.activeCount++;
    }
  }
  
  private findInactive(): SprayParticle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    // Steal oldest
    let oldest = this.particles[0];
    for (const p of this.particles) {
      if (p.life < oldest.life) oldest = p;
    }
    return oldest;
  }
}
