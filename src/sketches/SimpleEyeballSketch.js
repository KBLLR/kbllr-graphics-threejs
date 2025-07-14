import { Sketch } from "@core/Sketch.js";
import * as THREE from "three";

/**
 * Simple Eyeball Sketch
 * Interactive SVG eye animation with particle background
 */
export default class SimpleEyeballSketch extends Sketch {
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
    this.isBlinking = false;
    this.mousePosition = new THREE.Vector2();

    // DOM elements
    this.eyeContainer = null;
    this.eyeBody = null;
    this.eyeElement = null;
    this.eyeSvg = null;
  }

  /**
   * Setup the sketch
   */
  async setup() {
    // Set orthographic camera for 2D view
    this.setupOrthographicCamera();

    // Set background
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Create eye container with SVG
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
    this.eyeContainer.className = "god__container";
    this.eyeContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      z-index: 10;
      pointer-events: auto;
    `;

    // Create inner div for the glowing eye body
    this.eyeBody = document.createElement("div");
    this.eyeBody.className = "god__body";
    this.eyeBody.style.cssText = `
      width: 368px;
      height: 380px;
      border-radius: 100%;
      background: hsla(227, 100%, 82%, 0.8);
      background-blend-mode: multiply;
      box-shadow:
        inset -2.5vmin -2.5vmin 9.5vmin hsla(0, 0%, 100%, 0.8),
        inset 0 5vmin 25vmin hsla(179.5, 18.75%, 50%, 0.8),
        inset 10vmin 5vmin 25vmin hsla(58, 100%, 50%, 1),
        inset 10vmin -5vmin 25vmin hsla(356, 100%, 50%, 1),
        inset -5vmin -20vmin 25vmin hsla(299, 63%, 72%, 1);
      animation: 6s linear infinite normal both hueShift;
      position: relative;
    `;

    // Create eye container
    this.eyeElement = document.createElement("div");
    this.eyeElement.className = "god__eye";
    this.eyeElement.style.cssText = `
      position: relative;
      padding: 4px;
      max-width: 40%;
    `;

    // Add the SVG
    this.eyeElement.innerHTML = `
      <svg id="eye-long" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
        <defs>
          <radialGradient id="eye-long-iris-fill" cx="0" cy="0" r="23.174" spreadMethod="pad" gradientUnits="userSpaceOnUse" gradientTransform="matrix(.85711 -.51513 .50334 .83749 7.137 -4.684)">
            <stop id="eye-long-iris-fill-0" offset="0%" stop-color="#f8f7f7"/>
            <stop id="eye-long-iris-fill-1" offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
          <linearGradient id="eye-long-path1-fill" x1="52.655" y1="38" x2="52.655" y2="64" spreadMethod="pad" gradientUnits="userSpaceOnUse">
            <stop id="eye-long-path1-fill-0" offset="16.667%" stop-color="#fff"/>
            <stop id="eye-long-path1-fill-1" offset="49.479%" stop-color="#d2d2d2"/>
            <stop id="eye-long-path1-fill-2" offset="73.438%" stop-color="#000"/>
            <stop id="eye-long-path1-fill-3" offset="92.708%" stop-color="#e4e4e4"/>
          </linearGradient>
          <filter id="eye-long-hl-filter" x="-400%" width="600%" y="-400%" height="600%">
            <feGaussianBlur id="eye-long-hl-filter-blur-0" stdDeviation="1,1" result="result"/>
          </filter>
        </defs>
        <g id="eye-long-type-redeye-state-true" transform="translate(.261 -.25)">
          <g id="eye-long-g1" clip-path="url(#eye-long-clip0)">
            <g id="eye-long-g2" mask="url(#eye-long-mask0)">
              <rect id="eye-long-rect1" width="98.134" height="32.134" rx="16.067" ry="16.067" transform="matrix(.99742 0 0 3.21651 3.714 -.1)" fill="#fff" stroke-miterlimit="1"/>
              <g id="eye-long-center" transform="translate(-.5 -1.541)" stroke-miterlimit="1">
                <rect id="eye-long-rect2" width="56" height="56" rx="28" ry="28" transform="matrix(1.12156 0 0 1.12 20.835 21.761)" opacity=".64" fill="#828782"/>
                <circle id="eye-long-iris" r="12.803" transform="matrix(1.10921 0 0 1.10921 52.31 53.791)" fill="url(#eye-long-iris-fill)"/>
                <path id="eye-long-hl" d="M45.31 45.147c-1.248 0-2.256 1.007-2.256 2.256s1.007 2.256 2.256 2.256 2.256-1.008 2.256-2.256-1.007-2.256-2.256-2.256Z" transform="matrix(2.14745 0 0 2.14745 -40.146 -52.849)" clip-rule="evenodd" filter="url(#eye-long-hl-filter)" fill="#fff" fill-opacity=".8" fill-rule="evenodd"/>
              </g>
              <mask id="eye-long-mask0" mask-type="alpha">
                <g id="eye-long-group">
                  <path id="eye-long-path1" d="M52.655 38c-20.682 0-38.344 5.39-45.5 13 7.156 7.61 24.818 13 45.5 13s38.344-5.39 45.5-13c-7.156-7.61-24.818-13-45.5-13Z" transform="matrix(1.00508 0 0 -2.41206 -1.04 174.05)" clip-rule="evenodd" fill="url(#eye-long-path1-fill)" fill-rule="evenodd" stroke="#fff" stroke-width="4.813" stroke-opacity=".9" stroke-linejoin="round" stroke-miterlimit="1"/>
                </g>
              </mask>
            </g>
            <clipPath id="eye-long-clip0">
              <path id="eye-long-path2" d="M0 52C0 23.281 23.281 0 52 0s52 23.281 52 52-23.281 52-52 52S0 80.719 0 52Z" fill="#fff" stroke-miterlimit="1"/>
            </clipPath>
          </g>
        </g>
      </svg>
    `;

    // Add keyframes for the hue-shift animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hueShift {
        100% {
          filter: hue-rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);

    // Append elements to DOM
    this.eyeBody.appendChild(this.eyeElement);
    this.eyeContainer.appendChild(this.eyeBody);
    this.container.appendChild(this.eyeContainer);

    // Store references
    this.eyeSvg = this.eyeElement.querySelector('svg');

    // Add click listener
    this.eyeContainer.addEventListener('click', () => {
      this.blink();
    });
  }

  /**
   * Create 3D background elements
   */
  create3DBackground() {
    // Add floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 150;
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

      // Update eye look direction if mouse tracking is enabled
      if (this.eyeState.lookAtMouse) {
        this.updateEyeLookAt(this.mousePosition.x, this.mousePosition.y);
      }
    });
  }

  /**
   * Update eye to look at position
   */
  updateEyeLookAt(x, y) {
    const pupil = this.eyeSvg.querySelector('#eye-long-center');
    const iris = this.eyeSvg.querySelector('#eye-long-iris');
    const highlight = this.eyeSvg.querySelector('#eye-long-hl');

    if (!pupil || !iris) return;

    // Limit movement range
    const maxOffset = 10;
    const offsetX = THREE.MathUtils.clamp(x * maxOffset, -maxOffset, maxOffset);
    const offsetY = THREE.MathUtils.clamp(y * maxOffset, -maxOffset, maxOffset);

    // Update pupil position
    const transform = pupil.getAttribute("transform") || "";
    const newTransform = transform.replace(
      /translate\([^)]+\)/,
      `translate(${offsetX}, ${offsetY})`
    );
    pupil.setAttribute("transform", newTransform);
  }

  /**
   * Blink animation
   */
  blink() {
    if (this.isBlinking) return;
    this.isBlinking = true;

    const topLid = this.eyeSvg.querySelector("#eye-long-path1");
    if (!topLid) {
      this.isBlinking = false;
      return;
    }

    // Close eye (mostly closed)
    const closedScale = `matrix(1.00508, 0, 0, ${-2.41206 * 0.1}, -1.04, 174.05)`;
    topLid.setAttribute("transform", closedScale);

    // Open eye after a delay
    setTimeout(() => {
      topLid.setAttribute(
        "transform",
        "matrix(1.00508, 0, 0, -2.41206, -1.04, 174.05)"
      );

      setTimeout(() => {
        this.isBlinking = false;
      }, 100);
    }, 200);
  }

  /**
   * Update the light color
   */
  updateLightColor(color) {
    if (!this.eyeBody) return;

    switch (color) {
      case "red":
        this.eyeBody.style.boxShadow = `
          inset -2.5vmin -2.5vmin 9.5vmin hsla(0, 0%, 100%, 0.8),
          inset 0 5vmin 25vmin hsla(0, 75%, 50%, 0.8),
          inset 10vmin 5vmin 25vmin hsla(0, 100%, 50%, 1),
          inset 10vmin -5vmin 25vmin hsla(0, 100%, 50%, 1),
          inset -5vmin -20vmin 25vmin hsla(0, 63%, 72%, 1)
        `;
        break;
      case "yellow":
        this.eyeBody.style.boxShadow = `
          inset -2.5vmin -2.5vmin 9.5vmin hsla(0, 0%, 100%, 0.8),
          inset 0 5vmin 25vmin hsla(60, 75%, 50%, 0.8),
          inset 10vmin 5vmin 25vmin hsla(60, 100%, 50%, 1),
          inset 10vmin -5vmin 25vmin hsla(60, 100%, 50%, 1),
          inset -5vmin -20vmin 25vmin hsla(60, 63%, 72%, 1)
        `;
        break;
      default: // green
        this.eyeBody.style.boxShadow = `
          inset -2.5vmin -2.5vmin 9.5vmin hsla(0, 0%, 100%, 0.8),
          inset 0 5vmin 25vmin hsla(120, 75%, 50%, 0.8),
          inset 10vmin 5vmin 25vmin hsla(120, 100%, 50%, 1),
          inset 10vmin -5vmin 25vmin hsla(120, 100%, 50%, 1),
          inset -5vmin -20vmin 25vmin hsla(120, 63%, 72%, 1)
        `;
        break;
    }
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

    // Auto-animate if enabled
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

    // Update eye position and scale
    if (this.eyeContainer) {
      this.eyeContainer.style.transform = `translate(-50%, -50%) translate(${this.eyeState.position.x}px, ${this.eyeState.position.y}px)`;
    }

    if (this.eyeElement) {
      this.eyeElement.style.transform = `scaleX(${this.eyeState.scale.x}) scaleY(${this.eyeState.scale.y})`;
    }
  }

  /**
   * Play animation sequence
   */
  playSequence(name) {
    switch (name) {
      case "suspicious":
        // Suspicious look - half-closed eye
        const oldScaleY = this.eyeState.scale.y;
        this.eyeState.scale.y = 0.5;

        setTimeout(() => {
          this.eyeState.scale.y = oldScaleY;
        }, 1000);
        break;

      case "surprised":
        // Surprised look - wide open eye
        const oldScaleX = this.eyeState.scale.x;
        const oldScaleY2 = this.eyeState.scale.y;

        this.eyeState.scale.x = 1.5;
        this.eyeState.scale.y = 1.5;

        // Make pupil smaller
        const iris = this.eyeSvg.querySelector("#eye-long-iris");
        if (iris) {
          iris.setAttribute("r", "8");
        }

        // Return to normal after delay
        setTimeout(() => {
          this.eyeState.scale.x = oldScaleX;
          this.eyeState.scale.y = oldScaleY2;

          // Reset pupil size
          if (iris) {
            iris.setAttribute("r", "12.803");
          }
        }, 800);
        break;

      case "sleepy":
        // Multiple blinks and then half-closed
        this.blink();
        setTimeout(() => {
          this.blink();
          setTimeout(() => {
            this.blink();
            setTimeout(() => {
              const oldScale = this.eyeState.scale.y;
              this.eyeState.scale.y = 0.3;

              setTimeout(() => {
                this.eyeState.scale.y = oldScale;
              }, 2000);
            }, 500);
          }, 500);
        }, 500);
        break;
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

    // Color selector
    const colorOptions = {
      Green: "green",
      Red: "red",
      Yellow: "yellow",
    };

    behaviorFolder
      .addBlade({
        view: "list",
        label: "Light Color",
        options: Object.entries(colorOptions).map(([text, value]) => ({
          text,
          value,
        })),
        value: this.eyeState.lightColor,
      })
      .on("change", (ev) => {
        this.eyeState.lightColor = ev.value;
        this.updateLightColor(ev.value);
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
    this.eyeBody = null;
    this.eyeElement = null;
    this.eyeSvg = null;
    this.particles = null;
  }
}
