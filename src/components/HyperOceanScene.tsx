/**
 * Hyperrealistic Ocean Scene
 * Complete ocean simulation with all visual effects
 */

import { useRef, useCallback, useEffect } from 'react';
import { useHyperOcean } from '@/hooks/useHyperOcean';
import { OceanControls } from './OceanControls';

export function HyperOceanScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
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
    setDebugMode,
    toggleAutoWaves,
    toggleFeature,
  } = useHyperOcean(canvasRef);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerStart(e.clientX, e.clientY);
  }, [handlePointerStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);

  const onMouseUp = useCallback(() => {
    handlePointerEnd();
  }, [handlePointerEnd]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    handleWheel(e.deltaY);
  }, [handleWheel]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerMove]);

  const onTouchEnd = useCallback(() => {
    handlePointerEnd();
  }, [handlePointerEnd]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'g' || e.key === 'G') {
        toggleGravity();
      } else if (e.key === '0') {
        setDebugMode(state.debugMode === 0 ? -1 : 0);
      } else if (e.key === '1') {
        setDebugMode(state.debugMode === 1 ? -1 : 1);
      } else if (e.key === '2') {
        setDebugMode(state.debugMode === 2 ? -1 : 2);
      } else if (e.key === '3') {
        setDebugMode(state.debugMode === 3 ? -1 : 3);
      } else if (e.key === '4') {
        setDebugMode(state.debugMode === 4 ? -1 : 4);
      } else if (e.key === '6') {
        setPreset('calm');
      } else if (e.key === '7') {
        setPreset('moderate');
      } else if (e.key === '8') {
        setPreset('stormy');
      } else if (e.key === '9') {
        setPreset('sunset');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, toggleGravity, setPreset, setDebugMode, state.debugMode]);

  if (state.error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="text-destructive text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-semibold text-foreground mb-4">WebGL Error</h1>
          <p className="text-muted-foreground">{state.error}</p>
          <p className="text-muted-foreground mt-4 text-sm">
            Please use a modern browser with WebGL support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        className="w-full h-full"
        style={{ cursor: 'crosshair' }}
      />

      {/* Loading */}
      {!state.isInitialized && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Initializing Ocean</h2>
            <p className="text-muted-foreground">Generating waves, clouds, and atmosphere...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {state.isInitialized && (
        <OceanControls
          settings={state.settings}
          cloudSettings={state.cloudSettings}
          currentPreset={state.currentPreset}
          isPaused={state.isPaused}
          gravityEnabled={state.gravityEnabled}
          fps={state.fps}
          debugMode={state.debugMode}
          autoWaves={state.autoWaves}
          sheetEnabled={state.sheetEnabled}
          hullEnabled={state.hullEnabled}
          sprayEnabled={state.sprayEnabled}
          gerstnerEnabled={state.gerstnerEnabled}
          onSettingsChange={updateSettings}
          onCloudSettingsChange={updateCloudSettings}
          onPresetChange={setPreset}
          onSunPositionChange={setSunPosition}
          onTogglePause={togglePause}
          onToggleGravity={toggleGravity}
          onDebugModeChange={setDebugMode}
          onToggleAutoWaves={toggleAutoWaves}
          onToggleFeature={toggleFeature}
        />
      )}

      {/* Quick Help */}
      {state.isInitialized && (
        <div className="fixed bottom-4 left-4 text-xs text-white/40 space-y-1">
          <p>Drag water: Create ripples</p>
          <p>Drag sphere: Move it</p>
          <p>Drag elsewhere: Orbit camera</p>
          <p>Scroll: Zoom | Space: Pause | G: Gravity</p>
          <p>0-4: Debug overlays | 6-9: Presets</p>
        </div>
      )}

      {/* Attribution */}
      <div className="fixed bottom-4 right-4 text-xs text-white/30">
        Hyperrealistic Ocean Simulation 2026
      </div>
    </div>
  );
}

export default HyperOceanScene;
