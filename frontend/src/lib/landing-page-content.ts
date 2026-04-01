"use client";

import { useEffect, useState } from "react";

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
  };
  about: {
    aboutCardDescription: string;
    visionText: string;
    missionItems: string[];
  };
  registration: {
    steps: string[];
    scheduleItems: LandingScheduleItem[];
  };
  winnerCategories: {
    soloItems: LandingWinnerCategoryItem[];
    pairItem: LandingWinnerCategoryItem;
    favoriteItems: LandingWinnerCategoryItem[];
  };
  requirements: {
    introText: string;
    generalItems: string[];
    specialItems: string[];
  };
  partnership: {
    partners: LandingPartnerItem[];
  };
};

const STORAGE_KEY = "duta-wisata-landing-page-content-v2";
const UPDATE_EVENT = "landing-page-content-updated";

export const defaultLandingPageContent: LandingPageContent = {
  hero: {
    organizerLabel: "Dinas Kebudayaan & Pariwisata Kota Batam",
    titleLine1: "PEMILIHAN DUTA WISATA",
    titleLine2: "ENCIK & PUAN",
    titleLine3: "KOTA BATAM 2026",
    description:
      "Platform digital resmi pemilihan Encik & Puan Duta Wisata Kota Batam 2026. Daftarkan diri Anda dan jadilah representasi terbaik Kota Batam!",
  },
  about: {
    aboutCardDescription:
      "Encik & Puan Duta Wisata Kota Batam adalah program tahunan yang diselenggarakan oleh Dinas Kebudayaan dan Pariwisata Kota Batam untuk menjaring generasi muda terbaik sebagai representasi dan promotor pariwisata Batam.",
    visionText:
      "Mewujudkan generasi muda Batam sebagai duta pariwisata yang unggul, berkarakter, dan berdaya saing.",
    missionItems: [
      "Mempromosikan destinasi wisata Batam ke tingkat nasional dan internasional.",
      "Menumbuhkan generasi muda yang aktif, inspiratif, dan peduli terhadap potensi daerah.",
    ],
  },
  registration: {
    steps: ["Buat akun peserta", "Lengkapi biodata", "Unggah berkas", "Submit pendaftaran"],
    scheduleItems: [
      { id: "schedule-1", activity: "Pendaftaran Online", date: "1 Mei - 31 Mei 2026" },
      { id: "schedule-2", activity: "Seleksi Administrasi", date: "2 Juni - 5 Juni 2026" },
      { id: "schedule-3", activity: "Pengumuman Finalis", date: "10 Juni 2026" },
      { id: "schedule-4", activity: "Grand Final", date: "27 Juni 2026" },
    ],
  },
  winnerCategories: {
    soloItems: [
      {
        title: "Encik Duta Wisata Kota Batam 2026",
        description: "Gelar utama untuk finalis putra terbaik yang unggul dalam pengetahuan, karakter, dan representasi pariwisata Batam.",
      },
      {
        title: "Puan Duta Wisata Kota Batam 2026",
        description: "Gelar utama untuk finalis putri terbaik yang unggul dalam kepribadian, wawasan, dan promosi pariwisata Batam.",
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
    pairItem: {
      title: "Encik & Puan Duta Wisata Kota Batam 2026",
      description: "Penghargaan resmi untuk pasangan utama yang mewakili Duta Wisata Kota Batam selama masa tugas.",
    },
    favoriteItems: [
      {
        title: "Duta Favorit Encik",
        description: "Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat untuk finalis putra.",
      },
      {
        title: "Duta Favorit Puan",
        description: "Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat untuk finalis putri.",
      },
    ],
  },
  requirements: {
    introText:
      "Pastikan seluruh syarat umum dan syarat khusus di bawah ini dipenuhi sebelum melakukan pendaftaran dan pengumpulan berkas.",
    generalItems: [
      "Warga Negara Indonesia dan berdomisili di Kota Batam",
      "Berusia 18 - 25 tahun pada saat pendaftaran",
      "Belum menikah",
      "Pendidikan minimal SMA/SMK/sederajat",
      "Tinggi badan minimal: Pria 175 cm, Wanita 165 cm",
      "Sehat jasmani dan rohani",
    ],
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

export function readLandingPageContent() {
  if (typeof window === "undefined") return defaultLandingPageContent;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultLandingPageContent;

  try {
    return mergeContent(JSON.parse(raw) as Partial<LandingPageContent>);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultLandingPageContent;
  }
}

export function saveLandingPageContent(value: LandingPageContent) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function useLandingPageContent() {
  const [content, setContent] = useState<LandingPageContent>(defaultLandingPageContent);

  useEffect(() => {
    const sync = () => setContent(readLandingPageContent());

    sync();
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return content;
}
