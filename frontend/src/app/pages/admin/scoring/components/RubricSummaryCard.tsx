"use client";

import React from "react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import {
  getStageCriteria,
  type AdminScoreStage,
  type ScoreStageKey,
} from "../../../../../data/mockData";

type RubricSummaryCardProps = {
  activeStage: AdminScoreStage;
  isScoreStage: boolean;
};

export default function RubricSummaryCard({
  activeStage,
  isScoreStage,
}: RubricSummaryCardProps) {
  return (
    <GoldCard>
      <h3
        className="text-sm font-bold mb-4"
        style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
      >
        Ringkasan Rubrik
      </h3>

      {activeStage === "Final Result" ? (
        <div
          className="space-y-2 text-xs"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          <p>Karantina: 30%</p>
          <p>Grand Final: 70%</p>
          <p>Catatan tetap bisa dilihat penuh dari TM sampai grand final.</p>
        </div>
      ) : !isScoreStage ? (
        <div
          className="space-y-2 text-xs"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          <p>Tahap ini dipakai untuk checklist progres dan catatan peserta.</p>
          <p>Belum ada rubrik nilai resmi.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Daftar bobot penilaian resmi per tahap ada di sini. */}
          {getStageCriteria(activeStage as ScoreStageKey).map((criteria) => (
            <div
              key={criteria.key}
              className="flex justify-between items-center gap-3"
            >
              <p
                className="text-xs"
                style={{
                  color: "#BDBDBD",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {criteria.label}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(212,175,55,0.15)",
                  color: "#D4AF37",
                  fontFamily: "var(--font-cinzel)",
                }}
              >
                {criteria.weight}%
              </span>
            </div>
          ))}
        </div>
      )}
    </GoldCard>
  );
}
