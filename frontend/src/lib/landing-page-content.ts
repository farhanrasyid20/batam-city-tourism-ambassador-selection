"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

export type LandingScheduleItem = {
  id: string;
  activity: string;
  date: string;
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
  },
  registration: {
    sectionLabel: "Pendaftaran",
    sectionTitle: "TATA CARA PENDAFTARAN",
    stepsTitle: "Langkah Pendaftaran",
    scheduleTitle: "Jadwal Penting",
    registerButtonLabel: "Daftar Sekarang",
    steps: ["Buat akun peserta", "Lengkapi biodata", "Unggah berkas", "Submit pendaftaran"],
    scheduleItems: [
      { id: "schedule-1", activity: "Pendaftaran Online", date: "1 Mei - 31 Mei 2026" },
      { id: "schedule-2", activity: "Seleksi Administrasi", date: "2 Juni - 5 Juni 2026" },
      { id: "schedule-3", activity: "Pengumuman Finalis", date: "10 Juni 2026" },
      { id: "schedule-4", activity: "Grand Final", date: "27 Juni 2026" },
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

function mergeContent(value: Partial<LandingPageContent> | null | undefined): LandingPageContent {
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
      scheduleItems: value?.registration?.scheduleItems?.length
        ? value.registration.scheduleItems
        : defaultLandingPageContent.registration.scheduleItems,
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

let cachedContent: LandingPageContent = defaultLandingPageContent;

export async function fetchLandingPageContent() {
  const response = await apiRequest<LandingPageResponse>("/public/landing-page", {
    method: "GET",
  });

  cachedContent = mergeContent(response.data);
  return cachedContent;
}

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
