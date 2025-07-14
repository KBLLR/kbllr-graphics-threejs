# Three.js Graphics Experiments

A collection of Three.js sketches where I explore scenery and character animations as part of my beginning experiments with the Three.js library.

## Overview

This project is a creative playground for experimenting with:
- 3D character animations and rigging
- Environment mapping and lighting
- Interactive scene controls
- Material systems and shaders
- Particle effects and visual atmospherics

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kbllr-graphics-threejs.git
cd kbllr-graphics-threejs
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create an optimized production build:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Project Dynamics

### Architecture

The project follows a modular architecture with clear separation of concerns:

- **Systems**: Core functionality managers (Materials, Lighting, Particles, CubeMap loading)
- **Components**: Reusable UI and scene components
- **Materials**: Custom material definitions with texture support
- **Utils**: Helper functions and utilities

### Key Features

#### Scene Management
- Dynamic environment switching with optimized cubemap loading
- Fog and atmosphere controls
- Grid helpers for spatial reference

#### Material System
- Custom material presets (Terrazzo, Spotty Metal, etc.)
- Real-time material property editing
- Texture management with caching

#### Character Animation
- GLB model loading with animation support
- Multiple animation states (idle, walking, running)
- Smooth animation transitions
- Interactive character controls

#### Lighting
- Three-point lighting setup
- Dynamic shadow mapping
- Environment-based lighting
- Real-time lighting adjustments

#### Particle System
- GPU-accelerated particle rendering
- Customizable particle behaviors
- Performance-optimized for thousands of particles

#### Interactive Controls
- Orbit camera controls
- Transform controls for object manipulation
- Tweakpane UI for real-time parameter adjustments
- Keyboard shortcuts for common actions

### Performance Optimizations

- Texture caching and lazy loading
- Efficient memory management
- Request idle callback for non-critical loads
- Optimized render loop with stats monitoring

## Controls

### Mouse/Touch
- **Left Click + Drag**: Rotate camera
- **Right Click + Drag**: Pan camera
- **Scroll/Pinch**: Zoom in/out

### Keyboard
- **G**: Translate mode
- **R**: Rotate mode
- **T**: Scale mode
- **P**: Toggle performance monitor

## Tech Stack

- **Three.js r177**: 3D graphics library
- **Vite 6**: Build tool and dev server
- **GSAP**: Animation library
- **Tweakpane**: GUI controls
- **Vanilla JavaScript**: No framework dependencies

## Structure

```
kbllr-graphics-threejs/
├── public/              # Static assets
│   ├── img/            # Textures and cubemaps
│   ├── gltf/           # 3D models
│   └── models/         # Additional 3D assets
├── src/
│   ├── components/     # UI and scene components
│   ├── systems/        # Core system managers
│   ├── materials/      # Material definitions
│   ├── utils/          # Helper functions
│   ├── App.js          # Main application class
│   ├── main.js         # Entry point
│   └── style.css       # Global styles
└── index.html          # HTML entry
```

## Future Explorations

- Post-processing effects
- Physics integration
- Advanced shaders and materials
- Procedural geometry generation
- Audio-reactive visuals

## License

ISC License

## Author

David Caballero - Exploring the intersection of code and creativity with Three.js

---

*This project is a continuous learning journey into 3D graphics and interactive experiences.*