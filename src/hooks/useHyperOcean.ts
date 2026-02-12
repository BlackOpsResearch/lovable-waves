/**
 * Hyperrealistic Ocean Simulation Hook
 * Now powered by OPUS SWE Engine with PBR rendering
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GLContextExtended, createGLContext } from '../lib/webgl/GLContext';
import { Vector } from '../lib/webgl/Vector';
import { Raytracer } from '../lib/webgl/Raytracer';
import { OpusEngine } from '../lib/opus/OpusEngine';
import { DEFAULT_OPUS_CONFIG } from '../lib/opus/OpusConfig';
import { 
  OceanSettings, 
  DEFAULT_OCEAN_SETTINGS, 
  OCEAN_PRESETS,
  calculateSunPosition
} from '../lib/ocean/OceanConfig';
import { CloudSettings, DEFAULT_CLOUD_SETTINGS } from '../lib/ocean/CloudRenderer';

const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;
const MODE_ORBIT_CAMERA = 2;

export interface OceanState {
  isInitialized: boolean;
  error: string | null;
  isPaused: boolean;
  gravityEnabled: boolean;
  currentPreset: string;
  settings: OceanSettings;
  cloudSettings: CloudSettings;
  fps: number;
  debugMode: number;
  autoWaves: boolean;
  sheetEnabled: boolean;
  hullEnabled: boolean;
  sprayEnabled: boolean;
  gerstnerEnabled: boolean;
}

export function useHyperOcean(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const glRef = useRef<GLContextExtended | null>(null);
  const engineRef = useRef<OpusEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [state, setState] = useState<OceanState>({
    isInitialized: false,
    error: null,
    isPaused: false,
    gravityEnabled: false,
    currentPreset: 'moderate',
    settings: DEFAULT_OCEAN_SETTINGS,
    cloudSettings: DEFAULT_CLOUD_SETTINGS,
    fps: 0,
    debugMode: -1,
    autoWaves: true,
    sheetEnabled: true,
    hullEnabled: true,
    sprayEnabled: true,
    gerstnerEnabled: true,
  });
  
  // Camera
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200.5);
  const cameraDistRef = useRef(6);
  
  // Sphere physics
  const centerRef = useRef(new Vector(0, 0.5, 0));
  const oldCenterRef = useRef(new Vector(0, 0.5, 0));
  const velocityRef = useRef(new Vector());
  const gravityRef = useRef(new Vector(0, -4, 0));
  const radiusRef = useRef(1.5);
  const useSpherePhysicsRef = useRef(false);
  
  // Interaction
  const modeRef = useRef(-1);
  const prevHitRef = useRef<Vector | null>(null);
  const planeNormalRef = useRef<Vector | null>(null);
  const oldPosRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  const frameCountRef = useRef(0);
  const fpsTimeRef = useRef(0);

  const draw = useCallback(() => {
    const gl = glRef.current;
    const engine = engineRef.current;
    if (!gl || !engine) return;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.loadIdentity();
    gl.translate(0, 0, -cameraDistRef.current);
    gl.rotate(-angleXRef.current, 1, 0, 0);
    gl.rotate(-angleYRef.current, 0, 1, 0);
    gl.translate(0, 0.5, 0);
    
    // Update camera position for engine
    const tracer = new Raytracer(gl);
    engine.cameraPos = tracer.eye;
    
    engine.render();
  }, []);

  const update = useCallback((seconds: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (seconds > 1) return;
    
    // Sphere physics with GPU-readback buoyancy
    if (modeRef.current === MODE_MOVE_SPHERE) {
      velocityRef.current = new Vector();
    } else if (useSpherePhysicsRef.current) {
      const center = centerRef.current;
      const radius = radiusRef.current;
      
      // Read actual water height at sphere position from heightfield
      const waterHeight = engine.getHeightAt(center.x, center.z);
      
      // Calculate submersion based on actual wave surface
      const sphereBottom = center.y - radius;
      const submersionDepth = Math.max(0, waterHeight - sphereBottom);
      const percentUnderWater = Math.max(0, Math.min(1, submersionDepth / (2 * radius)));
      
      // Gravity
      velocityRef.current = velocityRef.current.add(
        gravityRef.current.multiply(seconds)
      );
      
      // Buoyancy force proportional to displaced volume (Archimedes)
      const buoyancyForce = percentUnderWater * 1.8 * 9.81; // ~1.8x water density compensation
      velocityRef.current.y += buoyancyForce * seconds;
      
      // Water drag (stronger when submerged)
      const dragCoeff = 0.5 + percentUnderWater * 3.0;
      const speed = velocityRef.current.length();
      if (speed > 0.001) {
        const dragForce = dragCoeff * speed * seconds;
        velocityRef.current = velocityRef.current.subtract(
          velocityRef.current.unit().multiply(Math.min(dragForce, speed * 0.9))
        );
      }
      
      // Apply velocity
      centerRef.current = center.add(velocityRef.current.multiply(seconds));
      
      // Wave-following: gently push sphere to match wave surface when floating
      if (percentUnderWater > 0.1 && percentUnderWater < 0.9) {
        const targetY = waterHeight + radius * 0.3; // float ~30% above surface
        const followStrength = 2.0 * seconds;
        centerRef.current.y += (targetY - centerRef.current.y) * followStrength;
      }
      
      // Hard floor
      if (centerRef.current.y < radius - 3) {
        centerRef.current.y = radius - 3;
        velocityRef.current.y = Math.abs(velocityRef.current.y) * 0.5;
      }
    }
    
    engine.moveSphere(oldCenterRef.current, centerRef.current, radiusRef.current);
    oldCenterRef.current = centerRef.current;
    
    // Step the OPUS SWE simulation
    engine.step(seconds);
  }, []);

  const resize = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;
    
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.matrixMode(gl.PROJECTION);
    gl.loadIdentity();
    gl.perspective(45, canvas.width / canvas.height, 0.01, 2000);
    gl.matrixMode(gl.MODELVIEW);
    draw();
  }, [canvasRef, draw]);

  const handlePointerStart = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const engine = engineRef.current;
    if (!gl || !engine) return;
    
    oldPosRef.current = { x, y };
    const ratio = window.devicePixelRatio || 1;
    const tracer = new Raytracer(gl);
    const ray = tracer.getRayForPixel(x * ratio, y * ratio);
    const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
    const sphereHitTest = Raytracer.hitTestSphere(tracer.eye, ray, centerRef.current, radiusRef.current);
    
    if (sphereHitTest && sphereHitTest.hit) {
      modeRef.current = MODE_MOVE_SPHERE;
      prevHitRef.current = sphereHitTest.hit;
      planeNormalRef.current = tracer.getRayForPixel(gl.canvas.width / 2, gl.canvas.height / 2).negative();
    } else if (ray.y < 0) {
      modeRef.current = MODE_ADD_DROPS;
      // Convert world click to normalized [-1,1] for addDrop
      const nx = pointOnPlane.x / (engine.config.hf.worldSize * 0.5);
      const nz = pointOnPlane.z / (engine.config.hf.worldSize * 0.5);
      if (Math.abs(nx) < 1 && Math.abs(nz) < 1) {
        engine.addDrop(nx, nz, 0.02, 0.015);
      }
    } else {
      modeRef.current = MODE_ORBIT_CAMERA;
    }
  }, []);

  const handlePointerMove = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const engine = engineRef.current;
    if (!gl || !engine) return;
    
    const ratio = window.devicePixelRatio || 1;
    
    switch (modeRef.current) {
      case MODE_ADD_DROPS: {
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
        const nx = pointOnPlane.x / (engine.config.hf.worldSize * 0.5);
        const nz = pointOnPlane.z / (engine.config.hf.worldSize * 0.5);
        if (Math.abs(nx) < 1 && Math.abs(nz) < 1) {
          engine.addDrop(nx, nz, 0.02, 0.015);
        }
        break;
      }
      case MODE_MOVE_SPHERE: {
        if (!prevHitRef.current || !planeNormalRef.current) break;
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const t = -planeNormalRef.current.dot(tracer.eye.subtract(prevHitRef.current)) / planeNormalRef.current.dot(ray);
        const nextHit = tracer.eye.add(ray.multiply(t));
        centerRef.current = centerRef.current.add(nextHit.subtract(prevHitRef.current));
        centerRef.current.y = Math.max(radiusRef.current - 1, Math.min(10, centerRef.current.y));
        prevHitRef.current = nextHit;
        break;
      }
      case MODE_ORBIT_CAMERA: {
        angleYRef.current -= x - oldPosRef.current.x;
        angleXRef.current -= y - oldPosRef.current.y;
        angleXRef.current = Math.max(-89.999, Math.min(89.999, angleXRef.current));
        break;
      }
    }
    oldPosRef.current = { x, y };
    if (pausedRef.current) draw();
  }, [draw]);

  const handlePointerEnd = useCallback(() => { modeRef.current = -1; }, []);
  const handleWheel = useCallback((deltaY: number) => {
    cameraDistRef.current = Math.max(2, Math.min(30, cameraDistRef.current + deltaY * 0.005));
  }, []);

  const toggleGravity = useCallback(() => {
    useSpherePhysicsRef.current = !useSpherePhysicsRef.current;
    setState(prev => ({ ...prev, gravityEnabled: useSpherePhysicsRef.current }));
    return useSpherePhysicsRef.current;
  }, []);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setState(prev => ({ ...prev, isPaused: pausedRef.current }));
    return pausedRef.current;
  }, []);

  const setPreset = useCallback((presetName: string) => {
    const preset = OCEAN_PRESETS[presetName as keyof typeof OCEAN_PRESETS];
    if (preset && engineRef.current) {
      const sunPos = calculateSunPosition(preset.atmosphere.sunElevation, preset.atmosphere.sunAzimuth);
      engineRef.current.setSunDirection(new Vector(sunPos[0], sunPos[1], sunPos[2]));
      setState(prev => ({ ...prev, currentPreset: presetName, settings: preset as OceanSettings }));
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<OceanSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } as OceanSettings }));
  }, []);

  const updateCloudSettings = useCallback((settings: Partial<CloudSettings>) => {
    setState(prev => ({ ...prev, cloudSettings: { ...prev.cloudSettings, ...settings } }));
  }, []);

  const setSunPosition = useCallback((elevation: number, azimuth: number) => {
    if (engineRef.current) {
      const sunPos = calculateSunPosition(elevation, azimuth);
      engineRef.current.setSunDirection(new Vector(sunPos[0], sunPos[1], sunPos[2]));
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, atmosphere: { ...prev.settings.atmosphere, sunElevation: elevation, sunAzimuth: azimuth } }
      }));
    }
  }, []);

  const setDebugMode = useCallback((mode: number) => {
    if (engineRef.current) {
      engineRef.current.setDebugMode(mode);
      setState(prev => ({ ...prev, debugMode: mode }));
    }
  }, []);

  const toggleAutoWaves = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.autoWavesEnabled = !engineRef.current.autoWavesEnabled;
      setState(prev => ({ ...prev, autoWaves: engineRef.current?.autoWavesEnabled ?? true }));
    }
  }, []);

  const toggleFeature = useCallback((feature: 'sheet' | 'hull' | 'spray' | 'gerstner') => {
    const engine = engineRef.current;
    if (!engine) return;
    switch (feature) {
      case 'sheet':
        engine.sheetEnabled = !engine.sheetEnabled;
        setState(prev => ({ ...prev, sheetEnabled: engine.sheetEnabled }));
        break;
      case 'hull':
        engine.hullEnabled = !engine.hullEnabled;
        setState(prev => ({ ...prev, hullEnabled: engine.hullEnabled }));
        break;
      case 'spray':
        engine.sprayEnabled = !engine.sprayEnabled;
        setState(prev => ({ ...prev, sprayEnabled: engine.sprayEnabled }));
        break;
      case 'gerstner':
        engine.gerstnerEnabled = !engine.gerstnerEnabled;
        setState(prev => ({ ...prev, gerstnerEnabled: engine.gerstnerEnabled }));
        break;
    }
  }, []);

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const gl = createGLContext(canvas);
      if (!gl) { setState(prev => ({ ...prev, error: 'WebGL not supported' })); return; }
      glRef.current = gl;
      gl.clearColor(0, 0, 0, 1);
      
      // Create OPUS engine
      const engine = new OpusEngine(gl, DEFAULT_OPUS_CONFIG);
      engineRef.current = engine;
      
      // Add initial waves
      for (let i = 0; i < 15; i++) {
        engine.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, (i & 1) ? 0.01 : -0.01);
      }
      
      setState(prev => ({ ...prev, isInitialized: true }));
      window.addEventListener('resize', resize);
      resize();
      
      let prevTime = Date.now();
      const animate = () => {
        const nextTime = Date.now();
        frameCountRef.current++;
        if (nextTime - fpsTimeRef.current > 1000) {
          setState(prev => ({ ...prev, fps: frameCountRef.current }));
          frameCountRef.current = 0;
          fpsTimeRef.current = nextTime;
        }
        if (!pausedRef.current) {
          update((nextTime - prevTime) / 1000);
          draw();
        }
        prevTime = nextTime;
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      
    } catch (err) {
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Unknown error' }));
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [draw, update, resize, canvasRef]);

  return {
    state, handlePointerStart, handlePointerMove, handlePointerEnd, handleWheel,
    toggleGravity, togglePause, setPreset, updateSettings, updateCloudSettings, setSunPosition,
    setDebugMode, toggleAutoWaves, toggleFeature,
  };
}

export default useHyperOcean;
