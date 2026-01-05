# VOLUMETRIC CLOUDS & GOD RAYS MONOLITH COMPLETE - ALL CODE EMBEDDED

**Date:** 2025-01-27
**Status:** ✅ COMPLETE - All source code embedded, no placeholders
**Original Source Location:** `Documentation/appexamples/water-showcase-unified/src/engines/volumetric-clouds/`
**Purpose:** Complete self-contained reference with ALL code embedded for volumetric clouds and god rays effects systems

---

## ⚠️ CRITICAL: ORIGINAL FILE STRUCTURE & LOCATIONS

**TO PREVENT FILE LOSS - THIS SECTION DOCUMENTS EXACT FILE STRUCTURE:**

### Original Source Directory Structure

The files in this monolith were extracted from:
**`Documentation/appexamples/water-showcase-unified/src/engines/volumetric-clouds/`**

Complete directory tree:
```
📁 volumetric-clouds/
  📁 components/
    📄 VolumetricClouds.tsx
    📄 CloudVolume.tsx
    📄 GodRays.tsx
    📄 index.ts
  📁 hooks/
    📄 useCloudTexture.ts
    📄 useCloudMask.ts
    📄 useCloudAnimation.ts
    📄 useGodRays.ts
  📁 shaders/
    📄 cloudShaders.ts
    📄 godRaysShaders.ts
    📄 index.ts
  📁 utils/
    📁 noise/
      📄 ImprovedNoise.ts
      📄 createSeededRandom.ts
      📄 fbm.ts
    📁 mask/
      📄 VolumetricMaskController.ts
      📄 createNoiseGeneratorFromPermutation.ts
    📄 bake3DTexture.ts
    📄 settingsConverter.ts
  📄 types.ts
  📄 presets.ts
  📄 index.ts
```

### File Mapping (Path → Monolith Section)

| Original File Path | Monolith Section | Lines |
|-------------------|------------------|-------|
| `components/VolumetricClouds.tsx` | [components/VolumetricClouds.tsx](#components-volumetriccloudstsx) | ~195 |
| `components/CloudVolume.tsx` | [components/CloudVolume.tsx](#components-cloudvolumetsx) | ~150 |
| `components/GodRays.tsx` | [components/GodRays.tsx](#components-godraystsx) | ~80 |
| `components/index.ts` | [components/index.ts](#components-indexts) | ~10 |
| `hooks/useCloudTexture.ts` | [hooks/useCloudTexture.ts](#hooks-usecloudtexturets) | ~80 |
| `hooks/useCloudMask.ts` | [hooks/useCloudMask.ts](#hooks-usecloudmaskts) | ~75 |
| `hooks/useCloudAnimation.ts` | [hooks/useCloudAnimation.ts](#hooks-usecloudanimationts) | ~50 |
| `hooks/useGodRays.ts` | [hooks/useGodRays.ts](#hooks-usegodraysts) | ~120 |
| `shaders/cloudShaders.ts` | [shaders/cloudShaders.ts](#shaders-cloudshadersts) | ~400 |
| `shaders/godRaysShaders.ts` | [shaders/godRaysShaders.ts](#shaders-godraysshadersts) | ~200 |
| `shaders/index.ts` | [shaders/index.ts](#shaders-indexts) | ~10 |
| `utils/noise/ImprovedNoise.ts` | [utils/noise/ImprovedNoise.ts](#utils-noise-improvednoisets) | ~150 |
| `utils/noise/createSeededRandom.ts` | [utils/noise/createSeededRandom.ts](#utils-noise-createseededrandomts) | ~30 |
| `utils/noise/fbm.ts` | [utils/noise/fbm.ts](#utils-noise-fbmts) | ~40 |
| `utils/mask/VolumetricMaskController.ts` | [utils/mask/VolumetricMaskController.ts](#utils-mask-volumetricmaskcontrollerts) | ~300 |
| `utils/mask/createNoiseGeneratorFromPermutation.ts` | [utils/mask/createNoiseGeneratorFromPermutation.ts](#utils-mask-createnoisegeneratorfrompermutationts) | ~100 |
| `utils/bake3DTexture.ts` | [utils/bake3DTexture.ts](#utils-bake3dtexturets) | ~250 |
| `utils/settingsConverter.ts` | [utils/settingsConverter.ts](#utils-settingsconverterts) | ~100 |
| `types.ts` | [types.ts](#typests) | ~130 |
| `presets.ts` | [presets.ts](#presetsts) | ~150 |
| `index.ts` | [index.ts](#indexts) | ~30 |

**Total Files:** 21
**Total Size:** ~75 KB
**All files are embedded with COMPLETE code below**

---

## ⚠️ CRITICAL: CORRECT DEFAULT SETTINGS

**These defaults MUST be used when settings are not provided (from working standalone app):**

```typescript
{
  enabled: true,  // CRITICAL: Must default to true!
  quality: 'medium',
  
  // Texture Generation
  textureSize: 96,
  cloudCoverage: 0.55,
  cloudSoftness: 0.05,
  noiseScale: 3.5,
  octaves: 5,
  persistence: 0.5,
  lacunarity: 3.0,
  noiseIntensity: 1.0,
  seed: Math.random() * 1000.0,
  
  // Cloud Shape (Mask)
  maskRadius: 1.0,
  maskSoftness: 0.5,
  flattenTop: 0.0,
  flattenBottom: 0.0,
  flattenXpos: 0.0,
  flattenXneg: 0.0,
  flattenZpos: 0.0,
  flattenZneg: 0.0,
  noiseStrength: 0.1,
  noiseFrequency: 1.0,
  detailNoiseStrength: 0.05,
  detailNoiseFrequency: 2.0,
  
  // Rendering - CRITICAL VALUES!
  textureTiling: 2.0,
  densityThreshold: 0.0,      // NOT 0.1!
  densityMultiplier: 50.0,    // NOT 1.0!
  opacity: 6.0,               // NOT 1.0!
  raymarchSteps: 44,          // NOT 64!
  lightSteps: 1,              // NOT 8!
  containerScale: 120.0,      // NOT 1.0! (CRITICAL!)
  
  // Animation
  isAnimating: true,
  animationSpeedX: 0.02,      // NOT 0.1!
  animationSpeedY: 0.0,
  animationSpeedZ: 0.01,      // NOT 0.1!
  
  // God Rays
  godRays: {
    enabled: false,
    density: 0.96,
    decay: 0.95,
    weight: 0.5,
    exposure: 0.6,
    samples: 100,
  },
}
```

**Source:** `Documentation/appexamples/volumetric-clouds/index.html` lines 437-470

---

## ⚠️ CRITICAL: This file contains COMPLETE source code

**ALL code is embedded below - no placeholders, no ellipsis, no missing code.**

This monolith can be used by AI systems to rebuild the entire volumetric clouds system.

---

## Table of Contents

1. [components/VolumetricClouds.tsx](#components-volumetriccloudstsx)
2. [components/CloudVolume.tsx](#components-cloudvolumetsx)
3. [components/GodRays.tsx](#components-godraystsx)
4. [hooks/useCloudTexture.ts](#hooks-usecloudtexturets)
5. [hooks/useCloudMask.ts](#hooks-usecloudmaskts)
6. [hooks/useCloudAnimation.ts](#hooks-usecloudanimationts)
7. [hooks/useGodRays.ts](#hooks-usegodraysts)
8. [shaders/cloudShaders.ts](#shaders-cloudshadersts)
9. [shaders/godRaysShaders.ts](#shaders-godraysshadersts)
10. [types.ts](#typests)
11. [utils/noise/ImprovedNoise.ts](#utils-noise-improvednoisets)
12. [utils/noise/createSeededRandom.ts](#utils-noise-createseededrandomts)
13. [utils/noise/fbm.ts](#utils-noise-fbmts)
14. [utils/mask/VolumetricMaskController.ts](#utils-mask-volumetricmaskcontrollerts)
15. [utils/mask/createNoiseGeneratorFromPermutation.ts](#utils-mask-createnoisegeneratorfrompermutationts)
16. [utils/bake3DTexture.ts](#utils-bake3dtexturets)
17. [utils/settingsConverter.ts](#utils-settingsconverterts)
18. [presets.ts](#presetsts)
19. [index.ts](#indexts)
20. [components/index.ts](#components-indexts)
21. [shaders/index.ts](#shaders-indexts)

---

## components/VolumetricClouds.tsx

**Location:** `src/engines/volumetric-clouds/components/VolumetricClouds.tsx`

```typescript
/**
 * Volumetric Clouds Main Component
 * Orchestrates the entire volumetric cloud rendering system
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CloudVolume } from './CloudVolume';
import { GodRays } from './GodRays';
import { useCloudTexture } from '../hooks/useCloudTexture';
import { useCloudMask } from '../hooks/useCloudMask';
import { useCloudAnimation } from '../hooks/useCloudAnimation';
import { useGodRays as useGodRaysHook } from '../hooks/useGodRays';
import { VolumetricCloudsSettings } from '../types';
import { TextureLoader } from 'three';

interface VolumetricCloudsProps {
  settings: VolumetricCloudsSettings;
  sunPosition?: THREE.Vector3;
  sunColor?: THREE.Color;
  sunIntensity?: number;
  ambientColor?: THREE.Color;
  ambientIntensity?: number;
  depthTexture?: THREE.DepthTexture | null;
}

export function VolumetricClouds({
  settings,
  sunPosition = new THREE.Vector3(1, 1, 1).normalize(),
  sunColor = new THREE.Color(0xffffff),
  sunIntensity = 1.0,
  ambientColor = new THREE.Color(0xffffff),
  ambientIntensity = 0.3,
  depthTexture = null,
}: VolumetricCloudsProps) {
  const { size, camera } = useThree();
  const [blueNoise, setBlueNoise] = useState<THREE.Texture | null>(null);
  const textureOffsetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Load blue noise texture
  useEffect(() => {
    const loader = new TextureLoader();
    // Load from public assets
    loader.load(
      '/assets/HDR_L_0.png',
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        setBlueNoise(texture);
      },
      undefined,
      (error) => {
        console.warn('Failed to load blue noise texture:', error);
        // Create a fallback blue noise texture (simple random pattern)
        const size = 256;
        const data = new Uint8Array(size * size);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 255;
        }
        const fallbackTexture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
        fallbackTexture.wrapS = THREE.RepeatWrapping;
        fallbackTexture.wrapT = THREE.RepeatWrapping;
        fallbackTexture.minFilter = THREE.NearestFilter;
        fallbackTexture.magFilter = THREE.NearestFilter;
        setBlueNoise(fallbackTexture);
      }
    );
  }, []);

  // Generate cloud texture
  const { texture: volumeTexture, isLoading: isTextureLoading } = useCloudTexture({
    textureSize: settings.textureSize,
    cloudCoverage: settings.cloudCoverage,
    cloudSoftness: settings.cloudSoftness,
    noiseScale: settings.noiseScale,
    octaves: settings.octaves,
    persistence: settings.persistence,
    lacunarity: settings.lacunarity,
    noiseIntensity: settings.noiseIntensity,
    seed: settings.seed,
  });

  // Setup mask controller
  const { maskUniforms } = useCloudMask({
    seed: settings.seed,
    raio: settings.maskRadius,
    achatamentoCima: settings.flattenTop,
    achatamentoBaixo: settings.flattenBottom,
    achatamentoXpos: settings.flattenXpos,
    achatamentoXneg: settings.flattenXneg,
    achatamentoZpos: settings.flattenZpos,
    achatamentoZneg: settings.flattenZneg,
    maskSoftness: settings.maskSoftness,
    forcaRuido: settings.noiseStrength,
    frequenciaRuido: settings.noiseFrequency,
    seedDetalhe: settings.seed + 10, // Offset detail seed
    forcaRuidoDetalhe: settings.detailNoiseStrength,
    frequenciaRuidoDetalhe: settings.detailNoiseFrequency,
    visualizeMask: false,
  });

  // Animate texture offset
  useCloudAnimation(
    {
      isAnimating: settings.isAnimating,
      speedX: settings.animationSpeedX,
      speedY: settings.animationSpeedY,
      speedZ: settings.animationSpeedZ,
    },
    textureOffsetRef
  );

  // Calculate light direction (normalized)
  const lightDir = useMemo(() => sunPosition.clone().normalize(), [sunPosition]);

  // Calculate sun screen position for god rays
  const sunScreenPosition = useRef(new THREE.Vector2());
  useFrame(() => {
    if (settings.godRays.enabled) {
      const sunWorldPos = sunPosition.clone().multiplyScalar(9000);
      const sunScreenPos = sunWorldPos.clone().project(camera);
      sunScreenPosition.current.set(sunScreenPos.x, sunScreenPos.y);
    }
  });

  // God rays setup
  const { occlusionRenderTarget } = useGodRaysHook(settings.godRays, { x: size.width, y: size.height });

  // Debug logging
  useEffect(() => {
    console.log('☁️ VolumetricClouds render state:', {
      enabled: settings.enabled,
      isTextureLoading,
      hasVolumeTexture: !!volumeTexture,
      hasBlueNoise: !!blueNoise,
      progress: isTextureLoading ? 'generating...' : 'ready',
    });
  }, [settings.enabled, isTextureLoading, volumeTexture, blueNoise]);

  // Don't render if disabled
  if (!settings.enabled) {
    return null;
  }

  // Show loading state while textures are loading
  if (isTextureLoading || !volumeTexture || !blueNoise) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="orange" transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <>
      {/* Main cloud volume */}
      <CloudVolume
        volumeTexture={volumeTexture}
        blueNoise={blueNoise}
        depthTexture={depthTexture}
        maskUniforms={maskUniforms}
        textureTiling={settings.textureTiling}
        textureOffset={textureOffsetRef.current}
        densityThreshold={settings.densityThreshold}
        densityMultiplier={settings.densityMultiplier}
        opacity={settings.opacity}
        raymarchSteps={settings.raymarchSteps}
        lightSteps={settings.lightSteps}
        containerScale={settings.containerScale}
        occlusionMode={false}
        sunColor={sunColor}
        sunIntensity={sunIntensity}
        lightDir={lightDir}
        ambientColor={ambientColor}
        ambientIntensity={ambientIntensity}
      />

      {/* God rays (will be rendered as post-process in engine) */}
      {settings.godRays.enabled && occlusionRenderTarget && (
        <GodRays
          settings={settings.godRays}
          occlusionTexture={occlusionRenderTarget.texture}
          lightScreenPosition={sunScreenPosition.current}
          sunColor={sunColor}
        />
      )}
    </>
  );
}


```

---

## components/CloudVolume.tsx

**Location:** `src/engines/volumetric-clouds/components/CloudVolume.tsx`

```typescript
/**
 * Cloud Volume Component
 * Renders the volumetric cloud mesh using ray marching
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VOLUMETRIC_CLOUD_VERTEX_SHADER, VOLUMETRIC_CLOUD_FRAGMENT_SHADER } from '../shaders/cloudShaders';
import { VolumetricCloudUniforms } from '../types';
import { VolumetricMaskUniforms } from '../utils/mask/VolumetricMaskController';

interface CloudVolumeProps {
  // Texture
  volumeTexture: THREE.Data3DTexture | null;
  blueNoise: THREE.Texture | null;
  depthTexture: THREE.DepthTexture | null;

  // Mask uniforms
  maskUniforms: VolumetricMaskUniforms;

  // Settings
  textureTiling: number;
  textureOffset: THREE.Vector3;
  densityThreshold: number;
  densityMultiplier: number;
  opacity: number;
  raymarchSteps: number;
  lightSteps: number;
  containerScale: number;
  occlusionMode?: boolean;

  // Scene references
  sunColor: THREE.Color;
  sunIntensity: number;
  lightDir: THREE.Vector3;
  ambientColor: THREE.Color;
  ambientIntensity: number;
}

export function CloudVolume({
  volumeTexture,
  blueNoise,
  depthTexture,
  maskUniforms,
  textureTiling,
  textureOffset,
  densityThreshold,
  densityMultiplier,
  opacity,
  raymarchSteps,
  lightSteps,
  containerScale,
  occlusionMode = false,
  sunColor,
  sunIntensity,
  lightDir,
  ambientColor,
  ambientIntensity,
}: CloudVolumeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const { camera, size } = useThree();

  // Create shader material
  const material = useMemo(() => {
    if (!blueNoise) return null;

    const uniforms: VolumetricCloudUniforms = {
      // Mask uniforms
      ...maskUniforms,

      // Textures
      uVolumeTexture: { value: volumeTexture },
      uBlueNoise: { value: blueNoise },
      uDepthTexture: { value: depthTexture },

      // Blue noise size
      uBlueNoiseSize: {
        value: new THREE.Vector2(blueNoise.image?.width || 256, blueNoise.image?.height || 256),
      },

      // Resolution
      uResolution: { value: new THREE.Vector2(size.width, size.height) },

      // Camera
      cameraPos: { value: camera.position },
      uProjectionMatrixInverse: { value: camera.projectionMatrixInverse },
      uViewMatrixInverse: { value: camera.matrixWorld },
      uModelMatrix: { value: new THREE.Matrix4() },
      uCameraNear: { value: camera.near },
      uCameraFar: { value: camera.far },
      uProjectionMatrix: { value: camera.projectionMatrix },

      // Lighting
      uSunColor: { value: sunColor },
      uSunIntensity: { value: sunIntensity },
      uLightDir: { value: lightDir },
      uAmbientColor: { value: ambientColor },
      uAmbientIntensity: { value: ambientIntensity },

      // Cloud parameters
      uOpacity: { value: opacity },
      uMaxSteps: { value: raymarchSteps },
      uLightSteps: { value: lightSteps },
      uDensityThreshold: { value: densityThreshold },
      uDensityMultiplier: { value: densityMultiplier },
      uTextureOffset: { value: textureOffset },
      uTextureTiling: { value: textureTiling },
      uOcclusionMode: { value: occlusionMode },
      uContainerScale: { value: containerScale },
    };

    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms,
      vertexShader: VOLUMETRIC_CLOUD_VERTEX_SHADER,
      fragmentShader: VOLUMETRIC_CLOUD_FRAGMENT_SHADER,
      side: THREE.BackSide, // Render the inside of the box
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    materialRef.current = mat;
    return mat;
  }, [
    maskUniforms,
    blueNoise,
    volumeTexture,
    depthTexture,
    sunColor,
    sunIntensity,
    lightDir,
    ambientColor,
    ambientIntensity,
    opacity,
    raymarchSteps,
    lightSteps,
    densityThreshold,
    densityMultiplier,
    textureTiling,
    containerScale,
    camera,
    size,
  ]);

  // Update uniforms every frame
  useFrame(() => {
    if (!materialRef.current || !meshRef.current) return;

    const mat = materialRef.current;
    const mesh = meshRef.current;

    // Update camera-dependent uniforms
    mat.uniforms.cameraPos.value.copy(camera.position);
    mat.uniforms.uProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
    mat.uniforms.uViewMatrixInverse.value.copy(camera.matrixWorld);
    mat.uniforms.uModelMatrix.value.copy(mesh.matrixWorld);
    mat.uniforms.uProjectionMatrix.value.copy(camera.projectionMatrix);

    // Update texture offset (animation)
    mat.uniforms.uTextureOffset.value.copy(textureOffset);

    // Update resolution
    mat.uniforms.uResolution.value.set(size.width, size.height);

    // Update occlusion mode
    mat.uniforms.uOcclusionMode.value = occlusionMode;
  });

  // Update texture when it changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uVolumeTexture.value = volumeTexture;
    }
  }, [volumeTexture]);

  // Update depth texture when it changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uDepthTexture.value = depthTexture;
    }
  }, [depthTexture]);

  if (!material) return null;

  return (
    <mesh ref={meshRef} material={material} scale={containerScale}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
}


```

---

## components/GodRays.tsx

**Location:** `src/engines/volumetric-clouds/components/GodRays.tsx`

```typescript
/**
 * God Rays Post-Processing Component
 * Renders crepuscular rays (light shafts) from the sun
 */

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GOD_RAYS_VERTEX_SHADER, GOD_RAYS_FRAGMENT_SHADER } from '../shaders/godRaysShaders';
import { GodRaysSettings } from '../types';

interface GodRaysProps {
  settings: GodRaysSettings;
  occlusionTexture: THREE.Texture | null;
  lightScreenPosition: THREE.Vector2;
  sunColor: THREE.Color;
}

export function GodRays({ settings, occlusionTexture, lightScreenPosition, sunColor }: GodRaysProps) {
  const quadRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Create god rays material
  const material = useMemo(() => {
    if (!settings.enabled || !occlusionTexture) return null;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: occlusionTexture },
        lightPosition: { value: lightScreenPosition },
        sunColor: { value: sunColor },
        density: { value: settings.density },
        decay: { value: settings.decay },
        weight: { value: settings.weight },
        exposure: { value: settings.exposure },
        samples: { value: settings.samples },
      },
      vertexShader: GOD_RAYS_VERTEX_SHADER,
      fragmentShader: GOD_RAYS_FRAGMENT_SHADER,
    });

    materialRef.current = mat;
    return mat;
  }, [
    settings.enabled,
    settings.density,
    settings.decay,
    settings.weight,
    settings.exposure,
    settings.samples,
    occlusionTexture,
    lightScreenPosition,
    sunColor,
  ]);

  // Update uniforms when settings change
  useEffect(() => {
    if (!materialRef.current) return;

    materialRef.current.uniforms.density.value = settings.density;
    materialRef.current.uniforms.decay.value = settings.decay;
    materialRef.current.uniforms.weight.value = settings.weight;
    materialRef.current.uniforms.exposure.value = settings.exposure;
    materialRef.current.uniforms.samples.value = settings.samples;
  }, [
    settings.density,
    settings.decay,
    settings.weight,
    settings.exposure,
    settings.samples,
  ]);

  // Update light position
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.lightPosition.value.copy(lightScreenPosition);
    }
  }, [lightScreenPosition]);

  // Update occlusion texture
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.tDiffuse.value = occlusionTexture;
    }
  }, [occlusionTexture]);

  if (!material || !settings.enabled) return null;

  return (
    <mesh ref={quadRef} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}


```

---

## hooks/useCloudTexture.ts

**Location:** `src/engines/volumetric-clouds/hooks/useCloudTexture.ts`

```typescript
/**
 * Hook for managing 3D cloud texture generation
 * Handles texture baking with progress tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { bake3DTexture, TextureBakeParameters, TextureBakeProgress } from '../utils/bake3DTexture';

export interface UseCloudTextureResult {
  texture: THREE.Data3DTexture | null;
  isLoading: boolean;
  progress: number; // 0-100
  regenerate: () => void;
}

export function useCloudTexture(parameters: TextureBakeParameters): UseCloudTextureResult {
  const [texture, setTexture] = useState<THREE.Data3DTexture | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentTextureRef = useRef<THREE.Data3DTexture | null>(null);

  const regenerate = useCallback(() => {
    setIsLoading(true);
    setProgress(0);

    bake3DTexture(parameters, (progressData: TextureBakeProgress) => {
      setProgress(progressData.progress);
    })
      .then((newTexture) => {
        // Dispose old texture
        if (currentTextureRef.current) {
          currentTextureRef.current.dispose();
        }
        currentTextureRef.current = newTexture;
        setTexture(newTexture);
        setIsLoading(false);
        setProgress(100);
      })
      .catch((error) => {
        console.error('Failed to bake 3D texture:', error);
        setIsLoading(false);
        setProgress(0);
      });
  }, [
    parameters.textureSize,
    parameters.cloudCoverage,
    parameters.cloudSoftness,
    parameters.noiseScale,
    parameters.octaves,
    parameters.persistence,
    parameters.lacunarity,
    parameters.noiseIntensity,
    parameters.seed,
  ]);

  // Generate initial texture on mount
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTextureRef.current) {
        currentTextureRef.current.dispose();
      }
    };
  }, []);

  return {
    texture,
    isLoading,
    progress,
    regenerate,
  };
}


```

---

## hooks/useCloudMask.ts

**Location:** `src/engines/volumetric-clouds/hooks/useCloudMask.ts`

```typescript
/**
 * Hook for managing volumetric mask controller
 * Handles mask parameters, noise generation, and uniform updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  VolumetricMaskController,
  VolumetricMaskParameters,
  VolumetricMaskUniforms,
} from '../utils/mask/VolumetricMaskController';

export interface UseCloudMaskResult {
  maskUniforms: VolumetricMaskUniforms;
  updateParameters: (params: Partial<VolumetricMaskParameters>) => void;
  regenerateNoise: () => void;
}

export function useCloudMask(initialParameters: VolumetricMaskParameters): UseCloudMaskResult {
  const controllerRef = useRef<VolumetricMaskController | null>(null);
  const [maskUniforms, setMaskUniforms] = useState<VolumetricMaskUniforms | null>(null);

  // Initialize controller
  useEffect(() => {
    const controller = new VolumetricMaskController();
    
    // Update with initial parameters
    controller.parameters = { ...controller.parameters, ...initialParameters };
    controller.updateShapeUniforms();
    
    controllerRef.current = controller;
    setMaskUniforms(controller.uniforms);

    return () => {
      controller.dispose();
    };
  }, []); // Only initialize once

  // Update parameters when they change
  useEffect(() => {
    if (!controllerRef.current) return;

    controllerRef.current.parameters = {
      ...controllerRef.current.parameters,
      ...initialParameters,
    };
    controllerRef.current.updateShapeUniforms();
    setMaskUniforms({ ...controllerRef.current.uniforms });
  }, [initialParameters]);

  const updateParameters = useCallback((params: Partial<VolumetricMaskParameters>) => {
    if (!controllerRef.current) return;

    controllerRef.current.parameters = {
      ...controllerRef.current.parameters,
      ...params,
    };
    controllerRef.current.updateShapeUniforms();
    setMaskUniforms({ ...controllerRef.current.uniforms });
  }, []);

  const regenerateNoise = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.regenerateNoise();
    setMaskUniforms({ ...controllerRef.current.uniforms });
  }, []);

  return {
    maskUniforms: maskUniforms || (controllerRef.current?.uniforms as VolumetricMaskUniforms),
    updateParameters,
    regenerateNoise,
  };
}


```

---

## hooks/useCloudAnimation.ts

**Location:** `src/engines/volumetric-clouds/hooks/useCloudAnimation.ts`

```typescript
/**
 * Hook for animating cloud texture offset
 * Updates texture offset based on animation parameters
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface CloudAnimationSettings {
  isAnimating: boolean;
  speedX: number;
  speedY: number;
  speedZ: number;
}

export function useCloudAnimation(
  settings: CloudAnimationSettings,
  textureOffsetRef: React.MutableRefObject<THREE.Vector3>
): void {
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!settings.isAnimating) return;

    const animate = () => {
      const currentTime = performance.now();
      const elapsed = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      if (elapsed > 0 && elapsed < 1) {
        // Only update if reasonable delta (prevents huge jumps)
        const offset = textureOffsetRef.current;
        offset.x += settings.speedX * elapsed;
        offset.y += settings.speedY * elapsed;
        offset.z += settings.speedZ * elapsed;

        // Use modulo to keep offset within 0-1 range for seamless tiling
        offset.x -= Math.floor(offset.x);
        offset.y -= Math.floor(offset.y);
        offset.z -= Math.floor(offset.z);
      }
    };

    lastTimeRef.current = performance.now();
    const intervalId = setInterval(animate, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [settings.isAnimating, settings.speedX, settings.speedY, settings.speedZ, textureOffsetRef]);
}


```

---

## hooks/useGodRays.ts

**Location:** `src/engines/volumetric-clouds/hooks/useGodRays.ts`

```typescript
/**
 * Hook for managing God Rays post-processing system
 * Handles render targets, materials, and god rays generation
 */

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { GodRaysSettings } from '../types';
import { GOD_RAYS_VERTEX_SHADER, GOD_RAYS_FRAGMENT_SHADER } from '../shaders/godRaysShaders';

export interface UseGodRaysResult {
  occlusionRenderTarget: THREE.WebGLRenderTarget | null;
  godRaysRenderTarget: THREE.WebGLRenderTarget | null;
  godRaysMaterial: THREE.ShaderMaterial | null;
  finalCompositeMaterial: THREE.MeshBasicMaterial | null;
}

export function useGodRays(
  settings: GodRaysSettings,
  resolution: { x: number; y: number }
): UseGodRaysResult {
  // Calculate effect resolution (half resolution for performance)
  const effectResolution = useMemo(
    () => ({
      x: Math.floor(resolution.x * 0.5),
      y: Math.floor(resolution.y * 0.5),
    }),
    [resolution.x, resolution.y]
  );

  // Render targets
  const occlusionRenderTarget = useMemo(() => {
    if (!settings.enabled) return null;
    const target = new THREE.WebGLRenderTarget(effectResolution.x, effectResolution.y, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
    return target;
  }, [settings.enabled, effectResolution.x, effectResolution.y]);

  const godRaysRenderTarget = useMemo(() => {
    if (!settings.enabled) return null;
    const target = new THREE.WebGLRenderTarget(effectResolution.x, effectResolution.y, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
    return target;
  }, [settings.enabled, effectResolution.x, effectResolution.y]);

  // God rays material
  const godRaysMaterial = useMemo(() => {
    if (!settings.enabled || !occlusionRenderTarget) return null;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: occlusionRenderTarget.texture },
        lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
        sunColor: { value: new THREE.Color(0xffddaa) },
        density: { value: settings.density },
        decay: { value: settings.decay },
        weight: { value: settings.weight },
        exposure: { value: settings.exposure },
        samples: { value: settings.samples },
      },
      vertexShader: GOD_RAYS_VERTEX_SHADER,
      fragmentShader: GOD_RAYS_FRAGMENT_SHADER,
    });

    return material;
  }, [
    settings.enabled,
    settings.density,
    settings.decay,
    settings.weight,
    settings.exposure,
    settings.samples,
    occlusionRenderTarget,
  ]);

  // Update uniforms when settings change
  useEffect(() => {
    if (!godRaysMaterial) return;

    godRaysMaterial.uniforms.density.value = settings.density;
    godRaysMaterial.uniforms.decay.value = settings.decay;
    godRaysMaterial.uniforms.weight.value = settings.weight;
    godRaysMaterial.uniforms.exposure.value = settings.exposure;
    godRaysMaterial.uniforms.samples.value = settings.samples;
  }, [
    godRaysMaterial,
    settings.density,
    settings.decay,
    settings.weight,
    settings.exposure,
    settings.samples,
  ]);

  // Final composite material
  const finalCompositeMaterial = useMemo(() => {
    if (!settings.enabled || !godRaysRenderTarget) return null;

    const material = new THREE.MeshBasicMaterial({
      map: godRaysRenderTarget.texture,
      transparent: true,
      blending: THREE.AdditiveBlending, // Add the rays on top of the final scene
    });

    return material;
  }, [settings.enabled, godRaysRenderTarget]);

  // Cleanup
  useEffect(() => {
    return () => {
      occlusionRenderTarget?.dispose();
      godRaysRenderTarget?.dispose();
      godRaysMaterial?.dispose();
      finalCompositeMaterial?.dispose();
    };
  }, [occlusionRenderTarget, godRaysRenderTarget, godRaysMaterial, finalCompositeMaterial]);

  // Update render target sizes on resolution change
  useEffect(() => {
    if (occlusionRenderTarget) {
      occlusionRenderTarget.setSize(effectResolution.x, effectResolution.y);
    }
    if (godRaysRenderTarget) {
      godRaysRenderTarget.setSize(effectResolution.x, effectResolution.y);
    }
  }, [effectResolution.x, effectResolution.y, occlusionRenderTarget, godRaysRenderTarget]);

  return {
    occlusionRenderTarget,
    godRaysRenderTarget,
    godRaysMaterial,
    finalCompositeMaterial,
  };
}


```

---

## shaders/cloudShaders.ts

**Location:** `src/engines/volumetric-clouds/shaders/cloudShaders.ts`

```typescript
/**
 * Volumetric Cloud Shaders
 * Vertex and Fragment shaders for volumetric ray marching
 */

export const VOLUMETRIC_CLOUD_VERTEX_SHADER = /* glsl */ `
// The camera position in world space.
uniform vec3 cameraPos;

// Data passed from the Vertex to the Fragment Shader.
out vec3 vOrigin;    // The ray's starting point (camera position in the object's local space).
out vec3 vDirection; // The direction of the ray from the camera to the current vertex.

void main() {
    // Transform the vertex position to model-view space.
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    // Calculate the ray origin by transforming the world camera position into the local space of the cloud container.
    vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;

    // The ray direction is simply the vector from the camera (vOrigin) to the vertex (position).
    vDirection = position - vOrigin;

    // Final vertex position in clip space.
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const VOLUMETRIC_CLOUD_FRAGMENT_SHADER = /* glsl */ `
// Set precision for floating point numbers and samplers for performance/accuracy.
precision highp float;
precision highp sampler3D;

// Data received from the Vertex Shader.
in vec3 vOrigin;
in vec3 vDirection;

// The final output color of the pixel.
out vec4 color;

// --- UNIFORMS (Complete Set) ---
// These are variables passed from JavaScript to the shader, allowing for real-time control.

// Textures
uniform highp sampler3D uVolumeTexture;     // The 3D noise texture defining the cloud's internal density.
uniform sampler2D uBlueNoise;               // A 2D texture used for high-quality random jittering to reduce banding.
uniform sampler2D uDepthTexture;            // The depth map of the solid scene objects, for occlusion.

// Scene & Camera Parameters
uniform vec2 uBlueNoiseSize;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uLightDir;                     // Direction of the main light source (sun).
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform mat4 uProjectionMatrixInverse;
uniform mat4 uViewMatrixInverse;
uniform mat4 uModelMatrix;
uniform mat4 modelViewMatrix;
uniform float uCameraNear;
uniform float uCameraFar;

// Cloud Material & Rendering Parameters
uniform float uOpacity;
uniform int uMaxSteps;                      // Ray marching quality: how many steps to take through the volume.
uniform int uLightSteps;                    // Quality for calculating light absorption inside the cloud.
uniform float uDensityThreshold;
uniform float uDensityMultiplier;
uniform vec3 uTextureOffset;                // Used for animating the cloud texture.
uniform float uTextureTiling;               // Controls the repetition of the 3D texture.
uniform bool uOcclusionMode;                // A switch to render the cloud for the God Rays pass.

// --- Volumetric Mask Uniforms ---
// These control the overall shape of the cloud.
// NOTE: Names are in Portuguese to maintain 1:1 correspondence with the original JS code.
uniform float u_mask_raio;                  // (Radius) Base radius of the spherical mask.
uniform float u_mask_achatamentoCima;       // (Flatten Top) Y-axis flattening for the top half.
uniform float u_mask_achatamentoBaixo;      // (Flatten Bottom) Y-axis flattening for the bottom half.
uniform float u_mask_achatamentoXpos;       // (Flatten X positive)
uniform float u_mask_achatamentoXneg;       // (Flatten X negative)
uniform float u_mask_achatamentoZpos;       // (Flatten Z positive)
uniform float u_mask_achatamentoZneg;       // (Flatten Z negative)
uniform float u_mask_softness;              // Softness of the mask's edges.
uniform float u_mask_forcaRuido;            // (Noise Strength) Strength of the primary noise deformation.
uniform highp sampler3D u_mask_noiseMap;    // 3D texture for primary shape deformation.
uniform float u_mask_forcaRuidoDetalhe;     // (Detail Noise Strength) Strength of the detail noise.
uniform highp sampler3D u_mask_noiseDetailMap; // 3D texture for fine detail deformation.
uniform bool u_mask_visualize;              // Switch to visualize the mask shape itself.

// --- SHADER FUNCTIONS & CONSTANTS ---
#define PI 3.14159265359
const vec3 EXTINCTION_MULT = vec3(0.6, 0.65, 0.7); // How much light is absorbed/scattered.
const float DUAL_LOBE_WEIGHT = 0.8; // Controls the mix between forward and backward scattering.

// --- START OF UPDATED VOLUMETRIC MASK CODE ---
// This section defines the overall shape of the cloud before applying the detailed 3D noise.
// It works by creating a base sphere and deforming it with two layers of 3D noise.

// Signed Distance Function (SDF) for the mask. Returns distance to the surface (>0 is inside).
float getMaskSDF(vec3 p) {
    if (u_mask_raio <= 0.0) return -1.0; // If radius is zero, we are always outside.

    // 1. Flattening works by scaling the sample point 'p' based on its position.
    vec3 p_distorted = p;
    if (p.y > 0.0) p_distorted.y /= u_mask_achatamentoCima;  else p_distorted.y /= u_mask_achatamentoBaixo;
    if (p.x > 0.0) p_distorted.x /= u_mask_achatamentoXpos;  else p_distorted.x /= u_mask_achatamentoXneg;
    if (p.z > 0.0) p_distorted.z /= u_mask_achatamentoZpos;  else p_distorted.z /= u_mask_achatamentoZneg;
    
    float dist = length(p_distorted);
    if (dist == 0.0) return u_mask_raio; // Avoid division by zero at the center.
    vec3 dir = p_distorted / dist;
    
    // 2. The texture coordinate is the same for both noise layers.
    vec3 tex_coord = (dir * u_mask_raio) * 0.5 + 0.5;
    
    // 3. We read the value from BOTH noise textures.
    float noiseValuePrincipal = (texture(u_mask_noiseMap, tex_coord).r * 2.0 - 1.0);
    float noiseValueDetalhe = (texture(u_mask_noiseDetailMap, tex_coord).r * 2.0 - 1.0);

    // 4. Calculate the displacement for each noise layer separately.
    float displacementPrincipal = noiseValuePrincipal * u_mask_forcaRuido;
    float displacementDetalhe = noiseValueDetalhe * u_mask_forcaRuidoDetalhe;

    // 5. Sum the two displacements to get the final result.
    float totalDisplacement = displacementPrincipal + displacementDetalhe;
    
    // The function returns the distance from the surface. > 0 means "inside".
    return (u_mask_raio + totalDisplacement) - dist;
}

// Converts the SDF value into a soft mask factor between 0.0 and 1.0.
float getMaskFactor(vec3 p) {
    float sdf = getMaskSDF(p);
    return smoothstep(0.0, u_mask_softness, sdf);
}
// --- END OF VOLUMETRIC MASK CODE ---

// The Henyey-Greenstein phase function models how light scatters within a medium.
// It determines whether light is scattered forward, backward, or sideways.
float HenyeyGreenstein(float g, float mu) {
    float gg = g * g;
    return (1.0 / (4.0 * PI)) * ((1.0 - gg) / pow(1.0 + gg - 2.0 * g * mu, 1.5));
}
    
// A dual-lobe phase function combines forward and backward scattering for a more realistic cloud appearance.
float PhaseFunction(float g, float costh) {
    return mix(HenyeyGreenstein(-g, costh), HenyeyGreenstein(g, costh), DUAL_LOBE_WEIGHT);
}

// Calculates the intersection points of a ray with the bounding box of the cloud (a unit cube).
vec2 hitBox( vec3 orig, vec3 dir ) {
    const vec3 box_min = vec3( -0.5 );
    const vec3 box_max = vec3( 0.5 );
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
}

// Reconstructs the world position of a point from the depth buffer.
vec3 getWorldPosFromDepth(float depth, vec2 screenUV) {
    vec2 ndc = screenUV * 2.0 - 1.0;
    float z = depth * 2.0 - 1.0;
    vec4 clipPos = vec4(ndc, z, 1.0);
    vec4 worldPos = uViewMatrixInverse * uProjectionMatrixInverse * clipPos;
    return worldPos.xyz / worldPos.w;
}

// Samples the density at a given point 'p' inside the cloud volume.
float getDensity(vec3 p) {
    // First, get the shaping mask value. If we're outside the mask, density is zero.
    float maskFactor = getMaskFactor(p);
    if (maskFactor <= 0.0) {
        return 0.0;
    }

    // UNIFIED LOGIC: Decide which density to use.
    float finalDensity;
    if (u_mask_visualize) {
        // VISUALIZATION MODE: Return a constant (solid) density,
        // but still with the soft edges from the mask.
        finalDensity = 1.0;
    } else {
        // NORMAL MODE: Calculate density from the 3D noise texture.
        vec3 texCoord = (p + 0.5) * uTextureTiling;
        vec3 offsetTexCoord = texCoord + uTextureOffset;
        float noiseDensity = texture(uVolumeTexture, offsetTexCoord).r;
        if (noiseDensity < uDensityThreshold) return 0.0;
        finalDensity = noiseDensity;
    }
    
    // Apply the multiplier and mask factor in both cases.
    return finalDensity * uDensityMultiplier * maskFactor;
}

// This function calculates how much sunlight reaches a point inside the cloud.
// It does this by marching another short ray from the sample point towards the sun
// and accumulating the density along the way.
float CalculateLightEnergy(vec3 samplePos, vec3 lightDir) {
    float stepLength = 1.0 / float(uLightSteps);
    float lightRayDensity = 0.0;
    for(int i = 0; i < uLightSteps; i++) {
        // We use the midpoint method (+ 0.5), which is more stable.
        vec3 p = samplePos + lightDir * (float(i) + 0.5) * stepLength;
        // Check if the light-ray sample is still inside the bounding box.
        if (all(greaterThan(p, vec3(-0.5))) && all(lessThan(p, vec3(0.5)))) {
            lightRayDensity += getDensity(p) * stepLength;
        }
    }
    // Beer's Law: The more density, the less light penetrates (exponential decay).
    return exp(-lightRayDensity);
}

// Converts non-linear depth from the depth buffer to linear distance from the camera.
float linearize_depth(float d, float zNear, float zFar) {
    if (d == 1.0) return zFar; 
    return zNear * zFar / (zFar + d * (zNear - zFar));
}

// The main function executed for every pixel.
void main() {
    // 1. SETUP THE RAY
    vec3 rayDir = normalize(vDirection);
    // Find where the ray enters and exits the cloud's bounding box.
    vec2 bounds = hitBox(vOrigin, rayDir);
    if (bounds.x >= bounds.y) discard; // If we don't hit the box, discard the pixel.
    bounds.x = max(bounds.x, 0.0);

    // 2. SETUP OCCLUSION
    // Get the distance to the solid objects already rendered in the scene.
    vec2 screenUV = gl_FragCoord.xy / uResolution;
    float sceneDepthValue = texture(uDepthTexture, screenUV).r;
    float sceneLinearDistance = linearize_depth(sceneDepthValue, uCameraNear, uCameraFar);
    
    // 3. RAY MARCHING LOOP
    float rayLength = bounds.y - bounds.x;
    if (rayLength < 0.001) discard;

    float stepSize = rayLength / float(uMaxSteps);
    // Jitter the starting position to reduce artifacts (banding).
    float jitter = texture(uBlueNoise, mod(gl_FragCoord.xy, uBlueNoiseSize) / uBlueNoiseSize).r;
    vec3 p = vOrigin + (bounds.x + jitter * stepSize) * rayDir;

    // Initialize accumulators.
    vec3 accumulatedColor = vec3(0.0);
    vec3 transmittance = vec3(1.0); // How much light is left after passing through the volume.
    float mu = dot(rayDir, uLightDir); // Angle between view ray and light direction.
    float fade_zone = stepSize * 2.0; // For soft blending at the edges of the volume.
    
    for (int i = 0; i < uMaxSteps; i++) {
        // Check for occlusion: if the current point on the ray is behind a solid object, stop.
        vec4 viewSpacePos = modelViewMatrix * vec4(p, 1.0);
        float rayPointDistance = abs(viewSpacePos.z / viewSpacePos.w);
        if (rayPointDistance > sceneLinearDistance) break;
        
        // Safety break for rays near the exit point.
        float dist_traveled = (float(i) * stepSize) + (jitter * stepSize);
        float dist_remaining = rayLength - dist_traveled;
        if (dist_remaining < 0.0) break;

        // Sample the density at the current point.
        float density = getDensity(p);

        if (density > 0.01) {
            // If there's density, calculate lighting.
            float lightEnergy = CalculateLightEnergy(p, uLightDir);
            
            // Direct lighting (from the sun).
            vec3 sunLuminance = uSunColor * uSunIntensity * lightEnergy;
            float phase = PhaseFunction(0.3, mu);
            vec3 sunScattering = sunLuminance * phase;

            // Ambient lighting (approximates light from all other directions).
            vec3 ambientLuminance = uAmbientColor * uAmbientIntensity;
            vec3 ambientScattering = ambientLuminance;

            // Combine lighting and apply density.
            vec3 totalScattering = (sunScattering + ambientScattering) * density * stepSize;

            // Apply a soft fade near the exit point of the volume to prevent hard edges.
            float fade_alpha = smoothstep(0.0, fade_zone, dist_remaining);
            totalScattering *= fade_alpha;

            // Absorption: reduce the amount of light passing through this step.
            vec3 stepTransmittance = exp(-density * stepSize * EXTINCTION_MULT * uOpacity);
            
            // "Front-to-back" compositing: add the scattered light, attenuated by the transmittance from previous steps.
            accumulatedColor += transmittance * totalScattering;
            // Update the total transmittance for the next steps.
            transmittance *= stepTransmittance;
            
            // Early exit optimization: if the cloud has become almost fully opaque, stop.
            if (length(transmittance) < 0.01) break;
        }
        // Move to the next point along the ray.
        p += rayDir * stepSize;
    }

    // 4. FINAL OUTPUT
    // Special mode for rendering the God Rays occlusion mask.
    if (uOcclusionMode) {
        float alpha = 1.0 - transmittance.r;
        color = vec4(0.0, 0.0, 0.0, alpha); // Render black with alpha based on cloud opacity.
        return;
    }
    
    // Normal mode: output the accumulated color and the final alpha.
    color = vec4(accumulatedColor, 1.0 - transmittance.r);
}
`;


```

---

## shaders/godRaysShaders.ts

**Location:** `src/engines/volumetric-clouds/shaders/godRaysShaders.ts`

```typescript
/**
 * God Rays Shaders
 * Vertex and Fragment shaders for crepuscular rays post-processing
 */

export const GOD_RAYS_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const GOD_RAYS_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 lightPosition;
uniform vec3 sunColor;
uniform float density;
uniform float decay;
uniform float weight;
uniform float exposure;
uniform int samples;
varying vec2 vUv;

// This shader creates the light shafts by sampling along a line
// from the current pixel towards the light source in the occlusion texture.
void main() {
    vec2 lightPos = (lightPosition + 1.0) * 0.5;
    vec2 delta = lightPos - vUv;
    vec2 step = delta / float(samples);
    vec3 color = vec3(0.0);
    float illuminationDecay = 1.0;

    for(int i = 0; i < samples; i++) {
        vec2 sampleCoord = vUv + float(i) * step;
        vec4 sampleColor = texture2D(tDiffuse, sampleCoord);
        sampleColor *= illuminationDecay * weight;
        color += sampleColor.rgb;
        illuminationDecay *= decay;
    }
    gl_FragColor = vec4(color * sunColor * density * exposure, 1.0);
}
`;


```

---

## types.ts

**Location:** `src/engines/volumetric-clouds/types.ts`

```typescript
/**
 * Type definitions for Volumetric Clouds system
 */

import * as THREE from 'three';

export interface VolumetricCloudsSettings {
  enabled: boolean;
  quality: 'low' | 'medium' | 'high';

  // Texture Generation
  textureSize: 32 | 64 | 96 | 128 | 256;
  cloudCoverage: number;
  cloudSoftness: number;
  noiseScale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  noiseIntensity: number;
  seed: number;

  // Cloud Shape (Mask)
  maskRadius: number;
  maskSoftness: number;
  flattenTop: number;
  flattenBottom: number;
  flattenXpos: number;
  flattenXneg: number;
  flattenZpos: number;
  flattenZneg: number;
  noiseStrength: number;
  noiseFrequency: number;
  detailNoiseStrength: number;
  detailNoiseFrequency: number;

  // Rendering
  textureTiling: number;
  densityThreshold: number;
  densityMultiplier: number;
  opacity: number;
  raymarchSteps: number;
  lightSteps: number;
  containerScale: number;

  // Animation
  isAnimating: boolean;
  animationSpeedX: number;
  animationSpeedY: number;
  animationSpeedZ: number;

  // God Rays
  godRays: {
    enabled: boolean;
    density: number;
    decay: number;
    weight: number;
    exposure: number;
    samples: number;
  };
}

export interface VolumetricCloudUniforms extends Record<string, THREE.IUniform<any>> {
  // Textures
  uVolumeTexture: { value: THREE.Data3DTexture | null };
  uBlueNoise: { value: THREE.Texture | null };
  uDepthTexture: { value: THREE.DepthTexture | null };

  // Scene & Camera
  uBlueNoiseSize: { value: THREE.Vector2 };
  uResolution: { value: THREE.Vector2 };
  uSunColor: { value: THREE.Color };
  uSunIntensity: { value: number };
  uLightDir: { value: THREE.Vector3 };
  uAmbientColor: { value: THREE.Color };
  uAmbientIntensity: { value: number };
  uProjectionMatrixInverse: { value: THREE.Matrix4 };
  uViewMatrixInverse: { value: THREE.Matrix4 };
  uModelMatrix: { value: THREE.Matrix4 };
  uCameraNear: { value: number };
  uCameraFar: { value: number };
  cameraPos: { value: THREE.Vector3 };

  // Cloud Material & Rendering
  uOpacity: { value: number };
  uMaxSteps: { value: number };
  uLightSteps: { value: number };
  uDensityThreshold: { value: number };
  uDensityMultiplier: { value: number };
  uTextureOffset: { value: THREE.Vector3 };
  uTextureTiling: { value: number };
  uOcclusionMode: { value: boolean };
  uContainerScale: { value: number };
  uProjectionMatrix: { value: THREE.Matrix4 };

  // Mask uniforms (from VolumetricMaskController)
  u_mask_raio: { value: number };
  u_mask_achatamentoCima: { value: number };
  u_mask_achatamentoBaixo: { value: number };
  u_mask_achatamentoXpos: { value: number };
  u_mask_achatamentoXneg: { value: number };
  u_mask_achatamentoZpos: { value: number };
  u_mask_achatamentoZneg: { value: number };
  u_mask_softness: { value: number };
  u_mask_forcaRuido: { value: number };
  u_mask_noiseMap: { value: THREE.Data3DTexture | null };
  u_mask_forcaRuidoDetalhe: { value: number };
  u_mask_noiseDetailMap: { value: THREE.Data3DTexture | null };
  u_mask_visualize: { value: boolean };
}

export interface GodRaysSettings {
  enabled: boolean;
  density: number;
  decay: number;
  weight: number;
  exposure: number;
  samples: number;
}

export interface GodRaysUniforms extends Record<string, THREE.IUniform<any>> {
  tDiffuse: { value: THREE.Texture | null };
  lightPosition: { value: THREE.Vector2 };
  sunColor: { value: THREE.Color };
  density: { value: number };
  decay: { value: number };
  weight: { value: number };
  exposure: { value: number };
  samples: { value: number };
}


```

---

## utils/noise/ImprovedNoise.ts

**Location:** `src/engines/volumetric-clouds/utils/noise/ImprovedNoise.ts`

```typescript
/**
 * Improved Perlin Noise Generator
 * 3D Perlin noise implementation with seeded random support
 * Ported from volumetric-clouds original implementation
 */

export class ImprovedNoise {
  private p: Uint8Array;

  constructor(seededRandom: () => number = Math.random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
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


```

---

## utils/noise/createSeededRandom.ts

**Location:** `src/engines/volumetric-clouds/utils/noise/createSeededRandom.ts`

```typescript
/**
 * Creates a seeded random number generator function
 * Uses a simple hash function to generate deterministic random numbers
 * 
 * @param seed - Initial seed value
 * @returns Function that returns random numbers between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}


```

---

## utils/noise/fbm.ts

**Location:** `src/engines/volumetric-clouds/utils/noise/fbm.ts`

```typescript
/**
 * Fractional Brownian Motion (fbm)
 * Creates more detailed and natural-looking noise by layering multiple "octaves"
 * of Perlin noise at different frequencies and amplitudes.
 * 
 * @param perlin - ImprovedNoise instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 * @param octaves - Number of octaves to layer
 * @param persistence - Amplitude decay per octave (0-1)
 * @param lacunarity - Frequency increase per octave (>1)
 * @returns Normalized noise value between -1 and 1
 */

import { ImprovedNoise } from './ImprovedNoise';

export function fbm(
  perlin: ImprovedNoise,
  x: number,
  y: number,
  z: number,
  octaves: number,
  persistence: number,
  lacunarity: number
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
 * Smoothstep function
 * Creates smooth interpolation between edge0 and edge1
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3.0 - 2.0 * t);
}


```

---

## utils/mask/VolumetricMaskController.ts

**Location:** `src/engines/volumetric-clouds/utils/mask/VolumetricMaskController.ts`

```typescript
/**
 * Volumetric Mask Controller
 * Manages the deformable spherical mask that shapes the cloud
 * Handles noise generation, texture creation, and shader uniform management
 */

import * as THREE from 'three';
import { createSeededRandom } from '../noise/createSeededRandom';
import { createNoiseGeneratorFromPermutation } from './createNoiseGeneratorFromPermutation';

export interface VolumetricMaskParameters {
  seed: number;
  raio: number; // Radius
  achatamentoCima: number; // Flatten Top
  achatamentoBaixo: number; // Flatten Bottom
  achatamentoXpos: number; // Flatten X positive
  achatamentoXneg: number; // Flatten X negative
  achatamentoZpos: number; // Flatten Z positive
  achatamentoZneg: number; // Flatten Z negative
  maskSoftness: number;
  forcaRuido: number; // Noise Strength
  frequenciaRuido: number; // Noise Frequency
  seedDetalhe: number; // Detail Seed
  forcaRuidoDetalhe: number; // Detail Noise Strength
  frequenciaRuidoDetalhe: number; // Detail Noise Frequency
  visualizeMask: boolean;
}

export interface VolumetricMaskUniforms extends Record<string, THREE.IUniform<any>> {
  u_mask_raio: { value: number };
  u_mask_achatamentoCima: { value: number };
  u_mask_achatamentoBaixo: { value: number };
  u_mask_achatamentoXpos: { value: number };
  u_mask_achatamentoXneg: { value: number };
  u_mask_achatamentoZpos: { value: number };
  u_mask_achatamentoZneg: { value: number };
  u_mask_softness: { value: number };
  u_mask_forcaRuido: { value: number };
  u_mask_noiseMap: { value: THREE.Data3DTexture | null };
  u_mask_forcaRuidoDetalhe: { value: number };
  u_mask_noiseDetailMap: { value: THREE.Data3DTexture | null };
  u_mask_visualize: { value: boolean };
}

export class VolumetricMaskController {
  public parameters: VolumetricMaskParameters;
  public noiseTexture: THREE.Data3DTexture | null = null;
  public detailNoiseTexture: THREE.Data3DTexture | null = null;
  private noiseGenerator: ((p: THREE.Vector3) => number) | null = null;
  private detailNoiseGenerator: ((p: THREE.Vector3) => number) | null = null;
  public uniforms!: VolumetricMaskUniforms;

  constructor() {
    // Default parameters to control the mask's shape
    this.parameters = {
      seed: 1,
      raio: 0.52,
      achatamentoCima: 0.7,
      achatamentoBaixo: 0.3,
      achatamentoXpos: 0.9,
      achatamentoXneg: 0.9,
      achatamentoZpos: 0.9,
      achatamentoZneg: 0.9,
      maskSoftness: 0.17,
      forcaRuido: 0.05,
      frequenciaRuido: 2.7,
      seedDetalhe: 10,
      forcaRuidoDetalhe: 0.036,
      frequenciaRuidoDetalhe: 10.5,
      visualizeMask: false,
    };

    this._createUniforms();
    this.regenerateNoise();
  }

  private _createSeededRandom(seed: number): () => number {
    return createSeededRandom(seed);
  }

  private _createUniforms(): void {
    this.uniforms = {
      u_mask_raio: { value: this.parameters.raio },
      u_mask_achatamentoCima: { value: this.parameters.achatamentoCima },
      u_mask_achatamentoBaixo: { value: this.parameters.achatamentoBaixo },
      u_mask_achatamentoXpos: { value: this.parameters.achatamentoXpos },
      u_mask_achatamentoXneg: { value: this.parameters.achatamentoXneg },
      u_mask_achatamentoZpos: { value: this.parameters.achatamentoZpos },
      u_mask_achatamentoZneg: { value: this.parameters.achatamentoZneg },
      u_mask_softness: { value: this.parameters.maskSoftness },
      u_mask_forcaRuido: { value: this.parameters.forcaRuido },
      u_mask_noiseMap: { value: null },
      u_mask_forcaRuidoDetalhe: { value: this.parameters.forcaRuidoDetalhe },
      u_mask_noiseDetailMap: { value: null },
      u_mask_visualize: { value: this.parameters.visualizeMask },
    };
  }

  private setupNoiseGenerator(): void {
    const seededRandom = this._createSeededRandom(this.parameters.seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    const permTable = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      permTable[i] = permTable[i + 256] = p[i];
    }
    this.noiseGenerator = createNoiseGeneratorFromPermutation(permTable);
  }

  private updateNoiseMaskTexture(): void {
    if (!this.noiseGenerator) return;

    const noiseMaskSize = 128; // Resolution of the mask's noise texture
    const noiseMaskData = new Uint8Array(noiseMaskSize * noiseMaskSize * noiseMaskSize);
    const directionVector = new THREE.Vector3();

    for (let z = 0; z < noiseMaskSize; z++) {
      for (let y = 0; y < noiseMaskSize; y++) {
        for (let x = 0; x < noiseMaskSize; x++) {
          directionVector.set(
            (x / (noiseMaskSize - 1)) * 2.0 - 1.0,
            (y / (noiseMaskSize - 1)) * 2.0 - 1.0,
            (z / (noiseMaskSize - 1)) * 2.0 - 1.0
          );

          if (directionVector.lengthSq() > 0) {
            directionVector.normalize();
            const noiseValue = this.noiseGenerator(
              directionVector.clone().multiplyScalar(this.parameters.frequenciaRuido)
            );
            noiseMaskData[z * noiseMaskSize * noiseMaskSize + y * noiseMaskSize + x] =
              noiseValue * 128 + 128;
          }
        }
      }
    }

    if (!this.noiseTexture) {
      this.noiseTexture = new THREE.Data3DTexture(
        noiseMaskData,
        noiseMaskSize,
        noiseMaskSize,
        noiseMaskSize
      );
      this.noiseTexture.format = THREE.RedFormat;
      this.noiseTexture.minFilter = THREE.LinearFilter;
      this.noiseTexture.magFilter = THREE.LinearFilter;
      this.noiseTexture.unpackAlignment = 1;
      this.uniforms.u_mask_noiseMap.value = this.noiseTexture;
    } else {
      this.noiseTexture.image.data.set(noiseMaskData);
      this.noiseTexture.needsUpdate = true;
    }
  }

  private setupDetailNoiseGenerator(): void {
    const seededRandom = this._createSeededRandom(this.parameters.seedDetalhe);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    const permTable = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      permTable[i] = permTable[i + 256] = p[i];
    }
    this.detailNoiseGenerator = createNoiseGeneratorFromPermutation(permTable);
  }

  private updateDetailNoiseMaskTexture(): void {
    if (!this.detailNoiseGenerator) return;

    const noiseMaskSize = 128;
    const noiseMaskData = new Uint8Array(noiseMaskSize * noiseMaskSize * noiseMaskSize);
    const directionVector = new THREE.Vector3();

    for (let z = 0; z < noiseMaskSize; z++) {
      for (let y = 0; y < noiseMaskSize; y++) {
        for (let x = 0; x < noiseMaskSize; x++) {
          directionVector.set(
            (x / (noiseMaskSize - 1)) * 2.0 - 1.0,
            (y / (noiseMaskSize - 1)) * 2.0 - 1.0,
            (z / (noiseMaskSize - 1)) * 2.0 - 1.0
          );

          if (directionVector.lengthSq() > 0) {
            directionVector.normalize();
            const noiseValue = this.detailNoiseGenerator(
              directionVector.clone().multiplyScalar(this.parameters.frequenciaRuidoDetalhe)
            );
            noiseMaskData[z * noiseMaskSize * noiseMaskSize + y * noiseMaskSize + x] =
              noiseValue * 128 + 128;
          }
        }
      }
    }

    if (!this.detailNoiseTexture) {
      this.detailNoiseTexture = new THREE.Data3DTexture(
        noiseMaskData,
        noiseMaskSize,
        noiseMaskSize,
        noiseMaskSize
      );
      this.detailNoiseTexture.format = THREE.RedFormat;
      this.detailNoiseTexture.minFilter = THREE.LinearFilter;
      this.detailNoiseTexture.magFilter = THREE.LinearFilter;
      this.detailNoiseTexture.unpackAlignment = 1;
      this.uniforms.u_mask_noiseDetailMap.value = this.detailNoiseTexture;
    } else {
      this.detailNoiseTexture.image.data.set(noiseMaskData);
      this.detailNoiseTexture.needsUpdate = true;
    }
  }

  public regenerateDetailNoise(): void {
    this.setupDetailNoiseGenerator();
    this.updateDetailNoiseMaskTexture();
  }

  public regenerateNoise(): void {
    this.setupNoiseGenerator();
    this.updateNoiseMaskTexture();
    this.regenerateDetailNoise();
  }

  public updateShapeUniforms(): void {
    this.uniforms.u_mask_raio.value = this.parameters.raio;
    this.uniforms.u_mask_achatamentoCima.value = this.parameters.achatamentoCima;
    this.uniforms.u_mask_achatamentoBaixo.value = this.parameters.achatamentoBaixo;
    this.uniforms.u_mask_achatamentoXpos.value = this.parameters.achatamentoXpos;
    this.uniforms.u_mask_achatamentoXneg.value = this.parameters.achatamentoXneg;
    this.uniforms.u_mask_achatamentoZpos.value = this.parameters.achatamentoZpos;
    this.uniforms.u_mask_achatamentoZneg.value = this.parameters.achatamentoZneg;
    this.uniforms.u_mask_softness.value = this.parameters.maskSoftness;
    this.uniforms.u_mask_forcaRuido.value = this.parameters.forcaRuido;
    this.uniforms.u_mask_forcaRuidoDetalhe.value = this.parameters.forcaRuidoDetalhe;
    this.uniforms.u_mask_visualize.value = this.parameters.visualizeMask;
  }

  public dispose(): void {
    if (this.noiseTexture) {
      this.noiseTexture.dispose();
      this.noiseTexture = null;
    }
    if (this.detailNoiseTexture) {
      this.detailNoiseTexture.dispose();
      this.detailNoiseTexture = null;
    }
  }
}


```

---

## utils/mask/createNoiseGeneratorFromPermutation.ts

**Location:** `src/engines/volumetric-clouds/utils/mask/createNoiseGeneratorFromPermutation.ts`

```typescript
/**
 * Creates a noise generator function from a pre-calculated permutation table
 * Used by VolumetricMaskController for generating 3D noise textures
 */

import * as THREE from 'three';

export function createNoiseGeneratorFromPermutation(
  permTable: Uint8Array
): (p: THREE.Vector3) => number {
  const fade = (t: number) => t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return function noise(p: THREE.Vector3): number {
    const P = new THREE.Vector3(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    const p_fract = p.clone().sub(P);
    const f = new THREE.Vector3(fade(p_fract.x), fade(p_fract.y), fade(p_fract.z));
    const xi = P.x & 255;
    const yi = P.y & 255;
    const zi = P.z & 255;
    const A = permTable[xi];
    const B = permTable[(xi + 1) & 255];
    const AA = permTable[(A + yi) & 255];
    const BA = permTable[(B + yi) & 255];
    const AB = permTable[(A + yi + 1) & 255];
    const BB = permTable[(B + yi + 1) & 255];
    const AAA = permTable[(AA + zi) & 255];
    const BAA = permTable[(BA + zi) & 255];
    const ABA = permTable[(AB + zi) & 255];
    const BBA = permTable[(BB + zi) & 255];
    const AAB = permTable[(AA + zi + 1) & 255];
    const BAB = permTable[(BA + zi + 1) & 255];
    const ABB = permTable[(AB + zi + 1) & 255];
    const BBB = permTable[(BB + zi + 1) & 255];
    const g1 = grad(AAA, p_fract.x, p_fract.y, p_fract.z);
    const g2 = grad(BAA, p_fract.x - 1, p_fract.y, p_fract.z);
    const g3 = grad(ABA, p_fract.x, p_fract.y - 1, p_fract.z);
    const g4 = grad(BBA, p_fract.x - 1, p_fract.y - 1, p_fract.z);
    const g5 = grad(AAB, p_fract.x, p_fract.y, p_fract.z - 1);
    const g6 = grad(BAB, p_fract.x - 1, p_fract.y, p_fract.z - 1);
    const g7 = grad(ABB, p_fract.x, p_fract.y - 1, p_fract.z - 1);
    const g8 = grad(BBB, p_fract.x - 1, p_fract.y - 1, p_fract.z - 1);
    return lerp(
      f.z,
      lerp(f.y, lerp(f.x, g1, g2), lerp(f.x, g3, g4)),
      lerp(f.y, lerp(f.x, g5, g6), lerp(f.x, g7, g8))
    );
  };
}


```

---

## utils/bake3DTexture.ts

**Location:** `src/engines/volumetric-clouds/utils/bake3DTexture.ts`

```typescript
/**
 * 3D Texture Baking Utility
 * Generates procedural 3D noise texture for cloud density
 */

import * as THREE from 'three';
import { ImprovedNoise } from './noise/ImprovedNoise';
import { fbm, smoothstep } from './noise/fbm';
import { createSeededRandom } from './noise/createSeededRandom';

export interface TextureBakeParameters {
  textureSize: 32 | 64 | 96 | 128 | 256;
  cloudCoverage: number;
  cloudSoftness: number;
  noiseScale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  noiseIntensity: number;
  seed: number;
}

export interface TextureBakeProgress {
  progress: number; // 0-100
  currentSlice: number;
  totalSlices: number;
}

/**
 * Bakes a 3D texture for cloud density
 * This is computationally expensive but only needs to be done once (or when parameters change)
 * 
 * @param parameters - Texture generation parameters
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to the baked 3D texture
 */
export async function bake3DTexture(
  parameters: TextureBakeParameters,
  onProgress?: (progress: TextureBakeProgress) => void
): Promise<THREE.Data3DTexture> {
  return new Promise((resolve) => {
    // Use setTimeout to allow UI to update during generation
    setTimeout(() => {
      const size = parameters.textureSize;
      const data = new Uint8Array(size * size * size);
      const seededRandom = createSeededRandom(parameters.seed);
      const perlin = new ImprovedNoise(seededRandom);
      let index = 0;

      for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const nx_norm = x / (size - 1);
            const ny_norm = y / (size - 1);
            const nz_norm = z / (size - 1);

            const base_x = nx_norm * parameters.noiseScale + parameters.seed;
            const base_y = ny_norm * parameters.noiseScale + parameters.seed;
            const base_z = nz_norm * parameters.noiseScale + parameters.seed;
            const scale = parameters.noiseScale;
            const fbmArgs = [parameters.octaves, parameters.persistence, parameters.lacunarity] as const;

            // Sample noise at 8 corners of a cube and interpolate to avoid artifacts
            const n1 = fbm(perlin, base_x, base_y, base_z, ...fbmArgs);
            const n2 = fbm(perlin, base_x - scale, base_y, base_z, ...fbmArgs);
            const n3 = fbm(perlin, base_x, base_y - scale, base_z, ...fbmArgs);
            const n4 = fbm(perlin, base_x, base_y, base_z - scale, ...fbmArgs);
            const n5 = fbm(perlin, base_x - scale, base_y - scale, base_z, ...fbmArgs);
            const n6 = fbm(perlin, base_x - scale, base_y, base_z - scale, ...fbmArgs);
            const n7 = fbm(perlin, base_x, base_y - scale, base_z - scale, ...fbmArgs);
            const n8 = fbm(perlin, base_x - scale, base_y - scale, base_z - scale, ...fbmArgs);

            const w_x = 1 - nx_norm;
            const w_y = 1 - ny_norm;
            const w_z = 1 - nz_norm;

            let noiseValue =
              n1 * w_x * w_y * w_z +
              n2 * nx_norm * w_y * w_z +
              n3 * w_x * ny_norm * w_z +
              n4 * w_x * w_y * nz_norm +
              n5 * nx_norm * ny_norm * w_z +
              n6 * nx_norm * w_y * nz_norm +
              n7 * w_x * ny_norm * nz_norm +
              n8 * nx_norm * ny_norm * nz_norm;

            noiseValue = (noiseValue + 1.0) / 2.0; // Normalize to 0-1 range
            const finalValue = Math.pow(noiseValue, parameters.noiseIntensity);
            // Apply coverage and softness to create defined cloud shapes from the continuous noise
            const density = smoothstep(
              parameters.cloudCoverage - parameters.cloudSoftness,
              parameters.cloudCoverage + parameters.cloudSoftness,
              finalValue
            );

            data[index++] = Math.floor(density * 255);
          }
        }

        // Update progress
        if (onProgress) {
          const percent = ((z + 1) / size) * 100;
          onProgress({
            progress: percent,
            currentSlice: z + 1,
            totalSlices: size,
          });
        }
      }

      // Create the 3D texture
      const texture = new THREE.Data3DTexture(data, size, size, size);
      texture.format = THREE.RedFormat; // Use RedFormat for single-channel data
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.unpackAlignment = 1;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.wrapR = THREE.RepeatWrapping;
      texture.needsUpdate = true;

      resolve(texture);
    }, 10);
  });
}


```

---

## utils/settingsConverter.ts

**Location:** `src/engines/volumetric-clouds/utils/settingsConverter.ts`

```typescript
/**
 * Settings Converter
 * Converts UnifiedWaterSettings to VolumetricCloudsSettings format
 */

import { UnifiedWaterSettings } from '../../../types/WaterSettings';
import { VolumetricCloudsSettings } from '../types';
import { applyQualityPreset } from '../presets';

/**
 * Converts unified settings to volumetric clouds settings format
 */
export function convertToVolumetricCloudsSettings(
  unifiedSettings: UnifiedWaterSettings
): VolumetricCloudsSettings {
  const cloudSettings = unifiedSettings.scene.volumetricClouds;
  
  // Start with base settings
  const baseSettings: VolumetricCloudsSettings = {
    enabled: cloudSettings.enabled,
    quality: cloudSettings.quality,
    
    // Texture Generation
    textureSize: cloudSettings.textureSize,
    cloudCoverage: cloudSettings.cloudCoverage,
    cloudSoftness: cloudSettings.cloudSoftness,
    noiseScale: cloudSettings.noiseScale,
    octaves: cloudSettings.octaves,
    persistence: cloudSettings.persistence,
    lacunarity: cloudSettings.lacunarity,
    noiseIntensity: cloudSettings.noiseIntensity,
    seed: cloudSettings.seed,
    
    // Cloud Shape
    maskRadius: cloudSettings.maskRadius,
    maskSoftness: cloudSettings.maskSoftness,
    flattenTop: cloudSettings.flattenTop,
    flattenBottom: cloudSettings.flattenBottom,
    flattenXpos: cloudSettings.flattenXpos,
    flattenXneg: cloudSettings.flattenXneg,
    flattenZpos: cloudSettings.flattenZpos,
    flattenZneg: cloudSettings.flattenZneg,
    noiseStrength: cloudSettings.noiseStrength,
    noiseFrequency: cloudSettings.noiseFrequency,
    detailNoiseStrength: cloudSettings.detailNoiseStrength,
    detailNoiseFrequency: cloudSettings.detailNoiseFrequency,
    
    // Rendering
    textureTiling: cloudSettings.textureTiling,
    densityThreshold: cloudSettings.densityThreshold,
    densityMultiplier: cloudSettings.densityMultiplier,
    opacity: cloudSettings.opacity,
    raymarchSteps: cloudSettings.raymarchSteps,
    lightSteps: cloudSettings.lightSteps,
    containerScale: cloudSettings.containerScale,
    
    // Animation
    isAnimating: cloudSettings.isAnimating,
    animationSpeedX: cloudSettings.animationSpeedX,
    animationSpeedY: cloudSettings.animationSpeedY,
    animationSpeedZ: cloudSettings.animationSpeedZ,
    
    // God Rays
    godRays: {
      enabled: cloudSettings.godRays.enabled,
      density: cloudSettings.godRays.density,
      decay: cloudSettings.godRays.decay,
      weight: cloudSettings.godRays.weight,
      exposure: cloudSettings.godRays.exposure,
      samples: cloudSettings.godRays.samples,
    },
  };
  
  // Apply quality preset to override quality-dependent settings
  return applyQualityPreset(baseSettings, cloudSettings.quality);
}


```

---

## presets.ts

**Location:** `src/engines/volumetric-clouds/presets.ts`

```typescript
/**
 * Quality presets for volumetric clouds
 * Optimized for different performance/quality trade-offs
 */

import { VolumetricCloudsSettings } from './types';

export interface QualityPreset {
  textureSize: 32 | 64 | 96 | 128 | 256;
  raymarchSteps: number;
  lightSteps: number;
  godRaysSamples: number;
  godRaysResolution: number; // Multiplier for resolution (0.25 = quarter, 0.5 = half)
}

export const QUALITY_PRESETS: Record<'low' | 'medium' | 'high', QualityPreset> = {
  low: {
    textureSize: 64,
    raymarchSteps: 20,
    lightSteps: 1,
    godRaysSamples: 60,
    godRaysResolution: 0.25, // Quarter resolution
  },
  medium: {
    textureSize: 96,
    raymarchSteps: 30,
    lightSteps: 2,
    godRaysSamples: 80,
    godRaysResolution: 0.5, // Half resolution
  },
  high: {
    textureSize: 128,
    raymarchSteps: 44,
    lightSteps: 4,
    godRaysSamples: 120,
    godRaysResolution: 0.5, // Half resolution
  },
};

/**
 * Apply quality preset to settings
 */
export function applyQualityPreset(
  settings: VolumetricCloudsSettings,
  quality: 'low' | 'medium' | 'high'
): VolumetricCloudsSettings {
  const preset = QUALITY_PRESETS[quality];
  return {
    ...settings,
    quality,
    textureSize: preset.textureSize,
    raymarchSteps: preset.raymarchSteps,
    lightSteps: preset.lightSteps,
    godRays: {
      ...settings.godRays,
      samples: preset.godRaysSamples,
    },
  };
}


```

---

## index.ts

**Location:** `src/engines/volumetric-clouds/index.ts`

```typescript
/**
 * Volumetric Clouds Engine
 * Main export file
 */

// Components
export * from './components';

// Types
export * from './types';

// Presets
export * from './presets';

// Hooks
export * from './hooks/useCloudTexture';
export * from './hooks/useCloudMask';
export * from './hooks/useCloudAnimation';
export * from './hooks/useGodRays';

// Utilities
export * from './utils/bake3DTexture';
export * from './utils/noise/ImprovedNoise';
export * from './utils/noise/fbm';
export * from './utils/noise/createSeededRandom';
export * from './utils/mask/VolumetricMaskController';
export * from './utils/settingsConverter';

// Shaders
export * from './shaders';


```

---

## components/index.ts

**Location:** `src/engines/volumetric-clouds/components/index.ts`

```typescript
/**
 * Component exports
 */

export { CloudVolume } from './CloudVolume';
export { GodRays } from './GodRays';
export { VolumetricClouds } from './VolumetricClouds';


```

---

## shaders/index.ts

**Location:** `src/engines/volumetric-clouds/shaders/index.ts`

```typescript
/**
 * Shader exports
 * Shader code as strings for use with Three.js ShaderMaterial
 */

// Volumetric Cloud Shaders
export { VOLUMETRIC_CLOUD_VERTEX_SHADER, VOLUMETRIC_CLOUD_FRAGMENT_SHADER } from './cloudShaders';

// God Rays Shaders
export { GOD_RAYS_VERTEX_SHADER, GOD_RAYS_FRAGMENT_SHADER } from './godRaysShaders';


```

---
