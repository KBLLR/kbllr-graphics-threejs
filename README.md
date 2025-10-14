# Three.js Sketch Gallery

A curated collection of Three.js sketches and experiments. This project serves as a personal playground and a showcase for exploring various 3D graphics techniques, from character animation and environment design to custom shaders and particle systems.

## Overview

This repository is structured as a dynamic gallery that allows you to browse and interact with different Three.js scenes, each encapsulated as a "sketch." The main application handles the loading, switching, and UI for selecting these sketches, making it easy to develop and display new ideas in isolation.

## Features

- **Dynamic Sketch Loading**: A `SketchManager` dynamically loads and unloads sketches, allowing for seamless transitions between different 3D scenes.
- **Component-Based Architecture**: Core functionalities like lighting, materials, and particles are managed by reusable systems.
- **Interactive UI**: A filterable and searchable side menu allows for easy navigation of all available sketches.
- **Direct Sketch Linking**: Load any sketch directly via a URL parameter (e.g., `?sketch=camera-travelling-intro`).
- **Real-time Controls**: Most sketches integrate with Tweakpane or Theatre.js Studio for live manipulation of scene parameters.
- **Comprehensive Documentation**: The entire codebase is documented using JSDoc, providing clear explanations and guidance for developers.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/kbllr-graphics-threejs.git
    cd kbllr-graphics-threejs
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser** and navigate to `http://localhost:3000`.

## Usage

The application opens into a gallery view.

- **Browse Sketches**: Use the side menu (toggle with the button in the top-left or `Esc` key) to browse, search, and filter available sketches.
- **Load a Sketch**: Click on any sketch card to load it into the main view.
- **Interact with the Scene**: Once a sketch is loaded, you can interact with it using your mouse. Most sketches use standard orbit controls (Left-click + drag to rotate, right-click + drag to pan, scroll to zoom).
- **Tweak Parameters**: Many sketches feature a control panel (Tweakpane) for adjusting properties in real-time. For the Theatre.js sketch, press `Alt+\` to toggle the studio interface.

## Project Structure

The project follows a modular architecture designed for clarity and scalability.

```
kbllr-graphics-threejs/
├── public/              # Static assets (models, textures)
├── src/
│   ├── components/     # Reusable components (e.g., LightingUI)
│   ├── core/           # Core application classes (Sketch, SketchManager)
│   ├── debug/          # Debugging tools (e.g., PerformanceMonitor)
│   ├── sketches/       # All individual sketch implementations
│   ├── systems/        # Scene-wide systems (Lighting, Particles, etc.)
│   ├── utils/          # Helper functions and utilities
│   ├── App.js          # Main application class (legacy, for reference)
│   ├── gallery.js      # Main entry point for the gallery
│   └── main.js         # Main application entry point
└── index.html          # HTML entry point
```

### Core Concepts

-   **`Sketch` (`src/core/Sketch.js`)**: The abstract base class that all sketches extend. It provides the foundational setup for a Three.js scene, renderer, camera, and animation loop.
-   **`SketchManager` (`src/core/SketchManager.js`)**: The engine that handles the lifecycle of all sketches—registering, loading, and disposing of them as the user navigates the gallery.
-   **Sketch Registry (`src/sketches/index.js`)**: A central file where all new sketches must be registered to appear in the gallery.

## Adding a New Sketch

To add your own sketch to the gallery, follow these steps:

1.  **Create the Sketch File**: Create a new JavaScript file in `src/sketches/`. Your class should extend the base `Sketch` class.
    ```javascript
    // src/sketches/MyNewSketch.js
    import { Sketch } from '@core/Sketch.js';
    import * as THREE from 'three';

    export default class MyNewSketch extends Sketch {
      async setup() {
        // Your setup code here
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshNormalMaterial();
        this.myCube = new THREE.Mesh(geometry, material);
        this.scene.add(this.myCube);
      }

      update(deltaTime) {
        // Your animation code here
        this.myCube.rotation.y += deltaTime;
      }
    }
    ```

2.  **Register the Sketch**: Open `src/sketches/index.js` and add your new sketch to the `sketchRegistry` and `sketchMetadata` exports.
    ```javascript
    // src/sketches/index.js
    import MyNewSketch from './MyNewSketch.js';
    // ... other imports

    export const sketchRegistry = {
      // ... other sketches
      'my-new-sketch': MyNewSketch,
    };

    export const sketchMetadata = [
      // ... other metadata
      {
        id: 'my-new-sketch',
        name: 'My New Sketch',
        description: 'A brief description of my new experiment.',
        category: 'geometry',
        tags: ['cube', 'animation'],
      },
    ];
    ```
Your new sketch will now appear in the gallery.

## Tech Stack

-   **Three.js (r177)**: The core 3D graphics library.
-   **Vite**: A modern, fast build tool and development server.
-   **GSAP**: Used for some animations and camera movements.
-   **Tweakpane**: A library for creating compact, interactive GUI panels.
-   **Theatre.js**: A professional motion design library used in one of the sketches.
-   **Vanilla JavaScript**: No frontend frameworks are used, keeping the focus on Three.js.

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Author

David Caballero - Exploring the intersection of code and creativity with Three.js.

---

*This project is a continuous learning journey into 3D graphics and interactive experiences.*