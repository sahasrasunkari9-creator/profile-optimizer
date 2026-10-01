"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function glowTexture(inner: string, mid: string): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Futuristic 3D background: particle field, wireframe geometric objects,
 * neon glow sources, fog and a slow camera that follows the cursor.
 * Purely decorative — kept low-contrast so text stays readable.
 */
export default function NeonBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      // WebGL unavailable — hide the canvas and continue without 3D.
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060f, 0.03);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    camera.position.set(0, 0.4, 17);

    // Particle field
    const COUNT = 1300;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color(0x22d3ee), // cyan
      new THREE.Color(0x8b5cf6), // violet
      new THREE.Color(0xa855f7), // purple
      new THREE.Color(0xe8ecff), // white-blue
    ];
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 66;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 66;
      const c = palette[Math.random() > 0.8 ? 3 : Math.floor(Math.random() * 3)];
      const v = 0.4 + Math.random() * 0.6;
      colors[i * 3] = c.r * v;
      colors[i * 3 + 1] = c.g * v;
      colors[i * 3 + 2] = c.b * v;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Wireframe geometric objects
    const wireColorA = 0x22d3ee;
    const wireColorB = 0xa855f7;
    const shapes: { obj: THREE.Mesh; rx: number; ry: number; py: number }[] = [];
    const addShape = (geometry: THREE.BufferGeometry, x: number, y: number, z: number, color: number, scale: number) => {
      const m = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.32 })
      );
      m.position.set(x, y, z);
      m.scale.setScalar(scale);
      scene.add(m);
      shapes.push({
        obj: m,
        rx: 0.05 + Math.random() * 0.12,
        ry: 0.06 + Math.random() * 0.14,
        py: (Math.random() - 0.5) * 0.6,
      });
    };
    addShape(new THREE.IcosahedronGeometry(3.2, 0), -11, 4, -14, wireColorB, 1);
    addShape(new THREE.IcosahedronGeometry(2.2, 0), 12, -3, -10, wireColorA, 1);
    addShape(new THREE.TorusGeometry(2.6, 0.5, 10, 28), 9, 6, -20, wireColorB, 1);
    addShape(new THREE.OctahedronGeometry(1.8, 0), -8, -6, -8, wireColorA, 1);
    addShape(new THREE.TetrahedronGeometry(1.6, 0), 2, -7, -18, wireColorB, 1);

    // Neon glow sources
    const cyanTex = glowTexture("rgba(103,232,249,0.9)", "rgba(34,211,238,0.25)");
    const violetTex = glowTexture("rgba(216,180,254,0.9)", "rgba(168,85,247,0.22)");
    const glow1 = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: cyanTex, transparent: true, opacity: 0.5, depthWrite: false })
    );
    glow1.scale.set(34, 34, 1);
    glow1.position.set(16, 9, -28);
    scene.add(glow1);
    const glow2 = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: violetTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    glow2.scale.set(36, 36, 1);
    glow2.position.set(-18, -10, -26);
    scene.add(glow2);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    const smoothed = { x: 0, y: 0 };

    const frame = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      points.rotation.y = t * 0.016;
      points.rotation.x = Math.sin(t * 0.05) * 0.03;
      points.position.y = Math.sin(t * 0.09) * 0.6;

      for (const s of shapes) {
        s.obj.rotation.x += s.rx * dt;
        s.obj.rotation.y += s.ry * dt;
        s.obj.position.y += Math.sin(t * 0.4 + s.py * 10) * dt * s.py;
      }

      smoothed.x += (mouse.x - smoothed.x) * Math.min(1, dt * 2.2);
      smoothed.y += (mouse.y - smoothed.y) * Math.min(1, dt * 2.2);
      camera.position.x = Math.sin(t * 0.04) * 3 + smoothed.x * 1.6;
      camera.position.y = 0.4 + Math.sin(t * 0.055) * 0.8 - smoothed.y * 1.2;
      camera.position.z = 17 + Math.sin(t * 0.03) * 1.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      geo.dispose();
      mat.dispose();
      cyanTex.dispose();
      violetTex.dispose();
      shapes.forEach((s) => {
        s.obj.geometry.dispose();
        (s.obj.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-80" />
      {/* Floating glass panels (DOM, lightweight) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-[9] overflow-hidden">
        <div className="glass-card float-slow absolute left-[6%] top-[16%] hidden h-24 w-44 rounded-2xl opacity-40 lg:block" style={{ transform: "rotate(-8deg)" }} />
        <div className="glass-card float-slower absolute right-[8%] top-[24%] hidden h-28 w-52 rounded-2xl opacity-35 lg:block" style={{ transform: "rotate(7deg)" }} />
        <div className="glass-card float-slow absolute bottom-[18%] left-[14%] hidden h-20 w-36 rounded-2xl opacity-30 xl:block" style={{ transform: "rotate(5deg)" }} />
        <div className="glass-card float-slower absolute bottom-[12%] right-[16%] hidden h-24 w-40 rounded-2xl opacity-35 xl:block" style={{ transform: "rotate(-6deg)" }} />
      </div>
    </>
  );
}
