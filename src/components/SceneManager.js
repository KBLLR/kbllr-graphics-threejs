import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

/**
 * Modern scene management system
 * Handles scene setup, lighting, environment, and effects
 */
export class SceneManager {
  constructor(options = {}) {
    this.config = {
      fog: {
        enabled: false,
        color: 0xffffff,
        near: 0.1,
        far: 6,
      },
      grid: {
        enabled: false,
        size: 40,
        divisions: 400,
        color1: 0x444444,
        color2: 0x888888,
      },
      environment: {
        type: "cubemap", // 'cubemap' | 'hdri' | 'color'
        background: true,
        backgroundIntensity: 1,
        backgroundBlurriness: 0,
        environmentIntensity: 1,
        toneMappingExposure: 1,
      },
      lights: {
        hemisphere: {
          enabled: true,
          skyColor: 0xffffff,
          groundColor: 0xffffff,
          intensity: 1.61,
        },
        directional: {
          enabled: true,
          color: 0xffffff,
          intensity: 1.25,
          position: new THREE.Vector3(20, 2, 2),
          castShadow: true,
          shadowMapSize: 1024,
        },
      },
      ...options,
    };

    this.scene = new THREE.Scene();
    this.lights = {};
    this.helpers = {};
    this.loaders = {
      texture: new THREE.TextureLoader(),
      cubeTexture: new THREE.CubeTextureLoader(),
      rgbe: new RGBELoader(),
    };

    this._init();
  }

  _init() {
    this._setupFog();
    this._setupLights();
    this._setupHelpers();
  }

  _setupFog() {
    if (this.config.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.config.fog.color,
        this.config.fog.near,
        this.config.fog.far,
      );
    }
  }

  _setupLights() {
    const { lights } = this.config;

    // Hemisphere light
    if (lights.hemisphere.enabled) {
      this.lights.hemisphere = new THREE.HemisphereLight(
        lights.hemisphere.skyColor,
        lights.hemisphere.groundColor,
        lights.hemisphere.intensity,
      );
      this.lights.hemisphere.position.set(0, 0, 0);
      this.scene.add(this.lights.hemisphere);
    }

    // Directional light
    if (lights.directional.enabled) {
      this.lights.directional = new THREE.DirectionalLight(
        lights.directional.color,
        lights.directional.intensity,
      );
      this.lights.directional.position.copy(lights.directional.position);
      this.lights.directional.castShadow = lights.directional.castShadow;

      if (lights.directional.castShadow) {
        this.lights.directional.shadow.mapSize.width =
          lights.directional.shadowMapSize;
        this.lights.directional.shadow.mapSize.height =
          lights.directional.shadowMapSize;

        // Optional: Configure shadow camera
        const shadowCam = this.lights.directional.shadow.camera;
        shadowCam.near = 0.5;
        shadowCam.far = 50;
        shadowCam.left = -10;
        shadowCam.right = 10;
        shadowCam.top = 10;
        shadowCam.bottom = -10;
      }

      this.scene.add(this.lights.directional);
    }
  }

  _setupHelpers() {
    if (this.config.grid.enabled) {
      this.helpers.grid = new THREE.GridHelper(
        this.config.grid.size,
        this.config.grid.divisions,
        this.config.grid.color1,
        this.config.grid.color2,
      );
      this.helpers.grid.position.y = 0.001;
      this.scene.add(this.helpers.grid);
    }
  }

  /**
   * Load environment map (cubemap)
   * @param {Array<string>} urls - Array of 6 texture URLs [px, nx, py, ny, pz, nz]
   */
  async loadCubeMap(urls) {
    return new Promise((resolve, reject) => {
      this.loaders.cubeTexture.load(
        urls,
        (texture) => {
          if (this.config.environment.background) {
            this.scene.background = texture;
            this.scene.backgroundIntensity =
              this.config.environment.backgroundIntensity;
            this.scene.backgroundBlurriness =
              this.config.environment.backgroundBlurriness;
          }
          this.scene.environment = texture;
          this.scene.environmentIntensity =
            this.config.environment.environmentIntensity;
          resolve(texture);
        },
        undefined,
        reject,
      );
    });
  }

  /**
   * Load HDR environment
   * @param {string} url - HDR file URL
   */
  async loadHDRI(url) {
    return new Promise((resolve, reject) => {
      this.loaders.rgbe.load(
        url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          if (this.config.environment.background) {
            this.scene.background = texture;
            this.scene.backgroundIntensity =
              this.config.environment.backgroundIntensity;
            this.scene.backgroundBlurriness =
              this.config.environment.backgroundBlurriness;
          }
          this.scene.environment = texture;
          this.scene.environmentIntensity =
            this.config.environment.environmentIntensity;

          resolve(texture);
        },
        undefined,
        reject,
      );
    });
  }

  /**
   * Set solid color background
   * @param {number|string} color - Color value
   */
  setBackgroundColor(color) {
    this.scene.background = new THREE.Color(color);
  }

  /**
   * Update fog parameters
   */
  setFog(enabled, near, far, color) {
    this.config.fog.enabled = enabled;

    if (enabled) {
      this.config.fog.near = near ?? this.config.fog.near;
      this.config.fog.far = far ?? this.config.fog.far;
      this.config.fog.color = color ?? this.config.fog.color;
      this._setupFog();
    } else {
      this.scene.fog = null;
    }
  }

  /**
   * Toggle grid helper
   */
  toggleGrid(enabled) {
    this.config.grid.enabled = enabled;
    if (this.helpers.grid) {
      this.helpers.grid.visible = enabled;
    }
  }

  /**
   * Update directional light
   */
  updateDirectionalLight(properties) {
    if (!this.lights.directional) return;

    const light = this.lights.directional;

    if (properties.color !== undefined) {
      light.color.set(properties.color);
    }
    if (properties.intensity !== undefined) {
      light.intensity = properties.intensity;
    }
    if (properties.position) {
      light.position.copy(properties.position);
    }
    if (properties.castShadow !== undefined) {
      light.castShadow = properties.castShadow;
    }
  }

  /**
   * Update environment intensity
   */
  updateEnvironmentIntensity(intensity) {
    this.config.environment.environmentIntensity = intensity;
    this.scene.environmentIntensity = intensity;
  }

  /**
   * Update background intensity
   */
  updateBackgroundIntensity(intensity) {
    this.config.environment.backgroundIntensity = intensity;
    this.scene.backgroundIntensity = intensity;
  }

  /**
   * Update background blur
   */
  updateBackgroundBlurriness(blurriness) {
    this.config.environment.backgroundBlurriness = blurriness;
    this.scene.backgroundBlurriness = blurriness;
  }

  /**
   * Toggle environment/background
   */
  toggleEnvironment(enabled) {
    if (enabled) {
      this.scene.environment = this._lastEnvironment;
    } else {
      this._lastEnvironment = this.scene.environment;
      this.scene.environment = null;
    }
  }

  /**
   * Toggle background
   */
  toggleBackground(enabled) {
    this.config.environment.background = enabled;
    if (enabled && this._lastBackground) {
      this.scene.background = this._lastBackground;
    } else if (!enabled) {
      this._lastBackground = this.scene.background;
      this.scene.background = null;
    }
  }

  /**
   * Update tone mapping exposure
   */
  updateToneMappingExposure(exposure, renderer) {
    this.config.environment.toneMappingExposure = exposure;
    if (renderer) {
      renderer.toneMappingExposure = exposure;
    }
  }

  /**
   * Add post-processing effects (placeholder for future expansion)
   */
  addPostProcessing(composer) {
    // Future: Add bloom, DOF, color correction, etc.
    console.log("Post-processing support coming soon");
  }

  /**
   * Get the Three.js scene
   */
  getScene() {
    return this.scene;
  }

  /**
   * Update method for animations
   */
  update(deltaTime, elapsedTime) {
    // Future: Add animated environment effects
    // e.g., moving clouds, dynamic lighting, etc.
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Dispose of textures
    if (this.scene.background && this.scene.background.dispose) {
      this.scene.background.dispose();
    }
    if (this.scene.environment && this.scene.environment.dispose) {
      this.scene.environment.dispose();
    }

    // Remove all objects
    this.scene.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    // Clear the scene
    this.scene.clear();
  }
}
