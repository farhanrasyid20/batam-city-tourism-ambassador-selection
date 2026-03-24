"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, Clock, FileText, Eye, AlertTriangle, MessageSquareMore } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import {
  getParticipantVerificationStatus,
  verificationStatusLabels,
  type Participant,
  type VerificationStatus,
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

function getSelectionStageAfterVerification(status: VerificationStatus): SelectionStageKey {
  if (status === "Verified") return "Audition";
  return "Verification";
}

export default function AdminVerificationPage() {
  const { participantList, setParticipantList, currentParticipant, setCurrentParticipant } = useApp();
  const [activeTab, setActiveTab] = useState<VerificationStatus>("Pending");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [noteDraftById, setNoteDraftById] = useState<Record<string, string>>({});
  const [openRejectInputId, setOpenRejectInputId] = useState<string | null>(null);

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

  const activeList = tabs.find((tab) => tab.key === activeTab)?.list ?? [];
  const selectedParticipant = participantList.find((participant) => participant.id === selectedParticipantId) ?? null;

  const updateParticipantVerification = (participantId: string, nextStatus: VerificationStatus, note?: string) => {
    const cleanNote = note?.trim() ?? "";

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
            status: linkedItem.status === "revision_required" ? "revision_required" : "submitted",
            note: linkedItem.status === "revision_required" ? linkedItem.note : "",
          };
        }) ?? participant.documents;

      const hasRevisionItems = reviewItems.some((item) => item.status === "revision_required");
      const draftNote = noteDraftById[participantId]?.trim();

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
      };
    });
  };

  const updateDocumentReview = (
    participantId: string,
    documentKey: string,
    patch: { status?: "submitted" | "revision_required"; note?: string }
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

      return {
        ...participant,
        documents,
        verificationStatus: hasRevisionDocuments ? "NeedsRevision" : participant.verificationStatus,
        adminRevisionNote: hasRevisionDocuments
          ? draftNote || participant.adminRevisionNote || "Ada dokumen yang perlu diperbaiki."
          : participant.adminRevisionNote,
      };
    });
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
              background: activeTab === tab.key ? `${tab.color}15` : "#1A1A1A",
              border: `1px solid ${activeTab === tab.key ? tab.color : "rgba(212,175,55,0.2)"}`,
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
                      {participant.number} • {participant.education} • Daftar: {participant.registeredAt}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(participant.documents ?? []).map((document) => (
                        <span
                          key={`${participant.id}-${document.key}`}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              document.status === "revision_required"
                                ? "rgba(249,115,22,0.12)"
                                : "rgba(34,197,94,0.1)",
                            color: document.status === "revision_required" ? "#f97316" : "#22c55e",
                            fontFamily: "var(--font-poppins)",
                            border:
                              document.status === "revision_required"
                                ? "1px solid rgba(249,115,22,0.2)"
                                : "1px solid rgba(34,197,94,0.2)",
                          }}
                        >
                          {document.status === "revision_required" ? "Perlu revisi" : "Tersubmit"} • {document.label}
                        </span>
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
                    <GoldButton variant="primary" size="sm" onClick={() => updateParticipantVerification(participant.id, "Verified", noteDraftById[participant.id])}>
                      <CheckCircle size={14} />
                      Verifikasi
                    </GoldButton>
                    <button
                      onClick={() => updateParticipantVerification(participant.id, "NeedsRevision", noteDraftById[participant.id])}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: "rgba(249,115,22,0.12)",
                        border: "1px solid rgba(249,115,22,0.3)",
                        color: "#f97316",
                        fontFamily: "var(--font-poppins)",
                        cursor: "pointer",
                      }}
                      type="button"
                    >
                      <AlertTriangle size={14} className="inline mr-1" />
                      Perlu Perbaikan
                    </button>
                    <button
                      onClick={() => setOpenRejectInputId((prev) => (prev === participant.id ? null : participant.id))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#ef4444",
                        fontFamily: "var(--font-poppins)",
                        cursor: "pointer",
                      }}
                      type="button"
                    >
                      <XCircle size={14} className="inline mr-1" />
                      Tolak
                    </button>
                  </div>
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
                          {(participant.documents ?? []).map((document) => (
                            <div
                              key={`${participant.id}-${document.key}`}
                              className="rounded-xl p-3"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                                  {document.label}
                                </p>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{
                                    background:
                                      document.status === "revision_required" ? "rgba(249,115,22,0.14)" : "rgba(34,197,94,0.14)",
                                    color: document.status === "revision_required" ? "#f97316" : "#22c55e",
                                    fontFamily: "var(--font-poppins)",
                                  }}
                                >
                                  {document.status === "revision_required" ? "Perlu revisi" : "Tersubmit"}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-2 mb-2">
                                <button
                                  type="button"
                                  onClick={() => updateDocumentReview(participant.id, document.key, { status: "submitted" })}
                                  className="px-2 py-1 rounded-lg text-[10px]"
                                  style={{
                                    background: document.status !== "revision_required" ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${document.status !== "revision_required" ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.08)"}`,
                                    color: document.status !== "revision_required" ? "#22c55e" : "#888",
                                    fontFamily: "var(--font-poppins)",
                                    cursor: "pointer",
                                  }}
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDocumentReview(participant.id, document.key, { status: "revision_required" })}
                                  className="px-2 py-1 rounded-lg text-[10px]"
                                  style={{
                                    background: document.status === "revision_required" ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${document.status === "revision_required" ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.08)"}`,
                                    color: document.status === "revision_required" ? "#f97316" : "#888",
                                    fontFamily: "var(--font-poppins)",
                                    cursor: "pointer",
                                  }}
                                >
                                  Revisi
                                </button>
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
                          ))}
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
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.4)",
                          color: "#ef4444",
                          fontFamily: "var(--font-poppins)",
                          cursor: "pointer",
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
    </div>
  );
}

