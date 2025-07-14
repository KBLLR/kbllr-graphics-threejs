import * as THREE from "three";

/**
 * Base Material Class
 * Foundation for all custom materials in the system
 */
export class BaseMaterial {
  constructor(options = {}) {
    this.name = options.name || "BaseMaterial";
    this.type = options.type || "MeshPhysicalMaterial";
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.material = null;
    this.config = {
      ...this.getDefaultConfig(),
      ...options.config,
    };

    this._createMaterial();
  }

  /**
   * Get default configuration for the material
   * Override in child classes
   */
  getDefaultConfig() {
    return {
      color: 0xffffff,
      metalness: 0.0,
      roughness: 1.0,
      transparent: false,
      opacity: 1.0,
      side: THREE.FrontSide,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
    };
  }

  /**
   * Create the Three.js material
   * Override in child classes for specific material types
   */
  _createMaterial() {
    const MaterialClass = this._getMaterialClass();
    this.material = new MaterialClass(this.config);
  }

  /**
   * Get the appropriate Three.js material class
   */
  _getMaterialClass() {
    const materialMap = {
      MeshBasicMaterial: THREE.MeshBasicMaterial,
      MeshStandardMaterial: THREE.MeshStandardMaterial,
      MeshPhysicalMaterial: THREE.MeshPhysicalMaterial,
      MeshPhongMaterial: THREE.MeshPhongMaterial,
      MeshLambertMaterial: THREE.MeshLambertMaterial,
      MeshToonMaterial: THREE.MeshToonMaterial,
      ShaderMaterial: THREE.ShaderMaterial,
    };

    return materialMap[this.type] || THREE.MeshPhysicalMaterial;
  }

  /**
   * Load a texture with optional callbacks
   */
  async loadTexture(url, textureKey, options = {}) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Apply texture options
          if (options.wrapS) texture.wrapS = options.wrapS;
          if (options.wrapT) texture.wrapT = options.wrapT;
          if (options.repeat)
            texture.repeat.set(options.repeat.x, options.repeat.y);
          if (options.offset)
            texture.offset.set(options.offset.x, options.offset.y);
          if (options.rotation) texture.rotation = options.rotation;
          if (options.center)
            texture.center.set(options.center.x, options.center.y);
          if (options.magFilter) texture.magFilter = options.magFilter;
          if (options.minFilter) texture.minFilter = options.minFilter;
          if (options.anisotropy) texture.anisotropy = options.anisotropy;

          // Default to sRGB for color textures
          if (options.encoding !== undefined) {
            texture.encoding = options.encoding;
          } else if (textureKey === "map" || textureKey === "emissiveMap") {
            texture.colorSpace = THREE.SRGBColorSpace;
          }

          texture.needsUpdate = true;

          this.textures[textureKey] = texture;
          if (this.material) {
            this.material[textureKey] = texture;
            this.material.needsUpdate = true;
          }

          resolve(texture);
        },
        options.onProgress,
        (error) => {
          console.error(`Failed to load texture ${url}:`, error);
          reject(error);
        },
      );
    });
  }

  /**
   * Load multiple textures
   */
  async loadTextures(textureMap) {
    const promises = [];

    for (const [key, config] of Object.entries(textureMap)) {
      if (config && config.url) {
        promises.push(this.loadTexture(config.url, key, config.options || {}));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Update material properties
   */
  updateProperty(property, value) {
    if (this.material && this.material.hasOwnProperty(property)) {
      this.material[property] = value;
      this.material.needsUpdate = true;
      this.config[property] = value;
    }
  }

  /**
   * Update multiple properties at once
   */
  updateProperties(properties) {
    for (const [key, value] of Object.entries(properties)) {
      this.updateProperty(key, value);
    }
  }

  /**
   * Update a specific texture
   */
  updateTexture(textureKey, texture) {
    if (this.material && texture) {
      this.material[textureKey] = texture;
      this.material.needsUpdate = true;
      this.textures[textureKey] = texture;
    }
  }

  /**
   * Remove a texture
   */
  removeTexture(textureKey) {
    if (this.textures[textureKey]) {
      this.textures[textureKey].dispose();
      delete this.textures[textureKey];
    }

    if (this.material && this.material[textureKey]) {
      this.material[textureKey] = null;
      this.material.needsUpdate = true;
    }
  }

  /**
   * Set texture repeat and offset
   */
  setTextureTransform(textureKey, repeat, offset, rotation = 0) {
    const texture = this.textures[textureKey];
    if (texture) {
      if (repeat) texture.repeat.set(repeat.x, repeat.y);
      if (offset) texture.offset.set(offset.x, offset.y);
      texture.rotation = rotation;
      texture.needsUpdate = true;
    }
  }

  /**
   * Get the Three.js material
   */
  getMaterial() {
    return this.material;
  }

  /**
   * Clone the material
   */
  clone() {
    const clonedMaterial = this.material.clone();
    const cloned = new this.constructor({
      name: `${this.name}_clone`,
      type: this.type,
      config: { ...this.config },
    });

    cloned.material = clonedMaterial;
    cloned.textures = { ...this.textures };

    return cloned;
  }

  /**
   * Serialize material configuration
   */
  serialize() {
    const serialized = {
      name: this.name,
      type: this.type,
      config: { ...this.config },
      textures: {},
    };

    // Store texture URLs for recreation
    for (const [key, texture] of Object.entries(this.textures)) {
      if (texture && texture.image && texture.image.src) {
        serialized.textures[key] = {
          url: texture.image.src,
          repeat: { x: texture.repeat.x, y: texture.repeat.y },
          offset: { x: texture.offset.x, y: texture.offset.y },
          rotation: texture.rotation,
          wrapS: texture.wrapS,
          wrapT: texture.wrapT,
        };
      }
    }

    return serialized;
  }

  /**
   * Deserialize material from configuration
   */
  static async deserialize(data) {
    const material = new this({
      name: data.name,
      type: data.type,
      config: data.config,
    });

    // Load textures
    if (data.textures) {
      const texturePromises = [];
      for (const [key, textureData] of Object.entries(data.textures)) {
        texturePromises.push(
          material.loadTexture(textureData.url, key, {
            repeat: textureData.repeat,
            offset: textureData.offset,
            rotation: textureData.rotation,
            wrapS: textureData.wrapS,
            wrapT: textureData.wrapT,
          }),
        );
      }
      await Promise.all(texturePromises);
    }

    return material;
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    // Dispose textures
    for (const texture of Object.values(this.textures)) {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    }

    // Dispose material
    if (this.material && this.material.dispose) {
      this.material.dispose();
    }

    // Clear references
    this.textures = {};
    this.material = null;
  }
}
