/**
 * OPUS Water Engine Configuration
 * Single source of truth for all simulation parameters
 * Reference: docs/OPUS_ORCHESTRATION.md §15
 */

export interface OpusHeightfieldConfig {
  resolution: number;
  worldSize: number;
  depth: number;
  gravity: number;
  damping: number;
}

export interface OpusSheetConfig {
  resolution: number;
  worldSize: number;
  breakRate: number;
  healRate: number;
  ascentThresh: number;
  healProx: number;
  waveStrainThresh: number;
  waveBreakRate: number;
  viscosity: number;
  damping: number;
  hfCoupling: number;
  hullStiffness: number;
  gravityY: number;
  pressureStiffness: number;
  waveBoostScale: number;
  envDilationRadius: number;
  barrierStiffness: number;
  slapDamping: number;
  minThick: number;
  maxThick: number;
  redistRate: number;
  thickScale: number;
  edgeScale: number;
  pressScale: number;
}

export interface OpusSprayConfig {
  max: number;
  lifetime: number;
  minVY: number;
  linkDead: number;
  minThick: number;
  gravity: number;
  drag: number;
}

export interface OpusFoamConfig {
  decay: number;
  advect: number;
  edgeGen: number;
}

export interface OpusRenderConfig {
  meshSegments: number;
  foamThresh: number;
  foamIntensity: number;
  specularPower: number;
  envReflection: number;
  sunDir: [number, number, number];
  sunColor: [number, number, number];
  deepColor: [number, number, number];
  shallowColor: [number, number, number];
}

export interface OpusConfig {
  hf: OpusHeightfieldConfig;
  sheet: OpusSheetConfig;
  spray: OpusSprayConfig;
  foam: OpusFoamConfig;
  render: OpusRenderConfig;
}

export const DEFAULT_OPUS_CONFIG: OpusConfig = {
  hf: {
    resolution: 512,
    worldSize: 200,
    depth: 20,
    gravity: 9.81,
    damping: 0.995,
  },
  sheet: {
    resolution: 128,
    worldSize: 50,
    breakRate: 5.0,
    healRate: 0.5,
    ascentThresh: 0.3,
    healProx: 0.2,
    waveStrainThresh: 0.6,
    waveBreakRate: 2.0,
    viscosity: 0.05,
    damping: 0.5,
    hfCoupling: 0.1,
    hullStiffness: 2000,
    gravityY: -9.81,
    pressureStiffness: 100.0,
    waveBoostScale: 0.5,
    envDilationRadius: 3,
    barrierStiffness: 500,
    slapDamping: 5.0,
    minThick: 0.05,
    maxThick: 2.0,
    redistRate: 0.02,
    thickScale: 1.0,
    edgeScale: 2.0,
    pressScale: 0.5,
  },
  spray: {
    max: 512,
    lifetime: 2.0,
    minVY: 2.0,
    linkDead: 0.1,
    minThick: 0.08,
    gravity: 9.81,
    drag: 0.5,
  },
  foam: {
    decay: 0.3,
    advect: 1.0,
    edgeGen: 2.0,
  },
  render: {
    meshSegments: 256,
    foamThresh: 0.35,
    foamIntensity: 0.7,
    specularPower: 256.0,
    envReflection: 0.6,
    sunDir: [0.5, 0.7, -0.5],
    sunColor: [1.0, 0.95, 0.8],
    deepColor: [0.005, 0.03, 0.08],
    shallowColor: [0.02, 0.18, 0.28],
  },
};
