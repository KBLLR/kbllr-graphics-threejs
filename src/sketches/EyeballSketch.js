import { Sketch } from "@core/Sketch.js";
import * as THREE from "three";

/**
 * Eyeball Sketch
 * Interactive SVG eye animation with Three.js integration
 * Based on the original Theatre.js animated eye
 */
export default class EyeballSketch extends Sketch {
  constructor(options = {}) {
    super({
      ...options,
      showControls: false, // Disable orbit controls for this 2D sketch
      enableTweakpane: true,
    });

    // Eye state
    this.eyeState = {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      blinkSpeed: 1,
      lookAtMouse: true,
      autoAnimate: false,
      lightColor: "green",
    };

    // Animation properties
    this.animationSequence = null;
    this.isPlaying = false;
    this.mousePosition = new THREE.Vector2();

    // DOM elements
    this.eyeContainer = null;
    this.eyeElement = null;
  }

  /**
   * Setup the sketch
   */
  async setup() {
    // Set orthographic camera for 2D view
    this.setupOrthographicCamera();

    // Set background
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Create eye container
    this.createEyeElement();

    // Add subtle 3D elements
    this.create3DBackground();

    // Setup mouse tracking
    this.setupMouseTracking();
  }

  /**
   * Setup orthographic camera
   */
  setupOrthographicCamera() {
    const aspect = this.width / this.height;
    const frustumSize = 10;

    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100,
    );

    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Create the eye SVG element
   */
  createEyeElement() {
    // Create container div
    this.eyeContainer = document.createElement("div");
    this.eyeContainer.className = "eye-container";
    this.eyeContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      z-index: 10;
      pointer-events: auto;
    `;

    // Create SVG element (simplified version of the original)
    this.eyeContainer.innerHTML = `
      <svg id="eye-svg" viewBox="0 0 104 104" style="width: 100%; height: 100%;">
        <defs>
          <radialGradient id="iris-gradient" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#f8f7f7"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Eye white -->
        <ellipse cx="52" cy="52" rx="45" ry="25" fill="white" opacity="0.9"/>

        <!-- Iris -->
        <circle cx="52" cy="52" r="20" fill="#828782" opacity="0.8"/>
        <circle cx="52" cy="52" r="15" fill="url(#iris-gradient)" opacity="0.9"/>

        <!-- Pupil -->
        <circle cx="52" cy="52" r="8" fill="black"/>

        <!-- Highlight -->
        <circle cx="45" cy="45" r="4" fill="white" opacity="0.8" filter="url(#glow)"/>

        <!-- Eyelids (for blinking) -->
        <path id="top-lid" d="M 7 52 Q 52 20 97 52" fill="#0a0a0a" opacity="0"/>
        <path id="bottom-lid" d="M 7 52 Q 52 84 97 52" fill="#0a0a0a" opacity="0"/>
      </svg>
    `;

    this.container.appendChild(this.eyeContainer);
    this.eyeElement = this.eyeContainer.querySelector("#eye-svg");

    // Add click handler
    this.eyeElement.addEventListener("click", () => {
      this.blink();
    });
  }

  /**
   * Create 3D background elements
   */
  create3DBackground() {
    // Add floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 100;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 10 - 5;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
  }

  /**
   * Setup mouse tracking
   */
  setupMouseTracking() {
    this.container.addEventListener("mousemove", (event) => {
      const rect = this.container.getBoundingClientRect();
      this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePosition.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });
  }

  /**
   * Blink animation
   */
  blink() {
    if (this.isBlinking) return;
    this.isBlinking = true;

    const topLid = this.eyeElement.querySelector("#top-lid");
    const bottomLid = this.eyeElement.querySelector("#bottom-lid");

    // Close eye
    topLid.style.transition = `opacity ${100 / this.eyeState.blinkSpeed}ms ease-in`;
    bottomLid.style.transition = `opacity ${100 / this.eyeState.blinkSpeed}ms ease-in`;
    topLid.style.opacity = "1";
    bottomLid.style.opacity = "1";

    // Open eye
    setTimeout(() => {
      topLid.style.transition = `opacity ${100 / this.eyeState.blinkSpeed}ms ease-out`;
      bottomLid.style.transition = `opacity ${100 / this.eyeState.blinkSpeed}ms ease-out`;
      topLid.style.opacity = "0";
      bottomLid.style.opacity = "0";

      setTimeout(() => {
        this.isBlinking = false;
      }, 100 / this.eyeState.blinkSpeed);
    }, 150 / this.eyeState.blinkSpeed);
  }

  /**
   * Update eye to look at position
   */
  updateEyeLookAt(x, y) {
    const iris = this.eyeElement.querySelector('circle[r="20"]');
    const pupil = this.eyeElement.querySelector('circle[r="8"]');
    const highlight = this.eyeElement.querySelector('circle[r="4"]');

    // Limit movement range
    const maxOffset = 10;
    const offsetX = THREE.MathUtils.clamp(x * maxOffset, -maxOffset, maxOffset);
    const offsetY = THREE.MathUtils.clamp(y * maxOffset, -maxOffset, maxOffset);

    // Apply movement
    iris.setAttribute("cx", 52 + offsetX);
    iris.setAttribute("cy", 52 + offsetY);
    pupil.setAttribute("cx", 52 + offsetX);
    pupil.setAttribute("cy", 52 + offsetY);
    highlight.setAttribute("cx", 45 + offsetX * 0.7);
    highlight.setAttribute("cy", 45 + offsetY * 0.7);
  }

  /**
   * Update method
   */
  update(deltaTime, elapsedTime) {
    // Update particles
    if (this.particles) {
      this.particles.rotation.y += deltaTime * 0.1;
      this.particles.rotation.x += deltaTime * 0.05;
    }

    // Eye follows mouse
    if (this.eyeState.lookAtMouse) {
      this.updateEyeLookAt(this.mousePosition.x, this.mousePosition.y);
    }

    // Auto-animate
    if (this.eyeState.autoAnimate) {
      const time = elapsedTime * 0.5;
      const x = Math.sin(time) * 0.5;
      const y = Math.cos(time * 0.7) * 0.3;
      this.updateEyeLookAt(x, y);

      // Occasional blink
      if (Math.random() < 0.005) {
        this.blink();
      }
    }

    // Update eye container transform
    if (this.eyeContainer) {
      this.eyeContainer.style.transform = `translate(-50%, -50%) translate(${this.eyeState.position.x}px, ${this.eyeState.position.y}px) scaleX(${this.eyeState.scale.x}) scaleY(${this.eyeState.scale.y})`;
    }
  }

  /**
   * Setup GUI
   */
  setupGUI(pane) {
    // Eye Controls
    const eyeFolder = pane.addFolder({
      title: "Eye Controls",
      expanded: true,
    });

    // Position
    eyeFolder.addBinding(this.eyeState.position, "x", {
      label: "Position X",
      min: -100,
      max: 100,
      step: 1,
    });

    eyeFolder.addBinding(this.eyeState.position, "y", {
      label: "Position Y",
      min: -100,
      max: 100,
      step: 1,
    });

    // Scale
    eyeFolder.addBinding(this.eyeState.scale, "x", {
      label: "Scale X",
      min: 0.5,
      max: 2,
      step: 0.01,
    });

    eyeFolder.addBinding(this.eyeState.scale, "y", {
      label: "Scale Y",
      min: 0.5,
      max: 2,
      step: 0.01,
    });

    // Behavior
    const behaviorFolder = pane.addFolder({
      title: "Behavior",
      expanded: true,
    });

    behaviorFolder.addBinding(this.eyeState, "lookAtMouse", {
      label: "Follow Mouse",
    });

    behaviorFolder.addBinding(this.eyeState, "autoAnimate", {
      label: "Auto Animate",
    });

    behaviorFolder.addBinding(this.eyeState, "blinkSpeed", {
      label: "Blink Speed",
      min: 0.5,
      max: 2,
      step: 0.1,
    });

    // Actions
    behaviorFolder
      .addButton({
        title: "Blink",
      })
      .on("click", () => {
        this.blink();
      });

    behaviorFolder
      .addButton({
        title: "Random Look",
      })
      .on("click", () => {
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        this.updateEyeLookAt(x, y);
      });

    // Animation sequences
    const animFolder = pane.addFolder({
      title: "Animations",
      expanded: false,
    });

    animFolder
      .addButton({
        title: "Suspicious Look",
      })
      .on("click", () => {
        this.playSequence("suspicious");
      });

    animFolder
      .addButton({
        title: "Surprised",
      })
      .on("click", () => {
        this.playSequence("surprised");
      });

    animFolder
      .addButton({
        title: "Sleepy",
      })
      .on("click", () => {
        this.playSequence("sleepy");
      });
  }

  /**
   * Play animation sequence
   */
  playSequence(name) {
    switch (name) {
      case "suspicious":
        this.eyeState.scale.y = 0.5;
        setTimeout(() => {
          this.eyeState.scale.y = 1;
        }, 1000);
        break;

      case "surprised":
        this.eyeState.scale.x = 1.5;
        this.eyeState.scale.y = 1.5;
        setTimeout(() => {
          this.eyeState.scale.x = 1;
          this.eyeState.scale.y = 1;
        }, 800);
        break;

      case "sleepy":
        let blinkCount = 0;
        const sleepyBlink = setInterval(() => {
          this.blink();
          blinkCount++;
          if (blinkCount >= 3) {
            clearInterval(sleepyBlink);
            this.eyeState.scale.y = 0.3;
            setTimeout(() => {
              this.eyeState.scale.y = 1;
            }, 2000);
          }
        }, 500);
        break;
    }
  }

  /**
   * Handle resize
   */
  onResize(width, height) {
    // Update orthographic camera
    const aspect = width / height;
    const frustumSize = 10;

    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;

    this.camera.updateProjectionMatrix();
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Remove DOM elements
    if (this.eyeContainer) {
      this.eyeContainer.remove();
    }

    // Clear references
    this.eyeContainer = null;
    this.eyeElement = null;
    this.particles = null;
  }
}
