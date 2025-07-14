import { Sketch } from "../core/Sketch.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { SceneManager } from "../components/SceneManager.js";
import { ParticleSystem } from "../systems/ParticleSystem.js";
import { MaterialManager } from "../systems/MaterialManager.js";
import { LightingSystem } from "../systems/LightingSystem.js";
import { SimpleCubeMapLoader } from "../systems/SimpleCubeMapLoader.js";
import * as helpers from "../utils/helpers.js";

/**
 * Character Animation Sketch
 * Exploring character animations and scene composition with Three.js
 */
export default class CharacterAnimationSketch extends Sketch {
  constructor(options = {}) {
    super({
      ...options,
      showControls: true,
      enableTweakpane: true,
    });

    // Scene components
    this.sceneManager = null;
    this.particleSystem = null;
    this.materialManager = null;
    this.lightingSystem = null;
    this.cubeMapLoader = null;

    // Models
    this.models = {};
    this.characters = []; // Array to hold all character instances
    this.mixers = new Map(); // One mixer per character
    this.actions = new Map(); // Actions per character
    this.currentAnimations = new Map(); // Current animation per character

    // Controls
    this.transformControls = null;
    this.transformMode = "translate";

    // Animation state
    this.animationState = {
      currentAction: null, // Will be set from available animations
      speed: 1,
      loop: true,
    };

    // Camera animation
    this.cameraAnimation = {
      enabled: false,
      radius: 5,
      height: 2,
      speed: 0.5,
    };

    // Loaders
    this.gltfLoader = null;
    this.dracoLoader = null;
  }

  /**
   * Setup the sketch
   */
  async setup() {
    // Initialize scene manager
    this.sceneManager = new SceneManager({
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
        color2: 0x222222,
      },
      environment: {
        background: true,
        backgroundIntensity: 1.0,
        backgroundBlurriness: 0.0,
        environmentIntensity: 1.0,
        toneMappingExposure: 1.9,
      },
    });

    // Replace base scene with managed scene
    this.scene = this.sceneManager.getScene();

    // Update renderer reference in scene manager
    this.sceneManager.renderer = this.renderer;

    // Setup camera
    this.camera.position.set(0, 24, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Setup renderer properties
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.9;

    // Initialize systems
    this.setupMaterialManager();
    this.setupCubeMapLoader();
    this.setupLightingSystem();
    this.setupParticleSystem();
    this.setupGround();
    this.setupLoaders();
    this.setupTransformControls();

    // Load assets
    await this.loadEnvironment();
    await this.loadModels();

    // Setup characters
    this.setupCharacters();
  }

  /**
   * Setup material manager
   */
  setupMaterialManager() {
    this.materialManager = new MaterialManager();
  }

  /**
   * Setup cube map loader
   */
  setupCubeMapLoader() {
    this.cubeMapLoader = new SimpleCubeMapLoader(this.sceneManager, {
      defaultCubeMap: "level-1",
      enableCache: true,
    });

    this.cubeMapLoader.setChangeCallback((mapId, texture) => {
      console.log(`Environment changed to: ${mapId}`);
    });
  }

  /**
   * Setup lighting system
   */
  setupLightingSystem() {
    this.lightingSystem = new LightingSystem(this.scene, {
      showHelpers: false,
      shadowsEnabled: true,
    });

    // Setup default three-point lighting
    this.lightingSystem.createDirectionalLight({
      color: 0xfff3e0,
      intensity: 2.4,
      position: new THREE.Vector3(1, 4, 2),
      castShadow: true,
      shadowConfig: {
        camera: {
          near: 0.1,
          far: 10,
          left: -5,
          right: 5,
          top: 5,
          bottom: -5,
        },
        mapSize: 2048,
        bias: -0.001,
      },
    });

    this.lightingSystem.createDirectionalLight({
      color: 0xe3f2fd,
      intensity: 0.6,
      position: new THREE.Vector3(-2, 2, -1),
      castShadow: false,
    });

    this.lightingSystem.createDirectionalLight({
      color: 0xffffff,
      intensity: 0.8,
      position: new THREE.Vector3(-1, 3, -4),
      castShadow: false,
    });

    this.lightingSystem.createAmbientLight({
      color: 0xffffff,
      intensity: 0.6,
    });
  }

  /**
   * Setup particle system
   */
  setupParticleSystem() {
    this.particleSystem = new ParticleSystem({
      particleCount: 3000,
      particleSize: 0.05,
      colors: [new THREE.Color(0x64a5ff)],
      velocityRange: {
        min: new THREE.Vector3(-0.1, 0.1, -0.1),
        max: new THREE.Vector3(0.1, 0.3, 0.1),
      },
      boundingBox: new THREE.Box3(
        new THREE.Vector3(-5, -2, -5),
        new THREE.Vector3(5, 8, 5),
      ),
    });

    // Add particle system mesh to scene
    this.scene.add(this.particleSystem.getMesh());
  }

  /**
   * Setup ground
   */
  setupGround() {
    const gGeometry = new THREE.PlaneGeometry(3, 3, 20, 20);

    const groundMaterial = this.materialManager.createFromPreset(
      "ground_material",
      "terrazzo_polished",
      {
        config: {
          color: new THREE.Color(0xffffff),
          roughness: 0.15,
          clearcoat: 0.6,
          clearcoatRoughness: 0.1,
          reflectivity: 0.8,
          envMapIntensity: 1.0,
          displacementScale: 0.0,
          _custom: {
            textureRepeat: new THREE.Vector2(2, 2),
            useDisplacementMap: false,
          },
        },
      },
    );

    const ground = new THREE.Mesh(gGeometry, groundMaterial.getMaterial());
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.models.ground = ground;
    this.scene.add(ground);
  }

  /**
   * Setup loaders
   */
  setupLoaders() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
    );

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Add FBX loader for FBX files
    this.fbxLoader = new FBXLoader();
  }

  /**
   * Setup transform controls
   */
  setupTransformControls() {
    this.transformControls = new TransformControls(
      this.camera,
      this.renderer.domElement,
    );
    this.transformControls.addEventListener("dragging-changed", (event) => {
      this.controls.enabled = !event.value;
    });
    this.transformControls.addEventListener("objectChange", () => {
      if (this.transformControls.object) {
        const target = this.transformControls.object;
        this.controls.target.copy(target.position);
      }
    });
    this.scene.add(this.transformControls);
  }

  /**
   * Load environment
   */
  async loadEnvironment() {
    await this.cubeMapLoader.loadCubeMap(
      this.cubeMapLoader.config.defaultCubeMap,
    );
  }

  /**
   * Load models
   */
  async loadModels() {
    const characterConfigs = [
      {
        path: "/gltf/theAllies/theAllies.glb",
        name: "theAllies",
        position: new THREE.Vector3(-2, 0, 0),
        scale: 0.5,
      },
      {
        path: "/gltf/piya/PIYA.fbx",
        name: "piya",
        position: new THREE.Vector3(0, 0, 0),
        scale: 0.01, // FBX files from Mixamo are often in cm
        animations: ["/gltf/piya/Walking.fbx", "/gltf/piya/Thankful.fbx"],
      },
      {
        path: "/gltf/player/innerKid.fbx",
        name: "player",
        position: new THREE.Vector3(2, 0, 0),
        scale: 0.01,
        animations: [
          "/gltf/player/player@happyIdle.fbx",
          "/gltf/player/player@neutralIdle.fbx",
          "/gltf/player/player@walking.fbx",
        ],
      },
    ];

    for (const config of characterConfigs) {
      try {
        console.log(`Loading ${config.name}...`);

        // Load main model
        const gltf = await new Promise((resolve, reject) => {
          const loader = config.path.endsWith(".fbx")
            ? this.fbxLoader
            : this.gltfLoader;
          loader.load(
            config.path,
            resolve,
            (progress) => {
              if (progress.total) {
                console.log(
                  `${config.name} loading: ${((progress.loaded / progress.total) * 100).toFixed(2)}%`,
                );
              }
            },
            reject,
          );
        });

        const character = gltf.scene || gltf;
        character.name = config.name;
        this.models[config.name] = character;

        // Create mixer for this character
        const mixer = new THREE.AnimationMixer(character);
        this.mixers.set(config.name, mixer);

        // Store character actions
        const characterActions = {};

        // Load animations from the model file
        if (gltf.animations && gltf.animations.length > 0) {
          console.log(
            `${config.name} embedded animations:`,
            gltf.animations.map((clip) => clip.name),
          );
          gltf.animations.forEach((clip, index) => {
            const action = mixer.clipAction(clip);
            // Give animations better names
            const animName = this.getAnimationName(
              clip.name,
              index,
              config.name,
            );
            characterActions[animName] = action;
          });
        }

        // Load additional animation files if specified
        if (config.animations) {
          for (const animPath of config.animations) {
            try {
              const animGltf = await new Promise((resolve, reject) => {
                const loader = animPath.endsWith(".fbx")
                  ? this.fbxLoader
                  : this.gltfLoader;
                loader.load(animPath, resolve, undefined, reject);
              });

              if (animGltf.animations && animGltf.animations.length > 0) {
                const animName = animPath
                  .split("/")
                  .pop()
                  .replace(/\.(fbx|glb)$/i, "");
                const clip = animGltf.animations[0];
                clip.name = animName;
                const action = mixer.clipAction(clip, character);
                characterActions[animName] = action;
                console.log(`Loaded animation: ${animName} for ${config.name}`);
              }
            } catch (error) {
              console.warn(`Failed to load animation ${animPath}:`, error);
            }
          }
        }

        this.actions.set(config.name, characterActions);

        // Store character data
        this.characters.push({
          name: config.name,
          model: character,
          position: config.position,
          scale: config.scale,
          mixer: mixer,
          actions: characterActions,
        });
      } catch (error) {
        console.error(`Failed to load ${config.name}:`, error);
      }
    }
  }

  /**
   * Get a better animation name
   */
  getAnimationName(originalName, index, characterName) {
    // Map common Mixamo animation names
    const nameMap = {
      "mixamo.com|Layer0.001": "Idle",
      "mixamo.com|Layer0.002": "Walk",
      "mixamo.com|Layer0.003": "Run",
      "mixamo.com|Layer0.004": "Jump",
      "mixamo.com|Layer0.005": "Dance",
      "mixamo.com|Layer0.006": "Sit",
      "mixamo.com|Layer0.007": "Stand",
      "mixamo.com|Layer0.008": "Wave",
      "mixamo.com|Layer0.009": "Talk",
    };

    // Check if we have a mapping
    for (const [pattern, niceName] of Object.entries(nameMap)) {
      if (originalName.includes(pattern)) {
        return niceName;
      }
    }

    // If it's a generic Armature name, use index
    if (originalName.includes("Armature|mixamo.com")) {
      return `Animation_${index + 1}`;
    }

    return originalName;
  }

  /**
   * Setup characters
   */
  setupCharacters() {
    let focusCharacter = null;

    this.characters.forEach((charData) => {
      const { model, position, scale, name, actions } = charData;

      // Set position and scale
      model.position.copy(position);
      model.scale.set(scale, scale, scale);

      // Setup shadows and materials
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;

          if (child.material) {
            child.material.shadowSide = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
      });

      // Add to scene
      this.scene.add(model);

      // Play first available animation for each character
      const actionKeys = Object.keys(actions);
      if (actionKeys.length > 0) {
        const firstAnimation = actionKeys[0];
        this.playCharacterAnimation(name, firstAnimation);
      }

      // Set first character as focus for transform controls
      if (!focusCharacter) {
        focusCharacter = model;
      }
    });

    // Attach transform controls to first character
    if (this.transformControls && focusCharacter) {
      this.transformControls.attach(focusCharacter);
    }
  }

  /**
   * Play animation for a specific character
   */
  playCharacterAnimation(characterName, animationName) {
    const actions = this.actions.get(characterName);
    if (!actions) {
      console.warn(`No actions found for character: ${characterName}`);
      return;
    }

    console.log(`Playing ${animationName} for ${characterName}`);
    console.log("Available animations:", Object.keys(actions));

    const newAction = actions[animationName];
    if (!newAction) {
      console.warn(
        `Animation "${animationName}" not found for ${characterName}`,
      );
      return;
    }

    const oldAction = this.currentAnimations.get(characterName);

    if (oldAction && oldAction !== newAction) {
      newAction.reset();
      newAction.crossFadeFrom(oldAction, 0.5);
      oldAction.stop();
    } else {
      newAction.reset();
      newAction.play();
    }

    this.currentAnimations.set(characterName, newAction);

    newAction.setLoop(
      this.animationState.loop ? THREE.LoopRepeat : THREE.LoopOnce,
    );
    newAction.timeScale = this.animationState.speed;
    newAction.play();
  }

  /**
   * Play animation (for backward compatibility)
   */
  playAnimation(name) {
    // Play animation on the first character
    if (this.characters.length > 0) {
      this.playCharacterAnimation(this.characters[0].name, name);
    }
  }

  /**
   * Update method
   */
  update(deltaTime, elapsedTime) {
    // Update all mixers
    this.mixers.forEach((mixer) => {
      mixer.update(deltaTime);
    });

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }

    // Update scene manager
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime, elapsedTime);
    }

    // Camera animation - focus on center of characters
    if (this.cameraAnimation.enabled && this.characters.length > 0) {
      const angle = elapsedTime * this.cameraAnimation.speed;
      this.camera.position.x = Math.cos(angle) * this.cameraAnimation.radius;
      this.camera.position.y = this.cameraAnimation.height;
      this.camera.position.z = Math.sin(angle) * this.cameraAnimation.radius;

      // Look at center point of all characters
      const center = new THREE.Vector3();
      this.characters.forEach((char) => {
        center.add(char.model.position);
      });
      center.divideScalar(this.characters.length);
      this.camera.lookAt(center);
    }
  }

  /**
   * Setup GUI
   */
  setupGUI(pane) {
    // Animation controls
    this.setupAnimationControls(pane);

    // Scene controls
    this.setupSceneControls(pane);

    // Material controls
    this.setupMaterialControls(pane);

    // Lighting controls
    this.setupLightingControls(pane);

    // Particle controls
    this.setupParticleControls(pane);
  }

  /**
   * Setup animation controls
   */
  setupAnimationControls(pane) {
    const animFolder = pane.addFolder({
      title: "Animations",
      expanded: true,
    });

    // Create animation controls for each character
    this.characters.forEach((charData) => {
      const charFolder = animFolder.addFolder({
        title: charData.name,
        expanded: false,
      });

      const actions = this.actions.get(charData.name);
      if (actions) {
        Object.keys(actions).forEach((animName) => {
          charFolder
            .addButton({
              title: animName,
            })
            .on("click", () => {
              this.playCharacterAnimation(charData.name, animName);
            });
        });
      }
    });

    // Animation speed
    animFolder
      .addBinding(this.animationState, "speed", {
        min: 0,
        max: 2,
        step: 0.01,
      })
      .on("change", (ev) => {
        if (this.currentAnimation) {
          this.currentAnimation.timeScale = ev.value;
        }
      });

    // Loop control
    animFolder.addBinding(this.animationState, "loop").on("change", (ev) => {
      if (this.currentAnimation) {
        this.currentAnimation.setLoop(
          ev.value ? THREE.LoopRepeat : THREE.LoopOnce,
        );
      }
    });

    // Camera animation
    const cameraFolder = animFolder.addFolder({
      title: "Camera Animation",
      expanded: false,
    });

    cameraFolder.addBinding(this.cameraAnimation, "enabled", {
      label: "Enable",
    });

    cameraFolder.addBinding(this.cameraAnimation, "radius", {
      min: 1,
      max: 10,
      step: 0.1,
    });

    cameraFolder.addBinding(this.cameraAnimation, "height", {
      min: 0,
      max: 5,
      step: 0.1,
    });

    cameraFolder.addBinding(this.cameraAnimation, "speed", {
      min: 0,
      max: 2,
      step: 0.01,
    });
  }

  /**
   * Setup scene controls
   */
  setupSceneControls(pane) {
    const sceneFolder = pane.addFolder({
      title: "Scene",
      expanded: false,
    });

    // Fog controls
    const fogFolder = sceneFolder.addFolder({
      title: "Fog",
      expanded: false,
    });

    const fogParams = {
      fogEnabled: this.sceneManager.config.fog.enabled,
      fogColor: `#${this.sceneManager.config.fog.color.toString(16).padStart(6, "0")}`,
      fogNear: this.sceneManager.config.fog.near,
      fogFar: this.sceneManager.config.fog.far,
    };

    fogFolder
      .addBinding(fogParams, "fogEnabled", {
        label: "Enable Fog",
      })
      .on("change", (ev) => {
        this.sceneManager.setFog(
          ev.value,
          fogParams.fogNear,
          fogParams.fogFar,
          fogParams.fogColor,
        );
      });

    fogFolder
      .addBinding(fogParams, "fogNear", {
        label: "Fog Near",
        min: 0.01,
        max: 10,
        step: 0.01,
      })
      .on("change", (ev) => {
        if (fogParams.fogEnabled) {
          this.sceneManager.setFog(
            true,
            ev.value,
            fogParams.fogFar,
            fogParams.fogColor,
          );
        }
      });

    fogFolder
      .addBinding(fogParams, "fogFar", {
        label: "Fog Far",
        min: 1,
        max: 50,
        step: 0.1,
      })
      .on("change", (ev) => {
        if (fogParams.fogEnabled) {
          this.sceneManager.setFog(
            true,
            fogParams.fogNear,
            ev.value,
            fogParams.fogColor,
          );
        }
      });

    fogFolder
      .addBinding(fogParams, "fogColor", {
        label: "Fog Color",
      })
      .on("change", (ev) => {
        if (fogParams.fogEnabled) {
          this.sceneManager.setFog(
            true,
            fogParams.fogNear,
            fogParams.fogFar,
            ev.value,
          );
        }
      });

    // Environment controls
    const envFolder = sceneFolder.addFolder({
      title: "Environment",
      expanded: false,
    });

    // Cube map selector
    const sceneParams = {
      cubeMap: this.cubeMapLoader.getCurrentCubeMap(),
    };

    envFolder
      .addBinding(sceneParams, "cubeMap", {
        label: "Cube Map",
        options: this.cubeMapLoader.getCubeMapOptions(),
      })
      .on("change", (ev) => {
        this.cubeMapLoader.handleUIChange(ev.value);
      });

    // Environment intensity
    envFolder
      .addBinding(
        this.sceneManager.config.environment,
        "environmentIntensity",
        {
          label: "Environment Intensity",
          min: 0,
          max: 3,
          step: 0.01,
        },
      )
      .on("change", (ev) => {
        this.sceneManager.updateEnvironmentIntensity(ev.value);
      });

    // Background settings
    envFolder
      .addBinding(this.sceneManager.config.environment, "background", {
        label: "Show Background",
      })
      .on("change", (ev) => {
        this.sceneManager.toggleBackground(ev.value);
      });

    envFolder
      .addBinding(this.sceneManager.config.environment, "backgroundIntensity", {
        label: "Background Intensity",
        min: 0,
        max: 3,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.sceneManager.updateBackgroundIntensity(ev.value);
      });

    envFolder
      .addBinding(
        this.sceneManager.config.environment,
        "backgroundBlurriness",
        {
          label: "Background Blur",
          min: 0,
          max: 1,
          step: 0.01,
        },
      )
      .on("change", (ev) => {
        this.sceneManager.updateBackgroundBlurriness(ev.value);
      });

    // Transform controls
    const transformFolder = sceneFolder.addFolder({
      title: "Transform Controls",
      expanded: false,
    });

    transformFolder
      .addBinding(this, "transformMode", {
        label: "Mode",
        options: {
          Translate: "translate",
          Rotate: "rotate",
          Scale: "scale",
        },
      })
      .on("change", (ev) => {
        if (this.transformControls) {
          this.transformControls.setMode(ev.value);
        }
      });
  }

  /**
   * Setup material controls
   */
  setupMaterialControls(pane) {
    const matFolder = pane.addFolder({
      title: "Materials",
      expanded: false,
    });

    if (this.materialManager) {
      // The MaterialManager requires a material ID to create controls
      // For now, we'll add controls for the ground material if it exists
      const groundMaterial = this.materialManager.get("ground_material");
      if (groundMaterial) {
        this.materialManager.createTweakpaneControls(
          "ground_material",
          matFolder,
        );
      }
    }
  }

  /**
   * Setup lighting controls
   */
  setupLightingControls(pane) {
    const lightFolder = pane.addFolder({
      title: "Lighting",
      expanded: false,
    });

    if (this.lightingSystem) {
      // Add controls for all lights
      const lights = this.lightingSystem.getAllLights();

      lights.forEach((lightData) => {
        const { id, type, light, config } = lightData;
        const lightSubFolder = lightFolder.addFolder({
          title: `${type} Light (${id})`,
          expanded: false,
        });

        // Common controls
        if (light.color) {
          lightSubFolder.addBinding(light, "intensity", {
            min: 0,
            max: 5,
            step: 0.01,
          });

          const colorObj = { color: `#${light.color.getHexString()}` };
          lightSubFolder.addBinding(colorObj, "color").on("change", (ev) => {
            light.color.set(ev.value);
          });
        }

        // Position controls for non-ambient lights
        if (type !== "ambient" && light.position) {
          const posFolder = lightSubFolder.addFolder({
            title: "Position",
            expanded: false,
          });

          posFolder.addBinding(light.position, "x", {
            min: -20,
            max: 20,
            step: 0.1,
          });

          posFolder.addBinding(light.position, "y", {
            min: -20,
            max: 20,
            step: 0.1,
          });

          posFolder.addBinding(light.position, "z", {
            min: -20,
            max: 20,
            step: 0.1,
          });
        }

        // Shadow controls
        if (light.castShadow !== undefined) {
          lightSubFolder.addBinding(light, "castShadow");
        }
      });

      // Add helper toggle
      lightFolder
        .addButton({
          title: "Toggle Helpers",
        })
        .on("click", () => {
          this.lightingSystem.toggleHelpers();
        });
    }
  }

  /**
   * Setup particle controls
   */
  setupParticleControls(pane) {
    const particleFolder = pane.addFolder({
      title: "Particles",
      expanded: false,
    });

    if (this.particleSystem) {
      // Particle count (display only - can't be changed at runtime)
      particleFolder.addBinding(this.particleSystem.config, "particleCount", {
        label: "Count",
        disabled: true,
      });

      // Particle size
      particleFolder.addBinding(this.particleSystem.config, "particleSize", {
        label: "Size",
        min: 0.01,
        max: 0.5,
        step: 0.01,
      });

      // Emission rate
      particleFolder.addBinding(this.particleSystem.config, "emissionRate", {
        label: "Emission Rate",
        min: 0,
        max: 5,
        step: 0.1,
      });

      // Gravity
      particleFolder.addBinding(this.particleSystem.config, "gravity", {
        label: "Gravity",
        min: -0.5,
        max: 0.5,
        step: 0.01,
      });

      // Wind
      const windFolder = particleFolder.addFolder({
        title: "Wind",
        expanded: false,
      });

      windFolder.addBinding(this.particleSystem.config.wind, "x", {
        label: "X",
        min: -1,
        max: 1,
        step: 0.01,
      });

      windFolder.addBinding(this.particleSystem.config.wind, "y", {
        label: "Y",
        min: -1,
        max: 1,
        step: 0.01,
      });

      windFolder.addBinding(this.particleSystem.config.wind, "z", {
        label: "Z",
        min: -1,
        max: 1,
        step: 0.01,
      });

      // Turbulence
      particleFolder.addBinding(this.particleSystem.config, "turbulence", {
        label: "Turbulence",
        min: 0,
        max: 1,
        step: 0.01,
      });

      // Lifespan
      particleFolder.addBinding(this.particleSystem.config, "lifespan", {
        label: "Lifespan",
        min: 1,
        max: 20,
        step: 0.5,
      });

      // Note about runtime limitations - using a disabled binding instead of text blade
      const noteObj = { note: "Some properties only affect new particles" };
      particleFolder.addBinding(noteObj, "note", {
        label: "Note",
        disabled: true,
      });
    }
  }

  /**
   * Handle keyboard input
   */
  onKeyDown(event) {
    if (!this.transformControls) return;

    switch (event.key.toLowerCase()) {
      case "g":
        this.transformControls.setMode("translate");
        this.transformMode = "translate";
        break;
      case "r":
        this.transformControls.setMode("rotate");
        this.transformMode = "rotate";
        break;
      case "t":
        this.transformControls.setMode("scale");
        this.transformMode = "scale";
        break;
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Dispose systems
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    if (this.particleSystem) {
      this.particleSystem.dispose();
    }

    if (this.materialManager) {
      this.materialManager.dispose();
    }

    if (this.lightingSystem) {
      this.lightingSystem.dispose();
    }

    if (this.cubeMapLoader) {
      this.cubeMapLoader.dispose();
    }

    // Dispose transform controls
    if (this.transformControls) {
      this.transformControls.dispose();
    }

    // Dispose models
    Object.values(this.models).forEach((model) => {
      if (model) {
        this.scene.remove(model);
        this.disposeObject(model);
      }
    });

    // Dispose animation mixers
    this.mixers.forEach((mixer) => {
      mixer.stopAllAction();
      mixer.uncacheRoot(mixer.getRoot());
    });

    // Clear references
    this.models = {};
    this.characters = [];
    this.mixers.clear();
    this.actions.clear();
    this.currentAnimations.clear();
  }
}
