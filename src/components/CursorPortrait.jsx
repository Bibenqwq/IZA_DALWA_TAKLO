import React, { useEffect, useRef } from 'react';

const DIRECTIONS = [
  { dir: 'center', src: '/assets/portrait/gaze-center.png', isCenter: true },
  { dir: 'left', src: '/assets/portrait/gaze-left.png' },
  { dir: 'right', src: '/assets/portrait/gaze-right.png' },
  { dir: 'up', src: '/assets/portrait/gaze-up.png' },
  { dir: 'down', src: '/assets/portrait/gaze-down.png' },
  { dir: 'upper-left', src: '/assets/portrait/gaze-upper-left.png' },
  { dir: 'upper-right', src: '/assets/portrait/gaze-upper-right.png' },
  { dir: 'lower-left', src: '/assets/portrait/gaze-lower-left.png' }
];

export default function CursorPortrait() {
  const containerRef = useRef(null);
  const layersRef = useRef({});
  const activeDirectionRef = useRef('center');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const deadzonePx = 45;

    const setDirection = (newDir) => {
      if (!layersRef.current[newDir]) {
        if (newDir === 'upper-right') newDir = 'right';
        else if (newDir === 'lower-left') newDir = 'left';
        else newDir = 'center';
      }

      if (newDir === activeDirectionRef.current) return;
      activeDirectionRef.current = newDir;

      for (const dir in layersRef.current) {
        const layer = layersRef.current[dir];
        if (layer) {
          const isActive = (dir === newDir);
          layer.style.opacity = isActive ? '1' : '0';
          layer.classList.toggle('active', isActive);
        }
      }
    };

    if (prefersReducedMotion) {
      setDirection('center');
      return;
    }

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.42;

      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

      if (clientX == null || clientY == null) return;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < deadzonePx) {
        setDirection('center');
        return;
      }

      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      let targetDir = 'center';

      if (deg >= 78 && deg <= 102) {
        targetDir = 'down';
      } else if (deg >= -105 && deg <= -75) {
        targetDir = 'up';
      } else if (deg >= -165 && deg < -105) {
        targetDir = 'upper-left';
      } else if (deg > -75 && deg <= -15) {
        targetDir = layersRef.current['upper-right'] ? 'upper-right' : 'right';
      } else if (deg > 102 || deg < -165) {
        targetDir = 'left';
      } else if (deg > -15 && deg < 78) {
        targetDir = 'right';
      }

      setDirection(targetDir);
    };

    const onPointerLeave = () => {
      setDirection('center');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
    };
  }, []);

  return (
    <div className="hero__portrait-area" id="portrait-area">
      <div className="portrait-frame" id="portrait-frame">
        <div className="portrait-frame__corner portrait-frame__corner--tl"></div>
        <div className="portrait-frame__corner portrait-frame__corner--tr"></div>
        <div className="portrait-frame__corner portrait-frame__corner--bl"></div>
        <div className="portrait-frame__corner portrait-frame__corner--br"></div>

        <div
          ref={containerRef}
          className="cursor-tracking-portrait"
          id="cursor-tracking-portrait"
          role="img"
          aria-label="Interactive portrait — her eyes follow your cursor"
        >
          {DIRECTIONS.map(({ dir, src, isCenter }) => (
            <img
              key={dir}
              ref={(el) => {
                if (el) layersRef.current[dir] = el;
              }}
              src={src}
              alt=""
              className={`portrait-layer ${isCenter ? 'portrait-layer--center active' : ''}`}
              data-direction={dir}
              loading="eager"
              style={{
                opacity: isCenter ? 1 : 0,
                transition: 'opacity 0.12s cubic-bezier(0.25, 0.1, 0.25, 1)',
                willChange: 'opacity'
              }}
            />
          ))}
        </div>

        <span className="portrait-frame__annotation" id="portrait-annotation">♡</span>
      </div>
      <div className="portrait-stars" id="portrait-stars" aria-hidden="true"></div>
    </div>
  );
}
