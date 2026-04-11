"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import {
  getAdminScoreStageLabel,
  type AdminScoreStage,
} from "../../../../../data/mockData";

type GenderFilter = "Semua" | "Encik" | "Puan";

type StageToolbarProps = {
  activeStage: AdminScoreStage;
  activeGender: GenderFilter;
  onStageChange: (stage: AdminScoreStage) => void;
  onGenderChange: (gender: GenderFilter) => void;
  stageOptions: AdminScoreStage[];
};

export default function StageToolbar({
  activeStage,
  activeGender,
  onStageChange,
  onGenderChange,
  stageOptions,
}: StageToolbarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="flex gap-2 flex-wrap">
        {stageOptions.map((stage) => (
          <button
            key={stage}
            onClick={() => onStageChange(stage)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background:
                activeStage === stage
                  ? "linear-gradient(135deg, #F5D06F, #D4AF37)"
                  : "rgba(212,175,55,0.08)",
              color: activeStage === stage ? "#0F0F0F" : "#D4AF37",
              border: `1px solid ${
                activeStage === stage
                  ? "transparent"
                  : "rgba(212,175,55,0.2)"
              }`,
              fontFamily: "var(--font-cinzel)",
            }}
            type="button"
          >
            {getAdminScoreStageLabel(stage)}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["Semua", "Encik", "Puan"] as const).map((gender) => (
          <button
            key={gender}
            onClick={() => onGenderChange(gender)}
            className="px-4 py-2 rounded-xl text-xs transition-all"
            style={{
              background:
                activeGender === gender
                  ? "rgba(212,175,55,0.15)"
                  : "transparent",
              border: `1px solid ${
                activeGender === gender
                  ? "rgba(212,175,55,0.5)"
                  : "rgba(255,255,255,0.08)"
              }`,
              color: activeGender === gender ? "#D4AF37" : "#888",
              fontFamily: "var(--font-poppins)",
            }}
            type="button"
          >
            {gender}
          </button>
        ))}
      </div>
    </div>
  );
}

