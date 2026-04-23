"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  FileText,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  Upload,
  CheckCircle,
  BookOpenCheck,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "../../../../context/AppContext";
import { statusLabelsId, type Participant, type StageStatus } from "../../../../data/mockData";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import {
  submitParticipantDocuments,
  type ParticipantDocumentsResponse,
} from "../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { getReadableApiError, resolveApiAssetUrl } from "../../../../lib/api";

/**
 * Mengubah rasio menjadi persentase integer.
 */
function toPercent(filled: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Menentukan indeks urutan stage berdasarkan status peserta.
 */
function getStageIndex(status: string): number {
  if (status === "PreCamp") return 3;
  const order = ["Verified", "TechnicalMeeting", "Audition", "Camp", "GrandFinal", "Winner"];
  if (status === "Camp") return 4;
  if (status === "GrandFinal") return 5;
  if (status === "Winner") return 6;
  return order.findIndex((s) => s === status);
}

function shouldShowAuditionNumber(status: StageStatus): boolean {
  return ["Verified", "TechnicalMeeting", "Audition", "Rejected"].includes(status);
}

function shouldShowParticipantCode(status: StageStatus): boolean {
  return ["PreCamp", "Camp", "GrandFinal", "Winner"].includes(status);
}

function normalizeParticipantCode(
  participantCode?: string | null
): string {
  const explicitCode = (participantCode ?? "").trim();
  if (explicitCode) return explicitCode;
  return "-";
}

function getSelectionNumberForDisplay(participant: Participant | null): string {
  if (!participant) return "-";
  const audition = (participant.auditionNumber ?? "").trim();
  if (audition) return audition;
  const code = (participant.participantCode ?? "").trim();
  if (code) return code;
  return participant.number?.trim() || "-";
}

/**
 * Dashboard utama peserta.
 * Menampilkan progres pendaftaran, identitas seleksi, dan ringkasan status akun.
 */
export default function ParticipantDashboardPage() {
  // Router dan context utama peserta.
  const router = useRouter();
  const { user, currentParticipant, setCurrentParticipant, setParticipantList } = useApp();
  const [submitInfo, setSubmitInfo] = useState("");
  const [submitInfoType, setSubmitInfoType] = useState<"success" | "error">("error");
  const [dismissedAlertId, setDismissedAlertId] = useState("");
  const [resubmittedKeys, setResubmittedKeys] = useState<string[]>([]);
  const [isSubmittingToAdmin, setIsSubmittingToAdmin] = useState(false);

  // Peserta aktif, fallback ke data pertama untuk mode demo.
  const participant = currentParticipant;
  const greetingName = participant?.name || user?.name || "Peserta";
  const verificationIssues = participant?.verificationIssues ?? [];
  const revisionStorageKey = participant ? `participant-revision-uploads:${participant.id}` : "";
  const revisedIssueCount = verificationIssues.filter((issue) => resubmittedKeys.includes(issue.target)).length;
  const hasVerificationIssues = verificationIssues.length > 0;
  const allRevisionItemsReady = hasVerificationIssues && revisedIssueCount === verificationIssues.length;

  // Mapping tampilan status seleksi ke warna/icon.
  const statusConfig = useMemo(
    () => ({
      Pending: { color: "#BDBDBD", bg: "rgba(189,189,189,0.1)", icon: <Clock size={14} /> },
      Verified: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: <CheckCircle size={14} /> },
      Rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: <AlertCircle size={14} /> },
      TechnicalMeeting: { color: "#0ea5e9", bg: "rgba(14,165,233,0.1)", icon: <Clock size={14} /> },
      Audition: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: <Star size={14} /> },
      Top20: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: <Star size={14} /> },
      PreCamp: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: <Star size={14} /> },
      Camp: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", icon: <Star size={14} /> },
      GrandFinal: {
        color: "#C8A24D",
        bg: "rgba(200,162,77,0.1)",
        icon: <Star size={14} fill="#C8A24D" />,
      },
      Winner: {
        color: "#C8A24D",
        bg: "rgba(200,162,77,0.1)",
        icon: <Star size={14} fill="#C8A24D" />,
      },
    }),
    []
  );

  // Ringkasan dokumen untuk progress dashboard.
  const uploadedDocumentKeys = new Set(
    (participant?.documents ?? [])
      .filter((doc) => doc.status === "submitted" || doc.status === "verified")
      .map((doc) => doc.key)
  );
  const requiredDocuments = participant
    ? [
        { label: "KTP / NIK", done: uploadedDocumentKeys.has("identityCard") },
        { label: "Foto Close Up", done: uploadedDocumentKeys.has("closeUpPhoto") },
        { label: "Foto Full Body", done: uploadedDocumentKeys.has("fullBodyPhoto") },
      ]
    : [];

  const completedDocuments = requiredDocuments.filter((d) => d.done).length;
  const documentProgress = toPercent(completedDocuments, requiredDocuments.length);

  // Ringkasan field biodata untuk progress dashboard.
  const profileFields = participant
    ? [
        participant.name,
        participant.nationalId,
        participant.birthPlace,
        participant.birthDate,
        participant.heightCm ? String(participant.heightCm) : "",
        participant.education,
        participant.instagram,
        participant.phone,
        participant.email,
        participant.agreementNoAgency ?? "",
        participant.agreementParentPermission ?? "",
        participant.agreementAllStages ?? "",
        participant.motivationStatement ?? "",
        participant.contributionIdea ?? "",
        participant.publicSpeakingExperience ?? "",
      ]
    : [];

  // Kalkulasi progress dan syarat submit ke admin.
  const filledProfile = profileFields.filter((v) => Boolean(v)).length;
  const profileProgress = toPercent(filledProfile, profileFields.length);
  const overallProgress = Math.round((profileProgress + documentProgress) / 2);
  const alreadySubmitted = Boolean(participant?.submittedToAdmin);
  const canSubmitFresh =
    Boolean(participant) && profileProgress === 100 && documentProgress === 100 && !alreadySubmitted;
  const canResubmitToAdmin =
    Boolean(participant) && profileProgress === 100 && documentProgress === 100 && allRevisionItemsReady;
  const canSubmitEditAfterSent =
    Boolean(participant) &&
    alreadySubmitted &&
    profileProgress === 100 &&
    documentProgress === 100 &&
    !hasVerificationIssues;
  const canSubmitToAdmin =
    (hasVerificationIssues ? canResubmitToAdmin : canSubmitFresh || canSubmitEditAfterSent) &&
    !participant?.eliminatedInAudition;
  const submitButtonLabel = hasVerificationIssues
    ? "Kirim Ulang ke Admin"
    : alreadySubmitted
    ? "Kirim Editan ke Admin"
    : canSubmitToAdmin
    ? "Kirim Seleksi Admin"
    : profileProgress < 100
    ? "Lengkapi Biodata Dulu"
    : "Lengkapi Berkas Dulu";

  const statusValue = participant?.status ?? "Pending";
  const statusInfo = statusConfig[statusValue];
  const showAuditionNumber = shouldShowAuditionNumber(statusValue);
  const showParticipantCode = shouldShowParticipantCode(statusValue);
  const effectiveParticipantCode = normalizeParticipantCode(
    participant?.participantCode
  );
  const stageIndex = getStageIndex(statusValue);

  // Tahapan utama proses seleksi.
  const stages = [
    { label: "Administrasi", index: 0 },
    { label: "Technical Meeting", index: 1 },
    { label: "Audisi", index: 2 },
    { label: "Pra-karantina", index: 3 },
    { label: "Karantina", index: 4 },
    { label: "Grand Final", index: 5 },
    { label: "Juara", index: 6 },
  ];

  const participantAlert = participant
    ? verificationIssues.length > 0
      ? {
          id: allRevisionItemsReady ? "revision-ready" : "revision-note",
          title: allRevisionItemsReady ? "Perbaikan Siap Dikirim Ulang" : "Perlu Revisi Berkas",
          message: allRevisionItemsReady
            ? "Semua dokumen yang diminta sudah diupload ulang. Anda bisa mengirim kembali perbaikan ke admin untuk verifikasi ulang."
            : `${verificationIssues.length} berkas memerlukan perbaikan. Silakan buka halaman dokumen untuk melihat catatan admin dan upload ulang file yang diminta.`,
          actionLabel: allRevisionItemsReady ? "Kirim Ulang Sekarang" : "Perbaiki Berkas",
          actionHref: "/pages/participant/dokumen",
          color: allRevisionItemsReady ? "#F5D06F" : "#ef4444",
          background: allRevisionItemsReady ? "rgba(245,208,111,0.08)" : "rgba(239,68,68,0.08)",
          border: allRevisionItemsReady ? "rgba(245,208,111,0.3)" : "rgba(239,68,68,0.3)",
        }
      : participant.submittedToAdmin && participant.status === "Pending"
      ? {
          id: "pending-review",
          title: "Menunggu Verifikasi Admin",
          message: "Data dan berkas Anda sudah dikirim. Mohon tunggu proses verifikasi dari panitia.",
          actionLabel: "Lihat Status",
          actionHref: "/pages/participant/status",
          color: "#C8A24D",
          background: "rgba(200,162,77,0.08)",
          border: "rgba(200,162,77,0.28)",
        }
      : participant.status === "Verified"
      ? {
          id: "verified",
          title: "Administrasi Terverifikasi",
          message: "Berkas Anda telah dinyatakan lengkap. Silakan pantau perkembangan tahapan seleksi berikutnya.",
          actionLabel: "Pantau Seleksi",
          actionHref: "/pages/participant/status",
          color: "#22c55e",
          background: "rgba(34,197,94,0.08)",
          border: "rgba(34,197,94,0.28)",
        }
      : null
    : null;

  useEffect(() => {
    if (!revisionStorageKey || typeof window === "undefined") return;

    const syncFromStorage = () => {
      const saved = window.localStorage.getItem(revisionStorageKey);
      if (!saved) {
        setResubmittedKeys([]);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        setResubmittedKeys(Array.isArray(parsed) ? parsed : []);
      } catch {
        setResubmittedKeys([]);
      }
    };

    syncFromStorage();
    window.addEventListener("focus", syncFromStorage);
    return () => window.removeEventListener("focus", syncFromStorage);
  }, [revisionStorageKey]);

  const activeDismissedAlertId =
    participantAlert?.id && dismissedAlertId === participantAlert.id ? dismissedAlertId : "";

  // Panduan penggunaan dashboard untuk peserta baru.
  const usageGuide = [
    {
      title: "Lengkapi Biodata",
      description: "Isi data diri peserta selengkap mungkin hingga progress biodata 100%.",
      cta: "Buka Biodata",
      onClick: () => router.push("/pages/participant/biodata"),
      icon: <BookOpenCheck size={16} />,
    },
    {
      title: "Upload Berkas Wajib",
      description: "Unggah semua dokumen wajib sesuai format dan ukuran file yang ditentukan.",
      cta: "Buka Dokumen",
      onClick: () => router.push("/pages/participant/dokumen"),
      icon: <Upload size={16} />,
    },
    {
      title: hasVerificationIssues ? "Kirim Ulang Perbaikan" : "Kirim ke Admin",
      description: hasVerificationIssues
        ? "Setelah semua berkas revisi diupload ulang, kirim kembali perbaikan agar panitia dapat memverifikasi ulang data Anda."
        : "Jika biodata dan berkas sudah 100%, kirim data untuk proses verifikasi panitia.",
      cta: hasVerificationIssues ? "Kirim Ulang" : "Kirim Sekarang",
      onClick: handleSubmitToAdmin,
      icon: <Send size={16} />,
    },
    {
      title: "Perbaikan Dokumen",
      description: "Jika admin memberi catatan revisi, buka halaman dokumen lalu upload ulang hanya file yang diminta.",
      cta: "Cek Dokumen",
      onClick: () => router.push("/pages/participant/dokumen"),
      icon: <AlertCircle size={16} />,
    },
    {
      title: "Pantau Status Seleksi",
      description: "Cek perkembangan tahap seleksi dan notifikasi hasil dari panitia.",
      cta: "Lihat Status",
      onClick: () => router.push("/pages/participant/status"),
      icon: <ShieldCheck size={16} />,
    },
    {
      title: "Export PDF",
      description: "Unduh ringkasan data pendaftaran dalam format PDF untuk arsip pribadi.",
      cta: "Buka Export",
      onClick: () => router.push("/pages/participant/export"),
      icon: <FileText size={16} />,
    },
  ];

  const syncAfterSubmit = (data: ParticipantDocumentsResponse["data"]) => {
    const normalizedDocs =
      data.documents?.map((doc) => ({
        key: doc.key,
        label: doc.label,
        status:
          doc.status === "verified" || doc.status === "revision_required" || doc.status === "missing"
            ? doc.status
            : ("submitted" as const),
        note: doc.note ?? undefined,
        url: resolveApiAssetUrl(doc.url) ?? doc.url ?? undefined,
        mimeType: doc.mime_type ?? undefined,
        originalName: doc.original_name ?? undefined,
      })) ?? [];

    const updateParticipant = (base: Participant): Participant => {
      const auditionNumber = data.audition_number ?? data.participant_number ?? base.auditionNumber ?? base.number;
      const participantCode = data.participant_code ?? base.participantCode;
      return {
        ...base,
        number: participantCode ?? auditionNumber ?? base.number ?? "-",
        auditionNumber: auditionNumber ?? base.auditionNumber ?? base.number ?? "-",
        participantCode,
        documents: normalizedDocs,
        submittedToAdmin: data.submitted_to_admin,
        eliminatedInAudition: data.eliminated_in_audition ?? base.eliminatedInAudition ?? false,
      };
    };

    setCurrentParticipant((prev) => (prev ? updateParticipant(prev) : prev));
    setParticipantList((prev) =>
      prev.map((item) =>
        item.id === participant?.id ? updateParticipant(item) : item
      )
    );
  };

  // Toast submit admin akan hilang otomatis.
  useEffect(() => {
    if (!submitInfo) return;
    const timer = window.setTimeout(() => setSubmitInfo(""), 3000);
    return () => window.clearTimeout(timer);
  }, [submitInfo]);

  // Kirim data peserta ke admin jika semua syarat lengkap.
  async function handleSubmitToAdmin() {
    if (isSubmittingToAdmin) return;

    if (participant?.eliminatedInAudition) {
      setSubmitInfoType("error");
      setSubmitInfo("Anda tereliminasi di tahap audisi dan tidak bisa melanjutkan ke tahap berikutnya.");
      return;
    }

    if (hasVerificationIssues && !allRevisionItemsReady) {
      setSubmitInfoType("error");
      setSubmitInfo("Upload ulang semua berkas revisi yang diminta sebelum mengirim kembali ke admin.");
      return;
    }

    if (!participant || !canSubmitToAdmin) {
      setSubmitInfoType("error");
      if (!participant) {
        setSubmitInfo("Data peserta belum tersedia. Silakan refresh halaman.");
        return;
      }

      if (profileProgress < 100) {
        setSubmitInfo(`Biodata baru ${profileProgress}%. Lengkapi biodata dulu sebelum kirim ke admin.`);
        router.push("/pages/participant/biodata");
        return;
      }

      if (documentProgress < 100) {
        setSubmitInfo(
          `Upload berkas wajib baru ${documentProgress}%. Lengkapi KTP, foto close up, dan foto full body dulu.`
        );
        router.push("/pages/participant/dokumen");
        return;
      }

      setSubmitInfo("Lengkapi biodata dan dokumen sampai 100% sebelum kirim ke admin.");
      return;
    }

    const token = getParticipantAuthSession()?.token;
    if (!token) {
      setSubmitInfoType("error");
      setSubmitInfo("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsSubmittingToAdmin(true);
    try {
      const isEditResubmission = alreadySubmitted && !hasVerificationIssues;
      const response = await submitParticipantDocuments(token);
      syncAfterSubmit(response.data);
      setSubmitInfoType("success");
      setSubmitInfo(
        isEditResubmission
          ? "Perubahan data berhasil dikirim ulang ke admin."
          : response.message || "Data berhasil dikirim ke admin."
      );
    } catch (error) {
      setSubmitInfoType("error");
      setSubmitInfo(getReadableApiError(error));
    } finally {
      setIsSubmittingToAdmin(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        {/* Header halaman dashboard peserta */}
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "#C8A24D",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Dashboard Peserta
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Selamat datang, <strong style={{ color: "#F5E6C8" }}>{greetingName}</strong>!
        </p>
      </div>

      {participant && statusInfo ? (
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3"
          style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.color}40` }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color: statusInfo.color }}>{statusInfo.icon}</span>
            <div>
              <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                Status Seleksi
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: statusInfo.color, fontFamily: "var(--font-cinzel)" }}
              >
                {statusLabelsId[participant.status]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                {showAuditionNumber || showParticipantCode ? "No. Audisi" : "Nomor Seleksi"}
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
              >
                {showAuditionNumber || showParticipantCode
                  ? getSelectionNumberForDisplay(participant)
                  : "Menunggu verifikasi admin"}
              </p>
            </div>
            {showParticipantCode ? (
              <div className="text-right">
                <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  Kode Peserta
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: "#22c55e", fontFamily: "var(--font-cinzel)" }}
                >
                  {effectiveParticipantCode}
                </p>
              </div>
            ) : null}
            <div
              className="px-3 py-1 rounded-full text-xs capitalize font-semibold"
              style={{
                background: "rgba(200,162,77,0.15)",
                color: "#C8A24D",
                fontFamily: "var(--font-cinzel)",
              }}
            >
              {participant.gender === "Encik" ? "ENCIK" : "PUAN"}
            </div>
          </div>
        </div>
      ) : null}

      {participantAlert && activeDismissedAlertId !== participantAlert.id ? (
        <div
          className="mb-6 rounded-2xl p-4"
          style={{
            background: participantAlert.background,
            border: `1px solid ${participantAlert.border}`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p
                className="text-sm font-bold"
                style={{ color: participantAlert.color, fontFamily: "var(--font-cinzel)" }}
              >
                {participantAlert.title}
              </p>
              <p
                className="text-sm mt-1 leading-relaxed"
                style={{ color: "#E5E5E5", fontFamily: "var(--font-poppins)" }}
              >
                {participantAlert.message}
              </p>
              <button
                type="button"
                onClick={() => router.push(participantAlert.actionHref)}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: "rgba(15,15,15,0.5)",
                  border: `1px solid ${participantAlert.border}`,
                  color: participantAlert.color,
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {participantAlert.actionLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDismissedAlertId(participantAlert.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(0,0,0,0.18)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#BDBDBD",
              }}
              title="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Banner khusus jika peserta berstatus ditolak */}
      {participant?.status === "Rejected" ? (
        <div
          className="mb-6 rounded-xl p-3"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.35)",
          }}
        >
          <p className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
            Alasan penolakan: {participant.rejectionReason ??
              (participant.eliminatedInAudition
                ? "Anda tereliminasi pada tahap audisi dan tidak dapat melanjutkan ke tahapan berikutnya."
                : "Berkas atau data belum memenuhi ketentuan panitia. Silakan perbaiki dan kirim ulang sesuai arahan admin.")}
          </p>
        </div>
      ) : null}

      {/* Kartu statistik ringkas progress peserta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Kelengkapan Biodata",
            value: `${profileProgress}%`,
            icon: <User size={18} />,
            color: "#3b82f6",
          },
          {
            label: "Upload Berkas",
            value: `${completedDocuments}/${requiredDocuments.length}`,
            icon: <FileText size={18} />,
            color: "#22c55e",
          },
          {
            label: "Progress Overall",
            value: `${overallProgress}%`,
            icon: <TrendingUp size={18} />,
            color: "#C8A24D",
          },
          {
            label: "Tahap Seleksi",
            value: statusLabelsId[statusValue as keyof typeof statusLabelsId] ?? "-",
            icon: <Star size={18} />,
            color: "#8b5cf6",
          },
        ].map((stat, index) => (
          <GoldCard key={index} className="text-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: `${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p className="text-base lg:text-xl font-bold mb-1" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              {stat.label}
            </p>
          </GoldCard>
        ))}
      </div>

      {/* Card tata cara penggunaan aplikasi untuk peserta */}
      <GoldCard className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
              Tata Cara Penggunaan Aplikasi
            </h3>
            <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Ikuti urutan ini agar pendaftaran Anda cepat diverifikasi panitia.
            </p>
          </div>
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{ color: "#C8A24D", background: "rgba(200,162,77,0.12)", border: "1px solid rgba(200,162,77,0.24)" }}
          >
            Langkah {usageGuide.length}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {usageGuide.map((item, index) => (
            <div
              key={item.title}
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(200,162,77,0.18)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(200,162,77,0.15)", color: "#C8A24D" }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                      Langkah {index + 1}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                      {item.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <GoldButton variant="outline" size="sm" onClick={item.onClick}>
                  {item.cta}
                </GoldButton>
              </div>
            </div>
          ))}
        </div>
      </GoldCard>

      {/* Kolom progress pendaftaran + timeline seleksi */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <GoldCard glow>
          <h3 className="text-sm font-bold mb-5" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
            Kelengkapan Pendaftaran
          </h3>

          {[
            {
              label: "Biodata",
              progress: profileProgress,
              bar: "linear-gradient(90deg, #F5D06F, #C8A24D)",
            },
            {
              label: "Upload Berkas Wajib",
              progress: documentProgress,
              bar: "linear-gradient(90deg, #22c55e, #16a34a)",
            },
            {
              label: "Keseluruhan",
              progress: overallProgress,
              bar: "linear-gradient(90deg, #F5D06F, #C8A24D, #8C6A1C)",
            },
          ].map((item, index) => (
            <div key={item.label} className={index < 2 ? "mb-4" : "mb-5"}>
              <div className="flex justify-between text-xs mb-2" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                <span>{item.label}</span>
                <span>{item.progress}%</span>
              </div>
              <div className={index < 2 ? "h-2 rounded-full" : "h-3 rounded-full"} style={{ background: "#2A2A2A" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.progress}%`, background: item.bar }}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <GoldButton variant="primary" size="sm" onClick={() => router.push("/pages/participant/biodata")}>
              Isi Biodata
            </GoldButton>
            <GoldButton variant="outline" size="sm" onClick={() => router.push("/pages/participant/dokumen")}>
              {hasVerificationIssues ? "Perbaiki Berkas" : "Upload Berkas"}
            </GoldButton>
            <GoldButton variant="primary" size="sm" onClick={handleSubmitToAdmin} disabled={isSubmittingToAdmin}>
              {isSubmittingToAdmin ? "Mengirim..." : submitButtonLabel}
            </GoldButton>
          </div>
          {!canSubmitToAdmin && !alreadySubmitted && !hasVerificationIssues ? (
            <p className="mt-2 text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Kirim seleksi akan diproses saat Biodata 100% dan Upload Berkas Wajib 100%. Jika belum lengkap, Anda akan diarahkan ke halaman yang perlu dilengkapi.
            </p>
          ) : null}
          {hasVerificationIssues ? (
            <p
              className="mt-2 text-xs"
              style={{
                color: allRevisionItemsReady ? "#F5D06F" : "#BDBDBD",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {allRevisionItemsReady
                ? "Semua dokumen revisi sudah diupload ulang. Silakan kirim kembali perbaikan ke admin."
                : `Masih ada ${verificationIssues.length - revisedIssueCount} dokumen revisi yang perlu diupload ulang sebelum bisa kirim kembali.`}
            </p>
          ) : alreadySubmitted ? (
            <p className="mt-2 text-xs" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>
              Data sudah dikirim ke admin. Jika Anda memperbarui biodata/berkas, klik tombol Kirim Editan ke Admin untuk mengirim versi terbaru.
            </p>
          ) : null}
        </GoldCard>

        <GoldCard>
          <h3 className="text-sm font-bold mb-5" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
            Alur Tahapan Seleksi
          </h3>
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const state =
                participant?.status === "Rejected"
                  ? participant?.eliminatedInAudition
                    ? stage.index === 0
                      ? "done"
                      : stage.index === 1
                      ? "failed"
                      : "pending"
                    : stage.index === 0
                    ? "failed"
                    : "pending"
                  : stage.index < stageIndex
                  ? "done"
                  : stage.index === stageIndex
                  ? "active"
                  : "pending";

              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background:
                        state === "done"
                          ? "rgba(34,197,94,0.2)"
                          : state === "active"
                          ? "rgba(200,162,77,0.2)"
                          : state === "failed"
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${
                        state === "done"
                          ? "rgba(34,197,94,0.4)"
                          : state === "active"
                          ? "rgba(200,162,77,0.4)"
                          : state === "failed"
                          ? "rgba(239,68,68,0.4)"
                          : "rgba(255,255,255,0.1)"
                      }`,
                      color:
                        state === "done"
                          ? "#22c55e"
                          : state === "active"
                          ? "#C8A24D"
                          : state === "failed"
                          ? "#ef4444"
                          : "#555",
                      fontFamily: "var(--font-cinzel)",
                    }}
                  >
                    {state === "done" ? (
                      <CheckCircle size={14} />
                    ) : state === "failed" ? (
                      <X size={14} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-sm"
                      style={{
                        color:
                          state === "done"
                            ? "#22c55e"
                            : state === "active"
                            ? "#C8A24D"
                            : state === "failed"
                            ? "#ef4444"
                            : "#666",
                        fontFamily: "var(--font-poppins)",
                        fontWeight: state === "active" ? 600 : 400,
                      }}
                    >
                      {stage.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GoldCard>
      </div>

      {/* Checklist cepat status dokumen */}
      <GoldCard>
        <h3 className="text-sm font-bold mb-4" style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}>
          Status Upload Berkas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {requiredDocuments.map((doc) => (
            <div
              key={doc.label}
              className="rounded-xl p-3 text-center"
              style={{
                background: doc.done ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${doc.done ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <div className="text-base mb-1 flex justify-center">
                {doc.done ? <CheckCircle size={16} /> : <X size={16} />}
              </div>
              <p className="text-xs" style={{ color: doc.done ? "#22c55e" : "#ef4444", fontFamily: "var(--font-poppins)" }}>
                {doc.label}
              </p>
            </div>
          ))}
        </div>
        {documentProgress < 100 ? (
          <div className="mt-4">
            <GoldButton variant="primary" size="sm" onClick={() => router.push("/pages/participant/dokumen")}>
              <Upload size={14} /> Lengkapi Berkas
            </GoldButton>
          </div>
        ) : null}
      </GoldCard>

      {/* Toast notifikasi aksi kirim seleksi admin */}
      {submitInfo ? (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-xl px-4 py-3 shadow-lg"
          style={{
            background: "rgba(17,17,17,0.95)",
            border:
              submitInfoType === "success"
                ? "1px solid rgba(34,197,94,0.55)"
                : "1px solid rgba(239,68,68,0.55)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p
            className="text-sm"
            style={{
              color: submitInfoType === "success" ? "#22c55e" : "#ef4444",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {submitInfo}
          </p>
        </div>
      ) : null}
    </>
  );
}

