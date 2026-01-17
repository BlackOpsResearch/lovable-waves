/**
 * Ocean Water Component
 * Full-featured ocean simulation with WebGL rendering
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { useOceanSimulation } from '@/hooks/useOceanSimulation';

interface OceanWaterProps {
  showControls?: boolean;
  autoHideControls?: boolean;
  autoHideDelay?: number;
}

const OceanWater = ({ 
  showControls: initialShowControls = true,
  autoHideControls = true,
  autoHideDelay = 5000
}: OceanWaterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showControls, setShowControls] = useState(initialShowControls);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    togglePause,
    setSunPosition,
    setWindDirection,
    setWindStrength
  } = useOceanSimulation(canvasRef, {
    simulation: {
      resolution: 256,
      damping: 0.997,
      enableWindWaves: true,
      windStrength: 0.1
    },
    render: {
      causticsStrength: 1.2,
      foamStrength: 0.6,
      turbidity: 2.5,
      rayleigh: 1.2
    }
  });
  
  // Handle canvas initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Check WebGL support
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setError('WebGL not supported');
      return;
    }
    
    setIsInitialized(true);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerDown(e.clientX, e.clientY);
  }, [handlePointerDown]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);
  
  const handleMouseUp = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);
  
  const handleWheelEvent = useCallback((e: React.WheelEvent) => {
    handleWheel(e.deltaY);
  }, [handleWheel]);
  
  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerDown]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerMove]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      handlePointerUp();
    }
  }, [handlePointerUp]);
  
  // Control handlers
  const handleTogglePause = useCallback(() => {
    const paused = togglePause();
    setIsPaused(paused);
  }, [togglePause]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowControls(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause]);
  
  // Auto-hide controls
  useEffect(() => {
    if (autoHideControls && isInitialized) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, autoHideControls, autoHideDelay]);
  
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="text-destructive text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">WebGL Error</h1>
          <p className="text-muted-foreground">{error}</p>
          {error === 'WebGL not supported' && (
            <p className="text-muted-foreground mt-4 text-sm">
              Please use a modern browser with WebGL support.
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="webgl-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheelEvent}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'crosshair' }}
      />
      
      {/* Loading indicator */}
      {!isInitialized && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing ocean simulation...</p>
          </div>
        </div>
      )}
      
      {/* Controls overlay */}
      <div 
        className={`fixed top-0 left-0 right-0 p-6 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="max-w-lg mx-auto bg-card/80 backdrop-blur-md rounded-xl p-6 border border-border/50">
          <h1 className="text-xl font-semibold text-foreground mb-3">
            🌊 Ocean Simulation
          </h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="text-foreground font-medium">Drag on water:</span> Create waves</p>
            <p><span className="text-foreground font-medium">Drag on sphere:</span> Move it around</p>
            <p><span className="text-foreground font-medium">Drag elsewhere:</span> Orbit camera</p>
            <p><span className="text-foreground font-medium">Scroll:</span> Zoom in/out</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleTogglePause}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPaused 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Space</kbd> to pause,
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground mx-1">H</kbd> to toggle controls
          </p>
        </div>
      </div>
      
      {/* Show controls hint when hidden */}
      {!showControls && isInitialized && (
        <div 
          className="fixed top-4 right-4 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
          onClick={() => setShowControls(true)}
        >
          Press H for controls
        </div>
      )}
      
      {/* Attribution */}
      <div className="fixed bottom-4 right-4 text-xs text-muted-foreground/50">
        Ocean Simulation • GPT Waves V7
      </div>
    </div>
  );
};

export default OceanWater;
