/**
 * Main initialization script for iza.dalawa.taklo
 * 
 * Initializes all components:
 * - CursorTrackingPortrait
 * - ParticleSystem
 * - Portrait decorative stars
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Initialize Cursor Tracking Portrait ---
  const portraitContainer = document.getElementById('cursor-tracking-portrait');
  let portrait = null;

  if (portraitContainer) {
    portrait = new CursorTrackingPortrait(portraitContainer, {
      deadzone: 0.12,
      smoothing: 0.06,
      trackingArea: 'viewport',
      springStiffness: 0.08,
      springDamping: 0.82,
    });
  }

  // --- Initialize Particle System ---
  const particlesCanvas = document.getElementById('particles-canvas');
  let particles = null;

  if (particlesCanvas) {
    particles = new ParticleSystem(particlesCanvas);
  }

  // --- Generate Portrait Stars ---
  const starsContainer = document.getElementById('portrait-stars');

  if (starsContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const starCount = 12;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'portrait-star' + (Math.random() > 0.7 ? ' portrait-star--large' : '');

      // Position randomly around the portrait frame
      const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x, y;

      switch (side) {
        case 0: // top
          x = Math.random() * 100;
          y = Math.random() * 15;
          break;
        case 1: // right
          x = 85 + Math.random() * 15;
          y = Math.random() * 100;
          break;
        case 2: // bottom
          x = Math.random() * 100;
          y = 85 + Math.random() * 15;
          break;
        case 3: // left
          x = Math.random() * 15;
          y = Math.random() * 100;
          break;
      }

      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${2.5 + Math.random() * 2}s`;

      starsContainer.appendChild(star);
    }
  }

  // --- Cleanup on page unload ---
  window.addEventListener('beforeunload', () => {
    if (portrait) portrait.destroy();
    if (particles) particles.destroy();
  });
});
