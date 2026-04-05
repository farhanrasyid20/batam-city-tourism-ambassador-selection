"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, Filter, Eye, Instagram, FileCheck2, ClipboardList, MessageSquareMore, ImagePlus, X, ExternalLink } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { useApp } from "../../../../context/AppContext";
import {
  getParticipantSelectionStage,
  getParticipantVerificationStatus,
  selectionStageLabels,
  verificationStatusLabels,
  type Participant,
  type SelectionStageKey,
  type VerificationStatus,
} from "../../../../data/mockData";

type StageFilterValue = "all" | SelectionStageKey;
type VerificationFilterValue = "all" | VerificationStatus;
type GenderFilterValue = "all" | "Encik" | "Puan";

type ParticipantExtended = Participant & {
  nickname?: string | null;
  fullName?: string | null;
  shirt_size?: string | null;
  shirtSize?: string | null;
  shoe_size?: string | null;
  shoeSize?: string | null;
  pants_size?: string | null;
  pantsSize?: string | null;
  weight_kg?: string | number | null;
  weightKg?: string | number | null;
  chest_circumference_cm?: string | number | null;
  chestCircumferenceCm?: string | number | null;
  waist_circumference_cm?: string | number | null;
  waistCircumferenceCm?: string | number | null;
  hip_circumference_cm?: string | number | null;
  hipCircumferenceCm?: string | number | null;
  documents?: Array<{
    key: string;
    label: string;
    status: "submitted" | "verified" | "revision_required" | "missing";
    note?: string;
    url?: string;
    original_name?: string;
    originalName?: string;
  }>;
};

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractNickname(participant: ParticipantExtended): string {
  const explicitNickname = (participant.nickname ?? "").trim();
  if (explicitNickname) return toTitleCase(explicitNickname);

  const cleanName = (participant.name ?? "")
    .replace(/^(encik|puan)\s+/i, "")
    .trim();
  const firstWord = cleanName.split(/\s+/)[0] ?? "";
  return toTitleCase(firstWord || "Peserta");
}

function getParticipantDisplayName(participant: ParticipantExtended): string {
  return `${participant.gender} ${extractNickname(participant)}`.trim();
}

function getParticipantFullName(participant: ParticipantExtended): string {
  const fullName = (participant.fullName ?? "").trim();
  if (fullName) return toTitleCase(fullName);
  return toTitleCase((participant.name ?? "").trim());
}

function firstFilled(...values: Array<string | number | null | undefined>) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "-";
}

const stageFilterOptions: Array<{ value: StageFilterValue; label: string }> = [
  { value: "all", label: "Semua Tahap" },
  { value: "Verification", label: selectionStageLabels.Verification },
  { value: "Audition", label: selectionStageLabels.Audition },
  { value: "Pre Camp", label: selectionStageLabels["Pre Camp"] },
  { value: "Camp", label: selectionStageLabels.Camp },
  { value: "Grand Final", label: selectionStageLabels["Grand Final"] },
  { value: "Final Result", label: selectionStageLabels["Final Result"] },
];

const verificationFilterOptions: Array<{ value: VerificationFilterValue; label: string }> = [
  { value: "all", label: "Semua Verifikasi" },
  { value: "Pending", label: verificationStatusLabels.Pending },
  { value: "NeedsRevision", label: verificationStatusLabels.NeedsRevision },
  { value: "Verified", label: verificationStatusLabels.Verified },
  { value: "Rejected", label: verificationStatusLabels.Rejected },
];

export default function AdminParticipantsPage() {
  const { participantList, setParticipantList } = useApp();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilterValue>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilterValue>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilterValue>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [participantPhotoMenuOpen, setParticipantPhotoMenuOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; name: string } | null>(null);
  const participantPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const filteredParticipants = useMemo(() => {
    return participantList.filter((participant) => {
      const normalizedSearch = searchKeyword.toLowerCase();
      const selectionStage = getParticipantSelectionStage(participant);
      const verificationStatus = getParticipantVerificationStatus(participant);
      const matchSearch =
        getParticipantDisplayName(participant as ParticipantExtended).toLowerCase().includes(normalizedSearch) ||
        participant.name.toLowerCase().includes(normalizedSearch) ||
        participant.number.toLowerCase().includes(normalizedSearch) ||
        participant.email.toLowerCase().includes(normalizedSearch);
      const matchStage = stageFilter === "all" || selectionStage === stageFilter;
      const matchVerification = verificationFilter === "all" || verificationStatus === verificationFilter;
      const matchGender = genderFilter === "all" || participant.gender === genderFilter;
      return matchSearch && matchStage && matchVerification && matchGender;
    });
  }, [genderFilter, participantList, searchKeyword, stageFilter, verificationFilter]);

  const selectedParticipant = selectedId
    ? participantList.find((participant) => participant.id === selectedId) ?? null
    : null;

  const handleParticipantPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedParticipant) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setParticipantList((prev) =>
        prev.map((participant) =>
          participant.id === selectedParticipant.id ? { ...participant, photo: result } : participant
        )
      );
      setParticipantPhotoMenuOpen(false);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const getDocumentSummary = (participant: Participant) => {
    const documents = participant.documents ?? [];
    const revisionCount = documents.filter((item) => item.status === "revision_required").length;

    return {
      total: documents.length,
      revisionCount,
      readyCount: documents.filter((item) => item.status === "submitted" || item.status === "verified").length,
    };
  };

  const getReviewSummary = (participant: Participant) => {
    const reviewItems = participant.reviewItems ?? [];
    return {
      revisionCount: reviewItems.filter((item) => item.status === "revision_required").length,
      okCount: reviewItems.filter((item) => item.status === "ok").length,
    };
  };

  return (
    <div>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "#D4AF37",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Data Peserta
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Detail peserta kini menampilkan verifikasi, progres tahap, ringkasan dokumen, dan catatan revisi admin.
        </p>
      </div>

      <GoldCard className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#D4AF37" }} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Cari nama, nomor, atau email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#F5E6C8",
                fontFamily: "var(--font-poppins)",
              }}
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(event) => setVerificationFilter(event.target.value as VerificationFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {verificationFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value as StageFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {stageFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value as GenderFilterValue)}
            className="px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#111",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#F5E6C8",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <option value="all">Semua Kategori</option>
            <option value="Encik">Encik (Putra)</option>
            <option value="Puan">Puan (Putri)</option>
          </select>
        </div>

        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
          <Filter size={12} />
          Menampilkan {filteredParticipants.length} dari {participantList.length} peserta
        </p>
      </GoldCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(212,175,55,0.2)", background: "#1A1A1A" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: "rgba(212,175,55,0.08)",
                      borderBottom: "1px solid rgba(212,175,55,0.15)",
                    }}
                  >
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Peserta
                    </th>
                    <th className="px-4 py-3 text-left text-xs hidden md:table-cell" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Verifikasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Tahap
                    </th>
                    <th className="px-4 py-3 text-center text-xs" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 600 }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant, index) => {
                    const verificationStatus = getParticipantVerificationStatus(participant);
                    const selectionStage = getParticipantSelectionStage(participant);

                    return (
                      <tr
                        key={participant.id}
                        className="transition-colors cursor-pointer"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: selectedId === participant.id ? "rgba(212,175,55,0.08)" : "transparent",
                        }}
                        onClick={() => {
                          setSelectedId(participant.id);
                          setParticipantPhotoMenuOpen(false);
                        }}
                      >
                        <td className="px-4 py-3 text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={participant.photo}
                              alt={participant.name}
                              width={32}
                              height={32}
                              unoptimized
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                                {getParticipantDisplayName(participant as ParticipantExtended)}
                              </p>
                              <p className="text-xs" style={{ color: "#666" }}>
                                {participant.number}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
                            style={{
                              background:
                                verificationStatus === "Verified"
                                  ? "rgba(34,197,94,0.15)"
                                  : verificationStatus === "NeedsRevision"
                                  ? "rgba(249,115,22,0.15)"
                                  : verificationStatus === "Rejected"
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(245,158,11,0.15)",
                              color:
                                verificationStatus === "Verified"
                                  ? "#22c55e"
                                  : verificationStatus === "NeedsRevision"
                                  ? "#f97316"
                                  : verificationStatus === "Rejected"
                                  ? "#ef4444"
                                  : "#F59E0B",
                              fontFamily: "var(--font-poppins)",
                            }}
                          >
                            {verificationStatusLabels[verificationStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
                            style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontFamily: "var(--font-poppins)" }}
                          >
                            {selectionStageLabels[selectionStage]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(participant.id);
                              setParticipantPhotoMenuOpen(false);
                            }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{
                              color: "#D4AF37",
                              background: "rgba(212,175,55,0.1)",
                              border: "none",
                              cursor: "pointer",
                            }}
                            type="button"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredParticipants.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Tidak ada peserta yang sesuai filter
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          {selectedParticipant ? (
            <GoldCard glow>
              <div className="text-center mb-5">
                <div className="relative w-20 mx-auto mb-3">
                  <button
                    type="button"
                    onClick={() => setParticipantPhotoMenuOpen((prev) => !prev)}
                    className="relative block w-20 h-20 rounded-2xl overflow-hidden group"
                    style={{ border: "2px solid rgba(212,175,55,0.5)", cursor: "pointer" }}
                  >
                    <Image
                      src={selectedParticipant.photo}
                      alt={selectedParticipant.name}
                      width={80}
                      height={80}
                      unoptimized
                      className="w-20 h-20 object-cover object-top"
                    />
                    <span
                      className="absolute inset-0 flex items-end justify-center pb-2 text-[10px] transition-opacity opacity-0 group-hover:opacity-100"
                      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.7))", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                    >
                      Klik foto
                    </span>
                  </button>

                  {participantPhotoMenuOpen ? (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-40 rounded-xl p-2 z-20"
                      style={{ background: "#141414", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 18px 36px rgba(0,0,0,0.35)" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewPhoto({ src: selectedParticipant.photo, name: selectedParticipant.name });
                          setParticipantPhotoMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                        style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        <Eye size={13} />
                        Lihat Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => participantPhotoInputRef.current?.click()}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                        style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        <ImagePlus size={13} />
                        Pilih Foto Baru
                      </button>
                    </div>
                  ) : null}

                  <input
                    ref={participantPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleParticipantPhotoChange}
                  />
                </div>
                <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                  {selectedParticipant.number}
                </p>
                <h3 className="text-sm font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                  {getParticipantDisplayName(selectedParticipant as ParticipantExtended)}
                </h3>
                <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                  Nama asli: {getParticipantFullName(selectedParticipant as ParticipantExtended)}
                </p>
              </div>

              <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-poppins)" }}>
                {[
                  { label: "Kategori", value: selectedParticipant.gender },
                  { label: "Tahap Seleksi", value: selectionStageLabels[getParticipantSelectionStage(selectedParticipant)] },
                  { label: "Status Verifikasi", value: verificationStatusLabels[getParticipantVerificationStatus(selectedParticipant)] },
                  { label: "Tinggi", value: `${selectedParticipant.heightCm} cm` },
                  {
                    label: "Berat",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).weight_kg,
                      (selectedParticipant as ParticipantExtended).weightKg
                    )} kg`,
                  },
                  {
                    label: "Ukuran Baju",
                    value: firstFilled(
                      (selectedParticipant as ParticipantExtended).shirt_size,
                      (selectedParticipant as ParticipantExtended).shirtSize
                    ),
                  },
                  {
                    label: "Ukuran Celana",
                    value: firstFilled(
                      (selectedParticipant as ParticipantExtended).pants_size,
                      (selectedParticipant as ParticipantExtended).pantsSize
                    ),
                  },
                  {
                    label: "Ukuran Sepatu",
                    value: firstFilled(
                      (selectedParticipant as ParticipantExtended).shoe_size,
                      (selectedParticipant as ParticipantExtended).shoeSize
                    ),
                  },
                  {
                    label: "Lingkar Dada",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).chest_circumference_cm,
                      (selectedParticipant as ParticipantExtended).chestCircumferenceCm
                    )} cm`,
                  },
                  {
                    label: "Lingkar Pinggang",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).waist_circumference_cm,
                      (selectedParticipant as ParticipantExtended).waistCircumferenceCm
                    )} cm`,
                  },
                  {
                    label: "Lingkar Pinggul",
                    value: `${firstFilled(
                      (selectedParticipant as ParticipantExtended).hip_circumference_cm,
                      (selectedParticipant as ParticipantExtended).hipCircumferenceCm
                    )} cm`,
                  },
                  { label: "Pendidikan", value: selectedParticipant.education },
                  { label: "Email", value: selectedParticipant.email },
                  { label: "HP", value: selectedParticipant.phone },
                  { label: "Daftar", value: selectedParticipant.registeredAt },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span style={{ color: "#888" }}>{item.label}</span>
                    <span style={{ color: "#F5E6C8", textAlign: "right", maxWidth: "160px", wordBreak: "break-word" }}>
                      {item.value}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between gap-2">
                  <span style={{ color: "#888" }}>Instagram</span>
                  {selectedParticipant.instagram ? (
                    <a
                      href={selectedParticipant.instagram.startsWith("http") ? selectedParticipant.instagram : `https://instagram.com/${selectedParticipant.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1"
                      style={{ color: "#D4AF37", textAlign: "right", maxWidth: "160px", wordBreak: "break-word" }}
                    >
                      <Instagram size={11} />
                      {selectedParticipant.instagram}
                    </a>
                  ) : (
                    <span style={{ color: "#666" }}>-</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                {(() => {
                  const summary = getDocumentSummary(selectedParticipant);
                  const reviewSummary = getReviewSummary(selectedParticipant);

                  return (
                    <>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
                      >
                        <FileCheck2 size={14} style={{ color: "#22c55e", marginBottom: 8 }} />
                        <p className="text-lg font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                          {summary.readyCount}
                        </p>
                        <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          Dokumen siap
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
                      >
                        <ClipboardList size={14} style={{ color: "#f97316", marginBottom: 8 }} />
                        <p className="text-lg font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                          {Math.max(summary.revisionCount, reviewSummary.revisionCount)}
                        </p>
                        <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                          Perlu revisi
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-5 pt-4 space-y-4" style={{ borderTop: "1px solid rgba(212,175,55,0.1)" }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquareMore size={14} style={{ color: "#D4AF37" }} />
                    <p className="text-xs font-semibold" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                      Catatan Admin
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.7 }}>
                    {selectedParticipant.adminRevisionNote || selectedParticipant.adminVerificationNote || "Belum ada catatan admin untuk peserta ini."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                    Item Review
                  </p>
                  <div className="space-y-2">
                    {(selectedParticipant.reviewItems ?? []).length > 0 ? (
                      selectedParticipant.reviewItems?.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl p-3"
                          style={{
                            background: item.status === "revision_required" ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.08)",
                            border: item.status === "revision_required" ? "1px solid rgba(249,115,22,0.16)" : "1px solid rgba(34,197,94,0.16)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                              {item.label}
                            </p>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{
                                background: item.status === "revision_required" ? "rgba(249,115,22,0.16)" : "rgba(34,197,94,0.16)",
                                color: item.status === "revision_required" ? "#f97316" : "#22c55e",
                                fontFamily: "var(--font-poppins)",
                              }}
                            >
                              {item.status === "revision_required" ? "Perlu revisi" : "OK"}
                            </span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.6 }}>
                            {item.note}
                          </p>
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
                    Dokumen Terkait
                  </p>
                  <div className="space-y-2">
                    {(selectedParticipant.documents ?? []).map((document) => (
                      <div
                        key={`${selectedParticipant.id}-${document.key}`}
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
                              background: document.status === "revision_required" ? "rgba(249,115,22,0.14)" : "rgba(34,197,94,0.14)",
                              color: document.status === "revision_required" ? "#f97316" : "#22c55e",
                              fontFamily: "var(--font-poppins)",
                            }}
                          >
                            {document.status === "revision_required" ? "Perlu revisi" : "Tersubmit"}
                          </span>
                        </div>
                        {document.url ? (
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs"
                            style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
                          >
                            <ExternalLink size={11} />
                            Lihat dokumen
                          </a>
                        ) : null}
                        {(document as ParticipantExtended["documents"][number]).original_name || (document as ParticipantExtended["documents"][number]).originalName ? (
                          <p className="text-xs mt-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                            File: {(document as ParticipantExtended["documents"][number]).original_name ?? (document as ParticipantExtended["documents"][number]).originalName}
                          </p>
                        ) : null}
                        {document.note ? (
                          <p className="text-xs mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)", lineHeight: 1.6 }}>
                            {document.note}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GoldCard>
          ) : (
            <GoldCard className="text-center py-12">
              <Eye size={32} style={{ color: "#444", margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                Pilih peserta untuk melihat detail
              </p>
            </GoldCard>
          )}
        </div>
      </div>

      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-5"
            style={{ background: "#141414", border: "1px solid rgba(212,175,55,0.2)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#F5E6C8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
            <p className="text-sm mb-4 pr-10" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
              {previewPhoto.name}
            </p>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(212,175,55,0.2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewPhoto.src} alt={previewPhoto.name} className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
