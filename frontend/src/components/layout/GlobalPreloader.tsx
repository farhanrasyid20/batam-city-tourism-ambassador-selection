"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { resolveBrandingAssetUrl, useSiteBrandingContent } from "../../lib/site-branding-content";

/**
 * Preloader global saat inisialisasi awal aplikasi.
 * Muncul singkat untuk transisi masuk sebelum konten utama siap.
 */
export default function GlobalPreloader() {
  const branding = useSiteBrandingContent();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();
    const minDuration = 650;

    const hide = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minDuration - elapsed);
      window.setTimeout(() => setVisible(false), remaining);
    };

    if (document.readyState === "complete") {
      hide();
      return;
    }

    const onLoad = () => hide();
    window.addEventListener("load", onLoad, { once: true });

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ background: "#0F0F0F" }}
      aria-live="polite"
      aria-label="Memuat halaman"
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src={resolveBrandingAssetUrl(branding.logoLoader)}
          alt={`Loading ${branding.siteNameLine1}`}
          width={96}
          height={96}
          unoptimized
          priority
          style={{ filter: "drop-shadow(0 0 14px rgba(200,162,77,0.45))" }}
        />
        <div className="loader" style={{ color: "#C8A24D" }} />
      </div>
    </div>
  );
}
