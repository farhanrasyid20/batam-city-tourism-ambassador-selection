"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import GoldCard from "../../../../components/dashboard/GoldCard";

type AdminPlaceholderProps = {
  title: string;
  description: string;
};

export default function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <GoldCard>
      <h1
        style={{
          fontFamily: "var(--font-cinzel)",
          color: "#D4AF37",
          fontSize: "1.4rem",
          fontWeight: 700,
        }}
      >
        {title}
      </h1>
      <p className="mt-3 text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
        {description}
      </p>
    </GoldCard>
  );
}

