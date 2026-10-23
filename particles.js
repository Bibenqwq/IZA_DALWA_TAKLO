/**
 * Particles — Soft floating particles for the background
 * 
 * Creates tiny, gently floating particles (stars, rose petals, sparkles)
 * to enhance the romantic atmosphere without being distracting.
 * 
 * Lightweight: Uses canvas for efficient rendering.
 * Respects prefers-reduced-motion.
 */
class ParticleSystem {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isActive = true;

    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this._resize();
    this._createParticles();
    this._bindEvents();
    this._animate();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  _createParticles() {
    const count = Math.min(35, Math.floor((this.width * this.height) / 30000));
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push(this._createParticle());
    }
  }

  _createParticle() {
    const types = ['dot', 'star', 'glow'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -Math.random() * 0.3 - 0.05,
      opacity: Math.random() * 0.3 + 0.05,
      maxOpacity: Math.random() * 0.35 + 0.1,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.008 + 0.003,
      type: type,
      color: this._getRandomColor(),
    };
  }

  _getRandomColor() {
    const colors = [
      'rgba(201, 160, 160, ',  // dusty rose
      'rgba(212, 179, 179, ',  // lighter rose
      'rgba(201, 169, 110, ',  // gold
      'rgba(219, 194, 153, ',  // light gold
      'rgba(168, 124, 124, ',  // darker rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  _bindEvents() {
    let resizeTimeout;
    this._onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this._resize();
        this._createParticles();
      }, 250);
    };
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _animate() {
    if (!this.isActive) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;
      p.phase += p.phaseSpeed;

      // Oscillating opacity
      p.opacity = p.maxOpacity * (0.5 + 0.5 * Math.sin(p.phase));

      // Wrap around
      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      // Draw
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;

      if (p.type === 'star') {
        this._drawStar(p.x, p.y, p.size);
      } else if (p.type === 'glow') {
        this._drawGlow(p.x, p.y, p.size, p.color);
      } else {
        this._drawDot(p.x, p.y, p.size, p.color);
      }

      this.ctx.restore();
    });

    this.animationId = requestAnimationFrame(() => this._animate());
  }

  _drawDot(x, y, size, color) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = color + '1)';
    this.ctx.fill();
  }

  _drawStar(x, y, size) {
    const spikes = 4;
    const outerRadius = size * 1.5;
    const innerRadius = size * 0.5;

    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(201, 169, 110, 0.8)';
    this.ctx.fill();
  }

  _drawGlow(x, y, size, color) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    gradient.addColorStop(0, color + '0.6)');
    gradient.addColorStop(1, color + '0)');
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  destroy() {
    this.isActive = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this._onResize);
  }
}

window.ParticleSystem = ParticleSystem;
