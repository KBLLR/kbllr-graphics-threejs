import * as THREE from "three";

/**
 * Lighting UI Component
 * Manages Tweakpane interface for the lighting system
 */
export class LightingUI {
  constructor(lightingSystem, pane) {
    this.lightingSystem = lightingSystem;
    this.pane = pane;
    this.lightFolders = new Map();

    this.mainFolder = this.pane.addFolder({
      title: "Lighting System",
      expanded: false,
    });

    this._setupUI();
  }

  /**
   * Setup main UI structure
   */
  _setupUI() {
    // Global controls
    this._setupGlobalControls();

    // Add light controls
    this._setupAddLightControls();

    // Presets
    this._setupPresetControls();

    // Active lights folder
    this.activeLightsFolder = this.mainFolder.addFolder({
      title: "Active Lights",
      expanded: false,
    });
  }

  /**
   * Setup global lighting controls
   */
  _setupGlobalControls() {
    const globalFolder = this.mainFolder.addFolder({
      title: "Global Settings",
      expanded: false,
    });

    const globalParams = {
      showHelpers: this.lightingSystem.config.showHelpers,
      shadowsEnabled: this.lightingSystem.config.shadowsEnabled,
      helperSize: this.lightingSystem.config.helperSize,
    };

    globalFolder
      .addBinding(globalParams, "showHelpers", {
        label: "Show Helpers",
      })
      .on("change", (ev) => {
        this.lightingSystem.toggleHelpers(ev.value);
      });

    globalFolder
      .addBinding(globalParams, "shadowsEnabled", {
        label: "Enable Shadows",
      })
      .on("change", (ev) => {
        this.lightingSystem.config.shadowsEnabled = ev.value;
        // Update all shadow-casting lights
        this.lightingSystem.getAllLights().forEach((lightData) => {
          if (lightData.light.castShadow !== undefined) {
            lightData.light.castShadow = lightData.config.castShadow && ev.value;
          }
        });
      });

    globalFolder
      .addBinding(globalParams, "helperSize", {
        label: "Helper Size",
        min: 0.1,
        max: 5,
        step: 0.1,
      })
      .on("change", (ev) => {
        this.lightingSystem.config.helperSize = ev.value;
      });
  }

  /**
   * Setup add light controls
   */
  _setupAddLightControls() {
    const addFolder = this.mainFolder.addFolder({
      title: "Add Lights",
      expanded: false,
    });

    // Light type buttons
    const lightTypes = [
      { type: "ambient", label: "Ambient Light" },
      { type: "directional", label: "Directional Light" },
      { type: "hemisphere", label: "Hemisphere Light" },
      { type: "point", label: "Point Light" },
      { type: "spot", label: "Spot Light" },
      { type: "rectArea", label: "RectArea Light" },
      { type: "gobo", label: "Gobo Projector" },
    ];

    lightTypes.forEach(({ type, label }) => {
      if (type === "gobo") {
        // Special handling for gobo projector
        const goboFolder = addFolder.addFolder({
          title: label,
          expanded: false,
        });

        const goboParams = {
          goboName: "Canopy",
        };

        goboFolder
          .addBinding(goboParams, "goboName", {
            label: "Gobo Pattern",
            options: this._getGoboOptions(),
          });

        goboFolder
          .addButton({ title: "Add Gobo Projector" })
          .on("click", () => {
            const id = this.lightingSystem.createGoboProjector(goboParams.goboName);
            if (id) {
              this._createLightControls(id);
            }
          });
      } else {
        addFolder
          .addButton({ title: label })
          .on("click", () => {
            const id = this._createLight(type);
            this._createLightControls(id);
          });
      }
    });
  }

  /**
   * Setup preset controls
   */
  _setupPresetControls() {
    const presetFolder = this.mainFolder.addFolder({
      title: "Lighting Presets",
      expanded: false,
    });

    const presetParams = {
      preset: "studio",
    };

    presetFolder
      .addBinding(presetParams, "preset", {
        label: "Preset",
        options: {
          Studio: "studio",
          Sunset: "sunset",
          Nightclub: "nightclub",
          Underwater: "underwater",
        },
      });

    presetFolder
      .addButton({ title: "Apply Preset" })
      .on("click", () => {
        // Clear existing UI
        this._clearAllLightControls();

        // Apply preset
        this.lightingSystem.createPreset(presetParams.preset);

        // Create UI for new lights
        this.lightingSystem.getAllLights().forEach((lightData) => {
          this._createLightControls(lightData.id);
        });
      });

    presetFolder
      .addButton({ title: "Clear All Lights" })
      .on("click", () => {
        this._clearAllLightControls();
        this.lightingSystem.clearAllLights();
      });
  }

  /**
   * Create light based on type
   */
  _createLight(type) {
    const methods = {
      ambient: () => this.lightingSystem.createAmbientLight(),
      directional: () => this.lightingSystem.createDirectionalLight(),
      hemisphere: () => this.lightingSystem.createHemisphereLight(),
      point: () => this.lightingSystem.createPointLight(),
      spot: () => this.lightingSystem.createSpotLight(),
      rectArea: () => this.lightingSystem.createRectAreaLight(),
    };

    return methods[type] ? methods[type]() : null;
  }

  /**
   * Create controls for a specific light
   */
  _createLightControls(lightId) {
    const lightData = this.lightingSystem.lights.get(lightId);
    if (!lightData) return;

    const { type, config } = lightData;
    const folder = this.activeLightsFolder.addFolder({
      title: `${lightId} (${type})`,
      expanded: false,
    });

    // Remove button
    folder
      .addButton({ title: "Remove Light" })
      .on("click", () => {
        this.lightingSystem.removeLight(lightId);
        this._removeLightControls(lightId);
      });

    // Type-specific controls
    switch (type) {
      case "ambient":
        this._createAmbientControls(folder, lightId, config);
        break;
      case "directional":
        this._createDirectionalControls(folder, lightId, config);
        break;
      case "hemisphere":
        this._createHemisphereControls(folder, lightId, config);
        break;
      case "point":
        this._createPointControls(folder, lightId, config);
        break;
      case "spot":
        this._createSpotControls(folder, lightId, config);
        break;
      case "rectArea":
        this._createRectAreaControls(folder, lightId, config);
        break;
    }

    this.lightFolders.set(lightId, folder);
  }

  /**
   * Create ambient light controls
   */
  _createAmbientControls(folder, lightId, config) {
    const params = {
      color: `#${new THREE.Color(config.color).getHexString()}`,
      intensity: config.intensity,
    };

    folder
      .addBinding(params, "color")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { color: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "intensity", {
        min: 0,
        max: 2,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { intensity: ev.value });
      });
  }

  /**
   * Create directional light controls
   */
  _createDirectionalControls(folder, lightId, config) {
    const params = {
      color: `#${new THREE.Color(config.color).getHexString()}`,
      intensity: config.intensity,
      positionX: config.position.x,
      positionY: config.position.y,
      positionZ: config.position.z,
      castShadow: config.castShadow,
    };

    folder
      .addBinding(params, "color")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { color: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "intensity", {
        min: 0,
        max: 3,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { intensity: ev.value });
      });

    // Position controls
    const posFolder = folder.addFolder({
      title: "Position",
      expanded: false,
    });

    ["positionX", "positionY", "positionZ"].forEach((axis, index) => {
      posFolder
        .addBinding(params, axis, {
          label: ["X", "Y", "Z"][index],
          min: -20,
          max: 20,
          step: 0.1,
        })
        .on("change", () => {
          this.lightingSystem.updateLight(lightId, {
            position: new THREE.Vector3(params.positionX, params.positionY, params.positionZ),
          });
        });
    });

    folder
      .addBinding(params, "castShadow")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { castShadow: ev.value });
      });
  }

  /**
   * Create hemisphere light controls
   */
  _createHemisphereControls(folder, lightId, config) {
    const params = {
      skyColor: `#${new THREE.Color(config.skyColor).getHexString()}`,
      groundColor: `#${new THREE.Color(config.groundColor).getHexString()}`,
      intensity: config.intensity,
    };

    folder
      .addBinding(params, "skyColor", { label: "Sky Color" })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { skyColor: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "groundColor", { label: "Ground Color" })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { groundColor: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "intensity", {
        min: 0,
        max: 2,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { intensity: ev.value });
      });
  }

  /**
   * Create point light controls
   */
  _createPointControls(folder, lightId, config) {
    const params = {
      color: `#${new THREE.Color(config.color).getHexString()}`,
      intensity: config.intensity,
      distance: config.distance,
      decay: config.decay,
      positionX: config.position.x,
      positionY: config.position.y,
      positionZ: config.position.z,
      castShadow: config.castShadow,
    };

    folder
      .addBinding(params, "color")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { color: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "intensity", {
        min: 0,
        max: 5,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { intensity: ev.value });
      });

    folder
      .addBinding(params, "distance", {
        min: 0,
        max: 50,
        step: 0.1,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { distance: ev.value });
      });

    folder
      .addBinding(params, "decay", {
        min: 0,
        max: 3,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { decay: ev.value });
      });

    // Position controls
    const posFolder = folder.addFolder({
      title: "Position",
      expanded: false,
    });

    ["positionX", "positionY", "positionZ"].forEach((axis, index) => {
      posFolder
        .addBinding(params, axis, {
          label: ["X", "Y", "Z"][index],
          min: -20,
          max: 20,
          step: 0.1,
        })
        .on("change", () => {
          this.lightingSystem.updateLight(lightId, {
            position: new THREE.Vector3(params.positionX, params.positionY, params.positionZ),
          });
        });
    });

    folder
      .addBinding(params, "castShadow")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { castShadow: ev.value });
      });
  }

  /**
   * Create spot light controls
   */
  _createSpotControls(folder, lightId, config) {
    const params = {
      color: `#${new THREE.Color(config.color).getHexString()}`,
      intensity: config.intensity,
      distance: config.distance,
      angle: config.angle,
      penumbra: config.penumbra,
      decay: config.decay,
      positionX: config.position.x,
      positionY: config.position.y,
      positionZ: config.position.z,
      targetX: config.target.x,
      targetY: config.target.y,
      targetZ: config.target.z,
      castShadow: config.castShadow,
      gobo: config.map ? "custom" : "none",
    };

    folder
      .addBinding(params, "color")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { color: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "intensity", {
        min: 0,
        max: 5,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { intensity: ev.value });
      });

    folder
      .addBinding(params, "angle", {
        min: 0,
        max: Math.PI / 2,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { angle: ev.value });
      });

    folder
      .addBinding(params, "penumbra", {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { penumbra: ev.value });
      });

    // Position controls
    const posFolder = folder.addFolder({
      title: "Position",
      expanded: false,
    });

    ["positionX", "positionY", "positionZ"].forEach((axis, index) => {
      posFolder
        .addBinding(params, axis, {
          label: ["X", "Y", "Z"][index],
          min: -20,
          max: 20,
          step: 0.1,
        })
        .on("change", () => {
          this.lightingSystem.updateLight(lightId, {
            position: new THREE.Vector3(params.positionX, params.positionY, params.positionZ),
          });
        });
    });

    // Target controls
    const targetFolder = folder.addFolder({
      title: "Target",
      expanded: false,
    });

    ["targetX", "targetY", "targetZ"].forEach((axis, index) => {
      targetFolder
        .addBinding(params, axis, {
          label: ["X", "Y", "Z"][index],
          min: -20,
          max: 20,
          step: 0.1,
        })
        .on("change", () => {
          this.lightingSystem.updateLight(lightId, {
            target: new THREE.Vector3(params.targetX, params.targetY, params.targetZ),
          });
        });
    });

    // Gobo controls
    const goboFolder = folder.addFolder({
      title: "Gobo Projection",
      expanded: false,
    });

    goboFolder
      .addBinding(params, "gobo", {
        label: "Pattern",
        options: this._getGoboOptions(),
      })
      .on("change", (ev) => {
        if (ev.value === "none") {
          this.lightingSystem.updateLight(lightId, { map: null });
        } else {
          this.lightingSystem.updateLight(lightId, { goboName: ev.value });
        }
      });

    folder
      .addBinding(params, "castShadow")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { castShadow: ev.value });
      });
  }

  /**
   * Create rect area light controls
   */
  _createRectAreaControls(folder, lightId, config) {
    const params = {
      color: `#${new THREE.Color(config.color).getHexString()}`,
      intensity: config.intensity,
      width: config.width,
      height: config.height,
      positionX: config.position.x,
      positionY: config.position.y,
      positionZ: config.position.z,
    };

    folder
      .addBinding(params, "color")
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { color: new THREE.Color(ev.value) });
      });

    folder
      .addBinding(params, "intensity", {
        min: 0,
        max: 5,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { intensity: ev.value });
      });

    folder
      .addBinding(params, "width", {
        min: 0.1,
        max: 20,
        step: 0.1,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { width: ev.value });
      });

    folder
      .addBinding(params, "height", {
        min: 0.1,
        max: 20,
        step: 0.1,
      })
      .on("change", (ev) => {
        this.lightingSystem.updateLight(lightId, { height: ev.value });
      });

    // Position controls
    const posFolder = folder.addFolder({
      title: "Position",
      expanded: false,
    });

    ["positionX", "positionY", "positionZ"].forEach((axis, index) => {
      posFolder
        .addBinding(params, axis, {
          label: ["X", "Y", "Z"][index],
          min: -20,
          max: 20,
          step: 0.1,
        })
        .on("change", () => {
          this.lightingSystem.updateLight(lightId, {
            position: new THREE.Vector3(params.positionX, params.positionY, params.positionZ),
          });
        });
    });
  }

  /**
   * Get gobo options
   */
  _getGoboOptions() {
    const options = { None: "none" };
    const goboNames = [
      "Canopy",
      "Canopy Sharp",
      "Palm Tree",
      "Palm Tree 1",
      "Palm Tree 2",
      "Stained Glass",
      "Tree 2",
      "Tree 3",
      "Caustics 1",
      "Caustics 2",
      "Caustics 3",
      "Window 1",
      "Window 2",
      "Blinds 1",
      "Blinds 2",
    ];

    goboNames.forEach((name) => {
      options[name] = name;
    });

    return options;
  }

  /**
   * Remove light controls
   */
  _removeLightControls(lightId) {
    const folder = this.lightFolders.get(lightId);
    if (folder) {
      this.activeLightsFolder.remove(folder);
      this.lightFolders.delete(lightId);
    }
  }

  /**
   * Clear all light controls
   */
  _clearAllLightControls() {
    this.lightFolders.forEach((folder, lightId) => {
      this.activeLightsFolder.remove(folder);
    });
    this.lightFolders.clear();
  }

  /**
   * Dispose
   */
  dispose() {
    this._clearAllLightControls();
    if (this.mainFolder) {
      this.pane.remove(this.mainFolder);
    }
  }
}
