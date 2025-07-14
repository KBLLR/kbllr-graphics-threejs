import * as THREE from "three";

/**
 * Utility functions for common operations
 */

// ===================================================
// MATH UTILITIES
// ===================================================

/**
 * Clamp a value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation
 */
export const lerp = (start, end, t) => {
  return start + (end - start) * t;
};

/**
 * Smooth step interpolation
 */
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
};

/**
 * Map a value from one range to another
 */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Random float between min and max
 */
export const randomRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Random integer between min and max (inclusive)
 */
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ===================================================
// VECTOR UTILITIES
// ===================================================

/**
 * Get random point in sphere
 */
export const randomPointInSphere = (radius = 1) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * radius;

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  );
};

/**
 * Get random point on sphere surface
 */
export const randomPointOnSphere = (radius = 1) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  );
};

// ===================================================
// COLOR UTILITIES
// ===================================================

/**
 * Generate random color from palette
 */
export const randomColorFromPalette = (palette) => {
  return palette[Math.floor(Math.random() * palette.length)];
};

/**
 * Interpolate between two colors
 */
export const lerpColor = (color1, color2, t) => {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, t);
};

/**
 * Generate complementary color
 */
export const complementaryColor = (color) => {
  const c = new THREE.Color(color);
  const hsl = {};
  c.getHSL(hsl);
  hsl.h = (hsl.h + 0.5) % 1;
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
};

// ===================================================
// EASING FUNCTIONS
// ===================================================

export const easing = {
  // Quadratic
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quartic
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,

  // Quintic
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,

  // Exponential
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0 || t === 1) return t;
    if (t < 0.5) return 0.5 * Math.pow(2, 10 * (2 * t - 1));
    return 0.5 * (2 - Math.pow(2, -10 * (2 * t - 1)));
  },

  // Elastic
  easeInElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return -(
      Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1 - s) * (2 * Math.PI)) / p)
    );
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },

  // Bounce
  easeOutBounce: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  easeInBounce: (t) => 1 - easing.easeOutBounce(1 - t),
};

// ===================================================
// DEVICE & PERFORMANCE UTILITIES
// ===================================================

/**
 * Detect mobile device
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

/**
 * Detect touch device
 */
export const isTouchDevice = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * Get device pixel ratio (capped for performance)
 */
export const getPixelRatio = (maxRatio = 2) => {
  return Math.min(window.devicePixelRatio || 1, maxRatio);
};

/**
 * Throttle function calls
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

/**
 * Debounce function calls
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// ===================================================
// ASSET LOADING UTILITIES
// ===================================================

/**
 * Load multiple textures with progress callback
 */
export const loadTextures = async (urls, onProgress) => {
  const loader = new THREE.TextureLoader();
  const total = urls.length;
  let loaded = 0;

  const promises = urls.map((url, index) => {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          loaded++;
          if (onProgress) {
            onProgress(loaded / total, index, texture);
          }
          resolve({ url, texture, index });
        },
        undefined,
        (error) => {
          reject({ url, error, index });
        },
      );
    });
  });

  return Promise.all(promises);
};

/**
 * Preload assets with progress tracking
 */
export const preloadAssets = async (assets, onProgress) => {
  const total = assets.length;
  let loaded = 0;

  const updateProgress = () => {
    loaded++;
    if (onProgress) {
      onProgress(loaded / total);
    }
  };

  const promises = assets.map((asset) => {
    return asset.load().then((result) => {
      updateProgress();
      return result;
    });
  });

  return Promise.all(promises);
};

// ===================================================
// GEOMETRY UTILITIES
// ===================================================

/**
 * Create rounded box geometry
 */
export const createRoundedBox = (
  width,
  height,
  depth,
  radius,
  smoothness = 2,
) => {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const r = radius - eps;

  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness * 2,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: smoothness,
  });

  geometry.center();
  return geometry;
};

// ===================================================
// TIME & ANIMATION UTILITIES
// ===================================================

/**
 * Format time in MM:SS
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Create animation loop with fixed timestep
 */
export const createFixedTimestepLoop = (callback, fps = 60) => {
  const timestep = 1000 / fps;
  let lastTime = 0;
  let accumulator = 0;

  const loop = (currentTime) => {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += deltaTime;

    while (accumulator >= timestep) {
      callback(timestep / 1000);
      accumulator -= timestep;
    }

    requestAnimationFrame(loop);
  };

  return {
    start: () => requestAnimationFrame(loop),
    stop: () => {
      // Implement stop logic if needed
    },
  };
};

// ===================================================
// DEBUG UTILITIES
// ===================================================

/**
 * Create axes helper with labels
 */
export const createLabeledAxes = (size = 1) => {
  const axes = new THREE.AxesHelper(size);

  // Future: Add text labels for X, Y, Z
  return axes;
};

/**
 * Log performance metrics
 */
export const logPerformance = (label, func) => {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

/**
 * Create debug panel (placeholder)
 */
export const createDebugPanel = (options = {}) => {
  // Future: Create debug UI panel
  console.log("Debug panel creation - to be implemented");
};

// ===================================================
// TEXTURE OPTIMIZATION UTILITIES
// ===================================================

/**
 * Detect supported texture compression formats
 */
export const getTextureCompressionSupport = (renderer) => {
  const gl = renderer.getContext();
  const extensions = {
    s3tc: renderer.extensions.has("WEBGL_compressed_texture_s3tc"),
    s3tc_srgb: renderer.extensions.has("WEBGL_compressed_texture_s3tc_srgb"),
    etc1: renderer.extensions.has("WEBGL_compressed_texture_etc1"),
    pvrtc: renderer.extensions.has("WEBGL_compressed_texture_pvrtc"),
    astc: renderer.extensions.has("WEBGL_compressed_texture_astc"),
    bptc: renderer.extensions.has("EXT_texture_compression_bptc"),
  };

  return extensions;
};

/**
 * Optimize texture for performance
 */
export const optimizeTexture = (texture, options = {}) => {
  const config = {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    anisotropy: 4,
    powerOfTwo: true,
    ...options,
  };

  // Set filtering
  texture.minFilter = config.minFilter;
  texture.magFilter = config.magFilter;
  texture.generateMipmaps = config.generateMipmaps;
  texture.anisotropy = config.anisotropy;

  // Ensure power of two if required
  if (config.powerOfTwo && texture.image) {
    const { width, height } = texture.image;
    if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
      console.warn(
        `Texture dimensions ${width}x${height} are not power of two`,
      );
    }
  }

  texture.needsUpdate = true;
  return texture;
};

/**
 * Check if number is power of two
 */
export const isPowerOfTwo = (value) => {
  return (value & (value - 1)) === 0 && value !== 0;
};

/**
 * Calculate texture memory usage
 */
export const calculateTextureMemory = (texture) => {
  if (!texture.image) return 0;

  const { width, height } = texture.image;
  const bytesPerPixel = 4; // Assuming RGBA
  const baseMemory = width * height * bytesPerPixel;

  // Account for mipmaps if enabled
  let totalMemory = baseMemory;
  if (texture.generateMipmaps) {
    // Mipmaps add approximately 33% more memory
    totalMemory *= 1.33;
  }

  return totalMemory / (1024 * 1024); // Return in MB
};

/**
 * Create texture loader with progress tracking
 */
export const createTextureLoader = (onProgress) => {
  const loader = new THREE.TextureLoader();
  const loadingTextures = new Map();

  const loadTexture = async (url, options = {}) => {
    if (loadingTextures.has(url)) {
      return loadingTextures.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          // Apply optimizations
          if (options.optimize !== false) {
            optimizeTexture(texture, options);
          }

          loadingTextures.delete(url);
          resolve(texture);
        },
        (progress) => {
          if (onProgress) {
            onProgress(url, progress.loaded / progress.total);
          }
        },
        (error) => {
          loadingTextures.delete(url);
          reject(error);
        },
      );
    });

    loadingTextures.set(url, promise);
    return promise;
  };

  return {
    load: loadTexture,
    loadMultiple: async (urls, options = {}) => {
      return Promise.all(urls.map((url) => loadTexture(url, options)));
    },
  };
};

/**
 * Dispose textures safely
 */
export const disposeTextures = (...textures) => {
  textures.forEach((texture) => {
    if (texture && texture.dispose) {
      texture.dispose();
    }
  });
};

/**
 * Create texture atlas from multiple images
 */
export const createTextureAtlas = async (imageUrls, atlasSize = 2048) => {
  const canvas = document.createElement("canvas");
  canvas.width = atlasSize;
  canvas.height = atlasSize;
  const ctx = canvas.getContext("2d");

  const images = await Promise.all(imageUrls.map((url) => loadImage(url)));

  // Simple packing algorithm
  const regions = [];
  let x = 0,
    y = 0,
    rowHeight = 0;

  images.forEach((img, index) => {
    if (x + img.width > atlasSize) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }

    ctx.drawImage(img, x, y);

    regions.push({
      index,
      x,
      y,
      width: img.width,
      height: img.height,
      uvs: {
        x1: x / atlasSize,
        y1: y / atlasSize,
        x2: (x + img.width) / atlasSize,
        y2: (y + img.height) / atlasSize,
      },
    });

    x += img.width;
    rowHeight = Math.max(rowHeight, img.height);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return { texture, regions };
};

/**
 * Load image as promise
 */
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Monitor texture memory usage
 */
export const createTextureMemoryMonitor = () => {
  const textures = new WeakMap();

  return {
    register: (texture) => {
      const memory = calculateTextureMemory(texture);
      textures.set(texture, memory);
      return memory;
    },

    getTotal: () => {
      // Note: WeakMap doesn't allow iteration
      // This would need a different implementation for full tracking
      console.warn(
        "Full memory tracking requires manual texture list management",
      );
      return 0;
    },
  };
};
