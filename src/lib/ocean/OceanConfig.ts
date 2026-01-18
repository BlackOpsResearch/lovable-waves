/**
 * Ocean Simulation Configuration
 * Centralized settings for hyperrealistic ocean rendering
 */

export interface WaveSettings {
  amplitude: number;       // Overall wave height (0.1 - 2.0)
  steepness: number;       // Gerstner Q factor (0.1 - 1.0)
  windDirection: number;   // Wind direction in degrees (0 - 360)
  windSpeed: number;       // Wind speed (affects wave frequency)
  choppiness: number;      // Horizontal displacement (0 - 1)
}

export interface AtmosphereSettings {
  turbidity: number;       // Atmospheric haziness (1 - 20)
  rayleigh: number;        // Rayleigh scattering coefficient (0 - 4)
  mieCoefficient: number;  // Mie scattering coefficient (0 - 0.1)
  mieDirectionalG: number; // Mie scattering direction (0 - 1)
  sunElevation: number;    // Sun angle above horizon (degrees)
  sunAzimuth: number;      // Sun horizontal angle (degrees)
}

export interface WaterMaterialSettings {
  shallowColor: [number, number, number];
  deepColor: [number, number, number];
  scatterColor: [number, number, number];
  underwaterColor: [number, number, number];
  underwaterFogDensity: number;
  foamIntensity: number;
  foamThreshold: number;
}

export interface CausticsSettings {
  enabled: boolean;
  intensity: number;
  scale: number;
  absorptionCoeff: number;
  dispersionStrength: number;
  resolution: 256 | 512 | 1024;
}

export interface PhysicsSettings {
  enabled: boolean;
  sphereRadius: number;
  gravity: number;
  buoyancy: number;
  drag: number;
  wakeStrength: number;
}

export interface LODSettings {
  enabled: boolean;
  nearDistance: number;
  farDistance: number;
  minDetail: number;
  maxDetail: number;
}

export interface OceanSettings {
  waves: WaveSettings;
  atmosphere: AtmosphereSettings;
  material: WaterMaterialSettings;
  caustics: CausticsSettings;
  physics: PhysicsSettings;
  lod: LODSettings;
  oceanScale: number;
  simulationResolution: 128 | 256 | 512;
}

// Default configuration for hyperrealistic ocean
export const DEFAULT_OCEAN_SETTINGS: OceanSettings = {
  waves: {
    amplitude: 0.3,
    steepness: 0.5,
    windDirection: 45,
    windSpeed: 1.0,
    choppiness: 0.5,
  },
  atmosphere: {
    turbidity: 2.0,
    rayleigh: 1.5,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    sunElevation: 45,
    sunAzimuth: 180,
  },
  material: {
    shallowColor: [0.0, 0.35, 0.45],
    deepColor: [0.0, 0.05, 0.15],
    scatterColor: [0.1, 0.5, 0.6],
    underwaterColor: [0.2, 0.5, 0.6],
    underwaterFogDensity: 0.05,
    foamIntensity: 0.8,
    foamThreshold: 0.3,
  },
  caustics: {
    enabled: true,
    intensity: 0.2,
    scale: 0.75,
    absorptionCoeff: 0.1,
    dispersionStrength: 0.0,
    resolution: 1024,
  },
  physics: {
    enabled: true,
    sphereRadius: 0.25,
    gravity: 4.0,
    buoyancy: 10.0,
    drag: 0.99,
    wakeStrength: 0.02,
  },
  lod: {
    enabled: true,
    nearDistance: 10,
    farDistance: 200,
    minDetail: 16,
    maxDetail: 200,
  },
  oceanScale: 2.0,
  simulationResolution: 256,
};

// Preset configurations
export const OCEAN_PRESETS = {
  calm: {
    ...DEFAULT_OCEAN_SETTINGS,
    waves: {
      amplitude: 0.1,
      steepness: 0.3,
      windDirection: 0,
      windSpeed: 0.5,
      choppiness: 0.2,
    },
  },
  moderate: DEFAULT_OCEAN_SETTINGS,
  stormy: {
    ...DEFAULT_OCEAN_SETTINGS,
    waves: {
      amplitude: 0.8,
      steepness: 0.8,
      windDirection: 225,
      windSpeed: 2.0,
      choppiness: 0.8,
    },
    atmosphere: {
      ...DEFAULT_OCEAN_SETTINGS.atmosphere,
      turbidity: 10,
      rayleigh: 0.5,
    },
  },
  sunset: {
    ...DEFAULT_OCEAN_SETTINGS,
    atmosphere: {
      ...DEFAULT_OCEAN_SETTINGS.atmosphere,
      sunElevation: 5,
      sunAzimuth: 270,
      turbidity: 4,
      rayleigh: 2,
      mieCoefficient: 0.02,
    },
  },
  tropical: {
    ...DEFAULT_OCEAN_SETTINGS,
    material: {
      shallowColor: [0.0, 0.55, 0.65],
      deepColor: [0.0, 0.15, 0.35],
      scatterColor: [0.2, 0.7, 0.8],
      underwaterColor: [0.1, 0.6, 0.7],
      underwaterFogDensity: 0.02,
      foamIntensity: 1.0,
      foamThreshold: 0.2,
    },
    atmosphere: {
      ...DEFAULT_OCEAN_SETTINGS.atmosphere,
      turbidity: 1.5,
      rayleigh: 2,
    },
  },
};

// Calculate sun position from elevation and azimuth
export function calculateSunPosition(elevation: number, azimuth: number): [number, number, number] {
  const elevRad = (elevation * Math.PI) / 180;
  const azimRad = (azimuth * Math.PI) / 180;
  
  const y = Math.sin(elevRad);
  const xz = Math.cos(elevRad);
  const x = xz * Math.sin(azimRad);
  const z = xz * Math.cos(azimRad);
  
  return [x, y, z];
}

export default {
  DEFAULT_OCEAN_SETTINGS,
  OCEAN_PRESETS,
  calculateSunPosition,
};
