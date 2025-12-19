/**
 * High-resolution texture generators for the water simulation
 * Enhanced skybox with clouds, sun, and atmospheric effects
 */

export function createTileTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  // Deep blue-green gradient background (like a swimming pool)
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#0a5e6c');
  gradient.addColorStop(0.5, '#0d7377');
  gradient.addColorStop(1, '#0a5e6c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  
  // Grid pattern for tiles
  ctx.strokeStyle = '#14919b';
  ctx.lineWidth = 2;
  
  const tileSize = 32;
  for (let x = 0; x <= 256; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  
  // Add some texture variation
  for (let x = 0; x < 256; x += tileSize) {
    for (let y = 0; y < 256; y += tileSize) {
      const brightness = 0.9 + Math.random() * 0.2;
      ctx.fillStyle = `rgba(20, 145, 155, ${brightness * 0.1})`;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    }
  }
  
  return canvas;
}

/**
 * Create a procedural cloud texture
 */
function createCloudTexture(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Generate cloud noise using layered circles
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  
  // Simple Perlin-like noise using sine waves
  function noise(x: number, y: number, freq: number, seed: number): number {
    return (
      Math.sin(x * freq + seed) * Math.cos(y * freq * 1.1 + seed * 0.7) +
      Math.sin(x * freq * 0.7 + y * freq * 0.5 + seed * 1.3) * 0.5
    ) * 0.5 + 0.5;
  }
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Layered noise for cloud detail
      const n1 = noise(x, y, 0.02, 0);
      const n2 = noise(x, y, 0.05, 100);
      const n3 = noise(x, y, 0.1, 200);
      const n4 = noise(x, y, 0.2, 300);
      
      // Combine octaves with decreasing amplitude
      let value = n1 * 0.5 + n2 * 0.25 + n3 * 0.15 + n4 * 0.1;
      
      // Threshold for cloud coverage
      value = Math.max(0, (value - 0.4) * 2.5);
      value = Math.min(1, value);
      
      const i = (y * size + x) * 4;
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = Math.floor(value * 200); // A - semi-transparent clouds
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Blur for softer clouds
  ctx.filter = 'blur(2px)';
  ctx.drawImage(canvas, 0, 0);
  
  return canvas;
}

/**
 * Create high-resolution skybox textures with clouds and sun
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
  
  // Pre-generate cloud texture for reuse
  const cloudCanvas = createCloudTexture(size);
  
  function createFace(
    faceType: string,
    faceIndex: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    let gradient: CanvasGradient;
    
    if (faceType === 'top') {
      // Top face - zenith (deep blue)
      gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.7);
      gradient.addColorStop(0, '#1a365d');
      gradient.addColorStop(0.5, '#2563eb');
      gradient.addColorStop(1, '#60a5fa');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    } else if (faceType === 'bottom') {
      // Bottom face - very dark (underwater/ground)
      ctx.fillStyle = '#0c1929';
      ctx.fillRect(0, 0, size, size);
      return canvas;
    } else if (faceType === 'sunSide') {
      // Sun side - warm gradient
      gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#3b82f6');    // Blue top
      gradient.addColorStop(0.3, '#93c5fd');  // Light blue
      gradient.addColorStop(0.5, '#fef3c7');  // Warm horizon
      gradient.addColorStop(0.6, '#fcd34d');  // Golden
      gradient.addColorStop(0.7, '#f97316');  // Orange
      gradient.addColorStop(1, '#ea580c');    // Deep orange at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    } else {
      // Regular side - cooler gradient
      gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#1e40af');    // Deep blue top
      gradient.addColorStop(0.4, '#3b82f6');  // Blue
      gradient.addColorStop(0.6, '#93c5fd');  // Light blue
      gradient.addColorStop(0.8, '#bae6fd');  // Very light
      gradient.addColorStop(1, '#f0f9ff');    // Almost white horizon
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    
    // Add clouds (not on bottom face)
    if (faceType !== 'bottom') {
      ctx.globalAlpha = faceType === 'top' ? 0.3 : 0.6;
      
      // Offset clouds differently for each face
      const offsetX = (faceIndex * 123) % size;
      const offsetY = (faceIndex * 77) % size;
      
      ctx.drawImage(cloudCanvas, offsetX, offsetY);
      ctx.drawImage(cloudCanvas, offsetX - size, offsetY);
      ctx.drawImage(cloudCanvas, offsetX, offsetY - size);
      ctx.drawImage(cloudCanvas, offsetX - size, offsetY - size);
      
      ctx.globalAlpha = 1;
    }
    
    // Add sun on sun side faces
    if (faceType === 'sunSide') {
      // Sun position
      const sunX = faceIndex === 0 ? size * 0.7 : size * 0.3;
      const sunY = size * 0.35;
      const sunRadius = 40;
      
      // Sun glow (outer)
      const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 4);
      glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
      glowGradient.addColorStop(0.2, 'rgba(255, 220, 100, 0.4)');
      glowGradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.15)');
      glowGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun core
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
      sunGradient.addColorStop(0, '#ffffff');
      sunGradient.addColorStop(0.3, '#fffbe6');
      sunGradient.addColorStop(0.7, '#ffd54f');
      sunGradient.addColorStop(1, '#ff9800');
      
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun rays
      ctx.strokeStyle = 'rgba(255, 255, 220, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const innerR = sunRadius * 1.2;
        const outerR = sunRadius * 2.5 + Math.random() * 30;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
        ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
        ctx.stroke();
      }
    }
    
    // Add subtle stars to darker areas (top and side faces)
    if (faceType === 'top' || faceType === 'regular') {
      const starCount = faceType === 'top' ? 100 : 30;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size * 0.5; // Upper half
        const radius = Math.random() * 1.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return canvas;
  }

  return {
    xpos: createFace('sunSide', 0),
    xneg: createFace('regular', 1),
    ypos: createFace('top', 2),
    yneg: createFace('bottom', 3),
    zpos: createFace('regular', 4),
    zneg: createFace('sunSide', 5)
  };
}
