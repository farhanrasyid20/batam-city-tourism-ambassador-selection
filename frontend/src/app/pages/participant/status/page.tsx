"use client";

import React from "react";
import NextImage from "next/image";
import { CheckCircle, Clock, XCircle, Star, AlertCircle, Trophy } from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import type { Participant, StageStatus } from "../../../../data/mockData";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { fetchParticipantBiodata } from "../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { API_BASE_URL, getReadableApiError } from "../../../../lib/api";

type TimelineState = "done" | "active" | "failed" | "pending";

// Urutan status seleksi untuk kebutuhan timeline.
const stageOrder: StageStatus[] = [
  "Pending",
  "Verified",
  "TechnicalMeeting",
  "Audition",
  "Top20",
  "PreCamp",
  "Camp",
  "GrandFinal",
  "Winner",
];

// Label status yang tampil ke peserta (bahasa Indonesia).
const statusDisplayMap: Record<StageStatus, string> = {
  Pending: "Menunggu Verifikasi",
  Verified: "Lolos Administrasi",
  TechnicalMeeting: "Technical Meeting",
  Rejected: "Ditolak",
  Audition: "Audition",
  Top20: "Top 20",
  PreCamp: "Pra-karantina",
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
    id: "technical_meeting",
    label: "Technical Meeting",
    description: "Briefing teknis jadwal, aturan, dan ketentuan audisi oleh panitia.",
  },
  {
    id: "audition",
    label: "Tahap Audition",
    description: "Penilaian awal oleh dewan juri berdasarkan presentasi dan wawancara singkat.",
  },
  {
    id: "pre_camp",
    label: "Tahap Pra-karantina",
    description: "Pembekalan awal, briefing teknis, dan evaluasi kesiapan peserta sebelum masuk masa karantina.",
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

const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");

function resolveParticipantPhotoUrl(photo?: string | null): string {
  const value = photo?.trim();
  if (!value) return "/default-avatar.svg";
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return value.startsWith("/") ? `${API_ORIGIN}${value}` : `${API_ORIGIN}/${value}`;
}

function mapSelectionStatusToStage(selectionStatus?: string | null, accountStatus?: string | null): StageStatus {
  const allowed: StageStatus[] = [
    "Pending",
    "Verified",
    "TechnicalMeeting",
    "Rejected",
    "Audition",
    "Top20",
    "PreCamp",
    "Camp",
    "GrandFinal",
    "Winner",
  ];

  if (selectionStatus && allowed.includes(selectionStatus as StageStatus)) {
    return selectionStatus as StageStatus;
  }

  return (accountStatus ?? "").toLowerCase() === "suspended" ? "Rejected" : "Pending";
}

function shouldShowAuditionNumber(status: StageStatus): boolean {
  return ["Verified", "TechnicalMeeting", "Audition", "Rejected"].includes(status);
}

function normalizeParticipantCode(
  participantCode?: string | null
): string {
  const explicitCode = (participantCode ?? "").trim();
  if (explicitCode) return explicitCode;
  return "-";
}

export default function ParticipantStatusPage() {
  // Ambil peserta aktif untuk ditampilkan statusnya.
  const {
    currentParticipant,
    participantList,
    voteTopList,
    voteRankingPublished,
    judgeEncikWinnerList,
    judgePuanWinnerList,
    judgePairRankingList,
    judgeEncikPublished,
    judgePuanPublished,
    judgePairPublished,
    setCurrentParticipant,
    setParticipantList,
  } = useApp();
  const participant = currentParticipant;
  const currentStatus: StageStatus = participant?.status ?? "Pending";
  const showAuditionNumber = shouldShowAuditionNumber(currentStatus);
  const effectiveParticipantCode = normalizeParticipantCode(
    participant?.participantCode
  );
  const currentStageIndex = stageOrder.indexOf(currentStatus);
  const isAdminVerificationInProgress = Boolean(
    participant?.submittedToAdmin && currentStatus === "Pending"
  );
  const [syncError, setSyncError] = React.useState("");

  const winnerHighlights = React.useMemo(() => {
    if (!participant) return [] as Array<{ id: string; title: string; detail: string }>;

    const participantId = participant.id;
    const participantNumber = participant.number;
    const isSameParticipant = (candidateId?: string, candidateNumber?: string) =>
      Boolean(
        (candidateId && candidateId === participantId) ||
          (candidateNumber && candidateNumber === participantNumber)
      );

    const highlights: Array<{ id: string; title: string; detail: string }> = [];

    if (judgeEncikPublished) {
      const winner = judgeEncikWinnerList.find((item) =>
        isSameParticipant(item.participantId, item.number)
      );
      if (winner) {
        highlights.push({
          id: `encik-${winner.rank}`,
          title: `Juara Encik Versi Juri #${winner.rank}`,
          detail: `Dipublikasikan panitia dengan nilai ${winner.totalScore.toFixed(2)}.`,
        });
      }
    }

    if (judgePuanPublished) {
      const winner = judgePuanWinnerList.find((item) =>
        isSameParticipant(item.participantId, item.number)
      );
      if (winner) {
        highlights.push({
          id: `puan-${winner.rank}`,
          title: `Juara Puan Versi Juri #${winner.rank}`,
          detail: `Dipublikasikan panitia dengan nilai ${winner.totalScore.toFixed(2)}.`,
        });
      }
    }

    if (judgePairPublished) {
      const pair = judgePairRankingList.find(
        (item) =>
          item.encikParticipantId === participantId || item.puanParticipantId === participantId
      );
      if (pair) {
        const partnerId =
          pair.encikParticipantId === participantId ? pair.puanParticipantId : pair.encikParticipantId;
        const partner = participantList.find((item) => item.id === partnerId);
        highlights.push({
          id: `pair-${pair.rank}`,
          title: `Juara Pasangan Versi Juri #${pair.rank}`,
          detail: partner
            ? `Pasangan resmi Anda: ${partner.name}.`
            : "Pasangan resmi ditetapkan oleh panitia.",
        });
      }
    }

    if (voteRankingPublished) {
      const voteWinner = voteTopList.find((item) =>
        isSameParticipant(item.participantId, item.number)
      );
      if (voteWinner) {
        highlights.push({
          id: `vote-${voteWinner.rank}`,
          title: `Juara Vote Terfavorit #${voteWinner.rank}`,
          detail: `Perolehan publikasi terakhir: ${voteWinner.voteCount.toLocaleString("id-ID")} like.`,
        });
      }
    }

    return highlights;
  }, [
    judgeEncikPublished,
    judgeEncikWinnerList,
    judgePairPublished,
    judgePairRankingList,
    judgePuanPublished,
    judgePuanWinnerList,
    participant,
    participantList,
    voteRankingPublished,
    voteTopList,
  ]);

  React.useEffect(() => {
    const token = getParticipantAuthSession()?.token;
    if (!token) return;

    let cancelled = false;
    const syncStatus = async () => {
      try {
        const response = await fetchParticipantBiodata(token);
        if (cancelled) return;

        const data = response.data;
        const mappedStatus = mapSelectionStatusToStage(data.selection_status, data.account_status);

        setCurrentParticipant((prev) => {
          const auditionNumber = data.audition_number ?? data.participant_number ?? prev?.auditionNumber ?? prev?.number ?? "-";
          const participantCode = data.participant_code ?? prev?.participantCode;
          const fallback: Participant = {
            id: `P_API_${data.id}`,
            number: participantCode ?? auditionNumber,
            auditionNumber,
            participantCode,
            name: data.name ?? "Peserta",
            gender: data.gender ?? "Encik",
            nationalId: data.national_id ?? "",
            birthPlace: data.birth_place ?? "",
            birthDate: data.birth_date ?? "",
            heightCm: data.height_cm ?? 0,
            education: [data.education_category, data.education_institution, data.education_degree, data.education_major]
              .filter(Boolean)
              .join(" - "),
            instagram: data.instagram ?? "",
            phone: data.phone ?? "",
            email: (data.email ?? "").toLowerCase(),
            photo: data.photo ?? "",
            status: mappedStatus,
            registeredAt: new Date().toISOString().slice(0, 10),
            scores: [],
            eliminatedInAudition: data.eliminated_in_audition ?? false,
          };

          return {
            ...(prev ?? fallback),
            ...fallback,
            ...(prev ?? {}),
            status: mappedStatus,
            number: participantCode ?? auditionNumber,
            auditionNumber,
            participantCode,
            eliminatedInAudition: data.eliminated_in_audition ?? prev?.eliminatedInAudition ?? false,
            photo: data.photo ?? prev?.photo ?? "",
          };
        });

        setParticipantList((prev) =>
          prev.map((item) =>
            item.id === `P_API_${data.id}` || item.email.toLowerCase() === (data.email ?? "").toLowerCase()
              ? {
                  ...item,
                  status: mappedStatus,
                  number: data.participant_code ?? data.audition_number ?? data.participant_number ?? item.number,
                  auditionNumber: data.audition_number ?? data.participant_number ?? item.auditionNumber ?? item.number,
                  participantCode: data.participant_code ?? item.participantCode,
                  eliminatedInAudition: data.eliminated_in_audition ?? item.eliminatedInAudition ?? false,
                  photo: data.photo ?? item.photo,
                }
              : item
          )
        );

        setSyncError("");
      } catch (error) {
        if (!cancelled) {
          setSyncError(getReadableApiError(error));
        }
      }
    };

    void syncStatus();

    return () => {
      cancelled = true;
    };
  }, [setCurrentParticipant, setParticipantList]);

  // Tentukan state tiap tahap berdasarkan status peserta saat ini.
  const getTimelineState = (stageId: (typeof timelineStages)[number]["id"]): TimelineState => {
    if (currentStatus === "Rejected") {
      if (participant?.eliminatedInAudition) {
        if (stageId === "administrasi") return "done";
        if (stageId === "audition") return "failed";
        return "pending";
      }
      return stageId === "administrasi" ? "failed" : "pending";
    }

    if (stageId === "administrasi") {
      if (currentStatus === "Pending") return isAdminVerificationInProgress ? "active" : "pending";
      return "done";
    }

    if (stageId === "audition") {
      if (currentStatus === "Audition") return "active";
      if (["Top20", "PreCamp", "Camp", "GrandFinal", "Winner"].includes(currentStatus)) return "done";
      return "pending";
    }

    if (stageId === "technical_meeting") {
      if (currentStatus === "TechnicalMeeting") return "active";
      if (["Audition", "Top20", "PreCamp", "Camp", "GrandFinal", "Winner"].includes(currentStatus)) return "done";
      return "pending";
    }

    if (stageId === "pre_camp") {
      if (currentStatus === "PreCamp") return "active";
      if (["Camp", "GrandFinal", "Winner"].includes(currentStatus)) return "done";
      return "pending";
    }

    if (stageId === "camp") {
      if (currentStatus === "Camp") return "active";
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
        {syncError ? (
          <p className="text-xs mt-2" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
            Gagal sinkron status dari backend: {syncError}
          </p>
        ) : null}
      </div>

      {/* Ringkasan profil + status terkini peserta */}
      {participant ? (
        <GoldCard glow className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <NextImage
              src={resolveParticipantPhotoUrl(participant.photo)}
              alt={participant.name}
              width={64}
              height={64}
              unoptimized
              className="w-16 h-16 rounded-xl object-cover object-top flex-shrink-0"
              style={{ border: "2px solid rgba(200,162,77,0.35)" }}
            />

            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                {showAuditionNumber
                  ? `No. Audisi: ${participant.auditionNumber ?? participant.number} | Kode Peserta: ${effectiveParticipantCode}`
                  : "Nomor seleksi: Menunggu verifikasi admin"}
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
                    : isAdminVerificationInProgress
                    ? "rgba(200,162,77,0.12)"
                    : currentStatus === "Pending"
                    ? "rgba(189,189,189,0.1)"
                    : "rgba(34,197,94,0.1)",
                border: `1px solid ${
                  currentStatus === "Winner"
                    ? "rgba(200,162,77,0.4)"
                    : currentStatus === "Rejected"
                    ? "rgba(239,68,68,0.3)"
                    : isAdminVerificationInProgress
                    ? "rgba(200,162,77,0.35)"
                    : currentStatus === "Pending"
                    ? "rgba(189,189,189,0.2)"
                    : "rgba(34,197,94,0.3)"
                }`,
                color:
                  currentStatus === "Winner"
                    ? "#C8A24D"
                    : currentStatus === "Rejected"
                    ? "#ef4444"
                    : isAdminVerificationInProgress
                    ? "#C8A24D"
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

      {participant ? (
        <GoldCard className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: "#C8A24D" }} />
            <h3 className="text-sm font-bold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
              Pencapaian Juara
            </h3>
          </div>

          {winnerHighlights.length > 0 ? (
            <div className="space-y-2">
              {winnerHighlights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl px-3 py-2"
                  style={{
                    border: "1px solid rgba(34,197,94,0.35)",
                    background: "rgba(34,197,94,0.08)",
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#22c55e", fontFamily: "var(--font-cinzel)" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Belum ada status juara yang dipublikasikan untuk akun Anda.
            </p>
          )}
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

                {timelineState === "active" && stage.id === "administrasi" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <Clock size={14} style={{ color: "#C8A24D" }} />
                    <p className="text-xs" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
                      Berkas Anda sudah dikirim dan sedang dalam proses verifikasi administrasi oleh panitia.
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

