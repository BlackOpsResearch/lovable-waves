/**
 * Ocean Controls Panel
 * Comprehensive UI for adjusting all ocean simulation parameters
 */

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sun, 
  CloudSun, 
  Waves, 
  Palette, 
  ChevronDown, 
  ChevronUp,
  Pause,
  Play,
  Anchor,
  Bug,
  Wind,
} from 'lucide-react';
import { OceanSettings, OCEAN_PRESETS } from '@/lib/ocean/OceanConfig';
import { CloudSettings } from '@/lib/ocean/CloudRenderer';

interface OceanControlsProps {
  settings: OceanSettings;
  cloudSettings: CloudSettings;
  currentPreset: string;
  isPaused: boolean;
  gravityEnabled: boolean;
  fps: number;
  debugMode: number;
  autoWaves: boolean;
  sheetEnabled: boolean;
  hullEnabled: boolean;
  sprayEnabled: boolean;
  gerstnerEnabled: boolean;
  windSpeed: number;
  fetch: number;
  turbidity: number;
  rayleighScale: number;
  mieCoeff: number;
  sunIntensity: number;
  onSettingsChange: (settings: Partial<OceanSettings>) => void;
  onCloudSettingsChange: (settings: Partial<CloudSettings>) => void;
  onPresetChange: (preset: string) => void;
  onSunPositionChange: (elevation: number, azimuth: number) => void;
  onTogglePause: () => void;
  onToggleGravity: () => void;
  onDebugModeChange: (mode: number) => void;
  onToggleAutoWaves: () => void;
  onToggleFeature: (feature: 'sheet' | 'hull' | 'spray' | 'gerstner') => void;
  onAtmosphereParamChange: (param: string, value: number) => void;
}

export function OceanControls({
  settings,
  cloudSettings,
  currentPreset,
  isPaused,
  gravityEnabled,
  fps,
  debugMode,
  autoWaves,
  sheetEnabled,
  hullEnabled,
  sprayEnabled,
  gerstnerEnabled,
  windSpeed,
  fetch: fetchDist,
  turbidity,
  rayleighScale,
  mieCoeff,
  sunIntensity,
  onSettingsChange,
  onCloudSettingsChange,
  onPresetChange,
  onSunPositionChange,
  onTogglePause,
  onToggleGravity,
  onDebugModeChange,
  onToggleAutoWaves,
  onToggleFeature,
  onAtmosphereParamChange,
}: OceanControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('waves');

  const presets = Object.keys(OCEAN_PRESETS);

  return (
    <div className={`fixed top-4 left-4 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-auto'}`}>
      {/* Header */}
      <div 
        className="bg-card/90 backdrop-blur-md rounded-t-xl p-4 border border-border/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              Hyperrealistic Ocean
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{fps} FPS</span>
              <span className="capitalize">{currentPreset}</span>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="bg-card/90 backdrop-blur-md rounded-b-xl p-4 border border-t-0 border-border/50 max-h-[70vh] overflow-y-auto">
          {/* Quick Controls */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={isPaused ? "secondary" : "default"}
              size="sm"
              onClick={onTogglePause}
              className="flex-1"
            >
              {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
              {isPaused ? 'Play' : 'Pause'}
            </Button>
            <Button
              variant={gravityEnabled ? "default" : "secondary"}
              size="sm"
              onClick={onToggleGravity}
              className="flex-1"
            >
              <Anchor className="w-4 h-4 mr-1" />
              Gravity
            </Button>
          </div>

          {/* Presets */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-2 block">Presets</label>
            <div className="grid grid-cols-4 gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  variant={currentPreset === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPresetChange(preset)}
                  className="text-xs capitalize"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Tabbed Controls */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="waves" className="text-xs" title="Waves & JONSWAP">
                <Waves className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="sun" className="text-xs" title="Sun & Atmosphere">
                <Sun className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="clouds" className="text-xs" title="Clouds">
                <CloudSun className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="water" className="text-xs" title="Water Material">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="debug" className="text-xs" title="Debug">
                <Bug className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            {/* Waves Tab */}
            <TabsContent value="waves" className="space-y-4 mt-4">
              <label className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">JONSWAP Spectrum</label>
              <ControlSlider
                label="Wind Speed (m/s)"
                value={windSpeed}
                min={0.5}
                max={25}
                step={0.5}
                onChange={(v) => onAtmosphereParamChange('windSpeed', v)}
              />
              <ControlSlider
                label="Fetch (km)"
                value={fetchDist / 1000}
                min={1}
                max={500}
                step={5}
                onChange={(v) => onAtmosphereParamChange('fetch', v * 1000)}
              />
              <ControlSlider
                label="Wave Height"
                value={settings.waves.amplitude}
                min={0.05}
                max={1.5}
                step={0.05}
                onChange={(v) => onSettingsChange({ waves: { ...settings.waves, amplitude: v } })}
              />
              <ControlSlider
                label="Steepness"
                value={settings.waves.steepness}
                min={0.1}
                max={1.0}
                step={0.05}
                onChange={(v) => onSettingsChange({ waves: { ...settings.waves, steepness: v } })}
              />
              <ControlSlider
                label="Wind Direction"
                value={settings.waves.windDirection}
                min={0}
                max={360}
                step={5}
                onChange={(v) => onSettingsChange({ waves: { ...settings.waves, windDirection: v } })}
              />
              <ControlSlider
                label="Choppiness"
                value={settings.waves.choppiness}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onSettingsChange({ waves: { ...settings.waves, choppiness: v } })}
              />
            </TabsContent>

            {/* Sun & Atmosphere Tab */}
            <TabsContent value="sun" className="space-y-4 mt-4">
              <ControlSlider
                label="Sun Elevation"
                value={settings.atmosphere.sunElevation}
                min={-10}
                max={90}
                step={1}
                onChange={(v) => onSunPositionChange(v, settings.atmosphere.sunAzimuth)}
              />
              <ControlSlider
                label="Sun Azimuth"
                value={settings.atmosphere.sunAzimuth}
                min={0}
                max={360}
                step={5}
                onChange={(v) => onSunPositionChange(settings.atmosphere.sunElevation, v)}
              />
              <label className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider mt-2">Rayleigh / Mie Scattering</label>
              <ControlSlider
                label="Turbidity"
                value={turbidity}
                min={1}
                max={20}
                step={0.5}
                onChange={(v) => onAtmosphereParamChange('turbidity', v)}
              />
              <ControlSlider
                label="Rayleigh Scale"
                value={rayleighScale}
                min={0.1}
                max={4}
                step={0.1}
                onChange={(v) => onAtmosphereParamChange('rayleighScale', v)}
              />
              <ControlSlider
                label="Mie Coefficient"
                value={mieCoeff}
                min={0.001}
                max={0.1}
                step={0.001}
                onChange={(v) => onAtmosphereParamChange('mieCoeff', v)}
              />
              <ControlSlider
                label="Sun Intensity"
                value={sunIntensity}
                min={1}
                max={50}
                step={1}
                onChange={(v) => onAtmosphereParamChange('sunIntensity', v)}
              />
            </TabsContent>

            {/* Clouds Tab */}
            <TabsContent value="clouds" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Enable Clouds</label>
                <Switch
                  checked={cloudSettings.enabled}
                  onCheckedChange={(v) => onCloudSettingsChange({ enabled: v })}
                />
              </div>
              <ControlSlider
                label="Coverage"
                value={cloudSettings.coverage}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onCloudSettingsChange({ coverage: v })}
              />
              <ControlSlider
                label="Density"
                value={cloudSettings.density}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(v) => onCloudSettingsChange({ density: v })}
              />
              <ControlSlider
                label="Altitude"
                value={cloudSettings.altitude}
                min={1}
                max={10}
                step={0.5}
                onChange={(v) => onCloudSettingsChange({ altitude: v })}
              />
              <ControlSlider
                label="Opacity"
                value={cloudSettings.opacity}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onCloudSettingsChange({ opacity: v })}
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">God Rays</label>
                <Switch
                  checked={cloudSettings.godRaysEnabled}
                  onCheckedChange={(v) => onCloudSettingsChange({ godRaysEnabled: v })}
                />
              </div>
            </TabsContent>

            {/* Water Tab */}
            <TabsContent value="water" className="space-y-4 mt-4">
              <ControlSlider
                label="Foam Intensity"
                value={settings.material.foamIntensity}
                min={0}
                max={2}
                step={0.1}
                onChange={(v) => onSettingsChange({ material: { ...settings.material, foamIntensity: v } })}
              />
              <ControlSlider
                label="Underwater Fog"
                value={settings.material.underwaterFogDensity}
                min={0}
                max={0.2}
                step={0.01}
                onChange={(v) => onSettingsChange({ material: { ...settings.material, underwaterFogDensity: v } })}
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Caustics</label>
                <Switch
                  checked={settings.caustics.enabled}
                  onCheckedChange={(v) => onSettingsChange({ caustics: { ...settings.caustics, enabled: v } })}
                />
              </div>
              <ControlSlider
                label="Caustic Intensity"
                value={settings.caustics.intensity}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onSettingsChange({ caustics: { ...settings.caustics, intensity: v } })}
              />
            </TabsContent>

            {/* Debug Tab */}
            <TabsContent value="debug" className="space-y-4 mt-4">
              <label className="text-xs text-muted-foreground font-semibold block">Systems</label>
              {[
                { label: 'Gerstner Waves', key: 'gerstner' as const, enabled: gerstnerEnabled },
                { label: 'Sheet Topology', key: 'sheet' as const, enabled: sheetEnabled },
                { label: 'Hull Contact', key: 'hull' as const, enabled: hullEnabled },
                { label: 'Spray Particles', key: 'spray' as const, enabled: sprayEnabled },
              ].map(({ label, key, enabled }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <Switch checked={enabled} onCheckedChange={() => onToggleFeature(key)} />
                </div>
              ))}
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Auto Waves</label>
                <Switch checked={autoWaves} onCheckedChange={onToggleAutoWaves} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Debug Overlay</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: 'Off', mode: -1 },
                    { label: 'Height', mode: 0 },
                    { label: 'Steep', mode: 1 },
                    { label: 'Jacob', mode: 2 },
                    { label: 'Foam', mode: 3 },
                    { label: 'Sheet', mode: 4 },
                    { label: 'Hull', mode: 5 },
                  ].map(({ label, mode }) => (
                    <Button
                      key={mode}
                      variant={debugMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => onDebugModeChange(mode)}
                      className="text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Keys 0-5: debug views | Space: pause | G: gravity
              </p>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Instructions when collapsed */}
      {!isExpanded && (
        <div className="bg-card/90 backdrop-blur-md rounded-b-xl p-2 border border-t-0 border-border/50">
          <p className="text-xs text-muted-foreground">Click to expand</p>
        </div>
      )}
    </div>
  );
}

// Helper component for sliders
function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-mono text-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export default OceanControls;
