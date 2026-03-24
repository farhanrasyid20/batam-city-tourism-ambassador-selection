"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Trophy, Crown, ClipboardList, Users, NotebookPen } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { useApp } from "../../../../context/AppContext";
import {
  getAdminScoreStageLabel,
  getAverageStageScore,
  getJudgeAssignedStages,
  getParticipantAdminStageScore,
  getStageCriteriaAverages,
  getStageScoreRecords,
  getStageCriteria,
  isParticipantEligibleForScoreStage,
  stages,
  type AdminScoreStage,
  type Participant,
} from "../../../../data/mockData";

type GenderFilter = "Semua" | "Encik" | "Puan";
type RankedParticipant = Participant & { score: number };

const stageOptions: AdminScoreStage[] = [...stages, "Final Result"];

export default function AdminScoresPage() {
  const { participantList, judgeList, scoreList } = useApp();
  const [activeStage, setActiveStage] = useState<AdminScoreStage>("Grand Final");
  const [activeGender, setActiveGender] = useState<GenderFilter>("Semua");

  const participants = useMemo(() => {
    return participantList.filter((participant) => {
      const genderMatch = activeGender === "Semua" || participant.gender === activeGender;
      if (!genderMatch) return false;
      if (activeStage === "Final Result") return isParticipantEligibleForScoreStage(participant, "Grand Final");
      return isParticipantEligibleForScoreStage(participant, activeStage);
    });
  }, [activeGender, activeStage, participantList]);

  const rankings = useMemo<RankedParticipant[]>(() => {
    return participants
      .map((participant) => {
        const score = getParticipantAdminStageScore(scoreList, participant.id, activeStage);

        return { ...participant, score };
      })
      .filter((participant) => participant.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [activeStage, participants, scoreList]);

  const judgesForStage = useMemo(() => {
    if (activeStage === "Final Result") {
      return judgeList.filter((judge) => judge.judgeType !== "mentor");
    }

    return judgeList.filter((judge) => getJudgeAssignedStages(judge).includes(activeStage));
  }, [activeStage, judgeList]);

  const activeCriteria = useMemo(() => (activeStage === "Final Result" ? [] : getStageCriteria(activeStage)), [activeStage]);
  const submittedParticipantsCount = rankings.length;
  const activeJudgeCount = judgesForStage.length;
  const mentorObservationCount = useMemo(() => {
    if (activeStage !== "Camp") return 0;

    return participants.reduce((sum, participant) => {
      return sum + getStageScoreRecords(scoreList, participant.id, "Camp", {
        judgeRole: "mentor",
        scoreType: "mentor_observation",
      }).length;
    }, 0);
  }, [activeStage, participants, scoreList]);

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Tahapan & Nilai
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Rekap resmi untuk audisi, karantina, grand final, dan nilai akhir 30/70.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {stageOptions.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeStage === stage ? "linear-gradient(135deg, #F5D06F, #D4AF37)" : "rgba(212,175,55,0.08)",
                color: activeStage === stage ? "#0F0F0F" : "#D4AF37",
                border: `1px solid ${activeStage === stage ? "transparent" : "rgba(212,175,55,0.2)"}`,
                fontFamily: "var(--font-cinzel)",
                cursor: "pointer",
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
              onClick={() => setActiveGender(gender)}
              className="px-4 py-2 rounded-xl text-xs transition-all"
              style={{
                background: activeGender === gender ? "rgba(212,175,55,0.15)" : "transparent",
                border: `1px solid ${activeGender === gender ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: activeGender === gender ? "#D4AF37" : "#888",
                fontFamily: "var(--font-poppins)",
                cursor: "pointer",
              }}
              type="button"
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Peserta Relevan",
            value: participants.length,
            sub: `Tahap ${getAdminScoreStageLabel(activeStage)}`,
            icon: <Users size={18} />,
            color: "#D4AF37",
          },
          {
            label: "Sudah Dinilai",
            value: submittedParticipantsCount,
            sub: "Punya nilai resmi",
            icon: <ClipboardList size={18} />,
            color: "#22c55e",
          },
          {
            label: "Juri Aktif",
            value: activeJudgeCount,
            sub: activeStage === "Camp" ? "Utama dan mentor sesuai tugas" : "Sesuai assignment tahap",
            icon: <Users size={18} />,
            color: "#60a5fa",
          },
          {
            label: activeStage === "Camp" ? "Catatan Mentor" : "Progress Tahap",
            value: activeStage === "Camp" ? mentorObservationCount : submittedParticipantsCount,
            sub: activeStage === "Camp" ? "Observasi masuk ke karantina" : "Peserta yang sudah punya nilai",
            icon: <NotebookPen size={18} />,
            color: activeStage === "Camp" ? "#f59e0b" : "#D4AF37",
          },
        ].map((item) => (
          <GoldCard key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                  {item.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                  {item.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GoldCard glow>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Ranking Tahap {getAdminScoreStageLabel(activeStage)}
              </h3>
              <span className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                {rankings.length} peserta
              </span>
            </div>

            {rankings.length === 0 ? (
              <div className="py-8 text-center">
                <Trophy size={32} style={{ color: "#444", margin: "0 auto 12px" }} />
                <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                  Belum ada nilai resmi pada tahap ini
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankings.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-4 p-3 rounded-xl transition-all"
                    style={{
                      background: index === 0 ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${index === 0 ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: index === 0 ? "linear-gradient(135deg, #F5D06F, #D4AF37)" : "rgba(255,255,255,0.08)", color: index === 0 ? "#0F0F0F" : "#888", fontFamily: "var(--font-cinzel)" }}>
                      {index + 1}
                    </div>

                    <Image src={participant.photo} alt={participant.name} width={36} height={36} unoptimized className="w-9 h-9 rounded-full object-cover flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {participant.name}
                      </p>
                      <p className="text-xs" style={{ color: "#888" }}>
                        {participant.number} • {participant.gender}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold" style={{ color: index === 0 ? "#D4AF37" : "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                        {participant.score.toFixed(1)}
                      </p>
                      <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                        Nilai
                      </p>
                    </div>

                    {index < 3 ? <Crown size={16} style={{ color: index === 0 ? "#D4AF37" : "#888" }} /> : null}
                  </div>
                ))}
              </div>
            )}
          </GoldCard>
        </div>

        <div>
          <GoldCard>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
              Juri Tahap {getAdminScoreStageLabel(activeStage)}
            </h3>
            <div className="space-y-3">
              {judgesForStage.map((judge) => (
                <div key={judge.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Image src={judge.avatar} alt={judge.name} width={36} height={36} unoptimized className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>{judge.name}</p>
                    <p className="text-xs" style={{ color: "#888" }}>{judge.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </GoldCard>

          <GoldCard className="mt-4">
            <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
              Ringkasan Rubrik
            </h3>
            {activeStage === "Final Result" ? (
              <div className="space-y-2 text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                <p>Karantina: 30%</p>
                <p>Grand Final: 70%</p>
                <p>Audisi hanya dipakai untuk seleksi ke tahap berikutnya.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCriteria.map((criteria) => (
                  <div key={criteria.key} className="flex justify-between items-center">
                    <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>{criteria.label}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                      {criteria.weight}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GoldCard>
        </div>
      </div>

      <GoldCard className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Detail Rekap {getAdminScoreStageLabel(activeStage)}
          </h3>
          <span className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
            {rankings.length} baris rekap
          </span>
        </div>

        {rankings.length === 0 ? (
          <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
            Belum ada rekap detail karena nilai resmi pada tahap ini belum masuk.
          </p>
        ) : (
          <div className="space-y-3">
            {rankings.map((participant, index) => {
              const officialJudgeCount =
                activeStage === "Final Result"
                  ? new Set(
                      [
                        ...getStageScoreRecords(scoreList, participant.id, "Camp", {
                          judgeRole: "main",
                          scoreType: "official",
                        }).map((record) => record.judgeId),
                        ...getStageScoreRecords(scoreList, participant.id, "Grand Final", {
                          judgeRole: "main",
                          scoreType: "official",
                        }).map((record) => record.judgeId),
                      ]
                    ).size
                  : getStageScoreRecords(scoreList, participant.id, activeStage, {
                      judgeRole: "main",
                      scoreType: "official",
                    }).length;
              const mentorNotes =
                activeStage === "Camp"
                  ? getStageScoreRecords(scoreList, participant.id, "Camp", {
                      judgeRole: "mentor",
                      scoreType: "mentor_observation",
                    }).length
                  : 0;
              const criterionAverages =
                activeStage === "Final Result"
                  ? []
                  : getStageCriteriaAverages(scoreList, participant.id, activeStage, {
                      judgeRole: "main",
                      scoreType: "official",
                    });
              const campScore =
                activeStage === "Final Result"
                  ? getAverageStageScore(scoreList, participant.id, "Camp", {
                      judgeRole: "main",
                      scoreType: "official",
                    })
                  : 0;
              const grandFinalScore =
                activeStage === "Final Result"
                  ? getAverageStageScore(scoreList, participant.id, "Grand Final", {
                      judgeRole: "main",
                      scoreType: "official",
                    })
                  : 0;

              return (
                <div
                  key={`${activeStage}-${participant.id}`}
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(212,175,55,0.14)", color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
                    >
                      {index + 1}
                    </div>
                    <Image src={participant.photo} alt={participant.name} width={40} height={40} unoptimized className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {participant.name}
                      </p>
                      <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                        {participant.number} • {participant.gender}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                        {participant.score.toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                        Total
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                      <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                        {activeStage === "Final Result" ? "Juri Kontributor" : "Nilai Resmi Masuk"}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {officialJudgeCount} juri
                      </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                        {activeStage === "Camp" ? "Observasi Mentor" : "Status Rekap"}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {activeStage === "Camp" ? `${mentorNotes} catatan` : "Nilai resmi tercatat"}
                      </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>Tahap</p>
                      <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {getAdminScoreStageLabel(activeStage)}
                      </p>
                    </div>
                  </div>

                  {activeStage === "Final Result" ? (
                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        { label: "Karantina", value: campScore },
                        { label: "Grand Final", value: grandFinalScore },
                        { label: "Nilai Akhir 30/70", value: participant.score },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>{item.label}</p>
                          <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                            {item.value.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {activeCriteria.map((criteria, criteriaIndex) => (
                        <div key={`${participant.id}-${criteria.key}`} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>{criteria.label}</p>
                          <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                            {(criterionAverages[criteriaIndex] ?? 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GoldCard>
    </div>
  );
}
