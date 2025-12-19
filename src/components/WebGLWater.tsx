import { useRef, useCallback, useState, useEffect } from 'react';
import { useWebGLWater } from '@/hooks/useWebGLWater';

const WebGLWater = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const {
    isInitialized,
    error,
    handlePointerStart,
    handlePointerMove,
    handlePointerEnd,
    toggleGravity,
    togglePause
  } = useWebGLWater(canvasRef);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerStart(e.clientX, e.clientY);
  }, [handlePointerStart]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);
  
  const handleMouseUp = useCallback(() => {
    handlePointerEnd();
  }, [handlePointerEnd]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerStart]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerMove]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      handlePointerEnd();
    }
  }, [handlePointerEnd]);
  
  const handleToggleGravity = useCallback(() => {
    const enabled = toggleGravity();
    setGravityEnabled(enabled);
  }, [toggleGravity]);
  
  const handleTogglePause = useCallback(() => {
    const paused = togglePause();
    setIsPaused(paused);
  }, [togglePause]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        handleTogglePause();
      } else if (e.key === 'g' || e.key === 'G') {
        handleToggleGravity();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowControls(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleGravity, handleTogglePause]);
  
  // Auto-hide controls after a delay
  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);
  
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
            <p className="text-muted-foreground">Initializing water simulation...</p>
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
          <h1 className="text-xl font-semibold text-foreground mb-3 text-gradient-water">
            WebGL Water Simulation
          </h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="text-foreground font-medium">Drag on water:</span> Create ripples</p>
            <p><span className="text-foreground font-medium">Drag on sphere:</span> Move it around</p>
            <p><span className="text-foreground font-medium">Drag elsewhere:</span> Orbit camera</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleToggleGravity}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                gravityEnabled 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Gravity: {gravityEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleTogglePause}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isPaused 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {isPaused ? 'Paused' : 'Running'}
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">G</kbd> for gravity, 
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground mx-1">Space</kbd> to pause,
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
        Based on <a href="http://madebyevan.com/webgl-water/" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground underline">WebGL Water</a> by Evan Wallace
      </div>
    </div>
  );
};

export default WebGLWater;
