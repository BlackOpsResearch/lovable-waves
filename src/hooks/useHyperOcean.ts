/**
 * Hyperrealistic Ocean Simulation Hook
 * Full-featured ocean with Gerstner waves, atmospheric sky, clouds, and god rays
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GLContextExtended, createGLContext } from '../lib/webgl/GLContext';
import { Cubemap } from '../lib/webgl/Cubemap';
import { Vector } from '../lib/webgl/Vector';
import { Raytracer } from '../lib/webgl/Raytracer';
import { OceanSimulation } from '../lib/ocean/OceanSimulation';
import { HyperOceanRenderer } from '../lib/ocean/HyperOceanRenderer';
import { CloudRenderer, CloudSettings, DEFAULT_CLOUD_SETTINGS } from '../lib/ocean/CloudRenderer';
import { 
  OceanSettings, 
  DEFAULT_OCEAN_SETTINGS, 
  OCEAN_PRESETS 
} from '../lib/ocean/OceanConfig';
import { createTileTexture, createSkyboxTextures } from '../lib/webgl/TextureGenerators';

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
  const simulationRef = useRef<OceanSimulation | null>(null);
  const rendererRef = useRef<HyperOceanRenderer | null>(null);
  const cloudRendererRef = useRef<CloudRenderer | null>(null);
  const skyRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number>(0);
  
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
  const angleXRef = useRef(-15);
  const angleYRef = useRef(-160);
  const cameraDistRef = useRef(5);
  
  // Sphere physics
  const sphereCenterRef = useRef(new Vector(0, 0.3, 0));
  const sphereVelocityRef = useRef(new Vector(0, 0, 0));
  const oldCenterRef = useRef(new Vector(0, 0.3, 0));
  const useSpherePhysicsRef = useRef(false);
  
  // Interaction
  const modeRef = useRef(-1);
  const prevHitRef = useRef<Vector | null>(null);
  const planeNormalRef = useRef<Vector | null>(null);
  const oldPosRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsTimeRef = useRef(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const gl = createGLContext(canvas);
      glRef.current = gl;

      const tileCanvas = createTileTexture();
      simulationRef.current = new OceanSimulation(gl, state.settings.simulationResolution);
      rendererRef.current = new HyperOceanRenderer(gl, tileCanvas, state.settings);
      cloudRendererRef.current = new CloudRenderer(gl, state.cloudSettings);
      
      // Create sky cubemap
      const skyTextures = createSkyboxTextures();
      skyRef.current = new Cubemap(gl, skyTextures);

      // Add initial ripples
      for (let i = 0; i < 10; i++) {
        simulationRef.current.addDrop(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          0.05,
          i % 2 === 0 ? 0.015 : -0.015
        );
      }
      
      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Failed to initialize ocean simulation:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  }, [canvasRef, state.settings, state.cloudSettings]);

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
    gl.perspective(45, canvas.width / canvas.height, 0.01, 1000);
    gl.matrixMode(gl.MODELVIEW);
  }, [canvasRef]);

  const render = useCallback((timestamp: number) => {
    const gl = glRef.current;
    const simulation = simulationRef.current;
    const renderer = rendererRef.current;
    const cloudRenderer = cloudRendererRef.current;
    const sky = skyRef.current;
    
    if (!gl || !simulation || !renderer || !sky) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;
    
    // FPS calculation
    frameCountRef.current++;
    if (timestamp - fpsTimeRef.current > 1000) {
      setState(prev => ({ ...prev, fps: frameCountRef.current }));
      frameCountRef.current = 0;
      fpsTimeRef.current = timestamp;
    }

    // Update camera
    const angleX = angleXRef.current * Math.PI / 180;
    const angleY = angleYRef.current * Math.PI / 180;
    const camDist = cameraDistRef.current;
    
    gl.matrixMode(gl.PROJECTION);
    gl.loadIdentity();
    gl.perspective(45, gl.canvas.width / gl.canvas.height, 0.01, 1000);
    gl.matrixMode(gl.MODELVIEW);
    gl.loadIdentity();
    gl.translate(0, 0, -camDist);
    gl.rotate(-angleX * 180 / Math.PI, 1, 0, 0);
    gl.rotate(-angleY * 180 / Math.PI, 0, 1, 0);
    gl.translate(0, 0.5, 0);

    if (!pausedRef.current) {
      // Physics update
      if (modeRef.current !== MODE_MOVE_SPHERE && useSpherePhysicsRef.current) {
        const gravity = new Vector(0, -4, 0);
        const sphereRadius = 0.25;
        const center = sphereCenterRef.current;
        const velocity = sphereVelocityRef.current;

        // Buoyancy
        if (center.y < 0.2) {
          const submerged = Math.min(1, (0.2 - center.y) / (sphereRadius * 2));
          velocity.y += submerged * 10 * deltaTime;
        }
        
        velocity.add(gravity.multiply(deltaTime));
        velocity.multiply(0.99); // Drag
        center.add(velocity.multiply(deltaTime));

        // Bounds
        if (center.y < -0.5) { center.y = -0.5; velocity.y *= -0.3; }
        if (center.y > 2) { center.y = 2; velocity.y = 0; }
        center.x = Math.max(-0.9, Math.min(0.9, center.x));
        center.z = Math.max(-0.9, Math.min(0.9, center.z));
      }

      simulation.moveSphere(oldCenterRef.current, sphereCenterRef.current, 0.25);
      oldCenterRef.current = sphereCenterRef.current.clone();
      simulation.update(deltaTime);
      renderer.update(deltaTime);
      renderer.updateCaustics(simulation);
      
      if (cloudRenderer) {
        cloudRenderer.update(deltaTime);
        cloudRenderer.setSunDirection(renderer.sunDirection);
      }
    }

    renderer.sphereCenter = sphereCenterRef.current;
    renderer.sphereRadius = 0.25;

    // Clear and render
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Render sky
    renderer.renderSky();
    
    // Render clouds
    if (cloudRenderer && state.cloudSettings.enabled) {
      const tracer = new Raytracer(gl);
      cloudRenderer.render(tracer);
    }
    
    // Render water
    renderer.renderWater(simulation, sky);
    
    // Render sphere
    renderer.renderSphere(simulation);

    animationRef.current = requestAnimationFrame(render);
  }, [state.cloudSettings.enabled]);

  const handlePointerStart = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const simulation = simulationRef.current;
    const renderer = rendererRef.current;
    if (!gl || !simulation || !renderer) return;
    
    oldPosRef.current = { x, y };
    const ratio = window.devicePixelRatio || 1;
    
    const tracer = new Raytracer(gl);
    const ray = tracer.getRayForPixel(x * ratio, y * ratio);
    const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
    const sphereHitTest = Raytracer.hitTestSphere(tracer.eye, ray, sphereCenterRef.current, 0.25);
    
    if (sphereHitTest && sphereHitTest.hit) {
      modeRef.current = MODE_MOVE_SPHERE;
      prevHitRef.current = sphereHitTest.hit;
      planeNormalRef.current = tracer.getRayForPixel(gl.canvas.width / 2, gl.canvas.height / 2).negative();
    } else if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
      modeRef.current = MODE_ADD_DROPS;
      simulation.addDrop(pointOnPlane.x, pointOnPlane.z, 0.04, 0.02);
    } else {
      modeRef.current = MODE_ORBIT_CAMERA;
    }
  }, []);

  const handlePointerMove = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    const simulation = simulationRef.current;
    if (!gl || !simulation) return;
    
    const ratio = window.devicePixelRatio || 1;
    
    switch (modeRef.current) {
      case MODE_ADD_DROPS: {
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const pointOnPlane = tracer.eye.add(ray.multiply(-tracer.eye.y / ray.y));
        simulation.addDrop(pointOnPlane.x, pointOnPlane.z, 0.03, 0.015);
        break;
      }
      case MODE_MOVE_SPHERE: {
        if (!prevHitRef.current || !planeNormalRef.current) break;
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const t = -planeNormalRef.current.dot(tracer.eye.subtract(prevHitRef.current)) / planeNormalRef.current.dot(ray);
        const nextHit = tracer.eye.add(ray.multiply(t));
        sphereCenterRef.current = sphereCenterRef.current.add(nextHit.subtract(prevHitRef.current));
        sphereCenterRef.current.x = Math.max(-0.9, Math.min(0.9, sphereCenterRef.current.x));
        sphereCenterRef.current.y = Math.max(-0.9, Math.min(10, sphereCenterRef.current.y));
        sphereCenterRef.current.z = Math.max(-0.9, Math.min(0.9, sphereCenterRef.current.z));
        prevHitRef.current = nextHit;
        break;
      }
      case MODE_ORBIT_CAMERA: {
        angleYRef.current -= (x - oldPosRef.current.x) * 0.5;
        angleXRef.current -= (y - oldPosRef.current.y) * 0.5;
        angleXRef.current = Math.max(-89, Math.min(89, angleXRef.current));
        break;
      }
    }
    
    oldPosRef.current = { x, y };
  }, []);

  const handlePointerEnd = useCallback(() => {
    modeRef.current = -1;
  }, []);

  const handleWheel = useCallback((deltaY: number) => {
    cameraDistRef.current = Math.max(2, Math.min(20, cameraDistRef.current + deltaY * 0.01));
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
      rendererRef.current.updateSettings(preset as OceanSettings);
      setState(prev => ({ 
        ...prev, 
        currentPreset: presetName,
        settings: preset as OceanSettings
      }));
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<OceanSettings>) => {
    if (rendererRef.current) {
      rendererRef.current.updateSettings(settings);
      setState(prev => ({ 
        ...prev, 
        settings: { ...prev.settings, ...settings } 
      }));
    }
  }, []);

  const updateCloudSettings = useCallback((settings: Partial<CloudSettings>) => {
    if (cloudRendererRef.current) {
      cloudRendererRef.current.updateSettings(settings);
      setState(prev => ({ 
        ...prev, 
        cloudSettings: { ...prev.cloudSettings, ...settings } 
      }));
    }
  }, []);

  const setSunPosition = useCallback((elevation: number, azimuth: number) => {
    if (rendererRef.current) {
      rendererRef.current.setSunPosition(elevation, azimuth);
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
    init();
    window.addEventListener('resize', resize);
    resize();
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [init, render, resize]);

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
