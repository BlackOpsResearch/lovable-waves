/**
 * React hook for Ocean WebGL simulation
 * Integrates ocean simulation with atmospheric effects
 */

import { useCallback, useEffect, useRef } from 'react';
import { GLContextExtended, createGLContext } from '../lib/webgl/GLContext';
import { Cubemap } from '../lib/webgl/Cubemap';
import { Vector } from '../lib/webgl/Vector';
import { OceanSimulation } from '../lib/ocean/OceanSimulation';
import { OceanRenderer } from '../lib/ocean/OceanRenderer';
import { createTileTexture, createSkyboxTextures } from '../lib/webgl/TextureGenerators';

export function useOceanSimulation(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const glRef = useRef<GLContextExtended | null>(null);
  const simulationRef = useRef<OceanSimulation | null>(null);
  const rendererRef = useRef<OceanRenderer | null>(null);
  const skyRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const sphereCenterRef = useRef(new Vector(0, 0.5, 0));
  const sphereVelocityRef = useRef(new Vector(0, 0, 0));
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200);
  const lastTimeRef = useRef(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const gl = createGLContext(canvas);
      glRef.current = gl;

      const tileCanvas = createTileTexture();
      simulationRef.current = new OceanSimulation(gl, 256);
      rendererRef.current = new OceanRenderer(gl, tileCanvas);
      
      // Create sky cubemap
      const skyTextures = createSkyboxTextures();
      skyRef.current = new Cubemap(gl, skyTextures);

      // Initial ripples
      for (let i = 0; i < 15; i++) {
        simulationRef.current.addDrop(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          0.04,
          i % 2 === 0 ? 0.02 : -0.02
        );
      }
    } catch (error) {
      console.error('Failed to initialize ocean simulation:', error);
    }
  }, [canvasRef]);

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
    const camDist = 5;
    
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
      const sphereRadius = 0.25;
      const center = sphereCenterRef.current;
      const velocity = sphereVelocityRef.current;
      const oldCenter = center.clone();

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

      simulation.moveSphere(oldCenter, center, sphereRadius);
      simulation.update(deltaTime);
      renderer.update(deltaTime);
      renderer.updateCaustics(simulation);
    }

    renderer.sphereCenter = sphereCenterRef.current;
    renderer.sphereRadius = 0.25;

    // Render
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    renderer.renderSky(sky);
    renderer.renderWater(simulation, sky);
    renderer.renderSphere(simulation);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  const addDrop = useCallback((x: number, z: number, radius = 0.04, strength = 0.02) => {
    simulationRef.current?.addDrop(x, z, radius, strength);
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  const orbitCamera = useCallback((dx: number, dy: number) => {
    angleYRef.current -= dx * 0.5;
    angleXRef.current = Math.max(-89, Math.min(89, angleXRef.current - dy * 0.5));
  }, []);

  useEffect(() => {
    init();
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [init, render]);

  return { addDrop, setPaused, orbitCamera, sphereCenterRef };
}
