import React, { useEffect, useRef } from 'react';

export default function ParticlesCanvas({ ambientMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let particles = [];
    const count = 45;
    const colors = ['rgba(212, 163, 115, 0.4)', 'rgba(232, 180, 184, 0.45)', 'rgba(200, 125, 123, 0.35)', 'rgba(245, 239, 230, 0.6)'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.2 + 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.02
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!ambientMode) {
        particles.forEach(p => {
          p.phase += p.swaySpeed;
          p.x += p.vx + Math.sin(p.phase) * 0.3;
          p.y += p.vy;

          if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
          }
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [ambientMode]);

  return <canvas ref={canvasRef} id="particles-canvas" aria-hidden="true" />;
}
