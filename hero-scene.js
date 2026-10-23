/**
 * hero-scene.js — Three.js Interactive 3D Hero Experience
 * 
 * "A little universe of words"
 * - Tactile floating origami envelope with wax seal
 * - Drifting stars/fireflies and delicate rose petals
 * - Soft ambient blush and warm ivory lighting
 * - Smooth pointer parallax and click-to-open interaction
 * - WebGL detection with graceful CSS fallback
 * - Tab visibility detection and reduced-motion support
 */

class HeroScene {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.onLetterClick = options.onLetterClick || null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.envelopeGroup = null;
    this.particlesGroup = null;
    this.petals = [];
    this.raycaster = null;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = null;
    this.animationId = null;
    this.isHoveringLetter = false;
    this.isDestroyed = false;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._init();
  }

  _init() {
    if (!this._isWebGLAvailable() || typeof THREE === 'undefined') {
      this._renderFallback();
      return;
    }

    try {
      this._setupScene();
      this._createEnvelope();
      this._createFloatingParticles();
      this._createPetals();
      this._setupLighting();
      this._setupInteractions();
      this._animate();
    } catch (e) {
      console.warn('HeroScene: WebGL initialization failed, using CSS fallback:', e);
      this._renderFallback();
    }
  }

  _isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  _setupScene() {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || this.container.clientWidth || 360;
    const height = rect.height || this.container.clientHeight || 420;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xfaf7f2, 0.04);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.outline = 'none';

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
  }

  _setupLighting() {
    // Warm ivory ambient light
    const ambientLight = new THREE.AmbientLight(0xfff6ed, 0.85);
    this.scene.add(ambientLight);

    // Main key light with soft dusty-rose tint
    const keyLight = new THREE.DirectionalLight(0xffe8ec, 1.2);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // Soft faded lavender rim light
    const rimLight = new THREE.DirectionalLight(0xdcd6e8, 0.7);
    rimLight.position.set(-4, -2, -2);
    this.scene.add(rimLight);

    // Warm candle-like point light
    const warmPoint = new THREE.PointLight(0xc9a96e, 0.6, 12);
    warmPoint.position.set(0, 2, 3);
    this.scene.add(warmPoint);
  }

  _createEnvelope() {
    this.envelopeGroup = new THREE.Group();
    this.envelopeGroup.position.set(0, 0, 0);

    // Paper ivory material
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: 0xfefcf9,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const innerLiningMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3e6e8, // soft blush lining
      roughness: 0.9,
      metalness: 0.0
    });

    // 1. Envelope Back Base
    const width = 3.2;
    const height = 2.1;
    const baseGeometry = new THREE.BoxGeometry(width, height, 0.04);
    const baseMesh = new THREE.Mesh(baseGeometry, paperMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.envelopeGroup.add(baseMesh);

    // 2. Letter Paper peeking out from inside
    const letterGeo = new THREE.BoxGeometry(width * 0.88, height * 0.85, 0.02);
    const letterMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.02
    });
    const letterMesh = new THREE.Mesh(letterGeo, letterMaterial);
    letterMesh.position.set(0, 0.45, 0.015);
    letterMesh.rotation.z = -0.03;
    letterMesh.castShadow = true;
    this.envelopeGroup.add(letterMesh);

    // 3. Side Triangles (folded side flaps)
    const sideFlapShape = new THREE.Shape();
    sideFlapShape.moveTo(0, -height / 2);
    sideFlapShape.lineTo(width / 2.3, 0);
    sideFlapShape.lineTo(0, height / 2);
    sideFlapShape.closePath();

    const sideGeo = new THREE.ShapeGeometry(sideFlapShape);
    const leftFlap = new THREE.Mesh(sideGeo, paperMaterial);
    leftFlap.position.set(-width / 2, 0, 0.03);
    leftFlap.castShadow = true;
    this.envelopeGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(sideGeo, paperMaterial);
    rightFlap.rotation.y = Math.PI;
    rightFlap.position.set(width / 2, 0, 0.031);
    rightFlap.castShadow = true;
    this.envelopeGroup.add(rightFlap);

    // 4. Bottom Triangle Flap
    const bottomShape = new THREE.Shape();
    bottomShape.moveTo(-width / 2, -height / 2);
    bottomShape.lineTo(0, 0.15);
    bottomShape.lineTo(width / 2, -height / 2);
    bottomShape.closePath();

    const bottomGeo = new THREE.ShapeGeometry(bottomShape);
    const bottomFlap = new THREE.Mesh(bottomGeo, paperMaterial);
    bottomFlap.position.set(0, 0, 0.032);
    bottomFlap.castShadow = true;
    this.envelopeGroup.add(bottomFlap);

    // 5. Top Flap (slightly open to reveal letter)
    const topShape = new THREE.Shape();
    topShape.moveTo(-width / 2, 0);
    topShape.lineTo(0, height * 0.65);
    topShape.lineTo(width / 2, 0);
    topShape.closePath();

    const topGeo = new THREE.ShapeGeometry(topShape);
    const topFlap = new THREE.Mesh(topGeo, innerLiningMaterial);
    topFlap.position.set(0, height / 2, 0.02);
    topFlap.rotation.x = 0.45; // folded backwards gracefully
    topFlap.castShadow = true;
    this.envelopeGroup.add(topFlap);

    // 6. Dusty Rose Wax Seal Medallion with heart accent
    const sealGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.08, 24);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xbd8796, // muted rose wax
      roughness: 0.4,
      metalness: 0.25
    });
    const waxSeal = new THREE.Mesh(sealGeo, sealMat);
    waxSeal.rotation.x = Math.PI / 2;
    waxSeal.position.set(0, 0.08, 0.06);
    waxSeal.castShadow = true;
    this.envelopeGroup.add(waxSeal);

    // Tiny gold heart emblem on the seal
    const heartShape = new THREE.Shape();
    const hx = 0, hy = 0;
    heartShape.moveTo(hx, hy + 0.06);
    heartShape.bezierCurveTo(hx + 0.08, hy + 0.12, hx + 0.12, hy + 0.04, hx + 0.12, hy - 0.02);
    heartShape.bezierCurveTo(hx + 0.12, hy - 0.08, hx + 0.06, hy - 0.12, hx, hy - 0.16);
    heartShape.bezierCurveTo(hx - 0.06, hy - 0.12, hx - 0.12, hy - 0.08, hx - 0.12, hy - 0.02);
    heartShape.bezierCurveTo(hx - 0.12, hy + 0.04, hx - 0.08, hy + 0.12, hx, hy + 0.06);

    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xc9a96e, // vintage gold
      roughness: 0.3,
      metalness: 0.6
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0, 0.08, 0.11);
    this.envelopeGroup.add(heartMesh);

    // Give the envelope an initial gentle slant
    this.envelopeGroup.rotation.set(0.08, -0.15, 0.06);

    this.scene.add(this.envelopeGroup);
  }

  _createFloatingParticles() {
    this.particlesGroup = new THREE.Group();
    const particleCount = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      scales[i] = Math.random() * 0.06 + 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom soft circular glow sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(233, 201, 207, 0.9)'); // blush
    grad.addColorStop(0.4, 'rgba(201, 169, 110, 0.4)'); // gold
    grad.addColorStop(1, 'rgba(250, 247, 242, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    this.particlesGroup.add(points);
    this.scene.add(this.particlesGroup);
  }

  _createPetals() {
    // Delicate floating rose petals
    const petalCount = 8;
    const petalMaterial = new THREE.MeshStandardMaterial({
      color: 0xebccd2,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < petalCount; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.15, 0.2, 0, 0.4);
      shape.quadraticCurveTo(-0.15, 0.2, 0, 0);

      const geo = new THREE.ShapeGeometry(shape);
      const mesh = new THREE.Mesh(geo, petalMaterial);

      const angle = (i / petalCount) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 1.5;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      mesh.userData = {
        speedY: 0.003 + Math.random() * 0.005,
        rotSpeedX: 0.006 + Math.random() * 0.01,
        rotSpeedY: 0.005 + Math.random() * 0.008,
        swayPhase: Math.random() * Math.PI * 2,
        initialX: mesh.position.x
      };

      this.petals.push(mesh);
      this.scene.add(mesh);
    }
  }

  _setupInteractions() {
    this._onPointerMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouse.targetX = x;
      this.mouse.targetY = y;

      // Raycast to detect hover over the envelope
      if (this.raycaster && this.envelopeGroup) {
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
        const intersects = this.raycaster.intersectObjects(this.envelopeGroup.children, true);
        const hovering = intersects.length > 0;

        if (hovering !== this.isHoveringLetter) {
          this.isHoveringLetter = hovering;
          this.container.style.cursor = hovering ? 'pointer' : 'default';
        }
      }
    };

    this._onClick = (e) => {
      if (this.raycaster && this.envelopeGroup) {
        const rect = this.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
        const intersects = this.raycaster.intersectObjects(this.envelopeGroup.children, true);

        if (intersects.length > 0) {
          this._triggerOpenEffect();
          if (typeof this.onLetterClick === 'function') {
            this.onLetterClick();
          }
        }
      }
    };

    this._onResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || 360;
      const height = rect.height || 420;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    this._onVisibilityChange = () => {
      if (document.hidden) {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
      } else {
        if (!this.animationId && !this.isDestroyed) {
          this.clock.start();
          this._animate();
        }
      }
    };

    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    this.container.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize, { passive: true });
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  _triggerOpenEffect() {
    // Cute tactile flutter animation
    if (!this.envelopeGroup) return;
    let progress = 0;
    const initialRotY = this.envelopeGroup.rotation.y;
    const flutter = () => {
      progress += 0.08;
      this.envelopeGroup.rotation.y = initialRotY + Math.sin(progress * Math.PI) * 0.45;
      this.envelopeGroup.position.z = Math.sin(progress * Math.PI) * 0.5;
      if (progress < 1) {
        requestAnimationFrame(flutter);
      } else {
        this.envelopeGroup.position.z = 0;
      }
    };
    flutter();
  }

  _animate() {
    if (this.isDestroyed) return;

    this.animationId = requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth pointer damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    if (!this.prefersReducedMotion) {
      // 1. Organic Envelope floating motion & mouse parallax
      if (this.envelopeGroup) {
        const floatY = Math.sin(elapsedTime * 1.2) * 0.14;
        const floatRotZ = Math.cos(elapsedTime * 0.8) * 0.04;

        this.envelopeGroup.position.y = floatY;

        // Subtle parallax response to pointer
        const targetRotX = 0.08 - this.mouse.y * 0.22;
        const targetRotY = -0.15 + this.mouse.x * 0.35;

        this.envelopeGroup.rotation.x += (targetRotX - this.envelopeGroup.rotation.x) * 0.06;
        this.envelopeGroup.rotation.y += (targetRotY - this.envelopeGroup.rotation.y) * 0.06;
        this.envelopeGroup.rotation.z = floatRotZ;
      }

      // 2. Slow particle rotation
      if (this.particlesGroup) {
        this.particlesGroup.rotation.y = elapsedTime * 0.02;
        this.particlesGroup.rotation.x = Math.sin(elapsedTime * 0.015) * 0.05;
      }

      // 3. Floating Rose Petals
      this.petals.forEach(petal => {
        petal.position.y -= petal.userData.speedY;
        petal.rotation.x += petal.userData.rotSpeedX;
        petal.rotation.y += petal.userData.rotSpeedY;

        // Horizontal sway
        petal.userData.swayPhase += 0.02;
        petal.position.x = petal.userData.initialX + Math.sin(petal.userData.swayPhase) * 0.25;

        // Recycle petal when it falls below viewport
        if (petal.position.y < -3.5) {
          petal.position.y = 3.5;
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  _renderFallback() {
    this.container.innerHTML = `
      <div class="hero-3d-fallback" role="button" aria-label="Open featured letter">
        <div class="fallback-envelope">
          <div class="fallback-envelope__flap"></div>
          <div class="fallback-envelope__paper">
            <span class="fallback-envelope__line"></span>
            <span class="fallback-envelope__line"></span>
          </div>
          <div class="fallback-envelope__seal">♡</div>
        </div>
        <p class="fallback-envelope__hint">click to open the letter ♡</p>
      </div>
    `;
    const btn = this.container.querySelector('.hero-3d-fallback');
    if (btn && this.onLetterClick) {
      btn.addEventListener('click', this.onLetterClick);
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}

window.HeroScene = HeroScene;
