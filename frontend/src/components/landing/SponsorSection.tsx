"use client";

import Image from "next/image";
import { useLandingPageContent } from "../../lib/landing-page-content";

export default function SponsorSection() {
  const partnerLogos = useLandingPageContent().partnership.partners;
  const loopedLogos = [...partnerLogos, ...partnerLogos];

  return (
    <section id="partnership" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p
            className="text-sm tracking-widest uppercase mb-3"
            style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            Partnership
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cinzel)",
              background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "clamp(1.8rem, 4vw, 2.7rem)",
              fontWeight: 700,
            }}
          >
            SPONSOR & MITRA RESMI
          </h2>
          <div
            className="w-24 h-0.5 mx-auto mt-4"
            style={{ background: "linear-gradient(90deg, transparent, #C8A24D, transparent)" }}
          />
        </div>

        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            border: "1px solid rgba(200,162,77,0.2)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,243,243,0.96))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
            }}
          />

          <div className="sponsor-track">
            {loopedLogos.map((item, index) => (
              <div key={`${item.id}-${index}`} className="sponsor-item">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={260}
                  height={110}
                  className="h-17.5 sm:h-20 md:h-23 w-auto object-contain"
                  priority={index < 3}
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute left-0 top-0 h-full w-20 sm:w-28 md:w-40 bg-linear-to-r from-[#FFFFFF] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-20 sm:w-28 md:w-40 bg-linear-to-l from-[#FFFFFF] to-transparent" />
        </div>
      </div>
    </section>
  );
}
