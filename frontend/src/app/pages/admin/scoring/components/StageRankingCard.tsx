"use client";

import React from "react";
import Image from "next/image";
import { Crown, Trophy } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";

type RankedParticipant = {
  id: string;
  name: string;
  number: string;
  gender: string;
  photo: string;
  score: number;
};

type StageRankingCardProps = {
  stageLabel: string;
  activeStage: string;
  rankings: RankedParticipant[];
  selectedParticipantId: string | null;
  onSelectParticipant: (participantId: string) => void;
};

export default function StageRankingCard({
  stageLabel,
  activeStage,
  rankings,
  selectedParticipantId,
  onSelectParticipant,
}: StageRankingCardProps) {
  return (
    <GoldCard glow>
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-sm font-bold"
          style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
        >
          Ranking Tahap {stageLabel}
        </h3>
        <span
          className="text-xs"
          style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
        >
          {rankings.length} peserta
        </span>
      </div>

      {rankings.length === 0 ? (
        <div className="py-8 text-center">
          <Trophy size={32} style={{ color: "#444", margin: "0 auto 12px" }} />
          <p
            className="text-sm"
            style={{ color: "#666", fontFamily: "var(--font-poppins)" }}
          >
            {activeStage === "Technical Meeting" || activeStage === "Pre Camp"
              ? "Tahap ini belum memakai ranking nilai resmi."
              : "Belum ada nilai resmi pada tahap ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Ubah blok ini kalau nanti kartu ranking peserta mau dibuat lebih ringkas atau lebih detail. */}
          {rankings.map((participant, index) => (
            <button
              key={participant.id}
              type="button"
              onClick={() => onSelectParticipant(participant.id)}
              className="w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left"
              style={{
                background:
                  selectedParticipantId === participant.id
                    ? "rgba(212,175,55,0.18)"
                    : index === 0
                      ? "rgba(212,175,55,0.12)"
                      : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  selectedParticipantId === participant.id
                    ? "rgba(212,175,55,0.38)"
                    : index === 0
                      ? "rgba(212,175,55,0.3)"
                      : "rgba(255,255,255,0.05)"
                }`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
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
                width={36}
                height={36}
                unoptimized
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{
                    color: "#F5E6C8",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {participant.name}
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
              </div>

              <div className="text-right">
                <p
                  className="text-base font-bold"
                  style={{
                    color: index === 0 ? "#D4AF37" : "#F5E6C8",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  {participant.score.toFixed(1)}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: "#666",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  Nilai
                </p>
              </div>

              {index < 3 ? (
                <Crown
                  size={16}
                  style={{ color: index === 0 ? "#D4AF37" : "#888" }}
                />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </GoldCard>
  );
}
