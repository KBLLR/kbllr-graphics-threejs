import * as THREE from "three";

/**
 * Modern particle system with lifecycle management
 * Features: color variation, lifespan, floating motion, performance optimized
 */
export class ParticleSystem {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      particleCount: 500,
      particleSize: 0.1,
      particleSizeVariation: 0.05,
      colors: [
        new THREE.Color(0xff6b6b), // Coral red
        new THREE.Color(0x4ecdc4), // Teal
        new THREE.Color(0xffe66d), // Yellow
        new THREE.Color(0xa8e6cf), // Mint
        new THREE.Color(0xc7ceea), // Lavender
      ],
      lifespan: 8.0, // seconds
      lifespanVariation: 2.0,
      emissionRate: 0.5, // particles per second
      boundingBox: new THREE.Box3(
        new THREE.Vector3(-10, -2, -10),
        new THREE.Vector3(10, 8, 10),
      ),
      velocityRange: {
        min: new THREE.Vector3(-0.5, 0.1, -0.5),
        max: new THREE.Vector3(0.5, 0.8, 0.5),
      },
      gravity: -0.05,
      wind: new THREE.Vector3(0.1, 0, 0.05),
      turbulence: 0.3,
      fadeInTime: 0.5,
      fadeOutTime: 1.0,
      ...options,
    };

    // State management
    this.particles = [];
    this.deadParticleIndices = [];
    this.time = 0;
    this.emissionAccumulator = 0;

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.textureLoader = new THREE.TextureLoader();

    this._init();
  }

  _init() {
    // Create geometry with maximum particle capacity
    const positions = new Float32Array(this.config.particleCount * 3);
    const colors = new Float32Array(this.config.particleCount * 3);
    const sizes = new Float32Array(this.config.particleCount);
    const alphas = new Float32Array(this.config.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    // Create shader material for advanced rendering
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;

        varying float vAlpha;
        varying vec3 vColor;

        uniform float pixelRatio;

        void main() {
          vAlpha = alpha;
          vColor = color;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          vec2 uv = gl_PointCoord;

          // Simple circular particle
          float dist = length(uv - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = 1.0 - (dist * 2.0);
          alpha = alpha * alpha;

          gl_FragColor = vec4(vColor, alpha * vAlpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;

    // Initialize particles
    this._initializeParticles();
  }

  _initializeParticles() {
    for (let i = 0; i < this.config.particleCount; i++) {
      this.deadParticleIndices.push(i);
      this._resetParticle(i, true);
    }
  }

  _resetParticle(index, hideInitially = false) {
    if (!this.particles[index]) {
      this.particles[index] = {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 0,
        size: 0,
        active: false,
      };
    }

    const particle = this.particles[index];

    if (hideInitially) {
      particle.active = false;
      particle.position.set(0, -1000, 0);
    } else {
      particle.active = true;

      // Random position within bounding box
      particle.position.set(
        THREE.MathUtils.randFloat(
          this.config.boundingBox.min.x,
          this.config.boundingBox.max.x,
        ),
        THREE.MathUtils.randFloat(
          this.config.boundingBox.min.y,
          this.config.boundingBox.max.y,
        ),
        THREE.MathUtils.randFloat(
          this.config.boundingBox.min.z,
          this.config.boundingBox.max.z,
        ),
      );

      // Random velocity
      particle.velocity.set(
        THREE.MathUtils.randFloat(
          this.config.velocityRange.min.x,
          this.config.velocityRange.max.x,
        ),
        THREE.MathUtils.randFloat(
          this.config.velocityRange.min.y,
          this.config.velocityRange.max.y,
        ),
        THREE.MathUtils.randFloat(
          this.config.velocityRange.min.z,
          this.config.velocityRange.max.z,
        ),
      );

      // Random color from palette
      const colorIndex = Math.floor(Math.random() * this.config.colors.length);
      particle.color.copy(this.config.colors[colorIndex]);

      // Random lifespan
      particle.maxLife =
        this.config.lifespan +
        THREE.MathUtils.randFloat(
          -this.config.lifespanVariation,
          this.config.lifespanVariation,
        );
      particle.life = 0;

      // Random size
      particle.size =
        this.config.particleSize +
        THREE.MathUtils.randFloat(
          -this.config.particleSizeVariation,
          this.config.particleSizeVariation,
        );
    }

    this._updateParticleAttributes(index);
  }

  _updateParticleAttributes(index) {
    const particle = this.particles[index];
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    const sizes = this.geometry.attributes.size.array;
    const alphas = this.geometry.attributes.alpha.array;

    // Update position
    positions[index * 3] = particle.position.x;
    positions[index * 3 + 1] = particle.position.y;
    positions[index * 3 + 2] = particle.position.z;

    // Update color
    colors[index * 3] = particle.color.r;
    colors[index * 3 + 1] = particle.color.g;
    colors[index * 3 + 2] = particle.color.b;

    // Update size
    sizes[index] = particle.size * 100;

    // Calculate alpha based on life
    let alpha = 1.0;
    if (particle.active) {
      const lifeRatio = particle.life / particle.maxLife;

      // Fade in
      if (particle.life < this.config.fadeInTime) {
        alpha = particle.life / this.config.fadeInTime;
      }
      // Fade out
      else if (particle.life > particle.maxLife - this.config.fadeOutTime) {
        alpha = (particle.maxLife - particle.life) / this.config.fadeOutTime;
      }
    } else {
      alpha = 0;
    }

    alphas[index] = alpha;
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.material.uniforms.time.value = this.time;

    // Emission
    this.emissionAccumulator += deltaTime;
    const particlesToEmit = Math.floor(
      this.emissionAccumulator * this.config.emissionRate,
    );
    if (particlesToEmit > 0) {
      this.emissionAccumulator -= particlesToEmit / this.config.emissionRate;

      for (
        let i = 0;
        i < particlesToEmit && this.deadParticleIndices.length > 0;
        i++
      ) {
        const index = this.deadParticleIndices.pop();
        this._resetParticle(index);
      }
    }

    // Update particles
    let activeParticles = 0;
    for (let i = 0; i < this.config.particleCount; i++) {
      const particle = this.particles[i];
      if (!particle || !particle.active) continue;

      activeParticles++;

      // Age particle
      particle.life += deltaTime;

      // Check if dead
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        this.deadParticleIndices.push(i);
        particle.position.set(0, -1000, 0);
        this._updateParticleAttributes(i);
        continue;
      }

      // Apply physics
      // Gravity
      particle.velocity.y += this.config.gravity * deltaTime;

      // Wind
      particle.velocity.add(this.config.wind.clone().multiplyScalar(deltaTime));

      // Turbulence
      const turbulence = new THREE.Vector3(
        Math.sin(this.time + i * 0.1) * this.config.turbulence,
        Math.cos(this.time * 0.7 + i * 0.2) * this.config.turbulence * 0.5,
        Math.sin(this.time * 0.5 + i * 0.3) * this.config.turbulence,
      );
      particle.velocity.add(turbulence.multiplyScalar(deltaTime));

      // Update position
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime),
      );

      // Boundary wrapping
      const bbox = this.config.boundingBox;
      if (particle.position.x < bbox.min.x) particle.position.x = bbox.max.x;
      if (particle.position.x > bbox.max.x) particle.position.x = bbox.min.x;
      if (particle.position.z < bbox.min.z) particle.position.z = bbox.max.z;
      if (particle.position.z > bbox.max.z) particle.position.z = bbox.min.z;

      // Update attributes
      this._updateParticleAttributes(i);
    }

    this.activeParticles = activeParticles;

    // Mark only necessary attributes for update
    if (particlesToEmit > 0 || this.activeParticles > 0) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.alpha.needsUpdate = true;

      // Update color and size less frequently
      if (this.time % 0.1 < deltaTime) {
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
      }
    }
  }

  getMesh() {
    return this.mesh;
  }

  setColors(colors) {
    this.config.colors = colors.map((c) => new THREE.Color(c));
  }

  setEmissionRate(rate) {
    this.config.emissionRate = rate;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
