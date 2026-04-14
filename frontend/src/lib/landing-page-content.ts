"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

/**
 * Kontrak konten landing page yang dikendalikan dari backend.
 */
export type LandingScheduleItem = {
  id: string;
  activity: string;
  date: string;
  startDate?: string;
  endDate?: string;
  isExtended?: boolean;
  extendedUntil?: string;
  extensionNote?: string;
};

export type LandingWinnerCategoryItem = {
  title: string;
  description: string;
};

export type LandingPartnerItem = {
  id: string;
  src: string;
  alt: string;
};

export type LandingPageContent = {
  hero: {
    organizerLabel: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    description: string;
    primaryButtonLabel: string;
    secondaryButtonLabel: string;
  };
  about: {
    sectionLabel: string;
    sectionTitle: string;
    aboutCardTitle: string;
    visionMissionTitle: string;
    aboutCardDescription: string;
    visionText: string;
    missionItems: string[];
    guideSectionLabel: string;
    guideTitle: string;
    guideDescription: string;
    guideOpenLabel: string;
    guideCloseLabel: string;
    guideOpenPdfLabel: string;
    guideDownloadPdfLabel: string;
    guidePdfUrl: string;
  };
  registration: {
    sectionLabel: string;
    sectionTitle: string;
    stepsTitle: string;
    scheduleTitle: string;
    registerButtonLabel: string;
    steps: string[];
    scheduleItems: LandingScheduleItem[];
  };
  winnerCategories: {
    sectionTitle: string;
    soloSectionLabel: string;
    soloSectionDescription: string;
    soloItems: LandingWinnerCategoryItem[];
    pairSectionLabel: string;
    pairSectionDescription: string;
    pairItem: LandingWinnerCategoryItem;
    favoriteSectionLabel: string;
    favoriteSectionDescription: string;
    favoriteItems: LandingWinnerCategoryItem[];
  };
  requirements: {
    sectionLabel: string;
    sectionTitle: string;
    introText: string;
    generalTitle: string;
    generalItems: string[];
    specialTitle: string;
    specialItems: string[];
  };
  partnership: {
    sectionLabel: string;
    sectionTitle: string;
    partners: LandingPartnerItem[];
  };
};

type LandingPageResponse = {
  message: string;
  data: LandingPageContent;
  updated_at?: string | null;
};

const UPDATE_EVENT = "landing-page-content-updated";

export const defaultLandingPageContent: LandingPageContent = {
  hero: {
    organizerLabel: "Dinas Kebudayaan & Pariwisata Kota Batam",
    titleLine1: "PEMILIHAN DUTA WISATA",
    titleLine2: "ENCIK & PUAN",
    titleLine3: "KOTA BATAM 2026",
    description:
      "Platform digital resmi pemilihan Encik & Puan Duta Wisata Kota Batam 2026. Daftarkan diri Anda dan jadilah representasi terbaik Kota Batam!",
    primaryButtonLabel: "✦ Daftar Sekarang",
    secondaryButtonLabel: "Login Peserta",
  },
  about: {
    sectionLabel: "Tentang Program",
    sectionTitle: "ENCIK & PUAN DUTA WISATA BATAM",
    aboutCardTitle: "Tentang Program",
    visionMissionTitle: "Visi & Misi",
    aboutCardDescription:
      "Encik & Puan Duta Wisata Kota Batam adalah program tahunan yang diselenggarakan oleh Dinas Kebudayaan dan Pariwisata Kota Batam untuk menjaring generasi muda terbaik sebagai representasi dan promotor pariwisata Batam.",
    visionText:
      "Mewujudkan generasi muda Batam sebagai duta pariwisata yang unggul, berkarakter, dan berdaya saing.",
    missionItems: [
      "Mempromosikan destinasi wisata Batam ke tingkat nasional dan internasional.",
      "Menumbuhkan generasi muda yang aktif, inspiratif, dan peduli terhadap potensi daerah.",
    ],
    guideSectionLabel: "Buku Panduan Resmi",
    guideTitle: "Buku Panduan Pemilihan Duta Wisata Batam 2026",
    guideDescription:
      "Tekan tombol lihat panduan untuk membuka isi buku langsung di bawah section ini. Jika browser tertentu bermasalah saat menampilkan PDF, file asli tetap bisa dibuka atau diunduh.",
    guideOpenLabel: "Lihat Panduan",
    guideCloseLabel: "Tutup Panduan",
    guideOpenPdfLabel: "Buka PDF",
    guideDownloadPdfLabel: "Unduh PDF",
    guidePdfUrl: "/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf",
  },
  registration: {
    sectionLabel: "Pendaftaran",
    sectionTitle: "TATA CARA PENDAFTARAN",
    stepsTitle: "Langkah Pendaftaran",
    scheduleTitle: "Jadwal Penting",
    registerButtonLabel: "Daftar Sekarang",
    steps: ["Buat akun peserta", "Lengkapi biodata", "Unggah berkas", "Submit pendaftaran"],
    scheduleItems: [
      {
        id: "schedule-1",
        activity: "Pendaftaran Online",
        date: "2026-02-01 - 2026-04-09",
        startDate: "2026-02-01",
        endDate: "2026-04-09",
        isExtended: false,
        extendedUntil: "",
        extensionNote: "",
      },
      {
        id: "schedule-2",
        activity: "Technical Meeting",
        date: "2026-04-10",
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        isExtended: false,
        extendedUntil: "",
        extensionNote: "",
      },
      {
        id: "schedule-3",
        activity: "Audisi",
        date: "2026-04-11",
        startDate: "2026-04-11",
        endDate: "2026-04-11",
        isExtended: false,
        extendedUntil: "",
        extensionNote: "",
      },
      {
        id: "schedule-4",
        activity: "Pra-karantina",
        date: "2026-04-13 - 2026-04-24",
        startDate: "2026-04-13",
        endDate: "2026-04-24",
        isExtended: false,
        extendedUntil: "",
        extensionNote: "",
      },
      {
        id: "schedule-5",
        activity: "Karantina",
        date: "2026-04-29 - 2026-05-01",
        startDate: "2026-04-29",
        endDate: "2026-05-01",
        isExtended: false,
        extendedUntil: "",
        extensionNote: "",
      },
      {
        id: "schedule-6",
        activity: "Grand Final",
        date: "2026-05-02",
        startDate: "2026-05-02",
        endDate: "2026-05-02",
        isExtended: false,
        extendedUntil: "",
        extensionNote: "",
      },
    ],
  },
  winnerCategories: {
    sectionTitle: "KATEGORI PEMENANG",
    soloSectionLabel: "Kategori Individu",
    soloSectionDescription: "Penghargaan utama untuk kategori solo Encik dan Puan.",
    soloItems: [
      {
        title: "Encik Duta Wisata Kota Batam 2026",
        description:
          "Gelar utama untuk finalis putra terbaik yang unggul dalam pengetahuan, karakter, dan representasi pariwisata Batam.",
      },
      {
        title: "Puan Duta Wisata Kota Batam 2026",
        description:
          "Gelar utama untuk finalis putri terbaik yang unggul dalam kepribadian, wawasan, dan promosi pariwisata Batam.",
      },
      {
        title: "1st Runner Up Encik",
        description: "Penghargaan untuk finalis putra dengan capaian terbaik setelah pemenang utama.",
      },
      {
        title: "1st Runner Up Puan",
        description: "Penghargaan untuk finalis putri dengan capaian terbaik setelah pemenang utama.",
      },
    ],
    pairSectionLabel: "Kategori Pasangan",
    pairSectionDescription: "Penghargaan resmi untuk pasangan utama Duta Wisata Kota Batam.",
    pairItem: {
      title: "Encik & Puan Duta Wisata Kota Batam 2026",
      description:
        "Penghargaan resmi untuk pasangan utama yang mewakili Duta Wisata Kota Batam selama masa tugas.",
    },
    favoriteSectionLabel: "Kategori Favorit",
    favoriteSectionDescription:
      "Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat.",
    favoriteItems: [
      {
        title: "Duta Favorit Encik",
        description:
          "Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat untuk finalis putra.",
      },
      {
        title: "Duta Favorit Puan",
        description:
          "Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat untuk finalis putri.",
      },
    ],
  },
  requirements: {
    sectionLabel: "Syarat Pendaftaran",
    sectionTitle: "PERSYARATAN PESERTA DUTA WISATA KOTA BATAM 2026",
    introText:
      "Pastikan seluruh syarat umum dan syarat khusus di bawah ini dipenuhi sebelum melakukan pendaftaran dan pengumpulan berkas.",
    generalTitle: "PERSYARATAN UMUM",
    generalItems: [
      "Warga Negara Indonesia dan berdomisili di Kota Batam",
      "Berusia 18 - 25 tahun pada saat pendaftaran",
      "Belum menikah",
      "Pendidikan minimal SMA/SMK/sederajat",
      "Tinggi badan minimal: Pria 175 cm, Wanita 165 cm",
      "Sehat jasmani dan rohani",
    ],
    specialTitle: "PERSYARATAN KHUSUS",
    specialItems: [
      "Memiliki akun Instagram aktif dan tidak di-private",
      "Bersedia mengikuti seluruh tahapan seleksi",
      "Tidak sedang menjabat sebagai Duta aktif",
      "Mampu berkomunikasi dalam Bahasa Indonesia dan Bahasa Inggris",
      "Memiliki wawasan luas tentang pariwisata Kota Batam",
      "Bersedia mempromosikan pariwisata Kota Batam selama masa jabatan",
    ],
  },
  partnership: {
    sectionLabel: "Partnership",
    sectionTitle: "SPONSOR & MITRA RESMI",
    partners: [
      { id: "logo-site", src: "/logo1.png", alt: "Duta Wisata Batam" },
      { id: "batam", src: "/partners/dinas_kebudayaan.png", alt: "Dinas Pariwisata Kota Batam" },
      { id: "vbi", src: "/partners/vbi.png", alt: "Visit Batam Indonesia" },
      { id: "bbi", src: "/partners/bbi.png", alt: "Bangga Buatan Indonesia" },
      { id: "wonderful-indonesia", src: "/partners/wonderful.png", alt: "Wonderful Indonesia" },
      { id: "kementrian-pariwisata", src: "/partners/kemenpar.png", alt: "Kementrian Pariwisata" },
    ],
  },
};

/**
 * Menggabungkan payload parsial dari backend dengan fallback default agar shape tetap lengkap.
 */
function mergeContent(value: Partial<LandingPageContent> | null | undefined): LandingPageContent {
  const normalizedScheduleItemsRaw =
    value?.registration?.scheduleItems?.length
      ? value.registration.scheduleItems.map((item) => ({
          ...item,
          isExtended: Boolean(item.isExtended),
          startDate: item.startDate ?? "",
          endDate: item.endDate ?? "",
          extendedUntil: item.extendedUntil ?? "",
          extensionNote: item.extensionNote ?? "",
        }))
      : defaultLandingPageContent.registration.scheduleItems;
  const normalizedScheduleItems = mergeMissingScheduleItems(normalizedScheduleItemsRaw);

  return {
    hero: {
      ...defaultLandingPageContent.hero,
      ...value?.hero,
    },
    about: {
      ...defaultLandingPageContent.about,
      ...value?.about,
      missionItems: value?.about?.missionItems?.length
        ? value.about.missionItems
        : defaultLandingPageContent.about.missionItems,
    },
    registration: {
      ...defaultLandingPageContent.registration,
      ...value?.registration,
      steps: value?.registration?.steps?.length
        ? value.registration.steps
        : defaultLandingPageContent.registration.steps,
      scheduleItems: normalizedScheduleItems,
    },
    winnerCategories: {
      ...defaultLandingPageContent.winnerCategories,
      ...value?.winnerCategories,
      soloItems: value?.winnerCategories?.soloItems?.length
        ? value.winnerCategories.soloItems
        : defaultLandingPageContent.winnerCategories.soloItems,
      pairItem: {
        ...defaultLandingPageContent.winnerCategories.pairItem,
        ...value?.winnerCategories?.pairItem,
      },
      favoriteItems: value?.winnerCategories?.favoriteItems?.length
        ? value.winnerCategories.favoriteItems
        : defaultLandingPageContent.winnerCategories.favoriteItems,
    },
    requirements: {
      ...defaultLandingPageContent.requirements,
      ...value?.requirements,
      generalItems: value?.requirements?.generalItems?.length
        ? value.requirements.generalItems
        : defaultLandingPageContent.requirements.generalItems,
      specialItems: value?.requirements?.specialItems?.length
        ? value.requirements.specialItems
        : defaultLandingPageContent.requirements.specialItems,
    },
    partnership: {
      ...defaultLandingPageContent.partnership,
      ...value?.partnership,
      partners: value?.partnership?.partners?.length
        ? value.partnership.partners
        : defaultLandingPageContent.partnership.partners,
    },
  };
}

function activityKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mergeMissingScheduleItems(current: LandingScheduleItem[]): LandingScheduleItem[] {
  const existing = new Set(current.map((item) => activityKey(item.activity || "")));
  const merged = [...current];

  for (const item of defaultLandingPageContent.registration.scheduleItems) {
    const key = activityKey(item.activity || "");
    if (!key || existing.has(key)) continue;
    merged.push(item);
  }

  return ensureUniqueScheduleIds(merged);
}

function ensureUniqueScheduleIds(items: LandingScheduleItem[]): LandingScheduleItem[] {
  const used = new Set<string>();

  return items.map((item, index) => {
    const baseId = (item.id || `schedule-${index + 1}`).trim() || `schedule-${index + 1}`;
    let nextId = baseId;

    if (used.has(nextId)) {
      nextId = `${baseId}-${index + 1}`;
    }

    used.add(nextId);
    return { ...item, id: nextId };
  });
}

function toDateValue(raw?: string): number | null {
  if (!raw) return null;
  const value = Date.parse(raw);
  return Number.isNaN(value) ? null : value;
}

export function getScheduleEffectiveEnd(item: LandingScheduleItem): string {
  if (item.isExtended && item.extendedUntil) return item.extendedUntil;
  return item.endDate || item.startDate || "";
}

export function getScheduleStatus(item: LandingScheduleItem): "done" | "active" | "upcoming" {
  const now = Date.now();
  const start = toDateValue(item.startDate);
  const end = toDateValue(getScheduleEffectiveEnd(item));

  if (start === null || end === null) return "upcoming";
  if (now < start) return "upcoming";
  if (now > end) return "done";
  return "active";
}

export function getScheduleDateLabel(item: LandingScheduleItem): string {
  const start = (item.startDate || "").trim();
  const end = (item.endDate || "").trim();
  const effectiveEnd = (getScheduleEffectiveEnd(item) || "").trim();

  const base =
    start && end
      ? start === end
        ? start
        : `${start} - ${end}`
      : start || end || (item.date || "").trim();

  if (item.isExtended && effectiveEnd) {
    return `${base} (Diperpanjang s/d ${effectiveEnd})`;
  }

  return base || "-";
}

let cachedContent: LandingPageContent = defaultLandingPageContent;

export async function fetchLandingPageContent() {
  const response = await apiRequest<LandingPageResponse>("/public/landing-page", {
    method: "GET",
  });

  cachedContent = mergeContent(response.data);
  return cachedContent;
}

/**
 * Menyimpan perubahan konten landing page oleh super admin.
 */
export async function saveLandingPageContent(value: LandingPageContent, token: string) {
  const response = await apiRequest<LandingPageResponse>("/super-admin/landing-page", {
    method: "POST",
    token,
    body: value,
  });

  cachedContent = mergeContent(response.data);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }

  return cachedContent;
}

/**
 * Upload PDF buku panduan landing page.
 * Endpoint akan menyimpan file dan otomatis memperbarui about.guidePdfUrl.
 */
export async function uploadLandingGuidePdf(file: File, token: string) {
  const body = new FormData();
  body.append("guide_pdf_file", file);

  const response = await apiRequest<LandingPageResponse>("/super-admin/landing-page/guide-pdf-upload", {
    method: "POST",
    token,
    body,
  });

  cachedContent = mergeContent(response.data);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }

  return cachedContent;
}

/**
 * Hook sinkronisasi konten landing page (fetch awal + update event).
 */
export function useLandingPageContent() {
  const [content, setContent] = useState<LandingPageContent>(cachedContent);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const next = await fetchLandingPageContent();
        if (!cancelled) {
          setContent(next);
        }
      } catch {
        if (!cancelled) {
          setContent(cachedContent);
        }
      }
    };

    const syncFromEvent = () => {
      if (!cancelled) {
        setContent(cachedContent);
      }
      void sync();
    };

    void sync();
    window.addEventListener(UPDATE_EVENT, syncFromEvent);

    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, syncFromEvent);
    };
  }, []);

  return useMemo(() => mergeContent(content), [content]);
}
