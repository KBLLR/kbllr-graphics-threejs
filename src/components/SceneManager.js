import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

/**
 * @class SceneManager
 * @classdesc Manages the core components of a Three.js scene, including lighting, fog,
 * environment maps, and helpers. It provides a structured way to configure and
 * control the overall scene environment.
 *
 * @param {object} [options={}] - Configuration options for the scene.
 * @param {object} [options.fog] - Fog configuration.
 * @param {boolean} [options.fog.enabled=false] - Whether fog is enabled.
 * @param {number} [options.fog.color=0xffffff] - The color of the fog.
 * @param {number} [options.fog.near=0.1] - The near distance for the fog.
 * @param {number} [options.fog.far=6] - The far distance for the fog.
 * @param {object} [options.grid] - Grid helper configuration.
 * @param {boolean} [options.grid.enabled=false] - Whether the grid helper is visible.
 * @param {object} [options.environment] - Environment and background settings.
 * @param {object} [options.lights] - Lighting configuration.
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

  /**
   * Initializes the scene components like fog, lights, and helpers.
   * @private
   */
  _init() {
    this._setupFog();
    this._setupLights();
    this._setupHelpers();
  }

  /**
   * Sets up the scene's fog based on the configuration.
   * @private
   */
  _setupFog() {
    if (this.config.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.config.fog.color,
        this.config.fog.near,
        this.config.fog.far,
      );
    }
  }

  /**
   * Sets up the default lighting for the scene.
   * @private
   */
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

  /**
   * Sets up helper objects like the grid.
   * @private
   */
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
   * Loads a cube map and applies it as the scene's environment and/or background.
   * @param {string[]} urls - An array of 6 URLs for the cube map faces (px, nx, py, ny, pz, nz).
   * @returns {Promise<THREE.CubeTexture>} A promise that resolves with the loaded cube texture.
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
   * Loads an HDR (RGBE) environment map.
   * @param {string} url - The URL of the .hdr file.
   * @returns {Promise<THREE.DataTexture>} A promise that resolves with the loaded HDR texture.
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
   * Sets the scene's background to a solid color.
   * @param {THREE.Color|string|number} color - The color to set as the background.
   */
  setBackgroundColor(color) {
    this.scene.background = new THREE.Color(color);
  }

  /**
   * Updates the scene's fog properties.
   * @param {boolean} enabled - Whether to enable or disable fog.
   * @param {number} [near] - The near plane for the fog.
   * @param {number} [far] - The far plane for the fog.
   * @param {THREE.Color|string|number} [color] - The color of the fog.
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
   * Toggles the visibility of the grid helper.
   * @param {boolean} enabled - Whether the grid should be visible.
   */
  toggleGrid(enabled) {
    this.config.grid.enabled = enabled;
    if (this.helpers.grid) {
      this.helpers.grid.visible = enabled;
    }
  }

  /**
   * Updates the properties of the directional light.
   * @param {object} properties - The properties to update.
   * @param {THREE.Color|string|number} [properties.color] - The new color of the light.
   * @param {number} [properties.intensity] - The new intensity of the light.
   * @param {THREE.Vector3} [properties.position] - The new position of the light.
   * @param {boolean} [properties.castShadow] - Whether the light should cast shadows.
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
   * Updates the intensity of the environment map.
   * @param {number} intensity - The new environment intensity.
   */
  updateEnvironmentIntensity(intensity) {
    this.config.environment.environmentIntensity = intensity;
    this.scene.environmentIntensity = intensity;
  }

  /**
   * Updates the intensity of the background.
   * @param {number} intensity - The new background intensity.
   */
  updateBackgroundIntensity(intensity) {
    this.config.environment.backgroundIntensity = intensity;
    this.scene.backgroundIntensity = intensity;
  }

  /**
   * Updates the blurriness of the background.
   * @param {number} blurriness - The new blurriness value (0 to 1).
   */
  updateBackgroundBlurriness(blurriness) {
    this.config.environment.backgroundBlurriness = blurriness;
    this.scene.backgroundBlurriness = blurriness;
  }

  /**
   * Toggles the environment map on or off.
   * @param {boolean} enabled - Whether to enable the environment map.
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
   * Toggles the scene background on or off.
   * @param {boolean} enabled - Whether to show the background.
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
   * Updates the tone mapping exposure of the renderer.
   * @param {number} exposure - The new tone mapping exposure value.
   * @param {THREE.WebGLRenderer} renderer - The renderer to update.
   */
  updateToneMappingExposure(exposure, renderer) {
    this.config.environment.toneMappingExposure = exposure;
    if (renderer) {
      renderer.toneMappingExposure = exposure;
    }
  }

  /**
   * Placeholder for adding post-processing effects.
   * @param {EffectComposer} composer - The post-processing composer.
   */
  addPostProcessing(composer) {
    // Future: Add bloom, DOF, color correction, etc.
    console.log("Post-processing support coming soon");
  }

  /**
   * Returns the underlying Three.js scene object.
   * @returns {THREE.Scene} The scene object.
   */
  getScene() {
    return this.scene;
  }

  /**
   * Update method, intended to be called in the main animation loop.
   * @param {number} deltaTime - The time since the last frame.
   * @param {number} elapsedTime - The total elapsed time.
   */
  update(deltaTime, elapsedTime) {
    // Future: Add animated environment effects
    // e.g., moving clouds, dynamic lighting, etc.
  }

  /**
   * Disposes of all resources managed by the SceneManager.
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
