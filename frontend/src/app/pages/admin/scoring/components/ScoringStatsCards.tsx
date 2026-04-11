"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import { ClipboardList, NotebookPen, Users } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";

type StatsProps = {
  participantsCount: number;
  stageLabel: string;
  submittedParticipantsCount: number;
  isProgressStage: boolean;
  judgeCount: number;
  stageKeyLabel: string;
  notesCount: number;
};

export default function ScoringStatsCards({
  participantsCount,
  stageLabel,
  submittedParticipantsCount,
  isProgressStage,
  judgeCount,
  stageKeyLabel,
  notesCount,
}: StatsProps) {
  const items = [
    {
      label: "Peserta Relevan",
      value: participantsCount,
      sub: `Tahap ${stageLabel}`,
      icon: <Users size={18} />,
      color: "#D4AF37",
    },
    {
      label: isProgressStage ? "Sudah Diceklis" : "Sudah Dinilai",
      value: submittedParticipantsCount,
      sub: isProgressStage
        ? "Progress peserta pada tahap aktif"
        : "Punya nilai resmi",
      icon: <ClipboardList size={18} />,
      color: "#22c55e",
    },
    {
      label:
        stageKeyLabel === "Technical Meeting" || stageKeyLabel === "Pre Camp"
          ? "Tabel Juri"
          : "Juri Aktif",
      value: judgeCount,
      sub:
        stageKeyLabel === "Technical Meeting"
          ? "TM memakai catatan panitia"
          : stageKeyLabel === "Pre Camp"
          ? "Pra karantina tanpa tabel juri"
          : "Juri sesuai tahap aktif",
      icon: <Users size={18} />,
      color: "#60a5fa",
    },
    {
      label: "Catatan Tahap",
      value: notesCount,
      sub: "Catatan manual dan pengamatan",
      icon: <NotebookPen size={18} />,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <GoldCard key={item.label}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-xs mb-1"
                style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
              >
                {item.label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}
              >
                {item.value}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "#666", fontFamily: "var(--font-poppins)" }}
              >
                {item.sub}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `${item.color}18`, color: item.color }}
            >
              {item.icon}
            </div>
          </div>
        </GoldCard>
      ))}
    </div>
  );
}

