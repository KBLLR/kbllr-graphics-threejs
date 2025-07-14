/**
 * Sketch Registry
 * Central import/export for all sketches to avoid dynamic import warnings
 */

// Import all sketches
import CharacterSketch from "./CharacterSketch.js";
import EyeballSketch from "./EyeballSketch.js";
import TheatreEyeballSketch from "./TheatreEyeballSketch.js";
import CameraTravellingIntro from "./CameraTravellingIntro.js";

// Export sketch registry
export const sketchRegistry = {
  "character-animation": CharacterSketch,
  "eyeball-theater": EyeballSketch,
  "theatre-eyeball": TheatreEyeballSketch,
  "camera-travelling": CameraTravellingIntro,
  // Add new sketches here as you create them
  // 'shader-exploration': ShaderSketch,
  // 'particle-flow': ParticleFlowSketch,
  // 'generative-geometry': GenerativeGeometrySketch,
  // 'lighting-moods': LightingMoodsSketch,
};

// Export metadata for gallery
export const sketchMetadata = [
  {
    id: "character-animation",
    name: "Character Animation",
    description: "Interactive character animations with particle effects",
    thumbnail: "/img/thumbnails/character-animation.jpg",
    category: "animation",
    tags: ["character", "animation", "particles", "interactive"],
  },
  {
    id: "eyeball-theater",
    name: "Eyeball Theater",
    description: "Animated SVG eye with Theatre.js integration",
    thumbnail: "/img/thumbnails/eyeball.jpg",
    category: "animation",
    tags: ["svg", "theater", "animation", "2d"],
  },
  {
    id: "camera-travelling",
    name: "Camera Travelling",
    description: "Cinematic camera movements with spline curves",
    thumbnail: "/img/thumbnails/camera-travelling.jpg",
    category: "animation",
    tags: ["camera", "curves", "cinematic", "animation"],
  },
  {
    id: "theatre-eyeball",
    name: "Theatre.js Eyeball",
    description:
      "SVG eye animation powered by Theatre.js with interactive controls",
    thumbnail: "/img/thumbnails/theatre-eyeball.jpg",
    category: "animation",
    tags: ["svg", "theatre", "animation", "interactive"],
  },
  // Future sketches (commented out until implemented)
  /*
  {
    id: 'shader-exploration',
    name: 'Shader Exploration',
    description: 'Custom GLSL shaders and material experiments',
    thumbnail: '/img/thumbnails/shaders.jpg',
    category: 'shaders',
    tags: ['glsl', 'shaders', 'materials'],
  },
  {
    id: 'particle-flow',
    name: 'Particle Flow',
    description: 'GPU-based particle system with flow fields',
    thumbnail: '/img/thumbnails/particles.jpg',
    category: 'particles',
    tags: ['particles', 'gpu', 'flow-field'],
  },
  {
    id: 'generative-geometry',
    name: 'Generative Geometry',
    description: 'Procedural geometry generation and manipulation',
    thumbnail: '/img/thumbnails/geometry.jpg',
    category: 'geometry',
    tags: ['procedural', 'geometry', 'generative'],
  },
  {
    id: 'lighting-moods',
    name: 'Lighting Moods',
    description: 'Dynamic lighting scenarios and atmosphere',
    thumbnail: '/img/thumbnails/lighting.jpg',
    category: 'lighting',
    tags: ['lighting', 'atmosphere', 'mood'],
  },
  */
];

// Helper function to get sketch class by ID
export function getSketchClass(id) {
  return sketchRegistry[id];
}

// Helper function to get all available sketch IDs
export function getAvailableSketchIds() {
  return Object.keys(sketchRegistry);
}
