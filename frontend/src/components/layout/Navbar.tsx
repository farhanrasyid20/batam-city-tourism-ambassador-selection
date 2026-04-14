"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { GoldButton } from "../ui/GoldButton";
import { resolveBrandingAssetUrl, useSiteBrandingContent } from "../../lib/site-branding-content";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "News", href: "/news" },
  { label: "Vote", href: "/vote" },
  { label: "FAQ", href: "/faq" },
  { label: "Feedback", href: "/feedback" },
];

/**
 * Navbar utama untuk area publik yang memuat navigasi section
 * serta aksi cepat ke halaman autentikasi dan pendaftaran.
 */
export default function Navbar() {
  const branding = useSiteBrandingContent();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[9999] transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(20, 16, 10, 0.82)"
          : "linear-gradient(180deg, rgba(20,16,10,0.88) 0%, rgba(20,16,10,0.46) 62%, rgba(20,16,10,0) 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid rgba(200,162,77,0.22)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src={resolveBrandingAssetUrl(branding.logoMain)}
              alt={branding.siteNameLine1}
              width={48}
              height={48}
              unoptimized
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain shrink-0"
              priority
            />
            <div className="block min-w-0">
              <p
                className="text-[10px] sm:text-xs leading-tight truncate"
                style={{
                  color: "#C8A24D",
                  fontFamily: "var(--font-cinzel)",
                  letterSpacing: "0.08em",
                }}
              >
                {branding.siteNameLine1}
              </p>
              <p
                className="text-[9px] sm:text-xs leading-tight truncate"
                style={{
                  color: "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                  opacity: 0.8,
                }}
              >
                {branding.siteNameLine2}
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm transition-colors duration-200 hover:opacity-80"
                style={{
                  color: isActive(link.href) ? "#C8A24D" : "#F5E6C8",
                  fontFamily: "var(--font-poppins)",
                  letterSpacing: "0.05em",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
              <GoldButton variant="outline" size="sm">
                Login
              </GoldButton>
            </Link>
            <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
              <GoldButton variant="primary" size="sm">
                Register
              </GoldButton>
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ color: "#C8A24D", background: "rgba(200,162,77,0.1)" }}
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="lg:hidden py-4 border-t"
            style={{
              borderColor: "rgba(200,162,77,0.2)",
              background: "rgba(20,16,10,0.96)",
            }}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-left px-4 py-3 rounded-lg text-sm transition-colors hover:bg-white/5"
                  style={{
                    color: isActive(link.href) ? "#C8A24D" : "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <div className="flex flex-col gap-2 px-4 pt-3">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <GoldButton variant="outline" fullWidth>
                    Login
                  </GoldButton>
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                  <GoldButton variant="primary" fullWidth>
                    Register
                  </GoldButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
