"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoldButton } from "../../components/ui/GoldButton";

export default function Hero() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    let animId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 162, 77, ${p.opacity})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const scrollToAbout = () => {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #1A140A 0%, #2B1F0F 52%, #6E4E1F 100%)",
      }}
    >
      {/* Animated particles canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Gold ray effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute"
          style={{
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120%",
            height: "140%",
            background:
              "conic-gradient(from 180deg at 50% 0%, transparent 30%, rgba(200,162,77,0.04) 40%, rgba(245,208,111,0.08) 50%, rgba(200,162,77,0.04) 60%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(232,197,122,0.16) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "300px",
            background:
              "linear-gradient(0deg, rgba(110,78,31,0.34) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "240px",
            background:
              "linear-gradient(180deg, rgba(38,32,24,0) 0%, rgba(38,32,24,0.86) 55%, rgba(33,28,22,0.96) 100%)",
          }}
        />
      </div>

      {/* Batik pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A24D' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.8,
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Stars decoration */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[
            { size: 14, opacity: 0.85 },
            { size: 18, opacity: 1 },
            { size: 14, opacity: 0.85 },
          ].map((s, i) => (
            <span
              key={i}
              style={{
                fontSize: s.size,
                opacity: s.opacity,
                background: "linear-gradient(135deg, #F5D06F, #C8A24D, #8C6A1C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 10px rgba(200,162,77,0.55))",
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div
            className="relative"
            style={{
              filter: "drop-shadow(0 0 30px rgba(200,162,77,0.5))",
            }}
          >
            <Image
              src="/logo1.png"
              alt="Logo Duta Wisata Batam 2026"
              width={240}
              height={240}
              priority
              className="w-36 h-36 sm:w-44 sm:h-44 lg:w-56 lg:h-56 object-contain"
            />
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="text-sm sm:text-base mb-3 tracking-widest uppercase"
          style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
        >
          Dinas Kebudayaan & Pariwisata Kota Batam
        </p>

        {/* Main Title */}
        <h1
          className="mb-2 leading-tight"
          style={{
            fontFamily: "var(--font-cinzel)",
            background: "linear-gradient(135deg, #F5D06F, #C8A24D, #F5D06F)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "0.05em",
          }}
        >
          PEMILIHAN DUTA WISATA
        </h1>

        <h2
          className="mb-1 leading-tight"
          style={{
            fontFamily: "var(--font-cinzel)",
            background: "linear-gradient(135deg, #F5E6C8, #C8A24D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "clamp(1.5rem, 4vw, 2.8rem)",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          ENCIK & PUAN
        </h2>

        <h3
          className="mb-8"
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "#F5D06F",
            fontSize: "clamp(1.2rem, 3.5vw, 2.2rem)",
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          KOTA BATAM 2026
        </h3>

        <p
          className="mb-10 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          Platform digital resmi pemilihan Encik & Puan Duta Wisata Kota Batam 2026.
          Daftarkan diri Anda dan jadilah representasi terbaik Kota Batam!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <GoldButton variant="primary" size="md" onClick={() => router.push("/auth/register")}>
            ✦ Daftar Sekarang
          </GoldButton>
          <GoldButton variant="outline" size="md" onClick={() => router.push("/auth/login")}>
            Login Peserta
          </GoldButton>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToAbout}
          className="mt-16 mx-auto flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
          style={{
            color: "#C8A24D",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          type="button"
        >
          <span
            className="text-xs tracking-widest"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            SCROLL
          </span>
          <span className="animate-bounce text-xl">↓</span>
        </button>
      </div>
    </section>
  );
}

