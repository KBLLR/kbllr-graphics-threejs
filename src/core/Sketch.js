import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import { PerformanceMonitor } from "@debug/PerformanceMonitor.js";

/**
 * @class Sketch
 * @classdesc A foundational class for creating and managing a Three.js scene.
 * This class handles the boilerplate setup for a 3D environment, including the renderer,
 * scene, camera, controls, and a basic animation loop. It is designed to be extended
 * by specific sketch implementations that can override its methods to create unique 3D experiences.
 *
 * @param {object} options - Configuration options for the sketch.
 * @param {HTMLElement} [options.container=document.body] - The DOM element to append the canvas to.
 * @param {boolean} [options.showStats=true] - Whether to show performance statistics.
 * @param {boolean} [options.showControls=true] - Whether to enable OrbitControls.
 * @param {boolean} [options.enableTweakpane=true] - Whether to enable Tweakpane for GUI controls.
 * @param {boolean} [options.antialias=true] - Whether to use antialiasing.
 * @param {number} [options.pixelRatio=window.devicePixelRatio] - The pixel ratio for the renderer.
 */
export class Sketch {
  constructor(options = {}) {
    this.options = {
      container: null,
      showStats: true,
      showControls: true,
      enableTweakpane: true,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      ...options,
    };

    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // UI
    this.pane = null;
    this.stats = null;
    this.performanceMonitor = null;

    // State
    this.isInitialized = false;
    this.isRunning = false;
    this.animationId = null;

    // Timing
    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.deltaTime = 0;

    // Container
    this.container = this.options.container || document.body;
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    // Event handlers bound to this instance
    this.handleResize = this._handleResize.bind(this);
    this.animate = this._animate.bind(this);
  }

  /**
   * Initializes the sketch.
   * This method sets up the renderer, scene, camera, and other core components.
   * It also calls the `setup` method for custom initialization in child classes.
   * @async
   * @returns {Promise<void>} A promise that resolves when the sketch is fully initialized.
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Setup core components
      this.setupRenderer();
      this.setupScene();
      this.setupCamera();

      // Optional components
      if (this.options.showControls) {
        this.setupControls();
      }

      if (this.options.showStats) {
        this.setupStats();
        this.setupPerformanceMonitor();
      }

      // Child class setup
      await this.setup();

      // Setup Tweakpane after child class setup so it can access initialized properties
      if (this.options.enableTweakpane) {
        this.setupTweakpane();
      }

      // Event listeners
      this.addEventListeners();

      // Mark as initialized
      this.isInitialized = true;

      // Start animation
      this.start();
    } catch (error) {
      console.error("Failed to initialize sketch:", error);
      throw error;
    }
  }

  /**
   * Sets up the WebGL renderer.
   * @protected
   */
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias,
      alpha: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.options.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Sets up the Three.js scene.
   * @protected
   */
  setupScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Sets up the perspective camera.
   * @protected
   */
  setupCamera() {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5);
  }

  /**
   * Sets up the OrbitControls for camera manipulation.
   * @protected
   */
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below horizon
  }

  /**
   * Sets up the Tweakpane GUI for real-time parameter tweaking.
   * @protected
   */
  setupTweakpane() {
    this.pane = new Pane({
      title: this.constructor.name,
      expanded: true,
    });

    // Add default controls
    const generalFolder = this.pane.addFolder({
      title: "General",
      expanded: false,
    });

    // Add play/pause control
    generalFolder
      .addButton({
        title: this.isRunning ? "Pause" : "Play",
      })
      .on("click", () => {
        if (this.isRunning) {
          this.pause();
        } else {
          this.start();
        }
      });

    // Add performance monitor toggle
    if (this.performanceMonitor) {
      generalFolder
        .addButton({
          title: "Toggle Performance Monitor",
        })
        .on("click", () => {
          this.performanceMonitor.toggle();
        });
    }

    // Let child classes add their own controls
    this.setupGUI(this.pane);
  }

  /**
   * Sets up performance statistics. (Currently a placeholder)
   * @protected
   */
  setupStats() {
    // Implement stats if needed
    // Could use Stats.js or custom implementation
  }

  /**
   * Sets up the performance monitor for detailed statistics.
   * @protected
   */
  setupPerformanceMonitor() {
    this.performanceMonitor = new PerformanceMonitor({
      enabled: true,
      showFPS: true,
      showMemory: true,
      showTextures: true,
    });

    // Set position to bottom right
    this.performanceMonitor.setPosition("bottom-right");
  }

  /**
   * Adds necessary event listeners, such as window resize and visibility change.
   * @protected
   */
  addEventListeners() {
    window.addEventListener("resize", this.handleResize);

    // Visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.start();
      }
    });
  }

  /**
   * Removes event listeners to prevent memory leaks.
   * @protected
   */
  removeEventListeners() {
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * Handles the window resize event.
   * Updates camera aspect ratio and renderer size.
   * @protected
   */
  _handleResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    // Update camera
    if (this.camera) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }

    // Update renderer
    if (this.renderer) {
      this.renderer.setSize(this.width, this.height);
    }

    // Call child class resize handler
    this.onResize(this.width, this.height);
  }

  /**
   * The main animation loop, called on every frame.
   * @protected
   */
  _animate() {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    // Update timing
    this.deltaTime = this.clock.getDelta();
    this.elapsedTime = this.clock.getElapsedTime();

    // Update controls
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }

    // Update stats
    if (this.stats) {
      this.stats.begin();
    }

    // Call child class update
    this.update(this.deltaTime, this.elapsedTime);

    // Render
    this.render();

    // Update performance monitor
    if (this.performanceMonitor) {
      this.performanceMonitor.update(this.renderer);
    }

    if (this.stats) {
      this.stats.end();
    }
  }

  /**
   * Renders the scene through the camera.
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Starts the animation loop.
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Pauses the animation loop.
   */
  pause() {
    this.isRunning = false;
    this.clock.stop();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Cleans up all resources used by the sketch.
   * This includes disposing of Three.js objects, removing event listeners, and cleaning up UI elements.
   */
  dispose() {
    // Stop animation
    this.pause();

    // Remove event listeners
    this.removeEventListeners();

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Dispose Tweakpane
    if (this.pane) {
      this.pane.dispose();
    }

    // Dispose performance monitor
    if (this.performanceMonitor) {
      this.performanceMonitor.dispose();
    }

    // Call child class cleanup
    this.cleanup();

    // Dispose Three.js objects
    this.disposeSceneObject(this.scene);

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pane = null;

    this.isInitialized = false;
  }

  /**
   * Recursively dispose of Three.js scene objects
   */
  disposeSceneObject(obj) {
    if (!obj) return;

    // Dispose children first
    if (obj.children && obj.children.length > 0) {
      obj.children.slice().forEach(child => {
        this.disposeSceneObject(child);
        obj.remove(child);
      });
    }

    // Dispose geometry
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    // Dispose material
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((material) => this.disposeMaterial(material));
      } else {
        this.disposeMaterial(obj.material);
      }
    }

    // Dispose object itself (e.g., textures)
    if (typeof obj.dispose === "function") {
      obj.dispose();
    }
  }

  /**
   * Disposes of a material and its associated textures.
   * @param {THREE.Material} material - The material to dispose of.
   * @protected
   */
  disposeMaterial(material) {
    if (!material) return;

    // Dispose textures
    for (const key in material) {
      const value = material[key];
      // Check if the property is a texture and dispose of it
      if (value && typeof value.dispose === 'function' && value.isTexture) {
        value.dispose();
      }
    }

    // Dispose material
    if (material.dispose) {
      material.dispose();
    }
  }

  // ===== Methods to be implemented by child classes =====

  /**
   * Abstract method for setting up the sketch's specific objects and logic.
   * This method should be overridden by child classes.
   * @abstract
   * @async
   */
  async setup() {
    // Override in child class
  }

  /**
   * Abstract method for updating the sketch on each frame.
   * @abstract
   * @param {number} deltaTime - The time elapsed since the last frame.
   * @param {number} elapsedTime - The total time elapsed since the sketch started.
   */
  update(deltaTime, elapsedTime) {
    // Override in child class
  }

  /**
   * Abstract method for setting up the Tweakpane GUI.
   * @abstract
   * @param {Pane} pane - The Tweakpane instance.
   */
  setupGUI(pane) {
    // Override in child class
  }

  /**
   * Abstract method for handling window resize events.
   * @abstract
   * @param {number} width - The new width of the container.
   * @param {number} height - The new height of the container.
   */
  onResize(width, height) {
    // Override in child class
  }

  /**
   * Abstract method for cleaning up custom resources before disposal.
   * @abstract
   */
  cleanup() {
    // Override in child class
  }

  // ===== Utility methods =====

  /**
   * Utility method to load a texture.
   * @param {string} url - The URL of the texture image.
   * @returns {Promise<THREE.Texture>} A promise that resolves with the loaded texture.
   */
  loadTexture(url) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, resolve, undefined, reject);
    });
  }

  /**
   * Utility method to load a cube texture.
   * @param {string[]} urls - An array of 6 image URLs for the faces of the cube texture.
   * @returns {Promise<THREE.CubeTexture>} A promise that resolves with the loaded cube texture.
   */
  loadCubeTexture(urls) {
    return new Promise((resolve, reject) => {
      new THREE.CubeTextureLoader().load(urls, resolve, undefined, reject);
    });
  }
}
