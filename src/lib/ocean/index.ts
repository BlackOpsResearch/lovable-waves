/**
 * Ocean module exports
 */

export { OceanSimulation } from './OceanSimulation';
export { OceanRenderer } from './OceanRenderer';
export { HyperOceanRenderer } from './HyperOceanRenderer';
export { CloudRenderer, DEFAULT_CLOUD_SETTINGS } from './CloudRenderer';
export { DEFAULT_OCEAN_SETTINGS, OCEAN_PRESETS, calculateSunPosition } from './OceanConfig';
export type { OceanSettings, WaveSettings, AtmosphereSettings, WaterMaterialSettings, CausticsSettings, PhysicsSettings, LODSettings } from './OceanConfig';
export * from './types';
export * from './noise/ImprovedNoise';
