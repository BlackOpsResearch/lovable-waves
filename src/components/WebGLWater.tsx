import { useRef, useCallback, useState, useEffect } from 'react';
import { useWebGLWater, WaterControlSettings } from '@/hooks/useWebGLWater';
import { WaterSettings } from '@/lib/webgl/Water';
import { RenderSettings } from '@/lib/webgl/Renderer';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const SliderControl = ({ label, value, min, max, step, onChange }: SliderControlProps) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-foreground/80">{label}</span>
      <span className="text-primary font-mono">{value.toFixed(step < 0.01 ? 3 : 2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
    />
  </div>
);

const WebGLWater = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gravityEnabled, setGravityEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const {
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
      }, 8000);
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
        className={`fixed top-0 left-0 right-0 p-4 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="max-w-md mx-auto bg-card/90 backdrop-blur-md rounded-xl p-5 border border-border/50 shadow-2xl">
          <h1 className="text-lg font-semibold text-foreground mb-3 text-gradient-water">
            WebGL Water Simulation
          </h1>
          <div className="space-y-1 text-sm text-muted-foreground mb-4">
            <p><span className="text-foreground font-medium">Drag on water:</span> Create ripples</p>
            <p><span className="text-foreground font-medium">Drag on spheres:</span> Move them</p>
            <p><span className="text-foreground font-medium">Drag elsewhere:</span> Orbit camera</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleToggleGravity}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                gravityEnabled 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Gravity: {gravityEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleTogglePause}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isPaused 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {isPaused ? 'Paused' : 'Running'}
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
            >
              {showAdvanced ? 'Hide' : 'Show'} Settings
            </button>
          </div>
          
          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 pt-3 border-t border-border/50">
              <h2 className="text-sm font-semibold text-foreground">Water Physics</h2>
              <div className="grid gap-3">
                <SliderControl
                  label="Wave Speed"
                  value={settings.water.waveSpeed}
                  min={0.5}
                  max={4.0}
                  step={0.1}
                  onChange={(v) => updateWaterSettings({ waveSpeed: v })}
                />
                <SliderControl
                  label="Damping"
                  value={settings.water.damping}
                  min={0.9}
                  max={0.999}
                  step={0.001}
                  onChange={(v) => updateWaterSettings({ damping: v })}
                />
                <SliderControl
                  label="Drop Strength"
                  value={settings.water.dropStrength}
                  min={0.005}
                  max={0.05}
                  step={0.001}
                  onChange={(v) => updateWaterSettings({ dropStrength: v })}
                />
              </div>
              
              <h2 className="text-sm font-semibold text-foreground pt-2">Animated Waves (LOD)</h2>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground/80">Enable Animated Waves</span>
                  <button
                    onClick={() => updateWaterSettings({ animatedWaveEnabled: !settings.water.animatedWaveEnabled })}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      settings.water.animatedWaveEnabled
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {settings.water.animatedWaveEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <SliderControl
                  label="Wave Amplitude"
                  value={settings.water.animatedWaveAmplitude}
                  min={0}
                  max={0.05}
                  step={0.001}
                  onChange={(v) => updateWaterSettings({ animatedWaveAmplitude: v })}
                />
                <SliderControl
                  label="Wave Frequency"
                  value={settings.water.animatedWaveFrequency}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onChange={(v) => updateWaterSettings({ animatedWaveFrequency: v })}
                />
                <SliderControl
                  label="Near Field Radius"
                  value={settings.water.nearFieldRadius}
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => updateWaterSettings({ nearFieldRadius: v })}
                />
              </div>
              
              <h2 className="text-sm font-semibold text-foreground pt-2">Rendering</h2>
              <div className="grid gap-3">
                <SliderControl
                  label="Refraction Index (IOR)"
                  value={settings.render.refractionIndex}
                  min={1.0}
                  max={2.0}
                  step={0.01}
                  onChange={(v) => updateRenderSettings({ refractionIndex: v })}
                />
              </div>
            </div>
          )}
          
          <p className="mt-3 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">G</kbd> gravity
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground mx-1">Space</kbd> pause
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">H</kbd> toggle UI
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
      
      {/* Sphere legend */}
      {isInitialized && (
        <div className="fixed bottom-4 left-4 bg-card/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Gray</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Red</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Blue</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebGLWater;
