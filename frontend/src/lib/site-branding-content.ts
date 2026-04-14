"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, resolveApiAssetUrl } from "./api";

export type SiteBrandingContent = {
  logoMain: string;
  logoLoader: string;
  favicon: string;
  siteNameLine1: string;
  siteNameLine2: string;
  tagline: string;
  footerDescription: string;
  contactOrganization: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactInstagram: string;
  contactInstagramUrl: string;
  themeColor: string;
};

type SiteBrandingResponse = {
  message: string;
  data: SiteBrandingContent;
  updated_at?: string | null;
};

const UPDATE_EVENT = "site-branding-content-updated";
const STORE_KEY = "__siteBrandingStore__";
const BRANDING_TTL_MS = 5 * 60 * 1000;

export const defaultSiteBrandingContent: SiteBrandingContent = {
  logoMain: "/logo1.png",
  logoLoader: "/logo1.png",
  favicon: "/logo1.png",
  siteNameLine1: "DUTA WISATA",
  siteNameLine2: "KOTA BATAM 2026",
  tagline: "Platform Digital Pemilihan Encik & Puan Kota Batam",
  footerDescription: "Platform digital resmi Pemilihan Encik dan Puan Duta Wisata Kota Batam 2026.",
  contactOrganization: "Dinas Kebudayaan dan Pariwisata Kota Batam",
  contactAddress: "Jl. Engku Putri No.1, Batam Centre, Kota Batam",
  contactPhone: "(0778) 469000",
  contactEmail: "dutawisata@batam.go.id",
  contactInstagram: "@dutawisatakotabatam",
  contactInstagramUrl: "https://www.instagram.com/dutawisatakotabatam/",
  themeColor: "#C8A24D",
};

function normalizeSiteBranding(value: Partial<SiteBrandingContent> | null | undefined): SiteBrandingContent {
  return {
    logoMain: value?.logoMain?.trim() || defaultSiteBrandingContent.logoMain,
    logoLoader: value?.logoLoader?.trim() || defaultSiteBrandingContent.logoLoader,
    favicon: value?.favicon?.trim() || defaultSiteBrandingContent.favicon,
    siteNameLine1: value?.siteNameLine1?.trim() || defaultSiteBrandingContent.siteNameLine1,
    siteNameLine2: value?.siteNameLine2?.trim() || defaultSiteBrandingContent.siteNameLine2,
    tagline: value?.tagline?.trim() || defaultSiteBrandingContent.tagline,
    footerDescription: value?.footerDescription?.trim() || defaultSiteBrandingContent.footerDescription,
    contactOrganization: value?.contactOrganization?.trim() || defaultSiteBrandingContent.contactOrganization,
    contactAddress: value?.contactAddress?.trim() || defaultSiteBrandingContent.contactAddress,
    contactPhone: value?.contactPhone?.trim() || defaultSiteBrandingContent.contactPhone,
    contactEmail: value?.contactEmail?.trim() || defaultSiteBrandingContent.contactEmail,
    contactInstagram: value?.contactInstagram?.trim() || defaultSiteBrandingContent.contactInstagram,
    contactInstagramUrl: value?.contactInstagramUrl?.trim() || defaultSiteBrandingContent.contactInstagramUrl,
    themeColor: value?.themeColor?.trim() || defaultSiteBrandingContent.themeColor,
  };
}

type BrandingStore = {
  cached: SiteBrandingContent;
  loaded: boolean;
  lastFetchedAt: number;
  inFlight: Promise<SiteBrandingContent> | null;
};

function getStore(): BrandingStore {
  const runtime = globalThis as typeof globalThis & {
    [STORE_KEY]?: BrandingStore;
  };

  if (!runtime[STORE_KEY]) {
    runtime[STORE_KEY] = {
      cached: defaultSiteBrandingContent,
      loaded: false,
      lastFetchedAt: 0,
      inFlight: null,
    };
  }

  return runtime[STORE_KEY]!;
}

export async function fetchSiteBrandingContent(options?: { force?: boolean }) {
  const store = getStore();
  const force = options?.force === true;
  const now = Date.now();
  const isFresh = store.loaded && now - store.lastFetchedAt < BRANDING_TTL_MS;

  if (!force && isFresh) {
    return store.cached;
  }

  if (!force && store.inFlight) {
    return store.inFlight;
  }

  store.inFlight = apiRequest<SiteBrandingResponse>("/public/site-settings/branding", {
    method: "GET",
  })
    .then((response) => {
      store.cached = normalizeSiteBranding(response.data);
      store.loaded = true;
      store.lastFetchedAt = Date.now();
      return store.cached;
    })
    .finally(() => {
      store.inFlight = null;
    });

  return store.inFlight;
}

export async function saveSiteBrandingContent(value: SiteBrandingContent, token: string) {
  const store = getStore();
  const response = await apiRequest<SiteBrandingResponse>("/super-admin/site-settings/branding", {
    method: "POST",
    token,
    body: value,
  });

  store.cached = normalizeSiteBranding(response.data);
  store.loaded = true;
  store.lastFetchedAt = Date.now();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }

  return store.cached;
}

export function useSiteBrandingContent() {
  const [content, setContent] = useState<SiteBrandingContent>(getStore().cached);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const next = await fetchSiteBrandingContent();
        if (!cancelled) {
          setContent(next);
        }
      } catch {
        if (!cancelled) {
          setContent(getStore().cached);
        }
      }
    };

    const syncFromEvent = () => {
      if (!cancelled) {
        setContent(getStore().cached);
      }
    };

    const store = getStore();
    const now = Date.now();
    const isFresh = store.loaded && now - store.lastFetchedAt < BRANDING_TTL_MS;

    if (!isFresh) {
      void sync();
    }

    window.addEventListener(UPDATE_EVENT, syncFromEvent);

    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, syncFromEvent);
    };
  }, []);

  return useMemo(() => normalizeSiteBranding(content), [content]);
}

export function resolveBrandingAssetUrl(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return "/logo1.png";

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  // Asset yang berasal dari storage backend.
  if (raw.startsWith("/storage/")) {
    return resolveApiAssetUrl(raw) || "/logo1.png";
  }
  if (raw.startsWith("storage/")) {
    return resolveApiAssetUrl(`/${raw}`) || "/logo1.png";
  }

  // Asset lokal frontend (public), misal /logo1.png.
  if (raw.startsWith("/")) {
    return raw;
  }

  // Jika hanya nama file (misal logo1.png), anggap file frontend public.
  return `/${raw}`;
}
