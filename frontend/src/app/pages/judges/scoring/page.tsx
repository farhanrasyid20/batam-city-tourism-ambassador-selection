"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle, Lock, NotebookPen, Send, Star } from "lucide-react";
import GoldCard from "../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { useApp } from "../../../../context/AppContext";
import { getReadableApiError, resolveApiAssetUrl } from "../../../../lib/api";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import {
  fetchJudgeNotes,
  submitJudgeNote,
  type BackendJudgeNote,
} from "../../../../lib/judge-note-api";
import {
  fetchJudgeScores,
  submitJudgeScore,
  type BackendJudgeScore,
} from "../../../../lib/judge-score-api";
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
  type ParticipantStageNote,
  type ScoreRecord,
  type Score,
  type ScoreStageKey,
} from "../../../../data/mockData";

type ScoreInputState = Record<string, string>;

const isJudgeScoreStage = (
  stage: JudgeAssignedStageKey,
): stage is ScoreStageKey =>
  stage === "Audition" || stage === "Camp" || stage === "Grand Final";

const extractTrailingNumber = (value?: string | null) => {
  const raw = (value ?? "").trim();
  const match = raw.match(/(\d{1,5})$/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const getParticipantDisplayName = (name: string, gender: "Encik" | "Puan") => {
  const normalized = name.trim().replace(/^(encik|puan)\s+/i, "");
  const nickname = normalized.split(/\s+/)[0] ?? "";
  const finalName = toTitleCase(nickname || normalized || "Peserta");
  return `${gender} ${finalName}`.trim();
};

const formatNoteMeta = (createdAt: string, role: "admin" | "judge" | "committee") => {
  const roleLabel = role === "committee" ? "Panitia" : role === "admin" ? "Admin" : "Juri";
  const dayDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(createdAt));
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
  return { roleLabel, dayDate, time };
};

function toFrontendScoreRecord(item: BackendJudgeScore): ScoreRecord {
  return {
    id: `db-judge-score-${item.id}`,
    participantId: item.participant_id,
    participantName: item.participant_name ?? "Peserta",
    judgeId: `J_API_${item.judge_user_id}`,
    judgeName: item.judge_name ?? "Juri",
    stage: item.stage,
    stageKey: item.stage,
    judgeRole: "judge",
    scoreType: item.score_type,
    visibility: "panel",
    score: item.score,
    totalScore: item.total_score,
    note: item.note ?? undefined,
    submittedAt: item.submitted_at ?? item.created_at ?? new Date().toISOString(),
  };
}

function toFrontendNoteRecord(item: BackendJudgeNote): FrontendParticipantStageNote {
  return {
    id: `db-judge-note-${item.id}`,
    participantId: item.participant_id,
    participantName: item.participant_name ?? "Peserta",
    stage: item.stage as ParticipantStageNote["stage"],
    authorName: item.author_name ?? "Juri",
    authorRole: item.author_role,
    authorAvatar: item.author_avatar ?? undefined,
    content: item.content,
    createdAt: item.created_at,
    authorUserId: item.author_user_id,
  };
}

type FrontendParticipantStageNote = ParticipantStageNote & {
  authorUserId?: number;
  authorAvatar?: string;
};

function mergeJudgeOfficialScores(prev: ScoreRecord[], nextDbScores: ScoreRecord[]): ScoreRecord[] {
  const preserved = prev.filter(
    (item) => !(item.judgeRole === "judge" && (item.scoreType ?? "official") === "official")
  );

  const deduped = new Map<string, ScoreRecord>();
  for (const item of [...nextDbScores, ...preserved]) {
    const key = [
      item.participantId,
      item.judgeId,
      item.stageKey ?? item.stage,
      item.scoreType ?? "official",
      item.judgeRole ?? "main",
    ].join("|");
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values());
}

export default function JudgeScoringPage() {
  const { user, judgeList, participantList, voteCandidateList, scoreList, setScoreList } = useApp();
  const judgeInfo = judgeList.find((judge) => judge.id === user?.judgeId) ?? judgeList[0];
  const assignedStages = getJudgeAssignedStages(judgeInfo);
  const token = useMemo(() => getParticipantAuthSession()?.token ?? "", []);
  const [activeStage, setActiveStage] = useState<JudgeAssignedStageKey>(assignedStages[0] ?? "Audition");
  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInputState>>({});
  const [participantNotes, setParticipantNotes] = useState<FrontendParticipantStageNote[]>(
    mockParticipantStageNotes,
  );
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loadingDbScores, setLoadingDbScores] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [submittingParticipantId, setSubmittingParticipantId] = useState<string | null>(null);
  const [submittingNoteParticipantId, setSubmittingNoteParticipantId] = useState<string | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    type: "success" | "warning" | "info";
    text: string;
  } | null>(null);

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
      }).sort((a, b) => {
        if (activeStage === "Audition") {
          const aOrder = extractTrailingNumber(a.auditionNumber ?? a.number);
          const bOrder = extractTrailingNumber(b.auditionNumber ?? b.number);
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name, "id-ID");
        }

        const aOrder = extractTrailingNumber(a.participantCode ?? a.number);
        const bOrder = extractTrailingNumber(b.participantCode ?? b.number);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name, "id-ID");
      }),
    [activeStage, participantList],
  );
  const availableNoteStages = useMemo(
    () => getAvailableNoteStages(activeStage),
    [activeStage],
  );

  const reloadScoresFromDb = async () => {
    if (!token) return;
    const response = await fetchJudgeScores(token);
    const mapped = response.data
      .filter((item) => item.score_type === "official")
      .map(toFrontendScoreRecord);
    setScoreList((prev) => mergeJudgeOfficialScores(prev, mapped));
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoadingDbScores(true);
    setSyncError("");

    void fetchJudgeScores(token)
      .then((response) => {
        if (cancelled) return;
        const mapped = response.data
          .filter((item) => item.score_type === "official")
          .map(toFrontendScoreRecord);
        setScoreList((prev) => mergeJudgeOfficialScores(prev, mapped));
      })
      .then(() => fetchJudgeNotes(token))
      .then((notesResponse) => {
        if (cancelled || !notesResponse) return;
        setParticipantNotes(notesResponse.data.map(toFrontendNoteRecord));
      })
      .catch((err) => {
        if (cancelled) return;
        setSyncError(getReadableApiError(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingDbScores(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setScoreList, token]);

  useEffect(() => {
    if (!inlineNotice) return;
    const timer = window.setTimeout(() => setInlineNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [inlineNotice]);

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
    const persistedRecord =
      isJudgeScoreStage(activeStage) && judgeInfo?.id
        ? getStageScoreRecords(scoreList, participantId, activeStage, {
            judgeRole: "judge",
            scoreType: "official",
          }).find((record) => record.judgeId === judgeInfo.id)
        : null;

    const persistedScore = (persistedRecord?.score ?? {}) as Score;
    const score: Score = {};
    activeCriteria.forEach((criterion) => {
      const rawInput = inputs[criterion.key];
      if (rawInput !== undefined && rawInput !== "") {
        score[criterion.key] = Number.parseInt(rawInput, 10) || 0;
        return;
      }

      score[criterion.key] = Number(persistedScore[criterion.key] ?? 0);
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
  const handleSaveNote = async (participantId: string) => {
    if (!token) {
      setInlineNotice({
        type: "warning",
        text: "Sesi login tidak ditemukan. Silakan login ulang sebelum menyimpan catatan.",
      });
      return;
    }
    const participant = participants.find((item) => item.id === participantId);
    const content = noteDrafts[participantId]?.trim();

    if (!participant) {
      setInlineNotice({
        type: "warning",
        text: "Peserta tidak ditemukan. Pilih ulang peserta lalu simpan catatan.",
      });
      return;
    }

    if (!content) {
      setInlineNotice({
        type: "warning",
        text: "Catatan masih kosong. Tulis catatan dulu sebelum klik Simpan Catatan.",
      });
      return;
    }

    setSubmittingNoteParticipantId(participantId);
    setSyncError("");

    try {
      const response = await submitJudgeNote(token, {
        participant_id: participantId,
        participant_name: participant.name,
        stage: activeStage as BackendJudgeNote["stage"],
        content,
        author_role: "judge",
      });
      const mapped = toFrontendNoteRecord(response.data);
      setParticipantNotes((prev) => [mapped, ...prev]);
      setNoteDrafts((prev) => ({
        ...prev,
        [participantId]: "",
      }));
      setInlineNotice({
        type: "success",
        text: "Catatan berhasil disimpan ke database. Submit nilai tetap proses terpisah.",
      });
    } catch (err) {
      setSyncError(getReadableApiError(err));
      setInlineNotice({
        type: "warning",
        text: "Catatan gagal disimpan. Coba Simpan Catatan lagi.",
      });
    } finally {
      setSubmittingNoteParticipantId(null);
    }
  };

  const handleSubmit = async (participantId: string) => {
    if (!isJudgeScoreStage(activeStage)) return;
    if (!isComplete(participantId) || submittedMap[participantId]) return;
    if (!token) {
      setInlineNotice({
        type: "warning",
        text: "Sesi login tidak ditemukan. Silakan login ulang sebelum submit nilai.",
      });
      return;
    }
    const participant = participants.find((item) => item.id === participantId);
    if (!participant) return;

    const unsavedNote = noteDrafts[participantId]?.trim();

    const score = getScore(participantId);
    setSubmittingParticipantId(participantId);
    setSyncError("");

    try {
      const response = await submitJudgeScore(token, {
        participant_id: participantId,
        participant_name: participant.name,
        stage: activeStage,
        score_type: "official",
        score,
      });

      const mapped = toFrontendScoreRecord(response.data);
      setScoreList((prev) => {
        const merged = mergeJudgeOfficialScores(prev, [mapped]);
        return merged;
      });
      await reloadScoresFromDb();

      if (unsavedNote) {
        try {
          const noteResponse = await submitJudgeNote(token, {
            participant_id: participantId,
            participant_name: participant.name,
            stage: activeStage as BackendJudgeNote["stage"],
            content: unsavedNote,
            author_role: "judge",
          });
          const mappedNote = toFrontendNoteRecord(noteResponse.data);
          setParticipantNotes((prev) => [mappedNote, ...prev]);
          setNoteDrafts((prev) => ({
            ...prev,
            [participantId]: "",
          }));

          setInlineNotice({
            type: "success",
            text: "Nilai dan catatan berhasil disimpan bersama.",
          });
        } catch {
          setInlineNotice({
            type: "warning",
            text: "Nilai berhasil disubmit, tapi catatan gagal tersimpan. Silakan klik Simpan Catatan lagi.",
          });
        }
      } else {
        setInlineNotice({
          type: "success",
          text: "Nilai berhasil disubmit ke database.",
        });
      }

      setConfirmId(null);
    } catch (err) {
      setSyncError(getReadableApiError(err));
      setInlineNotice({
        type: "warning",
        text: "Submit nilai gagal. Coba kirim ulang nilainya.",
      });
    } finally {
      setSubmittingParticipantId(null);
    }
  };

  const findJudgeAvatar = (note: FrontendParticipantStageNote) => {
    const avatarFromNote = resolveApiAssetUrl(note.authorAvatar);
    if (avatarFromNote) return avatarFromNote;

    const normalizedName = (note.authorName ?? "").trim().toLowerCase();
    const authorUserId = note.authorUserId;

    const judgeById =
      typeof authorUserId === "number"
        ? judgeList.find((item) => {
            const rawId = String(item.id ?? "");
            if (rawId === `J_API_${authorUserId}`) return true;
            const numeric = Number.parseInt(rawId.replace(/\D/g, ""), 10);
            return Number.isFinite(numeric) && numeric === authorUserId;
          })
        : undefined;

    const judgeByName = normalizedName
      ? judgeList.find(
          (item) => (item.name ?? "").trim().toLowerCase() === normalizedName
        )
      : undefined;

    return resolveApiAssetUrl(judgeById?.avatar ?? judgeByName?.avatar) ?? "/default-avatar.svg";
  };

  const cleanRawPhoto = (value?: string) => {
    const raw = (value ?? "").trim();
    if (!raw) return "";
    const lowered = raw.toLowerCase();
    if (lowered === "null" || lowered === "undefined") return "";
    return raw;
  };

  const getParticipantPhoto = (participantId: string, fallbackPhoto?: string) => {
    // Prioritas: foto publikasi admin (menu vote) -> foto profil peserta -> default
    const fromVoteRaw = voteCandidateList.find(
      (candidate) => candidate.participantId === participantId
    )?.photo;
    const fromVote = resolveApiAssetUrl(cleanRawPhoto(fromVoteRaw));
    if (fromVote) return fromVote;

    const profilePhoto = resolveApiAssetUrl(cleanRawPhoto(fallbackPhoto));
    if (profilePhoto) return profilePhoto;

    return "/default-avatar.svg";
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
        {loadingDbScores ? (
          <p className="text-xs mt-2" style={{ color: "#888", fontFamily: "var(--font-poppins)" }}>
            Menyinkronkan nilai dari database...
          </p>
        ) : null}
        {syncError ? (
          <p className="text-xs mt-2" style={{ color: "#ef4444", fontFamily: "var(--font-poppins)" }}>
            Gagal sinkron nilai: {syncError}
          </p>
        ) : null}
        {inlineNotice ? (
          <p
            className="text-xs mt-2"
            style={{
              color:
                inlineNotice.type === "success"
                  ? "#22c55e"
                  : inlineNotice.type === "warning"
                  ? "#f59e0b"
                  : "#60a5fa",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {inlineNotice.text}
          </p>
        ) : null}
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
                    <Image src={getParticipantPhoto(participant.id, participant.photo)} alt={participant.name} width={36} height={36} unoptimized className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                        {getParticipantDisplayName(participant.name, participant.gender)}
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
                  <Image src={getParticipantPhoto(participant.id, participant.photo)} alt={getParticipantDisplayName(participant.name, participant.gender)} width={56} height={56} unoptimized className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" style={{ border: "2px solid rgba(212,175,55,0.4)" }} />
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>{participant.number}</p>
                    <h3 className="text-base font-bold" style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)" }}>{getParticipantDisplayName(participant.name, participant.gender)}</h3>
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
                            value={
                              scoreInputs[participant.id]?.[criterion.key] ??
                              (isJudgeScoreStage(activeStage) && judgeInfo?.id
                                ? String(
                                    Number(
                                      (
                                        getStageScoreRecords(
                                          scoreList,
                                          participant.id,
                                          activeStage,
                                          { judgeRole: "judge", scoreType: "official" }
                                        ).find((record) => record.judgeId === judgeInfo.id)
                                          ?.score?.[criterion.key] ?? 0
                                      )
                                    )
                                  )
                                : "")
                            }
                            onChange={(event) => updateScore(participant.id, criterion.key, event.target.value)}
                            onWheel={(event) => {
                              if (document.activeElement === event.currentTarget) {
                                event.currentTarget.blur();
                              }
                            }}
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
                  {!!noteDrafts[participant.id]?.trim() && isSubmitted ? (
                    <div
                      className="mb-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(245,158,11,0.12)",
                        border: "1px solid rgba(245,158,11,0.3)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "#F59E0B", fontFamily: "var(--font-poppins)" }}
                      >
                        Catatan belum disimpan. Klik Simpan Catatan dulu sebelum Submit Nilai.
                      </p>
                    </div>
                  ) : null}
                  {!!noteDrafts[participant.id]?.trim() &&
                  isJudgeScoreStage(activeStage) &&
                  !isSubmitted ? (
                    <div
                      className="mb-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(96,165,250,0.12)",
                        border: "1px solid rgba(96,165,250,0.28)",
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "#60a5fa", fontFamily: "var(--font-poppins)" }}
                      >
                        Catatan ini akan ikut tersimpan otomatis saat kamu klik Submit Nilai.
                      </p>
                    </div>
                  ) : null}
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
                    <GoldButton
                      variant="outline"
                      onClick={() => {
                        void handleSaveNote(participant.id);
                      }}
                      disabled={
                        (isJudgeScoreStage(activeStage) && !isSubmitted) ||
                        !noteDrafts[participant.id]?.trim() ||
                        submittingNoteParticipantId === participant.id
                      }
                    >
                      <NotebookPen size={16} />
                      {submittingNoteParticipantId === participant.id
                        ? "Menyimpan Catatan..."
                        : isJudgeScoreStage(activeStage) && !isSubmitted
                        ? "Catatan ikut Submit Nilai"
                        : "Simpan Catatan"}
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
                              <div key={note.id} className="flex items-start gap-2.5">
                                {(() => {
                                  const noteMeta = formatNoteMeta(note.createdAt, note.authorRole);
                                  return (
                                    <>
                                {note.stage === "Technical Meeting" || note.authorRole !== "judge" ? (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                                    style={{
                                      background: "rgba(212,175,55,0.14)",
                                      border: "1px solid rgba(212,175,55,0.25)",
                                      color: "#D4AF37",
                                      fontFamily: "var(--font-poppins)",
                                    }}
                                  >
                                    {note.authorRole === "committee"
                                      ? "P"
                                      : note.authorRole === "admin"
                                      ? "A"
                                      : "J"}
                                  </div>
                                ) : (
                                  <img
                                    src={findJudgeAvatar(note)}
                                    alt={note.authorName}
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                    onError={(event) => {
                                      const target = event.currentTarget;
                                      if (target.src.includes("/default-avatar.svg")) return;
                                      target.src = "/default-avatar.svg";
                                    }}
                                  />
                                )}
                                <div
                                  className="flex flex-col w-full max-w-[420px] leading-1.5 p-4 rounded-e-xl rounded-es-xl relative"
                                  style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                  }}
                                >
                                  <div className="mb-1">
                                    <span
                                      className="text-xs font-semibold"
                                      style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                                    >
                                      {note.authorName} - {noteMeta.roleLabel} - {noteMeta.dayDate} -{" "}
                                      {noteMeta.time}
                                    </span>
                                  </div>
                                  <p
                                    className="text-xs leading-6"
                                    style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
                                  >
                                    {note.content}
                                  </p>
                                </div>
                                    </>
                                  );
                                })()}
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
                        <GoldButton
                          variant="primary"
                          onClick={() => {
                            void handleSubmit(participant.id);
                          }}
                          disabled={!complete || submittingParticipantId === participant.id}
                        >
                          <CheckCircle size={16} />{" "}
                          {submittingParticipantId === participant.id ? "Menyimpan..." : "Konfirmasi Submit"}
                        </GoldButton>
                        <GoldButton
                          variant="outline"
                          onClick={() => setConfirmId(null)}
                          disabled={submittingParticipantId === participant.id}
                        >
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
