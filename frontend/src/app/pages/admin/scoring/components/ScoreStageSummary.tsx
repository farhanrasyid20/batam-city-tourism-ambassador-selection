"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";

type RankedParticipant = {
  id: string;
  name: string;
  nickname?: string;
  number: string;
  gender: string;
  photo: string;
  score: number;
};

type ScoreStageSummaryProps = {
  title: string;
  activeStage: string;
  rankings: RankedParticipant[];
  officialScoreCount: number;
  averageStageScore: number;
  selectedParticipantId: string | null;
  onSelectParticipant: (participantId: string) => void;
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const getDisplayParticipantName = (participant: RankedParticipant) => {
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

export default function ScoreStageSummary({
  title,
  activeStage,
  rankings,
  officialScoreCount,
  averageStageScore,
  selectedParticipantId,
  onSelectParticipant,
}: ScoreStageSummaryProps) {
  const topPerformer = rankings[0] ?? null;

  return (
    <GoldCard glow className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3
            className="text-sm font-bold"
            style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
          >
            {title}
          </h3>
          <p
            className="text-xs mt-1"
            style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
          >
            Rekap cepat nilai resmi juri pada tahap aktif, supaya halaman ini
            tetap menonjolkan nilai selain tahapan.
          </p>
        </div>
        <span
          className="text-xs"
          style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
        >
          {officialScoreCount} entri nilai
        </span>
      </div>

      {rankings.length === 0 ? (
        <div className="py-10 text-center">
          <Trophy size={34} style={{ color: "#444", margin: "0 auto 12px" }} />
          <p
            className="text-sm"
            style={{ color: "#666", fontFamily: "var(--font-poppins)" }}
          >
            {activeStage === "Technical Meeting" || activeStage === "Pre Camp"
              ? "Tahap ini fokus pada progres dan catatan, jadi belum ada ranking nilai."
              : "Nilai juri pada tahap ini belum cukup untuk membentuk ranking."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.18)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                Peringkat 1
              </p>
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
              >
                {topPerformer ? getDisplayParticipantName(topPerformer) : "-"}
              </p>
              <p
                className="text-lg mt-2 font-bold"
                style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
              >
                {topPerformer ? topPerformer.score.toFixed(2) : "-"}
              </p>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                Rata-rata Tahap
              </p>
              <p
                className="text-lg mt-2 font-bold"
                style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}
              >
                {averageStageScore.toFixed(2)}
              </p>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                Peserta Bernilai
              </p>
              <p
                className="text-lg mt-2 font-bold"
                style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}
              >
                {rankings.length}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {rankings.slice(0, 5).map((participant, index) => (
              <button
                key={`summary-${participant.id}`}
                type="button"
                onClick={() => onSelectParticipant(participant.id)}
                className="w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left"
                style={{
                  background:
                    selectedParticipantId === participant.id
                      ? "rgba(212,175,55,0.18)"
                      : "rgba(255,255,255,0.02)",
                  border: `1px solid ${
                    selectedParticipantId === participant.id
                      ? "rgba(212,175,55,0.38)"
                      : "rgba(255,255,255,0.05)"
                  }`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #F5D06F, #D4AF37)"
                        : "rgba(255,255,255,0.08)",
                    color: index === 0 ? "#0F0F0F" : "#888",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  {index + 1}
                </div>

                <Image
                  src={participant.photo}
                  alt={participant.name}
                  width={38}
                  height={38}
                  unoptimized
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  >
                    {getDisplayParticipantName(participant)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
                  >
                    {participant.number} - {participant.gender}
                  </p>
                </div>

                <p
                  className="text-base font-bold"
                  style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
                >
                  {participant.score.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </GoldCard>
  );
}

