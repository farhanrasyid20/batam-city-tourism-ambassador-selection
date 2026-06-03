"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { getParticipantAuthSession } from "../../lib/auth-storage";
import { resolveBrandingAssetUrl, useSiteBrandingContent } from "../../lib/site-branding-content";

const PUBLIC_ROUTES = ["/", "/about", "/news", "/vote", "/faq", "/feedback"];
const AUTH_ROUTE_PREFIX = "/auth";

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;

  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return false;
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

/**
 * Shell layout aplikasi untuk mengatur tampil/sembunyi Navbar/Footer
 * berdasarkan tipe rute (publik, autentikasi, atau area terlindungi).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const branding = useSiteBrandingContent();
  const showPublicLayout = isPublicRoute(pathname);

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (link && branding.favicon) {
      link.href = resolveBrandingAssetUrl(branding.favicon);
    }

    document.documentElement.style.setProperty("--brand-gold", branding.themeColor || "#C8A24D");
  }, [branding.favicon, branding.themeColor]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const isProtectedRoute =
      !isPublicRoute(pathname) && !pathname.startsWith(AUTH_ROUTE_PREFIX);

    if (!isProtectedRoute) return;

    const checkSessionExpiry = () => {
      const hasStoredSession = Boolean(window.localStorage.getItem("participant-auth-session"));
      const session = getParticipantAuthSession();

      if (hasStoredSession && !session) {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.replace(`/auth/login?next=${next}`);
      }
    };

    checkSessionExpiry();
    const timer = window.setInterval(checkSessionExpiry, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;
    const shouldHideScrollbars = showPublicLayout || pathname.startsWith(AUTH_ROUTE_PREFIX);

    if (shouldHideScrollbars) {
      html.classList.add("hide-scrollbar");
      body.classList.add("hide-scrollbar");
    } else {
      html.classList.remove("hide-scrollbar");
      body.classList.remove("hide-scrollbar");
    }

    return () => {
      html.classList.remove("hide-scrollbar");
      body.classList.remove("hide-scrollbar");
    };
  }, [pathname, showPublicLayout]);

  return (
    <>
      {showPublicLayout ? <Navbar /> : null}
      <main className={showPublicLayout ? "pt-20" : ""}>{children}</main>
      {showPublicLayout ? <Footer /> : null}
    </>
  );
}
