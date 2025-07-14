import * as THREE from "three";

/**
 * Optimized CubeMap Loader System
 * High-performance environment map loading with progressive loading and caching
 */
export class CubeMapLoader {
  constructor(sceneManager, options = {}) {
    this.sceneManager = sceneManager;
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.loadedCubeMaps = new Map();
    this.loadingPromises = new Map();
    this.currentCubeMap = null;
    this.disposed = false;
    this.performanceMonitor = options.performanceMonitor || null;

    this.config = {
      basePath: "/img/",
      defaultCubeMap: "level-1",
      preloadDelay: 1000, // Delay before preloading other maps
      textureSize: 512, // Reduced size for performance
      enablePreload: false, // Disabled by default - load on demand only
      enableCache: true,
      maxCacheSize: 4, // Maximum number of cached cubemaps
      ...options,
    };

    // Define available cube maps with optimized settings
    this.cubeMapDefinitions = {
      "level-1": {
        name: "Level 1 - Bright Sky",
        path: "level-1",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
        priority: 1,
      },
      "level-2": {
        name: "Level 2 - Cloudy",
        path: "level-2",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
        priority: 2,
      },
      "level-3": {
        name: "Level 3 - Sunset",
        path: "level-3",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
        priority: 3,
      },
      "level-4": {
        name: "Level 4 - Night",
        path: "level-4",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
        priority: 4,
      },
      none: {
        name: "None - No Environment",
        path: null,
        files: null,
        priority: 99,
      },
    };

    // Performance tracking
    this.loadTimes = new Map();

    // Initialize with requestIdleCallback for non-blocking load
    if (this.config.defaultCubeMap && this.config.defaultCubeMap !== "none") {
      console.log(
        `[CubeMapLoader] Initializing with default cubemap: ${this.config.defaultCubeMap}`,
      );
      this.loadCubeMapAsync(this.config.defaultCubeMap);
    }
  }

  /**
   * Load cubemap asynchronously without blocking
   */
  async loadCubeMapAsync(cubeMapId) {
    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleLoad = (callback) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(callback, { timeout: 100 });
      } else {
        setTimeout(callback, 0);
      }
    };

    return new Promise((resolve) => {
      scheduleLoad(() => {
        this.loadCubeMap(cubeMapId).then(resolve);
      });
    });
  }

  /**
   * Get available cube map options for UI
   */
  getCubeMapOptions() {
    const options = {};
    Object.entries(this.cubeMapDefinitions).forEach(([key, def]) => {
      options[def.name] = key;
    });
    return options;
  }

  /**
   * Load a specific cube map with optimizations
   */
  async loadCubeMap(cubeMapId) {
    console.log(`[CubeMapLoader] loadCubeMap called for: ${cubeMapId}`);
    const startTime = performance.now();

    // Handle 'none' option
    if (cubeMapId === "none") {
      this.currentCubeMap = null;
      this.sceneManager.scene.environment = null;
      if (this.sceneManager.config.environment.background) {
        this.sceneManager.scene.background = null;
      }
      return null;
    }

    // Check if already loaded (cache hit)
    if (this.config.enableCache && this.loadedCubeMaps.has(cubeMapId)) {
      const texture = this.loadedCubeMaps.get(cubeMapId);
      this.applyCubeMap(texture, cubeMapId);

      // Track cache hit
      if (this.performanceMonitor) {
        this.performanceMonitor.recordCacheHit();
      }

      console.log(
        `CubeMap ${cubeMapId} loaded from cache in ${(performance.now() - startTime).toFixed(2)}ms`,
      );
      return texture;
    }

    // Track cache miss
    if (this.performanceMonitor && this.config.enableCache) {
      this.performanceMonitor.recordCacheMiss();
    }

    // Check if already loading
    if (this.loadingPromises.has(cubeMapId)) {
      return this.loadingPromises.get(cubeMapId);
    }

    // Get cube map definition
    const definition = this.cubeMapDefinitions[cubeMapId];
    if (!definition || !definition.path) {
      console.error(`Cube map definition not found: ${cubeMapId}`);
      return null;
    }

    // Build file paths
    const urls = definition.files.map(
      (file) => `${this.config.basePath}${definition.path}/${file}`,
    );

    // Track loading start
    if (this.performanceMonitor) {
      this.performanceMonitor.startTextureLoad(cubeMapId);
    }

    // Create loading promise
    const loadingPromise = this._loadTextureAsync(urls, cubeMapId);
    this.loadingPromises.set(cubeMapId, loadingPromise);

    try {
      const texture = await loadingPromise;

      // Apply optimizations
      this._optimizeTexture(texture);

      // Cache management
      this._manageCacheSize();

      if (this.config.enableCache) {
        this.loadedCubeMaps.set(cubeMapId, texture);
      }

      this.applyCubeMap(texture, cubeMapId);

      const loadTime = performance.now() - startTime;
      this.loadTimes.set(cubeMapId, loadTime);
      console.log(`CubeMap ${cubeMapId} loaded in ${loadTime.toFixed(2)}ms`);

      // Track successful load
      if (this.performanceMonitor) {
        this.performanceMonitor.endTextureLoad(cubeMapId, true);
      }

      // Only schedule preloading if explicitly enabled and not already loading
      if (
        this.config.enablePreload &&
        this.currentCubeMap === cubeMapId &&
        !this.preloadTimeout
      ) {
        this._schedulePreload(cubeMapId);
      }

      return texture;
    } catch (error) {
      console.error(`Failed to load cube map ${cubeMapId}:`, error);

      // Track failed load
      if (this.performanceMonitor) {
        this.performanceMonitor.endTextureLoad(cubeMapId, false);
      }

      throw error;
    } finally {
      this.loadingPromises.delete(cubeMapId);
    }
  }

  /**
   * Load texture asynchronously with proper error handling
   */
  async _loadTextureAsync(urls, cubeMapId) {
    return new Promise((resolve, reject) => {
      this.cubeTextureLoader.load(
        urls,
        (texture) => {
          if (this.disposed) {
            texture.dispose();
            reject(new Error("Loader was disposed"));
            return;
          }
          resolve(texture);
        },
        (progress) => {
          // Progress callback for future UI updates
          if (this.onProgress) {
            this.onProgress(cubeMapId, progress);
          }
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  /**
   * Optimize texture for performance
   */
  _optimizeTexture(texture) {
    // Set texture parameters for better performance
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    // Check if renderer is available before accessing capabilities
    if (this.sceneManager.renderer && this.sceneManager.renderer.capabilities) {
      // Set anisotropy based on device capabilities
      const maxAnisotropy =
        this.sceneManager.renderer.capabilities.getMaxAnisotropy();
      texture.anisotropy = Math.min(4, maxAnisotropy);

      // Enable texture compression if supported
      if (this.sceneManager.renderer.capabilities.isWebGL2) {
        texture.encoding = THREE.sRGBEncoding;
      }
    } else {
      // Use safe defaults when renderer is not available
      texture.anisotropy = 4;
      texture.encoding = THREE.sRGBEncoding;
    }
  }

  /**
   * Manage cache size to prevent memory issues
   */
  _manageCacheSize() {
    if (this.loadedCubeMaps.size >= this.config.maxCacheSize) {
      // Find least recently used cubemap
      let oldestKey = null;
      let oldestTime = Infinity;

      for (const [key, texture] of this.loadedCubeMaps) {
        if (key !== this.currentCubeMap) {
          const loadTime = this.loadTimes.get(key) || 0;
          if (loadTime < oldestTime) {
            oldestTime = loadTime;
            oldestKey = key;
          }
        }
      }

      // Remove oldest if found
      if (oldestKey) {
        const texture = this.loadedCubeMaps.get(oldestKey);
        if (texture) {
          texture.dispose();
        }
        this.loadedCubeMaps.delete(oldestKey);
        this.loadTimes.delete(oldestKey);
        console.log(`Evicted ${oldestKey} from cache`);
      }
    }
  }

  /**
   * Schedule preloading of other cubemaps
   */
  _schedulePreload(currentCubeMapId) {
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }

    this.preloadTimeout = setTimeout(() => {
      if (this.disposed) return;

      // Get cubemaps sorted by priority
      const sortedMaps = Object.entries(this.cubeMapDefinitions)
        .filter(
          ([key, def]) =>
            key !== currentCubeMapId &&
            key !== "none" &&
            def.path &&
            !this.loadedCubeMaps.has(key),
        )
        .sort((a, b) => a[1].priority - b[1].priority);

      // Preload one at a time with idle callback
      const preloadNext = (index) => {
        if (index >= sortedMaps.length || this.disposed) return;

        const [key] = sortedMaps[index];
        console.log(
          `[CubeMapLoader] Preloading cubemap ${index + 1}/${sortedMaps.length}: ${key}`,
        );

        if ("requestIdleCallback" in window) {
          requestIdleCallback(
            () => {
              if (!this.disposed) {
                this.loadCubeMap(key)
                  .then(() => preloadNext(index + 1))
                  .catch((err) => {
                    console.warn(`Failed to preload ${key}:`, err);
                    preloadNext(index + 1);
                  });
              }
            },
            { timeout: 2000 },
          );
        } else {
          setTimeout(() => {
            this.loadCubeMap(key)
              .then(() => preloadNext(index + 1))
              .catch(() => preloadNext(index + 1));
          }, 100);
        }
      };

      preloadNext(0);
    }, this.config.preloadDelay);
  }

  /**
   * Apply cube map to scene with optimizations
   */
  applyCubeMap(texture, cubeMapId) {
    console.log(
      `[CubeMapLoader] Attempting to apply cubemap: ${cubeMapId}, current: ${this.currentCubeMap}`,
    );

    // Only apply if it's a different cubemap to prevent unnecessary updates
    if (this.currentCubeMap === cubeMapId) {
      console.log(
        `[CubeMapLoader] Skipping - same cubemap already applied: ${cubeMapId}`,
      );
      return;
    }

    this.currentCubeMap = cubeMapId;
    console.log(`[CubeMapLoader] Applying new cubemap: ${cubeMapId}`);

    // Apply to scene
    this.sceneManager.scene.environment = texture;

    // Use lower intensity for better performance
    const intensity =
      this.sceneManager.config.environment.environmentIntensity || 1.0;
    this.sceneManager.scene.environmentIntensity = intensity * 0.8;

    // Apply as background if enabled
    if (this.sceneManager.config.environment.background) {
      this.sceneManager.scene.background = texture;
      this.sceneManager.scene.backgroundIntensity =
        (this.sceneManager.config.environment.backgroundIntensity || 1.0) * 0.8;
      this.sceneManager.scene.backgroundBlurriness =
        this.sceneManager.config.environment.backgroundBlurriness || 0;
    }

    // Update load time for LRU cache
    this.loadTimes.set(cubeMapId, performance.now());

    // Dispatch event
    if (this.onCubeMapChange) {
      this.onCubeMapChange(cubeMapId, texture);
    }
  }

  /**
   * Get current cube map ID
   */
  getCurrentCubeMap() {
    return this.currentCubeMap || "none";
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  /**
   * Set performance monitor
   */
  setPerformanceMonitor(monitor) {
    this.performanceMonitor = monitor;
  }

  /**
   * Set change callback
   */
  setChangeCallback(callback) {
    this.onCubeMapChange = callback;
  }

  /**
   * Create Tweakpane configuration
   */
  getTweakpaneConfig() {
    return {
      cubeMap: {
        value: this.getCurrentCubeMap(),
        options: this.getCubeMapOptions(),
      },
      enablePreload: this.config.enablePreload,
      enableCache: this.config.enableCache,
    };
  }

  /**
   * Handle Tweakpane change
   */
  async handleTweakpaneChange(value) {
    console.log(
      `[CubeMapLoader] handleTweakpaneChange called with: ${value}, current: ${this.currentCubeMap}`,
    );
    if (value !== this.currentCubeMap) {
      try {
        await this.loadCubeMap(value);
      } catch (error) {
        console.error("Failed to load cube map:", error);
        // Revert to previous if available
        if (
          this.currentCubeMap &&
          this.loadedCubeMaps.has(this.currentCubeMap)
        ) {
          this.applyCubeMap(
            this.loadedCubeMaps.get(this.currentCubeMap),
            this.currentCubeMap,
          );
        }
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      loadedCount: this.loadedCubeMaps.size,
      currentMap: this.currentCubeMap,
      loadTimes: Object.fromEntries(this.loadTimes),
      averageLoadTime:
        this.loadTimes.size > 0
          ? Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) /
            this.loadTimes.size
          : 0,
      cacheHitRate: this._calculateCacheHitRate(),
    };
  }

  /**
   * Calculate cache hit rate
   */
  _calculateCacheHitRate() {
    // Implementation would track hits vs misses
    return 0; // Placeholder
  }

  /**
   * Clear cache selectively
   */
  clearCache(keepCurrent = true) {
    this.loadedCubeMaps.forEach((texture, key) => {
      if (!keepCurrent || key !== this.currentCubeMap) {
        texture.dispose();
        this.loadedCubeMaps.delete(key);
        this.loadTimes.delete(key);
      }
    });
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    this.disposed = true;

    // Clear preload timeout
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
      this.preloadTimeout = null;
    }

    // Clear all cached textures
    this.loadedCubeMaps.forEach((texture) => {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    });

    this.loadedCubeMaps.clear();
    this.loadingPromises.clear();
    this.loadTimes.clear();

    this.currentCubeMap = null;
    this.sceneManager = null;
    this.onProgress = null;
    this.onCubeMapChange = null;
  }
}
