"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../../../../context/AppContext";
import ProgressChecklistSection from "./components/ProgressChecklistSection";
import RubricSummaryCard from "./components/RubricSummaryCard";
import ScoreStageSummary from "./components/ScoreStageSummary";
import ScoringSidePanel from "./components/ScoringSidePanel";
import ScoringStatsCards from "./components/ScoringStatsCards";
import StageRankingCard from "./components/StageRankingCard";
import StageToolbar from "./components/StageToolbar";
import {
  calculateStageTotal,
  getAdminScoreStageLabel,
  getAvailableNoteStages,
  getJudgeAssignedStages,
  getParticipantAdminStageScore,
  getParticipantSelectionStage,
  getParticipantStageProgress,
  getParticipantVerificationStatus,
  getSelectionStageFromStageProgress,
  getStageCriteria,
  getStageScoreRecords,
  isParticipantEligibleForScoreStage,
  participantProgressStages,
  type AdminScoreStage,
  type JudgeAssignedStageKey,
  type Judge,
  type JudgeType,
  type Participant,
  type ParticipantNoteAuthorRole,
  type ParticipantNoteStageKey,
  type ParticipantProgressStageKey,
  type ParticipantStageNote,
  type ParticipantStageProgress,
  type Score,
  type ScoreRecord,
  type ScoreStageKey,
} from "../../../../data/mockData";
import { getParticipantAuthSession } from "../../../../lib/auth-storage";
import {
  applyAuditionTop20,
  fetchAuditionTop20Preview,
  updateParticipantSelectionStatus,
  type AuditionTop20Candidate,
  type UpdateParticipantSelectionStatusPayload,
} from "../../../../lib/auth-api";
import {
  fetchJudgeNotes,
  submitJudgeNote,
} from "../../../../lib/judge-note-api";
import {
  fetchJudgeScores,
  correctJudgeScore,
  submitJudgeScore,
  type BackendJudgeScore,
  type BackendJudgeScoreStage,
} from "../../../../lib/judge-score-api";
import { getReadableApiError } from "../../../../lib/api";
import { fetchInternalUsers } from "../../../../lib/user-management-api";
import { resolveApiAssetUrl } from "../../../../lib/api";

type GenderFilter = "Semua" | "Encik" | "Puan";
type RankedParticipant = Participant & { score: number };
type ProgressDraftMap = Record<string, ParticipantStageProgress>;
type AuditionTop20PreviewState = {
  topEncik: AuditionTop20Candidate[];
  topPuan: AuditionTop20Candidate[];
  candidateTotal: number;
  candidateScored: number;
};

type ScoreInputState = Record<string, string>;
// Draft note dipakai saat admin sedang mengisi catatan di panel kanan.
type NoteDraft = {
  stage: ParticipantNoteStageKey;
  authorRole: ParticipantNoteAuthorRole;
  content: string;
};

const stageOptions: AdminScoreStage[] = [
  "Technical Meeting",
  "Audition",
  "Pre Camp",
  "Camp",
  "Grand Final",
  "Final Result",
];
const isScoreStage = (stage: AdminScoreStage): stage is ScoreStageKey =>
  stage === "Audition" || stage === "Camp" || stage === "Grand Final";
const isProgressStage = (
  stage: AdminScoreStage,
): stage is ParticipantProgressStageKey =>
  stage === "Technical Meeting" ||
  stage === "Audition" ||
  stage === "Pre Camp" ||
  stage === "Camp" ||
  stage === "Grand Final";

// Helper ini menentukan peserta mana yang relevan di tahap admin tertentu.
function isParticipantRelevantForAdminStage(
  participant: Participant,
  stage: AdminScoreStage,
) {
  const selectionStage = getParticipantSelectionStage(participant);
  if (stage === "Final Result")
    return isParticipantEligibleForScoreStage(participant, "Grand Final");
  if (stage === "Technical Meeting") return selectionStage !== "Verification";
  if (stage === "Pre Camp")
    return ["Pre Camp", "Camp", "Grand Final", "Final Result"].includes(
      selectionStage,
    );
  return isParticipantEligibleForScoreStage(participant, stage);
}

// Helper ini mengatur efek saat checklist progres dicentang atau dibatalkan.
function toggleParticipantStageProgress(
  progress: ParticipantStageProgress,
  stage: ParticipantProgressStageKey,
  checked: boolean,
) {
  const nextProgress = { ...progress };
  const stageIndex = participantProgressStages.indexOf(stage);
  participantProgressStages.forEach((key, index) => {
    if (checked && index === stageIndex) nextProgress[key] = true;
    if (!checked && index >= stageIndex) nextProgress[key] = false;
  });
  return nextProgress;
}

// Nilai akhir tidak punya note sendiri, jadi diarahkan ke grand final.
const getDefaultNoteStage = (
  stage: AdminScoreStage,
): ParticipantNoteStageKey =>
  stage === "Final Result" ? "Grand Final" : (stage as ParticipantNoteStageKey);

const createDraft = (stage: AdminScoreStage): NoteDraft => {
  const noteStage = getDefaultNoteStage(stage);
  return {
    stage: noteStage,
    authorRole: noteStage === "Technical Meeting" ? "committee" : "judge",
    content: "",
  };
};

// Format tanggal untuk daftar riwayat catatan.
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const toBackendSelectionStatus = (
  selectionStage: ReturnType<typeof getSelectionStageFromStageProgress>,
): UpdateParticipantSelectionStatusPayload["selection_status"] => {
  switch (selectionStage) {
    case "Verification":
      return "Verified";
    case "Technical Meeting":
      return "TechnicalMeeting";
    case "Audition":
      return "Audition";
    case "Pre Camp":
      return "PreCamp";
    case "Camp":
      return "Camp";
    case "Grand Final":
      return "GrandFinal";
    case "Final Result":
      // Final Result adalah tampilan rekap nilai seluruh grand finalist, bukan status juara.
      // Status Winner hanya ditetapkan dari menu Juara Versi Juri.
      return "GrandFinal";
    default:
      return "Verified";
  }
};

const parseParticipantUserId = (participantId: string): number | null => {
  const raw = participantId.replace(/^P_API_/i, "").trim();
  if (!raw) return null;
  const numeric = Number.parseInt(raw, 10);
  return Number.isFinite(numeric) ? numeric : null;
};

const toJudgeId = (internalId: number): string => `J_API_${internalId}`;
const parseJudgeUserId = (judgeId: string): number | null => {
  const raw = judgeId.replace(/^J_API_/i, "").trim();
  if (!raw) return null;
  const numeric = Number.parseInt(raw, 10);
  return Number.isFinite(numeric) ? numeric : null;
};

const toFrontendScoreRecord = (item: BackendJudgeScore): ScoreRecord => ({
  id: `db-judge-score-${item.id}`,
  participantId: item.participant_id,
  participantName: item.participant_name ?? "Peserta",
  judgeId: toJudgeId(item.judge_user_id),
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
});

const mergeJudgeOfficialScores = (
  previous: ScoreRecord[],
  nextDbScores: ScoreRecord[],
): ScoreRecord[] => {
  const preserved = previous.filter(
    (item) => !(item.judgeRole === "judge" && (item.scoreType ?? "official") === "official"),
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
    if (!deduped.has(key)) deduped.set(key, item);
  }

  return Array.from(deduped.values());
};

const defaultAssignedStages: JudgeAssignedStageKey[] = [
  "Audition",
  "Pre Camp",
  "Camp",
  "Grand Final",
];

const normalizeJudgeStages = (
  stages?: Array<"Audition" | "Pre Camp" | "Camp" | "Grand Final"> | null,
): JudgeAssignedStageKey[] => {
  if (!stages?.length) return defaultAssignedStages;
  const valid = stages.filter(
    (stage): stage is JudgeAssignedStageKey =>
      stage === "Audition" ||
      stage === "Pre Camp" ||
      stage === "Camp" ||
      stage === "Grand Final",
  );
  return valid.length ? Array.from(new Set(valid)) : defaultAssignedStages;
};

const normalizeParticipantPhoto = (raw?: string | null) => {
  const value = raw?.trim();
  if (!value) return "/default-avatar.svg";

  const lower = value.toLowerCase();
  if (lower.includes("default-avatar.svg")) return "/default-avatar.svg";
  if (value.startsWith("data:image") || value.startsWith("blob:")) return value;

  return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
};

const isDefaultAvatar = (value?: string | null) => {
  const normalized = (value ?? "").trim().toLowerCase();
  return !normalized || normalized.includes("default-avatar.svg");
};

const isRejectedParticipant = (participant: Participant) =>
  participant.eliminatedInAudition === true || participant.status === "Rejected";

const getAuditionNumber = (participant: Participant) =>
  (participant.auditionNumber ?? "").trim() || (participant.number ?? "").trim();

const getPostAuditionNumber = (participant: Participant) =>
  (participant.participantCode ?? "").trim() || (participant.number ?? "").trim();

const getDisplayNumberByStage = (
  participant: Participant,
  stage: AdminScoreStage,
) => {
  if (stage === "Audition" || stage === "Technical Meeting") {
    return getAuditionNumber(participant);
  }
  return getPostAuditionNumber(participant);
};

const extractNumberOrder = (value: string) => {
  const match = value.match(/(\d{1,6})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const compareParticipantsByNumber = (a: Participant, b: Participant) => {
  const aNumber = (a.number ?? "").trim();
  const bNumber = (b.number ?? "").trim();
  const orderA = extractNumberOrder(aNumber);
  const orderB = extractNumberOrder(bNumber);
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name, "id-ID");
};

const toCanonicalParticipantId = (id: string) => {
  const raw = (id ?? "").trim();
  const numeric = raw.replace(/^P_API_/i, "");
  if (/^\d+$/.test(numeric)) return `P_API_${numeric}`;
  return raw.toUpperCase();
};

const dedupeByParticipantId = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = toCanonicalParticipantId(item.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

export default function AdminScoresPage() {
  // Pusat state dan logic utama halaman scoring admin.
  const { participantList, setParticipantList, judgeList, scoreList, setScoreList, voteCandidateList, user } =
    useApp();
  const token = useMemo(() => getParticipantAuthSession()?.token ?? "", []);
  const [activeStage, setActiveStage] =
    useState<AdminScoreStage>("Grand Final");
  const [activeGender, setActiveGender] = useState<GenderFilter>("Semua");
  const [progressDrafts, setProgressDrafts] = useState<
    Partial<ProgressDraftMap>
  >({});
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [participantNotes, setParticipantNotes] = useState<
    ParticipantStageNote[]
  >([]);
  const [noteDraft, setNoteDraft] = useState<NoteDraft>(() =>
    createDraft("Grand Final"),
  );
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [scoringJudgeList, setScoringJudgeList] = useState<Judge[]>(judgeList);
  const [judgeLoadedFromBackend, setJudgeLoadedFromBackend] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const [scoreInputs, setScoreInputs] = useState<Record<string, ScoreInputState>>({});
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [correctionReason, setCorrectionReason] = useState<string | null>(null);
  const [top20Preview, setTop20Preview] = useState<AuditionTop20PreviewState | null>(null);
  const [isTop20Loading, setIsTop20Loading] = useState(false);
  const [isTop20Applying, setIsTop20Applying] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  useEffect(() => {
    if (!syncMessage) return;
    const timer = window.setTimeout(() => setSyncMessage(""), 4500);
    return () => window.clearTimeout(timer);
  }, [syncMessage]);

  useEffect(() => {
    if (!token) return;

    let disposed = false;
    const loadNotes = async () => {
      try {
        const response = await fetchJudgeNotes(token);
        if (disposed) return;
        const mappedNotes: ParticipantStageNote[] = response.data.map((note) => ({
          id: `db-note-${note.id}`,
          participantId: note.participant_id,
          participantName: note.participant_name ?? "Peserta",
          stage: note.stage as ParticipantNoteStageKey,
          authorName: note.author_name ?? "Admin",
          authorRole: note.author_role,
          content: note.content,
          createdAt: note.created_at,
        }));
        setParticipantNotes(mappedNotes);
      } catch {
        if (disposed) return;
        setParticipantNotes([]);
        setSyncMessage("Catatan juri dari backend belum bisa dimuat.");
      }
    };

    void loadNotes();
    return () => {
      disposed = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let disposed = false;
    const loadScores = async () => {
      try {
        const response = await fetchJudgeScores(token);
        if (disposed) return;
        const mapped = response.data
          .filter((item) => item.score_type === "official")
          .map(toFrontendScoreRecord);
        setScoreList((prev) => mergeJudgeOfficialScores(prev, mapped));
      } catch (error) {
        if (disposed) return;
        setSyncMessage(`Gagal memuat nilai juri: ${getReadableApiError(error)}`);
      }
    };

    void loadScores();
    return () => {
      disposed = true;
    };
  }, [setScoreList, token]);

  useEffect(() => {
    if (!token || activeStage !== "Audition") return;

    let disposed = false;
    const loadTop20Preview = async () => {
      setIsTop20Loading(true);
      try {
        const response = await fetchAuditionTop20Preview(token);
        if (disposed) return;
        setTop20Preview({
          topEncik: response.data.top_encik,
          topPuan: response.data.top_puan,
          candidateTotal: response.data.meta.candidate_total,
          candidateScored: response.data.meta.candidate_scored,
        });
      } catch (error) {
        if (disposed) return;
        setSyncMessage(`Gagal memuat preview Top 20 Audisi: ${getReadableApiError(error)}`);
      } finally {
        if (!disposed) setIsTop20Loading(false);
      }
    };

    void loadTop20Preview();
    return () => {
      disposed = true;
    };
  }, [activeStage, token]);

  useEffect(() => {
    if (!token) return;

    let disposed = false;
    const loadJudges = async () => {
      try {
        const response = await fetchInternalUsers(token, "judge");
        if (disposed) return;

        const mapped: Judge[] = response.data.map((item) => ({
          id: toJudgeId(item.id),
          name: item.name,
          email: item.email,
          title: item.judge_title || "Dewan Juri",
          organization: item.judge_organization || "Duta Wisata Kota Batam",
          stages: normalizeJudgeStages(item.judge_assigned_stages),
          assignedStages: normalizeJudgeStages(item.judge_assigned_stages),
          avatar: resolveApiAssetUrl(item.judge_avatar) || "/default-avatar.svg",
          judgeType: (item.judge_type ?? "judge") as JudgeType,
        }));

        setScoringJudgeList(mapped);
        setJudgeLoadedFromBackend(true);
      } catch {
        if (disposed) return;
        setScoringJudgeList([]);
        setJudgeLoadedFromBackend(true);
        setSyncMessage(
          "Data juri backend gagal dimuat. Cek endpoint /super-admin/users?role=judge dan sesi login.",
        );
      }
    };

    void loadJudges();
    return () => {
      disposed = true;
    };
  }, [token]);

  const availableNoteStages = useMemo(
    () => getAvailableNoteStages(activeStage),
    [activeStage],
  );

  // Helper ini membaca draft progres terbaru, kalau belum ada maka ambil progres asli peserta.
  const getDraftProgress = (participant: Participant) =>
    progressDrafts[participant.id] ?? getParticipantStageProgress(participant);

  const participantsWithResolvedPhoto = useMemo(
    () => {
      const votePhotoByParticipantId = new Map(
        voteCandidateList.map((candidate) => [candidate.participantId, candidate.photo] as const),
      );

      return participantList.map((participant) => {
        const profilePhoto = normalizeParticipantPhoto(participant.photo);
        const votePhoto = normalizeParticipantPhoto(votePhotoByParticipantId.get(participant.id));

        return {
          ...participant,
          photo: isDefaultAvatar(profilePhoto) && !isDefaultAvatar(votePhoto) ? votePhoto : profilePhoto,
        };
      });
    },
    [participantList, voteCandidateList],
  );

  const auditionTopRankings = useMemo<RankedParticipant[]>(() => {
    if (activeStage !== "Audition" || !top20Preview) return [];

    const sourceCandidates = [...top20Preview.topEncik, ...top20Preview.topPuan]
      .filter((item) =>
        activeGender === "Semua" ? true : (item.gender ?? "Encik") === activeGender,
      )
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

    const mapped = sourceCandidates.map((candidate) => {
      const participantId = `P_API_${candidate.user_id}`;
      const matched =
        participantsWithResolvedPhoto.find((participant) => participant.id === participantId) ??
        participantsWithResolvedPhoto.find(
          (participant) =>
            (
              getAuditionNumber(participant).trim().toUpperCase() ===
                (candidate.audition_number ?? "").trim().toUpperCase() ||
              getPostAuditionNumber(participant).trim().toUpperCase() ===
                (candidate.participant_code ?? "").trim().toUpperCase() ||
              (participant.number ?? "").trim().toUpperCase() ===
                (candidate.participant_code ?? "").trim().toUpperCase()
            ),
        );

      const resolvedGender = (candidate.gender ?? matched?.gender ?? "Encik") as
        | "Encik"
        | "Puan";
      const resolvedName = matched?.name ?? candidate.name ?? "Peserta";
      const rankedParticipant =
        matched ??
        ({
          id: participantId,
          number:
            candidate.audition_number ??
            candidate.participant_code ??
            candidate.participant_id,
          name: resolvedName,
          nickname: candidate.nickname ?? "",
          gender: resolvedGender,
          nationalId: "",
          birthPlace: "",
          birthDate: "",
          heightCm: 0,
          photo: "/default-avatar.svg",
          education: "-",
          instagram: "",
          phone: "",
          email: "",
          status: "Audition",
          registeredAt: "",
          scores: [],
          submittedToAdmin: true,
          verificationStatus: "Verified",
          selectionStage: "Audition",
          stageProgress: {
            "Technical Meeting": true,
            Audition: false,
            "Pre Camp": false,
            Camp: false,
            "Grand Final": false,
          },
        } satisfies Participant);

      return {
        ...rankedParticipant,
        number: matched
          ? getDisplayNumberByStage(matched, "Audition")
          : candidate.audition_number ?? candidate.participant_code ?? candidate.participant_id,
        score: candidate.audition_average ?? 0,
      };
    });
    return dedupeByParticipantId(mapped);
  }, [activeGender, activeStage, participantsWithResolvedPhoto, top20Preview]);

  // Daftar peserta utama untuk tabel kiri. Ubah filter ini kalau aturan tampil per tahap berubah.
  const participants = useMemo(() => {
    const mapped = participantsWithResolvedPhoto.filter((participant) => {
        if (activeGender !== "Semua" && participant.gender !== activeGender)
          return false;
        return isParticipantRelevantForAdminStage(participant, activeStage);
      })
      .map((participant) => ({
        ...participant,
        number: getDisplayNumberByStage(participant, activeStage),
      }))
      .sort(compareParticipantsByNumber);
    return dedupeByParticipantId(mapped);
  }, [activeGender, activeStage, participantsWithResolvedPhoto]);

  // Ranking nilai admin diambil dari score resmi juri pada tahap aktif.
  const rankings = useMemo<RankedParticipant[]>(
    () => {
      const mapped =
      !isScoreStage(activeStage) && activeStage !== "Final Result"
        ? []
        : activeStage === "Audition" && auditionTopRankings.length > 0
          ? auditionTopRankings
        : participants
            .map((participant) => ({
              ...participant,
              score: getParticipantAdminStageScore(
                scoreList,
                participant.id,
                activeStage,
              ),
            }))
            .filter((participant) => participant.score > 0)
            .sort((a, b) => b.score - a.score);
      return dedupeByParticipantId(mapped);
    },
    [activeStage, auditionTopRankings, participants, scoreList],
  );

  // Daftar juri per tahap dipakai untuk panel kanan saat belum memilih peserta.
  const effectiveJudgeList = judgeLoadedFromBackend ? scoringJudgeList : judgeList;
  const judgesForStage = useMemo(() => {
    if (activeStage === "Technical Meeting" || activeStage === "Pre Camp")
      return [];
    if (activeStage === "Final Result") return effectiveJudgeList;
    return effectiveJudgeList.filter((judge) =>
      getJudgeAssignedStages(judge).includes(activeStage),
    );
  }, [activeStage, effectiveJudgeList]);

  const activeScoreCriteria = useMemo(
    () => (isScoreStage(activeStage) ? getStageCriteria(activeStage) : []),
    [activeStage],
  );

  const selectedJudgeName = useMemo(
    () => judgesForStage.find((judge) => judge.id === selectedJudgeId)?.name ?? "",
    [judgesForStage, selectedJudgeId],
  );

  useEffect(() => {
    if (!isScoreStage(activeStage)) {
      setSelectedJudgeId("");
      return;
    }

    if (!judgesForStage.length) {
      setSelectedJudgeId("");
      return;
    }

    setSelectedJudgeId((prev) =>
      prev && judgesForStage.some((judge) => judge.id === prev)
        ? prev
        : judgesForStage[0].id,
    );
  }, [activeStage, judgesForStage]);

  const submittedParticipantsCount = !isProgressStage(activeStage)
    ? rankings.length
    : participants.filter(
        (participant) => getDraftProgress(participant)[activeStage],
      ).length;

  const selectedParticipant = useMemo(
    () =>
      participants.find(
        (participant) => participant.id === selectedParticipantId,
      ) ?? null,
    [participants, selectedParticipantId],
  );
  const selectedJudgeUserId = useMemo(
    () => (selectedJudgeId ? parseJudgeUserId(selectedJudgeId) : null),
    [selectedJudgeId],
  );

  const selectedParticipantScoreRecord = useMemo(() => {
    if (!selectedParticipant || !selectedJudgeId || !isScoreStage(activeStage))
      return null;
    return getStageScoreRecords(scoreList, selectedParticipant.id, activeStage, {
      judgeRole: "judge",
      scoreType: "official",
    }).find((record) => record.judgeId === selectedJudgeId) ?? null;
  }, [activeStage, scoreList, selectedJudgeId, selectedParticipant]);

  const selectedParticipantScore = useMemo<Score>(() => {
    if (!selectedParticipant || !isScoreStage(activeStage)) return {};

    const draftInput = scoreInputs[selectedParticipant.id] ?? {};
    const persisted = (selectedParticipantScoreRecord?.score ?? {}) as Score;
    const merged: Score = {};

    activeScoreCriteria.forEach((criterion) => {
      const rawInput = draftInput[criterion.key];
      if (rawInput !== undefined && rawInput !== "") {
        merged[criterion.key] = Number.parseInt(rawInput, 10) || 0;
      } else {
        merged[criterion.key] = Number(persisted[criterion.key] ?? 0);
      }
    });

    return merged;
  }, [
    activeScoreCriteria,
    activeStage,
    scoreInputs,
    selectedParticipant,
    selectedParticipantScoreRecord,
  ]);

  const isSelectedParticipantScoreComplete = useMemo(() => {
    if (!selectedParticipant || !isScoreStage(activeStage)) return false;
    return activeScoreCriteria.every((criterion) => {
      const value = Number(selectedParticipantScore[criterion.key]);
      return Number.isFinite(value) && value >= 0 && value <= 100;
    });
  }, [activeScoreCriteria, activeStage, selectedParticipant, selectedParticipantScore]);
  const isSelectedParticipantScoreLocked = Boolean(selectedParticipantScoreRecord) && !correctionReason;

  useEffect(() => { setCorrectionReason(null); }, [selectedParticipantId, selectedJudgeId, activeStage]);

  const resolvedNoteStage = availableNoteStages.includes(noteDraft.stage)
    ? noteDraft.stage
    : getDefaultNoteStage(activeStage);

  const resolvedNoteAuthorName = useMemo(() => {
    const currentUserName = user?.name?.trim();
    const fallbackAdminName = currentUserName || "Admin";
    if (resolvedNoteStage === "Technical Meeting") {
      return currentUserName || "Panitia";
    }
    if (noteDraft.authorRole === "judge") {
      return selectedJudgeName.trim();
    }
    if (noteDraft.authorRole === "committee") {
      return currentUserName || "Panitia";
    }
    return fallbackAdminName;
  }, [noteDraft.authorRole, resolvedNoteStage, selectedJudgeName, user?.name]);

  // Ringkasan cepat ini dipakai oleh kartu nilai di bagian atas.
  const averageStageScore = rankings.length
    ? rankings.reduce((sum, participant) => sum + participant.score, 0) /
      rankings.length
    : 0;
  const officialScoreCount = isScoreStage(activeStage)
    ? activeStage === "Audition" && top20Preview
      ? top20Preview.candidateScored
      : participants.reduce(
        (sum, participant) =>
          sum +
          getStageScoreRecords(scoreList, participant.id, activeStage, {
            judgeRole: "judge",
            scoreType: "official",
          }).length,
        0,
      )
    : activeStage === "Final Result"
      ? participants.reduce(
          (sum, participant) =>
            sum +
            getStageScoreRecords(scoreList, participant.id, "Camp", {
              judgeRole: "judge",
              scoreType: "official",
            }).length +
            getStageScoreRecords(scoreList, participant.id, "Grand Final", {
              judgeRole: "judge",
              scoreType: "official",
            }).length,
          0,
        )
      : 0;

  // Riwayat note hanya menampilkan tahap yang sudah relevan sampai tab aktif.
  const visibleNotes = useMemo(() => {
    if (!selectedParticipantId) return [];
    return participantNotes
      .filter(
        (note) =>
          note.participantId === selectedParticipantId &&
          availableNoteStages.includes(note.stage),
      )
      .sort(
        (a, b) =>
          availableNoteStages.indexOf(a.stage) -
            availableNoteStages.indexOf(b.stage) ||
          a.createdAt.localeCompare(b.createdAt),
      );
  }, [availableNoteStages, participantNotes, selectedParticipantId]);

  // Handler ini hanya mengubah draft di UI, belum menyimpan permanen ke participantList.
  const handleProgressToggle = (
    participantId: string,
    stage: ParticipantProgressStageKey,
  ) => {
    setProgressDrafts((prev) => {
      const participant = participantList.find(
        (item) => item.id === participantId,
      );
      if (!participant) return prev;
      const currentProgress =
        prev[participantId] ?? getParticipantStageProgress(participant);
      const nextChecked = !currentProgress[stage];

      if (
        isRejectedParticipant(participant) &&
        stage !== "Audition" &&
        nextChecked
      ) {
        setSyncMessage(
          `${participant.name} sudah dieliminasi di Audisi, jadi tidak bisa lanjut ke tahap berikutnya.`,
        );
        return prev;
      }

      const canMark =
        !nextChecked ||
        participantProgressStages
          .slice(0, participantProgressStages.indexOf(stage))
          .every((previousStage) => currentProgress[previousStage]);
      if (!canMark) return prev;
      const nextProgress = toggleParticipantStageProgress(
        currentProgress,
        stage,
        nextChecked,
      );
      const persistedProgress = getParticipantStageProgress(participant);
      const shouldClearDraft = participantProgressStages.every(
        (progressStage) =>
          nextProgress[progressStage] === persistedProgress[progressStage],
      );
      if (shouldClearDraft) {
        const nextDrafts = { ...prev };
        delete nextDrafts[participantId];
        return nextDrafts;
      }
      return { ...prev, [participantId]: nextProgress };
    });
  };

  // Saat tombol simpan diklik, draft progres dipindahkan ke data peserta utama.
  const handleSaveProgress = async () => {
    if (isSavingProgress) return;

    if (!token) {
      setSyncMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    const draftEntries: Array<readonly [string, ParticipantStageProgress]> =
      Object.keys(progressDrafts).length > 0
        ? Object.entries(progressDrafts).filter(
            (entry): entry is [string, ParticipantStageProgress] => Boolean(entry[1]),
          )
        : participants.map((participant) => [
            participant.id,
            getDraftProgress(participant),
          ] as const);

    if (!draftEntries.length) return;

    const normalizedEntries = draftEntries
      .map(([participantId, nextProgress]) => {
        const participant = participantList.find((item) => item.id === participantId);
        if (!participant) return null;

        const currentProgress = getParticipantStageProgress(participant);
        const hasProgressChanged = participantProgressStages.some(
          (stageKey) => Boolean(currentProgress[stageKey]) !== Boolean(nextProgress[stageKey]),
        );

        const nextSelectionStage = getSelectionStageFromStageProgress(
          nextProgress,
          getParticipantVerificationStatus(participant),
        );
        const nextBackendStatus = toBackendSelectionStatus(nextSelectionStage);

        const currentBackendStatus = participant.status as UpdateParticipantSelectionStatusPayload["selection_status"];
        const hasStatusChanged = currentBackendStatus !== nextBackendStatus;
        const shouldForceGrandFinalSync =
          activeStage === "Grand Final" && nextBackendStatus === "GrandFinal";

        if (!hasProgressChanged && !hasStatusChanged && !shouldForceGrandFinalSync) {
          return null;
        }
        return { participant, nextProgress, nextSelectionStage, nextBackendStatus };
      })
      .filter(
        (
          item,
        ): item is {
          participant: Participant;
          nextProgress: ParticipantStageProgress;
          nextSelectionStage: ReturnType<typeof getSelectionStageFromStageProgress>;
          nextBackendStatus: UpdateParticipantSelectionStatusPayload["selection_status"];
        } => Boolean(item),
      );

    if (!normalizedEntries.length) {
      setSyncMessage("Tidak ada perubahan progress untuk disimpan.");
      return;
    }

    if (activeStage === "Audition") {
      const draftProgressMap = new Map<string, ParticipantStageProgress>(
        normalizedEntries.map((entry) => [entry.participant.id, entry.nextProgress]),
      );

      const auditionPassed = participantList.filter((participant) => {
        if (isRejectedParticipant(participant)) return false;
        const mergedProgress =
          draftProgressMap.get(participant.id) ??
          getParticipantStageProgress(participant);
        return mergedProgress.Audition;
      });

      const encikCount = auditionPassed.filter(
        (participant) => participant.gender === "Encik",
      ).length;
      const puanCount = auditionPassed.filter(
        (participant) => participant.gender === "Puan",
      ).length;

      if (
        auditionPassed.length > 20 ||
        encikCount > 10 ||
        puanCount > 10
      ) {
        setSyncMessage(
          `Kuota Audisi terlampaui. Saat ini ${auditionPassed.length}/20 (Encik ${encikCount}/10, Puan ${puanCount}/10).`,
        );
        return;
      }
    }

    const failedParticipants: string[] = [];
    const nextProgressMap = new Map<string, ParticipantStageProgress>();
    const nextSelectionStageMap = new Map<string, Participant["selectionStage"]>();
    const nextStatusMap = new Map<string, Participant["status"]>();
    setIsSavingProgress(true);
    try {
      for (const entry of normalizedEntries) {
        const participantUserId = parseParticipantUserId(entry.participant.id);
        if (!participantUserId) {
          failedParticipants.push(entry.participant.name);
          continue;
        }

        try {
          await updateParticipantSelectionStatus(token, participantUserId, {
            selection_status: entry.nextBackendStatus,
          });
          nextProgressMap.set(entry.participant.id, entry.nextProgress);
          nextSelectionStageMap.set(entry.participant.id, entry.nextSelectionStage);
          nextStatusMap.set(entry.participant.id, entry.nextBackendStatus);
        } catch {
          failedParticipants.push(entry.participant.name);
        }
      }

      setParticipantList((prev) =>
        prev.map((participant) => {
          if (!nextProgressMap.has(participant.id)) return participant;
          return {
            ...participant,
            stageProgress: nextProgressMap.get(participant.id)!,
            selectionStage: nextSelectionStageMap.get(participant.id),
            status: nextStatusMap.get(participant.id) ?? participant.status,
          };
        }),
      );

      setProgressDrafts((prev) => {
        const next = { ...prev };
        for (const participantId of nextProgressMap.keys()) {
          delete next[participantId];
        }
        return next;
      });

      if (!failedParticipants.length) {
        setSyncMessage("Progress tahapan berhasil disimpan ke backend.");
        return;
      }

      setSyncMessage(
        `Sebagian peserta gagal disimpan (${failedParticipants.length}): ${failedParticipants.slice(0, 3).join(", ")}.`,
      );
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Catatan admin/juri/panitia ditambahkan ke state lokal agar alurnya bisa langsung diuji di UI.
  const handleSaveNote = async () => {
    if (!selectedParticipant || !resolvedNoteAuthorName || !noteDraft.content.trim()) return;

    if (!token) {
      setSyncMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    const authorRole =
      resolvedNoteStage === "Technical Meeting" && noteDraft.authorRole === "judge"
        ? "committee"
        : noteDraft.authorRole;

    try {
      const response = await submitJudgeNote(token, {
        participant_id: selectedParticipant.id,
        participant_name: selectedParticipant.name,
        author_name: resolvedNoteAuthorName,
        stage: resolvedNoteStage,
        author_role: authorRole,
        content: noteDraft.content.trim(),
      });

      setParticipantNotes((prev) => [
        ...prev,
        {
          id: `db-note-${response.data.id}`,
          participantId: response.data.participant_id,
          participantName: response.data.participant_name ?? selectedParticipant.name,
          stage: response.data.stage as ParticipantNoteStageKey,
          authorName: response.data.author_name ?? resolvedNoteAuthorName,
          authorRole: response.data.author_role,
          content: response.data.content,
          createdAt: response.data.created_at,
        },
      ]);
      setNoteDraft((prev) => ({ ...prev, content: "" }));
      setSyncMessage("Catatan tahap berhasil disimpan dan tersinkron ke juri.");
    } catch (error) {
      setSyncMessage(`Gagal simpan catatan: ${getReadableApiError(error)}`);
    }
  };

  const handleAdminScoreChange = (criterionKey: string, rawValue: string) => {
    if (!selectedParticipant || !isScoreStage(activeStage)) return;
    if (isSelectedParticipantScoreLocked) return;

    if (rawValue === "") {
      setScoreInputs((prev) => ({
        ...prev,
        [selectedParticipant.id]: {
          ...(prev[selectedParticipant.id] ?? {}),
          [criterionKey]: "",
        },
      }));
      return;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) return;

    const normalized = String(Math.min(100, Math.max(0, parsed)));
    setScoreInputs((prev) => ({
      ...prev,
      [selectedParticipant.id]: {
        ...(prev[selectedParticipant.id] ?? {}),
        [criterionKey]: normalized,
      },
    }));
  };

  const handleSubmitAdminScore = async () => {
    if (!selectedParticipant || !isScoreStage(activeStage)) return;
    if (!token) {
      setSyncMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!selectedJudgeUserId || !selectedJudgeId) {
      setSyncMessage("Pilih akun juri dulu sebelum simpan nilai.");
      return;
    }

    if (!isSelectedParticipantScoreComplete) {
      setSyncMessage("Semua kriteria nilai wajib diisi (0-100) sebelum disimpan.");
      return;
    }
    if (isSelectedParticipantScoreLocked) {
      setSyncMessage("Nilai juri untuk peserta ini sudah disubmit dan terkunci. Pilih akun juri lain.");
      return;
    }

    setScoreSubmitting(true);
    try {
      const backendScoreId = selectedParticipantScoreRecord?.id.startsWith("db-judge-score-")
        ? Number(selectedParticipantScoreRecord.id.replace("db-judge-score-", "")) : null;
      const response = correctionReason && backendScoreId
        ? await correctJudgeScore(token, backendScoreId, { score: selectedParticipantScore, reason: correctionReason })
        : await submitJudgeScore(token, {
            participant_id: selectedParticipant.id,
            participant_name: selectedParticipant.name,
            stage: activeStage as BackendJudgeScoreStage,
            score_type: "official",
            judge_user_id: selectedJudgeUserId,
            score: selectedParticipantScore,
          });

      const mapped = toFrontendScoreRecord(response.data);
      setScoreList((prev) => mergeJudgeOfficialScores(prev, [mapped]));

      setSyncMessage(
        correctionReason
          ? `Nilai ${selectedParticipant.name} berhasil dikoreksi. Nilai lama disimpan dalam riwayat.`
          : `Nilai ${selectedParticipant.name} berhasil disimpan memakai akun juri ${response.data.judge_name ?? "terpilih"}.`,
      );
      setCorrectionReason(null);
    } catch (error) {
      setSyncMessage(`Gagal simpan nilai: ${getReadableApiError(error)}`);
    } finally {
      setScoreSubmitting(false);
    }
  };

  const handleToggleAuditionElimination = async (participantId: string) => {
    const participant = participantList.find((item) => item.id === participantId);
    if (!participant) return;

    if (!token) {
      setSyncMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    const participantUserId = parseParticipantUserId(participant.id);
    if (!participantUserId) {
      setSyncMessage(`ID peserta ${participant.name} tidak valid.`);
      return;
    }

    const currentlyEliminated = isRejectedParticipant(participant);

    try {
      await updateParticipantSelectionStatus(token, participantUserId, {
        selection_status: currentlyEliminated ? "Audition" : "Rejected",
        selection_status_note: currentlyEliminated
          ? "Status eliminasi audisi dibatalkan oleh admin."
          : "Anda tereliminasi pada tahap audisi dan tidak dapat melanjutkan ke tahapan berikutnya.",
      });

      setParticipantList((prev) =>
        prev.map((item) => {
          if (item.id !== participant.id) return item;
          const currentProgress = getParticipantStageProgress(item);
          return {
            ...item,
            status: currentlyEliminated ? "Audition" : "Rejected",
            selectionStage: "Audition",
            eliminatedInAudition: !currentlyEliminated,
            rejectionReason: currentlyEliminated
              ? undefined
              : "Anda tereliminasi pada tahap audisi dan tidak dapat melanjutkan ke tahapan berikutnya.",
            stageProgress: {
              ...currentProgress,
              "Technical Meeting": true,
              Audition: true,
              "Pre Camp": false,
              Camp: false,
              "Grand Final": false,
            },
          };
        }),
      );

      setSyncMessage(
        currentlyEliminated
          ? `Eliminasi ${participant.name} dibatalkan.`
          : `${participant.name} ditandai tidak lanjut (eliminasi audisi).`,
      );
    } catch (error) {
      setSyncMessage(`Gagal mengubah status eliminasi: ${getReadableApiError(error)}`);
    }
  };

  const handleRefreshTop20Preview = async () => {
    if (!token) {
      setSyncMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }
    setIsTop20Loading(true);
    try {
      const response = await fetchAuditionTop20Preview(token);
      setTop20Preview({
        topEncik: response.data.top_encik,
        topPuan: response.data.top_puan,
        candidateTotal: response.data.meta.candidate_total,
        candidateScored: response.data.meta.candidate_scored,
      });
      setSyncMessage("Preview Top 20 Audisi berhasil diperbarui.");
    } catch (error) {
      setSyncMessage(`Gagal memuat preview Top 20 Audisi: ${getReadableApiError(error)}`);
    } finally {
      setIsTop20Loading(false);
    }
  };

  const handleApplyTop20Audition = async () => {
    if (!token) {
      setSyncMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsTop20Applying(true);
    try {
      const response = await applyAuditionTop20(token);
      const promotedIds = new Set(response.data.promoted_user_ids.map((id) => `P_API_${id}`));
      const rejectedIds = new Set(response.data.rejected_user_ids.map((id) => `P_API_${id}`));

      setParticipantList((prev) =>
        prev.map((participant) => {
          if (promotedIds.has(participant.id)) {
            const currentProgress = getParticipantStageProgress(participant);
            return {
              ...participant,
              status: "PreCamp",
              selectionStage: "Pre Camp",
              eliminatedInAudition: false,
              rejectionReason: undefined,
              stageProgress: {
                ...currentProgress,
                "Technical Meeting": true,
                Audition: true,
              },
            };
          }
          if (rejectedIds.has(participant.id)) {
            const currentProgress = getParticipantStageProgress(participant);
            return {
              ...participant,
              status: "Rejected",
              selectionStage: "Audition",
              eliminatedInAudition: true,
              rejectionReason:
                "Anda tereliminasi pada tahap audisi dan tidak dapat melanjutkan ke tahapan berikutnya.",
              stageProgress: {
                ...currentProgress,
                "Technical Meeting": true,
                Audition: true,
                "Pre Camp": false,
                Camp: false,
                "Grand Final": false,
              },
            };
          }
          return participant;
        }),
      );

      setTop20Preview((prev) =>
        prev
          ? {
              ...prev,
              topEncik: response.data.top_encik,
              topPuan: response.data.top_puan,
            }
          : prev,
      );

      setSyncMessage(
        `Apply Top 20 Audisi berhasil: ${response.data.promoted_total} lolos, ${response.data.rejected_total} tidak lolos.`,
      );
    } catch (error) {
      setSyncMessage(`Apply Top 20 Audisi gagal: ${getReadableApiError(error)}`);
    } finally {
      setIsTop20Applying(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            color: "#D4AF37",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Tahapan & Nilai
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          Rekap progres peserta dari technical meeting sampai grand final,
          lengkap dengan catatan per tahap.
        </p>
        {syncMessage ? (
          <p
            className="text-xs mt-2"
            style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
          >
            {syncMessage}
          </p>
        ) : null}
      </div>

      {/* Toolbar ini adalah tempat utama untuk ganti tab tahap dan filter gender. */}
      <StageToolbar
        activeStage={activeStage}
        activeGender={activeGender}
        onStageChange={setActiveStage}
        onGenderChange={setActiveGender}
        stageOptions={stageOptions}
      />

      {activeStage === "Audition" ? (
        <div
          className="mb-6 rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,175,55,0.18)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3
                className="text-sm font-bold"
                style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}
              >
                Auto Top 20 Audisi (10 Encik + 10 Puan)
              </h3>
              <p
                className="text-xs mt-1"
                style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
              >
                Preview dulu, lalu klik Apply untuk sinkron status massal ke tahap berikutnya.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefreshTop20Preview}
                disabled={isTop20Loading || isTop20Applying}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.25)",
                  color: "#D4AF37",
                  fontFamily: "var(--font-poppins)",
                  opacity: isTop20Loading || isTop20Applying ? 0.6 : 1,
                }}
              >
                {isTop20Loading ? "Memuat..." : "Refresh Preview"}
              </button>
              <button
                type="button"
                onClick={handleApplyTop20Audition}
                disabled={isTop20Loading || isTop20Applying || !top20Preview}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background:
                    isTop20Loading || isTop20Applying || !top20Preview
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(135deg, #F5D06F, #D4AF37)",
                  color:
                    isTop20Loading || isTop20Applying || !top20Preview
                      ? "#777"
                      : "#0F0F0F",
                  border: "1px solid transparent",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {isTop20Applying ? "Menerapkan..." : "Apply Top 20"}
              </button>
            </div>
          </div>

          <p
            className="text-xs mb-3"
            style={{ color: "#888", fontFamily: "var(--font-poppins)" }}
          >
            Kandidat audisi: {top20Preview?.candidateTotal ?? 0} | Sudah bernilai:{" "}
            {top20Preview?.candidateScored ?? 0}
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
              >
                Top Encik
              </p>
              <div className="space-y-1">
                {(top20Preview?.topEncik ?? []).map((item) => (
                  <p
                    key={`encik-${item.user_id}`}
                    className="text-xs"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  >
                    {(item.rank ?? 0).toString().padStart(2, "0")}. {item.participant_code ?? item.audition_number ?? item.participant_id} - {item.name} ({item.audition_average.toFixed(2)})
                  </p>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}
              >
                Top Puan
              </p>
              <div className="space-y-1">
                {(top20Preview?.topPuan ?? []).map((item) => (
                  <p
                    key={`puan-${item.user_id}`}
                    className="text-xs"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  >
                    {(item.rank ?? 0).toString().padStart(2, "0")}. {item.participant_code ?? item.audition_number ?? item.participant_id} - {item.name} ({item.audition_average.toFixed(2)})
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Kartu statistik ini aman dipindah ke komponen karena hanya butuh data siap pakai. */}
      <ScoringStatsCards
        participantsCount={participants.length}
        stageLabel={getAdminScoreStageLabel(activeStage)}
        submittedParticipantsCount={submittedParticipantsCount}
        isProgressStage={isProgressStage(activeStage)}
        judgeCount={judgesForStage.length}
        stageKeyLabel={activeStage}
        notesCount={
          participantNotes.filter(
            (note) => note.stage === getDefaultNoteStage(activeStage),
          ).length
        }
      />

      {/* Ringkasan nilai tetap diletakkan dekat atas agar halaman tidak terasa hanya berisi tahapan. */}
      <ScoreStageSummary
        title={`Ringkasan Nilai Tahap ${getAdminScoreStageLabel(activeStage)}`}
        activeStage={activeStage}
        rankings={rankings}
        officialScoreCount={officialScoreCount}
        averageStageScore={averageStageScore}
        selectedParticipantId={selectedParticipantId}
        onSelectParticipant={setSelectedParticipantId}
      />

      <div className="grid xl:grid-cols-[minmax(0,2fr)_380px] gap-6 mb-6">
        {/* Tabel progres sengaja dipisah ke komponen karena ini blok UI terbesar di halaman. */}
        <ProgressChecklistSection
          activeStage={activeStage}
          isProgressStage={isProgressStage(activeStage)}
          participants={participants}
          progressDraftsCount={Object.keys(progressDrafts).length}
          canSaveProgress={isProgressStage(activeStage) && participants.length > 0}
          isSavingProgress={isSavingProgress}
          selectedParticipantId={selectedParticipantId}
          onSaveProgress={handleSaveProgress}
          onSelectParticipant={setSelectedParticipantId}
          onToggleProgress={handleProgressToggle}
          onToggleAuditionElimination={handleToggleAuditionElimination}
          isParticipantEliminated={isRejectedParticipant}
          getDraftProgress={getDraftProgress}
        />

        {/* Panel kanan ini berisi dua mode: daftar juri atau detail catatan peserta terpilih. */}
        <ScoringSidePanel
          activeStage={activeStage}
          selectedParticipant={selectedParticipant}
          judgesForStage={judgesForStage}
          activeScoreCriteria={activeScoreCriteria}
          selectedJudgeId={selectedJudgeId}
          selectedJudgeName={selectedJudgeName}
          isScoreLocked={isSelectedParticipantScoreLocked}
          scoreLockedAt={selectedParticipantScoreRecord?.submittedAt}
          scoreInputs={selectedParticipantScore}
          scoreTotal={
            isScoreStage(activeStage)
              ? calculateStageTotal(selectedParticipantScore, activeStage)
              : 0
          }
          isScoreComplete={isSelectedParticipantScoreComplete}
          isScoreSaving={scoreSubmitting}
          isCorrectionMode={Boolean(correctionReason)}
          availableNoteStages={availableNoteStages}
          resolvedNoteStage={resolvedNoteStage}
          noteDraft={noteDraft}
          resolvedNoteAuthorName={resolvedNoteAuthorName}
          visibleNotes={visibleNotes}
          formatDateTime={formatDateTime}
          onCloseParticipant={() => setSelectedParticipantId(null)}
          onSelectJudge={setSelectedJudgeId}
          onScoreInputChange={handleAdminScoreChange}
          onSaveScore={handleSubmitAdminScore}
          onStartCorrection={() => {
            const reason = window.prompt("Tuliskan alasan koreksi nilai (wajib):");
            if (reason?.trim() && reason.trim().length >= 5) setCorrectionReason(reason.trim());
            else if (reason !== null) setSyncMessage("Alasan koreksi minimal 5 karakter.");
          }}
          onSaveNote={handleSaveNote}
          onNoteDraftChange={(updater) => setNoteDraft((prev) => updater(prev))}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StageRankingCard
            stageLabel={getAdminScoreStageLabel(activeStage)}
            activeStage={activeStage}
            rankings={rankings}
            selectedParticipantId={selectedParticipantId}
            onSelectParticipant={setSelectedParticipantId}
          />
        </div>
        <div>
          <RubricSummaryCard
            activeStage={activeStage}
            isScoreStage={isScoreStage(activeStage)}
          />
        </div>
      </div>
    </div>
  );
}

