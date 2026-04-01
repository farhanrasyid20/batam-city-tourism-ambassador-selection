"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle, Lock, NotebookPen, Send, Star } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import {
  calculateStageTotal,
  getAdminScoreStageLabel,
  getAvailableNoteStages,
  getJudgeAssignedStages,
  getParticipantSelectionStage,
  getStageCriteria,
  getStageScoreRecords,
  mockParticipantStageNotes,
  type JudgeAssignedStageKey,
  type ParticipantNoteStageKey,
  type ParticipantStageNote,
  type Score,
  type ScoreStageKey,
} from "../../../../data/mockData";

type ScoreInputState = Record<string, string>;

const isJudgeScoreStage = (
  stage: JudgeAssignedStageKey,
): stage is ScoreStageKey =>
  stage === "Audition" || stage === "Camp" || stage === "Grand Final";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function JudgeScoringPage() {
  const { user, judgeList, participantList, scoreList, setScoreList } = useApp();
  const judgeInfo = judgeList.find((judge) => judge.id === user?.judgeId) ?? judgeList[0];
  const assignedStages = getJudgeAssignedStages(judgeInfo);
  const [activeStage, setActiveStage] = useState<JudgeAssignedStageKey>(assignedStages[0] ?? "Audition");
  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInputState>>({});
  const [participantNotes, setParticipantNotes] = useState<ParticipantStageNote[]>(
    mockParticipantStageNotes,
  );
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const activeCriteria = isJudgeScoreStage(activeStage)
    ? getStageCriteria(activeStage)
    : [];
  const participants = useMemo(
    () =>
      participantList.filter((participant) => {
        const selectionStage = getParticipantSelectionStage(participant);

        if (activeStage === "Pre Camp") {
          return ["Pre Camp", "Camp", "Grand Final", "Final Result"].includes(
            selectionStage,
          );
        }

        if (activeStage === "Audition") {
          return ["Audition", "Pre Camp", "Camp", "Grand Final", "Final Result"].includes(
            selectionStage,
          );
        }

        if (activeStage === "Camp") {
          return ["Camp", "Grand Final", "Final Result"].includes(selectionStage);
        }

        return ["Grand Final", "Final Result"].includes(selectionStage);
      }),
    [activeStage, participantList],
  );
  const availableNoteStages = useMemo(
    () => getAvailableNoteStages(activeStage),
    [activeStage],
  );

  const submittedMap: Record<string, boolean> = {};
  for (const participant of participants) {
    submittedMap[participant.id] =
      isJudgeScoreStage(activeStage)
        ? getStageScoreRecords(scoreList, participant.id, activeStage, {
            judgeRole: "judge",
            scoreType: "official",
          }).filter((record) => record.judgeId === (judgeInfo?.id ?? "")).length >
          0
        : false;
  }
  const selectedParticipant =
    participants.find((participant) => participant.id === activeParticipantId) ??
    null;
  const visibleNotes = useMemo(() => {
    if (!activeParticipantId) return [];

    return participantNotes
      .filter(
        (note) =>
          note.participantId === activeParticipantId &&
          availableNoteStages.includes(note.stage),
      )
      .sort(
        (a, b) =>
          availableNoteStages.indexOf(a.stage) -
            availableNoteStages.indexOf(b.stage) ||
          a.createdAt.localeCompare(b.createdAt),
      );
  }, [activeParticipantId, availableNoteStages, participantNotes]);

  const getScore = (participantId: string): Score => {
    const inputs = scoreInputs[participantId] ?? {};
    const score: Score = {};
    activeCriteria.forEach((criterion) => {
      score[criterion.key] = Number.parseInt(inputs[criterion.key] ?? "", 10) || 0;
    });
    return score;
  };

  const isComplete = (participantId: string) => {
    if (!isJudgeScoreStage(activeStage)) return true;

    const inputs = scoreInputs[participantId] ?? {};
    return activeCriteria.every((criterion) => {
      const rawValue = inputs[criterion.key];
      if (rawValue === undefined || rawValue === "") return false;
      const parsedValue = Number.parseInt(rawValue, 10);
      return !Number.isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 100;
    });
  };

  const updateScore = (participantId: string, key: string, rawValue: string) => {
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

  // Nama juri di catatan dibuat otomatis dari akun yang sedang login.
  const handleSaveNote = (participantId: string) => {
    const participant = participants.find((item) => item.id === participantId);
    const content = noteDrafts[participantId]?.trim();

    if (!participant || !content) return;

    setParticipantNotes((prev) => [
      ...prev,
      {
        id: `judge-note-${Date.now()}-${participantId}`,
        participantId,
        participantName: participant.name,
        stage: activeStage as ParticipantNoteStageKey,
        authorName: judgeInfo?.name ?? user?.name ?? "Juri",
        authorRole: "judge",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);

    setNoteDrafts((prev) => ({
      ...prev,
      [participantId]: "",
    }));
  };

  const handleSubmit = (participantId: string) => {
    if (!isJudgeScoreStage(activeStage)) return;
    if (!isComplete(participantId) || submittedMap[participantId]) return;
    const participant = participants.find((item) => item.id === participantId);
    if (!participant) return;

    const score = getScore(participantId);
    const totalScore = calculateStageTotal(score, activeStage);

    setScoreList((prev) => [
      ...prev,
      {
        id: `scr-${Date.now()}-${participantId}`,
        participantId,
        participantName: participant.name,
        judgeId: judgeInfo?.id ?? "J001",
        judgeName: judgeInfo?.name ?? user?.name ?? "Juri",
        stage: activeStage,
        stageKey: activeStage,
        judgeRole: "judge",
        scoreType: "official",
        visibility: "panel",
        score,
        totalScore,
        submittedAt: new Date().toISOString(),
      },
    ]);

    setConfirmId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Penilaian & Catatan Juri
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Pra karantina dipakai untuk catatan peserta, sedangkan audisi, karantina, dan grand final tetap memakai nilai resmi.
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
            Tahap: {getAdminScoreStageLabel(stage)}
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
                    onClick={() => setActiveParticipantId(isActive ? null : participant.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isActive ? "rgba(212,175,55,0.12)" : isSubmitted ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? "rgba(212,175,55,0.4)" : isSubmitted ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <Image src={participant.photo} alt={participant.name} width={36} height={36} unoptimized className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {participant.name}
                      </p>
                      <p className="text-xs" style={{ color: "#666" }}>
                        {participant.number} - {participant.gender}
                      </p>
                    </div>

                    {isJudgeScoreStage(activeStage) && isSubmitted ? (
                      <CheckCircle size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
                    ) : isJudgeScoreStage(activeStage) && complete ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", fontFamily: "var(--font-poppins)", flexShrink: 0 }}>
                        Siap
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontFamily: "var(--font-poppins)", flexShrink: 0 }}>
                        Note
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </GoldCard>
        </div>

        <div className="lg:col-span-3">
          {selectedParticipant ? (() => {
            const participant = selectedParticipant;

            const score = getScore(participant.id);
            const total = isJudgeScoreStage(activeStage)
              ? calculateStageTotal(score, activeStage)
              : 0;
            const complete = isComplete(participant.id);
            const isSubmitted = submittedMap[participant.id];

            return (
              <GoldCard glow>
                <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                  <Image src={participant.photo} alt={participant.name} width={56} height={56} unoptimized className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" style={{ border: "2px solid rgba(212,175,55,0.4)" }} />
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>{participant.number}</p>
                    <h3 className="text-base font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>{participant.name}</h3>
                    <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>{participant.education} - {participant.gender}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs mb-1" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                      {isJudgeScoreStage(activeStage) ? "Total Nilai" : "Mode"}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: isJudgeScoreStage(activeStage) && total > 0 ? "#D4AF37" : "#444", fontFamily: "var(--font-cinzel)" }}>
                      {isJudgeScoreStage(activeStage) ? (total > 0 ? total.toFixed(1) : "-") : "Note"}
                    </p>
                  </div>
                </div>

                {!isJudgeScoreStage(activeStage) ? (
                  <div className="mb-5 p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <NotebookPen size={14} style={{ color: "#60a5fa" }} />
                      <p className="text-xs font-semibold" style={{ color: "#60a5fa", fontFamily: "var(--font-poppins)" }}>
                        Catatan Tahap
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                      Tahap {getAdminScoreStageLabel(activeStage)} tidak memakai nilai angka. Juri cukup menuliskan catatan peserta.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-5 mb-6">
                  {activeCriteria.map((criterion) => (
                    <div key={criterion.key}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                            {criterion.label}
                          </p>
                          <p className="text-xs" style={{ color: "#666" }}>Bobot: {criterion.weight}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={scoreInputs[participant.id]?.[criterion.key] ?? ""}
                            onChange={(event) => updateScore(participant.id, criterion.key, event.target.value)}
                            placeholder="0"
                            className="w-20 text-center px-2 py-2 rounded-xl text-sm font-bold outline-none"
                            style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5D06F", fontFamily: "var(--font-cinzel)" }}
                          />
                          <span className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>/100</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                      Pemberi Catatan
                    </p>
                    <p className="text-sm" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                      {judgeInfo?.name ?? user?.name ?? "Juri"}
                    </p>
                  </div>
                  <label className="block text-xs mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)", fontWeight: 600 }}>
                    Catatan Tahap {getAdminScoreStageLabel(activeStage)}
                  </label>
                  <textarea
                    value={noteDrafts[participant.id] ?? ""}
                    onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [participant.id]: event.target.value }))}
                    placeholder="Tulis catatan pengamatan untuk peserta ini."
                    className="w-full min-h-24 px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "#111", border: "1px solid rgba(212,175,55,0.25)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  />
                  <div className="mt-3">
                    <GoldButton variant="outline" onClick={() => handleSaveNote(participant.id)} disabled={!noteDrafts[participant.id]?.trim()}>
                      <NotebookPen size={16} />
                      Simpan Catatan
                    </GoldButton>
                  </div>
                </div>

                <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto pr-1">
                  {availableNoteStages.map((stage) => {
                    const stageNotes = visibleNotes.filter((note) => note.stage === stage);

                    return (
                      <div key={stage}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                            {getAdminScoreStageLabel(stage)}
                          </p>
                          <span className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                            {stageNotes.length} catatan
                          </span>
                        </div>

                        {stageNotes.length === 0 ? (
                          <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                              Belum ada catatan pada tahap ini.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {stageNotes.map((note) => (
                              <div key={note.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div>
                                    <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                                      {note.authorName}
                                    </p>
                                    <p className="text-xs" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
                                      {note.authorRole === "committee" ? "Panitia" : note.authorRole === "admin" ? "Admin" : "Juri"}
                                    </p>
                                  </div>
                                  <span className="text-[11px]" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                                    {formatDateTime(note.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs leading-6" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                                  {note.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isJudgeScoreStage(activeStage) ? (
                  <>
                    <div className="flex items-start gap-2 p-3 rounded-xl mb-5" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                      <Lock size={14} style={{ color: "#D4AF37", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                        Setelah submit, nilai tidak dapat diubah. Catatan tahap tetap bisa ditambahkan terpisah.
                      </p>
                    </div>

                    {!complete ? (
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={14} style={{ color: "#F59E0B" }} />
                        <p className="text-xs" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                          Isi semua kriteria dengan rentang nilai 0-100 sebelum submit.
                        </p>
                      </div>
                    ) : null}

                    {isSubmitted ? (
                      <GoldButton variant="outline" fullWidth disabled>
                        <CheckCircle size={16} />
                        Nilai Sudah Disubmit
                      </GoldButton>
                    ) : confirmId === participant.id ? (
                      <div className="flex gap-3">
                        <GoldButton variant="primary" onClick={() => handleSubmit(participant.id)} disabled={!complete}>
                          <CheckCircle size={16} /> Konfirmasi Submit
                        </GoldButton>
                        <GoldButton variant="outline" onClick={() => setConfirmId(null)}>
                          Batal
                        </GoldButton>
                      </div>
                    ) : (
                      <GoldButton variant="primary" fullWidth disabled={!complete} onClick={() => setConfirmId(participant.id)}>
                        <Send size={16} />
                        {complete ? "Submit Nilai" : "Isi semua kriteria terlebih dahulu"}
                      </GoldButton>
                    )}
                  </>
                ) : null}
              </GoldCard>
            );
          })() : (
            <GoldCard className="flex flex-col items-center justify-center py-16 text-center">
              <Star size={40} style={{ color: "#444", marginBottom: 16 }} />
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
                Pilih Peserta
              </h3>
              <p className="text-xs" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
                Klik nama peserta di panel kiri untuk membuka nilai atau catatan sesuai tahap aktif.
              </p>
            </GoldCard>
          )}
        </div>
      </div>
    </div>
  );
}
