"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle, Lock, Star, Send, AlertCircle } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import type { Score, StageStatus } from "../../../../data/mockData";
import { criteriaList } from "../../../../data/mockData";

const stageStatusMap: Record<string, StageStatus[]> = {
  Audition: ["Audition", "Verified", "PreCamp", "Camp", "GrandFinal", "Winner"],
  "Pre-Camp": ["PreCamp", "Camp", "GrandFinal", "Winner"],
  Camp: ["Camp", "GrandFinal", "Winner"],
  "Grand Final": ["GrandFinal", "Winner"],
};

type ScoreInputState = Partial<Record<keyof Score, string>>;

export default function JudgeScoringPage() {
  const { user, judgeList, participantList, scoreList, setScoreList } = useApp();
  const judgeInfo = judgeList.find((judge) => judge.id === user?.judgeId) ?? judgeList[0];
  const assignedStages = judgeInfo?.stages?.length ? judgeInfo.stages : ["Grand Final"];

  const [activeStage, setActiveStage] = useState<string>(assignedStages[0] ?? "Grand Final");
  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInputState>>({});
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const validStatuses = useMemo(
    () => stageStatusMap[activeStage] ?? ["GrandFinal", "Winner"],
    [activeStage]
  );
  const participants = useMemo(
    () => participantList.filter((participant) => validStatuses.includes(participant.status)),
    [participantList, validStatuses]
  );

  const submittedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const record of scoreList) {
      if (record.judgeId === (judgeInfo?.id ?? "") && record.stage === activeStage) {
        map[record.participantId] = true;
      }
    }
    return map;
  }, [activeStage, judgeInfo?.id, scoreList]);

  const getScoreInputValue = (participantId: string, key: keyof Score) => {
    return scoreInputs[participantId]?.[key] ?? "";
  };

  const getScore = (participantId: string): Score => {
    const inputs = scoreInputs[participantId] ?? {};
    return {
      tourismKnowledge: Number.parseInt(inputs.tourismKnowledge ?? "", 10) || 0,
      publicSpeaking: Number.parseInt(inputs.publicSpeaking ?? "", 10) || 0,
      leadership: Number.parseInt(inputs.leadership ?? "", 10) || 0,
      workProgram: Number.parseInt(inputs.workProgram ?? "", 10) || 0,
      english: Number.parseInt(inputs.english ?? "", 10) || 0,
    };
  };

  const calculateTotal = (score: Score): number => {
    let total = 0;
    for (const criterion of criteriaList) {
      total += (score[criterion.key] * criterion.weight) / 100;
    }
    return Math.round(total * 100) / 100;
  };

  const isComplete = (participantId: string) => {
    const score = getScore(participantId);
    return Object.values(score).every((value) => value > 0);
  };

  const updateScore = (participantId: string, key: keyof Score, rawValue: string) => {
    if (rawValue === "") {
      setScoreInputs((prev) => ({
        ...prev,
        [participantId]: {
          ...(prev[participantId] ?? {}),
          [key]: "",
        },
      }));
      return;
    }

    const parsedValue = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsedValue)) return;

    const nextValue = String(Math.min(100, Math.max(0, parsedValue)));

    setScoreInputs((prev) => ({
      ...prev,
      [participantId]: {
        ...(prev[participantId] ?? {}),
        [key]: nextValue,
      },
    }));
  };

  const handleSubmit = (participantId: string) => {
    if (!isComplete(participantId)) return;

    const participant = participants.find((item) => item.id === participantId);
    if (!participant) return;
    if (submittedMap[participantId]) return;

    const score = getScore(participantId);
    const totalScore = calculateTotal(score);

    setScoreList((prev) => [
      ...prev,
      {
        id: `scr-${Date.now()}-${participantId}`,
        participantId,
        participantName: participant.name,
        judgeId: judgeInfo?.id ?? "J001",
        judgeName: judgeInfo?.name ?? user?.name ?? "Juri",
        stage: activeStage,
        score,
        totalScore,
        submittedAt: new Date().toISOString(),
      },
    ]);

    setConfirmId(null);
    setActiveParticipantId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Input Penilaian
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Berikan penilaian untuk setiap peserta. Nilai yang sudah di-submit tidak dapat diubah.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {assignedStages.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => {
              setActiveStage(stage);
              setActiveParticipantId(null);
              setConfirmId(null);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: activeStage === stage ? "linear-gradient(135deg, #F5D06F, #D4AF37)" : "rgba(212,175,55,0.08)",
              color: activeStage === stage ? "#0F0F0F" : "#D4AF37",
              border: `1px solid ${activeStage === stage ? "transparent" : "rgba(212,175,55,0.2)"}`,
              fontFamily: "var(--font-cinzel)",
              cursor: "pointer",
            }}
          >
            Tahap: {stage}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <GoldCard>
            <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
              Peserta ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => {
                const isSubmitted = Boolean(submittedMap[participant.id]);
                const complete = isComplete(participant.id);
                const isActive = activeParticipantId === participant.id;

                return (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => !isSubmitted && setActiveParticipantId(isActive ? null : participant.id)}
                    disabled={isSubmitted}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isActive
                        ? "rgba(212,175,55,0.12)"
                        : isSubmitted
                        ? "rgba(34,197,94,0.08)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        isActive
                          ? "rgba(212,175,55,0.4)"
                          : isSubmitted
                          ? "rgba(34,197,94,0.25)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      cursor: isSubmitted ? "default" : "pointer",
                    }}
                  >
                    <img src={participant.photo} alt={participant.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {participant.name}
                      </p>
                      <p className="text-xs" style={{ color: "#666" }}>
                        {participant.number} • {participant.gender}
                      </p>
                    </div>

                    {isSubmitted ? (
                      <CheckCircle size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
                    ) : complete ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(212,175,55,0.15)",
                          color: "#D4AF37",
                          fontFamily: "var(--font-poppins)",
                          flexShrink: 0,
                        }}
                      >
                        Siap
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#555", flexShrink: 0 }}>
                        -
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </GoldCard>
        </div>

        <div className="lg:col-span-3">
          {activeParticipantId ? (() => {
            const participant = participants.find((item) => item.id === activeParticipantId);
            if (!participant) return null;

            const score = getScore(activeParticipantId);
            const total = calculateTotal(score);
            const complete = isComplete(activeParticipantId);

            return (
              <GoldCard glow>
                <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                  <img
                    src={participant.photo}
                    alt={participant.name}
                    className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                    style={{ border: "2px solid rgba(212,175,55,0.4)" }}
                  />
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                      {participant.number}
                    </p>
                    <h3 className="text-base font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>
                      {participant.name}
                    </h3>
                    <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                      {participant.education} • {participant.gender}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                      Total Nilai
                    </p>
                    <p className="text-2xl font-bold" style={{ color: total > 0 ? "#D4AF37" : "#444", fontFamily: "var(--font-cinzel)" }}>
                      {total > 0 ? total.toFixed(1) : "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 mb-6">
                  {criteriaList.map((criterion) => (
                    <div key={criterion.key}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                            {criterion.label}
                          </p>
                          <p className="text-xs" style={{ color: "#666" }}>
                            Bobot: {criterion.weight}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={getScoreInputValue(activeParticipantId, criterion.key)}
                            onChange={(event) =>
                              updateScore(
                                activeParticipantId,
                                criterion.key,
                                event.target.value
                              )
                            }
                            placeholder="0"
                            className="w-16 text-center px-2 py-2 rounded-xl text-sm font-bold outline-none"
                            style={{
                              background: "#111",
                              border: `1px solid ${
                                score[criterion.key] > 0 ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.2)"
                              }`,
                              color: "#F5D06F",
                              fontFamily: "var(--font-cinzel)",
                            }}
                          />
                          <span className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                            /100
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full" style={{ background: "#2A2A2A" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${score[criterion.key] || 0}%`,
                            background:
                              score[criterion.key] >= 85
                                ? "#22c55e"
                                : score[criterion.key] >= 70
                                ? "#D4AF37"
                                : score[criterion.key] > 0
                                ? "#F59E0B"
                                : "transparent",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-start gap-2 p-3 rounded-xl mb-5"
                  style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
                >
                  <Lock size={14} style={{ color: "#D4AF37", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                    Setelah submit, nilai tidak dapat diubah dan Anda tidak dapat melihat nilai juri lain.
                  </p>
                </div>

                {!complete ? (
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={14} style={{ color: "#F59E0B" }} />
                    <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      Isi semua kriteria terlebih dahulu sebelum submit.
                    </p>
                  </div>
                ) : null}

                {confirmId === activeParticipantId ? (
                  <div className="flex gap-3">
                    <GoldButton variant="primary" onClick={() => handleSubmit(activeParticipantId)} disabled={!complete}>
                      <CheckCircle size={16} /> Konfirmasi Submit
                    </GoldButton>
                    <GoldButton variant="outline" onClick={() => setConfirmId(null)}>
                      Batal
                    </GoldButton>
                  </div>
                ) : (
                  <GoldButton
                    variant="primary"
                    fullWidth
                    disabled={!complete}
                    onClick={() => setConfirmId(activeParticipantId)}
                  >
                    <Send size={16} />
                    {complete ? "Submit Nilai" : "Isi semua kriteria terlebih dahulu"}
                  </GoldButton>
                )}
              </GoldCard>
            );
          })() : (
            <GoldCard className="flex flex-col items-center justify-center py-16 text-center">
              <Star size={40} style={{ color: "#444", marginBottom: 16 }} />
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Pilih Peserta untuk Dinilai
              </h3>
              <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                Klik nama peserta di panel kiri untuk memulai penilaian.
              </p>
            </GoldCard>
          )}
        </div>
      </div>
    </div>
  );
}
