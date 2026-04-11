"use client";

import React, { useEffect, useRef } from "react";

/**
 * Efek latar dekoratif untuk memperkuat atmosfer visual
 * pada section landing page.
 */
export default function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
    };
    resize();

    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }[] = [];

    // Keep particle count moderate so scrolling stays smooth.
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", resize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-elegantBlack" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.45 }}
      />

      <div
        className="absolute left-1/2 top-[30%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(200,162,77,0.55) 0%, rgba(15,15,15,0) 60%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "conic-gradient(from 210deg at 50% 35%, rgba(245,208,111,0.18), rgba(15,15,15,0) 20%, rgba(200,162,77,0.16) 35%, rgba(15,15,15,0) 55%, rgba(182,141,42,0.12) 70%, rgba(15,15,15,0) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(rgba(245,208,111,0.35) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute inset-0 opacity-60">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-[2px] w-[2px] rounded-full bg-goldLight blur-[0.5px]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              opacity: (i % 7) / 10 + 0.2,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}

