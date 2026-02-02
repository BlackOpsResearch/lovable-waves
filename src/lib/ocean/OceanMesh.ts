/**
 * Infinite Ocean LOD Mesh System
 * Implements concentric ring geometry with camera-following and seamless LOD transitions
 * Based on the Encyclopedia of Ocean Simulation Vol II architecture
 */

import { GLContextExtended } from '../webgl/GLContext';
import { Mesh } from '../webgl/Mesh';

export interface LODRing {
  innerRadius: number;
  outerRadius: number;
  gridSize: number;
  waveLayerCount: number;
  mesh: Mesh | null;
  morphWeight: number;
}

export interface OceanMeshSettings {
  // LOD ring configuration
  rings: {
    innerRadius: number;
    outerRadius: number;
    gridSize: number;
    waveLayerCount: number;
  }[];
  
  // Center patch (highest detail)
  centerPatchSize: number;
  centerPatchDetail: number;
  
  // Horizon distance
  horizonDistance: number;
  
  // Morph settings
  morphDistance: number;
  enableMorphing: boolean;
}

export const DEFAULT_OCEAN_MESH_SETTINGS: OceanMeshSettings = {
  rings: [
    { innerRadius: 0, outerRadius: 50, gridSize: 256, waveLayerCount: 8 },
    { innerRadius: 50, outerRadius: 200, gridSize: 128, waveLayerCount: 6 },
    { innerRadius: 200, outerRadius: 500, gridSize: 64, waveLayerCount: 4 },
    { innerRadius: 500, outerRadius: 2000, gridSize: 32, waveLayerCount: 2 },
    { innerRadius: 2000, outerRadius: 10000, gridSize: 16, waveLayerCount: 1 },
  ],
  centerPatchSize: 4,
  centerPatchDetail: 256,
  horizonDistance: 10000,
  morphDistance: 20,
  enableMorphing: true,
};

/**
 * LOD Ocean Mesh Generator
 * Creates concentric ring meshes around the camera with varying detail levels
 */
export class OceanMesh {
  gl: GLContextExtended;
  settings: OceanMeshSettings;
  rings: LODRing[] = [];
  centerPatch: Mesh | null = null;
  
  // Camera tracking
  lastCameraX: number = 0;
  lastCameraZ: number = 0;
  tileOffset: { x: number; z: number } = { x: 0, z: 0 };
  
  constructor(gl: GLContextExtended, settings: OceanMeshSettings = DEFAULT_OCEAN_MESH_SETTINGS) {
    this.gl = gl;
    this.settings = settings;
    
    this.createMeshes();
  }
  
  private createMeshes() {
    // Create center patch (highest detail, follows camera exactly)
    this.centerPatch = this.createPlaneMesh(
      this.settings.centerPatchSize,
      this.settings.centerPatchDetail
    );
    
    // Create concentric rings
    for (const ringConfig of this.settings.rings) {
      const ring: LODRing = {
        innerRadius: ringConfig.innerRadius,
        outerRadius: ringConfig.outerRadius,
        gridSize: ringConfig.gridSize,
        waveLayerCount: ringConfig.waveLayerCount,
        mesh: this.createRingMesh(
          ringConfig.innerRadius,
          ringConfig.outerRadius,
          ringConfig.gridSize
        ),
        morphWeight: 0,
      };
      this.rings.push(ring);
    }
  }
  
  /**
   * Create a simple plane mesh centered at origin
   */
  private createPlaneMesh(size: number, detail: number): Mesh {
    const mesh = new Mesh(this.gl, { coords: true, normals: true });
    const halfSize = size / 2;
    
    for (let y = 0; y <= detail; y++) {
      const t = y / detail;
      for (let x = 0; x <= detail; x++) {
        const s = x / detail;
        
        // Position (XZ plane, Y is up)
        const px = (s * 2 - 1) * halfSize;
        const pz = (t * 2 - 1) * halfSize;
        
        mesh.vertices.push([px, 0, pz]);
        if (mesh.coords) mesh.coords.push([s, t]);
        if (mesh.normals) mesh.normals.push([0, 1, 0]);
        
        if (x < detail && y < detail) {
          const i = x + y * (detail + 1);
          if (mesh.triangles) {
            mesh.triangles.push([i, i + detail + 1, i + 1]);
            mesh.triangles.push([i + 1, i + detail + 1, i + detail + 2]);
          }
        }
      }
    }
    
    mesh.compile();
    return mesh;
  }
  
  /**
   * Create a ring mesh (donut shape) for LOD rings
   */
  private createRingMesh(innerRadius: number, outerRadius: number, segments: number): Mesh {
    const mesh = new Mesh(this.gl, { coords: true, normals: true });
    
    // Use radial segments for the ring
    const radialSegments = Math.max(32, segments);
    const concentricSegments = Math.max(8, Math.floor(segments / 4));
    
    for (let r = 0; r <= concentricSegments; r++) {
      const radiusFactor = r / concentricSegments;
      const radius = innerRadius + (outerRadius - innerRadius) * radiusFactor;
      
      for (let a = 0; a <= radialSegments; a++) {
        const angle = (a / radialSegments) * Math.PI * 2;
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // UV based on angle and radius
        const u = a / radialSegments;
        const v = radiusFactor;
        
        mesh.vertices.push([x, 0, z]);
        if (mesh.coords) mesh.coords.push([u, v]);
        if (mesh.normals) mesh.normals.push([0, 1, 0]);
        
        if (r < concentricSegments && a < radialSegments) {
          const i = a + r * (radialSegments + 1);
          const nextRow = radialSegments + 1;
          
          if (mesh.triangles) {
            mesh.triangles.push([i, i + nextRow, i + 1]);
            mesh.triangles.push([i + 1, i + nextRow, i + nextRow + 1]);
          }
        }
      }
    }
    
    mesh.compile();
    return mesh;
  }
  
  /**
   * Update mesh positions to follow camera
   * Uses tile-based snapping to prevent visible popping
   */
  updateCameraPosition(cameraX: number, cameraZ: number) {
    // Snap to tile grid to prevent texture swimming
    const tileSize = this.settings.centerPatchSize;
    
    this.tileOffset.x = Math.floor(cameraX / tileSize) * tileSize;
    this.tileOffset.z = Math.floor(cameraZ / tileSize) * tileSize;
    
    this.lastCameraX = cameraX;
    this.lastCameraZ = cameraZ;
  }
  
  /**
   * Calculate LOD factor for a given distance from camera
   */
  getLODFactor(distance: number): number {
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (distance >= ring.innerRadius && distance < ring.outerRadius) {
        // Smooth transition within ring
        const ringSpan = ring.outerRadius - ring.innerRadius;
        const distInRing = distance - ring.innerRadius;
        const baseLOD = 1 - (i / this.rings.length);
        const nextLOD = 1 - ((i + 1) / this.rings.length);
        return baseLOD - (baseLOD - nextLOD) * (distInRing / ringSpan);
      }
    }
    return 0.1; // Minimum LOD for very distant water
  }
  
  /**
   * Get wave layer count for a given distance
   */
  getWaveLayerCount(distance: number): number {
    for (const ring of this.rings) {
      if (distance >= ring.innerRadius && distance < ring.outerRadius) {
        return ring.waveLayerCount;
      }
    }
    return 1;
  }
  
  /**
   * Calculate morph weight for smooth LOD transitions
   */
  getMorphWeight(distance: number): number {
    if (!this.settings.enableMorphing) return 0;
    
    for (const ring of this.rings) {
      const morphStart = ring.outerRadius - this.settings.morphDistance;
      if (distance >= morphStart && distance < ring.outerRadius) {
        return (distance - morphStart) / this.settings.morphDistance;
      }
    }
    return 0;
  }
  
  /**
   * Get all meshes with their transforms for rendering
   */
  getMeshesForRendering(): { mesh: Mesh; offsetX: number; offsetZ: number; lodLevel: number }[] {
    const meshes: { mesh: Mesh; offsetX: number; offsetZ: number; lodLevel: number }[] = [];
    
    // Center patch
    if (this.centerPatch) {
      meshes.push({
        mesh: this.centerPatch,
        offsetX: this.tileOffset.x,
        offsetZ: this.tileOffset.z,
        lodLevel: 0,
      });
    }
    
    // LOD rings
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (ring.mesh) {
        meshes.push({
          mesh: ring.mesh,
          offsetX: this.tileOffset.x,
          offsetZ: this.tileOffset.z,
          lodLevel: i + 1,
        });
      }
    }
    
    return meshes;
  }
  
  /**
   * Get GLSL code for LOD-aware Gerstner wave calculation
   */
  static getLODWaveShader(): string {
    return /* glsl */ `
      // LOD-aware wave calculation uniforms
      uniform float uCameraDistance;
      uniform int uMaxWaveLayers;
      uniform float uLODFactor;
      uniform float uMorphWeight;
      
      // Get number of wave layers based on LOD
      int getWaveLayerCount(float distance) {
        if (distance < 50.0) return 8;
        if (distance < 200.0) return 6;
        if (distance < 500.0) return 4;
        if (distance < 2000.0) return 2;
        return 1;
      }
      
      // LOD-aware displacement
      vec3 getDisplacementLOD(vec2 worldPos, float time, float amplitude, float steepness, float windDir, float distance) {
        float lodFactor = 1.0 - smoothstep(0.0, 2000.0, distance);
        int waveLayers = getWaveLayerCount(distance);
        
        // Use reduced wave calculation at distance
        vec4 gerstner = calculateGerstnerWavesLOD(worldPos, time, amplitude, steepness, windDir, lodFactor);
        
        return gerstner.xyz;
      }
    `;
  }
  
  destroy() {
    // Meshes don't need explicit destruction in our wrapper
    this.rings = [];
    this.centerPatch = null;
  }
}

/**
 * Create an infinite ocean plane mesh (single high-detail quad)
 * For use when LOD rings are not needed
 */
export function createInfiniteOceanPlane(gl: GLContextExtended, detail: number = 256): Mesh {
  const mesh = new Mesh(gl, { coords: true, normals: true });
  const size = 2.0; // Normalized to -1 to 1
  
  for (let y = 0; y <= detail; y++) {
    const t = y / detail;
    for (let x = 0; x <= detail; x++) {
      const s = x / detail;
      
      // Position in XZ plane
      mesh.vertices.push([s * 2 - 1, 0, t * 2 - 1]);
      if (mesh.coords) mesh.coords.push([s, t]);
      if (mesh.normals) mesh.normals.push([0, 1, 0]);
      
      if (x < detail && y < detail) {
        const i = x + y * (detail + 1);
        if (mesh.triangles) {
          mesh.triangles.push([i, i + detail + 1, i + 1]);
          mesh.triangles.push([i + 1, i + detail + 1, i + detail + 2]);
        }
      }
    }
  }
  
  mesh.compile();
  return mesh;
}

export default OceanMesh;
