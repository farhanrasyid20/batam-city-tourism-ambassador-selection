"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { resolveBrandingAssetUrl, useSiteBrandingContent } from "../../lib/site-branding-content";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "News", href: "/news" },
  { label: "Vote", href: "/vote" },
  { label: "FAQ", href: "/faq" },
  { label: "Feedback", href: "/feedback" },
  { label: "Register", href: "/auth/register" },
  { label: "Login", href: "/auth/login" },
];

/**
 * Footer publik aplikasi yang menampilkan informasi identitas,
 * kontak, dan tautan penting penyelenggara.
 */
export default function Footer() {
  const branding = useSiteBrandingContent();
  const contactPhoneHref = `tel:${branding.contactPhone.replace(/[^\d+]/g, "")}`;
  return (
    <footer
      className="py-12"
      style={{
        background: "linear-gradient(180deg, #1A140A 0%, #120E08 100%)",
        borderTop: "1px solid rgba(200,162,77,0.24)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={resolveBrandingAssetUrl(branding.logoMain)}
                alt={branding.siteNameLine1}
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 object-contain"
              />
              <div>
                <p
                  style={{
                    color: "#C8A24D",
                    fontFamily: "var(--font-cinzel)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {branding.siteNameLine1}
                </p>
                <p
                  style={{
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                    fontSize: "0.75rem",
                    opacity: 0.7,
                  }}
                >
                  {branding.siteNameLine2}
                </p>
              </div>
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "#CBB998", fontFamily: "var(--font-poppins)" }}
            >
              {branding.footerDescription}
            </p>
          </div>

          <div>
            <h4
              className="mb-4 text-sm"
              style={{
                color: "#C8A24D",
                fontFamily: "var(--font-cinzel)",
                fontWeight: 600,
              }}
            >
              KONTAK
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin
                  size={14}
                  style={{ color: "#C8A24D", marginTop: 2, flexShrink: 0 }}
                />
                <p
                  className="text-xs"
                  style={{ color: "#CBB998", fontFamily: "var(--font-poppins)" }}
                >
                  {branding.contactOrganization}
                  <br />
                  {branding.contactAddress}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: "#C8A24D" }} />
                <a
                  href={contactPhoneHref}
                  className="text-xs transition-colors hover:text-[#C8A24D]"
                  style={{ color: "#CBB998", fontFamily: "var(--font-poppins)" }}
                >
                  {branding.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} style={{ color: "#C8A24D" }} />
                <a
                  href={`mailto:${branding.contactEmail}`}
                  className="text-xs transition-colors hover:text-[#C8A24D]"
                  style={{ color: "#CBB998", fontFamily: "var(--font-poppins)" }}
                >
                  {branding.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Instagram size={14} style={{ color: "#C8A24D" }} />
                <a
                  href={branding.contactInstagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs transition-colors hover:text-[#C8A24D]"
                  style={{ color: "#CBB998", fontFamily: "var(--font-poppins)" }}
                >
                  {branding.contactInstagram}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4
              className="mb-4 text-sm"
              style={{
                color: "#C8A24D",
                fontFamily: "var(--font-cinzel)",
                fontWeight: 600,
              }}
            >
              TAUTAN
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-left text-xs py-1 transition-colors hover:text-[#C8A24D]"
                  style={{
                    color: "#CBB998",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          className="h-px mb-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,162,77,0.3), transparent)",
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <p
            className="text-xs"
            style={{
              color: "#CBB998",
              fontFamily: "var(--font-poppins)",
              opacity: 0.6,
            }}
          >
            ©2026 Duta Wisata Kota Batam. Hak Cipta Dilindungi.
          </p>
          <p
            className="text-xs"
            style={{
              color: "#C8A24D",
              fontFamily: "var(--font-cinzel)",
              opacity: 0.6,
            }}
          >
            Solusi Digital Pemilihan Duta Wisata Kota Batam
          </p>
        </div>
      </div>
    </footer>
  );
}
