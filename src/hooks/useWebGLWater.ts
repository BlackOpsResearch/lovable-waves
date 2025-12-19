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

const MODE_ADD_DROPS = 0;
const MODE_MOVE_SPHERE = 1;
const MODE_ORBIT_CAMERA = 2;

export function useWebGLWater(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const glRef = useRef<GLContextExtended | null>(null);
  const waterRef = useRef<Water | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cubemapRef = useRef<Cubemap | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera state
  const angleXRef = useRef(-25);
  const angleYRef = useRef(-200.5);
  
  // Sphere physics
  const centerRef = useRef(new Vector(-0.4, -0.75, 0.2));
  const oldCenterRef = useRef(new Vector(-0.4, -0.75, 0.2));
  const velocityRef = useRef(new Vector());
  const gravityRef = useRef(new Vector(0, -4, 0));
  const radiusRef = useRef(0.25);
  const useSpherePhysicsRef = useRef(false);
  
  // Interaction state
  const modeRef = useRef(-1);
  const prevHitRef = useRef<Vector | null>(null);
  const planeNormalRef = useRef<Vector | null>(null);
  const oldPosRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  
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
  
  const toggleGravity = useCallback(() => {
    useSpherePhysicsRef.current = !useSpherePhysicsRef.current;
    return useSpherePhysicsRef.current;
  }, []);
  
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    return pausedRef.current;
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
    handlePointerStart,
    handlePointerMove,
    handlePointerEnd,
    toggleGravity,
    togglePause
  };
}
