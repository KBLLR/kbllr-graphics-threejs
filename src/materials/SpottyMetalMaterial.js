import * as THREE from "three";
import { BaseMaterial } from "./BaseMaterial.js";

/**
 * Spotty Metal Material
 * A PBR material with a distinctive spotted/speckled metal appearance
 */
export class SpottyMetalMaterial extends BaseMaterial {
  constructor(options = {}) {
    super({
      name: options.name || "SpottyMetalMaterial",
      type: "MeshPhysicalMaterial",
      config: options.config,
    });

    this.spotPattern = null;
    this._generateProceduralTextures();
    this._setupMaterial();
  }

  getDefaultConfig() {
    return {
      // Base properties
      color: new THREE.Color(0x8a8a8a),
      metalness: 0.85,
      roughness: 0.3,

      // Physical properties
      clearcoat: 0.1,
      clearcoatRoughness: 0.2,
      reflectivity: 0.9,
      ior: 2.33,

      // Additional effects
      sheen: 0.1,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color(0xffffff),

      // Texture properties
      normalScale: new THREE.Vector2(1, 1),

      // Environment
      envMapIntensity: 1.0,

      // Spots configuration
      spotDensity: 0.7,
      spotScale: 2.0,
      spotContrast: 0.8,
      spotMetalnessVariation: 0.3,
      spotRoughnessVariation: 0.2,
    };
  }

  /**
   * Generate procedural textures for the spotty pattern
   */
  _generateProceduralTextures() {
    const size = 1024;

    // Generate spot pattern
    this.spotPattern = this._generateSpotPattern(size);

    // Generate textures based on spot pattern
    this.proceduralTextures = {
      albedo: this._generateAlbedoTexture(size),
      metalness: this._generateMetalnessTexture(size),
      roughness: this._generateRoughnessTexture(size),
      normal: this._generateNormalTexture(size),
    };
  }

  /**
   * Generate base spot pattern using noise
   */
  _generateSpotPattern(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Create noise pattern
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 4;

        // Multi-octave noise for spots
        let noise = 0;
        let amplitude = 1;
        let frequency = this.config.spotScale;

        for (let octave = 0; octave < 3; octave++) {
          noise +=
            amplitude *
            this._noise2D((j * frequency) / size, (i * frequency) / size);
          amplitude *= 0.5;
          frequency *= 2;
        }

        // Apply threshold for spots
        const spotValue = noise > this.config.spotDensity ? 1 : 0;

        // Add some edge smoothing
        const smoothed = this._smoothStep(
          noise,
          this.config.spotDensity - 0.1,
          this.config.spotDensity + 0.1,
        );

        const value = Math.floor(smoothed * 255);
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Generate albedo texture
   */
  _generateAlbedoTexture(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Base color
    ctx.fillStyle = `rgb(${Math.floor(this.config.color.r * 255)}, ${Math.floor(this.config.color.g * 255)}, ${Math.floor(this.config.color.b * 255)})`;
    ctx.fillRect(0, 0, size, size);

    // Apply spot pattern with color variation
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(this.spotPattern, 0, 0);

    // Add subtle color variation
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /**
   * Generate metalness texture
   */
  _generateMetalnessTexture(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Base metalness
    const baseMetalness = Math.floor(this.config.metalness * 255);
    ctx.fillStyle = `rgb(${baseMetalness}, ${baseMetalness}, ${baseMetalness})`;
    ctx.fillRect(0, 0, size, size);

    // Apply spot pattern for metalness variation
    const imageData = ctx.getImageData(0, 0, size, size);
    const spotData = this.spotPattern
      .getContext("2d")
      .getImageData(0, 0, size, size);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const spotValue = spotData.data[i] / 255;
      const variation = (spotValue - 0.5) * this.config.spotMetalnessVariation;
      const metalness = Math.max(
        0,
        Math.min(255, baseMetalness + variation * 255),
      );

      imageData.data[i] = metalness;
      imageData.data[i + 1] = metalness;
      imageData.data[i + 2] = metalness;
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate roughness texture
   */
  _generateRoughnessTexture(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Base roughness
    const baseRoughness = Math.floor(this.config.roughness * 255);
    ctx.fillStyle = `rgb(${baseRoughness}, ${baseRoughness}, ${baseRoughness})`;
    ctx.fillRect(0, 0, size, size);

    // Apply spot pattern for roughness variation
    const imageData = ctx.getImageData(0, 0, size, size);
    const spotData = this.spotPattern
      .getContext("2d")
      .getImageData(0, 0, size, size);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const spotValue = spotData.data[i] / 255;
      const variation = (spotValue - 0.5) * this.config.spotRoughnessVariation;
      const roughness = Math.max(
        0,
        Math.min(255, baseRoughness + variation * 255),
      );

      imageData.data[i] = roughness;
      imageData.data[i + 1] = roughness;
      imageData.data[i + 2] = roughness;
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate normal texture
   */
  _generateNormalTexture(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Calculate normals from height map (spot pattern)
    const spotCtx = this.spotPattern.getContext("2d", {
      willReadFrequently: true,
    });
    const heightData = spotCtx.getImageData(0, 0, size, size);
    const normalData = ctx.createImageData(size, size);

    const strength = 2.0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Sample neighboring pixels for gradient
        const left = this._sampleHeight(heightData, x - 1, y, size);
        const right = this._sampleHeight(heightData, x + 1, y, size);
        const top = this._sampleHeight(heightData, x, y - 1, size);
        const bottom = this._sampleHeight(heightData, x, y + 1, size);

        // Calculate normal
        const dx = (right - left) * strength;
        const dy = (bottom - top) * strength;
        const dz = 1.0;

        // Normalize
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = dx / length;
        const ny = dy / length;
        const nz = dz / length;

        // Convert to 0-255 range
        const index = (y * size + x) * 4;
        normalData.data[index] = Math.floor((nx * 0.5 + 0.5) * 255);
        normalData.data[index + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        normalData.data[index + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        normalData.data[index + 3] = 255;
      }
    }

    ctx.putImageData(normalData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Sample height from image data
   */
  _sampleHeight(imageData, x, y, size) {
    x = Math.max(0, Math.min(size - 1, x));
    y = Math.max(0, Math.min(size - 1, y));
    const index = (y * size + x) * 4;
    return imageData.data[index] / 255;
  }

  /**
   * Simple 2D noise function
   */
  _noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Smooth step function
   */
  _smoothStep(t, edge0, edge1) {
    t = Math.max(0, Math.min(1, (t - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * Setup the material with textures
   */
  _setupMaterial() {
    // Apply procedural textures
    this.material.map = this.proceduralTextures.albedo;
    this.material.metalnessMap = this.proceduralTextures.metalness;
    this.material.roughnessMap = this.proceduralTextures.roughness;
    this.material.normalMap = this.proceduralTextures.normal;
    this.material.normalScale = this.config.normalScale;

    // Store textures in parent class texture registry
    this.textures.map = this.proceduralTextures.albedo;
    this.textures.metalnessMap = this.proceduralTextures.metalness;
    this.textures.roughnessMap = this.proceduralTextures.roughness;
    this.textures.normalMap = this.proceduralTextures.normal;

    this.material.needsUpdate = true;
  }

  /**
   * Regenerate textures with new parameters
   */
  regenerateTextures() {
    // Dispose old textures
    Object.values(this.proceduralTextures).forEach((texture) => {
      if (texture) texture.dispose();
    });

    // Generate new textures
    this._generateProceduralTextures();
    this._setupMaterial();
  }

  /**
   * Update spot pattern parameters
   */
  updateSpotPattern(params) {
    const needsRegeneration = [
      "spotDensity",
      "spotScale",
      "spotContrast",
      "spotMetalnessVariation",
      "spotRoughnessVariation",
    ].some((key) => params.hasOwnProperty(key));

    // Update config
    Object.assign(this.config, params);

    if (needsRegeneration) {
      this.regenerateTextures();
    }
  }

  /**
   * Set texture repeat for all maps
   */
  setTextureRepeat(repeat) {
    const textures = ["map", "metalnessMap", "roughnessMap", "normalMap"];
    textures.forEach((textureName) => {
      if (this.material[textureName]) {
        this.material[textureName].repeat.set(repeat.x, repeat.y);
        this.material[textureName].needsUpdate = true;
      }
    });
  }

  /**
   * Get Tweakpane configuration
   */
  getTweakpaneConfig() {
    return {
      // Base PBR
      color: { value: this.config.color },
      metalness: { min: 0, max: 1, step: 0.01 },
      roughness: { min: 0, max: 1, step: 0.01 },

      // Physical
      clearcoat: { min: 0, max: 1, step: 0.01 },
      clearcoatRoughness: { min: 0, max: 1, step: 0.01 },
      reflectivity: { min: 0, max: 1, step: 0.01 },
      ior: { min: 1, max: 3, step: 0.01 },

      // Sheen
      sheen: { min: 0, max: 1, step: 0.01 },
      sheenRoughness: { min: 0, max: 1, step: 0.01 },
      sheenColor: { value: this.config.sheenColor },

      // Environment
      envMapIntensity: { min: 0, max: 2, step: 0.01 },

      // Normal
      normalScale: {
        x: { min: -2, max: 2, step: 0.01 },
        y: { min: -2, max: 2, step: 0.01 },
      },

      // Spot Pattern
      spotDensity: { min: 0, max: 1, step: 0.01 },
      spotScale: { min: 0.5, max: 10, step: 0.1 },
      spotContrast: { min: 0, max: 1, step: 0.01 },
      spotMetalnessVariation: { min: 0, max: 1, step: 0.01 },
      spotRoughnessVariation: { min: 0, max: 1, step: 0.01 },
    };
  }
}
