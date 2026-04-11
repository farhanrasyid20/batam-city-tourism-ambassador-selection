import React from "react";
import FAQList from "./components/FAQList";

/**
 * Halaman FAQ publik.
 * Menyediakan judul, konteks bantuan, dan daftar pertanyaan yang dapat difilter.
 */
export default function FAQPage() {
  return (
    <div
      className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-12"
     
    >
      <div className="max-w-5xl mx-auto">
        <p
          className="text-sm tracking-widest uppercase mb-3"
          style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
        >
          Bantuan
        </p>

        <h1
          className="mb-6"
          style={{
            fontFamily: "var(--font-cinzel)",
            background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            fontWeight: 700,
          }}
        >
          FAQ (Pertanyaan Umum)
        </h1>

        <FAQList />
      </div>
    </div>
  );
}


