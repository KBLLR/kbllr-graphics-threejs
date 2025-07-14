import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Pane } from "tweakpane";
import { PerformanceMonitor } from "@debug/PerformanceMonitor.js";

/**
 * Base Sketch Class
 * Foundation for all Three.js sketches in the project
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
   * Initialize the sketch
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
   * Setup renderer
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
   * Setup scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Setup camera
   */
  setupCamera() {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 5);
  }

  /**
   * Setup controls
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
   * Setup Tweakpane
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
   * Setup stats
   */
  setupStats() {
    // Implement stats if needed
    // Could use Stats.js or custom implementation
  }

  /**
   * Setup performance monitor
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
   * Add event listeners
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
   * Remove event listeners
   */
  removeEventListeners() {
    window.removeEventListener("resize", this.handleResize);
  }

  /**
   * Handle resize
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
   * Animation loop
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
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Start animation
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Pause animation
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
   * Dispose of all resources
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
    this.disposeObject(this.scene);

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
   * Recursively dispose of Three.js objects
   */
  disposeObject(obj) {
    if (!obj) return;

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

    // Dispose textures
    if (obj.dispose && typeof obj.dispose === "function") {
      obj.dispose();
    }

    // Recursively dispose children
    if (obj.children) {
      while (obj.children.length > 0) {
        this.disposeObject(obj.children[0]);
        obj.remove(obj.children[0]);
      }
    }
  }

  /**
   * Dispose material and its textures
   */
  disposeMaterial(material) {
    if (!material) return;

    // Dispose textures
    Object.keys(material).forEach((key) => {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });

    // Dispose material
    if (material.dispose) {
      material.dispose();
    }
  }

  // ===== Methods to be implemented by child classes =====

  /**
   * Setup method - Override in child class
   * Called once during initialization
   */
  async setup() {
    // Override in child class
  }

  /**
   * Update method - Override in child class
   * Called every frame
   */
  update(deltaTime, elapsedTime) {
    // Override in child class
  }

  /**
   * GUI setup - Override in child class
   * @param {Pane} pane - Tweakpane instance
   */
  setupGUI(pane) {
    // Override in child class
  }

  /**
   * Resize handler - Override in child class
   */
  onResize(width, height) {
    // Override in child class
  }

  /**
   * Cleanup method - Override in child class
   * Called during disposal
   */
  cleanup() {
    // Override in child class
  }

  // ===== Utility methods =====

  /**
   * Load texture utility
   */
  loadTexture(url) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, resolve, undefined, reject);
    });
  }

  /**
   * Load cube texture utility
   */
  loadCubeTexture(urls) {
    return new Promise((resolve, reject) => {
      new THREE.CubeTextureLoader().load(urls, resolve, undefined, reject);
    });
  }
}
