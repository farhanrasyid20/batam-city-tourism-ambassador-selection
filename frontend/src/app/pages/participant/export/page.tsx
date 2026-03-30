"use client";

import React, { useMemo, useState } from "react";
import NextImage from "next/image";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText } from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import type { StageStatus } from "../../../../data/mockData";
import ParticipantPdfDocument from "../components/ParticipantPdfDocument";

const statusLabel: Record<StageStatus, string> = {
  Pending: "Menunggu Verifikasi",
  Verified: "Lolos Administrasi",
  Rejected: "Ditolak",
  Audition: "Audition",
  Top20: "Top 20",
  PreCamp: "Pra-Karantina",
  Camp: "Karantina",
  GrandFinal: "Grand Final",
  Winner: "Pemenang",
};

export default function ExportPDFPage() {
  const { currentParticipant, user } = useApp();
  const [printing, setPrinting] = useState(false);

  const participant = currentParticipant;

  const canDownloadPdf = Boolean(
    participant &&
      ["Verified", "Audition", "Top20", "PreCamp", "Camp", "GrandFinal", "Winner"].includes(
        participant.status
      )
  );

  const documentItems = useMemo(
    () => [
      { label: "KTP", done: Boolean(participant?.nationalId) },
      { label: "Foto Close Up", done: Boolean(participant?.photo) },
      { label: "Foto Full Body", done: Boolean(participant?.photo) },
      { label: "Formulir S-01", done: Boolean(participant?.education) },
      { label: "Formulir S-02", done: Boolean(participant?.instagram) },
      { label: "Formulir S-03", done: Boolean(participant?.phone) },
      { label: "Formulir S-04", done: Boolean(participant?.birthDate && participant?.birthPlace) },
    ],
    [participant]
  );

  const doneCount = documentItems.filter((item) => item.done).length;

  const educationDisplay = useMemo(() => {
    const raw = participant?.education?.trim();
    if (!raw) return "-";
    const parts = raw.split(" - ").map((item) => item.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
      parts.pop();
    }
    return parts.join(" - ");
  }, [participant?.education]);

  const printedDate = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const assetBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const previewPhoto = participant?.photo || "/logo1.png";

  const handleGeneratePdf = async () => {
    if (!participant || !canDownloadPdf) return;

    setPrinting(true);

    try {
      const resolvedPhoto = participant.photo
        ? participant.photo.startsWith("http")
          ? participant.photo
          : `${assetBaseUrl}${participant.photo}`
        : `${assetBaseUrl}/logo1.png`;

      const blob = await pdf(
        <ParticipantPdfDocument
          participant={{
            ...participant,
            email: participant.email || user?.email || "-",
            photo: resolvedPhoto,
          }}
          printedDate={printedDate}
          educationDisplay={educationDisplay}
          documentItems={documentItems}
          doneCount={doneCount}
          statusLabel={statusLabel}
          logoSrc={`${assetBaseUrl}/logo1.png`}
        />
      ).toBlob();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `biodata-${participant.number || "peserta"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-cinzel)",
              color: "#C8A24D",
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            Export PDF Biodata
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
          >
            Tinjau biodata peserta terlebih dahulu sebelum mengunduh PDF.
          </p>
        </div>
        <GoldButton
          variant="primary"
          onClick={handleGeneratePdf}
          disabled={printing || !participant || !canDownloadPdf}
        >
          <Download size={16} />
          {printing ? "Memproses..." : "Download PDF"}
        </GoldButton>
      </div>

      <GoldCard className="mb-6">
        <div className="flex items-start gap-3">
          <FileText size={16} style={{ color: "#C8A24D", marginTop: 1 }} />
          <div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
            >
              Format PDF Biodata
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
            >
              PDF hanya bisa diunduh setelah peserta berhasil diverifikasi panitia.
              Dokumen yang dihasilkan hanya berisi ringkasan biodata peserta.
            </p>
          </div>
        </div>
      </GoldCard>

      {!canDownloadPdf ? (
        <GoldCard className="mb-6">
          <p className="text-sm" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
            PDF belum dapat diunduh. Status peserta harus sudah{" "}
            <strong style={{ color: "#C8A24D" }}>terverifikasi</strong>.
          </p>
        </GoldCard>
      ) : null}

      {participant ? (
        <GoldCard glow>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#0F0F0F",
              border: "1px solid rgba(200,162,77,0.35)",
            }}
          >
            <div
              className="p-5"
              style={{
                background: "linear-gradient(135deg, #1A1A1A, #101010)",
                borderBottom: "1px solid rgba(200,162,77,0.25)",
              }}
            >
              <div className="flex items-center gap-4">
                <NextImage
                  src="/logo1.png"
                  alt="Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                    PEMILIHAN DUTA WISATA KOTA BATAM
                  </p>
                  <p className="text-xs" style={{ color: "#E7D3A0", fontFamily: "var(--font-cinzel)" }}>
                    ENCIK & PUAN - 2026
                  </p>
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Dinas Kebudayaan dan Pariwisata Kota Batam
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Nomor Peserta
                  </p>
                  <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "1.1rem" }}>
                    {participant.number || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid md:grid-cols-[120px_1fr] gap-5 mb-5">
                <div>
                  <NextImage
                    src={previewPhoto}
                    alt="Foto Peserta"
                    width={120}
                    height={145}
                    unoptimized
                    className="w-[120px] h-[145px] object-cover rounded-xl"
                    style={{ border: "2px solid rgba(200,162,77,0.45)" }}
                  />
                </div>

                <div>
                  <h2
                    className="mb-3"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", fontWeight: 700 }}
                  >
                    {participant.name || user?.name || "Nama Peserta"}
                  </h2>

                  <div className="space-y-2">
                    {[
                      ["Kategori", participant.gender === "Encik" ? "ENCIK (Putra)" : "PUAN (Putri)"],
                      ["NIK", participant.nationalId || "-"],
                      [
                        "TTL",
                        participant.birthDate
                          ? `${participant.birthPlace || "-"}, ${participant.birthDate}`
                          : "-",
                      ],
                      ["Tinggi Badan", participant.heightCm ? `${participant.heightCm} cm` : "-"],
                      ["Pendidikan", educationDisplay],
                      ["Instagram", participant.instagram || "-"],
                      ["Email", participant.email || user?.email || "-"],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="grid grid-cols-[96px_12px_1fr] text-xs">
                        <span style={{ color: "#D9D9D9", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                          {label}
                        </span>
                        <span style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>:</span>
                        <span style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <p
                  className="mb-3 text-sm"
                  style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
                >
                  STATUS BERKAS ({doneCount}/{documentItems.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {documentItems.map((item) => (
                    <span
                      key={item.label}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        border: `1px solid ${item.done ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.28)"}`,
                        background: item.done ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)",
                        color: item.done ? "#22c55e" : "#ef4444",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {item.done ? "OK" : "X"} {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center justify-between gap-4"
                style={{
                  background: "rgba(200,162,77,0.08)",
                  border: "1px solid rgba(200,162,77,0.25)",
                }}
              >
                <div>
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Status Seleksi Saat Ini
                  </p>
                  <p style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                    {statusLabel[participant.status] || "Menunggu Verifikasi"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: "#8E8E8E", fontFamily: "var(--font-poppins)" }}>
                    Dicetak pada
                  </p>
                  <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    {printedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GoldCard>
      ) : null}
    </div>
  );
}
