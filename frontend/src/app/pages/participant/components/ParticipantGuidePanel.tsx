"use client";

import React from "react";
import Link from "next/link";
import NextImage from "next/image";
import { BookOpen, Download, ExternalLink, FileText, Hash, MessageCircle, Phone } from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { hashtags, officialLinks } from "./documentUploadConfig";

const fallbackCloseUpExamples = [
  { src: "/participant-resources/photo-examples/closeup-1.jpg", label: "Close Up Putra" },
  { src: "/participant-resources/photo-examples/closeup-2.jpg", label: "Close Up Putri Hijab" },
  { src: "/participant-resources/photo-examples/closeup-3.jpg", label: "Close Up Putri Non-Hijab" },
];

const fallbackFullBodyExamples = [
  { src: "/participant-resources/photo-examples/fullbody-1.jpg", label: "Full Body Putra" },
  { src: "/participant-resources/photo-examples/fullbody-2.jpg", label: "Full Body Putri Hijab" },
  { src: "/participant-resources/photo-examples/fullbody-3.jpg", label: "Full Body Putri Non-Hijab" },
];

function resolveDocumentHref(fileDataUrl: string, linkUrl: string, fallbackHref: string) {
  if (fileDataUrl) return fileDataUrl;
  if (linkUrl) return linkUrl;
  return fallbackHref;
}

export default function ParticipantGuidePanel() {
  const { participantResources } = useApp();

  const resourceItems = [
    {
      title: "Buku Panduan Duta Wisata 2026",
      href: resolveDocumentHref(
        participantResources.guideDocument.fileDataUrl,
        participantResources.guideDocument.linkUrl,
        "/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf"
      ),
      note: "Wajib dibaca sebelum isi biodata dan upload berkas.",
    },
    {
      title: "Form S-01",
      href: resolveDocumentHref(
        participantResources.formS1Document.fileDataUrl,
        participantResources.formS1Document.linkUrl,
        "/participant-resources/S-01-Formulir-Pendaftaran-Encik-Puan-Batam-2026.pdf"
      ),
      note: "Formulir pendaftaran peserta.",
    },
    {
      title: "Form S-02",
      href: resolveDocumentHref(
        participantResources.formS2Document.fileDataUrl,
        participantResources.formS2Document.linkUrl,
        "/participant-resources/S-02-Surat-Izin-Orang-Tua-Encik-Puan-Batam-2026.pdf"
      ),
      note: "Surat izin orang tua / wali.",
    },
    {
      title: "Form S-03",
      href: resolveDocumentHref(
        participantResources.formS3Document.fileDataUrl,
        participantResources.formS3Document.linkUrl,
        "/participant-resources/S-03-Pernyataan-Bersedia-Menjadi-Duta-Wisata-2026.pdf"
      ),
      note: "Surat pernyataan bersedia.",
    },
    {
      title: "Form S-04",
      href: resolveDocumentHref(
        participantResources.formS4Document.fileDataUrl,
        participantResources.formS4Document.linkUrl,
        "/participant-resources/S-04-Kesanggupan-Mengikuti-Rangkaian-Kegiatan-2026.pdf"
      ),
      note: "Surat kesanggupan ikut seluruh tahapan.",
    },
    {
      title: "Berkas Online",
      href: resolveDocumentHref(
        participantResources.submissionDocument.fileDataUrl,
        participantResources.submissionDocument.linkUrl,
        officialLinks.forms
      ),
      note: "Akses berkas online resmi dari panitia.",
    },
  ];

  const closeUpExamples =
    participantResources.closeUpExamples.filter((item) => item.imageUrl).length > 0
      ? participantResources.closeUpExamples
          .filter((item) => item.imageUrl)
          .map((item, index) => ({
            src: item.imageUrl,
            label: item.caption || `Close Up ${index + 1}`,
          }))
      : fallbackCloseUpExamples;

  const fullBodyExamples =
    participantResources.fullBodyExamples.filter((item) => item.imageUrl).length > 0
      ? participantResources.fullBodyExamples
          .filter((item) => item.imageUrl)
          .map((item, index) => ({
            src: item.imageUrl,
            label: item.caption || `Full Body ${index + 1}`,
          }))
      : fallbackFullBodyExamples;

  const twibbonThumbnail =
    participantResources.twibbonThumbnail.imageUrl || "/participant-resources/twibbon-duwis-2026.png";
  const whatsappThumbnail =
    participantResources.whatsappThumbnail.imageUrl || "/participant-resources/qr-grup-wa-dutawisata-2026.jpg";
  const twibbonOpenLink = participantResources.twibbonOpenLink || officialLinks.forms;
  const twibbonDownloadLink = resolveDocumentHref(
    participantResources.twibbonDocument.fileDataUrl,
    participantResources.twibbonDocument.linkUrl,
    twibbonThumbnail
  );
  const guideLink = participantResources.guideDocument.linkUrl || officialLinks.guide;
  const formsLink = participantResources.submissionDocument.linkUrl || officialLinks.forms;
  const whatsappGroupLink = participantResources.whatsappGroupLink || officialLinks.waGroup;
  const mentionText = participantResources.instagramMentions || "@dutawisatakotabatam, @batamtourism.official";
  const hashtagItems =
    participantResources.hashtagList.trim().length > 0
      ? participantResources.hashtagList.split("\n").map((item) => item.trim()).filter(Boolean)
      : hashtags;

  return (
    <div className="space-y-6 mb-6">
      <GoldCard glow>
        <h2 className="text-sm sm:text-base font-bold mb-3" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
          PENDAFTARAN PEMILIHAN DUTA WISATA ENCIK & PUAN KOTA BATAM 2026
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Selamat datang di pendaftaran Duta Wisata Encik Puan Kota Batam 2026. Sebelum upload berkas, pastikan kamu unduh
          dokumen resmi, baca buku panduan, dan ikuti tata cara pengisian form.
        </p>
      </GoldCard>

      <GoldCard>
        <div className="flex items-center gap-2 mb-4">
          <Download size={16} style={{ color: "#C8A24D" }} />
          <h3 className="text-sm font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
            Unduh Dokumen Resmi
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resourceItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl p-3 transition-all"
              style={{
                background: "rgba(200,162,77,0.07)",
                border: "1px solid rgba(200,162,77,0.22)",
              }}
            >
              <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                {item.title}
              </p>
              <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                {item.note}
              </p>
            </a>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          <Link href={guideLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs mr-4" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
            <BookOpen size={12} /> Link panduan online <ExternalLink size={12} />
          </Link>
          <Link href={formsLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
            <FileText size={12} /> Link berkas online <ExternalLink size={12} />
          </Link>
        </div>
      </GoldCard>

      <GoldCard>
        <h3 className="text-sm font-bold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
          Tata Cara Pengisian Berkas Hard Copy
        </h3>
        {participantResources.hardcopyGuide ? (
          <p className="text-xs sm:text-sm mb-3" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", whiteSpace: "pre-line" }}>
            {participantResources.hardcopyGuide}
          </p>
        ) : null}
        <ol className="space-y-2 list-decimal pl-4 text-xs sm:text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          <li>Unduh file Form S-01, S-02, S-03, dan S-04.</li>
          <li>Cetak semua form.</li>
          <li>Isi form dengan data valid dan dapat dipertanggungjawabkan.</li>
          <li>Tanda tangani form di bagian yang diminta.</li>
          <li>Siapkan hard copy untuk dikumpulkan saat technical meeting.</li>
        </ol>
      </GoldCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <GoldCard>
          <h3 className="text-sm font-bold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
            Contoh Foto Close Up & Full Body
          </h3>
          <p className="text-xs mb-3" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            Gunakan latar putih polos, pakaian formal hitam, dan pencahayaan jelas.
          </p>
          {participantResources.closeUpPhotoGuide ? (
            <p className="text-xs mb-3" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", whiteSpace: "pre-line" }}>
              {participantResources.closeUpPhotoGuide}
            </p>
          ) : null}
          <div className="space-y-4">
            <div>
              <p className="text-xs mb-2" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Contoh Close Up
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {closeUpExamples.map((item) => (
                  <div key={item.src} className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(200,162,77,0.3)" }}>
                    <NextImage src={item.src} alt={item.label} width={500} height={700} className="w-full h-auto" unoptimized />
                    <p className="text-[11px] px-2 py-1 text-center" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", background: "rgba(0,0,0,0.35)" }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {participantResources.fullBodyPhotoGuide ? (
              <p className="text-xs mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", whiteSpace: "pre-line" }}>
                {participantResources.fullBodyPhotoGuide}
              </p>
            ) : null}
            <div>
              <p className="text-xs mb-2" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                Contoh Full Body
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fullBodyExamples.map((item) => (
                  <div key={item.src} className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(200,162,77,0.3)" }}>
                    <NextImage src={item.src} alt={item.label} width={500} height={700} className="w-full h-auto" unoptimized />
                    <p className="text-[11px] px-2 py-1 text-center" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", background: "rgba(0,0,0,0.35)" }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GoldCard>

        <GoldCard>
          <h3 className="text-sm font-bold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
            Twibbon & Grup WhatsApp Peserta
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <NextImage
              src={twibbonThumbnail}
              alt="Twibbon Duta Wisata 2026"
              width={400}
              height={400}
              className="w-full h-auto rounded-xl border"
              style={{ borderColor: "rgba(200,162,77,0.3)" }}
              unoptimized
            />
            <NextImage
              src={whatsappThumbnail}
              alt="Thumbnail Grup WA Peserta"
              width={400}
              height={640}
              className="w-full h-auto rounded-xl border"
              style={{ borderColor: "rgba(200,162,77,0.3)" }}
              unoptimized
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <a
              href={twibbonDownloadLink}
              download
              className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg"
              style={{
                color: "#0F0F0F",
                background: "#C8A24D",
                fontFamily: "var(--font-poppins)",
                fontWeight: 600,
              }}
            >
              <Download size={12} /> Unduh Twibbon
            </a>
            <Link
              href={twibbonOpenLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg"
              style={{
                color: "#C8A24D",
                border: "1px solid rgba(200,162,77,0.35)",
                fontFamily: "var(--font-poppins)",
              }}
            >
              <ExternalLink size={12} /> Buka Link Twibbon
            </Link>
          </div>
          <p className="text-xs mb-2" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
            {participantResources.postingInstruction || "Wajib posting twibbon di Instagram dan mention akun resmi."}{" "}
            <strong>{mentionText}</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {hashtagItems.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(200,162,77,0.12)", color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
                <Hash size={10} className="inline mr-1" />
                {tag}
              </span>
            ))}
          </div>
          <Link href={whatsappGroupLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
            <MessageCircle size={12} /> Join Group WhatsApp Peserta <ExternalLink size={12} />
          </Link>
        </GoldCard>
      </div>

      <GoldCard>
        <h3 className="text-sm font-bold mb-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
          Kontak Admin
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          <p className="inline-flex items-center gap-2"><Phone size={13} style={{ color: "#C8A24D" }} /> 085869123178 (Encik Luthfi)</p>
          <p className="inline-flex items-center gap-2"><Phone size={13} style={{ color: "#C8A24D" }} /> 081992012712 (Puan Adys)</p>
        </div>
      </GoldCard>
    </div>
  );
}
