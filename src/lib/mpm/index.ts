/**
 * MLS-MPM Module Exports
 * Material Point Method simulation for realistic fluid dynamics
 */

export { MLSMPMSimulation, DEFAULT_MLSMPM_SETTINGS } from './MLSMPMSimulation';
export type { MLSMPMSettings } from './MLSMPMSimulation';

export { FluidRenderer, DEFAULT_FLUID_RENDER_SETTINGS } from './FluidRenderer';
export type { FluidRenderSettings } from './FluidRenderer';

// Re-export shader fragments for external use
export {
  PARTICLE_DEPTH_VERTEX,
  PARTICLE_DEPTH_FRAGMENT,
  NARROW_RANGE_FILTER_FRAGMENT,
  NORMAL_FROM_DEPTH_FRAGMENT,
  THICKNESS_FRAGMENT,
} from './MLSMPMSimulation';
