import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Pane } from "tweakpane";
import gsap from "gsap";

import { ParticleSystem } from "./systems/ParticleSystem.js";
import { SceneManager } from "./components/SceneManager.js";
import { MaterialManager } from "./systems/MaterialManager.js";
import { LightingSystem } from "./systems/LightingSystem.js";
import { LightingUI } from "./components/LightingUI.js";
import { SimpleCubeMapLoader } from "./systems/SimpleCubeMapLoader.js";
import * as helpers from "./utils/helpers.js";

/**
 * Main Application Class
 * Handles initialization, rendering, and lifecycle management
 */
export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Core components
    this.sceneManager = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.stats = null;

    // Systems
    this.particleSystem = null;
    this.materialManager = null;
    this.lightingSystem = null;
    this.lightingUI = null;
    this.cubeMapLoader = null;
    this.gltfLoader = null;

    // Animation
    this.clock = new THREE.Clock();
    this.previousTime = 0;
    this.animationId = null;

    // State
    this.isInitialized = false;
    this.models = {};
    this.animations = {};
    this.mixer = null;

    // UI
    this.pane = null;

    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  async init() {
    try {
      this.setupScene();
      this.setupCamera();
      this.setupRenderer();
      this.setupControls();
      this.setupMaterialManager();
      this.setupCubeMapLoader();
      this.setupLightingSystem();
      this.setupParticleSystem();
      this.setupGround();
      this.setupStats();
      this.setupUI();
      this.setupEventListeners();

      // Load assets
      await this.loadEnvironment();
      await this.loadModels();

      // Start animations
      this.startCameraAnimation();

      this.isInitialized = true;
      console.log("App initialized successfully");

      return this;
    } catch (error) {
      console.error("Failed to initialize app:", error);
      throw error;
    }
  }

  setupScene() {
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

    this.scene = this.sceneManager.getScene();
  }

  setupCamera() {
    const aspect = this.sizes.width / this.sizes.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 20000);
    this.camera.position.set(0, 24, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: "high-performance",
      antialias: true,
      stencil: true,
      depth: true,
    });

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setPixelRatio(helpers.getPixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.9;

    // Update sceneManager with renderer reference
    this.sceneManager.renderer = this.renderer;
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = true;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.autoRotate = false;
    this.controls.enableZoom = true;
    this.controls.autoRotateSpeed = 2;
    this.controls.zoomSpeed = 1.5;
    this.controls.panSpeed = 1;
    this.controls.minDistance = 0.02;
    this.controls.maxDistance = 14;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2.1;
  }

  setupMaterialManager() {
    this.materialManager = new MaterialManager();
  }

  setupCubeMapLoader() {
    this.cubeMapLoader = new SimpleCubeMapLoader(this.sceneManager, {
      defaultCubeMap: "level-1", // Start with lighter map for faster initial load
      enableCache: true, // Enable texture caching
    });

    // Set up change callback
    this.cubeMapLoader.setChangeCallback((mapId, texture) => {
      console.log(`Environment changed to: ${mapId}`);
    });
  }

  setupLightingSystem() {
    this.lightingSystem = new LightingSystem(this.scene, {
      showHelpers: false,
      shadowsEnabled: true,
    });

    // Remove existing SceneManager lights to avoid conflicts
    if (this.sceneManager.lights.hemisphere) {
      this.scene.remove(this.sceneManager.lights.hemisphere);
    }
    if (this.sceneManager.lights.directional) {
      this.scene.remove(this.sceneManager.lights.directional);
    }

    // Create default studio lighting
    this.lightingSystem.createPreset("studio");
  }

  setupParticleSystem() {
    this.particleSystem = new ParticleSystem({
      particleCount: 150,
      particleSize: 0.08,
      colors: [
        new THREE.Color(0xff6b6b), // Coral red
        new THREE.Color(0x4ecdc4), // Teal
        new THREE.Color(0xffe66d), // Yellow
        new THREE.Color(0xa8e6cf), // Mint
        new THREE.Color(0xffd3e1), // Pink
        new THREE.Color(0xc7ceea), // Lavender
      ],
      lifespan: 10.0,
      lifespanVariation: 3.0,
      emissionRate: 0.8,
      boundingBox: new THREE.Box3(
        new THREE.Vector3(-8, -1, -8),
        new THREE.Vector3(8, 6, 8),
      ),
      velocityRange: {
        min: new THREE.Vector3(-0.3, 0.05, -0.3),
        max: new THREE.Vector3(0.3, 0.5, 0.3),
      },
      gravity: -0.02,
      wind: new THREE.Vector3(0.05, 0, 0.03),
      turbulence: 0.2,
    });

    this.scene.add(this.particleSystem.getMesh());
  }

  setupGround() {
    const gGeometry = new THREE.PlaneGeometry(3, 3, 20, 20);

    // Create terrazzo material for ground
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

    // Texture repeat is already set in the config above
  }

  setupStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  setupUI() {
    this.pane = new Pane({
      title: "Controls",
      container: document.getElementById("p--chActions"),
    });

    // Make pane draggable
    this._setupDraggablePane();

    this.setupAnimationControls();
    this.setupParticleControls();
    this.setupSceneControls();
    this.setupMaterialControls();
    this.setupLightingControls();
  }

  setupAnimationControls() {
    const animFolder = this.pane.addFolder({
      title: "Character Animations",
      expanded: false,
    });

    const animations = [
      "Offended Idle",
      "Neutral Idle",
      "Happy Idle",
      "Walking",
      "Standard Walking",
      "Running",
      "Running 2",
      "Default",
    ];

    animations.forEach((animName, index) => {
      animFolder.addButton({ title: animName }).on("click", () => {
        this.playAnimation(index);
      });
    });
  }

  setupParticleControls() {
    const particleFolder = this.pane.addFolder({
      title: "Particle System",
      expanded: false,
    });

    const particleParams = {
      emissionRate: this.particleSystem.config.emissionRate,
      particleSize: this.particleSystem.config.particleSize,
      turbulence: this.particleSystem.config.turbulence,
      gravity: this.particleSystem.config.gravity,
      windX: this.particleSystem.config.wind.x,
      windZ: this.particleSystem.config.wind.z,
    };

    particleFolder
      .addBinding(particleParams, "emissionRate", {
        min: 0,
        max: 5,
        step: 0.1,
        label: "Emission Rate",
      })
      .on("change", (ev) => {
        this.particleSystem.setEmissionRate(ev.value);
      });

    particleFolder
      .addBinding(particleParams, "turbulence", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Turbulence",
      })
      .on("change", (ev) => {
        this.particleSystem.config.turbulence = ev.value;
      });

    particleFolder
      .addBinding(particleParams, "gravity", {
        min: -0.2,
        max: 0.2,
        step: 0.01,
        label: "Gravity",
      })
      .on("change", (ev) => {
        this.particleSystem.config.gravity = ev.value;
      });

    particleFolder
      .addBinding(particleParams, "windX", {
        min: -0.5,
        max: 0.5,
        step: 0.01,
        label: "Wind X",
      })
      .on("change", (ev) => {
        this.particleSystem.config.wind.x = ev.value;
      });

    particleFolder
      .addBinding(particleParams, "windZ", {
        min: -0.5,
        max: 0.5,
        step: 0.01,
        label: "Wind Z",
      })
      .on("change", (ev) => {
        this.particleSystem.config.wind.z = ev.value;
      });
  }

  setupSceneControls() {
    const sceneFolder = this.pane.addFolder({
      title: "Scene",
      expanded: false,
    });

    const sceneParams = {
      showGrid: false,
      autoRotate: false,
      fogEnabled: false,
      fogNear: 0.1,
      fogFar: 6,
      fogColor: "#ffffff",
      // Environment settings
      environmentEnabled: true,
      environmentIntensity: 1.0,
      backgroundEnabled: true,
      backgroundIntensity: 1.0,
      backgroundBlurriness: 0.0,
      // Renderer settings
      toneMappingExposure: 1.9,
      toneMapping: "ACESFilmic",
      // Cube map
      cubeMap: this.cubeMapLoader
        ? this.cubeMapLoader.getCurrentCubeMap()
        : "level-4",
    };

    sceneFolder
      .addBinding(sceneParams, "showGrid", {
        label: "Show Grid",
      })
      .on("change", (ev) => {
        this.sceneManager.toggleGrid(ev.value);
      });

    sceneFolder
      .addBinding(sceneParams, "autoRotate", {
        label: "Auto Rotate",
      })
      .on("change", (ev) => {
        this.controls.autoRotate = ev.value;
      });

    sceneFolder
      .addBinding(sceneParams, "fogEnabled", {
        label: "Fog",
      })
      .on("change", (ev) => {
        this.sceneManager.setFog(
          ev.value,
          sceneParams.fogNear,
          sceneParams.fogFar,
          sceneParams.fogColor,
        );
      });

    sceneFolder
      .addBinding(sceneParams, "fogNear", {
        label: "Fog Near",
        min: 0.01,
        max: 10,
        step: 0.01,
      })
      .on("change", (ev) => {
        if (sceneParams.fogEnabled) {
          this.sceneManager.setFog(
            true,
            ev.value,
            sceneParams.fogFar,
            sceneParams.fogColor,
          );
        }
      });

    sceneFolder
      .addBinding(sceneParams, "fogFar", {
        label: "Fog Far",
        min: 1,
        max: 50,
        step: 0.1,
      })
      .on("change", (ev) => {
        if (sceneParams.fogEnabled) {
          this.sceneManager.setFog(
            true,
            sceneParams.fogNear,
            ev.value,
            sceneParams.fogColor,
          );
        }
      });

    sceneFolder
      .addBinding(sceneParams, "fogColor", {
        label: "Fog Color",
      })
      .on("change", (ev) => {
        if (sceneParams.fogEnabled) {
          this.sceneManager.setFog(
            true,
            sceneParams.fogNear,
            sceneParams.fogFar,
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
    if (this.cubeMapLoader) {
      envFolder
        .addBinding(sceneParams, "cubeMap", {
          label: "Cube Map",
          options: this.cubeMapLoader.getCubeMapOptions(),
        })
        .on("change", (ev) => {
          this.cubeMapLoader.handleUIChange(ev.value);
        });
    }

    envFolder
      .addBinding(sceneParams, "environmentEnabled", {
        label: "Environment",
      })
      .on("change", (ev) => {
        this.sceneManager.toggleEnvironment(ev.value);
      });

    envFolder
      .addBinding(sceneParams, "environmentIntensity", {
        label: "Env Intensity",
        min: 0,
        max: 3,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.sceneManager.updateEnvironmentIntensity(ev.value);
      });

    envFolder
      .addBinding(sceneParams, "backgroundEnabled", {
        label: "Background",
      })
      .on("change", (ev) => {
        this.sceneManager.toggleBackground(ev.value);
      });

    envFolder
      .addBinding(sceneParams, "backgroundIntensity", {
        label: "BG Intensity",
        min: 0,
        max: 3,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.sceneManager.updateBackgroundIntensity(ev.value);
      });

    envFolder
      .addBinding(sceneParams, "backgroundBlurriness", {
        label: "BG Blur",
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.sceneManager.updateBackgroundBlurriness(ev.value);
      });

    // Renderer controls
    const renderFolder = sceneFolder.addFolder({
      title: "Renderer",
      expanded: false,
    });

    renderFolder
      .addBinding(sceneParams, "toneMappingExposure", {
        label: "Exposure",
        min: 0,
        max: 5,
        step: 0.01,
      })
      .on("change", (ev) => {
        this.renderer.toneMappingExposure = ev.value;
        this.sceneManager.updateToneMappingExposure(ev.value, this.renderer);
      });

    renderFolder
      .addBinding(sceneParams, "toneMapping", {
        label: "Tone Mapping",
        options: {
          None: "None",
          Linear: "Linear",
          Reinhard: "Reinhard",
          Cineon: "Cineon",
          ACESFilmic: "ACESFilmic",
          AgX: "AgX",
          Neutral: "Neutral",
        },
      })
      .on("change", (ev) => {
        const toneMappingMap = {
          None: THREE.NoToneMapping,
          Linear: THREE.LinearToneMapping,
          Reinhard: THREE.ReinhardToneMapping,
          Cineon: THREE.CineonToneMapping,
          ACESFilmic: THREE.ACESFilmicToneMapping,
          AgX: THREE.AgXToneMapping,
          Neutral: THREE.NeutralToneMapping,
        };
        this.renderer.toneMapping = toneMappingMap[ev.value];
        this.renderer.needsUpdate = true;
      });
  }

  setupMaterialControls() {
    // Create material controls for the ground
    if (this.materialManager) {
      this.materialManager.createTweakpaneControls(
        "ground_material",
        this.pane,
        "Ground Material",
      );
    }
  }

  setupLightingControls() {
    // Create lighting UI controls
    if (this.lightingSystem) {
      this.lightingUI = new LightingUI(this.lightingSystem, this.pane);
    }
  }

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    // Mouse/touch events for interaction
    if (helpers.isTouchDevice()) {
      this.canvas.addEventListener(
        "touchstart",
        this.handleInteractionStart.bind(this),
      );
      this.canvas.addEventListener(
        "touchend",
        this.handleInteractionEnd.bind(this),
      );
    } else {
      this.canvas.addEventListener(
        "mousedown",
        this.handleInteractionStart.bind(this),
      );
      this.canvas.addEventListener(
        "mouseup",
        this.handleInteractionEnd.bind(this),
      );
    }
  }

  async loadEnvironment() {
    // Environment is now loaded through CubeMapLoader
    // which was initialized with defaultCubeMap: "level-4"
  }

  async loadModels() {
    this.gltfLoader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        "/gltf/theAllies/THE_ALLIES.glb",
        (gltf) => {
          this.setupCharacters(gltf);
          resolve();
        },
        (progress) => {
          console.log(
            "Loading progress:",
            (progress.loaded / progress.total) * 100 + "%",
          );
        },
        reject,
      );
    });
  }

  setupCharacters(gltf) {
    const allies = gltf.scene;
    allies.scale.set(0.25, 0.25, 0.25);
    allies.position.set(0, 0, 0);

    // Store character references
    this.models.allies = allies;
    this.models.characters = allies.children;

    // Setup individual characters
    const characterSetup = [
      { scale: [1.5, 1.5, 1.5], position: [0, 0, 0] },
      { scale: [0.025, 0.025, 0.025], position: [0, 0, 0] },
      { scale: [0.025, 0.025, 0.025], position: [0, 0, -0.1] },
      { scale: [0.025, 0.025, 0.025], position: [0, 0, -0.05] },
      { scale: [0.025, 0.025, 0.025], position: [0, 0, 0.1] },
      { scale: [0.025, 0.025, 0.025], position: [0, 0, 0.05] },
    ];

    allies.children.forEach((child, index) => {
      if (characterSetup[index]) {
        child.scale.set(...characterSetup[index].scale);
        child.position.set(...characterSetup[index].position);
      }
    });

    // Enable shadows
    allies.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });

    this.scene.add(allies);

    // Setup animations
    this.mixer = new THREE.AnimationMixer(allies);
    this.animations.clips = gltf.animations;
    this.animations.actions = [];

    // Play all animations by default
    gltf.animations.forEach((clip, index) => {
      const action = this.mixer.clipAction(clip);
      this.animations.actions.push(action);
      action.play();
    });
  }

  playAnimation(index) {
    if (!this.animations.actions || !this.animations.actions[index]) return;

    // Stop all animations
    this.animations.actions.forEach((action) => action.stop());

    // Play selected animation
    this.animations.actions[index].play();
  }

  startCameraAnimation() {
    const tl = gsap.timeline();
    const duration = 4;
    const ease = "linear";

    tl.to(this.camera.position, {
      x: 7,
      y: 7,
      z: 7,
      duration,
      ease,
    })
      .to(this.camera.position, {
        x: 1,
        y: 0,
        z: 1,
        duration,
        ease,
        onUpdate: () => {
          this.camera.lookAt(0, 0, 0);
        },
      })
      .to(this.camera.position, {
        x: 0.03,
        y: 0.05,
        z: 0.03,
        duration,
        ease,
        onUpdate: () => {
          this.camera.lookAt(0, 0, 0);
        },
      })
      .to(this.camera.position, {
        x: 1,
        y: 1,
        z: 1,
        duration: 10,
        ease,
      });
  }

  handleResize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(helpers.getPixelRatio());
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  handleInteractionStart(event) {
    // Future: Handle user interactions
  }

  handleInteractionEnd(event) {
    // Future: Handle user interactions
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);

    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = elapsedTime - this.previousTime;
    this.previousTime = elapsedTime;

    // Update controls
    this.controls.update();

    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Update particle system
    this.particleSystem.update(deltaTime);

    // Update scene manager (for future animated effects)
    this.sceneManager.update(deltaTime, elapsedTime);

    // Render
    this.renderer.render(this.scene, this.camera);

    // Update stats
    this.stats.update();
  }

  start() {
    if (!this.isInitialized) {
      console.warn("App not initialized. Call init() first.");
      return;
    }

    this.animate();
  }

  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    if (!this.animationId) {
      this.animate();
    }
  }

  /**
   * Setup draggable functionality for Tweakpane
   */
  _setupDraggablePane() {
    const paneElement = this.pane.element;
    let isDragging = false;
    let startX, startY;
    let initialX, initialY;

    const handleMouseDown = (e) => {
      // Only drag from the title bar
      if (e.target.closest(".tp-rotv_t") || e.target.closest(".tp-fldv_t")) {
        isDragging = true;
        paneElement.classList.add("dragging");

        // Get initial positions
        const rect = paneElement.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        startX = e.clientX;
        startY = e.clientY;

        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newX = initialX + deltaX;
      const newY = initialY + deltaY;

      // Apply new position
      paneElement.style.left = `${newX}px`;
      paneElement.style.top = `${newY}px`;
      paneElement.style.right = "auto";
      paneElement.style.transform = "none";
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        paneElement.classList.remove("dragging");
      }
    };

    // Add event listeners
    paneElement.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Store references for cleanup
    this._paneEventHandlers = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
    };
  }

  dispose() {
    this.pause();

    // Remove draggable event listeners
    if (this._paneEventHandlers && this.pane) {
      this.pane.element.removeEventListener(
        "mousedown",
        this._paneEventHandlers.mousedown,
      );
      document.removeEventListener(
        "mousemove",
        this._paneEventHandlers.mousemove,
      );
      document.removeEventListener("mouseup", this._paneEventHandlers.mouseup);
    }

    // Dispose of all resources
    this.particleSystem?.dispose();
    this.lightingSystem?.dispose();
    this.lightingUI?.dispose();
    this.cubeMapLoader?.dispose();
    this.sceneManager?.dispose();
    this.renderer?.dispose();
    this.controls?.dispose();
    this.stats?.dom?.remove();
    this.pane?.dispose();

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.models = {};
    this.animations = {};
    this.mixer = null;
  }
}
