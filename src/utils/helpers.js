import * as THREE from "three";

/**
 * Utility functions for common operations
 */

// ===================================================
// MATH UTILITIES
// ===================================================

/**
 * Clamps a value between a minimum and maximum range.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Performs linear interpolation between two values.
 * @param {number} start - The starting value.
 * @param {number} end - The ending value.
 * @param {number} t - The interpolation factor (0 to 1).
 * @returns {number} The interpolated value.
 */
export const lerp = (start, end, t) => {
  return start + (end - start) * t;
};

/**
 * Performs smooth Hermite interpolation between 0 and 1.
 * @param {number} edge0 - The lower edge of the transition.
 * @param {number} edge1 - The upper edge of the transition.
 * @param {number} x - The value to interpolate.
 * @returns {number} The interpolated value.
 */
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
};

/**
 * Maps a value from one numerical range to another.
 * @param {number} value - The value to map.
 * @param {number} inMin - The lower bound of the input range.
 * @param {number} inMax - The upper bound of the input range.
 * @param {number} outMin - The lower bound of the output range.
 * @param {number} outMax - The upper bound of the output range.
 * @returns {number} The mapped value.
 */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Generates a random floating-point number within a specified range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random float between min and max.
 */
export const randomRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Generates a random integer within a specified range (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random integer between min and max.
 */
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ===================================================
// VECTOR UTILITIES
// ===================================================

/**
 * Generates a random point within a sphere of a given radius.
 * @param {number} [radius=1] - The radius of the sphere.
 * @returns {THREE.Vector3} A vector representing the random point.
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
 * Generates a random point on the surface of a sphere.
 * @param {number} [radius=1] - The radius of the sphere.
 * @returns {THREE.Vector3} A vector representing the random point on the sphere's surface.
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
 * Selects a random color from a given palette.
 * @param {Array<THREE.Color|string|number>} palette - An array of colors.
 * @returns {THREE.Color|string|number} A random color from the palette.
 */
export const randomColorFromPalette = (palette) => {
  return palette[Math.floor(Math.random() * palette.length)];
};

/**
 * Interpolates between two colors.
 * @param {THREE.Color|string|number} color1 - The starting color.
 * @param {THREE.Color|string|number} color2 - The ending color.
 * @param {number} t - The interpolation factor (0 to 1).
 * @returns {THREE.Color} The interpolated color.
 */
export const lerpColor = (color1, color2, t) => {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, t);
};

/**
 * Calculates the complementary color of a given color.
 * @param {THREE.Color|string|number} color - The input color.
 * @returns {THREE.Color} The complementary color.
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
 * Detects if the current device is a mobile device based on its user agent string.
 * @returns {boolean} True if the device is identified as mobile, false otherwise.
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

/**
 * Detects if the current device supports touch events.
 * @returns {boolean} True if touch events are supported, false otherwise.
 */
export const isTouchDevice = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * Gets the device's pixel ratio, with an optional cap for performance reasons.
 * @param {number} [maxRatio=2] - The maximum allowed pixel ratio.
 * @returns {number} The capped device pixel ratio.
 */
export const getPixelRatio = (maxRatio = 2) => {
  return Math.min(window.devicePixelRatio || 1, maxRatio);
};

/**
 * Creates a throttled version of a function that only invokes it at most once per every `delay` milliseconds.
 * @param {Function} func - The function to throttle.
 * @param {number} delay - The throttle delay in milliseconds.
 * @returns {Function} The new throttled function.
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
 * Creates a debounced version of a function that delays invoking it until after `delay` milliseconds have elapsed since the last time it was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {Function} The new debounced function.
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
 * Loads multiple textures asynchronously with progress reporting.
 * @param {string[]} urls - An array of texture URLs to load.
 * @param {Function} [onProgress] - A callback function for progress updates, receiving (progress, index, texture).
 * @returns {Promise<Array<{url: string, texture: THREE.Texture, index: number}>>} A promise that resolves with an array of loaded texture objects.
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
 * Preloads a list of assets that have a `load` method.
 * @param {Array<{load: Function}>} assets - An array of asset objects with a `load` method that returns a promise.
 * @param {Function} [onProgress] - A callback function for progress updates, receiving the overall progress (0 to 1).
 * @returns {Promise<Array<any>>} A promise that resolves with an array of the loaded asset results.
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
 * Creates a rounded box geometry using `THREE.ExtrudeGeometry`.
 * @param {number} width - The width of the box.
 * @param {number} height - The height of the box.
 * @param {number} depth - The depth of the box.
 * @param {number} radius - The radius of the corners.
 * @param {number} [smoothness=2] - The number of segments for the rounded corners.
 * @returns {THREE.ExtrudeGeometry} The resulting rounded box geometry.
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
 * Formats a duration in seconds into a MM:SS string.
 * @param {number} seconds - The total seconds.
 * @returns {string} The formatted time string.
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Creates an animation loop that runs at a fixed timestep, independent of the frame rate.
 * @param {Function} callback - The function to call on each timestep, receiving the fixed delta time.
 * @param {number} [fps=60] - The target frames per second for the fixed timestep.
 * @returns {{start: Function, stop: Function}} An object with methods to start and stop the loop.
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
 * Creates a `THREE.AxesHelper` for debugging purposes.
 * @param {number} [size=1] - The size of the axes.
 * @returns {THREE.AxesHelper} The created axes helper.
 */
export const createLabeledAxes = (size = 1) => {
  const axes = new THREE.AxesHelper(size);

  // Future: Add text labels for X, Y, Z
  return axes;
};

/**
 * A utility to measure and log the execution time of a function.
 * @param {string} label - A label for the performance log.
 * @param {Function} func - The function to execute and measure.
 * @returns {*} The result of the executed function.
 */
export const logPerformance = (label, func) => {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  console.log(`${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

/**
 * Placeholder function for creating a debug panel.
 * @param {object} [options={}] - Configuration for the debug panel.
 */
export const createDebugPanel = (options = {}) => {
  // Future: Create debug UI panel
  console.log("Debug panel creation - to be implemented");
};

// ===================================================
// TEXTURE OPTIMIZATION UTILITIES
// ===================================================

/**
 * Detects which compressed texture formats are supported by the current WebGL context.
 * @param {THREE.WebGLRenderer} renderer - The renderer instance.
 * @returns {object} An object with boolean flags for each supported format (s3tc, etc1, pvrtc, etc.).
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
 * Applies common performance optimizations to a texture.
 * @param {THREE.Texture} texture - The texture to optimize.
 * @param {object} [options={}] - Optimization options.
 * @param {boolean} [options.generateMipmaps=true] - Whether to generate mipmaps.
 * @param {THREE.Filter} [options.minFilter=THREE.LinearMipmapLinearFilter] - Minification filter.
 * @param {THREE.Filter} [options.magFilter=THREE.LinearFilter] - Magnification filter.
 * @param {number} [options.anisotropy=4] - Anisotropy level.
 * @param {boolean} [options.powerOfTwo=true] - Whether to enforce power-of-two dimensions.
 * @returns {THREE.Texture} The optimized texture.
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
 * Checks if a number is a power of two.
 * @param {number} value - The number to check.
 * @returns {boolean} True if the number is a power of two.
 */
export const isPowerOfTwo = (value) => {
  return (value & (value - 1)) === 0 && value !== 0;
};

/**
 * Calculates the approximate memory usage of a texture in megabytes.
 * @param {THREE.Texture} texture - The texture to measure.
 * @returns {number} The estimated memory usage in MB.
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
 * Creates a texture loader with built-in progress tracking and optimization.
 * @param {Function} [onProgress] - A callback for progress updates, receiving (url, progress).
 * @returns {{load: Function, loadMultiple: Function}} An object with `load` and `loadMultiple` methods.
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
 * Safely disposes of one or more textures.
 * @param {...(THREE.Texture|null)} textures - The textures to dispose of.
 */
export const disposeTextures = (...textures) => {
  textures.forEach((texture) => {
    if (texture && texture.dispose) {
      texture.dispose();
    }
  });
};

/**
 * Creates a texture atlas from a list of image URLs.
 * @param {string[]} imageUrls - The URLs of the images to include in the atlas.
 * @param {number} [atlasSize=2048] - The width and height of the atlas canvas.
 * @returns {Promise<{texture: THREE.CanvasTexture, regions: Array<object>}>} A promise that resolves with the atlas texture and region data.
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
 * Loads an image from a URL and returns a promise that resolves with the HTMLImageElement.
 * @param {string} url - The URL of the image to load.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image.
 * @private
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
 * Creates a utility to monitor texture memory usage.
 * @returns {{register: Function, getTotal: Function}} An object with methods to register textures and get the total memory.
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
