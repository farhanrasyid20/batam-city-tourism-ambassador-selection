"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import Image from "next/image";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import {
  getAdminScoreStageLabel,
  getParticipantVerificationStatus,
  getSelectionStageFromStageProgress,
  participantProgressStages,
  selectionStageLabels,
  type AdminScoreStage,
  type Participant,
  type ParticipantProgressStageKey,
  type ParticipantStageProgress,
} from "../../../../../data/mockData";

type ProgressChecklistSectionProps = {
  activeStage: AdminScoreStage;
  isProgressStage: boolean;
  participants: Participant[];
  progressDraftsCount: number;
  canSaveProgress: boolean;
  isSavingProgress: boolean;
  selectedParticipantId: string | null;
  onSaveProgress: () => void;
  onSelectParticipant: (participantId: string | null) => void;
  onToggleProgress: (
    participantId: string,
    stage: ParticipantProgressStageKey,
  ) => void;
  onToggleAuditionElimination: (participantId: string) => void;
  isParticipantEliminated: (participant: Participant) => boolean;
  getDraftProgress: (participant: Participant) => ParticipantStageProgress;
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const getDisplayParticipantName = (participant: Participant) => {
  const cleanedNickname = (participant.nickname ?? "")
    .trim()
    .replace(/^(encik|puan)\s+/i, "");
  const cleanedName = participant.name
    .trim()
    .replace(/^(encik|puan)\s+/i, "");
  const baseRaw = cleanedNickname || cleanedName.split(/\s+/)[0] || "Peserta";
  const baseName = toTitleCase(baseRaw);
  return `${participant.gender} ${baseName}`.trim();
};

export default function ProgressChecklistSection({
  activeStage,
  isProgressStage,
  participants,
  progressDraftsCount,
  canSaveProgress,
  isSavingProgress,
  selectedParticipantId,
  onSaveProgress,
  onSelectParticipant,
  onToggleProgress,
  onToggleAuditionElimination,
  isParticipantEliminated,
  getDraftProgress,
}: ProgressChecklistSectionProps) {
  const getCurrentStageLabel = (participant: Participant, progress: ParticipantStageProgress) => {
    if (isParticipantEliminated(participant)) {
      return "Tereliminasi Audisi";
    }

    return selectionStageLabels[
      getSelectionStageFromStageProgress(
        progress,
        getParticipantVerificationStatus(participant),
      )
    ];
  };

  return (
    <GoldCard>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
          >
            Progress Checklist Tahap {getAdminScoreStageLabel(activeStage)}
          </h3>
          <p
            className="text-xs mt-1"
            style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
          >
            {/* Bagian ini cocok diubah kalau kamu mau mengganti instruksi utama tabel progres. */}
            Klik nama peserta untuk membuka panel catatan di kanan, lalu simpan
            progress tahap secara terpisah.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveProgress}
          disabled={!canSaveProgress || isSavingProgress}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          title={
            progressDraftsCount > 0
              ? `${progressDraftsCount} perubahan belum disimpan`
              : "Sinkronkan progres tahap ke backend"
          }
          style={{
            background: canSaveProgress && !isSavingProgress
              ? "linear-gradient(135deg, #F5D06F, #D4AF37)"
              : "rgba(255,255,255,0.06)",
            color: canSaveProgress && !isSavingProgress ? "#0F0F0F" : "#777",
            border: `1px solid ${
              canSaveProgress && !isSavingProgress
                ? "transparent"
                : "rgba(255,255,255,0.08)"
            }`,
            fontFamily: "var(--font-poppins)",
          }}
        >
          {isSavingProgress ? "Menyimpan..." : "Simpan Progress Tahap"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th
                className="text-left text-xs py-3 pr-3"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                Peserta
              </th>

              {participantProgressStages.map((stage) => (
                <th
                  key={stage}
                  className="text-center text-xs py-3 px-2"
                  style={{
                    color: stage === activeStage ? "#D4AF37" : "#888",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {selectionStageLabels[stage]}
                </th>
              ))}

              <th
                className="text-left text-xs py-3 pl-3"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                Tahap Saat Ini
              </th>
            </tr>
          </thead>

          <tbody>
            {participants.map((participant) => {
              const progress = getDraftProgress(participant);

              return (
                <tr
                  key={`${activeStage}-${participant.id}`}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td className="py-3 pr-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        onSelectParticipant(
                          selectedParticipantId === participant.id
                            ? null
                            : participant.id,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectParticipant(
                            selectedParticipantId === participant.id
                              ? null
                              : participant.id,
                          );
                        }
                      }}
                      className="flex items-center gap-3 text-left w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/40 rounded-lg"
                    >
                      <Image
                        src={participant.photo}
                        alt={participant.name}
                        width={36}
                        height={36}
                        unoptimized
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />

                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{
                            color:
                              selectedParticipantId === participant.id
                                ? "#D4AF37"
                                : "#F5E6C8",
                            fontFamily: "var(--font-poppins)",
                          }}
                        >
                          {getDisplayParticipantName(participant)}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: "#888",
                            fontFamily: "var(--font-poppins)",
                          }}
                        >
                          {participant.number} - {participant.gender}
                        </p>
                        {activeStage === "Audition" && isProgressStage ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleAuditionElimination(participant.id);
                            }}
                            className="mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all"
                            style={{
                              fontFamily: "var(--font-poppins)",
                              background: isParticipantEliminated(participant)
                                ? "rgba(34,197,94,0.15)"
                                : "rgba(239,68,68,0.18)",
                              border: `1px solid ${
                                isParticipantEliminated(participant)
                                  ? "rgba(34,197,94,0.35)"
                                  : "rgba(239,68,68,0.35)"
                              }`,
                              color: isParticipantEliminated(participant) ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {isParticipantEliminated(participant) ? "Batal X" : "X Eliminasi"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {participantProgressStages.map((stage) => {
                    const checked = progress[stage];
                    const isEditable =
                      stage === activeStage && isProgressStage;

                    return (
                      <td
                        key={`${participant.id}-${stage}`}
                        className="px-2 py-3 text-center"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            isEditable && onToggleProgress(participant.id, stage)
                          }
                          disabled={!isEditable}
                          className="w-8 h-8 rounded-full text-xs font-bold transition-all"
                          style={{
                            background: checked
                              ? "rgba(34,197,94,0.18)"
                              : "rgba(255,255,255,0.05)",
                            border: `1px solid ${
                              checked
                                ? "rgba(34,197,94,0.35)"
                                : stage === activeStage
                                  ? "rgba(212,175,55,0.25)"
                                  : "rgba(255,255,255,0.08)"
                            }`,
                            color: checked
                              ? "#22c55e"
                              : stage === activeStage
                                ? "#D4AF37"
                                : "#666",
                            fontFamily: "var(--font-cinzel)",
                          }}
                        >
                          {checked ? "v" : stage === activeStage ? "+" : "-"}
                        </button>
                      </td>
                    );
                  })}

                  <td className="py-3 pl-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: isParticipantEliminated(participant)
                          ? "rgba(239,68,68,0.12)"
                          : "rgba(212,175,55,0.12)",
                        border: isParticipantEliminated(participant)
                          ? "1px solid rgba(239,68,68,0.28)"
                          : "1px solid rgba(212,175,55,0.2)",
                        color: isParticipantEliminated(participant) ? "#ef4444" : "#D4AF37",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {getCurrentStageLabel(participant, progress)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GoldCard>
  );
}

