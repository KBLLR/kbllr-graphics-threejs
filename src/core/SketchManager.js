import { EventEmitter } from "@core/EventEmitter.js";
import { sketchRegistry } from "@sketches/index.js";

/**
 * SketchManager - Manages loading and switching between sketches
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
   * Register a sketch for future loading
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
   * Register multiple sketches
   */
  registerAll(sketches) {
    sketches.forEach((sketch) => {
      this.register(sketch.id, sketch);
    });
  }

  /**
   * Get all registered sketches
   */
  getAll() {
    return Array.from(this.sketches.values());
  }

  /**
   * Get sketches by category
   */
  getByCategory(category) {
    return this.getAll().filter((sketch) => sketch.category === category);
  }

  /**
   * Get sketches by tag
   */
  getByTag(tag) {
    return this.getAll().filter((sketch) => sketch.tags.includes(tag));
  }

  /**
   * Load a sketch by ID
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
   * Dispose current sketch
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
   * Preload a sketch without displaying it
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
   * Reload current sketch
   */
  async reloadCurrentSketch() {
    if (!this.currentSketchId) return;

    const id = this.currentSketchId;
    await this.disposeCurrentSketch();
    await this.loadSketch(id);
  }

  /**
   * Create loader element
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
   * Show loader
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
   * Hide loader
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
   * Fade out effect
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
   * Get current sketch info
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
   * Dispose manager
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
