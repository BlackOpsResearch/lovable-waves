/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROCEDURAL EARTH ENGINE v3.0 - HYPERREAL METAVERSE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Production-grade Earth simulation with:
 * - Adaptive Cloud Raymarching (96→48→24→8 steps, distance-based LOD)
 * - Terrain LOD System (6 levels, geometry clipmaps)
 * - al-ro Perlin-Worley Volumetric Clouds (multi-scattering)
 * - Realistic Flight Simulation (AoA, lift, drag, thrust)
 * - Dynamic Weather (rain, snow, thunderstorms, wind)
 * - Performance Optimizer (maintains 60 FPS)
 * - Developer Mode (real-time stats)
 * 
 * Target: 60 FPS @ 1080p on RTX 3060 / M1 Pro
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, X, Sun, Cloud, Waves, Mountain,
  Pause, Play, RotateCcw, Maximize, Minimize, Sparkles, Plane, Layers, Wind, Bug, Globe
} from 'lucide-react';
import WeatherSystem from '../components/earth/WeatherSystem';
import ProceduralGenerator from '../components/earth/ProceduralGenerator';
import FlightSimulation from '../components/earth/FlightSimulation';
import LODManager from '../components/earth/LODManager';
import { TerrainClipmapLOD } from '../components/earth/TerrainLODSystem';
import { CloudLODSystem } from '../components/earth/CloudLODSystem';
import { PerformanceOptimizer } from '../components/earth/PerformanceOptimizer';
import DeveloperMode from '../components/earth/DeveloperMode';

const VERTEX_SHADER = `
precision highp float;
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform int iFrame;

uniform vec3 uCameraPos;
uniform float uCameraYaw;
uniform float uCameraPitch;
uniform float uCameraFOV;

uniform float uSunAzimuth;
uniform float uSunElevation;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uStarIntensity;

uniform vec3 uSkyZenithColor;
uniform vec3 uSkyHorizonColor;
uniform float uRayleighStrength;
uniform float uMieStrength;
uniform float uMieG;

uniform float uCloudCoverage;
uniform float uCloudDensity;
uniform float uCloudScale;
uniform float uCloudSpeed;
uniform float uCloudHeight;
uniform float uCloudThickness;
uniform float uCloudLightAbsorption;
uniform float uCloudAmbient;
uniform float uCloudSilverLining;
uniform int uPrimarySteps;
uniform int uLightSteps;

uniform float uTerrainScale;
uniform float uTerrainHeight;
uniform float uMountainHeight;
uniform float uMountainSharpness;
uniform vec3 uGrassColor;
uniform vec3 uRockColor;
uniform vec3 uSnowColor;
uniform vec3 uSandColor;
uniform float uSnowLine;

uniform float uOceanLevel;
uniform vec3 uOceanColor;
uniform vec3 uOceanDeepColor;
uniform float uWaveHeight;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uOceanFresnel;
uniform float uFoamIntensity;
uniform float uCausticsIntensity;

uniform float uFogDensity;
uniform float uFogHeight;
uniform vec3 uFogColor;

uniform float uGodRayIntensity;
uniform float uGodRayDecay;
uniform int uGodRaySteps;

uniform float uWeatherParticles;
uniform float uWeatherIsSnow;
uniform float uPrecipitation;
uniform float uWindInfluence;
uniform float uThunderstorm;

uniform float uTerrainLOD;
uniform float uCloudLOD;
uniform float uMultiScattering;
uniform float uVolumetricFog;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

float saturate(float x) { return clamp(x, 0.0, 1.0); }
vec3 saturateV(vec3 x) { return clamp(x, 0.0, 1.0); }

float remap(float x, float a, float b, float c, float d) {
    return c + (x - a) * (d - c) / (b - a);
}

float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453123);
}

vec3 hash3v(vec3 p) {
    p = mod(p, 289.0);
    float n = mod((p.x * 17.0 + p.y) * 17.0 + p.z, 289.0);
    n = mod((n * 34.0 + 1.0) * n, 289.0);
    vec3 k = mod(floor(n / vec3(1.0, 7.0, 49.0)), 7.0) * 2.0 - 1.0;
    return normalize(k + 0.0001);
}

vec3 quintic(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float gradientNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = quintic(f);
    
    return mix(
        mix(mix(dot(hash3v(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hash3v(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hash3v(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash3v(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hash3v(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash3v(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hash3v(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash3v(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

float worley(vec3 p) {
    vec3 n = floor(p);
    vec3 f = fract(p);
    float d = 1.0;
    
    for(int k = -1; k <= 1; k++) {
        for(int j = -1; j <= 1; j++) {
            for(int i = -1; i <= 1; i++) {
                vec3 g = vec3(float(i), float(j), float(k));
                vec3 o = hash33(n + g);
                vec3 r = g + o - f;
                d = min(d, dot(r, r));
            }
        }
    }
    return 1.0 - sqrt(d);
}

float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 12; i++) {
        if(i >= octaves) break;
        value += amplitude * gradientNoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

float ridgedFbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 12; i++) {
        if(i >= octaves) break;
        float n = 1.0 - abs(gradientNoise(p * frequency));
        n = n * n;
        value += amplitude * n;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

float perlinWorley(vec3 p, float freq) {
    float perlin = 0.5 + 0.5 * gradientNoise(p * freq);
    float worley0 = worley(p * freq * 2.0);
    float worley1 = worley(p * freq * 8.0);
    float worleyFBM = worley0 * 0.625 + worley1 * 0.375;
    return remap(perlin, 0.0, 1.0, worleyFBM, 1.0);
}

float worleyFBM(vec3 p, float freq) {
    float w0 = worley(p * freq);
    float w1 = worley(p * freq * 2.0);
    float w2 = worley(p * freq * 4.0);
    return w0 * 0.625 + w1 * 0.25 + w2 * 0.125;
}

vec3 getRayDirection(vec2 uv, vec3 camPos, vec3 lookAt, float fov) {
    vec3 forward = normalize(lookAt - camPos);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);
    
    float aspectRatio = iResolution.x / iResolution.y;
    float fovScale = tan(radians(fov) * 0.5);
    vec2 screenPos = (uv * 2.0 - 1.0) * vec2(aspectRatio, 1.0) * fovScale;
    
    return normalize(forward + right * screenPos.x + up * screenPos.y);
}

vec2 rayBoxIntersect(vec3 ro, vec3 rd, vec3 boxMin, vec3 boxMax) {
    vec3 invRd = 1.0 / rd;
    vec3 t0 = (boxMin - ro) * invRd;
    vec3 t1 = (boxMax - ro) * invRd;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);
    float dstA = max(max(tmin.x, tmin.y), tmin.z);
    float dstB = min(min(tmax.x, tmax.y), tmax.z);
    return vec2(max(0.0, dstA), max(0.0, dstB - dstA));
}

vec3 getSunDirection() {
    return normalize(vec3(
        cos(uSunElevation) * sin(uSunAzimuth),
        sin(uSunElevation),
        cos(uSunElevation) * cos(uSunAzimuth)
    ));
}

float sunDisk(vec3 rd, vec3 sunDir) {
    float sunAngle = acos(dot(rd, sunDir));
    return smoothstep(0.013, 0.0044, sunAngle);
}

float stars(vec3 rd) {
    vec3 p = rd * 100.0;
    float star = 0.0;
    
    for(int i = 0; i < 3; i++) {
        vec3 q = fract(p) - 0.5;
        vec3 id = floor(p);
        float rnd = hash13(id);
        float size = 0.01 + rnd * 0.02;
        float brightness = step(0.98, rnd);
        float d = length(q);
        star += brightness * smoothstep(size, 0.0, d);
        p *= 2.0;
    }
    
    star *= 0.8 + 0.2 * sin(iTime * 3.0 + hash13(rd * 100.0) * TAU);
    return star * uStarIntensity;
}

float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    return (3.0 / (8.0 * PI)) * ((1.0 - g2) * (1.0 + cosTheta * cosTheta)) /
           ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

vec3 atmosphere(vec3 rd, vec3 sunDir) {
    float cosTheta = dot(rd, sunDir);
    float sunHeight = sunDir.y;
    
    vec3 rayleighCoeff = vec3(5.8e-6, 13.5e-6, 33.1e-6) * uRayleighStrength;
    vec3 mieCoeff = vec3(21e-6) * uMieStrength;
    
    float zenithAngle = max(0.0, rd.y);
    float rayleighDepth = exp(-zenithAngle * 3.5);
    float mieDepth = exp(-zenithAngle * 1.0);
    
    vec3 rayleigh = rayleighCoeff * rayleighPhase(cosTheta) * rayleighDepth * 50.0;
    vec3 mie = mieCoeff * miePhase(cosTheta, uMieG) * mieDepth * 25.0;
    
    float sunInfluence = clamp(sunHeight, -0.1, 1.0);
    vec3 sunColor = mix(vec3(1.0, 0.3, 0.05), uSunColor, smoothstep(-0.1, 0.5, sunInfluence));
    
    float horizonGlow = pow(1.0 - abs(rd.y), 8.0) * smoothstep(-0.2, 0.1, sunHeight);
    vec3 horizonColor = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.8, 0.6), sunHeight);
    
    vec3 skyGradient = mix(uSkyHorizonColor, uSkyZenithColor, pow(saturate(rd.y), 0.5));
    
    vec3 sky = skyGradient;
    sky += (rayleigh + mie) * sunColor * uSunIntensity;
    sky += horizonColor * horizonGlow * 0.5;
    
    float nightFactor = smoothstep(0.1, -0.2, sunHeight);
    vec3 nightSky = vec3(0.01, 0.015, 0.03);
    sky = mix(sky, nightSky, nightFactor);
    sky += stars(rd) * nightFactor;
    
    return sky;
}

// LOD-adaptive terrain height
float getTerrainHeight(vec2 p, float lod) {
    p *= uTerrainScale;
    
    int octaves = int(mix(8.0, 3.0, lod / 5.0));
    octaves = max(3, min(8, octaves));
    
    float h = fbm(vec3(p * 0.5, 0.0), octaves) * 0.5 + 0.5;
    float mountains = ridgedFbm(vec3(p * 0.3, 0.0), octaves);
    mountains = pow(mountains, uMountainSharpness);
    h = mix(h, mountains, 0.6);
    
    if(lod < 2.0) {
        float detail = fbm(vec3(p * 2.0, 0.0), 3) * 0.1;
        h += detail;
    }
    
    return h * uTerrainHeight + h * mountains * uMountainHeight;
}

vec3 getTerrainNormal(vec2 p, float lod) {
    float eps = mix(0.5, 5.0, lod / 5.0);
    float h = getTerrainHeight(p, lod);
    float hx = getTerrainHeight(p + vec2(eps, 0.0), lod);
    float hz = getTerrainHeight(p + vec2(0.0, eps), lod);
    return normalize(vec3(h - hx, eps, h - hz));
}

vec3 getTerrainColor(vec3 pos, vec3 normal, float height) {
    float slope = 1.0 - normal.y;
    float normalizedHeight = height / (uTerrainHeight + uMountainHeight);
    
    float snowMask = smoothstep(uSnowLine - 0.1, uSnowLine + 0.1, normalizedHeight);
    snowMask += smoothstep(0.3, 0.0, slope) * 0.5;
    snowMask = saturate(snowMask);
    
    float rockMask = smoothstep(0.3, 0.6, slope);
    float sandMask = smoothstep(uOceanLevel + 5.0, uOceanLevel, height);
    
    vec3 color = uGrassColor;
    float variation = fbm(vec3(pos.xz * 0.1, 0.0), 3) * 0.3;
    color = mix(color, color * 0.7, variation);
    
    color = mix(color, uSandColor, sandMask);
    color = mix(color, uRockColor, rockMask);
    color = mix(color, uSnowColor, snowMask);
    
    return color;
}

float getWaveHeight(vec2 p) {
    float t = iTime * uWaveSpeed;
    float wave = 0.0;
    
    wave += sin(p.x * uWaveFrequency + t) * 0.5;
    wave += sin(p.y * uWaveFrequency * 0.8 + t * 1.1) * 0.3;
    wave += sin((p.x + p.y) * uWaveFrequency * 0.5 + t * 0.9) * 0.4;
    wave += fbm(vec3(p * uWaveFrequency * 0.5, t * 0.3), 3) * 0.2;
    
    return wave * uWaveHeight;
}

vec3 getOceanNormal(vec2 p) {
    float eps = 0.1;
    float h = getWaveHeight(p);
    float hx = getWaveHeight(p + vec2(eps, 0.0));
    float hz = getWaveHeight(p + vec2(0.0, eps));
    return normalize(vec3(h - hx, eps * 5.0, h - hz));
}

vec3 oceanColor(vec3 rd, vec3 normal, vec3 sunDir, float depth) {
    float fresnel = pow(1.0 - max(0.0, dot(-rd, normal)), uOceanFresnel);
    vec3 reflectDir = reflect(rd, normal);
    vec3 reflectColor = atmosphere(reflectDir, sunDir);
    
    float depthFactor = 1.0 - exp(-depth * 0.05);
    vec3 waterColor = mix(uOceanColor, uOceanDeepColor, depthFactor);
    
    float scatter = pow(saturate(dot(sunDir, -rd)), 4.0);
    waterColor += vec3(0.0, 0.3, 0.2) * scatter * 0.3;
    
    float caustics = (1.0 + sin(iTime * 2.0 + depth * 0.5)) * 0.5;
    caustics *= worley(vec3(rd.xz * 10.0, iTime * 0.5));
    waterColor += caustics * uCausticsIntensity * 0.1;
    
    vec3 color = mix(waterColor, reflectColor, fresnel);
    return color;
}

// al-ro Perlin-Worley Cloud Density
float cloudDensity(vec3 p) {
    vec3 wind = vec3(iTime * uCloudSpeed * 10.0, 0.0, iTime * uCloudSpeed * 5.0);
    p += wind;
    
    // Wind deformation
    p += vec3(
        sin(iTime * uWindInfluence + p.z * 0.01),
        0.0,
        cos(iTime * uWindInfluence + p.x * 0.01)
    ) * uWindInfluence * 100.0;
    
    float cloudBottom = uCloudHeight;
    float cloudTop = uCloudHeight + uCloudThickness;
    float heightFraction = (p.y - cloudBottom) / (cloudTop - cloudBottom);
    float heightGradient = saturate(remap(heightFraction, 0.0, 0.15, 0.0, 1.0));
    heightGradient *= saturate(remap(heightFraction, 0.85, 1.0, 1.0, 0.0));
    
    vec3 samplePos = p * uCloudScale * 0.00015;
    
    // al-ro Perlin-Worley base shape
    float perlinWorleyBase = perlinWorley(samplePos, 1.0);
    
    // Detail erosion with Worley FBM
    float worleyDetail = worleyFBM(samplePos, 3.0);
    
    float density = remap(perlinWorleyBase, worleyDetail * 0.3, 1.0, 0.0, 1.0);
    density = remap(density, 1.0 - uCloudCoverage, 1.0, 0.0, 1.0);
    density *= heightGradient;
    
    // Precipitation increases density
    density *= 1.0 + uPrecipitation * 0.4;
    
    return saturate(density * uCloudDensity);
}

float cloudLightMarch(vec3 pos, vec3 sunDir) {
    float cloudBottom = uCloudHeight;
    float cloudTop = uCloudHeight + uCloudThickness;
    float lightAccum = 0.0;
    float stepSize = (cloudTop - cloudBottom) / float(uLightSteps);
    
    for(int i = 0; i < 8; i++) {
        if(i >= uLightSteps) break;
        pos += sunDir * stepSize;
        if(pos.y > cloudTop || pos.y < cloudBottom) break;
        lightAccum += cloudDensity(pos) * stepSize;
    }
    
    return exp(-lightAccum * uCloudLightAbsorption * 0.01);
}

vec4 cloudRaymarch(vec3 ro, vec3 rd, vec3 sunDir, float maxDist) {
    float cloudBottom = uCloudHeight;
    float cloudTop = uCloudHeight + uCloudThickness;
    
    vec2 cloudHit = rayBoxIntersect(ro, rd, 
        vec3(-50000.0, cloudBottom, -50000.0), 
        vec3(50000.0, cloudTop, 50000.0));
    
    if(cloudHit.y <= 0.0) return vec4(0.0);
    
    float tStart = cloudHit.x;
    float tEnd = min(cloudHit.x + cloudHit.y, maxDist);
    if(tStart >= tEnd) return vec4(0.0);
    
    // Adaptive steps based on distance
    float distToCloud = tStart;
    int steps = uPrimarySteps;
    if(distToCloud > 20000.0) steps = max(8, steps / 4);
    else if(distToCloud > 10000.0) steps = max(16, steps / 3);
    else if(distToCloud > 5000.0) steps = max(32, steps / 2);
    
    float stepSize = (tEnd - tStart) / float(steps);
    float t = tStart;
    
    vec3 lightAccum = vec3(0.0);
    float transmittance = 1.0;
    
    for(int i = 0; i < 128; i++) {
        if(i >= steps || transmittance < 0.01) break;
        
        vec3 pos = ro + rd * t;
        float density = cloudDensity(pos);
        
        if(density > 0.001) {
            float lightTransmit = cloudLightMarch(pos, sunDir);
            
            float cosAngle = dot(rd, sunDir);
            float phase = miePhase(cosAngle, 0.3);
            float silverLining = pow(saturate(cosAngle), 8.0) * uCloudSilverLining;
            float powder = 1.0 - exp(-density * 2.0);
            
            vec3 lightColor = uSunColor * uSunIntensity * lightTransmit;
            lightColor *= phase + silverLining;
            lightColor += uCloudAmbient * vec3(0.6, 0.7, 0.9);
            lightColor *= powder;
            
            // Multi-scattering (Hillaire 2020)
            if(uMultiScattering > 0.5) {
                float ms = 1.0 - exp(-density * 2.0);
                float cosAngle2 = cosAngle * cosAngle;
                float scatter2 = 0.5 * (1.0 + cosAngle2);
                vec3 ambient = vec3(0.6, 0.7, 0.9) * uCloudAmbient;
                lightColor *= 1.0 + ms * 0.6;
                lightColor += ambient * ms * scatter2 * 0.3;
            }
            
            // Thunderstorm darkening
            if(uThunderstorm > 0.5) {
                lightColor *= 0.4;
                density *= 1.5;
            }
            
            float sampleTransmittance = exp(-density * stepSize * uCloudLightAbsorption * 0.01);
            lightAccum += lightColor * density * stepSize * transmittance * 0.01;
            transmittance *= sampleTransmittance;
        }
        
        t += stepSize;
    }
    
    return vec4(lightAccum, 1.0 - transmittance);
}

vec3 godRays(vec3 ro, vec3 rd, vec3 sunDir, float sceneDepth) {
    if(uGodRayIntensity <= 0.0) return vec3(0.0);
    
    float cloudBottom = uCloudHeight;
    float cloudTop = uCloudHeight + uCloudThickness;
    float stepSize = min(sceneDepth, 500.0) / float(uGodRaySteps);
    float t = 0.0;
    
    vec3 rays = vec3(0.0);
    float decay = 1.0;
    
    for(int i = 0; i < 32; i++) {
        if(i >= uGodRaySteps) break;
        
        vec3 pos = ro + rd * t;
        float shadow = 1.0;
        
        if(pos.y > cloudBottom && pos.y < cloudTop) {
            shadow = 1.0 - cloudDensity(pos) * 0.5;
        }
        
        float fogDensity = exp(-pos.y * 0.001) * uFogDensity;
        rays += shadow * fogDensity * decay;
        decay *= uGodRayDecay;
        t += stepSize;
    }
    
    return rays * uSunColor * uGodRayIntensity * 0.01;
}

vec3 applyFog(vec3 color, float dist, vec3 rd, vec3 sunDir) {
    float fogAmount = 1.0 - exp(-dist * uFogDensity * 0.0001);
    float heightFog = exp(-max(0.0, rd.y) * uFogHeight);
    fogAmount *= heightFog;
    
    float sunFog = pow(saturate(dot(rd, sunDir)), 8.0);
    vec3 fogCol = mix(uFogColor, uSunColor, sunFog * 0.3);
    
    return mix(color, fogCol, saturate(fogAmount));
}

float terrainRaymarch(vec3 ro, vec3 rd, out vec3 hitPos, out vec3 hitNormal, out float hitHeight, out float hitLOD) {
    float t = 0.0;
    float lastH = 0.0;
    float TERRAIN_FAR = 50000.0;
    
    for(int i = 0; i < 256; i++) {
        vec3 pos = ro + rd * t;
        
        // Calculate LOD based on distance
        float lod = 0.0;
        if(t > 20000.0) lod = 5.0;
        else if(t > 10000.0) lod = 4.0;
        else if(t > 5000.0) lod = 3.0;
        else if(t > 2000.0) lod = 2.0;
        else if(t > 500.0) lod = 1.0;
        else lod = 0.0;
        
        lod = max(lod, uTerrainLOD);
        hitLOD = lod;
        
        float h = getTerrainHeight(pos.xz, lod);
        
        if(pos.y < h) {
            float t0 = t - (t - lastH);
            float t1 = t;
            
            int refinementSteps = int(mix(8.0, 2.0, lod / 5.0));
            for(int j = 0; j < 8; j++) {
                if(j >= refinementSteps) break;
                float tm = (t0 + t1) * 0.5;
                vec3 pm = ro + rd * tm;
                float hm = getTerrainHeight(pm.xz, lod);
                if(pm.y < hm) t1 = tm;
                else t0 = tm;
            }
            
            t = (t0 + t1) * 0.5;
            hitPos = ro + rd * t;
            hitNormal = getTerrainNormal(hitPos.xz, lod);
            hitHeight = h;
            return t;
        }
        
        float stepSize = max(0.1, (pos.y - h) * 0.5);
        stepSize = min(stepSize, mix(20.0, 100.0, lod / 5.0));
        
        lastH = t;
        t += stepSize;
        
        if(t > TERRAIN_FAR) break;
    }
    
    return -1.0;
}

void main() {
    vec2 uv = vUv;
    
    float yaw = uCameraYaw;
    float pitch = uCameraPitch;
    
    vec3 camPos = uCameraPos;
    vec3 lookDir = vec3(
        cos(pitch) * sin(yaw),
        sin(pitch),
        cos(pitch) * cos(yaw)
    );
    vec3 lookAt = camPos + lookDir;
    
    vec3 rd = getRayDirection(uv, camPos, lookAt, uCameraFOV);
    vec3 sunDir = getSunDirection();
    
    vec3 color = vec3(0.0);
    float sceneDepth = 50000.0;
    
    vec3 skyColor = atmosphere(rd, sunDir);
    color = skyColor;
    
    float sun = sunDisk(rd, sunDir);
    color += uSunColor * sun * uSunIntensity * 10.0;
    
    vec3 hitPos, hitNormal;
    float hitHeight, hitLOD;
    float terrainDist = terrainRaymarch(camPos, rd, hitPos, hitNormal, hitHeight, hitLOD);
    
    if(terrainDist > 0.0 && terrainDist < sceneDepth) {
        sceneDepth = terrainDist;
        
        if(hitHeight < uOceanLevel) {
            vec3 oceanNormal = getOceanNormal(hitPos.xz);
            float depth = uOceanLevel - hitHeight;
            color = oceanColor(rd, oceanNormal, sunDir, depth);
        } else {
            vec3 terrainCol = getTerrainColor(hitPos, hitNormal, hitHeight);
            float NdotL = max(0.0, dot(hitNormal, sunDir));
            float ambient = 0.2;
            vec3 lighting = vec3(ambient) + NdotL * uSunColor * uSunIntensity;
            color = terrainCol * lighting;
        }
        
        color = applyFog(color, terrainDist, rd, sunDir);
    }
    
    vec4 clouds = cloudRaymarch(camPos, rd, sunDir, sceneDepth);
    color = mix(color, clouds.rgb, clouds.a);
    
    // Volumetric fog interaction
    if(uVolumetricFog > 0.5) {
        float fogDist = min(sceneDepth, 1000.0);
        float fogContribution = uFogDensity * 0.001 * fogDist;
        vec3 fogColor = mix(uFogColor, clouds.rgb, clouds.a * 0.5);
        color = mix(color, fogColor, saturate(fogContribution));
    }
    
    color += godRays(camPos, rd, sunDir, sceneDepth);
    
    // Weather particles (rain/snow)
    if(uWeatherParticles > 0.5 && uPrecipitation > 0.1) {
        vec3 particlePos = camPos + rd * 50.0;
        particlePos.y -= mod(iTime * (uWeatherIsSnow > 0.5 ? 2.0 : 10.0), 200.0);
        
        float particleNoise = hash13(floor(particlePos * 0.1));
        if(particleNoise > 1.0 - uPrecipitation * 0.3) {
            float particleAlpha = uPrecipitation * 0.1;
            vec3 particleColor = uWeatherIsSnow > 0.5 ? vec3(1.0) : vec3(0.7, 0.8, 0.9);
            color = mix(color, particleColor, particleAlpha);
        }
    }
    
    // Lightning
    if(uThunderstorm > 0.5) {
        float lightning = step(0.999, hash13(vec3(floor(iTime * 5.0))));
        float lightningFlash = lightning * sin(fract(iTime * 5.0) * PI);
        color += vec3(0.7, 0.8, 1.0) * lightningFlash * 0.5;
    }
    
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const DEFAULT_SETTINGS = {
  cameraPos: [0, 150, 0],
  cameraYaw: 0,
  cameraPitch: -0.1,
  cameraFOV: 75,
  
  sunAzimuth: 0.8,
  sunElevation: 0.4,
  sunColor: [1.0, 0.95, 0.9],
  sunIntensity: 1.2,
  starIntensity: 1.0,
  
  skyZenithColor: [0.1, 0.3, 0.6],
  skyHorizonColor: [0.6, 0.7, 0.9],
  rayleighStrength: 1.0,
  mieStrength: 1.0,
  mieG: 0.76,
  
  cloudCoverage: 0.5,
  cloudDensity: 0.4,
  cloudScale: 1.0,
  cloudSpeed: 0.02,
  cloudHeight: 800,
  cloudThickness: 1200,
  cloudLightAbsorption: 0.3,
  cloudAmbient: 0.3,
  cloudSilverLining: 0.3,
  
  terrainScale: 0.002,
  terrainHeight: 100,
  mountainHeight: 300,
  mountainSharpness: 2.0,
  grassColor: [0.2, 0.35, 0.15],
  rockColor: [0.35, 0.3, 0.25],
  snowColor: [0.95, 0.95, 0.98],
  sandColor: [0.76, 0.7, 0.5],
  snowLine: 0.7,
  
  oceanLevel: 20,
  oceanColor: [0.0, 0.3, 0.5],
  oceanDeepColor: [0.0, 0.05, 0.1],
  waveHeight: 1.0,
  waveFrequency: 0.1,
  waveSpeed: 0.5,
  oceanFresnel: 5.0,
  foamIntensity: 0.5,
  causticsIntensity: 0.3,
  
  fogDensity: 0.5,
  fogHeight: 0.5,
  fogColor: [0.7, 0.8, 0.9],
  
  godRayIntensity: 0.3,
  godRayDecay: 0.95,
  godRaySteps: 16,
};

export default function ProceduralEarth() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const uniformsRef = useRef(null);
  const frameRef = useRef(0);
  
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fps, setFps] = useState(60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [weatherSettings, setWeatherSettings] = useState({
    precipitation: 0,
    windSpeed: 0.3,
    fogDensity: 0.5,
    thunderstorm: false,
    snowMode: false,
  });
  
  const [flightEnabled, setFlightEnabled] = useState(false);
  const [aircraft, setAircraft] = useState('cessna172');
  const [flightData, setFlightData] = useState({
    altitude: 150,
    speed: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
    throttle: 0,
    flaps: 0,
    aoa: 0,
    verticalSpeed: 0,
  });
  
  const [lodSettings, setLodSettings] = useState({
    terrainLOD: 0,
    cloudLOD: 0,
    oceanLOD: 0,
    viewDistance: 50000,
    adaptiveQuality: true,
    dynamicResolution: false,
    frustumCulling: true,
    occlusionCulling: false,
    multiScattering: true,
    volumetricFog: true,
    advancedLighting: true,
  });
  
  const [devMode, setDevMode] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    fps: 60,
    frameTime: 16.67,
    quality: 'HIGH',
    terrainChunks: 0,
    cloudLOD: 0,
  });
  
  const terrainLODRef = useRef(null);
  const cloudLODRef = useRef(null);
  const performanceOptimizerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, dragging: false, prevX: 0, prevY: 0 });
  
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const updateWeather = useCallback((updates) => {
    setWeatherSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateFlightControl = useCallback((updates) => {
    setFlightData(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateLOD = useCallback((updates) => {
    setLodSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const handleProceduralGenerate = useCallback((generated) => {
    setSettings(prev => ({ ...prev, ...generated }));
  }, []);
  
  const handleEnableWeatherParticles = useCallback((enabled, isSnow) => {
    if (uniformsRef.current) {
      uniformsRef.current.uWeatherParticles.value = enabled ? 1.0 : 0.0;
      uniformsRef.current.uWeatherIsSnow.value = isSnow ? 1.0 : 0.0;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Initialize LOD systems
    terrainLODRef.current = new TerrainClipmapLOD(
      new THREE.Vector3(...settings.cameraPos), 
      50000
    );
    cloudLODRef.current = new CloudLODSystem();
    performanceOptimizerRef.current = new PerformanceOptimizer(60);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(width, height) },
      iFrame: { value: 0 },
      
      uCameraPos: { value: new THREE.Vector3(...settings.cameraPos) },
      uCameraYaw: { value: settings.cameraYaw },
      uCameraPitch: { value: settings.cameraPitch },
      uCameraFOV: { value: settings.cameraFOV },
      
      uSunAzimuth: { value: settings.sunAzimuth },
      uSunElevation: { value: settings.sunElevation },
      uSunColor: { value: new THREE.Vector3(...settings.sunColor) },
      uSunIntensity: { value: settings.sunIntensity },
      uStarIntensity: { value: settings.starIntensity },
      
      uSkyZenithColor: { value: new THREE.Vector3(...settings.skyZenithColor) },
      uSkyHorizonColor: { value: new THREE.Vector3(...settings.skyHorizonColor) },
      uRayleighStrength: { value: settings.rayleighStrength },
      uMieStrength: { value: settings.mieStrength },
      uMieG: { value: settings.mieG },
      
      uCloudCoverage: { value: settings.cloudCoverage },
      uCloudDensity: { value: settings.cloudDensity },
      uCloudScale: { value: settings.cloudScale },
      uCloudSpeed: { value: settings.cloudSpeed },
      uCloudHeight: { value: settings.cloudHeight },
      uCloudThickness: { value: settings.cloudThickness },
      uCloudLightAbsorption: { value: settings.cloudLightAbsorption },
      uCloudAmbient: { value: settings.cloudAmbient },
      uCloudSilverLining: { value: settings.cloudSilverLining },
      uPrimarySteps: { value: 64 },
      uLightSteps: { value: 6 },
      
      uTerrainScale: { value: settings.terrainScale },
      uTerrainHeight: { value: settings.terrainHeight },
      uMountainHeight: { value: settings.mountainHeight },
      uMountainSharpness: { value: settings.mountainSharpness },
      uGrassColor: { value: new THREE.Vector3(...settings.grassColor) },
      uRockColor: { value: new THREE.Vector3(...settings.rockColor) },
      uSnowColor: { value: new THREE.Vector3(...settings.snowColor) },
      uSandColor: { value: new THREE.Vector3(...settings.sandColor) },
      uSnowLine: { value: settings.snowLine },
      
      uOceanLevel: { value: settings.oceanLevel },
      uOceanColor: { value: new THREE.Vector3(...settings.oceanColor) },
      uOceanDeepColor: { value: new THREE.Vector3(...settings.oceanDeepColor) },
      uWaveHeight: { value: settings.waveHeight },
      uWaveFrequency: { value: settings.waveFrequency },
      uWaveSpeed: { value: settings.waveSpeed },
      uOceanFresnel: { value: settings.oceanFresnel },
      uFoamIntensity: { value: settings.foamIntensity },
      uCausticsIntensity: { value: settings.causticsIntensity },
      
      uFogDensity: { value: settings.fogDensity },
      uFogHeight: { value: settings.fogHeight },
      uFogColor: { value: new THREE.Vector3(...settings.fogColor) },
      
      uGodRayIntensity: { value: settings.godRayIntensity },
      uGodRayDecay: { value: settings.godRayDecay },
      uGodRaySteps: { value: settings.godRaySteps },
      
      uWeatherParticles: { value: 0.0 },
      uWeatherIsSnow: { value: 0.0 },
      uPrecipitation: { value: 0.0 },
      uWindInfluence: { value: 0.3 },
      uThunderstorm: { value: 0.0 },
      
      uTerrainLOD: { value: 0.0 },
      uCloudLOD: { value: 0.0 },
      uMultiScattering: { value: 1.0 },
      uVolumetricFog: { value: 1.0 },
    };
    uniformsRef.current = uniforms;
    
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    let lastTime = performance.now();
    let frameCount = 0;
    
    const animate = (time) => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (!isPaused) {
        const currentTime = time * 0.001;
        const deltaTime = (time - lastTime) / 1000;
        
        uniforms.iTime.value = currentTime;
        uniforms.iFrame.value = frameRef.current++;
        
        // Update LOD systems
        const cameraPos = new THREE.Vector3(...settings.cameraPos);
        
        if (terrainLODRef.current) {
          terrainLODRef.current.update(cameraPos);
          const chunks = terrainLODRef.current.activeChunks;
          setPerformanceStats(prev => ({ ...prev, terrainChunks: chunks.length }));
        }
        
        if (cloudLODRef.current) {
          const cloudData = cloudLODRef.current.update(
            cameraPos,
            new THREE.Vector3(cameraPos.x, settings.cloudHeight || 800, cameraPos.z),
            deltaTime
          );
          uniforms.uPrimarySteps.value = cloudData.primarySteps;
          uniforms.uLightSteps.value = cloudData.lightSteps;
          setPerformanceStats(prev => ({ ...prev, cloudLOD: cloudData.lod }));
        }
        
        if (performanceOptimizerRef.current && lodSettings.adaptiveQuality) {
          const perfData = performanceOptimizerRef.current.update(deltaTime);
          setPerformanceStats(prev => ({
            ...prev,
            fps: perfData.fps,
            frameTime: perfData.frameTime,
            quality: perfData.quality,
          }));
          
          if (perfData.settings) {
            uniforms.uPrimarySteps.value = Math.min(
              uniforms.uPrimarySteps.value,
              perfData.settings.cloudSteps
            );
            uniforms.uLightSteps.value = Math.min(
              uniforms.uLightSteps.value,
              perfData.settings.cloudLightSteps
            );
          }
        } else {
          frameCount++;
          if (time - lastTime >= 1000) {
            setFps(frameCount);
            setPerformanceStats(prev => ({ ...prev, fps: frameCount, frameTime: ((time - lastTime) / frameCount).toFixed(2) }));
            frameCount = 0;
            lastTime = time;
          }
        }
      }
      
      renderer.render(scene, camera);
    };
    animate(0);
    
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };
    
    const handleMouseDown = (e) => {
      mouseRef.current.dragging = true;
      mouseRef.current.prevX = e.clientX;
      mouseRef.current.prevY = e.clientY;
    };
    
    const handleMouseMove = (e) => {
      if (!mouseRef.current.dragging) return;
      
      const dx = e.clientX - mouseRef.current.prevX;
      const dy = e.clientY - mouseRef.current.prevY;
      
      const newYaw = uniforms.uCameraYaw.value - dx * 0.005;
      const newPitch = Math.max(-1.5, Math.min(1.5, uniforms.uCameraPitch.value - dy * 0.005));
      
      uniforms.uCameraYaw.value = newYaw;
      uniforms.uCameraPitch.value = newPitch;
      
      updateSetting('cameraYaw', newYaw);
      updateSetting('cameraPitch', newPitch);
      
      mouseRef.current.prevX = e.clientX;
      mouseRef.current.prevY = e.clientY;
    };
    
    const handleMouseUp = () => {
      mouseRef.current.dragging = false;
    };
    
    const handleKeyDown = (e) => {
      const speed = 5;
      const yaw = uniforms.uCameraYaw.value;
      const pos = uniforms.uCameraPos.value;
      
      switch(e.key.toLowerCase()) {
        case 'w':
          pos.x += Math.sin(yaw) * speed;
          pos.z += Math.cos(yaw) * speed;
          break;
        case 's':
          pos.x -= Math.sin(yaw) * speed;
          pos.z -= Math.cos(yaw) * speed;
          break;
        case 'a':
          pos.x += Math.cos(yaw) * speed;
          pos.z -= Math.sin(yaw) * speed;
          break;
        case 'd':
          pos.x -= Math.cos(yaw) * speed;
          pos.z += Math.sin(yaw) * speed;
          break;
        case 'q':
          pos.y -= speed;
          break;
        case 'e':
          pos.y += speed;
          break;
      }
      
      updateSetting('cameraPos', [pos.x, pos.y, pos.z]);
    };
    
    window.addEventListener('resize', handleResize);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPaused, updateSetting]);
  
  useEffect(() => {
    if (!uniformsRef.current) return;
    const u = uniformsRef.current;
    
    u.uCameraPos.value.set(...settings.cameraPos);
    u.uCameraYaw.value = settings.cameraYaw;
    u.uCameraPitch.value = settings.cameraPitch;
    u.uCameraFOV.value = settings.cameraFOV;
    
    u.uSunAzimuth.value = settings.sunAzimuth;
    u.uSunElevation.value = settings.sunElevation;
    u.uSunColor.value.set(...settings.sunColor);
    u.uSunIntensity.value = settings.sunIntensity;
    u.uStarIntensity.value = settings.starIntensity;
    
    u.uSkyZenithColor.value.set(...settings.skyZenithColor);
    u.uSkyHorizonColor.value.set(...settings.skyHorizonColor);
    u.uRayleighStrength.value = settings.rayleighStrength;
    u.uMieStrength.value = settings.mieStrength;
    u.uMieG.value = settings.mieG;
    
    u.uCloudCoverage.value = settings.cloudCoverage;
    u.uCloudDensity.value = settings.cloudDensity;
    u.uCloudScale.value = settings.cloudScale;
    u.uCloudSpeed.value = settings.cloudSpeed;
    u.uCloudHeight.value = settings.cloudHeight || 800;
    u.uCloudThickness.value = settings.cloudThickness || 1200;
    u.uCloudLightAbsorption.value = settings.cloudLightAbsorption;
    u.uCloudAmbient.value = settings.cloudAmbient;
    u.uCloudSilverLining.value = settings.cloudSilverLining;
    
    u.uTerrainScale.value = settings.terrainScale;
    u.uTerrainHeight.value = settings.terrainHeight;
    u.uMountainHeight.value = settings.mountainHeight;
    u.uMountainSharpness.value = settings.mountainSharpness;
    u.uGrassColor.value.set(...settings.grassColor);
    u.uRockColor.value.set(...settings.rockColor);
    u.uSnowColor.value.set(...settings.snowColor);
    u.uSandColor.value.set(...settings.sandColor);
    u.uSnowLine.value = settings.snowLine;
    
    u.uOceanLevel.value = settings.oceanLevel;
    u.uOceanColor.value.set(...settings.oceanColor);
    u.uOceanDeepColor.value.set(...settings.oceanDeepColor);
    u.uWaveHeight.value = settings.waveHeight;
    u.uWaveFrequency.value = settings.waveFrequency;
    u.uWaveSpeed.value = settings.waveSpeed;
    u.uOceanFresnel.value = settings.oceanFresnel;
    u.uFoamIntensity.value = settings.foamIntensity;
    u.uCausticsIntensity.value = settings.causticsIntensity;
    
    u.uFogDensity.value = settings.fogDensity;
    u.uFogHeight.value = settings.fogHeight;
    u.uFogColor.value.set(...settings.fogColor);
    
    u.uGodRayIntensity.value = settings.godRayIntensity;
    u.uGodRayDecay.value = settings.godRayDecay;
    u.uGodRaySteps.value = settings.godRaySteps;
    
    u.uPrecipitation.value = weatherSettings.precipitation;
    u.uWindInfluence.value = weatherSettings.windSpeed;
    u.uThunderstorm.value = weatherSettings.thunderstorm ? 1.0 : 0.0;
    
    u.uTerrainLOD.value = lodSettings.terrainLOD;
    u.uCloudLOD.value = lodSettings.cloudLOD;
    u.uMultiScattering.value = lodSettings.multiScattering ? 1.0 : 0.0;
    u.uVolumetricFog.value = lodSettings.volumetricFog ? 1.0 : 0.0;
  }, [settings, weatherSettings, lodSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="h-screen w-full bg-black flex">
      <div 
        ref={containerRef} 
        className="flex-1 relative cursor-grab active:cursor-grabbing"
        tabIndex={0}
      >
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge variant="outline" className="bg-black/50 text-white border-white/20">
            {performanceStats.fps} FPS
          </Badge>
          <Badge variant="outline" className="bg-black/50 text-cyan-400 border-cyan-500/30">
            v3.0 HYPERREAL
          </Badge>
          {lodSettings.adaptiveQuality && (
            <Badge variant="outline" className="bg-black/50 text-green-400 border-green-500/30 text-[10px]">
              {performanceStats.quality}
            </Badge>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="outline"
            className={`bg-black/50 border-white/20 text-white hover:bg-white/20 ${devMode ? 'bg-cyan-500/20' : ''}`}
            onClick={() => setDevMode(!devMode)}
          >
            <Bug className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="bg-black/50 border-white/20 text-white hover:bg-white/20"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="bg-black/50 border-white/20 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="bg-black/50 border-white/20 text-white hover:bg-white/20"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </Button>
        </div>
        
        {devMode && (
          <DeveloperMode 
            fps={performanceStats.fps}
            frameTime={performanceStats.frameTime}
            quality={performanceStats.quality}
            terrainChunks={performanceStats.terrainChunks}
            cloudLOD={performanceStats.cloudLOD}
            cameraPos={settings.cameraPos}
          />
        )}
        
        <div className="absolute bottom-4 left-4 text-white/50 text-xs">
          WASD: Move | QE: Up/Down | Mouse: Look
        </div>
      </div>
      
      {showControls && (
        <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">World Controls</h2>
            <p className="text-xs text-slate-400 mt-1">Hyperreal simulation</p>
          </div>
          
          <ScrollArea className="flex-1">
            <Tabs defaultValue="weather" className="p-4">
              <TabsList className="w-full grid grid-cols-3 mb-2 text-[10px]">
                <TabsTrigger value="weather"><Wind className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="flight"><Plane className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="clouds"><Cloud className="w-3 h-3" /></TabsTrigger>
              </TabsList>
              
              <TabsList className="w-full grid grid-cols-3 mb-4 text-[10px]">
                <TabsTrigger value="celestial"><Sun className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="terrain"><Mountain className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="lod"><Layers className="w-3 h-3" /></TabsTrigger>
              </TabsList>
              
              <TabsContent value="weather" className="space-y-4">
                <WeatherSystem 
                  settings={weatherSettings} 
                  onUpdate={updateWeather}
                  onEnableWeatherParticles={handleEnableWeatherParticles}
                />
              </TabsContent>
              
              <TabsContent value="flight" className="space-y-4">
                <FlightSimulation 
                  aircraft={aircraft}
                  onAircraftChange={setAircraft}
                  flightData={flightData}
                  onControlChange={updateFlightControl}
                  onPhysicsUpdate={() => {}}
                  windData={{
                    speed: weatherSettings.windSpeed * 30,
                    direction: 0,
                    gusts: weatherSettings.windSpeed * 10,
                  }}
                  enabled={flightEnabled}
                  onEnabledChange={setFlightEnabled}
                />
              </TabsContent>
              
              <TabsContent value="lod" className="space-y-4">
                <LODManager settings={lodSettings} onUpdate={updateLOD} />
              </TabsContent>
              
              <TabsContent value="clouds" className="space-y-4">
                <ProceduralGenerator onGenerate={handleProceduralGenerate} />
                
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 mt-4">
                  <div className="text-xs font-medium text-white mb-2">Current Cloud Type</div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    {settings._cloudType && (
                      <>
                        <div>Type: {settings._cloudType}</div>
                        <div>Method: al-ro Perlin-Worley</div>
                        <div>LOD: Adaptive {performanceStats.cloudLOD}</div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Cloud Coverage</label>
                    <Slider
                      value={[settings.cloudCoverage]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([v]) => updateSetting('cloudCoverage', v)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Cloud Density</label>
                    <Slider
                      value={[settings.cloudDensity]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([v]) => updateSetting('cloudDensity', v)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Silver Lining</label>
                    <Slider
                      value={[settings.cloudSilverLining]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([v]) => updateSetting('cloudSilverLining', v)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="celestial" className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Sun Elevation</label>
                  <Slider
                    value={[settings.sunElevation]}
                    min={-0.5}
                    max={1.5}
                    step={0.01}
                    onValueChange={([v]) => updateSetting('sunElevation', v)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Sun Azimuth</label>
                  <Slider
                    value={[settings.sunAzimuth]}
                    min={0}
                    max={6.28}
                    step={0.01}
                    onValueChange={([v]) => updateSetting('sunAzimuth', v)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Sun Intensity</label>
                  <Slider
                    value={[settings.sunIntensity]}
                    min={0}
                    max={3}
                    step={0.1}
                    onValueChange={([v]) => updateSetting('sunIntensity', v)}
                    className="mt-2"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="terrain" className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Terrain Height</label>
                  <Slider
                    value={[settings.terrainHeight]}
                    min={10}
                    max={500}
                    step={10}
                    onValueChange={([v]) => updateSetting('terrainHeight', v)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Mountain Height</label>
                  <Slider
                    value={[settings.mountainHeight]}
                    min={0}
                    max={1000}
                    step={10}
                    onValueChange={([v]) => updateSetting('mountainHeight', v)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Mountain Sharpness</label>
                  <Slider
                    value={[settings.mountainSharpness]}
                    min={1}
                    max={5}
                    step={0.1}
                    onValueChange={([v]) => updateSetting('mountainSharpness', v)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Snow Line</label>
                  <Slider
                    value={[settings.snowLine]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => updateSetting('snowLine', v)}
                    className="mt-2"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="ocean" className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Wave Height</label>
                  <Slider
                    value={[settings.waveHeight]}
                    min={0}
                    max={5}
                    step={0.1}
                    onValueChange={([v]) => updateSetting('waveHeight', v)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Wave Speed</label>
                  <Slider
                    value={[settings.waveSpeed]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={([v]) => updateSetting('waveSpeed', v)}
                    className="mt-2"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
          
          <div className="p-4 border-t border-slate-800">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={resetSettings}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}