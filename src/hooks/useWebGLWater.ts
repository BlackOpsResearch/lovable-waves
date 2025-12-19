import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createGLContext,
  GLContextExtended,
  Water,
  Renderer,
  Cubemap,
  Vector,
  Raytracer
} from '@/lib/webgl';
import { createTileTexture, createSkyboxTextures } from '@/lib/webgl/TextureGenerators';
import { WaterSettings, DEFAULT_WATER_SETTINGS } from '@/lib/webgl/Water';
import { RenderSettings, DEFAULT_RENDER_SETTINGS, SphereData } from '@/lib/webgl/Renderer';

const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;
const MODE_ORBIT_CAMERA = 2;

export interface WaterControlSettings {
  water: WaterSettings;
  render: RenderSettings;
}

// Default sphere configurations
const DEFAULT_SPHERES: Array<{ center: Vector; radius: number; color: [number, number, number] }> = [
  { center: new Vector(-0.4, -0.75, 0.2), radius: 0.25, color: [0.6, 0.6, 0.6] },
  { center: new Vector(0.4, -0.6, -0.3), radius: 0.18, color: [0.9, 0.3, 0.2] },
  { center: new Vector(0.1, -0.5, 0.5), radius: 0.15, color: [0.2, 0.5, 0.9] },
];

export function useWebGLWater(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const glRef = useRef<GLContextExtended | null>(null);
  const waterRef = useRef<Water | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cubemapRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WaterControlSettings>({
    water: { ...DEFAULT_WATER_SETTINGS },
    render: { ...DEFAULT_RENDER_SETTINGS }
  });
  
  // Camera state
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200.5);
  
  // Sphere physics
  const gravityRef = useRef(new Vector(0, -4, 0));
  const useSpherePhysicsRef = useRef(false);
  const selectedSphereRef = useRef(-1);
  const lastInteractionRef = useRef(new Vector(0, 0, 0));
  
  // Interaction state
  const modeRef = useRef(-1);
  const prevHitRef = useRef<Vector | null>(null);
  const planeNormalRef = useRef<Vector | null>(null);
  const oldPosRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  const timeRef = useRef(0);
  
  const draw = useCallback(() => {
    const gl = glRef.current;
    const water = waterRef.current;
    const renderer = rendererRef.current;
    const cubemap = cubemapRef.current;
    
    if (!gl || !water || !renderer || !cubemap) return;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.loadIdentity();
    gl.translate(0, 0, -4);
    gl.rotate(-angleXRef.current, 1, 0, 0);
    gl.rotate(-angleYRef.current, 0, 1, 0);
    gl.translate(0, 0.5, 0);
    
    gl.enable(gl.DEPTH_TEST);
    renderer.renderCube(water);
    renderer.renderWater(water, cubemap);
    renderer.renderSpheres(water);
    gl.disable(gl.DEPTH_TEST);
  }, []);
  
  const update = useCallback((seconds: number) => {
    const water = waterRef.current;
    const renderer = rendererRef.current;
    if (!water || !renderer) return;
    
    if (seconds > 1) return;
    
    timeRef.current += seconds;
    
    // Update sphere physics
    if (modeRef.current === MODE_MOVE_SPHERE) {
      // Stop velocity when dragging
      if (selectedSphereRef.current >= 0 && selectedSphereRef.current < renderer.spheres.length) {
        renderer.spheres[selectedSphereRef.current].velocity = new Vector();
      }
    } else if (useSpherePhysicsRef.current) {
      for (const sphere of renderer.spheres) {
        const percentUnderWater = Math.max(0, Math.min(1, (sphere.radius - sphere.center.y) / (2 * sphere.radius)));
        sphere.velocity = sphere.velocity.add(
          gravityRef.current.multiply(seconds - 1.1 * seconds * percentUnderWater)
        );
        sphere.velocity = sphere.velocity.subtract(
          sphere.velocity.unit().multiply(percentUnderWater * seconds * sphere.velocity.dot(sphere.velocity))
        );
        sphere.center = sphere.center.add(sphere.velocity.multiply(seconds));
        
        if (sphere.center.y < sphere.radius - 1) {
          sphere.center.y = sphere.radius - 1;
          sphere.velocity.y = Math.abs(sphere.velocity.y) * 0.7;
        }
      }
    }
    
    // Move all spheres in water simulation
    for (const sphere of renderer.spheres) {
      water.moveSphere(sphere.oldCenter, sphere.center, sphere.radius);
      sphere.oldCenter = sphere.center.clone();
    }
    
    // Apply animated waves (hybrid system)
    if (water.settings.animatedWaveEnabled) {
      water.applyAnimatedWaves(timeRef.current, lastInteractionRef.current);
    }
    
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
  }, [draw]);
  
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
    
    // Check if we hit any sphere
    let closestSphere = -1;
    let closestT = Infinity;
    
    for (let i = 0; i < renderer.spheres.length; i++) {
      const sphere = renderer.spheres[i];
      const hit = Raytracer.hitTestSphere(tracer.eye, ray, sphere.center, sphere.radius);
      if (hit && hit.t < closestT) {
        closestT = hit.t;
        closestSphere = i;
        prevHitRef.current = hit.hit;
      }
    }
    
    if (closestSphere >= 0) {
      modeRef.current = MODE_MOVE_SPHERE;
      selectedSphereRef.current = closestSphere;
      planeNormalRef.current = tracer.getRayForPixel(gl.canvas.width / 2, gl.canvas.height / 2).negative();
    } else if (Math.abs(pointOnPlane.x) < 1 && Math.abs(pointOnPlane.z) < 1) {
      modeRef.current = MODE_ADD_DROPS;
      lastInteractionRef.current = new Vector(pointOnPlane.x, 0, pointOnPlane.z);
      water.addDrop(pointOnPlane.x, pointOnPlane.z);
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
        lastInteractionRef.current = new Vector(pointOnPlane.x, 0, pointOnPlane.z);
        water.addDrop(pointOnPlane.x, pointOnPlane.z);
        if (pausedRef.current) {
          water.updateNormals();
          renderer.updateCaustics(water);
        }
        break;
      }
      case MODE_MOVE_SPHERE: {
        if (!prevHitRef.current || !planeNormalRef.current) break;
        if (selectedSphereRef.current < 0 || selectedSphereRef.current >= renderer.spheres.length) break;
        
        const sphere = renderer.spheres[selectedSphereRef.current];
        const tracer = new Raytracer(gl);
        const ray = tracer.getRayForPixel(x * ratio, y * ratio);
        const t = -planeNormalRef.current.dot(tracer.eye.subtract(prevHitRef.current)) / planeNormalRef.current.dot(ray);
        const nextHit = tracer.eye.add(ray.multiply(t));
        sphere.center = sphere.center.add(nextHit.subtract(prevHitRef.current));
        sphere.center.x = Math.max(sphere.radius - 1, Math.min(1 - sphere.radius, sphere.center.x));
        sphere.center.y = Math.max(sphere.radius - 1, Math.min(10, sphere.center.y));
        sphere.center.z = Math.max(sphere.radius - 1, Math.min(1 - sphere.radius, sphere.center.z));
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
    selectedSphereRef.current = -1;
  }, []);
  
  const toggleGravity = useCallback(() => {
    useSpherePhysicsRef.current = !useSpherePhysicsRef.current;
    return useSpherePhysicsRef.current;
  }, []);
  
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    return pausedRef.current;
  }, []);
  
  const updateWaterSettings = useCallback((newSettings: Partial<WaterSettings>) => {
    if (waterRef.current) {
      waterRef.current.updateSettings(newSettings);
      setSettings(prev => ({
        ...prev,
        water: { ...prev.water, ...newSettings }
      }));
    }
  }, []);
  
  const updateRenderSettings = useCallback((newSettings: Partial<RenderSettings>) => {
    if (rendererRef.current) {
      rendererRef.current.updateSettings(newSettings);
      setSettings(prev => ({
        ...prev,
        render: { ...prev.render, ...newSettings }
      }));
    }
  }, []);
  
  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const gl = createGLContext(canvas);
      if (!gl) {
        setError('WebGL not supported');
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
      
      // Initialize renderer with multi-sphere support
      const renderer = new Renderer(gl, tileCanvas, 8);
      rendererRef.current = renderer;
      
      // Add default spheres
      for (const sphereConfig of DEFAULT_SPHERES) {
        renderer.addSphere(sphereConfig.center, sphereConfig.radius, sphereConfig.color);
      }
      
      // Initialize cubemap
      const cubemap = new Cubemap(gl, skyTextures);
      cubemapRef.current = cubemap;
      
      // Add initial drops
      for (let i = 0; i < 20; i++) {
        water.addDrop(Math.random() * 2 - 1, Math.random() * 2 - 1, 0.03, (i & 1) ? 0.01 : -0.01);
      }
      
      setIsInitialized(true);
      
      // Set up resize handler
      window.addEventListener('resize', resize);
      resize();
      
      // Animation loop
      let prevTime = Date.now();
      const animate = () => {
        const nextTime = Date.now();
        if (!pausedRef.current) {
          update((nextTime - prevTime) / 1000);
          draw();
        }
        prevTime = nextTime;
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [draw, update, resize]);
  
  return {
    isInitialized,
    error,
    settings,
    handlePointerStart,
    handlePointerMove,
    handlePointerEnd,
    toggleGravity,
    togglePause,
    updateWaterSettings,
    updateRenderSettings
  };
}
