import { Sketch } from "@core/Sketch.js";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Simple Character Animation Sketch
 * Just loads a model and plays all animations simultaneously
 */
export default class CharacterSketch extends Sketch {
  constructor(options = {}) {
    super({
      ...options,
      showControls: true,
      enableTweakpane: true,
    });

    this.gltfLoader = new GLTFLoader();
    this.mixer = null;
    this.actions = [];

    // Model properties
    this.model = null;
    this.modelSettings = {
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
  }

  /**
   * Setup the sketch
   */
  async setup() {
    // Basic scene setup
    this.scene.background = new THREE.Color(0x222222);
    this.scene.fog = new THREE.Fog(0x222222, 1, 20);

    // Camera positioned directly in front of the character
    this.camera.position.set(0, 1, 3);
    this.camera.lookAt(0, 1, 0); // Looking directly at the character

    // Simple lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.far = 20;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    directionalLight.shadow.mapSize.set(2048, 2048);
    this.scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
    this.scene.add(gridHelper);

    // Load the model
    await this.loadModel();
  }

  /**
   * Load and setup the model
   */
  async loadModel() {
    try {
      console.log("Loading model...");
      const gltf = await this.gltfLoader.loadAsync("/models/theAllies.glb");
      console.log("Model loaded successfully:", gltf);

      // Add model to scene
      const model = gltf.scene;
      this.model = model;

      // Apply current settings
      // Use scale 1 directly
      model.scale.set(1, 1, 1);

      // Position based on settings
      model.position.set(
        this.modelSettings.position.x,
        this.modelSettings.position.y,
        this.modelSettings.position.z,
      );

      // Calculate bounding box for reference (no visual helper)
      const box = new THREE.Box3().setFromObject(model);

      // Enable shadows and log mesh information
      console.log("Model structure:");
      model.traverse((child) => {
        if (child.isMesh) {
          console.log("Found mesh:", child.name, child);
          child.castShadow = true;
          child.receiveShadow = true;

          // Ensure materials are properly configured
          if (child.material) {
            child.material.needsUpdate = true;
            // Force materials to be visible
            child.material.transparent = false;
            child.material.opacity = 1.0;
          }
        }
      });

      this.scene.add(model);

      // Setup animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);

        // Play ALL animations simultaneously
        console.log(
          "Available animations:",
          gltf.animations.map((a) => a.name),
        );
        gltf.animations.forEach((clip) => {
          console.log("Setting up animation:", clip.name);
          const action = this.mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat);
          action.clampWhenFinished = false;
          action.play();
          this.actions.push(action);
        });

        console.log(
          `Playing ${gltf.animations.length} animations simultaneously`,
        );
      }
    } catch (error) {
      console.error("Failed to load model:", error);
    }
  }

  /**
   * Update loop
   */
  update(deltaTime) {
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Add camera controls update if needed
    if (this.controls) {
      this.controls.update();
    }

    // No auto-rotation
  }

  /**
   * Reset model to default position
   */
  resetModelPosition() {
    // Default values
    const defaultPosition = { x: 0, y: 0, z: 0 };
    const defaultScale = { x: 1, y: 1, z: 1 };

    // Update settings
    this.modelSettings.position = { ...defaultPosition };
    this.modelSettings.scale = { ...defaultScale };

    // Apply to model if it exists
    if (this.model) {
      this.model.position.set(
        defaultPosition.x,
        defaultPosition.y,
        defaultPosition.z,
      );

      this.model.scale.set(defaultScale.x, defaultScale.y, defaultScale.z);
    }

    // Update GUI if needed
    if (this.pane) {
      this.pane.refresh();
    }
  }

  /**
   * Setup GUI
   */
  setupGUI(pane) {
    // Store reference to pane
    this.pane = pane;
    // Model position and scale controls
    const modelFolder = pane.addFolder({
      title: "Model Transform",
      expanded: true,
    });

    // Position controls
    modelFolder
      .addBinding(this.modelSettings.position, "x", {
        min: -2,
        max: 2,
        step: 0.01,
      })
      .on("change", () => {
        if (this.model) {
          this.model.position.x = this.modelSettings.position.x;
        }
      });

    modelFolder
      .addBinding(this.modelSettings.position, "y", {
        min: -1,
        max: 3,
        step: 0.01,
      })
      .on("change", () => {
        if (this.model) {
          this.model.position.y = this.modelSettings.position.y;
        }
      });

    modelFolder
      .addBinding(this.modelSettings.position, "z", {
        min: -2,
        max: 2,
        step: 0.01,
      })
      .on("change", () => {
        if (this.model) {
          this.model.position.z = this.modelSettings.position.z;
        }
      });

    // Scale controls (uniform scaling)
    const uniformScale = { value: this.modelSettings.scale.x };
    modelFolder
      .addBinding(uniformScale, "value", {
        label: "Scale",
        min: 0.1,
        max: 3,
        step: 0.1,
      })
      .on("change", () => {
        if (this.model) {
          this.modelSettings.scale = {
            x: uniformScale.value,
            y: uniformScale.value,
            z: uniformScale.value,
          };
          this.model.scale.set(
            uniformScale.value,
            uniformScale.value,
            uniformScale.value,
          );
        }
      });

    // Reset button
    modelFolder
      .addButton({
        title: "Reset Position",
      })
      .on("click", () => {
        this.resetModelPosition();
      });

    // Animation controls
    if (this.mixer && this.actions.length > 0) {
      const animFolder = pane.addFolder({
        title: "Animation",
        expanded: true,
      });

      // Time scale for all animations
      const timeScale = { value: 1 };
      animFolder
        .addBinding(timeScale, "value", {
          label: "Speed",
          min: 0,
          max: 3,
          step: 0.1,
        })
        .on("change", () => {
          if (this.mixer) {
            this.mixer.timeScale = timeScale.value;
          }
        });

      // Stop/Play all button
      const playState = { playing: true };
      animFolder
        .addButton({
          title: "Stop All",
        })
        .on("click", () => {
          if (playState.playing) {
            this.actions.forEach((action) => action.stop());
            playState.playing = false;
          } else {
            this.actions.forEach((action) => action.play());
            playState.playing = true;
          }
          pane.refresh();
        });
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
    }
    this.actions = [];
    this.mixer = null;
  }
}
