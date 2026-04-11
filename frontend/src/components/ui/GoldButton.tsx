"use client";

import React, { useMemo, useState } from "react";

interface GoldButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
}

/**
 * Tombol bertema emas khusus identitas visual aplikasi.
 * Mendukung mode primary, outline, dan ghost dengan state hover interaktif.
 */
export function GoldButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  fullWidth = false,
}: GoldButtonProps) {
  const [hovered, setHovered] = useState(false);

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  } as const;

  const base =
    `inline-flex items-center justify-center gap-2 rounded-xl ` +
    `font-semibold transition-all duration-300 ` +
    `${fullWidth ? "w-full" : ""} ` +
    `${sizes[size]} ` +
    `${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ` +
    `${className}`;

  // style primary (gradient + glow + lift)
  const primaryStyle = useMemo<React.CSSProperties>(() => {
    const boxShadow = hovered
      ? "0 6px 30px rgba(212, 175, 55, 0.6)"
      : "0 4px 20px rgba(212, 175, 55, 0.4)";
    const transform = hovered ? "translateY(-2px)" : "translateY(0)";

    return {
      background: "linear-gradient(135deg, #F5D06F, #C8A24D, #8C6A1C)",
      color: "#0F0F0F",
      boxShadow,
      transform,
      fontFamily: "var(--font-cinzel)",
      letterSpacing: "0.05em",
    };
  }, [hovered]);

  // style outline (border + hover bg)
  const outlineStyle = useMemo<React.CSSProperties>(() => {
    return {
      background: hovered ? "rgba(212, 175, 55, 0.1)" : "transparent",
      color: "#C8A24D",
      border: "1.5px solid #C8A24D",
      boxShadow: hovered ? "0 4px 20px rgba(212, 175, 55, 0.2)" : "none",
      fontFamily: "var(--font-cinzel)",
      letterSpacing: "0.05em",
    };
  }, [hovered]);

  // ghost (simple)
  const ghostStyle: React.CSSProperties = {
    color: "#C8A24D",
    fontFamily: "var(--font-poppins)",
  };

  const style =
    variant === "primary" ? primaryStyle : variant === "outline" ? outlineStyle : ghostStyle;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      style={style}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => !disabled && setHovered(false)}
    >
      {children}
    </button>
  );
}
