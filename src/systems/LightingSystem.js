import * as THREE from "three";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

/**
 * Comprehensive Lighting System
 * Manages all types of Three.js lights with full control
 */
export class LightingSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.lights = new Map();
    this.helpers = new Map();
    this.lightCounter = 0;
    this.textureLoader = new THREE.TextureLoader();
    this.gobos = new Map();

    // Initialize RectAreaLight
    RectAreaLightUniformsLib.init();

    this.config = {
      showHelpers: false,
      helperSize: 0.5,
      shadowsEnabled: true,
      shadowMapSize: 1024,
      ...options,
    };

    // Preload gobo textures
    this._loadGobos();
  }

  /**
   * Preload available gobo textures
   */
  _loadGobos() {
    const goboList = [
      { name: "Canopy", path: "/img/gobos/Canopy_01.png" },
      { name: "Canopy Sharp", path: "/img/gobos/Canopy_01_sharp.png" },
      { name: "Palm Tree", path: "/img/gobos/Canopy_PalmTree_01.png" },
      { name: "Palm Tree 1", path: "/img/gobos/PalmTree_01.png" },
      { name: "Palm Tree 2", path: "/img/gobos/PalmTree_02.png" },
      { name: "Stained Glass", path: "/img/gobos/StainedGlass_01.png" },
      { name: "Tree 2", path: "/img/gobos/Tree_02.png" },
      { name: "Tree 3", path: "/img/gobos/Tree_03.png" },
      { name: "Caustics 1", path: "/img/gobos/Underwater_Caustics_01.png" },
      { name: "Caustics 2", path: "/img/gobos/Underwater_Caustics_02.png" },
      { name: "Caustics 3", path: "/img/gobos/Underwater_Caustics_03.png" },
      { name: "Window 1", path: "/img/gobos/Window_01.png" },
      { name: "Window 2", path: "/img/gobos/Window_02.png" },
      { name: "Blinds 1", path: "/img/gobos/Window_Blinds_01.png" },
      { name: "Blinds 2", path: "/img/gobos/Window_Blinds_02.png" },
    ];

    goboList.forEach(({ name, path }) => {
      this.textureLoader.load(path, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.gobos.set(name, texture);
      });
    });
  }

  /**
   * Generate unique light ID
   */
  _generateId(type) {
    return `${type}_${++this.lightCounter}`;
  }

  /**
   * Create light configurations
   */
  _getLightConfig(type) {
    const configs = {
      ambient: {
        color: 0xffffff,
        intensity: 0.5,
      },
      directional: {
        color: 0xffffff,
        intensity: 1.0,
        position: new THREE.Vector3(5, 10, 5),
        castShadow: true,
        shadow: {
          mapSize: new THREE.Vector2(this.config.shadowMapSize, this.config.shadowMapSize),
          camera: {
            near: 0.5,
            far: 50,
            left: -10,
            right: 10,
            top: 10,
            bottom: -10,
          },
        },
      },
      hemisphere: {
        skyColor: 0x87ceeb,
        groundColor: 0x362907,
        intensity: 0.6,
        position: new THREE.Vector3(0, 10, 0),
      },
      point: {
        color: 0xffffff,
        intensity: 1.0,
        distance: 0,
        decay: 2,
        position: new THREE.Vector3(0, 5, 0),
        castShadow: true,
        shadow: {
          mapSize: new THREE.Vector2(this.config.shadowMapSize, this.config.shadowMapSize),
          camera: {
            near: 0.1,
            far: 25,
          },
        },
      },
      spot: {
        color: 0xffffff,
        intensity: 1.0,
        distance: 0,
        angle: Math.PI / 6,
        penumbra: 0.1,
        decay: 2,
        position: new THREE.Vector3(0, 10, 0),
        target: new THREE.Vector3(0, 0, 0),
        castShadow: true,
        shadow: {
          mapSize: new THREE.Vector2(this.config.shadowMapSize, this.config.shadowMapSize),
          camera: {
            near: 0.5,
            far: 50,
            fov: 30,
          },
        },
        // Gobo projection settings
        map: null,
        goboScale: new THREE.Vector2(1, 1),
        goboOffset: new THREE.Vector2(0, 0),
      },
      rectArea: {
        color: 0xffffff,
        intensity: 1.0,
        width: 10,
        height: 10,
        position: new THREE.Vector3(0, 10, 0),
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
      },
    };

    return configs[type] || configs.ambient;
  }

  /**
   * Create ambient light
   */
  createAmbientLight(config = {}) {
    const id = this._generateId("ambient");
    const lightConfig = { ...this._getLightConfig("ambient"), ...config };

    const light = new THREE.AmbientLight(lightConfig.color, lightConfig.intensity);

    const lightData = {
      id,
      type: "ambient",
      light,
      config: lightConfig,
    };

    this.lights.set(id, lightData);
    this.scene.add(light);

    return id;
  }

  /**
   * Create directional light
   */
  createDirectionalLight(config = {}) {
    const id = this._generateId("directional");
    const lightConfig = { ...this._getLightConfig("directional"), ...config };

    const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
    light.position.copy(lightConfig.position);
    light.castShadow = lightConfig.castShadow && this.config.shadowsEnabled;

    if (light.castShadow) {
      light.shadow.mapSize.copy(lightConfig.shadow.mapSize);
      Object.assign(light.shadow.camera, lightConfig.shadow.camera);
    }

    // Add target
    light.target.position.set(0, 0, 0);
    this.scene.add(light.target);

    // Create helper
    if (this.config.showHelpers) {
      const helper = new THREE.DirectionalLightHelper(light, this.config.helperSize);
      this.scene.add(helper);
      this.helpers.set(id, helper);
    }

    const lightData = {
      id,
      type: "directional",
      light,
      config: lightConfig,
    };

    this.lights.set(id, lightData);
    this.scene.add(light);

    return id;
  }

  /**
   * Create hemisphere light
   */
  createHemisphereLight(config = {}) {
    const id = this._generateId("hemisphere");
    const lightConfig = { ...this._getLightConfig("hemisphere"), ...config };

    const light = new THREE.HemisphereLight(
      lightConfig.skyColor,
      lightConfig.groundColor,
      lightConfig.intensity
    );
    light.position.copy(lightConfig.position);

    // Create helper
    if (this.config.showHelpers) {
      const helper = new THREE.HemisphereLightHelper(light, this.config.helperSize);
      this.scene.add(helper);
      this.helpers.set(id, helper);
    }

    const lightData = {
      id,
      type: "hemisphere",
      light,
      config: lightConfig,
    };

    this.lights.set(id, lightData);
    this.scene.add(light);

    return id;
  }

  /**
   * Create point light
   */
  createPointLight(config = {}) {
    const id = this._generateId("point");
    const lightConfig = { ...this._getLightConfig("point"), ...config };

    const light = new THREE.PointLight(
      lightConfig.color,
      lightConfig.intensity,
      lightConfig.distance,
      lightConfig.decay
    );
    light.position.copy(lightConfig.position);
    light.castShadow = lightConfig.castShadow && this.config.shadowsEnabled;

    if (light.castShadow) {
      light.shadow.mapSize.copy(lightConfig.shadow.mapSize);
      light.shadow.camera.near = lightConfig.shadow.camera.near;
      light.shadow.camera.far = lightConfig.shadow.camera.far;
    }

    // Create helper
    if (this.config.showHelpers) {
      const helper = new THREE.PointLightHelper(light, this.config.helperSize);
      this.scene.add(helper);
      this.helpers.set(id, helper);
    }

    const lightData = {
      id,
      type: "point",
      light,
      config: lightConfig,
    };

    this.lights.set(id, lightData);
    this.scene.add(light);

    return id;
  }

  /**
   * Create spot light with gobo projection support
   */
  createSpotLight(config = {}) {
    const id = this._generateId("spot");
    const lightConfig = { ...this._getLightConfig("spot"), ...config };

    const light = new THREE.SpotLight(
      lightConfig.color,
      lightConfig.intensity,
      lightConfig.distance,
      lightConfig.angle,
      lightConfig.penumbra,
      lightConfig.decay
    );
    light.position.copy(lightConfig.position);
    light.castShadow = lightConfig.castShadow && this.config.shadowsEnabled;

    if (light.castShadow) {
      light.shadow.mapSize.copy(lightConfig.shadow.mapSize);
      light.shadow.camera.near = lightConfig.shadow.camera.near;
      light.shadow.camera.far = lightConfig.shadow.camera.far;
      light.shadow.camera.fov = lightConfig.shadow.camera.fov;
    }

    // Set target
    light.target.position.copy(lightConfig.target);
    this.scene.add(light.target);

    // Apply gobo if specified
    if (lightConfig.map) {
      light.map = lightConfig.map;
    }

    // Create helper
    if (this.config.showHelpers) {
      const helper = new THREE.SpotLightHelper(light);
      this.scene.add(helper);
      this.helpers.set(id, helper);
    }

    const lightData = {
      id,
      type: "spot",
      light,
      config: lightConfig,
    };

    this.lights.set(id, lightData);
    this.scene.add(light);

    return id;
  }

  /**
   * Create rect area light
   */
  createRectAreaLight(config = {}) {
    const id = this._generateId("rectArea");
    const lightConfig = { ...this._getLightConfig("rectArea"), ...config };

    const light = new THREE.RectAreaLight(
      lightConfig.color,
      lightConfig.intensity,
      lightConfig.width,
      lightConfig.height
    );
    light.position.copy(lightConfig.position);
    light.rotation.copy(lightConfig.rotation);

    // Create helper
    if (this.config.showHelpers) {
      const helper = new RectAreaLightHelper(light);
      this.scene.add(helper);
      this.helpers.set(id, helper);
    }

    const lightData = {
      id,
      type: "rectArea",
      light,
      config: lightConfig,
    };

    this.lights.set(id, lightData);
    this.scene.add(light);

    return id;
  }

  /**
   * Create gobo projector (specialized spot light)
   */
  createGoboProjector(goboName, config = {}) {
    const goboTexture = this.gobos.get(goboName);
    if (!goboTexture) {
      console.warn(`Gobo texture "${goboName}" not found`);
      return null;
    }

    const projectorConfig = {
      ...config,
      map: goboTexture,
      castShadow: false, // Usually we don't want shadows with gobos
      intensity: config.intensity || 2.0,
      angle: config.angle || Math.PI / 4,
    };

    return this.createSpotLight(projectorConfig);
  }

  /**
   * Update light properties
   */
  updateLight(id, properties) {
    const lightData = this.lights.get(id);
    if (!lightData) return;

    const { light, type, config } = lightData;

    // Update common properties
    if (properties.color !== undefined) {
      light.color.set(properties.color);
      config.color = properties.color;
    }

    if (properties.intensity !== undefined) {
      light.intensity = properties.intensity;
      config.intensity = properties.intensity;
    }

    // Update type-specific properties
    switch (type) {
      case "directional":
      case "spot":
      case "point":
        if (properties.position) {
          light.position.copy(properties.position);
          config.position = properties.position;
        }
        if (properties.castShadow !== undefined) {
          light.castShadow = properties.castShadow && this.config.shadowsEnabled;
          config.castShadow = properties.castShadow;
        }
        break;

      case "spot":
        if (properties.angle !== undefined) {
          light.angle = properties.angle;
          config.angle = properties.angle;
        }
        if (properties.penumbra !== undefined) {
          light.penumbra = properties.penumbra;
          config.penumbra = properties.penumbra;
        }
        if (properties.target) {
          light.target.position.copy(properties.target);
          config.target = properties.target;
        }
        if (properties.distance !== undefined) {
          light.distance = properties.distance;
          config.distance = properties.distance;
        }
        if (properties.decay !== undefined) {
          light.decay = properties.decay;
          config.decay = properties.decay;
        }
        // Gobo specific
        if (properties.goboName) {
          const goboTexture = this.gobos.get(properties.goboName);
          if (goboTexture) {
            light.map = goboTexture;
            config.map = goboTexture;
          }
        }
        if (properties.map === null) {
          light.map = null;
          config.map = null;
        }
        break;

      case "point":
        if (properties.distance !== undefined) {
          light.distance = properties.distance;
          config.distance = properties.distance;
        }
        if (properties.decay !== undefined) {
          light.decay = properties.decay;
          config.decay = properties.decay;
        }
        break;

      case "hemisphere":
        if (properties.skyColor !== undefined) {
          light.color.set(properties.skyColor);
          config.skyColor = properties.skyColor;
        }
        if (properties.groundColor !== undefined) {
          light.groundColor.set(properties.groundColor);
          config.groundColor = properties.groundColor;
        }
        break;

      case "rectArea":
        if (properties.width !== undefined) {
          light.width = properties.width;
          config.width = properties.width;
        }
        if (properties.height !== undefined) {
          light.height = properties.height;
          config.height = properties.height;
        }
        break;
    }

    // Update helper if exists
    const helper = this.helpers.get(id);
    if (helper && helper.update) {
      helper.update();
    }
  }

  /**
   * Remove light
   */
  removeLight(id) {
    const lightData = this.lights.get(id);
    if (!lightData) return;

    // Remove from scene
    this.scene.remove(lightData.light);
    if (lightData.light.target) {
      this.scene.remove(lightData.light.target);
    }

    // Remove helper
    const helper = this.helpers.get(id);
    if (helper) {
      this.scene.remove(helper);
      this.helpers.delete(id);
    }

    // Remove from registry
    this.lights.delete(id);
  }

  /**
   * Toggle helpers visibility
   */
  toggleHelpers(visible) {
    this.config.showHelpers = visible;
    this.helpers.forEach((helper) => {
      helper.visible = visible;
    });
  }

  /**
   * Get all lights
   */
  getAllLights() {
    return Array.from(this.lights.values());
  }

  /**
   * Get lights by type
   */
  getLightsByType(type) {
    return this.getAllLights().filter((data) => data.type === type);
  }

  /**
   * Create light presets
   */
  createPreset(presetName) {
    // Clear existing lights
    this.clearAllLights();

    switch (presetName) {
      case "studio":
        this.createAmbientLight({ intensity: 0.3 });
        this.createDirectionalLight({
          position: new THREE.Vector3(5, 10, 5),
          intensity: 0.8,
        });
        this.createDirectionalLight({
          position: new THREE.Vector3(-5, 8, -5),
          intensity: 0.5,
          castShadow: false,
        });
        this.createPointLight({
          position: new THREE.Vector3(0, 2, 8),
          intensity: 0.3,
          color: 0xffaa00,
        });
        break;

      case "sunset":
        this.createHemisphereLight({
          skyColor: 0xff9944,
          groundColor: 0x444466,
          intensity: 0.8,
        });
        this.createDirectionalLight({
          position: new THREE.Vector3(10, 5, 0),
          color: 0xffaa44,
          intensity: 1.2,
        });
        break;

      case "nightclub":
        this.createAmbientLight({ intensity: 0.1, color: 0x0000ff });
        // Multiple colored spot lights
        const colors = [0xff0080, 0x00ff80, 0x8000ff, 0xffff00];
        colors.forEach((color, i) => {
          const angle = (i / colors.length) * Math.PI * 2;
          this.createSpotLight({
            position: new THREE.Vector3(Math.cos(angle) * 5, 8, Math.sin(angle) * 5),
            color,
            intensity: 2,
            angle: Math.PI / 6,
            target: new THREE.Vector3(0, 0, 0),
          });
        });
        break;

      case "underwater":
        this.createAmbientLight({ intensity: 0.4, color: 0x004466 });
        this.createDirectionalLight({
          position: new THREE.Vector3(0, 10, 0),
          color: 0x00aaff,
          intensity: 0.6,
        });
        // Add caustics gobo projector
        this.createGoboProjector("Caustics 1", {
          position: new THREE.Vector3(0, 10, 0),
          intensity: 2,
          color: 0x00ffff,
        });
        break;
    }
  }

  /**
   * Clear all lights
   */
  clearAllLights() {
    const ids = Array.from(this.lights.keys());
    ids.forEach((id) => this.removeLight(id));
  }

  /**
   * Get tweakpane config for a light
   */
  getTweakpaneConfig(lightId) {
    const lightData = this.lights.get(lightId);
    if (!lightData) return null;

    const { type, config } = lightData;
    const baseConfig = {
      color: { value: config.color },
      intensity: { min: 0, max: 5, step: 0.01 },
    };

    const typeConfigs = {
      directional: {
        ...baseConfig,
        position: {
          x: { min: -20, max: 20, step: 0.1 },
          y: { min: -20, max: 20, step: 0.1 },
          z: { min: -20, max: 20, step: 0.1 },
        },
        castShadow: {},
      },
      point: {
        ...baseConfig,
        position: {
          x: { min: -20, max: 20, step: 0.1 },
          y: { min: -20, max: 20, step: 0.1 },
          z: { min: -20, max: 20, step: 0.1 },
        },
        distance: { min: 0, max: 100, step: 0.1 },
        decay: { min: 0, max: 3, step: 0.01 },
        castShadow: {},
      },
      spot: {
        ...baseConfig,
        position: {
          x: { min: -20, max: 20, step: 0.1 },
          y: { min: -20, max: 20, step: 0.1 },
          z: { min: -20, max: 20, step: 0.1 },
        },
        angle: { min: 0, max: Math.PI / 2, step: 0.01 },
        penumbra: { min: 0, max: 1, step: 0.01 },
        distance: { min: 0, max: 100, step: 0.1 },
        decay: { min: 0, max: 3, step: 0.01 },
        castShadow: {},
        gobo: { options: this._getGoboOptions() },
      },
      hemisphere: {
        skyColor: { value: config.skyColor },
        groundColor: { value: config.groundColor },
        intensity: { min: 0, max: 2, step: 0.01 },
      },
      rectArea: {
        ...baseConfig,
        width: { min: 0.1, max: 20, step: 0.1 },
        height: { min: 0.1, max: 20, step: 0.1 },
        position: {
          x: { min: -20, max: 20, step: 0.1 },
          y: { min: -20, max: 20, step: 0.1 },
          z: { min: -20, max: 20, step: 0.1 },
        },
      },
      ambient: {
        color: { value: config.color },
        intensity: { min: 0, max: 2, step: 0.01 },
      },
    };

    return typeConfigs[type] || baseConfig;
  }

  /**
   * Get gobo options for dropdown
   */
  _getGoboOptions() {
    const options = { None: "none" };
    this.gobos.forEach((texture, name) => {
      options[name] = name;
    });
    return options;
  }

  /**
   * Dispose
   */
  dispose() {
    this.clearAllLights();
    this.gobos.forEach((texture) => texture.dispose());
    this.gobos.clear();
  }
}
