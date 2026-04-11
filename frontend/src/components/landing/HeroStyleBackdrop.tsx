import React from "react";

/**
 * Elemen backdrop dekoratif khusus area hero untuk efek glow/ornamen.
 */
export default function HeroStyleBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{ background: "#0F0F0F" }} />

      <div className="absolute inset-0 overflow-hidden opacity-70">
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
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(200,162,77,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(rgba(245,208,111,0.35) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)",
        }}
      />
    </div>
  );
}

