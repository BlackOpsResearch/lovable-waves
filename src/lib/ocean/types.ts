/**
 * Ocean Simulation Types
 * Complete type definitions for the oceanic simulation system
 */

export interface OceanSettings {
  // Ocean waves
  waves: {
    enabled: boolean;
    amplitude: number;
    frequency: number;
    speed: number;
    steepness: number; // Gerstner wave steepness (0-1)
    direction: [number, number]; // Primary wave direction
    numWaves: number; // Number of superimposed waves
    choppiness: number;
    foam: {
      enabled: boolean;
      threshold: number;
      intensity: number;
      decay: number;
    };
  };
  
  // Sphere interaction
  sphere: {
    enabled: boolean;
    radius: number;
    position: { x: number; y: number; z: number };
    physics: {
      buoyancy: number;
      drag: number;
      mass: number;
    };
  };
  
  // Sky & Atmosphere
  sky: {
    sunPosition: [number, number, number];
    sunIntensity: number;
    sunColor: [number, number, number];
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
    exposure: number;
  };
  
  // Volumetric Clouds
  clouds: {
    enabled: boolean;
    coverage: number;
    density: number;
    altitude: number;
    thickness: number;
    speed: [number, number, number];
    color: [number, number, number];
    shadowDensity: number;
    raymarchSteps: number;
    lightSteps: number;
  };
  
  // God Rays
  godRays: {
    enabled: boolean;
    density: number;
    decay: number;
    weight: number;
    exposure: number;
    samples: number;
  };
  
  // Underwater caustics
  caustics: {
    enabled: boolean;
    intensity: number;
    scale: number;
    speed: number;
  };
  
  // Fog / Atmosphere
  atmosphere: {
    fogEnabled: boolean;
    fogDensity: number;
    fogColor: [number, number, number];
    aerialPerspective: boolean;
    scatteringStrength: number;
  };
}

export const DEFAULT_OCEAN_SETTINGS: OceanSettings = {
  waves: {
    enabled: true,
    amplitude: 0.15,
    frequency: 1.5,
    speed: 1.0,
    steepness: 0.5,
    direction: [1, 0],
    numWaves: 8,
    choppiness: 1.0,
    foam: {
      enabled: true,
      threshold: 0.4,
      intensity: 1.0,
      decay: 0.95,
    },
  },
  sphere: {
    enabled: true,
    radius: 0.25,
    position: { x: 0, y: 0.5, z: 0 },
    physics: {
      buoyancy: 1.2,
      drag: 0.5,
      mass: 1.0,
    },
  },
  sky: {
    sunPosition: [50, 30, 50],
    sunIntensity: 1.0,
    sunColor: [1, 0.95, 0.8],
    turbidity: 2.0,
    rayleigh: 1.0,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    exposure: 0.5,
  },
  clouds: {
    enabled: true,
    coverage: 0.55,
    density: 50.0,
    altitude: 100,
    thickness: 60,
    speed: [0.02, 0, 0.01],
    color: [1, 1, 1],
    shadowDensity: 0.3,
    raymarchSteps: 44,
    lightSteps: 4,
  },
  godRays: {
    enabled: true,
    density: 0.96,
    decay: 0.95,
    weight: 0.5,
    exposure: 0.3,
    samples: 60,
  },
  caustics: {
    enabled: true,
    intensity: 1.0,
    scale: 0.75,
    speed: 1.0,
  },
  atmosphere: {
    fogEnabled: true,
    fogDensity: 0.015,
    fogColor: [0.7, 0.8, 0.9],
    aerialPerspective: true,
    scatteringStrength: 0.5,
  },
};
