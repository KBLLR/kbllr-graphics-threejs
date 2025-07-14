import { Sketch } from "@core/Sketch.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { SceneManager } from "@components/SceneManager.js";
import { ParticleSystem } from "@systems/ParticleSystem.js";
import { MaterialManager } from "@systems/MaterialManager.js";
import { LightingSystem } from "@systems/LightingSystem.js";
import { CubeMapLoader } from "@systems/CubeMapLoader.js";
import { SimpleCubeMapLoader } from "@systems/SimpleCubeMapLoader.js";
import * as helpers from "@utils/helpers.js";

/**
 * Camera Travelling Intro Sketch
 * Cinematic camera movements along CatmullRom spline curves with dynamic scene transitions
 * Features customizable path visualization and look-ahead targeting
 */
export default class CameraTravellingIntro extends Sketch {
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
    this.currentAnimationIndex = 0;
    this.animationNames = [];
    this.isPlayingSequence = false;
    this.finishedHandler = null;

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
      enabled: true,
      speed: 0.5,
      progress: 0,
      lookAhead: true,
      curve: null,
      points: [],
      loopMode: true,
      autoStart: true,
      pathVisible: true,
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
        enabled: true,
        color: 0x000000,
        near: 1,
        far: 30,
      },
      grid: {
        enabled: true,
        size: 40,
        divisions: 40,
        color1: 0x444444,
        color2: 0x222222,
      },
      environment: {
        background: true,
        backgroundIntensity: 0.7,
        backgroundBlurriness: 0,
        environmentIntensity: 1.0,
        toneMappingExposure: 1.2,
      },
    });

    // Create camera path
    this.createCameraPath();

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
      basePath: "/img/",
      defaultCubeMap: "level-1",
      enablePreload: false,
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
    const gGeometry = new THREE.PlaneGeometry(10, 10, 20, 20);

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
            textureRepeat: new THREE.Vector2(6, 6),
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
    // TransformControls are attached to objects, not added to scene directly
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
          "./models/theAllies.glb",
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
        console.log(
          "Available animations:",
          gltf.animations.map((clip) => clip.name),
        );
        this.mixer = new THREE.AnimationMixer(this.theAllies);

        gltf.animations.forEach((clip, index) => {
          const action = this.mixer.clipAction(clip);
          const animName = this.getAnimationName(clip.name, index, "theAllies");
          this.actions[animName] = action;
          this.animationNames.push(animName);
        });

        // Set up a single event listener for animation finished
        this.finishedHandler = (e) => {
          if (this.isPlayingSequence && e.action) {
            this.currentAnimationIndex =
              (this.currentAnimationIndex + 1) % this.animationNames.length;
            this.playNextAnimation();
          }
        };
        this.mixer.addEventListener("finished", this.finishedHandler);
      }
    } catch (error) {
      console.error("Failed to load models:", error);
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
    if (!this.theAllies) return;

    // Center the model
    this.theAllies.position.set(0, 0, 0);
    this.theAllies.scale.set(0.5, 0.5, 0.5);

    // Setup shadows and materials
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

    // Add to scene
    this.scene.add(this.theAllies);

    // Start playing all animations in sequence
    if (this.animationNames.length > 0) {
      this.isPlayingSequence = true;
      this.playNextAnimation();
    }

    // Attach transform controls
    if (this.transformControls) {
      this.transformControls.attach(this.theAllies);
    }
  }

  /**
   * Play the next animation in sequence
   */
  playNextAnimation() {
    if (this.animationNames.length === 0) return;

    const animName = this.animationNames[this.currentAnimationIndex];
    const action = this.actions[animName];

    if (action) {
      // Stop all other actions
      Object.values(this.actions).forEach((a) => a.stop());

      // Play current action
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();

      console.log(`Playing animation: ${animName}`);
    }
  }

  /**
   * Play animation
   */
  playAnimation(name) {
    const action = this.actions[name];
    if (!action) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    // Stop all other actions
    Object.values(this.actions).forEach((a) => a.stop());

    // Play the selected action
    action.reset();
    action.setLoop(
      this.animationState.loop ? THREE.LoopRepeat : THREE.LoopOnce,
    );
    action.timeScale = this.animationState.speed;
    action.play();

    this.animationState.currentAction = name;
    this.isPlayingSequence = false; // Stop sequence when manually playing
  }

  /**
   * Create camera path with spline curve
   */
  createCameraPath() {
    // Define control points for the camera path
    this.cameraAnimation.points = [
      new THREE.Vector3(0, 3, 10),
      new THREE.Vector3(8, 4, 8),
      new THREE.Vector3(10, 2, 0),
      new THREE.Vector3(8, 2, -8),
      new THREE.Vector3(0, 3, -10),
      new THREE.Vector3(-8, 5, -8),
      new THREE.Vector3(-10, 2, 0),
      new THREE.Vector3(-8, 1, 8),
      new THREE.Vector3(0, 3, 10), // Close the loop
    ];

    // Create smooth curve from points
    this.cameraAnimation.curve = new THREE.CatmullRomCurve3(
      this.cameraAnimation.points,
      this.cameraAnimation.loopMode,
      "centripetal",
    );

    // Visualize path if enabled
    if (this.cameraAnimation.pathVisible) {
      const points = this.cameraAnimation.curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
      });

      const curveObject = new THREE.Line(geometry, material);
      this.scene.add(curveObject);
    }
  }

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

    // Camera animation along spline curve
    if (this.cameraAnimation.enabled && this.cameraAnimation.curve) {
      // Increment progress based on speed
      this.cameraAnimation.progress +=
        deltaTime * this.cameraAnimation.speed * 0.1;

      // Ensure progress stays in 0-1 range for loop
      if (this.cameraAnimation.progress > 1) {
        this.cameraAnimation.progress = this.cameraAnimation.loopMode
          ? this.cameraAnimation.progress % 1
          : 1;
      }

      // Get current position on curve
      const position = this.cameraAnimation.curve.getPointAt(
        this.cameraAnimation.progress,
      );

      // Set camera position
      this.camera.position.copy(position);

      // Get direction by sampling slightly ahead on curve
      if (this.cameraAnimation.lookAhead) {
        const lookAtProgress = (this.cameraAnimation.progress + 0.01) % 1;
        const target = this.cameraAnimation.curve.getPointAt(lookAtProgress);
        this.camera.lookAt(target);
      } else if (this.theAllies) {
        // Look at character if not looking ahead
        this.camera.lookAt(this.theAllies.position);
      } else {
        // Default look at center
        this.camera.lookAt(0, 0, 0);
      }
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
    // Camera movement controls
    const cameraFolder = pane.addFolder({
      title: "Camera Path",
      expanded: true,
    });

    cameraFolder.addBinding(this.cameraAnimation, "enabled", {
      label: "Enabled",
    });

    cameraFolder.addBinding(this.cameraAnimation, "speed", {
      label: "Speed",
      min: 0.1,
      max: 2.0,
      step: 0.1,
    });

    cameraFolder.addBinding(this.cameraAnimation, "lookAhead", {
      label: "Look Ahead",
    });

    cameraFolder
      .addBinding(this.cameraAnimation, "pathVisible", {
        label: "Show Path",
      })
      .on("change", (e) => {
        // Toggle path visibility
        const pathLine = this.scene.children.find(
          (child) => child.isLine && child.material.color.getHex() === 0x00ffff,
        );

        if (pathLine) {
          pathLine.visible = e.value;
        }
      });

    cameraFolder
      .addButton({
        title: "Reset Camera",
      })
      .on("click", () => {
        this.cameraAnimation.progress = 0;
        const position = this.cameraAnimation.curve.getPointAt(0);
        this.camera.position.copy(position);
      });

    // Character animation controls
    const animationFolder = pane.addFolder({
      title: "Character Animation",
      expanded: false,
    });

    // Create animation controls
    Object.keys(this.actions).forEach((animName) => {
      animationFolder
        .addButton({
          title: animName,
        })
        .on("click", () => {
          this.playAnimation(animName);
        });
    });

    // Add button to play all animations
    animationFolder
      .addButton({
        title: "Play All (Sequence)",
      })
      .on("click", () => {
        this.currentAnimationIndex = 0;
        this.isPlayingSequence = true;
        this.playNextAnimation();
      });

    // Animation speed
    animationFolder
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
    animationFolder
      .addBinding(this.animationState, "loop")
      .on("change", (ev) => {
        if (this.currentAnimation) {
          this.currentAnimation.setLoop(
            ev.value ? THREE.LoopRepeat : THREE.LoopOnce,
          );
        }
      });

    // Character camera animation
    const characterCameraFolder = animationFolder.addFolder({
      title: "Character Camera",
      expanded: false,
    });

    characterCameraFolder.addBinding(this.cameraAnimation, "enabled", {
      label: "Enable",
    });

    characterCameraFolder.addBinding(this.cameraAnimation, "progress", {
      min: 0,
      max: 1,
      step: 0.01,
    });

    characterCameraFolder.addBinding(this.cameraAnimation, "lookAhead", {
      label: "Look Ahead",
    });

    characterCameraFolder.addBinding(this.cameraAnimation, "speed", {
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

    // Dispose animation mixer
    if (this.mixer) {
      if (this.finishedHandler) {
        this.mixer.removeEventListener("finished", this.finishedHandler);
      }
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
    }

    // Clear references
    this.models = {};
    this.actions = {};
    this.mixer = null;
    this.animationNames = [];
  }
}
