"use client";

import React from "react";

type GoldCardProps = {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
};

/**
 * Kartu UI bertema emas untuk menampilkan ringkasan data penting
 * pada halaman dashboard.
 */
export default function GoldCard({
  children,
  className = "",
  glow = false,
  onClick,
}: GoldCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "#1A1A1A",
        border: "1px solid rgba(212, 175, 55, 0.35)",
        boxShadow: glow
          ? "0 0 25px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(212, 175, 55, 0.1)"
          : "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
}
