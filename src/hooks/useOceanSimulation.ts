/**
 * React hook for Ocean WebGL simulation
 * Integrates enhanced ocean simulation with atmospheric effects
 */

import { useCallback, useEffect, useRef } from 'react';
import { GLContextExtended, createGLContext } from '../lib/webgl/GLContext';
import { Cubemap } from '../lib/webgl/Cubemap';
import { Vector } from '../lib/webgl/Vector';
import { Raytracer, HitTest } from '../lib/webgl/Raytracer';
import { OceanSimulation, OceanSimulationSettings } from '../lib/ocean/OceanSimulation';
import { OceanRenderer, OceanRenderSettings } from '../lib/ocean/OceanRenderer';
import { createTileTexture, createSkyboxTextures } from '../lib/webgl/TextureGenerators';

export interface OceanSimulationOptions {
  simulation?: Partial<OceanSimulationSettings>;
  render?: Partial<OceanRenderSettings>;
}

export function useOceanSimulation(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: OceanSimulationOptions = {}
) {
  const glRef = useRef<GLContextExtended | null>(null);
  const simulationRef = useRef<OceanSimulation | null>(null);
  const rendererRef = useRef<OceanRenderer | null>(null);
  const skyRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number>(0);
  const pausedRef = useRef(false);
  
  // Physics state
  const sphereCenterRef = useRef(new Vector(0, 0.5, 0));
  const sphereVelocityRef = useRef(new Vector(0, 0, 0));
  const sphereRadius = 0.25;
  
  // Camera state
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200);
  const cameraDistanceRef = useRef(4.0);
  
  // Interaction state
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'none' | 'sphere' | 'camera' | 'water'>('none');
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  // Timing
  const lastTimeRef = useRef(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const gl = createGLContext(canvas);
      glRef.current = gl;

      const tileCanvas = createTileTexture();
      simulationRef.current = new OceanSimulation(gl, options.simulation);
      rendererRef.current = new OceanRenderer(gl, tileCanvas, options.render);
      
      // Create sky cubemap
      const skyTextures = createSkyboxTextures();
      skyRef.current = new Cubemap(gl, skyTextures);

      // Initial ripples for visual interest
      for (let i = 0; i < 20; i++) {
        simulationRef.current.addDrop(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          0.03 + Math.random() * 0.02,
          (Math.random() - 0.5) * 0.04
        );
      }
    } catch (error) {
      console.error('Failed to initialize ocean simulation:', error);
    }
  }, [canvasRef, options.simulation, options.render]);

  const render = useCallback((timestamp: number) => {
    const gl = glRef.current;
    const simulation = simulationRef.current;
    const renderer = rendererRef.current;
    const sky = skyRef.current;
    
    if (!gl || !simulation || !renderer || !sky) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;

    // Update camera
    const angleX = angleXRef.current * Math.PI / 180;
    const angleY = angleYRef.current * Math.PI / 180;
    const camDist = cameraDistanceRef.current;
    
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
      const gravity = new Vector(0, -4, 0);
      const center = sphereCenterRef.current;
      const velocity = sphereVelocityRef.current;
      const oldCenter = center.clone();

      // Buoyancy - sphere floats on water
      if (center.y < 0.2) {
        const submerged = Math.min(1, (0.2 - center.y) / (sphereRadius * 2));
        velocity.y += submerged * 10 * deltaTime;
      }
      
      // Gravity and drag
      velocity.add(gravity.multiply(deltaTime));
      velocity.multiply(0.99);
      center.add(velocity.multiply(deltaTime));

      // Bounds checking
      if (center.y < -0.5) { center.y = -0.5; velocity.y *= -0.3; }
      if (center.y > 2) { center.y = 2; velocity.y = 0; }
      center.x = Math.max(-0.9, Math.min(0.9, center.x));
      center.z = Math.max(-0.9, Math.min(0.9, center.z));

      // Update simulation
      simulation.moveSphere(oldCenter, center, sphereRadius);
      simulation.update(deltaTime);
      renderer.update(deltaTime);
      renderer.updateCaustics(simulation);
    }

    // Update renderer state
    renderer.sphereCenter = sphereCenterRef.current;
    renderer.sphereRadius = sphereRadius;

    // Render scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    renderer.renderSky();
    renderer.renderCube(simulation);
    renderer.renderWater(simulation, sky);
    renderer.renderSphere(simulation);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  const handlePointerDown = useCallback((x: number, y: number) => {
    const gl = glRef.current;
    if (!gl) return;
    
    isDraggingRef.current = true;
    lastMouseRef.current = { x, y };
    
    // Raycast to determine what we're clicking on
    const tracer = new Raytracer(gl);
    const ray = tracer.getRayForPixel(x, y);
    
    // Check sphere hit
    const sphereHit = Raytracer.hitTestSphere(
      tracer.eye, 
      ray, 
      sphereCenterRef.current, 
      sphereRadius
    );
    
    if (sphereHit && sphereHit.t < 100) {
      dragModeRef.current = 'sphere';
      return;
    }
    
    // Check water plane hit
    const waterHit = Raytracer.hitTestBox(
      tracer.eye,
      ray,
      new Vector(-1, -0.1, -1),
      new Vector(1, 0.1, 1)
    );
    
    if (waterHit && waterHit.t < 100) {
      dragModeRef.current = 'water';
      // Add ripple at hit point
      if (waterHit.hit) {
        simulationRef.current?.addDrop(waterHit.hit.x, waterHit.hit.z, 0.04, 0.02);
      }
      return;
    }
    
    // Default to camera orbit
    dragModeRef.current = 'camera';
  }, []);

  const handlePointerMove = useCallback((x: number, y: number) => {
    if (!isDraggingRef.current) return;
    
    const dx = x - lastMouseRef.current.x;
    const dy = y - lastMouseRef.current.y;
    lastMouseRef.current = { x, y };
    
    const gl = glRef.current;
    if (!gl) return;
    
    switch (dragModeRef.current) {
      case 'camera':
        angleYRef.current -= dx * 0.5;
        angleXRef.current = Math.max(-89, Math.min(89, angleXRef.current - dy * 0.5));
        break;
        
      case 'sphere': {
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x, y);
        // Project onto water plane
        const t = -tracer.eye.y / ray.y;
        if (t > 0) {
          const hit = tracer.eye.add(ray.multiply(t));
          sphereCenterRef.current.x = Math.max(-0.9, Math.min(0.9, hit.x));
          sphereCenterRef.current.z = Math.max(-0.9, Math.min(0.9, hit.z));
        }
        break;
      }
      
      case 'water': {
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x, y);
        const t = -tracer.eye.y / ray.y;
        if (t > 0) {
          const hit = tracer.eye.add(ray.multiply(t));
          if (Math.abs(hit.x) < 1 && Math.abs(hit.z) < 1) {
            simulationRef.current?.addDrop(hit.x, hit.z, 0.04, 0.01);
          }
        }
        break;
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    dragModeRef.current = 'none';
  }, []);

  const handleWheel = useCallback((deltaY: number) => {
    cameraDistanceRef.current = Math.max(2, Math.min(10, cameraDistanceRef.current + deltaY * 0.01));
  }, []);

  const addDrop = useCallback((x: number, z: number, radius = 0.04, strength = 0.02) => {
    simulationRef.current?.addDrop(x, z, radius, strength);
  }, []);

  const addImpulse = useCallback((x: number, z: number, radius = 0.04, strength = 0.02) => {
    simulationRef.current?.addImpulse(x, z, radius, strength);
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    return pausedRef.current;
  }, []);

  const setSunPosition = useCallback((x: number, y: number, z: number) => {
    rendererRef.current?.setSunPosition(x, y, z);
  }, []);

  const setWindDirection = useCallback((x: number, z: number) => {
    simulationRef.current?.setWindDirection(x, z);
  }, []);

  const setWindStrength = useCallback((strength: number) => {
    simulationRef.current?.setWindStrength(strength);
  }, []);

  useEffect(() => {
    init();
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [init, render]);

  return {
    // Interaction handlers
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    
    // Simulation controls
    addDrop,
    addImpulse,
    setPaused,
    togglePause,
    
    // Environment controls
    setSunPosition,
    setWindDirection,
    setWindStrength,
    
    // State refs for external access
    sphereCenterRef,
    sphereVelocityRef,
    cameraDistanceRef,
    angleXRef,
    angleYRef
  };
}
