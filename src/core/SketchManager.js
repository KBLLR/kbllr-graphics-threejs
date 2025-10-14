import { EventEmitter } from "@core/EventEmitter.js";
import { sketchRegistry } from "@sketches/index.js";

/**
 * @class SketchManager
 * @classdesc Manages the lifecycle of sketches, including loading, unloading, and transitioning between them.
 * It extends EventEmitter to broadcast events related to sketch state changes.
 *
 * @extends EventEmitter
 *
 * @param {object} options - Configuration options for the SketchManager.
 * @param {HTMLElement} [options.container=document.getElementById('sketch-container')] - The container element for sketches.
 * @param {number} [options.transitionDuration=300] - Duration of the transition effect in milliseconds.
 * @param {boolean} [options.showLoader=true] - Whether to display a loader during sketch transitions.
 */
export class SketchManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      container: document.getElementById("sketch-container") || document.body,
      transitionDuration: 300,
      showLoader: true,
      ...options,
    };

    this.currentSketch = null;
    this.currentSketchId = null;
    this.isLoading = false;
    this.sketches = new Map();

    // Create loader element
    if (this.options.showLoader) {
      this.createLoader();
    }

    // Bind methods
    this.loadSketch = this.loadSketch.bind(this);
    this.disposeCurrentSketch = this.disposeCurrentSketch.bind(this);
  }

  /**
   * Registers a sketch configuration, making it available to be loaded.
   * @param {string} id - A unique identifier for the sketch.
   * @param {object} config - Configuration object for the sketch.
   * @param {string} config.name - The display name of the sketch.
   * @param {string} [config.description=""] - A short description of the sketch.
   * @param {string|null} [config.thumbnail=null] - URL to a thumbnail image.
   * @param {string} [config.category="General"] - The category of the sketch.
   * @param {string[]} [config.tags=[]] - Tags for filtering the sketch.
   */
  register(id, config) {
    this.sketches.set(id, {
      id,
      name: config.name || id,
      description: config.description || "",
      thumbnail: config.thumbnail || null,
      category: config.category || "General",
      tags: config.tags || [],
      instance: null,
      loaded: false,
    });
  }

  /**
   * Registers multiple sketches at once.
   * @param {Array<object>} sketches - An array of sketch configuration objects.
   */
  registerAll(sketches) {
    sketches.forEach((sketch) => {
      this.register(sketch.id, sketch);
    });
  }

  /**
   * Retrieves all registered sketch configurations.
   * @returns {Array<object>} An array of all sketch configurations.
   */
  getAll() {
    return Array.from(this.sketches.values());
  }

  /**
   * Retrieves sketches filtered by a specific category.
   * @param {string} category - The category to filter by.
   * @returns {Array<object>} An array of sketch configurations matching the category.
   */
  getByCategory(category) {
    return this.getAll().filter((sketch) => sketch.category === category);
  }

  /**
   * Retrieves sketches filtered by a specific tag.
   * @param {string} tag - The tag to filter by.
   * @returns {Array<object>} An array of sketch configurations containing the tag.
   */
  getByTag(tag) {
    return this.getAll().filter((sketch) => sketch.tags.includes(tag));
  }

  /**
   * Loads and initializes a sketch by its ID.
   * This method handles disposing of the current sketch, creating an instance of the new one,
   * and managing loading states.
   * @param {string} id - The ID of the sketch to load.
   * @param {object} [options={}] - Additional options to pass to the sketch's constructor.
   * @returns {Promise<Sketch|null>} A promise that resolves with the loaded sketch instance, or null if loading fails.
   */
  async loadSketch(id, options = {}) {
    // Check if sketch exists
    if (!this.sketches.has(id)) {
      throw new Error(`Sketch "${id}" not found`);
    }

    // Don't reload if already current
    if (this.currentSketchId === id && this.currentSketch) {
      return this.currentSketch;
    }

    // Set loading state
    this.isLoading = true;
    this.showLoader();
    this.emit("loading", id);

    try {
      // Get sketch config
      const sketchConfig = this.sketches.get(id);

      // Dispose current sketch
      if (this.currentSketch) {
        await this.disposeCurrentSketch();
      }

      // Get sketch class from registry
      const SketchClass = sketchRegistry[id];
      if (!SketchClass) {
        throw new Error(`Sketch class for "${id}" not found in registry`);
      }

      // Create sketch instance
      const sketch = new SketchClass({
        container: this.options.container,
        ...options,
      });

      // Initialize sketch
      await sketch.init();

      // Store reference
      sketchConfig.instance = sketch;
      sketchConfig.loaded = true;
      this.currentSketch = sketch;
      this.currentSketchId = id;

      // Hide loader
      this.hideLoader();
      this.isLoading = false;

      // Emit events
      this.emit("loaded", id, sketch);

      return sketch;
    } catch (error) {
      console.error(`Failed to load sketch "${id}":`, error);
      this.hideLoader();
      this.isLoading = false;
      this.emit("error", id, error);
      throw error;
    }
  }

  /**
   * Disposes of the currently active sketch.
   * Manages transition effects before cleaning up resources.
   * @async
   * @returns {Promise<void>}
   */
  async disposeCurrentSketch() {
    if (!this.currentSketch) return;

    this.emit("disposing", this.currentSketchId);

    try {
      // Add fade out effect
      if (this.options.transitionDuration > 0) {
        await this.fadeOut();
      }

      // Dispose sketch
      this.currentSketch.dispose();

      // Clear references
      if (this.currentSketchId && this.sketches.has(this.currentSketchId)) {
        const config = this.sketches.get(this.currentSketchId);
        config.instance = null;
      }

      this.currentSketch = null;
      this.currentSketchId = null;

      this.emit("disposed");
    } catch (error) {
      console.error("Error disposing sketch:", error);
      this.emit("error", this.currentSketchId, error);
    }
  }

  /**
   * Preloads a sketch's assets without creating an instance.
   * (Currently, this method confirms the sketch's existence in the registry).
   * @param {string} id - The ID of the sketch to preload.
   * @async
   * @returns {Promise<void>}
   */
  async preloadSketch(id) {
    if (!this.sketches.has(id)) {
      throw new Error(`Sketch "${id}" not found`);
    }

    const sketchConfig = this.sketches.get(id);

    // Already loaded
    if (sketchConfig.loaded) {
      return;
    }

    // Since we're using a registry, sketches are already loaded
    // Just check if it exists
    if (sketchRegistry[id]) {
      this.emit("preloaded", id);
    } else {
      const error = new Error(`Sketch "${id}" not found in registry`);
      console.error(`Failed to preload sketch "${id}":`, error);
      this.emit("error", id, error);
    }
  }

  /**
   * Reloads the currently active sketch.
   * @async
   * @returns {Promise<void>}
   */
  async reloadCurrentSketch() {
    if (!this.currentSketchId) return;

    const id = this.currentSketchId;
    await this.disposeCurrentSketch();
    await this.loadSketch(id);
  }

  /**
   * Creates the HTML and CSS for the loading indicator.
   * @protected
   */
  createLoader() {
    this.loader = document.createElement("div");
    this.loader.className = "sketch-loader";
    this.loader.innerHTML = `
      <div class="loader-spinner">
        <div class="spinner"></div>
        <div class="loader-text">Loading sketch...</div>
      </div>
    `;
    this.loader.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    // Add spinner styles
    const style = document.createElement("style");
    style.textContent = `
      .sketch-loader {
        transition: opacity 0.3s ease;
      }
      .loader-spinner {
        text-align: center;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 20px;
      }
      .loader-text {
        color: #fff;
        font-family: monospace;
        font-size: 14px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    this.options.container.appendChild(this.loader);
  }

  /**
   * Displays the loading indicator with a fade-in effect.
   * @protected
   */
  showLoader() {
    if (this.loader) {
      this.loader.style.display = "flex";
      requestAnimationFrame(() => {
        this.loader.style.opacity = "1";
      });
    }
  }

  /**
   * Hides the loading indicator with a fade-out effect.
   * @protected
   */
  hideLoader() {
    if (this.loader) {
      this.loader.style.opacity = "0";
      setTimeout(() => {
        this.loader.style.display = "none";
      }, 300);
    }
  }

  /**
   * Applies a fade-out transition to the sketch's canvas.
   * @protected
   * @returns {Promise<void>} A promise that resolves when the transition is complete.
   */
  fadeOut() {
    return new Promise((resolve) => {
      const canvas = this.options.container.querySelector("canvas");
      if (canvas) {
        canvas.style.transition = `opacity ${this.options.transitionDuration}ms`;
        canvas.style.opacity = "0";
        setTimeout(resolve, this.options.transitionDuration);
      } else {
        resolve();
      }
    });
  }

  /**
   * Retrieves information about the currently active sketch.
   * @returns {{id: string|null, instance: Sketch|null, config: object|null}} An object containing the current sketch's ID, instance, and configuration.
   */
  getCurrentSketch() {
    return {
      id: this.currentSketchId,
      instance: this.currentSketch,
      config: this.currentSketchId
        ? this.sketches.get(this.currentSketchId)
        : null,
    };
  }

  /**
   * Disposes of the SketchManager and all its resources.
   * This includes the current sketch, loader element, and event listeners.
   */
  dispose() {
    // Dispose current sketch
    if (this.currentSketch) {
      this.currentSketch.dispose();
    }

    // Remove loader
    if (this.loader) {
      this.loader.remove();
    }

    // Clear all references
    this.sketches.clear();
    this.currentSketch = null;
    this.currentSketchId = null;

    // Remove all listeners
    this.removeAllListeners();
  }
}
