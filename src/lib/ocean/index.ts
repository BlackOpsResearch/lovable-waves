/**
 * Ocean module exports
 */

export { OceanSimulation } from './OceanSimulation';
export { OceanRenderer } from './OceanRenderer';
export { HyperOceanRenderer, DEFAULT_INFINITE_OPTIONS } from './HyperOceanRenderer';
export type { InfiniteOceanOptions } from './HyperOceanRenderer';
export { CloudRenderer, DEFAULT_CLOUD_SETTINGS } from './CloudRenderer';
export { OceanMesh, createInfiniteOceanPlane, DEFAULT_OCEAN_MESH_SETTINGS } from './OceanMesh';
export type { LODRing, OceanMeshSettings } from './OceanMesh';
export { DEFAULT_OCEAN_SETTINGS, OCEAN_PRESETS, calculateSunPosition } from './OceanConfig';
export type { OceanSettings, WaveSettings, AtmosphereSettings, WaterMaterialSettings, CausticsSettings, PhysicsSettings, LODSettings } from './OceanConfig';
export * from './types';
export * from './noise/ImprovedNoise';
