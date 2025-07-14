import * as THREE from "three";
import { BaseMaterial } from "@materials/BaseMaterial.js";

/**
 * Terrazzo Material
 * A PBR material using real terrazzo texture maps
 */
export class TerrazzoMaterial extends BaseMaterial {
  constructor(options = {}) {
    // Call super first with basic config
    super({
      name: options.name || "TerrazzoMaterial",
      type: "MeshPhysicalMaterial",
      config: {}, // Will be updated after
    });

    // Now we can access this.getDefaultConfig()
    const defaultConfig = this.getDefaultConfig();
    const { _custom: defaultCustom, ...defaultMaterialConfig } = defaultConfig;

    // Extract custom properties from options if provided
    const optionsConfig = options.config || {};
    const { _custom: optionsCustom, ...optionsMaterialConfig } = optionsConfig;

    // Merge material configs (Three.js properties only)
    const materialConfig = {
      ...defaultMaterialConfig,
      ...optionsMaterialConfig,
    };

    // Update the material with the merged config
    if (this.material) {
      this.material.setValues(materialConfig);
    }

    // Store the config
    this.config = materialConfig;

    // Merge custom configs separately
    this.customConfig = {
      ...defaultCustom,
      ...optionsCustom,
    };

    this.textureBasePath = options.texturePath || "/img/terrazzo/";
    this._loadTextures();
  }

  getDefaultConfig() {
    return {
      // Base properties
      color: new THREE.Color(0xffffff),
      metalness: 0.0, // Terrazzo is non-metallic
      roughness: 0.5,

      // Physical properties
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
      reflectivity: 0.5,
      ior: 1.5, // Index of refraction for stone/concrete

      // Additional effects
      sheen: 0.0,
      sheenRoughness: 0.0,
      sheenColor: new THREE.Color(0xffffff),

      // Texture scales
      normalScale: new THREE.Vector2(1, 1),
      displacementScale: 0.1,
      displacementBias: 0,

      // Environment
      envMapIntensity: 0.8,

      // Additional terrazzo-specific properties
      aoMapIntensity: 1.0,
      lightMapIntensity: 1.0,

      // Custom properties (not passed to Three.js material)
      _custom: {
        useColorMap: true,
        useRoughnessMap: true,
        useNormalMap: true,
        useDisplacementMap: false, // Disabled by default to prevent elevation
        textureRepeat: new THREE.Vector2(1, 1),
        textureOffset: new THREE.Vector2(0, 0),
        textureRotation: 0,
      },
    };
  }

  /**
   * Load all terrazzo textures
   */
  async _loadTextures() {
    const texturePromises = [];

    // Define texture configurations
    const textureConfigs = {
      map: {
        url: `${this.textureBasePath}Terrazzo010_2K_Color.png`,
        options: {
          colorSpace: THREE.SRGBColorSpace,
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
        },
      },
      roughnessMap: {
        url: `${this.textureBasePath}Terrazzo010_2K_Roughness.png`,
        options: {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
        },
      },
      normalMap: {
        url: `${this.textureBasePath}Terrazzo010_2K_NormalGL.png`,
        options: {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
        },
      },
      displacementMap: {
        url: `${this.textureBasePath}Terrazzo010_2K_Displacement.png`,
        options: {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
        },
      },
    };

    // Load all textures
    try {
      await this.loadTextures(textureConfigs);
      this._applyTextureSettings();
      this._updateMaterialTextures();
    } catch (error) {
      console.error("Failed to load terrazzo textures:", error);
    }
  }

  /**
   * Apply texture settings (repeat, offset, rotation)
   */
  _applyTextureSettings() {
    const textureKeys = ["map", "roughnessMap", "normalMap", "displacementMap"];

    textureKeys.forEach((key) => {
      if (this.textures[key]) {
        this.textures[key].repeat.copy(this.customConfig.textureRepeat);
        this.textures[key].offset.copy(this.customConfig.textureOffset);
        this.textures[key].rotation = this.customConfig.textureRotation;
        this.textures[key].needsUpdate = true;
      }
    });
  }

  /**
   * Update material with loaded textures
   */
  _updateMaterialTextures() {
    // Color map
    if (this.textures.map && this.customConfig.useColorMap) {
      this.material.map = this.textures.map;
    } else {
      this.material.map = null;
    }

    // Roughness map
    if (this.textures.roughnessMap && this.customConfig.useRoughnessMap) {
      this.material.roughnessMap = this.textures.roughnessMap;
    } else {
      this.material.roughnessMap = null;
    }

    // Normal map
    if (this.textures.normalMap && this.customConfig.useNormalMap) {
      this.material.normalMap = this.textures.normalMap;
      this.material.normalScale = this.config.normalScale;
    } else {
      this.material.normalMap = null;
    }

    // Displacement map
    if (this.textures.displacementMap && this.customConfig.useDisplacementMap) {
      this.material.displacementMap = this.textures.displacementMap;
      this.material.displacementScale = this.config.displacementScale;
      this.material.displacementBias = this.config.displacementBias;
    } else {
      this.material.displacementMap = null;
      this.material.displacementScale = 0;
    }

    // Update environment intensity
    this.material.envMapIntensity = this.config.envMapIntensity;

    this.material.needsUpdate = true;
  }

  /**
   * Update texture transform (repeat, offset, rotation)
   */
  updateTextureTransform(repeat, offset, rotation) {
    if (repeat) {
      this.customConfig.textureRepeat.copy(repeat);
    }
    if (offset) {
      this.customConfig.textureOffset.copy(offset);
    }
    if (rotation !== undefined) {
      this.customConfig.textureRotation = rotation;
    }

    this._applyTextureSettings();
  }

  /**
   * Toggle specific texture maps
   */
  toggleMap(mapType, enabled) {
    const mapKey = `use${mapType.charAt(0).toUpperCase() + mapType.slice(1)}Map`;
    if (this.customConfig.hasOwnProperty(mapKey)) {
      this.customConfig[mapKey] = enabled;
      this._updateMaterialTextures();
    }
  }

  /**
   * Create variations of the material
   */
  createVariation(variationType) {
    const variations = {
      polished: {
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        reflectivity: 0.9,
        useDisplacementMap: false,
      },
      matte: {
        roughness: 0.8,
        clearcoat: 0.1,
        clearcoatRoughness: 0.5,
        reflectivity: 0.3,
        useDisplacementMap: false,
      },
      wet: {
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0,
        color: new THREE.Color(0xdddddd), // Slightly darker when wet
        useDisplacementMap: false,
      },
      aged: {
        roughness: 0.9,
        clearcoat: 0.0,
        reflectivity: 0.2,
        color: new THREE.Color(0xcccccc),
        normalScale: new THREE.Vector2(0.5, 0.5),
        useDisplacementMap: true,
        displacementScale: 0.02,
      },
    };

    const variation = variations[variationType];
    if (variation) {
      this.updateProperties(variation);
      this._updateMaterialTextures();
    }
  }

  /**
   * Update environment intensity
   */
  updateEnvironmentIntensity(intensity) {
    this.config.envMapIntensity = intensity;
    if (this.material) {
      this.material.envMapIntensity = intensity;
      this.material.needsUpdate = true;
    }
  }

  /**
   * Get Tweakpane configuration specific to terrazzo
   */
  getTweakpaneConfig() {
    return {
      // Base PBR
      color: { value: this.config.color },
      roughness: { min: 0, max: 1, step: 0.01 },

      // Physical (terrazzo is non-metallic)
      clearcoat: { min: 0, max: 1, step: 0.01 },
      clearcoatRoughness: { min: 0, max: 1, step: 0.01 },
      reflectivity: { min: 0, max: 1, step: 0.01 },
      ior: { min: 1, max: 2, step: 0.01 },

      // Sheen (minimal for stone)
      sheen: { min: 0, max: 0.5, step: 0.01 },
      sheenRoughness: { min: 0, max: 1, step: 0.01 },
      sheenColor: { value: this.config.sheenColor },

      // Environment
      envMapIntensity: { min: 0, max: 2, step: 0.01 },

      // Map toggles (from custom config)
      useColorMap: {
        label: "Use Color Map",
        value: this.customConfig.useColorMap,
      },
      useRoughnessMap: {
        label: "Use Roughness Map",
        value: this.customConfig.useRoughnessMap,
      },
      useNormalMap: {
        label: "Use Normal Map",
        value: this.customConfig.useNormalMap,
      },
      useDisplacementMap: {
        label: "Use Displacement Map",
        value: this.customConfig.useDisplacementMap,
      },

      // Normal
      normalScale: {
        x: { min: -2, max: 2, step: 0.01 },
        y: { min: -2, max: 2, step: 0.01 },
      },

      // Displacement
      displacementScale: { min: -0.2, max: 0.2, step: 0.001 },
      displacementBias: { min: -0.5, max: 0.5, step: 0.001 },

      // Texture Transform (from custom config)
      textureRepeat: this.customConfig.textureRepeat,
      textureOffset: this.customConfig.textureOffset,
      textureRotation: this.customConfig.textureRotation,

      // Intensity controls
      aoMapIntensity: { min: 0, max: 2, step: 0.01 },
      lightMapIntensity: { min: 0, max: 2, step: 0.01 },
    };
  }

  /**
   * Get custom configuration
   */
  getCustomConfig() {
    return this.customConfig;
  }

  /**
   * Get material statistics
   */
  getStats() {
    const stats = {
      texturesLoaded: Object.keys(this.textures).length,
      textureMemory: 0,
    };

    // Calculate approximate texture memory usage
    for (const texture of Object.values(this.textures)) {
      if (texture && texture.image) {
        const width = texture.image.width || 0;
        const height = texture.image.height || 0;
        // Approximate: 4 bytes per pixel for RGBA
        stats.textureMemory += (width * height * 4) / (1024 * 1024); // MB
      }
    }

    return stats;
  }
}
