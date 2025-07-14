import * as THREE from "three";

/**
 * Simple CubeMap Loader - Load on Demand Only
 * No automatic preloading or environment switching
 */
export class SimpleCubeMapLoader {
  constructor(sceneManager, options = {}) {
    this.sceneManager = sceneManager;
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.loadedCubeMaps = new Map();
    this.currentCubeMap = null;
    this.isLoading = false;

    this.config = {
      basePath: "/img/",
      defaultCubeMap: "level-1",
      enableCache: true,
      ...options,
    };

    // Define available cube maps
    this.cubeMapDefinitions = {
      "level-1": {
        name: "Level 1 - Bright Sky",
        path: "level-1",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
      },
      "level-2": {
        name: "Level 2 - Cloudy",
        path: "level-2",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
      },
      "level-3": {
        name: "Level 3 - Sunset",
        path: "level-3",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
      },
      "level-4": {
        name: "Level 4 - Night",
        path: "level-4",
        files: ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
      },
      none: {
        name: "None - No Environment",
        path: null,
        files: null,
      },
    };

    // Load default cube map only
    if (this.config.defaultCubeMap && this.config.defaultCubeMap !== "none") {
      console.log(
        `[SimpleCubeMapLoader] Loading default: ${this.config.defaultCubeMap}`,
      );
      this.loadCubeMap(this.config.defaultCubeMap);
    }
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
   * Load a specific cube map - only loads when explicitly called
   */
  async loadCubeMap(cubeMapId) {
    // Prevent multiple simultaneous loads of the same map
    if (this.isLoading && this.currentCubeMap === cubeMapId) {
      console.log(`[SimpleCubeMapLoader] Already loading: ${cubeMapId}`);
      return null;
    }

    // Don't reload if already current
    if (
      this.currentCubeMap === cubeMapId &&
      this.loadedCubeMaps.has(cubeMapId)
    ) {
      console.log(
        `[SimpleCubeMapLoader] Already loaded and active: ${cubeMapId}`,
      );
      return this.loadedCubeMaps.get(cubeMapId);
    }

    console.log(`[SimpleCubeMapLoader] Loading cubemap: ${cubeMapId}`);

    // Handle 'none' option
    if (cubeMapId === "none") {
      this.clearEnvironment();
      return null;
    }

    // Check cache first
    if (this.config.enableCache && this.loadedCubeMaps.has(cubeMapId)) {
      console.log(`[SimpleCubeMapLoader] Using cached: ${cubeMapId}`);
      const texture = this.loadedCubeMaps.get(cubeMapId);
      this.applyEnvironment(texture, cubeMapId);
      return texture;
    }

    // Get cube map definition
    const definition = this.cubeMapDefinitions[cubeMapId];
    if (!definition || !definition.path) {
      console.error(`[SimpleCubeMapLoader] Definition not found: ${cubeMapId}`);
      return null;
    }

    // Build file paths
    const urls = definition.files.map(
      (file) => `${this.config.basePath}${definition.path}/${file}`,
    );

    this.isLoading = true;

    try {
      const texture = await new Promise((resolve, reject) => {
        this.cubeTextureLoader.load(
          urls,
          (loadedTexture) => {
            // Optimize texture
            this.optimizeTexture(loadedTexture);

            // Cache if enabled
            if (this.config.enableCache) {
              this.loadedCubeMaps.set(cubeMapId, loadedTexture);
            }

            resolve(loadedTexture);
          },
          undefined,
          (error) => {
            console.error(
              `[SimpleCubeMapLoader] Failed to load ${cubeMapId}:`,
              error,
            );
            reject(error);
          },
        );
      });

      this.applyEnvironment(texture, cubeMapId);
      this.isLoading = false;
      return texture;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Optimize texture for performance
   */
  optimizeTexture(texture) {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    // Set safe defaults for anisotropy
    if (this.sceneManager.renderer?.capabilities) {
      const maxAnisotropy =
        this.sceneManager.renderer.capabilities.getMaxAnisotropy();
      texture.anisotropy = Math.min(4, maxAnisotropy);
    } else {
      texture.anisotropy = 4;
    }

    texture.colorSpace = THREE.SRGBColorSpace;
  }

  /**
   * Apply environment to scene
   */
  applyEnvironment(texture, cubeMapId) {
    this.currentCubeMap = cubeMapId;
    console.log(`[SimpleCubeMapLoader] Applied environment: ${cubeMapId}`);

    // Apply to scene
    this.sceneManager.scene.environment = texture;
    this.sceneManager.scene.environmentIntensity =
      this.sceneManager.config.environment.environmentIntensity || 1.0;

    // Apply as background if enabled
    if (this.sceneManager.config.environment.background) {
      this.sceneManager.scene.background = texture;
      this.sceneManager.scene.backgroundIntensity =
        this.sceneManager.config.environment.backgroundIntensity || 1.0;
      this.sceneManager.scene.backgroundBlurriness =
        this.sceneManager.config.environment.backgroundBlurriness || 0;
    }

    // Dispatch event
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange(cubeMapId, texture);
    }
  }

  /**
   * Clear environment
   */
  clearEnvironment() {
    this.currentCubeMap = "none";
    this.sceneManager.scene.environment = null;
    if (this.sceneManager.config.environment.background) {
      this.sceneManager.scene.background = null;
    }
    console.log("[SimpleCubeMapLoader] Cleared environment");
  }

  /**
   * Get current cube map ID
   */
  getCurrentCubeMap() {
    return this.currentCubeMap || "none";
  }

  /**
   * Set environment change callback
   */
  setChangeCallback(callback) {
    this.onEnvironmentChange = callback;
  }

  /**
   * Handle UI change - only loads when user explicitly selects
   */
  async handleUIChange(value) {
    console.log(`[SimpleCubeMapLoader] UI change requested: ${value}`);
    if (value !== this.currentCubeMap) {
      try {
        await this.loadCubeMap(value);
      } catch (error) {
        console.error("[SimpleCubeMapLoader] Failed to load:", error);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(keepCurrent = true) {
    this.loadedCubeMaps.forEach((texture, key) => {
      if (!keepCurrent || key !== this.currentCubeMap) {
        texture.dispose();
        this.loadedCubeMaps.delete(key);
      }
    });
    console.log("[SimpleCubeMapLoader] Cache cleared");
  }

  /**
   * Get memory usage stats
   */
  getStats() {
    let totalMemory = 0;
    this.loadedCubeMaps.forEach((texture) => {
      // Estimate: 6 faces * width * height * 4 bytes per pixel
      const size = texture.image?.[0]?.width || 512;
      totalMemory += 6 * size * size * 4;
    });

    return {
      cachedMaps: this.loadedCubeMaps.size,
      currentMap: this.currentCubeMap,
      estimatedMemoryMB: (totalMemory / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * Dispose all resources
   */
  dispose() {
    // Clear all cached textures
    this.loadedCubeMaps.forEach((texture) => {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    });

    this.loadedCubeMaps.clear();
    this.currentCubeMap = null;
    this.sceneManager = null;
    this.onEnvironmentChange = null;

    console.log("[SimpleCubeMapLoader] Disposed");
  }
}
