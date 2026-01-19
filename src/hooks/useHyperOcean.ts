/**
 * Hyperrealistic Ocean Simulation Hook
 * Full-featured ocean with Gerstner waves, atmospheric sky, and advanced effects
 * Based on the working WebGLWater implementation with enhanced rendering
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GLContextExtended, createGLContext } from '../lib/webgl/GLContext';
import { Cubemap } from '../lib/webgl/Cubemap';
import { Vector } from '../lib/webgl/Vector';
import { Raytracer } from '../lib/webgl/Raytracer';
import { Water } from '../lib/webgl/Water';
import { Renderer } from '../lib/webgl/Renderer';
import { 
  OceanSettings, 
  DEFAULT_OCEAN_SETTINGS, 
  OCEAN_PRESETS,
  calculateSunPosition
} from '../lib/ocean/OceanConfig';
import { CloudSettings, DEFAULT_CLOUD_SETTINGS } from '../lib/ocean/CloudRenderer';
import { 
  createTileTexture, 
  createSkyboxTextures,
  createSunsetSkyboxTextures,
  createStormySkyboxTextures,
  createTropicalSkyboxTextures
} from '../lib/webgl/TextureGenerators';

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
}

export function useHyperOcean(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const glRef = useRef<GLContextExtended | null>(null);
  const waterRef = useRef<Water | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cubemapRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // State
  const [state, setState] = useState<OceanState>({
    isInitialized: false,
    error: null,
    isPaused: false,
    gravityEnabled: false,
    currentPreset: 'moderate',
    settings: DEFAULT_OCEAN_SETTINGS,
    cloudSettings: DEFAULT_CLOUD_SETTINGS,
    fps: 0,
  });
  
  // Camera
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200.5);
  const cameraDistRef = useRef(4);
  
  // Sphere physics
  const centerRef = useRef(new Vector(-0.4, -0.75, 0.2));
  const oldCenterRef = useRef(new Vector(-0.4, -0.75, 0.2));
  const velocityRef = useRef(new Vector());
  const gravityRef = useRef(new Vector(0, -4, 0));
  const radiusRef = useRef(0.25);
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
    const water = waterRef.current;
    const renderer = rendererRef.current;
    const cubemap = cubemapRef.current;
    
    if (!gl || !water || !renderer || !cubemap) return;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.loadIdentity();
    gl.translate(0, 0, -cameraDistRef.current);
    gl.rotate(-angleXRef.current, 1, 0, 0);
    gl.rotate(-angleYRef.current, 0, 1, 0);
    gl.translate(0, 0.5, 0);
    
    gl.enable(gl.DEPTH_TEST);
    renderer.sphereCenter = centerRef.current;
    renderer.sphereRadius = radiusRef.current;
    renderer.renderCube(water);
    renderer.renderWater(water, cubemap);
    renderer.renderSphere(water);
    gl.disable(gl.DEPTH_TEST);
  }, []);

  const update = useCallback((seconds: number) => {
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!water || !renderer) return;
    
    if (seconds > 1) return;
    
    if (modeRef.current === MODE_MOVE_SPHERE) {
      velocityRef.current = new Vector();
    } else if (useSpherePhysicsRef.current) {
      const percentUnderWater = Math.max(0, Math.min(1, (radiusRef.current - centerRef.current.y) / (2 * radiusRef.current)));
      velocityRef.current = velocityRef.current.add(
        gravityRef.current.multiply(seconds - 1.1 * seconds * percentUnderWater)
      );
      velocityRef.current = velocityRef.current.subtract(
        velocityRef.current.unit().multiply(percentUnderWater * seconds * velocityRef.current.dot(velocityRef.current))
      );
      centerRef.current = centerRef.current.add(velocityRef.current.multiply(seconds));
      
      if (centerRef.current.y < radiusRef.current - 1) {
        centerRef.current.y = radiusRef.current - 1;
        velocityRef.current.y = Math.abs(velocityRef.current.y) * 0.7;
      }
    }
    
    water.moveSphere(oldCenterRef.current, centerRef.current, radiusRef.current);
    oldCenterRef.current = centerRef.current;
    
    water.stepSimulation();
    water.stepSimulation();
    water.updateNormals();
    renderer.updateCaustics(water);
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
    gl.perspective(45, canvas.width / canvas.height, 0.01, 100);
    gl.matrixMode(gl.MODELVIEW);
    
    draw();
  }, [canvasRef, draw]);

  const handlePointerStart = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!gl || !water || !renderer) return;
    
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
    } else if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
      modeRef.current = MODE_ADD_DROPS;
      water.addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
      if (pausedRef.current) {
        water.updateNormals();
        renderer.updateCaustics(water);
      }
    } else {
      modeRef.current = MODE_ORBIT_CAMERA;
    }
  }, []);

  const handlePointerMove = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!gl || !water || !renderer) return;
    
    const ratio = window.devicePixelRatio || 1;
    
    switch (modeRef.current) {
      case MODE_ADD_DROPS: {
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
        water.addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.01);
        if (pausedRef.current) {
          water.updateNormals();
          renderer.updateCaustics(water);
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
        centerRef.current.x = Math.max(radiusRef.current - 1, Math.min(1 - radiusRef.current, centerRef.current.x));
        centerRef.current.y = Math.max(radiusRef.current - 1, Math.min(10, centerRef.current.y));
        centerRef.current.z = Math.max(radiusRef.current - 1, Math.min(1 - radiusRef.current, centerRef.current.z));
        prevHitRef.current = nextHit;
        if (pausedRef.current) renderer.updateCaustics(water);
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

  const handlePointerEnd = useCallback(() => {
    modeRef.current = -1;
  }, []);

  const handleWheel = useCallback((deltaY: number) => {
    cameraDistRef.current = Math.max(2, Math.min(15, cameraDistRef.current + deltaY * 0.005));
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
    if (preset && rendererRef.current) {
      // Update sun position based on preset
      const sunPos = calculateSunPosition(
        preset.atmosphere.sunElevation, 
        preset.atmosphere.sunAzimuth
      );
      rendererRef.current.lightDir = new Vector(sunPos[0], sunPos[1], sunPos[2]).unit();
      
      setState(prev => ({ 
        ...prev, 
        currentPreset: presetName,
        settings: preset as OceanSettings
      }));
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<OceanSettings>) => {
    setState(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, ...settings } as OceanSettings
    }));
  }, []);

  const updateCloudSettings = useCallback((settings: Partial<CloudSettings>) => {
    setState(prev => ({ 
      ...prev, 
      cloudSettings: { ...prev.cloudSettings, ...settings } 
    }));
  }, []);

  const setSunPosition = useCallback((elevation: number, azimuth: number) => {
    if (rendererRef.current) {
      const sunPos = calculateSunPosition(elevation, azimuth);
      rendererRef.current.lightDir = new Vector(sunPos[0], sunPos[1], sunPos[2]).unit();
      
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          atmosphere: {
            ...prev.settings.atmosphere,
            sunElevation: elevation,
            sunAzimuth: azimuth,
          }
        }
      }));
    }
  }, []);

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const gl = createGLContext(canvas);
      if (!gl) {
        setState(prev => ({ ...prev, error: 'WebGL not supported' }));
        return;
      }
      glRef.current = gl;
      
      gl.clearColor(0, 0, 0, 1);
      
      // Create textures
      const tileCanvas = createTileTexture();
      const skyTextures = createSkyboxTextures();
      
      // Initialize water simulation
      const water = new Water(gl);
      waterRef.current = water;
      
      if (!water.textureA.canDrawTo() || !water.textureB.canDrawTo()) {
        throw new Error('Rendering to floating-point textures is required but not supported');
      }
      
      // Initialize renderer
      const renderer = new Renderer(gl, tileCanvas);
      rendererRef.current = renderer;
      
      // Initialize cubemap
      const cubemap = new Cubemap(gl, skyTextures);
      cubemapRef.current = cubemap;
      
      // Add initial drops
      for (let i = 0; i < 20; i++) {
        water.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, (i & 1) ? 0.01 : -0.01);
      }
      
      setState(prev => ({ ...prev, isInitialized: true }));
      
      // Set up resize handler
      window.addEventListener('resize', resize);
      resize();
      
      // Animation loop
      let prevTime = Date.now();
      const animate = () => {
        const nextTime = Date.now();
        
        // FPS calculation
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
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }));
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [draw, update, resize, canvasRef]);

  return {
    state,
    handlePointerStart,
    handlePointerMove,
    handlePointerEnd,
    handleWheel,
    toggleGravity,
    togglePause,
    setPreset,
    updateSettings,
    updateCloudSettings,
    setSunPosition,
  };
}

export default useHyperOcean;
