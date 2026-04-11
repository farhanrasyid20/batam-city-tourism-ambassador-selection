"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, Clock, FileText, Eye, AlertTriangle, MessageSquareMore, ExternalLink, Download } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import VerificationDocumentLink, { getVerificationDocumentMeta } from "./components/VerificationDocumentLink";
import { useApp } from "../../../../context/AppContext";
import { updateParticipantDocumentReviews, updateParticipantSelectionStatus } from "../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import { resolveApiAssetUrl } from "../../../../lib/api";
import {
  getParticipantVerificationStatus,
  verificationStatusLabels,
  type Participant,
  type VerificationStatus,
  type ParticipantVerificationIssue,
  type SelectionStageKey,
} from "../../../../data/mockData";

type VerificationTab = {
  label: string;
  key: VerificationStatus;
  count: number;
  color: string;
  list: Participant[];
};

const statusColors: Record<VerificationStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Pending: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
    icon: <Clock size={12} />,
  },
  NeedsRevision: {
    color: "#f97316",
    bg: "rgba(249,115,22,0.15)",
    icon: <AlertTriangle size={12} />,
  },
  Verified: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    icon: <CheckCircle size={12} />,
  },
  Rejected: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    icon: <XCircle size={12} />,
  },
};

const documentDisplayOrder = [
  "identityCard",
  "closeUpPhoto",
  "fullBodyPhoto",
  "formS01",
  "formS02",
  "formS03",
  "formS04",
  "certificate",
] as const;

const documentOrderMap = new Map<string, number>(
  documentDisplayOrder.map((key, index) => [key, index])
);

const documentIssueTargetMap: Record<string, ParticipantVerificationIssue["target"]> = {
  identityCard: "identityCard",
  closeUpPhoto: "closeUpPhoto",
  fullBodyPhoto: "fullBodyPhoto",
  formS01: "formS01",
  formS02: "formS02",
  formS03: "formS03",
  formS04: "formS04",
};

function hasUploadedDocument(document: NonNullable<Participant["documents"]>[number]) {
  return Boolean(
    (document.url ?? "").trim() ||
      (document.originalName ?? "").trim() ||
      (document.mimeType ?? "").trim()
  );
}

function toSocialHandle(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "-";
  if (raw.startsWith("@")) return raw;
  try {
    const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const url = new URL(normalized);
    const firstPath = url.pathname.split("/").filter(Boolean)[0];
    if (firstPath) return `@${firstPath}`;
  } catch {
    // ignore parse error
  }
  return raw;
}

function buildVerificationIssuesFromDocuments(
  participant: Participant,
  documents: NonNullable<Participant["documents"]>
): ParticipantVerificationIssue[] {
  return documents
    .filter((document) => document.status === "revision_required")
    .map((document) => {
      const target = documentIssueTargetMap[document.key];
      if (!target) return null;
      return {
        id: `issue-${participant.id}-${document.key}`,
        target,
        status: "revision_required" as const,
        message: document.note?.trim() || `Dokumen ${document.label} perlu diperbaiki.`,
      };
    })
    .filter((issue): issue is ParticipantVerificationIssue => Boolean(issue));
}

function getSelectionStageAfterVerification(status: VerificationStatus): SelectionStageKey {
  if (status === "Verified") return "Audition";
  return "Verification";
}

export default function AdminVerificationPage() {
  const { participantList, setParticipantList, currentParticipant, setCurrentParticipant, participantResources } = useApp();
  const [activeTab, setActiveTab] = useState<VerificationStatus>("Pending");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [noteDraftById, setNoteDraftById] = useState<Record<string, string>>({});
  const [openRejectInputId, setOpenRejectInputId] = useState<string | null>(null);
  const [savingDocumentsFor, setSavingDocumentsFor] = useState<string | null>(null);
  const [savingVerificationFor, setSavingVerificationFor] = useState<string | null>(null);
  const [saveDocumentNotice, setSaveDocumentNotice] = useState<Record<string, { type: "success" | "error"; message: string }>>({});
  const [saveVerificationNotice, setSaveVerificationNotice] = useState<Record<string, { type: "success" | "error"; message: string }>>({});
  const [previewState, setPreviewState] = useState<{
    open: boolean;
    href: string;
    title: string;
    previewType: "image" | "pdf" | "file";
  }>({
    open: false,
    href: "",
    title: "",
    previewType: "file",
  });

  const updateParticipantFields = (
    participantId: string,
    updater: (participant: Participant) => Participant
  ) => {
    setParticipantList((prev) => prev.map((participant) => (participant.id === participantId ? updater(participant) : participant)));
    if (currentParticipant?.id === participantId) {
      setCurrentParticipant((prev) => (prev ? updater(prev) : prev));
    }
  };

  const verificationMap = useMemo<Record<string, VerificationStatus>>(() => {
    const result: Record<string, VerificationStatus> = {};
    participantList.forEach((participant) => {
      result[participant.id] = getParticipantVerificationStatus(participant);
    });
    return result;
  }, [participantList]);

  const tabs: VerificationTab[] = ["Pending", "NeedsRevision", "Verified", "Rejected"].map((status) => ({
    key: status,
    label: verificationStatusLabels[status],
    count: participantList.filter((participant) => verificationMap[participant.id] === status).length,
    color: statusColors[status].color,
    list: participantList.filter((participant) => verificationMap[participant.id] === status),
  }));

  const resolvedActiveTab =
    tabs.find((tab) => tab.key === activeTab && tab.count > 0)?.key ??
    tabs.find((tab) => tab.count > 0)?.key ??
    activeTab;
  const activeList = tabs.find((tab) => tab.key === resolvedActiveTab)?.list ?? [];
  const selectedParticipant = participantList.find((participant) => participant.id === selectedParticipantId) ?? null;

  const updateParticipantVerification = async (participantId: string, nextStatus: VerificationStatus, note?: string) => {
    const cleanNote = note?.trim() ?? "";
    const token = getParticipantAuthSession()?.token;
    const participantUserId = Number(participantId.replace("P_API_", ""));

    if (!token || Number.isNaN(participantUserId)) {
      setSaveVerificationNotice((prev) => ({
        ...prev,
        [participantId]: { type: "error", message: "Sesi admin tidak valid. Silakan login ulang." },
      }));
      return;
    }

    const backendStatus =
      nextStatus === "Verified"
        ? "Verified"
        : nextStatus === "Rejected"
        ? "Rejected"
        : "Pending";

    setSavingVerificationFor(participantId);
    try {
      await updateParticipantSelectionStatus(token, participantUserId, {
        selection_status: backendStatus,
        selection_status_note: cleanNote || null,
      });
    } catch {
      setSaveVerificationNotice((prev) => ({
        ...prev,
        [participantId]: { type: "error", message: "Gagal simpan status verifikasi ke backend." },
      }));
      setSavingVerificationFor(null);
      return;
    }

    const updateOne = (participant: Participant) => {
      if (participant.id !== participantId) return participant;

      return {
        ...participant,
        verificationStatus: nextStatus,
        adminVerificationNote:
          cleanNote ||
          (nextStatus === "Verified"
            ? "Berkas administrasi telah diverifikasi dan peserta dapat lanjut ke tahap audisi."
            : nextStatus === "NeedsRevision"
            ? "Ada item biodata atau dokumen yang perlu diperbaiki sebelum verifikasi dilanjutkan."
            : nextStatus === "Rejected"
            ? "Peserta ditolak pada tahap verifikasi administrasi."
            : "Berkas sedang menunggu pemeriksaan admin."),
        adminRevisionNote: nextStatus === "NeedsRevision" ? cleanNote || participant.adminRevisionNote || "Periksa item yang diberi catatan revisi." : "",
        rejectionReason: nextStatus === "Rejected" ? cleanNote || participant.rejectionReason || "Berkas belum memenuhi ketentuan." : undefined,
        selectionStage: getSelectionStageAfterVerification(nextStatus),
        status:
          nextStatus === "Verified"
            ? "Verified"
            : nextStatus === "Rejected"
            ? "Rejected"
            : "Pending",
      } satisfies Participant;
    };

    updateParticipantFields(participantId, updateOne);
    setSaveVerificationNotice((prev) => ({
      ...prev,
      [participantId]: { type: "success", message: "Status verifikasi berhasil disimpan ke backend." },
    }));
    setSavingVerificationFor(null);
    setOpenRejectInputId(null);
  };

  const updateReviewItem = (
    participantId: string,
    itemId: string,
    patch: { status?: "ok" | "revision_required"; note?: string }
  ) => {
    updateParticipantFields(participantId, (participant) => {
      const reviewItems =
        participant.reviewItems?.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: patch.status ?? item.status,
                note: patch.note ?? item.note,
              }
            : item
        ) ?? [];

      const documents =
        participant.documents?.map((document) => {
          const linkedItem = reviewItems.find((item) => item.target === document.key || item.label === document.label);
          if (!linkedItem) return document;

          return {
            ...document,
            status: linkedItem.status === "revision_required" ? "revision_required" : "verified",
            note: linkedItem.status === "revision_required" ? linkedItem.note : "",
          };
        }) ?? participant.documents;

      const hasRevisionItems = reviewItems.some((item) => item.status === "revision_required");
      const draftNote = noteDraftById[participantId]?.trim();
      const verificationIssues = buildVerificationIssuesFromDocuments(participant, documents ?? []);

      return {
        ...participant,
        reviewItems,
        documents,
        verificationStatus: hasRevisionItems ? "NeedsRevision" : participant.verificationStatus,
        adminRevisionNote: hasRevisionItems
          ? draftNote || participant.adminRevisionNote || "Ada item yang perlu diperbaiki."
          : "",
        adminVerificationNote: hasRevisionItems
          ? participant.adminVerificationNote || "Ada item biodata atau dokumen yang perlu diperbaiki sebelum verifikasi dilanjutkan."
          : participant.adminVerificationNote,
        verificationIssues,
      };
    });
  };

  const updateDocumentReview = (
    participantId: string,
    documentKey: string,
    patch: { status?: "verified" | "revision_required"; note?: string }
  ) => {
    updateParticipantFields(participantId, (participant) => {
      const documents =
        participant.documents?.map((document) =>
          document.key === documentKey
            ? {
                ...document,
                status: patch.status ?? document.status,
                note: patch.note ?? document.note,
              }
            : document
        ) ?? [];

      const hasRevisionDocuments = documents.some((document) => document.status === "revision_required");
      const draftNote = noteDraftById[participantId]?.trim();
      const verificationIssues = buildVerificationIssuesFromDocuments(participant, documents ?? []);

      return {
        ...participant,
        documents,
        verificationStatus: hasRevisionDocuments ? "NeedsRevision" : participant.verificationStatus,
        adminRevisionNote: hasRevisionDocuments
          ? draftNote || participant.adminRevisionNote || "Ada dokumen yang perlu diperbaiki."
          : participant.adminRevisionNote,
        verificationIssues,
      };
    });
  };

  const handleSaveDocumentReviews = async (participant: Participant) => {
    const token = getParticipantAuthSession()?.token;
    const participantUserIdRaw = participant.id.replace("P_API_", "");
    const participantUserId = Number(participantUserIdRaw);

    if (!token || Number.isNaN(participantUserId)) {
      setSaveDocumentNotice((prev) => ({
        ...prev,
        [participant.id]: { type: "error", message: "Sesi admin tidak valid. Silakan login ulang." },
      }));
      return;
    }

    const payloadDocuments = (participant.documents ?? []).map((doc) => ({
      key: doc.key,
      status: doc.status,
      note: doc.note ?? null,
    }));

    setSavingDocumentsFor(participant.id);
    try {
      const response = await updateParticipantDocumentReviews(token, participantUserId, {
        documents: payloadDocuments,
      });

      updateParticipantFields(participant.id, (prev) => {
        const nextDocuments = response.data.documents.map((doc) => ({
          key: doc.key,
          label: doc.label,
          status: doc.status,
          note: doc.note ?? undefined,
          url: resolveApiAssetUrl(doc.url) ?? undefined,
          mimeType: doc.mime_type ?? undefined,
          originalName: doc.original_name ?? undefined,
        }));

        return {
          ...prev,
          documents: nextDocuments,
          verificationIssues: buildVerificationIssuesFromDocuments(prev, nextDocuments),
        };
      });

      setSaveDocumentNotice((prev) => ({
        ...prev,
        [participant.id]: { type: "success", message: "Status dokumen berhasil disimpan ke backend." },
      }));
    } catch {
      setSaveDocumentNotice((prev) => ({
        ...prev,
        [participant.id]: { type: "error", message: "Gagal simpan status dokumen. Coba lagi." },
      }));
    } finally {
      setSavingDocumentsFor(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Verifikasi Berkas
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Verifikasi kini mendukung status revisi, catatan admin umum, dan ringkasan item yang perlu diperbaiki.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="rounded-2xl p-4 text-center transition-all duration-200"
            style={{
              background: resolvedActiveTab === tab.key ? `${tab.color}15` : "#1A1A1A",
              border: `1px solid ${resolvedActiveTab === tab.key ? tab.color : "rgba(212,175,55,0.2)"}`,
              cursor: "pointer",
            }}
            type="button"
          >
            <p className="text-2xl font-bold mb-1" style={{ color: tab.color, fontFamily: "var(--font-cinzel)" }}>
              {tab.count}
            </p>
            <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeList.length === 0 ? (
          <GoldCard className="text-center py-12">
            <CheckCircle size={32} style={{ color: "#444", margin: "0 auto 12px" }} />
            <p style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>Tidak ada peserta dalam kategori ini</p>
          </GoldCard>
        ) : (
          activeList.map((participant) => {
            const verificationStatus = verificationMap[participant.id];
            const badge = statusColors[verificationStatus];
            const isSelected = selectedParticipantId === participant.id;
            const revisionCount = participant.reviewItems?.filter((item) => item.status === "revision_required").length ?? 0;

            return (
              <GoldCard key={participant.id}>
                <div className="flex items-center gap-4 flex-wrap">
                  <Image
                    src={participant.photo}
                    alt={participant.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(212,175,55,0.3)" }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {participant.name}
                      </h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: participant.gender === "Encik" ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)",
                          color: participant.gender === "Encik" ? "#60a5fa" : "#f472b6",
                          fontFamily: "var(--font-cinzel)",
                        }}
                      >
                        {participant.gender}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                      {participant.number} - {participant.education} - Daftar: {participant.registeredAt}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(participant.documents ?? [])
                        .slice()
                        .sort((a, b) => {
                          const rankA = documentOrderMap.get(a.key) ?? 999;
                          const rankB = documentOrderMap.get(b.key) ?? 999;
                          if (rankA !== rankB) return rankA - rankB;
                          return a.label.localeCompare(b.label);
                        })
                        .map((document) => (
                        (() => {
                          const isMissing = document.status === "missing" || !hasUploadedDocument(document);
                          const isRevision = document.status === "revision_required";
                          const isVerified = document.status === "verified";

                          return (
                        <span
                          key={`${participant.id}-${document.key}`}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              isMissing
                                ? "rgba(107,114,128,0.12)"
                                : isRevision
                                ? "rgba(249,115,22,0.12)"
                                : isVerified
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(34,197,94,0.1)",
                            color:
                              isMissing
                                ? "#9CA3AF"
                                : isRevision
                                ? "#f97316"
                                : isVerified
                                ? "#22c55e"
                                : "#22c55e",
                            fontFamily: "var(--font-poppins)",
                            border:
                              isMissing
                                ? "1px solid rgba(107,114,128,0.24)"
                                : isRevision
                                ? "1px solid rgba(249,115,22,0.2)"
                                : "1px solid rgba(34,197,94,0.2)",
                          }}
                        >
                          {isMissing
                            ? "Belum diunggah"
                            : isRevision
                            ? "Perlu revisi"
                            : isVerified
                            ? "Terverifikasi"
                            : "Tersubmit"}{" "}
                          - {document.label}
                        </span>
                          );
                        })()
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                      style={{ background: badge.bg, color: badge.color, fontFamily: "var(--font-poppins)" }}
                    >
                      {badge.icon}
                      {verificationStatusLabels[verificationStatus]}
                    </span>
                    <button
                      onClick={() => setSelectedParticipantId((prev) => (prev === participant.id ? null : participant.id))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
                      style={{
                        background: "rgba(59,130,246,0.12)",
                        border: "1px solid rgba(59,130,246,0.25)",
                        color: "#60a5fa",
                        fontFamily: "var(--font-poppins)",
                        cursor: "pointer",
                      }}
                      type="button"
                    >
                      <Eye size={12} />
                      {isSelected ? "Tutup" : "Lihat"}
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <GoldButton
                      variant="primary"
                      size="sm"
                      onClick={() => updateParticipantVerification(participant.id, "Verified", noteDraftById[participant.id])}
                      disabled={savingVerificationFor === participant.id}
                    >
                      <CheckCircle size={14} />
                      {savingVerificationFor === participant.id ? "Menyimpan..." : "Verifikasi"}
                    </GoldButton>
                    <button
                      onClick={() => updateParticipantVerification(participant.id, "NeedsRevision", noteDraftById[participant.id])}
                      disabled={savingVerificationFor === participant.id}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: "rgba(249,115,22,0.12)",
                        border: "1px solid rgba(249,115,22,0.3)",
                        color: "#f97316",
                        fontFamily: "var(--font-poppins)",
                        cursor: savingVerificationFor === participant.id ? "not-allowed" : "pointer",
                        opacity: savingVerificationFor === participant.id ? 0.7 : 1,
                      }}
                      type="button"
                    >
                      <AlertTriangle size={14} className="inline mr-1" />
                      Perlu Perbaikan
                    </button>
                    <button
                      onClick={() => setOpenRejectInputId((prev) => (prev === participant.id ? null : participant.id))}
                      disabled={savingVerificationFor === participant.id}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#ef4444",
                        fontFamily: "var(--font-poppins)",
                        cursor: savingVerificationFor === participant.id ? "not-allowed" : "pointer",
                        opacity: savingVerificationFor === participant.id ? 0.7 : 1,
                      }}
                      type="button"
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Tolak
                    </button>
                  </div>
                  {saveVerificationNotice[participant.id] ? (
                    <p
                      className="text-xs mt-2"
                      style={{
                        color: saveVerificationNotice[participant.id].type === "success" ? "#22c55e" : "#ef4444",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {saveVerificationNotice[participant.id].message}
                    </p>
                  ) : null}
                </div>

                {isSelected ? (
                  <div className="mt-4 pt-4 rounded-xl p-4" style={{ borderTop: "1px solid rgba(212,175,55,0.15)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={14} style={{ color: "#D4AF37" }} />
                          <p className="text-xs font-semibold" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                            Ringkasan Verifikasi
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Email: {participant.email}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Telepon: {participant.phone}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Status verifikasi: {verificationStatusLabels[verificationStatus]}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Tahap setelah verifikasi: {participant.selectionStage ?? "Verification"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Submit ke admin: {participant.submittedToAdmin ? "Sudah" : "Belum"}
                        </p>
                        <p className="text-xs mt-3" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                          Data Ukuran
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Tinggi/Berat: {participant.heightCm || "-"} cm / {participant.weightKg || "-"} kg
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Baju/Celana/Sepatu: {participant.shirtSize || "-"} / {participant.pantsSize || "-"} / {participant.shoeSize || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Lingkar Dada/Pinggang/Pinggul: {participant.chestCircumferenceCm || "-"} / {participant.waistCircumferenceCm || "-"} / {participant.hipCircumferenceCm || "-"} cm
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          NIK: {participant.nationalId || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          TTL: {participant.birthPlace || "-"}, {participant.birthDate || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Nama Panggilan: {participant.nickname || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Agama: {participant.religion || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Status Saat Ini: {participant.currentStatus || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Instagram: {toSocialHandle(participant.instagram)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          TikTok: {toSocialHandle(participant.tiktok)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Alamat Domisili: {participant.domicileAddress || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Alamat KTP: {participant.ktpAddress || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          No. HP Orang Tua/Wali: {participant.parentPhone || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Nama Ayah: {participant.fatherName || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Nama Ibu: {participant.motherName || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Pekerjaan: {participant.occupation || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Keahlian/Bakat: {participant.skills || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Hobi: {participant.hobbies || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Bahasa: {participant.languages || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Visi: {participant.vision || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Misi: {participant.mission || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Pengalaman: {participant.experience || "-"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Prestasi: {participant.achievement || "-"}
                        </p>
                        <p className="text-xs mt-3" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                          {participant.adminVerificationNote}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquareMore size={14} style={{ color: "#D4AF37" }} />
                          <p className="text-xs font-semibold" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                            Catatan Admin
                          </p>
                        </div>
                        <textarea
                          value={noteDraftById[participant.id] ?? participant.adminRevisionNote ?? participant.adminVerificationNote ?? ""}
                          onChange={(event) =>
                            setNoteDraftById((prev) => ({
                              ...prev,
                              [participant.id]: event.target.value,
                            }))
                          }
                          placeholder="Masukkan catatan umum admin untuk peserta ini..."
                          className="w-full min-h-28 px-4 py-3 rounded-xl text-sm outline-none"
                          style={{
                            background: "#111",
                            border: "1px solid rgba(212,175,55,0.25)",
                            color: "#F5E6C8",
                            fontFamily: "var(--font-poppins)",
                          }}
                        />
                        <p className="text-xs mt-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          {revisionCount > 0 ? `${revisionCount} item ditandai perlu perbaikan.` : "Belum ada item revisi pada peserta ini."}
                        </p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                          Item Review
                        </p>
                        <div className="space-y-2">
                          {(participant.reviewItems ?? []).length > 0 ? (
                            participant.reviewItems?.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl p-3"
                                style={{
                                  background: item.status === "revision_required" ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.08)",
                                  border: item.status === "revision_required" ? "1px solid rgba(249,115,22,0.18)" : "1px solid rgba(34,197,94,0.18)",
                                }}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                                    {item.label}
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateReviewItem(participant.id, item.id, { status: "ok" })}
                                      className="px-2 py-1 rounded-lg text-[10px]"
                                      style={{
                                        background: item.status === "ok" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
                                        border: `1px solid ${item.status === "ok" ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.08)"}`,
                                        color: item.status === "ok" ? "#22c55e" : "#888",
                                        fontFamily: "var(--font-poppins)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      OK
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateReviewItem(participant.id, item.id, { status: "revision_required" })}
                                      className="px-2 py-1 rounded-lg text-[10px]"
                                      style={{
                                        background: item.status === "revision_required" ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.06)",
                                        border: `1px solid ${item.status === "revision_required" ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.08)"}`,
                                        color: item.status === "revision_required" ? "#f97316" : "#888",
                                        fontFamily: "var(--font-poppins)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Revisi
                                    </button>
                                  </div>
                                </div>
                                <textarea
                                  value={item.note}
                                  onChange={(event) =>
                                    updateReviewItem(participant.id, item.id, {
                                      note: event.target.value,
                                    })
                                  }
                                  className="w-full min-h-20 px-3 py-2 rounded-xl text-xs outline-none"
                                  style={{
                                    background: "#111",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "#BDBDBD",
                                    fontFamily: "var(--font-poppins)",
                                  }}
                                />
                              </div>
                            ))
                          ) : (
                            <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                              Belum ada item review terperinci.
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                          Status Dokumen
                        </p>
                        <div className="space-y-2">
                          {(participant.documents ?? [])
                            .slice()
                            .sort((a, b) => {
                              const rankA = documentOrderMap.get(a.key) ?? 999;
                              const rankB = documentOrderMap.get(b.key) ?? 999;
                              if (rankA !== rankB) return rankA - rankB;
                              return a.label.localeCompare(b.label);
                            })
                            .map((document) => {
                            const documentMeta = getVerificationDocumentMeta(participant, document, participantResources);
                            const isMissing = document.status === "missing" || !documentMeta.href;
                            const isRevision = document.status === "revision_required";
                            const isVerified = document.status === "verified";

                            return (
                            <div
                              key={`${participant.id}-${document.key}`}
                              className="rounded-xl p-3"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <VerificationDocumentLink
                                  participant={participant}
                                  document={document}
                                  className="text-xs font-semibold text-left"
                                  style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", padding: 0 }}
                                >
                                  {document.label}
                                </VerificationDocumentLink>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background:
                                      isMissing
                                        ? "rgba(107,114,128,0.14)"
                                        : isRevision
                                        ? "rgba(249,115,22,0.14)"
                                        : isVerified
                                        ? "rgba(34,197,94,0.14)"
                                        : "rgba(245,158,11,0.14)",
                                    color:
                                      isMissing
                                        ? "#9CA3AF"
                                        : isRevision
                                        ? "#f97316"
                                        : isVerified
                                        ? "#22c55e"
                                        : "#f59e0b",
                                    fontFamily: "var(--font-poppins)",
                                  }}
                                >
                                  {isMissing
                                    ? "Belum diunggah"
                                    : isRevision
                                    ? "Perlu revisi"
                                    : isVerified
                                    ? "Terverifikasi"
                                    : "Menunggu cek admin"}
                                </span>
                              </div>
                              <div className="mt-2 mb-2 flex flex-wrap items-start justify-between gap-2">
                                <div
                                  className="min-w-0 flex-1 rounded-lg px-3 py-2"
                                  style={{
                                    background: "rgba(17,17,17,0.88)",
                                    border: `1px solid ${documentMeta.fileName ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.08)"}`,
                                  }}
                                >
                                  <p
                                    className="text-[10px] uppercase tracking-[0.2em] mb-1"
                                    style={{ color: "#8F8F8F", fontFamily: "var(--font-poppins)" }}
                                  >
                                    File Peserta
                                  </p>
                                  <p
                                    className="text-xs truncate"
                                    style={{ color: documentMeta.fileName ? "#F5E6C8" : "#888", fontFamily: "var(--font-poppins)" }}
                                    title={documentMeta.fileName || "File belum diisi"}
                                  >
                                    {documentMeta.fileName || "File belum diisi"}
                                  </p>
                                </div>
                                {documentMeta.href ? (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewState({
                                          open: true,
                                          href: documentMeta.href,
                                          title: document.label,
                                          previewType: documentMeta.previewType,
                                        })
                                      }
                                      className="px-2 py-1 rounded-lg text-[10px]"
                                      style={{
                                        background: "rgba(59,130,246,0.12)",
                                        border: "1px solid rgba(59,130,246,0.3)",
                                        color: "#60a5fa",
                                        fontFamily: "var(--font-poppins)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Eye size={11} className="inline mr-1" />
                                      Lihat
                                    </button>
                                    <a
                                      href={documentMeta.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 rounded-lg text-[10px] inline-flex items-center"
                                      style={{
                                        background: "rgba(212,175,55,0.12)",
                                        border: "1px solid rgba(212,175,55,0.3)",
                                        color: "#D4AF37",
                                        fontFamily: "var(--font-poppins)",
                                      }}
                                    >
                                      <ExternalLink size={11} className="mr-1" />
                                      Tab Baru
                                    </a>
                                    <a
                                      href={documentMeta.href}
                                      download
                                      className="px-2 py-1 rounded-lg text-[10px] inline-flex items-center"
                                      style={{
                                        background: "rgba(34,197,94,0.12)",
                                        border: "1px solid rgba(34,197,94,0.3)",
                                        color: "#22c55e",
                                        fontFamily: "var(--font-poppins)",
                                      }}
                                    >
                                      <Download size={11} className="mr-1" />
                                      Download
                                    </a>
                                  </div>
                                ) : null}
                                <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDocumentReview(participant.id, document.key, {
                                      status: "verified",
                                      note: "",
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg text-[10px]"
                                  disabled={isMissing}
                                  style={{
                                    background: isMissing
                                      ? "rgba(107,114,128,0.08)"
                                      : document.status === "verified"
                                      ? "rgba(34,197,94,0.18)"
                                      : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${
                                      isMissing
                                        ? "rgba(107,114,128,0.18)"
                                        : document.status === "verified"
                                        ? "rgba(34,197,94,0.35)"
                                        : "rgba(255,255,255,0.08)"
                                    }`,
                                    color: isMissing ? "#6B7280" : document.status === "verified" ? "#22c55e" : "#888",
                                    fontFamily: "var(--font-poppins)",
                                    cursor: isMissing ? "not-allowed" : "pointer",
                                    opacity: isMissing ? 0.7 : 1,
                                  }}
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDocumentReview(participant.id, document.key, { status: "revision_required" })}
                                  className="px-2 py-1 rounded-lg text-[10px]"
                                  disabled={isMissing}
                                  style={{
                                    background: isMissing
                                      ? "rgba(107,114,128,0.08)"
                                      : document.status === "revision_required"
                                      ? "rgba(249,115,22,0.18)"
                                      : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${
                                      isMissing
                                        ? "rgba(107,114,128,0.18)"
                                        : document.status === "revision_required"
                                        ? "rgba(249,115,22,0.35)"
                                        : "rgba(255,255,255,0.08)"
                                    }`,
                                    color: isMissing ? "#6B7280" : document.status === "revision_required" ? "#f97316" : "#888",
                                    fontFamily: "var(--font-poppins)",
                                    cursor: isMissing ? "not-allowed" : "pointer",
                                    opacity: isMissing ? 0.7 : 1,
                                  }}
                                >
                                  Revisi
                                </button>
                                </div>
                              </div>
                              <textarea
                                value={document.note ?? ""}
                                onChange={(event) =>
                                  updateDocumentReview(participant.id, document.key, {
                                    note: event.target.value,
                                  })
                                }
                                className="w-full min-h-20 px-3 py-2 rounded-xl text-xs outline-none"
                                style={{
                                  background: "#111",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  color: "#BDBDBD",
                                  fontFamily: "var(--font-poppins)",
                                }}
                              />
                            </div>
                          )})}
                        </div>
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <GoldButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveDocumentReviews(participant)}
                            disabled={savingDocumentsFor === participant.id}
                          >
                            {savingDocumentsFor === participant.id ? "Menyimpan..." : "Simpan Status Dokumen"}
                          </GoldButton>
                          {saveDocumentNotice[participant.id] ? (
                            <p
                              className="text-xs"
                              style={{
                                color: saveDocumentNotice[participant.id].type === "success" ? "#22c55e" : "#ef4444",
                                fontFamily: "var(--font-poppins)",
                              }}
                            >
                              {saveDocumentNotice[participant.id].message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {openRejectInputId === participant.id ? (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }}>
                    <label className="block text-xs mb-2" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
                      Alasan penolakan:
                    </label>
                    <input
                      type="text"
                      value={noteDraftById[participant.id] ?? ""}
                      onChange={(event) =>
                        setNoteDraftById((prev) => ({
                          ...prev,
                          [participant.id]: event.target.value,
                        }))
                      }
                      placeholder="Masukkan alasan penolakan..."
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3"
                      style={{
                        background: "#111",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#F5E6C8",
                        fontFamily: "var(--font-poppins)",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateParticipantVerification(participant.id, "Rejected", noteDraftById[participant.id])}
                        className="px-4 py-2 rounded-xl text-xs font-semibold"
                        disabled={savingVerificationFor === participant.id}
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.4)",
                          color: "#ef4444",
                          fontFamily: "var(--font-poppins)",
                          cursor: savingVerificationFor === participant.id ? "not-allowed" : "pointer",
                          opacity: savingVerificationFor === participant.id ? 0.7 : 1,
                        }}
                        type="button"
                      >
                        Konfirmasi Tolak
                      </button>
                      <button
                        onClick={() => setOpenRejectInputId(null)}
                        className="px-4 py-2 rounded-xl text-xs"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#888",
                          fontFamily: "var(--font-poppins)",
                          cursor: "pointer",
                        }}
                        type="button"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : null}
              </GoldCard>
            );
          })
        )}
      </div>

      {selectedParticipant?.verificationStatus === "Rejected" && selectedParticipant.rejectionReason ? (
        <div className="mt-4">
          <GoldCard>
            <p className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
              Alasan penolakan terakhir: {selectedParticipant.rejectionReason}
            </p>
          </GoldCard>
        </div>
      ) : null}

      {previewState.open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setPreviewState((prev) => ({ ...prev, open: false }))}
        >
          <div
            className="w-full max-w-5xl rounded-2xl overflow-hidden"
            style={{ background: "#101010", border: "1px solid rgba(212,175,55,0.35)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(212,175,55,0.2)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                Preview Dokumen: {previewState.title}
              </p>
              <button
                type="button"
                onClick={() => setPreviewState((prev) => ({ ...prev, open: false }))}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                Tutup
              </button>
            </div>
            <div className="p-3" style={{ maxHeight: "75vh", overflow: "auto" }}>
              {previewState.previewType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewState.href} alt={previewState.title} className="w-full h-auto rounded-xl" />
              ) : previewState.previewType === "pdf" ? (
                <iframe
                  src={previewState.href}
                  title={previewState.title}
                  className="w-full rounded-xl"
                  style={{ minHeight: "70vh", border: "1px solid rgba(212,175,55,0.2)" }}
                />
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm mb-3" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Preview langsung belum didukung untuk tipe file ini.
                  </p>
                  <a
                    href={previewState.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl inline-flex items-center"
                    style={{
                      background: "rgba(212,175,55,0.14)",
                      border: "1px solid rgba(212,175,55,0.35)",
                      color: "#D4AF37",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Buka Dokumen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


