import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3DScene({ onLetterClick }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene, camera, renderer, envelopeGroup, particlesGroup;
    let petals = [];
    let mouse = { x: 0, y: 0 };
    let clock = new THREE.Clock();
    let animationId = null;
    let raycaster = new THREE.Raycaster();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfaf7f2, 0.04);

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization failed in Hero3DScene', e);
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff6ed, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffe8ec, 1.2);
    keyLight.position.set(4, 5, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xe8e4df, 0.6, 12);
    fillLight.position.set(-4, -2, 4);
    scene.add(fillLight);

    // Envelope Group
    envelopeGroup = new THREE.Group();

    // Paper material
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xfbf9f5,
      roughness: 0.85,
      metalness: 0.05
    });

    // Envelope body
    const bodyGeo = new THREE.BoxGeometry(3.2, 2.2, 0.08);
    const bodyMesh = new THREE.Mesh(bodyGeo, paperMat);
    bodyMesh.castShadow = true;
    envelopeGroup.add(bodyMesh);

    // Envelope Flap
    const flapGeo = new THREE.ConeGeometry(1.6, 1.1, 3);
    const flapMat = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.8 });
    const flapMesh = new THREE.Mesh(flapGeo, flapMat);
    flapMesh.rotation.z = Math.PI;
    flapMesh.rotation.x = 0.05;
    flapMesh.position.set(0, 0.55, 0.06);
    envelopeGroup.add(flapMesh);

    // Wax seal
    const sealGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 24);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xc87d7b,
      roughness: 0.4,
      metalness: 0.15
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.set(0, 0.05, 0.1);
    envelopeGroup.add(sealMesh);

    envelopeGroup.rotation.y = -0.15;
    envelopeGroup.rotation.x = 0.08;
    scene.add(envelopeGroup);

    // Particles (stars/fireflies)
    particlesGroup = new THREE.Group();
    const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xd4a373 });

    for (let i = 0; i < 35; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      p.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4
      );
      particlesGroup.add(p);
    }
    scene.add(particlesGroup);

    // Rose petals
    const petalGeo = new THREE.PlaneGeometry(0.2, 0.28);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xe8b4b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 18; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const initX = (Math.random() - 0.5) * 6;
      petal.position.set(initX, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3);
      petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      petal.userData = {
        speedY: 0.005 + Math.random() * 0.008,
        rotSpeedX: 0.01 + Math.random() * 0.015,
        rotSpeedY: 0.008 + Math.random() * 0.012,
        initialX: initX,
        swayPhase: Math.random() * Math.PI * 2
      };
      petals.push(petal);
      scene.add(petal);
    }

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = Math.max(-1, Math.min(1, x));
      mouse.y = Math.max(-1, Math.min(1, y));
    };

    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(envelopeGroup.children, true);
      if (intersects.length > 0 && onLetterClick) {
        onLetterClick();
      }
    };

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('click', onClick);
    window.addEventListener('resize', onResize, { passive: true });

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        if (envelopeGroup) {
          envelopeGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.14;
          const targetRotX = 0.08 - mouse.y * 0.22;
          const targetRotY = -0.15 + mouse.x * 0.35;
          envelopeGroup.rotation.x += (targetRotX - envelopeGroup.rotation.x) * 0.06;
          envelopeGroup.rotation.y += (targetRotY - envelopeGroup.rotation.y) * 0.06;
        }

        if (particlesGroup) {
          particlesGroup.rotation.y = elapsedTime * 0.02;
        }

        petals.forEach(petal => {
          petal.position.y -= petal.userData.speedY;
          petal.rotation.x += petal.userData.rotSpeedX;
          petal.rotation.y += petal.userData.rotSpeedY;
          petal.userData.swayPhase += 0.02;
          petal.position.x = petal.userData.initialX + Math.sin(petal.userData.swayPhase) * 0.25;
          if (petal.position.y < -3.5) petal.position.y = 3.5;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [onLetterClick]);

  return (
    <div className="hero-3d-wrapper" id="hero-3d-wrapper">
      <div
        ref={containerRef}
        className="hero-3d-scene"
        id="hero-3d-scene"
        role="img"
        aria-label="3D floating paper letter and origami envelope in a quiet universe"
        style={{ cursor: 'pointer' }}
      />
      <div className="hero-3d-caption">
        <span className="caption-handwritten">click the floating letter to unfold ♡</span>
      </div>
    </div>
  );
}
