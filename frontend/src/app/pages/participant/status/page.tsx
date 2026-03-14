"use client";

import React from "react";
import NextImage from "next/image";
import { CheckCircle, Clock, XCircle, Star, AlertCircle, Trophy } from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import type { StageStatus } from "../../../../data/mockData";
import GoldCard from "../../../../components/dashboard/GoldCard";

type TimelineState = "done" | "active" | "failed" | "pending";

// Urutan status seleksi untuk kebutuhan timeline.
const stageOrder: StageStatus[] = [
  "Pending",
  "Verified",
  "Audition",
  "Top20",
  "Camp",
  "GrandFinal",
  "Winner",
];

// Label status yang tampil ke peserta (bahasa Indonesia).
const statusDisplayMap: Record<StageStatus, string> = {
  Pending: "Menunggu Verifikasi",
  Verified: "Lolos Administrasi",
  Rejected: "Ditolak",
  Audition: "Audition",
  Top20: "Top 20",
  PreCamp: "Karantina",
  Camp: "Karantina",
  GrandFinal: "Grand Final",
  Winner: "Pemenang",
};

// Definisi tahapan seleksi yang ditampilkan dalam timeline.
const timelineStages = [
  {
    id: "administrasi",
    label: "Seleksi Administrasi",
    description: "Verifikasi kelengkapan berkas dan persyaratan oleh admin panitia.",
  },
  {
    id: "audition",
    label: "Tahap Audition",
    description: "Penilaian awal oleh dewan juri berdasarkan presentasi dan wawancara singkat.",
  },
  {
    id: "camp",
    label: "Tahap Karantina",
    description: "Penilaian intensif selama masa karantina oleh dewan juri.",
  },
  {
    id: "grand_final",
    label: "Grand Final",
    description: "Penampilan final dan pengumuman juara di depan dewan juri dan publik.",
  },
] as const;

// Mapping visual untuk badge state timeline.
const stateIcon: Record<TimelineState, React.ReactNode> = {
  done: <CheckCircle size={20} style={{ color: "#22c55e" }} />,
  active: <Star size={20} style={{ color: "#C8A24D" }} fill="#C8A24D" />,
  failed: <XCircle size={20} style={{ color: "#ef4444" }} />,
  pending: <Clock size={20} style={{ color: "#666" }} />,
};

const stateBorder: Record<TimelineState, string> = {
  done: "rgba(34,197,94,0.4)",
  active: "rgba(200,162,77,0.55)",
  failed: "rgba(239,68,68,0.4)",
  pending: "rgba(255,255,255,0.1)",
};

const stateBg: Record<TimelineState, string> = {
  done: "rgba(34,197,94,0.08)",
  active: "rgba(200,162,77,0.1)",
  failed: "rgba(239,68,68,0.08)",
  pending: "rgba(255,255,255,0.02)",
};

const stateColor: Record<TimelineState, string> = {
  done: "#22c55e",
  active: "#C8A24D",
  failed: "#ef4444",
  pending: "#666",
};

const stateLabel: Record<TimelineState, string> = {
  done: "LOLOS",
  active: "BERLANGSUNG",
  failed: "GUGUR",
  pending: "BELUM",
};

export default function ParticipantStatusPage() {
  // Ambil peserta aktif untuk ditampilkan statusnya.
  const { currentParticipant, participantList } = useApp();
  const participant = currentParticipant ?? participantList[0] ?? null;
  const currentStatus: StageStatus = participant?.status ?? "Pending";
  const currentStageIndex = stageOrder.indexOf(currentStatus);

  // Tentukan state tiap tahap berdasarkan status peserta saat ini.
  const getTimelineState = (stageId: (typeof timelineStages)[number]["id"]): TimelineState => {
    if (currentStatus === "Rejected") {
      return stageId === "administrasi" ? "failed" : "pending";
    }

    if (stageId === "administrasi") {
      if (currentStatus === "Pending") return "pending";
      return "done";
    }

    if (stageId === "audition") {
      if (currentStatus === "Audition") return "active";
      if (["Top20", "PreCamp", "Camp", "GrandFinal", "Winner"].includes(currentStatus)) return "done";
      return "pending";
    }

    if (stageId === "camp") {
      if (currentStatus === "PreCamp" || currentStatus === "Camp") return "active";
      if (["GrandFinal", "Winner"].includes(currentStatus)) return "done";
      return "pending";
    }

    if (stageId === "grand_final") {
      if (["GrandFinal", "Winner"].includes(currentStatus)) return "active";
      return "pending";
    }

    return "pending";
  };

  return (
    <div className="w-full">
      {/* Header halaman status seleksi */}
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#C8A24D", fontSize: "1.5rem", fontWeight: 700 }}>
          Status Seleksi
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Pantau perkembangan seleksi Anda secara real-time.
        </p>
      </div>

      {/* Ringkasan profil + status terkini peserta */}
      {participant ? (
        <GoldCard glow className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <NextImage
              src={participant.photo}
              alt={participant.name}
              width={64}
              height={64}
              unoptimized
              className="w-16 h-16 rounded-xl object-cover object-top flex-shrink-0"
              style={{ border: "2px solid rgba(200,162,77,0.35)" }}
            />

            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                {participant.number}
              </p>
              <h2 className="text-base font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                {participant.name}
              </h2>
              <p className="text-xs mt-1" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
                {participant.gender === "Encik" ? "ENCIK" : "PUAN"} - {participant.education || "Pendidikan belum diisi"}
              </p>
            </div>

            <div
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background:
                  currentStatus === "Winner"
                    ? "linear-gradient(135deg, rgba(245,208,111,0.2), rgba(200,162,77,0.2))"
                    : currentStatus === "Rejected"
                    ? "rgba(239,68,68,0.1)"
                    : currentStatus === "Pending"
                    ? "rgba(189,189,189,0.1)"
                    : "rgba(34,197,94,0.1)",
                border: `1px solid ${
                  currentStatus === "Winner"
                    ? "rgba(200,162,77,0.4)"
                    : currentStatus === "Rejected"
                    ? "rgba(239,68,68,0.3)"
                    : currentStatus === "Pending"
                    ? "rgba(189,189,189,0.2)"
                    : "rgba(34,197,94,0.3)"
                }`,
                color:
                  currentStatus === "Winner"
                    ? "#C8A24D"
                    : currentStatus === "Rejected"
                    ? "#ef4444"
                    : currentStatus === "Pending"
                    ? "#BDBDBD"
                    : "#22c55e",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              {statusDisplayMap[currentStatus]}
            </div>
          </div>
        </GoldCard>
      ) : null}

      {/* Timeline perjalanan tahap seleksi */}
      <div className="space-y-4 mb-8">
        {timelineStages.map((stage, index) => {
          const timelineState = getTimelineState(stage.id);
          return (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: stateBg[timelineState],
                    border: `2px solid ${stateBorder[timelineState]}`,
                  }}
                >
                  {stateIcon[timelineState]}
                </div>
                {index < timelineStages.length - 1 ? (
                  <div
                    className="w-0.5 flex-1 mt-2 min-h-6"
                    style={{
                      background: timelineState === "done" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)",
                    }}
                  />
                ) : null}
              </div>

              <div
                className="flex-1 rounded-2xl p-5 mb-4"
                style={{
                  background: stateBg[timelineState],
                  border: `1px solid ${stateBorder[timelineState]}`,
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold" style={{ color: stateColor[timelineState], fontFamily: "var(--font-cinzel)" }}>
                    {stage.label}
                  </h3>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-bold"
                    style={{
                      background: `${stateColor[timelineState]}20`,
                      color: stateColor[timelineState],
                      fontFamily: "var(--font-cinzel)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {stateLabel[timelineState]}
                  </span>
                </div>

                <p className="text-xs mt-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                  {stage.description}
                </p>

                {timelineState === "active" && stage.id === "grand_final" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <Trophy size={14} style={{ color: "#C8A24D" }} />
                    <p className="text-xs font-semibold" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
                      Selamat! Anda sudah mencapai Grand Final. Persiapkan penampilan terbaik Anda.
                    </p>
                  </div>
                ) : null}

                {timelineState === "pending" && stage.id === "administrasi" && currentStageIndex <= 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <AlertCircle size={14} style={{ color: "#BDBDBD" }} />
                    <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                      Pastikan semua berkas wajib telah diupload untuk mempercepat proses verifikasi.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informasi umum untuk peserta */}
      <GoldCard>
        <h3 className="text-sm font-bold mb-3" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
          Informasi Penting
        </h3>
        <ul className="space-y-2">
          {[
            "Status seleksi akan diperbarui secara berkala oleh panitia.",
            "Pastikan email Anda aktif untuk menerima notifikasi dari panitia.",
            "Jika ada pertanyaan, hubungi panitia melalui email atau WhatsApp resmi.",
            "Keputusan dewan juri dan panitia bersifat final.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              <Star size={10} fill="#C8A24D" style={{ color: "#C8A24D", marginTop: 3, flexShrink: 0 }} />
              {item}
            </li>
          ))}
        </ul>
      </GoldCard>
    </div>
  );
}

