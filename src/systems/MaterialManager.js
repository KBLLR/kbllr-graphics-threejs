import * as THREE from "three";
import { BaseMaterial } from "@materials/BaseMaterial.js";
import { SpottyMetalMaterial } from "@materials/SpottyMetalMaterial.js";
import { TerrazzoMaterial } from "@materials/TerrazzoMaterial.js";

/**
 * Material Manager
 * Centralized system for managing all materials in the application
 */
export class MaterialManager {
  constructor() {
    this.materials = new Map();
    this.materialClasses = new Map();
    this.presets = new Map();
    this.activeMaterials = new Map();

    // Register default material classes
    this._registerDefaultMaterialClasses();
    this._registerDefaultPresets();
  }

  /**
   * Register default material classes
   */
  _registerDefaultMaterialClasses() {
    this.registerMaterialClass("BaseMaterial", BaseMaterial);
    this.registerMaterialClass("SpottyMetalMaterial", SpottyMetalMaterial);
    this.registerMaterialClass("TerrazzoMaterial", TerrazzoMaterial);
  }

  /**
   * Register default material presets
   */
  _registerDefaultPresets() {
    // Spotty Metal Presets
    this.registerPreset("spottyMetal_polished", {
      className: "SpottyMetalMaterial",
      config: {
        metalness: 0.95,
        roughness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        spotDensity: 0.3,
        spotScale: 1.5,
        color: new THREE.Color(0xc0c0c0),
      },
    });

    this.registerPreset("spottyMetal_brushed", {
      className: "SpottyMetalMaterial",
      config: {
        metalness: 0.85,
        roughness: 0.4,
        clearcoat: 0.2,
        clearcoatRoughness: 0.3,
        spotDensity: 0.5,
        spotScale: 3.0,
        color: new THREE.Color(0x8a8a8a),
      },
    });

    this.registerPreset("spottyMetal_oxidized", {
      className: "SpottyMetalMaterial",
      config: {
        metalness: 0.7,
        roughness: 0.7,
        clearcoat: 0.0,
        spotDensity: 0.8,
        spotScale: 5.0,
        spotMetalnessVariation: 0.5,
        spotRoughnessVariation: 0.4,
        color: new THREE.Color(0x5a5a5a),
      },
    });

    // Terrazzo Material Presets
    this.registerPreset("terrazzo_polished", {
      className: "TerrazzoMaterial",
      config: {
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        reflectivity: 0.9,
        _custom: {
          textureRepeat: new THREE.Vector2(2, 2),
        },
      },
    });

    this.registerPreset("terrazzo_matte", {
      className: "TerrazzoMaterial",
      config: {
        roughness: 0.8,
        clearcoat: 0.1,
        clearcoatRoughness: 0.5,
        reflectivity: 0.3,
        _custom: {
          textureRepeat: new THREE.Vector2(2, 2),
        },
      },
    });

    this.registerPreset("terrazzo_wet", {
      className: "TerrazzoMaterial",
      config: {
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0,
        color: new THREE.Color(0xdddddd),
        _custom: {
          textureRepeat: new THREE.Vector2(2, 2),
        },
      },
    });

    // Basic Material Presets
    this.registerPreset("basic_white", {
      className: "BaseMaterial",
      config: {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.5,
      },
    });

    this.registerPreset("basic_mirror", {
      className: "BaseMaterial",
      config: {
        color: 0xffffff,
        metalness: 1,
        roughness: 0,
      },
    });
  }

  /**
   * Register a material class
   */
  registerMaterialClass(className, MaterialClass) {
    if (
      (!MaterialClass.prototype) instanceof BaseMaterial &&
      MaterialClass !== BaseMaterial
    ) {
      console.warn(`${className} should extend BaseMaterial`);
    }
    this.materialClasses.set(className, MaterialClass);
  }

  /**
   * Register a material preset
   */
  registerPreset(presetName, presetConfig) {
    this.presets.set(presetName, presetConfig);
  }

  /**
   * Create a material from a preset
   */
  createFromPreset(materialId, presetName, options = {}) {
    const preset = this.presets.get(presetName);
    if (!preset) {
      console.error(`Preset ${presetName} not found`);
      return null;
    }

    const config = {
      ...preset.config,
      ...options.config,
    };

    return this.create(materialId, preset.className, {
      ...options,
      config,
    });
  }

  /**
   * Create a new material
   */
  create(materialId, className, options = {}) {
    if (this.materials.has(materialId)) {
      console.warn(
        `Material ${materialId} already exists. Disposing old material.`,
      );
      this.dispose(materialId);
    }

    const MaterialClass = this.materialClasses.get(className);
    if (!MaterialClass) {
      console.error(`Material class ${className} not registered`);
      return null;
    }

    try {
      const material = new MaterialClass({
        name: materialId,
        ...options,
      });

      this.materials.set(materialId, {
        id: materialId,
        className: className,
        instance: material,
        meshes: new Set(),
        created: Date.now(),
      });

      return material;
    } catch (error) {
      console.error(`Failed to create material ${materialId}:`, error);
      return null;
    }
  }

  /**
   * Get a material by ID
   */
  get(materialId) {
    const materialData = this.materials.get(materialId);
    return materialData ? materialData.instance : null;
  }

  /**
   * Get Three.js material from a material ID
   */
  getMaterial(materialId) {
    const material = this.get(materialId);
    return material ? material.getMaterial() : null;
  }

  /**
   * Apply a material to a mesh
   */
  applyToMesh(materialId, mesh) {
    const materialData = this.materials.get(materialId);
    if (!materialData) {
      console.error(`Material ${materialId} not found`);
      return false;
    }

    // Remove mesh from previous material tracking
    const previousMaterialId = this.getMeshMaterialId(mesh);
    if (previousMaterialId) {
      const previousData = this.materials.get(previousMaterialId);
      if (previousData) {
        previousData.meshes.delete(mesh);
      }
    }

    // Apply material
    mesh.material = materialData.instance.getMaterial();
    materialData.meshes.add(mesh);

    return true;
  }

  /**
   * Get material ID for a mesh
   */
  getMeshMaterialId(mesh) {
    for (const [materialId, data] of this.materials) {
      if (data.meshes.has(mesh)) {
        return materialId;
      }
    }
    return null;
  }

  /**
   * Remove material from mesh
   */
  removeFromMesh(mesh) {
    const materialId = this.getMeshMaterialId(mesh);
    if (materialId) {
      const materialData = this.materials.get(materialId);
      if (materialData) {
        materialData.meshes.delete(mesh);
      }
    }
  }

  /**
   * Update material properties
   */
  updateMaterial(materialId, properties) {
    const material = this.get(materialId);
    if (!material) {
      console.error(`Material ${materialId} not found`);
      return false;
    }

    material.updateProperties(properties);
    return true;
  }

  /**
   * Create Tweakpane controls for a material
   */
  createTweakpaneControls(materialId, pane, folderTitle = null) {
    const material = this.get(materialId);
    if (!material) {
      console.error(`Material ${materialId} not found`);
      return null;
    }

    const folder = pane.addFolder({
      title: folderTitle || `Material: ${materialId}`,
      expanded: false,
    });

    // Get material-specific Tweakpane config if available
    let tweakConfig = {};
    if (material.getTweakpaneConfig) {
      tweakConfig = material.getTweakpaneConfig();
    }

    // Helper function to create binding
    const createBinding = (param, config = {}) => {
      const currentValue = material.config[param];
      const bindingConfig = tweakConfig[param] || config;

      // Handle special cases
      if (param === "color" || param === "sheenColor") {
        const colorObj = { [param]: `#${currentValue.getHexString()}` };
        return folder.addBinding(colorObj, param).on("change", (ev) => {
          material.updateProperty(param, new THREE.Color(ev.value));
        });
      }

      if (param === "normalScale") {
        const scaleObj = { x: currentValue.x, y: currentValue.y };
        const xBinding = folder
          .addBinding(scaleObj, "x", {
            label: "Normal Scale X",
            ...bindingConfig.x,
          })
          .on("change", (ev) => {
            material.updateProperty(
              "normalScale",
              new THREE.Vector2(ev.value, currentValue.y),
            );
          });
        const yBinding = folder
          .addBinding(scaleObj, "y", {
            label: "Normal Scale Y",
            ...bindingConfig.y,
          })
          .on("change", (ev) => {
            material.updateProperty(
              "normalScale",
              new THREE.Vector2(currentValue.x, ev.value),
            );
          });
        return [xBinding, yBinding];
      }

      // Standard numeric binding
      const valueObj = { [param]: currentValue };
      return folder
        .addBinding(valueObj, param, {
          label: param.charAt(0).toUpperCase() + param.slice(1),
          ...bindingConfig,
        })
        .on("change", (ev) => {
          material.updateProperty(param, ev.value);
        });
    };

    // Create controls based on material type
    if (material instanceof TerrazzoMaterial) {
      // PBR Properties
      const pbrFolder = folder.addFolder({
        title: "PBR Properties",
        expanded: false,
      });

      // Create bindings specifically for this folder
      const createPBRBinding = (param) => {
        const currentValue = material.config[param];
        if (param === "color") {
          const colorObj = { [param]: `#${currentValue.getHexString()}` };
          return pbrFolder.addBinding(colorObj, param).on("change", (ev) => {
            material.updateProperty(param, new THREE.Color(ev.value));
          });
        }
        const valueObj = { [param]: currentValue };
        return pbrFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      };

      createPBRBinding("color");
      createPBRBinding("roughness");

      // Physical Properties
      const physicalFolder = folder.addFolder({
        title: "Physical Properties",
        expanded: false,
      });

      const createPhysicalBinding = (param) => {
        const currentValue = material.config[param];
        const valueObj = { [param]: currentValue };
        return physicalFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      };

      createPhysicalBinding("clearcoat");
      createPhysicalBinding("clearcoatRoughness");
      createPhysicalBinding("reflectivity");
      createPhysicalBinding("ior");

      // Map Toggles
      const mapFolder = folder.addFolder({
        title: "Texture Maps",
        expanded: false,
      });

      // Map toggles need special handling
      ["color", "roughness", "normal", "displacement"].forEach((mapType) => {
        const toggleKey = `use${mapType.charAt(0).toUpperCase() + mapType.slice(1)}Map`;
        const hasToggleInConfig = material.config.hasOwnProperty(toggleKey);
        const hasToggleInCustom =
          material.customConfig?.hasOwnProperty(toggleKey);

        if (hasToggleInConfig || hasToggleInCustom) {
          const toggleValue = hasToggleInCustom
            ? material.customConfig[toggleKey]
            : material.config[toggleKey];
          const obj = { [toggleKey]: toggleValue };
          mapFolder
            .addBinding(obj, toggleKey, {
              label: `${mapType.charAt(0).toUpperCase() + mapType.slice(1)} Map`,
            })
            .on("change", (ev) => {
              material.toggleMap(mapType, ev.value);
            });
        }
      });

      // Normal Map
      const normalFolder = folder.addFolder({
        title: "Normal Map",
        expanded: false,
      });

      // Handle normalScale separately
      const normalScale = material.config.normalScale;
      const normalScaleObj = { x: normalScale.x, y: normalScale.y };
      normalFolder
        .addBinding(normalScaleObj, "x", {
          label: "Normal Scale X",
          ...(tweakConfig.normalScale?.x || {}),
        })
        .on("change", (ev) => {
          material.updateProperty(
            "normalScale",
            new THREE.Vector2(ev.value, normalScale.y),
          );
        });
      normalFolder
        .addBinding(normalScaleObj, "y", {
          label: "Normal Scale Y",
          ...(tweakConfig.normalScale?.y || {}),
        })
        .on("change", (ev) => {
          material.updateProperty(
            "normalScale",
            new THREE.Vector2(normalScale.x, ev.value),
          );
        });

      // Displacement
      const displacementFolder = folder.addFolder({
        title: "Displacement",
        expanded: false,
      });

      const createDisplacementBinding = (param) => {
        const currentValue = material.config[param];
        const valueObj = { [param]: currentValue };
        return displacementFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      };

      createDisplacementBinding("displacementScale");
      createDisplacementBinding("displacementBias");

      // Environment
      const envFolder = folder.addFolder({
        title: "Environment",
        expanded: false,
      });
      const envIntensityObj = {
        envMapIntensity: material.config.envMapIntensity,
        useSceneEnvironment: true,
        environmentOverride: 1.0,
      };
      envFolder
        .addBinding(envIntensityObj, "envMapIntensity", {
          label: "Env Map Intensity",
          ...(tweakConfig.envMapIntensity || {}),
        })
        .on("change", (ev) => {
          material.updateProperty("envMapIntensity", ev.value);
          if (material.updateEnvironmentIntensity) {
            material.updateEnvironmentIntensity(ev.value);
          }
        });

      envFolder
        .addBinding(envIntensityObj, "useSceneEnvironment", {
          label: "Use Scene Env",
        })
        .on("change", (ev) => {
          // Toggle between scene environment and custom settings
          if (!ev.value) {
            material.updateProperty(
              "envMapIntensity",
              envIntensityObj.environmentOverride,
            );
          }
        });

      envFolder
        .addBinding(envIntensityObj, "environmentOverride", {
          label: "Override Intensity",
          min: 0,
          max: 3,
          step: 0.01,
        })
        .on("change", (ev) => {
          if (!envIntensityObj.useSceneEnvironment) {
            material.updateProperty("envMapIntensity", ev.value);
          }
        });

      // Texture Settings
      const textureFolder = folder.addFolder({
        title: "Texture Settings",
        expanded: false,
      });

      // Texture repeat
      const textureRepeat =
        material.customConfig?.textureRepeat || material.config.textureRepeat;
      const repeatObj = textureRepeat
        ? {
            x: textureRepeat.x,
            y: textureRepeat.y,
          }
        : { x: 1, y: 1 };
      textureFolder
        .addBinding(repeatObj, "x", {
          label: "Repeat X",
          min: 0.1,
          max: 10,
          step: 0.1,
        })
        .on("change", (ev) => {
          material.updateTextureTransform(
            new THREE.Vector2(ev.value, repeatObj.y),
            null,
            null,
          );
        });
      textureFolder
        .addBinding(repeatObj, "y", {
          label: "Repeat Y",
          min: 0.1,
          max: 10,
          step: 0.1,
        })
        .on("change", (ev) => {
          material.updateTextureTransform(
            new THREE.Vector2(repeatObj.x, ev.value),
            null,
            null,
          );
        });

      // Texture offset
      const textureOffset =
        material.customConfig?.textureOffset || material.config.textureOffset;
      const offsetObj = textureOffset
        ? {
            x: textureOffset.x,
            y: textureOffset.y,
          }
        : { x: 0, y: 0 };
      textureFolder
        .addBinding(offsetObj, "x", {
          label: "Offset X",
          min: -1,
          max: 1,
          step: 0.01,
        })
        .on("change", (ev) => {
          material.updateTextureTransform(
            null,
            new THREE.Vector2(ev.value, offsetObj.y),
            null,
          );
        });
      textureFolder
        .addBinding(offsetObj, "y", {
          label: "Offset Y",
          min: -1,
          max: 1,
          step: 0.01,
        })
        .on("change", (ev) => {
          material.updateTextureTransform(
            null,
            new THREE.Vector2(offsetObj.x, ev.value),
            null,
          );
        });

      // Texture rotation
      const textureRotation =
        material.customConfig?.textureRotation ??
        material.config.textureRotation ??
        0;
      const rotationObj = { rotation: textureRotation };
      textureFolder
        .addBinding(rotationObj, "rotation", {
          label: "Rotation",
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
        })
        .on("change", (ev) => {
          material.updateTextureTransform(null, null, ev.value);
        });
    } else if (material instanceof SpottyMetalMaterial) {
      // PBR Properties
      const pbrFolder = folder.addFolder({
        title: "PBR Properties",
        expanded: false,
      });

      const createPBRBinding = (param) => {
        const currentValue = material.config[param];
        if (param === "color") {
          const colorObj = { [param]: `#${currentValue.getHexString()}` };
          return pbrFolder.addBinding(colorObj, param).on("change", (ev) => {
            material.updateProperty(param, new THREE.Color(ev.value));
          });
        }
        const valueObj = { [param]: currentValue };
        return pbrFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      };

      createPBRBinding("color");
      createPBRBinding("metalness");
      createPBRBinding("roughness");

      // Physical Properties
      const physicalFolder = folder.addFolder({
        title: "Physical Properties",
        expanded: false,
      });

      const createPhysicalBinding = (param) => {
        const currentValue = material.config[param];
        const valueObj = { [param]: currentValue };
        return physicalFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      };

      createPhysicalBinding("clearcoat");
      createPhysicalBinding("clearcoatRoughness");
      createPhysicalBinding("reflectivity");
      createPhysicalBinding("ior");

      // Sheen Properties
      const sheenFolder = folder.addFolder({ title: "Sheen", expanded: false });

      const createSheenBinding = (param) => {
        const currentValue = material.config[param];
        if (param === "sheenColor") {
          const colorObj = { [param]: `#${currentValue.getHexString()}` };
          return sheenFolder.addBinding(colorObj, param).on("change", (ev) => {
            material.updateProperty(param, new THREE.Color(ev.value));
          });
        }
        const valueObj = { [param]: currentValue };
        return sheenFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      };

      createSheenBinding("sheen");
      createSheenBinding("sheenRoughness");
      createSheenBinding("sheenColor");

      // Normal Map
      const normalFolder = folder.addFolder({
        title: "Normal Map",
        expanded: false,
      });

      const normalScale = material.config.normalScale;
      const normalScaleObj = { x: normalScale.x, y: normalScale.y };
      normalFolder
        .addBinding(normalScaleObj, "x", {
          label: "Normal Scale X",
          ...(tweakConfig.normalScale?.x || {}),
        })
        .on("change", (ev) => {
          material.updateProperty(
            "normalScale",
            new THREE.Vector2(ev.value, normalScale.y),
          );
        });
      normalFolder
        .addBinding(normalScaleObj, "y", {
          label: "Normal Scale Y",
          ...(tweakConfig.normalScale?.y || {}),
        })
        .on("change", (ev) => {
          material.updateProperty(
            "normalScale",
            new THREE.Vector2(normalScale.x, ev.value),
          );
        });

      // Environment
      const envFolder = folder.addFolder({
        title: "Environment",
        expanded: false,
      });
      const envIntensityObj = {
        envMapIntensity: material.config.envMapIntensity,
        useSceneEnvironment: true,
        environmentOverride: 1.0,
      };
      envFolder
        .addBinding(envIntensityObj, "envMapIntensity", {
          label: "Env Map Intensity",
          ...(tweakConfig.envMapIntensity || {}),
        })
        .on("change", (ev) => {
          material.updateProperty("envMapIntensity", ev.value);
        });

      envFolder
        .addBinding(envIntensityObj, "useSceneEnvironment", {
          label: "Use Scene Env",
        })
        .on("change", (ev) => {
          // Toggle between scene environment and custom settings
          if (!ev.value) {
            material.updateProperty(
              "envMapIntensity",
              envIntensityObj.environmentOverride,
            );
          }
        });

      envFolder
        .addBinding(envIntensityObj, "environmentOverride", {
          label: "Override Intensity",
          min: 0,
          max: 3,
          step: 0.01,
        })
        .on("change", (ev) => {
          if (!envIntensityObj.useSceneEnvironment) {
            material.updateProperty("envMapIntensity", ev.value);
          }
        });

      // Spot Pattern
      const spotFolder = folder.addFolder({
        title: "Spot Pattern",
        expanded: false,
      });
      const spotParams = [
        "spotDensity",
        "spotScale",
        "spotContrast",
        "spotMetalnessVariation",
        "spotRoughnessVariation",
      ];

      spotParams.forEach((param) => {
        const currentValue = material.config[param];
        const valueObj = { [param]: currentValue };
        spotFolder
          .addBinding(valueObj, param, {
            label: param.charAt(0).toUpperCase() + param.slice(1),
            ...(tweakConfig[param] || {}),
          })
          .on("change", (ev) => {
            material.updateProperty(param, ev.value);
          });
      });

      // Regenerate button
      spotFolder.addButton({ title: "Regenerate Pattern" }).on("click", () => {
        material.regenerateTextures();
      });

      // Texture repeat control
      const textureFolder = folder.addFolder({
        title: "Texture Settings",
        expanded: false,
      });
      const repeatObj = { x: 1, y: 1 };
      textureFolder
        .addBinding(repeatObj, "x", {
          label: "Repeat X",
          min: 0.1,
          max: 10,
          step: 0.1,
        })
        .on("change", (ev) => {
          material.setTextureRepeat(new THREE.Vector2(ev.value, repeatObj.y));
        });
      textureFolder
        .addBinding(repeatObj, "y", {
          label: "Repeat Y",
          min: 0.1,
          max: 10,
          step: 0.1,
        })
        .on("change", (ev) => {
          material.setTextureRepeat(new THREE.Vector2(repeatObj.x, ev.value));
        });
    } else {
      // Generic material controls
      const properties = [
        "color",
        "metalness",
        "roughness",
        "opacity",
        "emissive",
        "emissiveIntensity",
      ];

      properties.forEach((prop) => {
        if (material.config.hasOwnProperty(prop)) {
          createBinding(prop);
        }
      });

      // Add environment controls for generic materials
      if (material.config.hasOwnProperty("envMapIntensity")) {
        const envFolder = folder.addFolder({
          title: "Environment",
          expanded: false,
        });
        const envIntensityObj = {
          envMapIntensity: material.config.envMapIntensity || 1.0,
        };
        envFolder
          .addBinding(envIntensityObj, "envMapIntensity", {
            label: "Env Map Intensity",
            min: 0,
            max: 3,
            step: 0.01,
          })
          .on("change", (ev) => {
            material.updateProperty("envMapIntensity", ev.value);
          });
      }
    }

    // Preset selector
    const presetFolder = folder.addFolder({
      title: "Presets",
      expanded: false,
    });
    const presetOptions = {};
    for (const [key, preset] of this.presets) {
      if (preset.className === material.constructor.name) {
        presetOptions[key] = key;
      }
    }

    if (Object.keys(presetOptions).length > 0) {
      const presetObj = { preset: Object.keys(presetOptions)[0] };
      presetFolder
        .addBinding(presetObj, "preset", {
          options: presetOptions,
        })
        .on("change", (ev) => {
          const preset = this.presets.get(ev.value);
          if (preset && preset.config) {
            material.updateProperties(preset.config);
            // Refresh UI values
            pane.refresh();
          }
        });
    }

    return folder;
  }

  /**
   * Clone a material
   */
  clone(materialId, newMaterialId) {
    const materialData = this.materials.get(materialId);
    if (!materialData) {
      console.error(`Material ${materialId} not found`);
      return null;
    }

    const clonedMaterial = materialData.instance.clone();

    this.materials.set(newMaterialId, {
      id: newMaterialId,
      className: materialData.className,
      instance: clonedMaterial,
      meshes: new Set(),
      created: Date.now(),
    });

    return clonedMaterial;
  }

  /**
   * Dispose of a material
   */
  dispose(materialId) {
    const materialData = this.materials.get(materialId);
    if (!materialData) return;

    // Remove from all meshes
    materialData.meshes.forEach((mesh) => {
      mesh.material = null;
    });

    // Dispose material
    materialData.instance.dispose();

    // Remove from registry
    this.materials.delete(materialId);
  }

  /**
   * Dispose all materials
   */
  disposeAll() {
    for (const materialId of this.materials.keys()) {
      this.dispose(materialId);
    }
  }

  /**
   * Get material statistics
   */
  getStats() {
    const stats = {
      totalMaterials: this.materials.size,
      materialsByClass: {},
      totalMeshes: 0,
    };

    for (const [id, data] of this.materials) {
      stats.materialsByClass[data.className] =
        (stats.materialsByClass[data.className] || 0) + 1;
      stats.totalMeshes += data.meshes.size;
    }

    return stats;
  }

  /**
   * Export all materials configuration
   */
  exportConfig() {
    const config = {
      materials: {},
      version: "1.0",
    };

    for (const [id, data] of this.materials) {
      config.materials[id] = {
        className: data.className,
        config: data.instance.serialize(),
      };
    }

    return config;
  }

  /**
   * Import materials from configuration
   */
  async importConfig(config) {
    if (!config.materials) return;

    for (const [id, materialConfig] of Object.entries(config.materials)) {
      const MaterialClass = this.materialClasses.get(materialConfig.className);
      if (MaterialClass && MaterialClass.deserialize) {
        try {
          const material = await MaterialClass.deserialize(
            materialConfig.config,
          );
          this.materials.set(id, {
            id: id,
            className: materialConfig.className,
            instance: material,
            meshes: new Set(),
            created: Date.now(),
          });
        } catch (error) {
          console.error(`Failed to import material ${id}:`, error);
        }
      }
    }
  }
}
