"use client";

import Image from "next/image";
import { resolveBrandingAssetUrl, useSiteBrandingContent } from "../lib/site-branding-content";

/**
 * Loading UI global untuk App Router.
 * Ditampilkan saat halaman/segment sedang melakukan proses render atau fetch data.
 */
export default function Loading() {
  const branding = useSiteBrandingContent();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0F0F0F" }}
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src={resolveBrandingAssetUrl(branding.logoLoader)}
          alt={`Loading ${branding.siteNameLine1}`}
          width={96}
          height={96}
          unoptimized
          style={{
            filter: "drop-shadow(0 0 14px rgba(200,162,77,0.45))",
          }}
          priority
        />
        <div className="loader" style={{ color: "#C8A24D" }} />
      </div>
    </div>
  );
}
