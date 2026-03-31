"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Trophy,
  Target,
  Users,
  Star,
  BookOpen,
  Download,
  ExternalLink,
  Crown,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { winnerCategories } from "../../../data/mockData";
import { useApp } from "../../../context/AppContext";

const AboutGuideInlineViewer = dynamic(() => import("./AboutGuideInlineViewer"), {
  ssr: false,
});

const guideBookHref = "/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf";

const generalRequirements = [
  "Warga Negara Indonesia dan berdomisili di Kota Batam",
  "Berusia 18 - 25 tahun pada saat pendaftaran",
  "Belum menikah",
  "Pendidikan minimal SMA/SMK/sederajat",
  "Tinggi badan minimal: Pria 175 cm, Wanita 165 cm",
  "Sehat jasmani dan rohani",
];

const specialRequirements = [
  "Memiliki akun Instagram aktif dan tidak di-private",
  "Bersedia mengikuti seluruh tahapan seleksi",
  "Tidak sedang menjabat sebagai Duta aktif",
  "Mampu berkomunikasi dalam Bahasa Indonesia dan Bahasa Inggris",
  "Memiliki wawasan luas tentang pariwisata Kota Batam",
  "Bersedia mempromosikan pariwisata Kota Batam selama masa jabatan",
];

const soloCategoryTitles = [
  "Encik Duta Wisata Kota Batam 2026",
  "Puan Duta Wisata Kota Batam 2026",
  "1st Runner Up Encik",
  "1st Runner Up Puan",
];

const favoriteCategoryTitles = ["Duta Favorit Encik", "Duta Favorit Puan"];

export function AboutSection() {
  const [guideOpen, setGuideOpen] = useState(false);
  const { landingPageContent } = useApp();
  const aboutContent = landingPageContent.about;

  const soloWinnerCategories = useMemo(
    () =>
      soloCategoryTitles
        .map((title) => winnerCategories.find((item) => item.title === title) ?? null)
        .filter((item): item is NonNullable<typeof item> => item !== null),
    []
  );

  const pairWinnerCategory = useMemo(
    () =>
      winnerCategories.find(
        (item) => item.title === "Encik & Puan Duta Wisata Kota Batam 2026"
      ) ?? null,
    []
  );

  const favoriteWinnerCategories = useMemo(
    () =>
      favoriteCategoryTitles
        .map((title) => winnerCategories.find((item) => item.title === title) ?? null)
        .filter((item): item is NonNullable<typeof item> => item !== null),
    []
  );

  return (
    <section id="about" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p
            className="text-sm tracking-widest uppercase mb-3"
            style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            {aboutContent.sectionLabel}
          </p>

          <h2
            style={{
              fontFamily: "var(--font-cinzel)",
              background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 700,
            }}
          >
            {aboutContent.sectionTitle}
          </h2>

          <div
            className="w-24 h-0.5 mx-auto mt-4"
            style={{ background: "linear-gradient(90deg, transparent, #C8A24D, transparent)" }}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="rounded-2xl p-8 bg-[#1A1A1A] border border-yellow-700/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#C8A24D]">
                <Users size={18} color="#0F0F0F" />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
                {aboutContent.aboutCardTitle}
              </h3>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">{aboutContent.aboutCardDescription}</p>
          </div>

          <div className="rounded-2xl p-8 bg-[#1A1A1A] border border-yellow-700/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#C8A24D]">
                <Target size={18} color="#0F0F0F" />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
                {aboutContent.visionMissionCardTitle}
              </h3>
            </div>

            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 flex items-center justify-center shrink-0">
                  <Star size={12} style={{ color: "#C8A24D" }} fill="#C8A24D" />
                </span>
                {aboutContent.visionText}
              </li>
              {aboutContent.missionItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="mt-0.5 w-4 h-4 flex items-center justify-center shrink-0">
                    <Star size={12} style={{ color: "#C8A24D" }} fill="#C8A24D" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-16 rounded-2xl border border-yellow-700/30 bg-[#1A1A1A] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <div className="px-5 sm:px-8 py-6 border-b border-yellow-700/20">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#C8A24D]" style={{ fontFamily: "var(--font-poppins)" }}>
                    Buku Panduan Resmi
                  </p>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}>
                  Buku Panduan Pemilihan Duta Wisata Batam 2026
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
                  Tekan tombol lihat panduan untuk membuka isi buku langsung di bawah section ini. Jika browser tertentu bermasalah saat menampilkan PDF, file asli tetap bisa dibuka atau diunduh.
                </p>
              </div>

              <div className="grid w-full xl:w-auto sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setGuideOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold min-h-12"
                  style={{
                    background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                    color: "#0F0F0F",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {guideOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {guideOpen ? "Tutup Panduan" : "Lihat Panduan"}
                </button>

                <Link
                  href={guideBookHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border min-h-12"
                  style={{
                    borderColor: "rgba(200,162,77,0.35)",
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                    background: "rgba(200,162,77,0.08)",
                  }}
                >
                  <ExternalLink size={16} /> Buka PDF
                </Link>

                <a
                  href={guideBookHref}
                  download
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border min-h-12"
                  style={{
                    borderColor: "rgba(200,162,77,0.35)",
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                    background: "rgba(200,162,77,0.08)",
                  }}
                >
                  <Download size={16} /> Unduh PDF
                </a>
              </div>
            </div>
          </div>

          {guideOpen ? <AboutGuideInlineViewer file={guideBookHref} /> : null}
        </div>

        <div className="mb-16">
          <div className="text-center mb-10 flex justify-center items-center gap-3">
            <Trophy size={20} style={{ color: "#C8A24D" }} />
            <h3 className="text-xl font-bold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
              KATEGORI PEMENANG
            </h3>
            <Trophy size={20} style={{ color: "#C8A24D" }} />
          </div>

          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black shrink-0">
                  <Crown size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#C8A24D]" style={{ fontFamily: "var(--font-poppins)" }}>
                    Kategori Individu
                  </p>
                  <p className="text-sm" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
                    Penghargaan utama untuk kategori solo Encik dan Puan.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {soloWinnerCategories.map((item, index) => (
                  <div key={item.title} className="rounded-2xl p-6 bg-[#1A1A1A] border border-yellow-700/20 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
                    <div className="mb-4 w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black font-bold text-sm">
                      {index + 1}
                    </div>
                    <h4 className="text-base font-semibold mb-2" style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}>
                      {item.title}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {pairWinnerCategory ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black shrink-0">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#C8A24D]" style={{ fontFamily: "var(--font-poppins)" }}>
                      Kategori Pasangan
                    </p>
                    <p className="text-sm" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
                      Penghargaan resmi untuk pasangan utama Duta Wisata Kota Batam.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-6 sm:p-8 bg-[#1A1A1A] border border-yellow-700/20 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black font-bold text-base shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-semibold mb-3" style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}>
                        {pairWinnerCategory.title}
                      </h4>
                      <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                        {pairWinnerCategory.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black shrink-0">
                  <Heart size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#C8A24D]" style={{ fontFamily: "var(--font-poppins)" }}>
                    Kategori Favorit
                  </p>
                  <p className="text-sm" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
                    Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {favoriteWinnerCategories.map((item, index) => (
                  <div key={item.title} className="rounded-2xl p-6 bg-[#1A1A1A] border border-yellow-700/20 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
                    <div className="mb-4 w-10 h-10 rounded-full flex items-center justify-center bg-linear-to-br from-[#F5D06F] to-[#8C6A1C] text-black font-bold text-sm">
                      {index + 6}
                    </div>
                    <h4 className="text-base font-semibold mb-2" style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}>
                      {item.title}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
              Syarat Pendaftaran
            </p>
            <h3 className="text-xl sm:text-2xl font-bold" style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}>
              PERSYARATAN PESERTA DUTA WISATA KOTA BATAM 2026
            </h3>
            <p className="text-sm sm:text-base mt-3 max-w-3xl mx-auto" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
              Pastikan seluruh syarat umum dan syarat khusus di bawah ini dipenuhi sebelum melakukan pendaftaran dan pengumpulan berkas.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {[
              { title: "PERSYARATAN UMUM", items: generalRequirements },
              { title: "PERSYARATAN KHUSUS", items: specialRequirements },
            ].map((block) => (
              <div key={block.title} className="rounded-2xl p-8 bg-[#1A1A1A] border border-yellow-700/30">
                <h3 className="text-lg font-semibold mb-5" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
                  * {block.title}
                </h3>

                <ul className="space-y-3 text-sm" style={{ color: "#BDBDBD" }}>
                  {block.items.map((text, i) => (
                    <li key={`${block.title}-${i}`} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-yellow-500/20 text-yellow-400">
                        {i + 1}
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

