/**
 * Generate tile texture for pool walls
 */
export function createTileTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base color - lighter blue-white
  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(0, 0, 256, 256);

  // Draw tile pattern
  const tileSize = 32;
  ctx.strokeStyle = '#b8d4e8';
  ctx.lineWidth = 2;

  for (let y = 0; y < 256; y += tileSize) {
    for (let x = 0; x < 256; x += tileSize) {
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  // Add slight texture/noise
  const imageData = ctx.getImageData(0, 0, 256, 256);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Generate skybox faces for environment mapping
 */
export function createSkyboxTextures(): {
  xneg: HTMLCanvasElement;
  xpos: HTMLCanvasElement;
  yneg: HTMLCanvasElement;
  ypos: HTMLCanvasElement;
  zneg: HTMLCanvasElement;
  zpos: HTMLCanvasElement;
} {
  const size = 512;
  
  function createFace(topColor: string, bottomColor: string, addClouds = false, sunGlow = false): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.5, bottomColor);
    gradient.addColorStop(1, '#a8c8e8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add sun glow
    if (sunGlow) {
      const sunX = size * 0.7;
      const sunY = size * 0.3;
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, size * 0.4);
      sunGradient.addColorStop(0, 'rgba(255, 255, 220, 0.8)');
      sunGradient.addColorStop(0.1, 'rgba(255, 240, 200, 0.4)');
      sunGradient.addColorStop(0.3, 'rgba(255, 220, 180, 0.1)');
      sunGradient.addColorStop(1, 'rgba(255, 200, 150, 0)');
      ctx.fillStyle = sunGradient;
      ctx.fillRect(0, 0, size, size);
    }
    
    // Add clouds
    if (addClouds) {
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * size;
        const y = size * 0.1 + Math.random() * size * 0.4;
        
        // Cloud cluster
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let j = 0; j < 5; j++) {
          const cx = x + (Math.random() - 0.5) * 80;
          const cy = y + (Math.random() - 0.5) * 20;
          const w = 40 + Math.random() * 80;
          const h = 15 + Math.random() * 25;
          ctx.beginPath();
          ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    return canvas;
  }

  return {
    xneg: createFace('#4a90c2', '#7eb8e4', true, false),
    xpos: createFace('#4a90c2', '#7eb8e4', true, true),
    yneg: createFace('#2a4a6a', '#3a6a8a', false, false), // Ocean floor reflection
    ypos: createFace('#3a7ab0', '#5a9ad0', true, false),   // Zenith
    zneg: createFace('#4a90c2', '#7eb8e4', true, false),
    zpos: createFace('#4a90c2', '#7eb8e4', true, false),
  };
}

/**
 * Create a dramatic sunset skybox
 */
export function createSunsetSkyboxTextures(): {
  xneg: HTMLCanvasElement;
  xpos: HTMLCanvasElement;
  yneg: HTMLCanvasElement;
  ypos: HTMLCanvasElement;
  zneg: HTMLCanvasElement;
  zpos: HTMLCanvasElement;
} {
  const size = 512;
  
  function createSunsetFace(hasSun = false): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Sunset gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#1a1a3a');
    gradient.addColorStop(0.3, '#4a2a5a');
    gradient.addColorStop(0.5, '#8a4a4a');
    gradient.addColorStop(0.7, '#da8a4a');
    gradient.addColorStop(0.85, '#fab070');
    gradient.addColorStop(1, '#fad0a0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add sun
    if (hasSun) {
      const sunX = size * 0.5;
      const sunY = size * 0.75;
      
      // Sun glow
      const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, size * 0.5);
      glowGradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
      glowGradient.addColorStop(0.05, 'rgba(255, 180, 80, 0.9)');
      glowGradient.addColorStop(0.2, 'rgba(255, 150, 50, 0.3)');
      glowGradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.1)');
      glowGradient.addColorStop(1, 'rgba(255, 80, 30, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, size, size);
    }
    
    return canvas;
  }

  return {
    xneg: createSunsetFace(false),
    xpos: createSunsetFace(false),
    yneg: createSunsetFace(false),
    ypos: createSunsetFace(false),
    zneg: createSunsetFace(false),
    zpos: createSunsetFace(true), // Sun in front
  };
}

/**
 * Create a stormy skybox
 */
export function createStormySkyboxTextures(): {
  xneg: HTMLCanvasElement;
  xpos: HTMLCanvasElement;
  yneg: HTMLCanvasElement;
  ypos: HTMLCanvasElement;
  zneg: HTMLCanvasElement;
  zpos: HTMLCanvasElement;
} {
  const size = 512;
  
  function createStormyFace(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Dark stormy gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#2a3a4a');
    gradient.addColorStop(0.4, '#3a4a5a');
    gradient.addColorStop(0.7, '#4a5a6a');
    gradient.addColorStop(1, '#5a6a7a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Dark storm clouds
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size * 0.7;
      
      ctx.fillStyle = `rgba(40, 50, 60, ${0.3 + Math.random() * 0.3})`;
      for (let j = 0; j < 6; j++) {
        const cx = x + (Math.random() - 0.5) * 100;
        const cy = y + (Math.random() - 0.5) * 30;
        const w = 50 + Math.random() * 100;
        const h = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return canvas;
  }

  return {
    xneg: createStormyFace(),
    xpos: createStormyFace(),
    yneg: createStormyFace(),
    ypos: createStormyFace(),
    zneg: createStormyFace(),
    zpos: createStormyFace(),
  };
}

/**
 * Create a tropical skybox
 */
export function createTropicalSkyboxTextures(): {
  xneg: HTMLCanvasElement;
  xpos: HTMLCanvasElement;
  yneg: HTMLCanvasElement;
  ypos: HTMLCanvasElement;
  zneg: HTMLCanvasElement;
  zpos: HTMLCanvasElement;
} {
  const size = 512;
  
  function createTropicalFace(hasSun = false): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Bright tropical gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#2090d0');
    gradient.addColorStop(0.5, '#40b0e8');
    gradient.addColorStop(0.8, '#70d0f8');
    gradient.addColorStop(1, '#90e0ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Bright sun glow
    if (hasSun) {
      const sunX = size * 0.6;
      const sunY = size * 0.25;
      const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, size * 0.4);
      glowGradient.addColorStop(0, 'rgba(255, 255, 240, 1)');
      glowGradient.addColorStop(0.05, 'rgba(255, 255, 220, 0.7)');
      glowGradient.addColorStop(0.2, 'rgba(255, 250, 200, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 240, 180, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, size, size);
    }
    
    // Fluffy white clouds
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * size;
      const y = size * 0.15 + Math.random() * size * 0.3;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let j = 0; j < 4; j++) {
        const cx = x + (Math.random() - 0.5) * 60;
        const cy = y + (Math.random() - 0.5) * 15;
        const w = 30 + Math.random() * 60;
        const h = 12 + Math.random() * 20;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return canvas;
  }

  return {
    xneg: createTropicalFace(false),
    xpos: createTropicalFace(true),
    yneg: createTropicalFace(false),
    ypos: createTropicalFace(false),
    zneg: createTropicalFace(false),
    zpos: createTropicalFace(false),
  };
}
