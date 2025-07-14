import * as THREE from "three";
import { CubeMapLoader } from "../systems/CubeMapLoader.js";
import { PerformanceMonitor } from "../debug/PerformanceMonitor.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Optimized CubeMap Loading Example
 * Demonstrates efficient environment map loading with performance monitoring
 */
class OptimizedCubeMapExample {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cubeMapLoader = null;
    this.performanceMonitor = null;
    this.meshes = [];
  }

  async init() {
    // Set up basic Three.js components
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();

    // Initialize performance monitoring
    this.setupPerformanceMonitor();

    // Initialize optimized cubemap loader
    this.setupCubeMapLoader();

    // Create sample objects to show reflections
    this.createSampleObjects();

    // Set up UI controls
    this.setupUI();

    // Start animation loop
    this.animate();

    // Load initial environment
    await this.loadInitialEnvironment();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);

    // Create a simple scene manager proxy for the cubemap loader
    this.sceneManager = {
      scene: this.scene,
      renderer: null, // Will be set after renderer is created
      config: {
        environment: {
          environmentIntensity: 1.0,
          background: true,
          backgroundIntensity: 1.0,
          backgroundBlurriness: 0.0,
        },
      },
    };
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Update scene manager with renderer
    this.sceneManager.renderer = this.renderer;

    document.body.appendChild(this.renderer.domElement);

    // Handle resize
    window.addEventListener("resize", () => this.handleResize());
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 20;
    this.controls.minDistance = 2;
  }

  setupPerformanceMonitor() {
    this.performanceMonitor = new PerformanceMonitor({
      enabled: true,
      showFPS: true,
      showMemory: true,
      showTextures: true,
      updateInterval: 1000,
    });

    // Add keyboard shortcut to toggle monitor
    window.addEventListener("keydown", (e) => {
      if (e.key === "p" || e.key === "P") {
        this.performanceMonitor.toggle();
      }
    });
  }

  setupCubeMapLoader() {
    // Create optimized cubemap loader with all performance features
    this.cubeMapLoader = new CubeMapLoader(this.sceneManager, {
      defaultCubeMap: "level-1", // Start with lightweight map
      basePath: "/img/",
      textureSize: 512, // Optimized size
      enablePreload: true, // Progressive preloading
      enableCache: true, // Texture caching
      maxCacheSize: 3, // Memory management
      preloadDelay: 2000, // 2s delay before preloading others
      performanceMonitor: this.performanceMonitor, // Link monitor
    });

    // Set up progress callback with UI feedback
    this.cubeMapLoader.setProgressCallback((mapId, progress) => {
      const percentage = (progress.loaded / progress.total) * 100;
      console.log(`Loading ${mapId}: ${percentage.toFixed(0)}%`);

      // Update loading indicator if exists
      const loadingEl = document.getElementById("loading-indicator");
      if (loadingEl) {
        loadingEl.textContent = `Loading ${mapId}: ${percentage.toFixed(0)}%`;
        loadingEl.style.opacity = percentage < 100 ? "1" : "0";
      }
    });

    // Handle environment changes
    this.cubeMapLoader.setChangeCallback((mapId, texture) => {
      console.log(`Environment changed to: ${mapId}`);

      // Update materials when environment changes
      this.updateMaterialsForEnvironment(mapId);

      // Show stats
      const stats = this.cubeMapLoader.getStats();
      console.log("CubeMap Loader Stats:", stats);
    });
  }

  createSampleObjects() {
    // Create different materials to showcase environment mapping
    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 1.0,
        roughness: 0.0,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        metalness: 0.8,
        roughness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        metalness: 0.6,
        roughness: 0.4,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 1.0,
        thickness: 0.5,
        ior: 1.5,
      }),
    ];

    // Create geometries
    const geometries = [
      new THREE.SphereGeometry(0.5, 32, 16),
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16),
      new THREE.IcosahedronGeometry(0.7),
    ];

    // Create meshes in a grid
    const spacing = 2;
    materials.forEach((material, i) => {
      const geometry = geometries[i % geometries.length];
      const mesh = new THREE.Mesh(geometry, material);

      const x = (i % 2) * spacing - spacing / 2;
      const z = Math.floor(i / 2) * spacing - spacing / 2;
      mesh.position.set(x, 0, z);

      this.scene.add(mesh);
      this.meshes.push(mesh);
    });

    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    this.scene.add(directionalLight);
  }

  setupUI() {
    // Create UI container
    const uiContainer = document.createElement("div");
    uiContainer.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;

    // Title
    const title = document.createElement("h3");
    title.textContent = "Optimized CubeMap Loader";
    title.style.margin = "0 0 10px 0";
    uiContainer.appendChild(title);

    // Environment selector
    const envLabel = document.createElement("label");
    envLabel.textContent = "Environment: ";
    envLabel.style.display = "block";
    envLabel.style.marginBottom = "5px";
    uiContainer.appendChild(envLabel);

    const envSelect = document.createElement("select");
    envSelect.style.cssText = `
      width: 100%;
      padding: 5px;
      margin-bottom: 10px;
      background: #333;
      color: white;
      border: 1px solid #555;
      border-radius: 3px;
    `;

    // Add options
    const options = this.cubeMapLoader.getCubeMapOptions();
    Object.entries(options).forEach(([name, value]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      if (value === this.cubeMapLoader.getCurrentCubeMap()) {
        option.selected = true;
      }
      envSelect.appendChild(option);
    });

    envSelect.addEventListener("change", async (e) => {
      try {
        await this.cubeMapLoader.loadCubeMap(e.target.value);
      } catch (error) {
        console.error("Failed to load environment:", error);
      }
    });

    uiContainer.appendChild(envSelect);

    // Performance options
    const perfTitle = document.createElement("h4");
    perfTitle.textContent = "Performance Options";
    perfTitle.style.cssText = "margin: 15px 0 10px 0; font-size: 14px;";
    uiContainer.appendChild(perfTitle);

    // Preload toggle
    const preloadLabel = document.createElement("label");
    preloadLabel.style.cssText = "display: flex; align-items: center; margin-bottom: 5px;";
    const preloadCheckbox = document.createElement("input");
    preloadCheckbox.type = "checkbox";
    preloadCheckbox.checked = this.cubeMapLoader.config.enablePreload;
    preloadCheckbox.style.marginRight = "10px";
    preloadCheckbox.addEventListener("change", (e) => {
      this.cubeMapLoader.config.enablePreload = e.target.checked;
      console.log("Preloading:", e.target.checked ? "enabled" : "disabled");
    });
    preloadLabel.appendChild(preloadCheckbox);
    preloadLabel.appendChild(document.createTextNode("Enable Preloading"));
    uiContainer.appendChild(preloadLabel);

    // Cache toggle
    const cacheLabel = document.createElement("label");
    cacheLabel.style.cssText = "display: flex; align-items: center; margin-bottom: 5px;";
    const cacheCheckbox = document.createElement("input");
    cacheCheckbox.type = "checkbox";
    cacheCheckbox.checked = this.cubeMapLoader.config.enableCache;
    cacheCheckbox.style.marginRight = "10px";
    cacheCheckbox.addEventListener("change", (e) => {
      this.cubeMapLoader.config.enableCache = e.target.checked;
      if (!e.target.checked) {
        this.cubeMapLoader.clearCache(true); // Keep current
      }
      console.log("Caching:", e.target.checked ? "enabled" : "disabled");
    });
    cacheLabel.appendChild(cacheCheckbox);
    cacheLabel.appendChild(document.createTextNode("Enable Caching"));
    uiContainer.appendChild(cacheLabel);

    // Clear cache button
    const clearCacheBtn = document.createElement("button");
    clearCacheBtn.textContent = "Clear Cache";
    clearCacheBtn.style.cssText = `
      margin-top: 10px;
      padding: 5px 10px;
      background: #555;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    `;
    clearCacheBtn.addEventListener("click", () => {
      this.cubeMapLoader.clearCache(true);
      console.log("Cache cleared");
    });
    uiContainer.appendChild(clearCacheBtn);

    // Loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "loading-indicator";
    loadingIndicator.style.cssText = `
      margin-top: 10px;
      padding: 5px;
      background: #444;
      border-radius: 3px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    loadingIndicator.textContent = "Ready";
    uiContainer.appendChild(loadingIndicator);

    // Instructions
    const instructions = document.createElement("div");
    instructions.style.cssText = "margin-top: 15px; font-size: 12px; color: #888;";
    instructions.innerHTML = `
      <strong>Controls:</strong><br>
      • Mouse: Rotate camera<br>
      • Scroll: Zoom in/out<br>
      • P: Toggle performance monitor<br>
      <br>
      <strong>Features:</strong><br>
      • Progressive loading<br>
      • Texture caching<br>
      • Memory management<br>
      • Performance monitoring
    `;
    uiContainer.appendChild(instructions);

    document.body.appendChild(uiContainer);
  }

  async loadInitialEnvironment() {
    try {
      // Load the default environment
      await this.cubeMapLoader.loadCubeMapAsync(
        this.cubeMapLoader.config.defaultCubeMap
      );
      console.log("Initial environment loaded");
    } catch (error) {
      console.error("Failed to load initial environment:", error);
    }
  }

  updateMaterialsForEnvironment(mapId) {
    // Adjust material properties based on environment
    const environmentSettings = {
      "level-1": { intensity: 1.0, exposure: 1.0 }, // Bright sky
      "level-2": { intensity: 0.8, exposure: 1.2 }, // Cloudy
      "level-3": { intensity: 0.6, exposure: 1.5 }, // Sunset
      "level-4": { intensity: 0.3, exposure: 2.0 }, // Night
      "none": { intensity: 0.0, exposure: 1.0 },
    };

    const settings = environmentSettings[mapId] || { intensity: 1.0, exposure: 1.0 };

    // Update renderer tone mapping
    this.renderer.toneMappingExposure = settings.exposure;

    // Update scene environment intensity
    this.scene.environmentIntensity = settings.intensity;
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update controls
    this.controls.update();

    // Rotate meshes for visual interest
    this.meshes.forEach((mesh, i) => {
      mesh.rotation.x += 0.01 * (i + 1) * 0.5;
      mesh.rotation.y += 0.01 * (i + 1) * 0.5;
    });

    // Update performance monitor
    this.performanceMonitor.update(this.renderer);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    // Clean up resources
    if (this.cubeMapLoader) {
      this.cubeMapLoader.dispose();
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.dispose();
    }

    this.meshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });

    this.renderer.dispose();

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);
  }
}

// Initialize example
const example = new OptimizedCubeMapExample();
example.init().catch(console.error);

// Export for use in other modules
export { OptimizedCubeMapExample };
