import './style.css';
import { SketchManager } from './core/SketchManager.js';

/**
 * Main Gallery Application
 * Manages and displays a collection of Three.js sketches
 */
class SketchGallery {
  constructor() {
    this.sketchManager = null;
    this.currentCategory = 'all';
    this.isMenuOpen = true;

    // UI Elements
    this.elements = {
      container: null,
      sketchContainer: null,
      menu: null,
      menuToggle: null,
      sketchGrid: null,
      categoryFilter: null,
      searchInput: null,
      currentSketchInfo: null,
    };
  }

  /**
   * Initialize the gallery
   */
  async init() {
    try {
      // Create UI structure
      this.createUI();

      // Initialize sketch manager
      this.sketchManager = new SketchManager({
        container: this.elements.sketchContainer,
        showLoader: true,
      });

      // Register all sketches
      this.registerSketches();

      // Setup event listeners
      this.setupEventListeners();

      // Populate gallery
      this.populateGallery();

      // Load initial sketch from URL or default
      await this.loadInitialSketch();

    } catch (error) {
      console.error('Failed to initialize gallery:', error);
      this.showError('Failed to initialize gallery');
    }
  }

  /**
   * Create UI structure
   */
  createUI() {
    // Main container
    const container = document.createElement('div');
    container.className = 'gallery-container';
    container.innerHTML = `
      <div class="gallery-menu">
        <div class="menu-header">
          <h1>Three.js Sketches</h1>
          <p class="menu-subtitle">Experiments in 3D Graphics</p>
        </div>

        <div class="menu-controls">
          <input type="search" class="search-input" placeholder="Search sketches...">

          <div class="category-filter">
            <label>Category:</label>
            <select class="category-select">
              <option value="all">All Categories</option>
              <option value="animation">Animation</option>
              <option value="shaders">Shaders</option>
              <option value="particles">Particles</option>
              <option value="geometry">Geometry</option>
              <option value="lighting">Lighting</option>
              <option value="interaction">Interaction</option>
            </select>
          </div>
        </div>

        <div class="sketch-grid"></div>

        <div class="menu-footer">
          <div class="current-sketch-info">
            <span class="info-label">Current:</span>
            <span class="info-value">None</span>
          </div>
        </div>
      </div>

      <button class="menu-toggle" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="sketch-container" id="sketch-container"></div>
    `;

    document.body.appendChild(container);

    // Store element references
    this.elements.container = container;
    this.elements.sketchContainer = container.querySelector('.sketch-container');
    this.elements.menu = container.querySelector('.gallery-menu');
    this.elements.menuToggle = container.querySelector('.menu-toggle');
    this.elements.sketchGrid = container.querySelector('.sketch-grid');
    this.elements.categoryFilter = container.querySelector('.category-select');
    this.elements.searchInput = container.querySelector('.search-input');
    this.elements.currentSketchInfo = container.querySelector('.info-value');

    // Add styles
    this.addStyles();
  }

  /**
   * Register all available sketches
   */
  registerSketches() {
    const sketches = [
      {
        id: 'character-animation',
        name: 'Character Animation',
        description: 'Interactive character animations with particle effects',
        thumbnail: '/img/thumbnails/character-animation.jpg',
        module: './sketches/CharacterAnimationSketch.js',
        category: 'animation',
        tags: ['character', 'animation', 'particles', 'interactive'],
      },
      {
        id: 'eyeball-theater',
        name: 'Eyeball Theater',
        description: 'Animated SVG eye with Theatre.js integration',
        thumbnail: '/img/thumbnails/eyeball.jpg',
        module: './sketches/EyeballSketch.js',
        category: 'animation',
        tags: ['svg', 'theater', 'animation', '2d'],
      },
      {
        id: 'shader-exploration',
        name: 'Shader Exploration',
        description: 'Custom GLSL shaders and material experiments',
        thumbnail: '/img/thumbnails/shaders.jpg',
        module: './sketches/ShaderSketch.js',
        category: 'shaders',
        tags: ['glsl', 'shaders', 'materials'],
      },
      {
        id: 'particle-flow',
        name: 'Particle Flow',
        description: 'GPU-based particle system with flow fields',
        thumbnail: '/img/thumbnails/particles.jpg',
        module: './sketches/ParticleFlowSketch.js',
        category: 'particles',
        tags: ['particles', 'gpu', 'flow-field'],
      },
      {
        id: 'generative-geometry',
        name: 'Generative Geometry',
        description: 'Procedural geometry generation and manipulation',
        thumbnail: '/img/thumbnails/geometry.jpg',
        module: './sketches/GenerativeGeometrySketch.js',
        category: 'geometry',
        tags: ['procedural', 'geometry', 'generative'],
      },
      {
        id: 'lighting-moods',
        name: 'Lighting Moods',
        description: 'Dynamic lighting scenarios and atmosphere',
        thumbnail: '/img/thumbnails/lighting.jpg',
        module: './sketches/LightingMoodsSketch.js',
        category: 'lighting',
        tags: ['lighting', 'atmosphere', 'mood'],
      },
    ];

    // Register with sketch manager
    this.sketchManager.registerAll(sketches);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Menu toggle
    this.elements.menuToggle.addEventListener('click', () => {
      this.toggleMenu();
    });

    // Category filter
    this.elements.categoryFilter.addEventListener('change', (e) => {
      this.currentCategory = e.target.value;
      this.filterSketches();
    });

    // Search input
    this.elements.searchInput.addEventListener('input', (e) => {
      this.filterSketches(e.target.value);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleMenu();
      }
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        this.elements.searchInput.focus();
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.sketchId) {
        this.loadSketch(e.state.sketchId, false);
      }
    });

    // Sketch manager events
    this.sketchManager.on('loaded', (id, sketch) => {
      this.onSketchLoaded(id, sketch);
    });

    this.sketchManager.on('error', (id, error) => {
      this.showError(`Failed to load sketch: ${id}`);
    });
  }

  /**
   * Populate gallery with sketch cards
   */
  populateGallery() {
    const sketches = this.sketchManager.getAll();
    this.elements.sketchGrid.innerHTML = '';

    sketches.forEach(sketch => {
      const card = this.createSketchCard(sketch);
      this.elements.sketchGrid.appendChild(card);
    });
  }

  /**
   * Create sketch card element
   */
  createSketchCard(sketch) {
    const card = document.createElement('div');
    card.className = 'sketch-card';
    card.dataset.id = sketch.id;
    card.dataset.category = sketch.category;
    card.dataset.tags = sketch.tags.join(',');

    card.innerHTML = `
      <div class="sketch-thumbnail">
        ${sketch.thumbnail
          ? `<img src="${sketch.thumbnail}" alt="${sketch.name}" loading="lazy">`
          : `<div class="thumbnail-placeholder">${sketch.name.charAt(0)}</div>`
        }
      </div>
      <div class="sketch-info">
        <h3 class="sketch-title">${sketch.name}</h3>
        <p class="sketch-description">${sketch.description}</p>
        <div class="sketch-meta">
          <span class="sketch-category">${sketch.category}</span>
          ${sketch.tags.map(tag => `<span class="sketch-tag">#${tag}</span>`).join('')}
        </div>
      </div>
    `;

    // Click handler
    card.addEventListener('click', () => {
      this.loadSketch(sketch.id);
    });

    return card;
  }

  /**
   * Filter sketches based on category and search
   */
  filterSketches(searchTerm = '') {
    const cards = this.elements.sketchGrid.querySelectorAll('.sketch-card');
    const search = searchTerm.toLowerCase();

    cards.forEach(card => {
      const category = card.dataset.category;
      const title = card.querySelector('.sketch-title').textContent.toLowerCase();
      const description = card.querySelector('.sketch-description').textContent.toLowerCase();
      const tags = card.dataset.tags.toLowerCase();

      // Category filter
      const matchesCategory = this.currentCategory === 'all' || category === this.currentCategory;

      // Search filter
      const matchesSearch = !search ||
        title.includes(search) ||
        description.includes(search) ||
        tags.includes(search);

      // Show/hide card
      card.style.display = matchesCategory && matchesSearch ? 'block' : 'none';
    });
  }

  /**
   * Load initial sketch
   */
  async loadInitialSketch() {
    // Check URL for sketch ID
    const urlParams = new URLSearchParams(window.location.search);
    const sketchId = urlParams.get('sketch');

    if (sketchId && this.sketchManager.sketches.has(sketchId)) {
      await this.loadSketch(sketchId, false);
    } else {
      // Load first sketch by default
      const firstSketch = this.sketchManager.getAll()[0];
      if (firstSketch) {
        await this.loadSketch(firstSketch.id, false);
      }
    }
  }

  /**
   * Load a sketch
   */
  async loadSketch(id, updateHistory = true) {
    try {
      // Update UI
      this.setActiveCard(id);

      // Close menu on mobile
      if (window.innerWidth < 768) {
        this.closeMenu();
      }

      // Load sketch
      await this.sketchManager.loadSketch(id);

      // Update URL
      if (updateHistory) {
        const url = new URL(window.location);
        url.searchParams.set('sketch', id);
        window.history.pushState({ sketchId: id }, '', url);
      }

    } catch (error) {
      console.error('Failed to load sketch:', error);
      this.showError(`Failed to load sketch: ${id}`);
    }
  }

  /**
   * Handle sketch loaded
   */
  onSketchLoaded(id, sketch) {
    const sketchConfig = this.sketchManager.sketches.get(id);
    if (sketchConfig) {
      this.elements.currentSketchInfo.textContent = sketchConfig.name;
      document.title = `${sketchConfig.name} - Three.js Sketches`;
    }
  }

  /**
   * Set active card
   */
  setActiveCard(id) {
    const cards = this.elements.sketchGrid.querySelectorAll('.sketch-card');
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.id === id);
    });
  }

  /**
   * Toggle menu
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.elements.container.classList.toggle('menu-open', this.isMenuOpen);
    this.elements.menuToggle.classList.toggle('active', this.isMenuOpen);
  }

  /**
   * Close menu
   */
  closeMenu() {
    this.isMenuOpen = false;
    this.elements.container.classList.remove('menu-open');
    this.elements.menuToggle.classList.remove('active');
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);

    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }

  /**
   * Add gallery styles
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .gallery-container {
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
      }

      .gallery-menu {
        position: fixed;
        left: 0;
        top: 0;
        width: 320px;
        height: 100%;
        background: #1a1a1a;
        color: #fff;
        overflow-y: auto;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 1000;
        display: flex;
        flex-direction: column;
      }

      .menu-open .gallery-menu {
        transform: translateX(0);
      }

      .menu-header {
        padding: 2rem;
        border-bottom: 1px solid #333;
      }

      .menu-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
      }

      .menu-subtitle {
        margin: 0;
        color: #888;
        font-size: 0.9rem;
      }

      .menu-controls {
        padding: 1rem 2rem;
        border-bottom: 1px solid #333;
      }

      .search-input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
        background: #2a2a2a;
        border: 1px solid #444;
        color: #fff;
        border-radius: 4px;
      }

      .category-filter label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #888;
      }

      .category-select {
        width: 100%;
        padding: 0.5rem;
        background: #2a2a2a;
        border: 1px solid #444;
        color: #fff;
        border-radius: 4px;
      }

      .sketch-grid {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
      }

      .sketch-card {
        background: #2a2a2a;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .sketch-card:hover {
        background: #333;
        transform: translateX(4px);
      }

      .sketch-card.active {
        background: #444;
        border-left: 3px solid #4a9eff;
      }

      .sketch-thumbnail {
        width: 100%;
        height: 120px;
        background: #1a1a1a;
        border-radius: 4px;
        margin-bottom: 1rem;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sketch-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumbnail-placeholder {
        font-size: 2rem;
        color: #666;
      }

      .sketch-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
      }

      .sketch-description {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #aaa;
        line-height: 1.4;
      }

      .sketch-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: 0.8rem;
      }

      .sketch-category {
        background: #444;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        color: #4a9eff;
      }

      .sketch-tag {
        color: #666;
      }

      .menu-footer {
        padding: 1rem 2rem;
        border-top: 1px solid #333;
        margin-top: auto;
      }

      .current-sketch-info {
        font-size: 0.9rem;
      }

      .info-label {
        color: #888;
        margin-right: 0.5rem;
      }

      .menu-toggle {
        position: fixed;
        top: 1rem;
        left: 1rem;
        width: 40px;
        height: 40px;
        background: #1a1a1a;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 4px;
        transition: all 0.3s ease;
      }

      .menu-toggle span {
        width: 24px;
        height: 2px;
        background: #fff;
        transition: all 0.3s ease;
      }

      .menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }

      .menu-toggle.active span:nth-child(2) {
        opacity: 0;
      }

      .menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
      }

      .sketch-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .error-message {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #ff4444;
        color: white;
        padding: 1rem 2rem;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2000;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @media (min-width: 768px) {
        .menu-toggle {
          left: 340px;
        }

        .menu-open .menu-toggle {
          left: 340px;
        }

        .gallery-menu {
          transform: translateX(0);
        }

        .sketch-container {
          left: 320px;
          width: calc(100% - 320px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const gallery = new SketchGallery();
    gallery.init();
  });
} else {
  const gallery = new SketchGallery();
  gallery.init();
}
