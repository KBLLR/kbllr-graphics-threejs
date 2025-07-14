import * as THREE from "three";

/**
 * Performance Monitor for texture and resource loading
 * Tracks FPS, memory usage, and loading performance
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.config = {
      enabled: true,
      showFPS: true,
      showMemory: true,
      showTextures: true,
      updateInterval: 1000, // Update every second
      historySize: 60, // Keep 60 seconds of history
      ...options,
    };

    // Performance metrics
    this.metrics = {
      fps: {
        current: 0,
        average: 0,
        min: Infinity,
        max: 0,
        history: [],
      },
      memory: {
        used: 0,
        limit: 0,
        textures: 0,
        geometries: 0,
        history: [],
      },
      textures: {
        loaded: 0,
        loading: 0,
        failed: 0,
        totalLoadTime: 0,
        averageLoadTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        history: [],
      },
      render: {
        calls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
        frame: 0,
      },
    };

    // Timing
    this.lastTime = performance.now();
    this.lastUpdate = performance.now();
    this.frames = 0;

    // Create monitoring elements if needed
    if (this.config.enabled) {
      this._setupMonitoring();
    }
  }

  /**
   * Set up performance monitoring
   */
  _setupMonitoring() {
    // Check for performance.memory support (Chrome only)
    this.supportsMemory = performance.memory !== undefined;

    // Create display element
    this.displayElement = this._createDisplayElement();
  }

  /**
   * Create display element for stats
   */
  _createDisplayElement() {
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      pointer-events: none;
      z-index: 1000;
      min-width: 200px;
    `;
    container.id = "performance-monitor";

    document.body.appendChild(container);
    return container;
  }

  /**
   * Update performance metrics
   */
  update(renderer) {
    if (!this.config.enabled) return;

    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    // Count frames
    this.frames++;

    // Update metrics at interval
    if (now - this.lastUpdate >= this.config.updateInterval) {
      this._updateMetrics(renderer);
      this._updateDisplay();
      this.lastUpdate = now;
    }
  }

  /**
   * Update internal metrics
   */
  _updateMetrics(renderer) {
    // FPS calculation
    const fps = (this.frames * 1000) / this.config.updateInterval;
    this.metrics.fps.current = Math.round(fps);
    this.metrics.fps.history.push(fps);
    if (this.metrics.fps.history.length > this.config.historySize) {
      this.metrics.fps.history.shift();
    }
    this.metrics.fps.average =
      this.metrics.fps.history.reduce((a, b) => a + b, 0) /
      this.metrics.fps.history.length;
    this.metrics.fps.min = Math.min(this.metrics.fps.min, fps);
    this.metrics.fps.max = Math.max(this.metrics.fps.max, fps);
    this.frames = 0;

    // Memory metrics (Chrome only)
    if (this.supportsMemory) {
      const mb = 1048576; // bytes to MB
      this.metrics.memory.used = performance.memory.usedJSHeapSize / mb;
      this.metrics.memory.limit = performance.memory.jsHeapSizeLimit / mb;
      this.metrics.memory.history.push(this.metrics.memory.used);
      if (this.metrics.memory.history.length > this.config.historySize) {
        this.metrics.memory.history.shift();
      }
    }

    // Renderer info
    if (renderer && renderer.info) {
      const info = renderer.info;
      this.metrics.render.calls = info.render.calls;
      this.metrics.render.triangles = info.render.triangles;
      this.metrics.render.points = info.render.points;
      this.metrics.render.lines = info.render.lines;
      this.metrics.render.frame = info.render.frame;

      // Memory from renderer
      this.metrics.memory.geometries = info.memory.geometries;
      this.metrics.memory.textures = info.memory.textures;
    }

    // Calculate texture metrics
    if (this.metrics.textures.loaded > 0) {
      this.metrics.textures.averageLoadTime =
        this.metrics.textures.totalLoadTime / this.metrics.textures.loaded;
    }
  }

  /**
   * Update display
   */
  _updateDisplay() {
    if (!this.displayElement) return;

    let html = "<strong>Performance Monitor</strong><br><br>";

    // FPS
    if (this.config.showFPS) {
      html += `<div style="color: ${this._getFPSColor(this.metrics.fps.current)}">`;
      html += `FPS: ${this.metrics.fps.current} `;
      html += `(avg: ${this.metrics.fps.average.toFixed(1)})<br>`;
      html += `Min: ${this.metrics.fps.min.toFixed(0)} `;
      html += `Max: ${this.metrics.fps.max.toFixed(0)}<br>`;
      html += "</div><br>";
    }

    // Memory
    if (this.config.showMemory && this.supportsMemory) {
      const usage = (this.metrics.memory.used / this.metrics.memory.limit) * 100;
      html += `<div style="color: ${this._getMemoryColor(usage)}">`;
      html += `Memory: ${this.metrics.memory.used.toFixed(0)}MB / `;
      html += `${this.metrics.memory.limit.toFixed(0)}MB `;
      html += `(${usage.toFixed(1)}%)<br>`;
      html += `Textures: ${this.metrics.memory.textures} `;
      html += `Geometries: ${this.metrics.memory.geometries}<br>`;
      html += "</div><br>";
    }

    // Textures
    if (this.config.showTextures) {
      const cacheRate =
        this.metrics.textures.cacheHits + this.metrics.textures.cacheMisses > 0
          ? (
              (this.metrics.textures.cacheHits /
                (this.metrics.textures.cacheHits +
                  this.metrics.textures.cacheMisses)) *
              100
            ).toFixed(1)
          : 0;

      html += "<div>";
      html += `Textures Loaded: ${this.metrics.textures.loaded}<br>`;
      html += `Loading: ${this.metrics.textures.loading} `;
      html += `Failed: ${this.metrics.textures.failed}<br>`;
      html += `Avg Load Time: ${this.metrics.textures.averageLoadTime.toFixed(0)}ms<br>`;
      html += `Cache Hit Rate: ${cacheRate}%<br>`;
      html += "</div><br>";
    }

    // Render info
    html += "<div style='color: #888'>";
    html += `Draw Calls: ${this.metrics.render.calls}<br>`;
    html += `Triangles: ${this._formatNumber(this.metrics.render.triangles)}<br>`;
    html += `Frame: ${this.metrics.render.frame}`;
    html += "</div>";

    this.displayElement.innerHTML = html;
  }

  /**
   * Get color based on FPS
   */
  _getFPSColor(fps) {
    if (fps >= 55) return "#00ff00"; // Green
    if (fps >= 30) return "#ffff00"; // Yellow
    return "#ff0000"; // Red
  }

  /**
   * Get color based on memory usage
   */
  _getMemoryColor(percentage) {
    if (percentage < 50) return "#00ff00"; // Green
    if (percentage < 80) return "#ffff00"; // Yellow
    return "#ff0000"; // Red
  }

  /**
   * Format large numbers
   */
  _formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }

  /**
   * Track texture load start
   */
  startTextureLoad(id) {
    if (!this.config.enabled) return;
    this.metrics.textures.loading++;
    this._textureLoadStart = this._textureLoadStart || {};
    this._textureLoadStart[id] = performance.now();
  }

  /**
   * Track texture load complete
   */
  endTextureLoad(id, success = true) {
    if (!this.config.enabled) return;

    this.metrics.textures.loading = Math.max(
      0,
      this.metrics.textures.loading - 1,
    );

    if (success) {
      this.metrics.textures.loaded++;
      if (this._textureLoadStart && this._textureLoadStart[id]) {
        const loadTime = performance.now() - this._textureLoadStart[id];
        this.metrics.textures.totalLoadTime += loadTime;
        delete this._textureLoadStart[id];
      }
    } else {
      this.metrics.textures.failed++;
    }
  }

  /**
   * Track cache hit
   */
  recordCacheHit() {
    if (!this.config.enabled) return;
    this.metrics.textures.cacheHits++;
  }

  /**
   * Track cache miss
   */
  recordCacheMiss() {
    if (!this.config.enabled) return;
    this.metrics.textures.cacheMisses++;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.fps.history = [];
    this.metrics.fps.min = Infinity;
    this.metrics.fps.max = 0;
    this.metrics.memory.history = [];
    this.metrics.textures.loaded = 0;
    this.metrics.textures.failed = 0;
    this.metrics.textures.totalLoadTime = 0;
    this.metrics.textures.cacheHits = 0;
    this.metrics.textures.cacheMisses = 0;
  }

  /**
   * Toggle display visibility
   */
  toggle() {
    this.config.enabled = !this.config.enabled;
    if (this.displayElement) {
      this.displayElement.style.display = this.config.enabled ? "block" : "none";
    }
  }

  /**
   * Set position of display
   */
  setPosition(position = "top-right") {
    if (!this.displayElement) return;

    const positions = {
      "top-left": { top: "10px", left: "10px", right: "auto", bottom: "auto" },
      "top-right": {
        top: "10px",
        right: "10px",
        left: "auto",
        bottom: "auto",
      },
      "bottom-left": {
        bottom: "10px",
        left: "10px",
        top: "auto",
        right: "auto",
      },
      "bottom-right": {
        bottom: "10px",
        right: "10px",
        top: "auto",
        left: "auto",
      },
    };

    const pos = positions[position] || positions["top-right"];
    Object.assign(this.displayElement.style, pos);
  }

  /**
   * Export metrics to CSV
   */
  exportMetrics() {
    const data = {
      fps: this.metrics.fps.history,
      memory: this.metrics.memory.history,
      timestamp: new Date().toISOString(),
    };

    const csv = this._convertToCSV(data);
    this._downloadCSV(csv, `performance-metrics-${Date.now()}.csv`);
  }

  /**
   * Convert data to CSV
   */
  _convertToCSV(data) {
    let csv = "Index,FPS,Memory(MB)\n";
    const maxLength = Math.max(data.fps.length, data.memory.length);

    for (let i = 0; i < maxLength; i++) {
      csv += `${i},${data.fps[i] || ""},${data.memory[i] || ""}\n`;
    }

    return csv;
  }

  /**
   * Download CSV file
   */
  _downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.displayElement && this.displayElement.parentNode) {
      this.displayElement.parentNode.removeChild(this.displayElement);
    }
    this.displayElement = null;
    this._textureLoadStart = null;
  }
}
