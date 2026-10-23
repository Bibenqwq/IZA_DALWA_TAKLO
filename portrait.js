/**
 * CursorTrackingPortrait
 * 
 * An interactive portrait component that tracks cursor position in real-time
 * and smoothly points her gaze toward the mouse pointer.
 * 
 * Available directional photos:
 * - gaze-center
 * - gaze-left
 * - gaze-right
 * - gaze-up
 * - gaze-down
 * - gaze-upper-left
 * - gaze-lower-left
 */

class CursorTrackingPortrait {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.layers = {};
    this.activeDirection = 'center';
    this.deadzonePx = options.deadzonePx || 45;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.boundingRect = null;

    this._init();
  }

  _init() {
    // Collect all portrait image layers
    const layerElements = this.container.querySelectorAll('.portrait-layer');
    layerElements.forEach(layer => {
      const direction = layer.dataset.direction;
      if (direction) {
        this.layers[direction] = layer;
        layer.style.opacity = direction === 'center' ? '1' : '0';
        layer.style.transition = 'opacity 0.12s cubic-bezier(0.25, 0.1, 0.25, 1)';
        layer.style.willChange = 'opacity';
      }
    });

    if (this.prefersReducedMotion) {
      this._setDirection('center');
      return;
    }

    this._updateRect();
    this._bindEvents();
  }

  _updateRect() {
    if (this.container) {
      this.boundingRect = this.container.getBoundingClientRect();
    }
  }

  _setDirection(newDirection) {
    if (!this.layers[newDirection]) {
      if (newDirection === 'upper-right') newDirection = 'right';
      else if (newDirection === 'lower-left') newDirection = 'left';
      else newDirection = 'center';
    }

    if (newDirection === this.activeDirection) return;
    this.activeDirection = newDirection;

    for (const dir in this.layers) {
      if (this.layers[dir]) {
        const isActive = (dir === newDirection);
        this.layers[dir].style.opacity = isActive ? '1' : '0';
        this.layers[dir].classList.toggle('active', isActive);
      }
    }
  }

  _bindEvents() {
    this._onPointerMove = (e) => {
      // Re-measure periodically or if not measured yet
      if (!this.boundingRect || this.boundingRect.width === 0) {
        this._updateRect();
      }

      const rect = this.container.getBoundingClientRect();
      // Face center coordinates inside the portrait
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.42; // slightly above vertical center where eyes are

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Deadzone: when looking directly at her face
      if (dist < this.deadzonePx) {
        this._setDirection('center');
        return;
      }

      // Calculate angle from eye center in degrees (-180 to +180)
      // 0 = Right, 90 = Down, -90 = Up, 180/-180 = Left
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      let targetDir = 'center';

      // 1. Direct Straight Down: only when pointer is directly beneath her portrait (|dx| is small)
      if (deg >= 78 && deg <= 102) {
        targetDir = 'down';
      }
      // 2. Direct Straight Up: when pointer is directly above her head
      else if (deg >= -105 && deg <= -75) {
        targetDir = 'up';
      }
      // 3. Top-Left / Upper-Left quadrant (dx < 0, dy < 0)
      else if (deg >= -165 && deg < -105) {
        targetDir = 'upper-left';
      }
      // 4. Top-Right / Upper-Right quadrant (dx > 0, dy < 0)
      else if (deg > -75 && deg <= -15) {
        targetDir = this.layers['upper-right'] ? 'upper-right' : 'right';
      }
      // 5. Left & Bottom-Left: when cursor is anywhere to the left side (dx < 0)
      // She accurately follows cursor on the left and never bows head down
      else if (deg > 102 || deg < -165) {
        targetDir = 'left';
      }
      // 6. Right & Bottom-Right: when cursor is anywhere to the right side (dx > 0)
      // She accurately follows cursor on the right and never bows head down
      else if (deg > -15 && deg < 78) {
        targetDir = 'right';
      }

      this._setDirection(targetDir);
    };

    this._onPointerLeave = () => {
      this._setDirection('center');
    };

    this._onResize = () => {
      this._updateRect();
    };

    // Attach pointer listeners for universal support
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('mousemove', this._onPointerMove, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        this._onPointerMove(e.touches[0]);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', this._onPointerLeave);
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('scroll', this._onResize, { passive: true });

    // Accessibility motion preference listener
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._onMotionChange = (e) => {
      this.prefersReducedMotion = e.matches;
      if (e.matches) {
        this._setDirection('center');
      }
    };
    motionQuery.addEventListener('change', this._onMotionChange);
  }

  destroy() {
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('mousemove', this._onPointerMove);
    document.removeEventListener('mouseleave', this._onPointerLeave);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onResize);
    this._setDirection('center');
  }
}

window.CursorTrackingPortrait = CursorTrackingPortrait;
