import { Sketch } from "../core/Sketch.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
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
    this.theAllies = null;
    this.mixer = null;
    this.actions = {};
    this.currentAnimation = null;

    // Controls
    this.transformControls = null;
    this.transformMode = "translate";

    // Animation state
    this.animationState = {
      currentAction: "Offended Idle",
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
    try {
      const gltf = await new Promise((resolve, reject) => {
        this.gltfLoader.load(
          "/gltf/theAllies/theAllies.glb",
          resolve,
          (progress) => {
            console.log(
              "Loading progress:",
              (progress.loaded / progress.total) * 100 + "%",
            );
          },
          reject,
        );
      });

      this.theAllies = gltf.scene;
      this.models.theAllies = this.theAllies;

      // Store animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.theAllies);
        gltf.animations.forEach((clip) => {
          const action = this.mixer.clipAction(clip);
          this.actions[clip.name] = action;
        });
      }
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  }

  /**
   * Setup characters
   */
  setupCharacters() {
    if (!this.theAllies) return;

    this.theAllies.position.set(0, 0, 0);
    this.theAllies.scale.set(0.5, 0.5, 0.5);

    this.theAllies.traverse((child) => {
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

    this.scene.add(this.theAllies);

    if (Object.keys(this.actions).length > 0) {
      this.playAnimation("Offended Idle");
    }

    // Attach transform controls
    if (this.transformControls) {
      this.transformControls.attach(this.theAllies);
    }
  }

  /**
   * Play animation
   */
  playAnimation(name) {
    const newAction = this.actions[name];
    if (!newAction) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    const oldAction = this.currentAnimation;

    if (oldAction && oldAction !== newAction) {
      newAction.reset();
      newAction.crossFadeFrom(oldAction, 0.5);
    } else if (!oldAction) {
      newAction.reset();
      newAction.play();
    }

    this.currentAnimation = newAction;
    this.animationState.currentAction = name;

    newAction.setLoop(
      this.animationState.loop ? THREE.LoopRepeat : THREE.LoopOnce,
    );
    newAction.timeScale = this.animationState.speed;
    newAction.play();
  }

  /**
   * Update method
   */
  update(deltaTime, elapsedTime) {
    // Update mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }

    // Update scene manager
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime, elapsedTime);
    }

    // Camera animation
    if (this.cameraAnimation.enabled && this.theAllies) {
      const angle = elapsedTime * this.cameraAnimation.speed;
      this.camera.position.x = Math.cos(angle) * this.cameraAnimation.radius;
      this.camera.position.y = this.cameraAnimation.height;
      this.camera.position.z = Math.sin(angle) * this.cameraAnimation.radius;
      this.camera.lookAt(this.theAllies.position);
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

    // Animation triggers
    const animNames = Object.keys(this.actions);
    animNames.forEach((animName) => {
      animFolder
        .addButton({
          title: animName,
        })
        .on("click", () => {
          this.playAnimation(animName);
        });
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
      this.materialManager.setupTweakpane(matFolder);
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
      this.lightingSystem.setupTweakpane(lightFolder);
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

      // Note about runtime limitations
      particleFolder.addBlade({
        view: "text",
        text: "Note: Some properties only affect new particles",
        label: "",
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

    // Dispose animation mixer
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
    }

    // Clear references
    this.models = {};
    this.actions = {};
    this.mixer = null;
    this.currentAnimation = null;
  }
}
