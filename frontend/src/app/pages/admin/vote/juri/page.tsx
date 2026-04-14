"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React, { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Save, PlusCircle } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import { GoldButton } from "../../../../../components/ui/GoldButton";
import { useApp } from "../../../../../context/AppContext";
import { getParticipantSelectionStage } from "../../../../../data/mockData";
import { resolveApiAssetUrl, getReadableApiError } from "../../../../../lib/api";
import { getParticipantAuthSession } from "../../../../../lib/auth-storage";
import { fetchJudgeScoreRecap, updateJudgeScoreAdjustment } from "../../../../../lib/judge-score-recap-api";
import { updateJuryWinners } from "../../../../../lib/auth-api";

type RankValue = 1 | 2 | 3;

type RankedCandidate = {
  participantId: string;
  number: string;
  name: string;
  gender: "Encik" | "Puan";
  photo: string;
  instagramHandle: string;
  totalScore: number;
};

type RecapRow = {
  participant_id: string;
  participant_number: string;
  grand_final_average: number;
  final_score: number;
  final_score_base: number;
  admin_score_adjustment: number;
  admin_score_adjustment_note: string | null;
};

function parseParticipantUserId(participantId: string): number | null {
  const raw = participantId.replace(/^P_API_/i, "").trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getDisplayName(gender: "Encik" | "Puan", rawName: string) {
  const normalized = rawName.trim().replace(/^(encik|puan)\s+/i, "");
  const nickname = normalized.split(/\s+/)[0] ?? "";
  const finalName = toTitleCase(nickname || normalized || "Peserta");
  return `${gender} ${finalName}`.trim();
}

function resolveDisplayPhoto(url?: string | null) {
  const value = url?.trim();
  if (!value || value === "/default-avatar.svg") return "/default-avatar.svg";
  if (value.startsWith("/vote-candidates/")) return value;
  if (value.startsWith("/storage/")) {
    return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    if (value.includes("/default-avatar.svg")) return "/default-avatar.svg";
    return value;
  }
  return resolveApiAssetUrl(value) ?? "/default-avatar.svg";
}

function mergeAutoWinners(
  current: Array<{ participantId: string; rank: RankValue }>,
  auto: RankedCandidate[],
  gender: "Encik" | "Puan"
) {
  const currentByRank = new Map(current.map((item) => [item.rank, item.participantId] as const));
  const used = new Set(current.map((item) => item.participantId));
  const result: Array<{ rank: RankValue; participantId: string }> = [];

  ([1, 2, 3] as RankValue[]).forEach((rank) => {
    const existing = currentByRank.get(rank);
    if (existing) {
      result.push({ rank, participantId: existing });
      return;
    }

    const nextAuto = auto.find((candidate) => !used.has(candidate.participantId) && candidate.gender === gender);
    if (nextAuto) {
      used.add(nextAuto.participantId);
      result.push({ rank, participantId: nextAuto.participantId });
    }
  });

  return result;
}

export default function AdminVoteJuryPage() {
  const {
    participantList,
    voteCandidateList,
    setJudgeWinnerList,
    judgeEncikWinnerList,
    setJudgeEncikWinnerList,
    judgePuanWinnerList,
    setJudgePuanWinnerList,
    judgeEncikPublished,
    setJudgeEncikPublished,
    judgePuanPublished,
    setJudgePuanPublished,
    judgeEncikDisplayMode,
    setJudgeEncikDisplayMode,
    judgePuanDisplayMode,
    setJudgePuanDisplayMode,
    setJudgeWinnersPublished,
    setJudgeWinnerDisplayMode,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [draftEncikWinners, setDraftEncikWinners] = useState(judgeEncikWinnerList);
  const [draftPuanWinners, setDraftPuanWinners] = useState(judgePuanWinnerList);

  const token = useMemo(() => getParticipantAuthSession()?.token ?? "", []);

  const persistJurySettings = async (
    overrides?: Partial<{
      judge_encik_published: boolean;
      judge_puan_published: boolean;
      judge_encik_display_mode: "name_only" | "name_with_score";
      judge_puan_display_mode: "name_only" | "name_with_score";
      judge_encik_winners: typeof draftEncikWinners;
      judge_puan_winners: typeof draftPuanWinners;
    }>,
    successMessage?: string
  ) => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan login ulang.");
      return false;
    }

    const payload = {
      judge_encik_published: overrides?.judge_encik_published ?? judgeEncikPublished,
      judge_puan_published: overrides?.judge_puan_published ?? judgePuanPublished,
      judge_encik_display_mode: overrides?.judge_encik_display_mode ?? judgeEncikDisplayMode,
      judge_puan_display_mode: overrides?.judge_puan_display_mode ?? judgePuanDisplayMode,
      judge_encik_winners: overrides?.judge_encik_winners ?? draftEncikWinners,
      judge_puan_winners: overrides?.judge_puan_winners ?? draftPuanWinners,
    } as const;

    try {
      setSaving(true);
      setError("");
      const response = await updateJuryWinners(token, payload);

      setJudgeEncikPublished(Boolean(response.data.judge_encik_published));
      setJudgePuanPublished(Boolean(response.data.judge_puan_published));
      setJudgeEncikDisplayMode(response.data.judge_encik_display_mode);
      setJudgePuanDisplayMode(response.data.judge_puan_display_mode);
      setJudgeEncikWinnerList((response.data.judge_encik_winners ?? []) as typeof draftEncikWinners);
      setJudgePuanWinnerList((response.data.judge_puan_winners ?? []) as typeof draftPuanWinners);

      setDraftEncikWinners((response.data.judge_encik_winners ?? []) as typeof draftEncikWinners);
      setDraftPuanWinners((response.data.judge_puan_winners ?? []) as typeof draftPuanWinners);

      setJudgeWinnerList(
        [
          ...((response.data.judge_encik_winners ?? []) as typeof draftEncikWinners),
          ...((response.data.judge_puan_winners ?? []) as typeof draftPuanWinners),
        ]
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)
      );

      syncLegacyAggregateSettings(
        Boolean(response.data.judge_encik_published),
        Boolean(response.data.judge_puan_published)
      );

      setNotice(successMessage || response.message || "Perubahan juara juri berhasil disimpan.");
      return true;
    } catch (err) {
      setError(getReadableApiError(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => setDraftEncikWinners(judgeEncikWinnerList), [judgeEncikWinnerList]);
  useEffect(() => setDraftPuanWinners(judgePuanWinnerList), [judgePuanWinnerList]);

  const finalCandidates = useMemo(() => {
    return participantList.filter((participant) => {
      const selectionStage = getParticipantSelectionStage(participant);
      return selectionStage === "Grand Final" || selectionStage === "Final Result";
    });
  }, [participantList]);

  const voteCandidateByParticipantId = useMemo(
    () => new Map(voteCandidateList.map((item) => [item.participantId, item] as const)),
    [voteCandidateList]
  );

  const [recapRows, setRecapRows] = useState<RecapRow[]>([]);
  const [adjustParticipantId, setAdjustParticipantId] = useState("");
  const [adjustmentValue, setAdjustmentValue] = useState("0");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const loadRecap = async () => {
      try {
        setLoading(true);
        setError("");
        const recap = await fetchJudgeScoreRecap(token, { force: true, maxAgeMs: 0 });
        if (cancelled) return;

        setRecapRows(
          recap.data.map((row) => ({
            participant_id: row.participant_id,
            participant_number: row.participant_number,
            grand_final_average: Number(row.grand_final_average ?? 0),
            final_score: Number(row.final_score ?? 0),
            final_score_base: Number(row.final_score_base ?? row.final_score ?? 0),
            admin_score_adjustment: Number(row.admin_score_adjustment ?? 0),
            admin_score_adjustment_note: row.admin_score_adjustment_note ?? null,
          }))
        );
      } catch (err) {
        if (!cancelled) setError(getReadableApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRecap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const computedRanking = useMemo<RankedCandidate[]>(() => {
    const byParticipantId = new Map(recapRows.map((row) => [row.participant_id, row] as const));
    const byNumber = new Map(recapRows.map((row) => [row.participant_number, row] as const));

    return finalCandidates
      .map((participant) => {
        const recap = byParticipantId.get(participant.id) ?? byNumber.get(participant.number);
        const totalScore = Math.round(((recap?.final_score ?? recap?.grand_final_average ?? 0) as number) * 100) / 100;
        return {
          participantId: participant.id,
          number: participant.number,
          name: getDisplayName(participant.gender, participant.name),
          gender: participant.gender,
          photo:
            voteCandidateByParticipantId.get(participant.id)?.photo ||
            participant.photo ||
            "/default-avatar.svg",
          instagramHandle:
            voteCandidateByParticipantId.get(participant.id)?.instagramHandle ||
            participant.instagram,
          totalScore,
        } satisfies RankedCandidate;
      })
      .filter((item) => item.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [finalCandidates, recapRows, voteCandidateByParticipantId]);

  const computedScoreMap = useMemo(
    () => new Map(computedRanking.map((item) => [item.participantId, item.totalScore] as const)),
    [computedRanking]
  );
  const recapByParticipant = useMemo(
    () => new Map(recapRows.map((row) => [row.participant_id, row] as const)),
    [recapRows]
  );

  useEffect(() => {
    if (!adjustParticipantId && computedRanking[0]) {
      setAdjustParticipantId(computedRanking[0].participantId);
    }
  }, [adjustParticipantId, computedRanking]);

  useEffect(() => {
    if (!adjustParticipantId) return;
    const selected = recapByParticipant.get(adjustParticipantId);
    if (!selected) return;
    setAdjustmentValue(String(selected.admin_score_adjustment ?? 0));
    setAdjustmentNote(selected.admin_score_adjustment_note ?? "");
  }, [adjustParticipantId, recapByParticipant]);

  const computedEncikRanking = useMemo(() => computedRanking.filter((item) => item.gender === "Encik"), [computedRanking]);
  const computedPuanRanking = useMemo(() => computedRanking.filter((item) => item.gender === "Puan"), [computedRanking]);

  const finalEncikCandidates = useMemo(() => finalCandidates.filter((item) => item.gender === "Encik"), [finalCandidates]);
  const finalPuanCandidates = useMemo(() => finalCandidates.filter((item) => item.gender === "Puan"), [finalCandidates]);

  const resolveWinnerPhoto = (participantId: string, fallback?: string) =>
    voteCandidateByParticipantId.get(participantId)?.photo || fallback || "/default-avatar.svg";
  const resolveWinnerInstagram = (participantId: string, fallback?: string) =>
    voteCandidateByParticipantId.get(participantId)?.instagramHandle || fallback || "@-";

  const applyAutoWinners = async () => {
    const nextEncik = mergeAutoWinners(
      draftEncikWinners.map((w) => ({ rank: w.rank as RankValue, participantId: w.participantId })),
      computedEncikRanking,
      "Encik"
    );
    const nextPuan = mergeAutoWinners(
      draftPuanWinners.map((w) => ({ rank: w.rank as RankValue, participantId: w.participantId })),
      computedPuanRanking,
      "Puan"
    );

    const buildWinner = (rank: RankValue, participantId: string, group: "Encik" | "Puan") => {
      const source = group === "Encik" ? finalEncikCandidates : finalPuanCandidates;
      const participant = source.find((item) => item.id === participantId);
      if (!participant) return null;
      return {
        id: `jw-${group.toLowerCase()}-${rank}`,
        participantId: participant.id,
        number: participant.number,
        name: getDisplayName(group, participant.name),
        gender: group,
        photo: resolveWinnerPhoto(participant.id, participant.photo),
        instagramHandle: resolveWinnerInstagram(participant.id, participant.instagram),
        totalScore: computedScoreMap.get(participant.id) ?? 0,
        rank,
      };
    };

    const nextEncikWinners = nextEncik
      .map((item) => buildWinner(item.rank, item.participantId, "Encik"))
      .filter(Boolean) as typeof draftEncikWinners;
    const nextPuanWinners = nextPuan
      .map((item) => buildWinner(item.rank, item.participantId, "Puan"))
      .filter(Boolean) as typeof draftPuanWinners;

    setDraftEncikWinners(nextEncikWinners);
    setDraftPuanWinners(nextPuanWinners);
    // Auto-fill sekarang langsung commit, supaya tab publik langsung kebaca.
    setJudgeEncikWinnerList(nextEncikWinners);
    setJudgePuanWinnerList(nextPuanWinners);
    setJudgeWinnerList(
      [...nextEncikWinners, ...nextPuanWinners].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3)
    );
    await persistJurySettings(
      {
        judge_encik_winners: nextEncikWinners,
        judge_puan_winners: nextPuanWinners,
      },
      "Auto-fill diterapkan dan disimpan ke database."
    );
  };

  const setWinnerByRank = (group: "Encik" | "Puan", rank: RankValue, participantId: string) => {
    const sourceCandidates = group === "Encik" ? finalEncikCandidates : finalPuanCandidates;
    const participant = sourceCandidates.find((entry) => entry.id === participantId);

    if (!participantId || !participant) {
      if (group === "Encik") {
        const nextEncik = draftEncikWinners.filter((entry) => entry.rank !== rank);
        setDraftEncikWinners(nextEncik);
        setJudgeEncikWinnerList(nextEncik);
        setJudgeWinnerList([...nextEncik, ...draftPuanWinners].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3));
      } else {
        const nextPuan = draftPuanWinners.filter((entry) => entry.rank !== rank);
        setDraftPuanWinners(nextPuan);
        setJudgePuanWinnerList(nextPuan);
        setJudgeWinnerList([...draftEncikWinners, ...nextPuan].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3));
      }
      return;
    }

    const winner = {
      id: `jw-${group.toLowerCase()}-${rank}`,
      participantId: participant.id,
      number: participant.number,
      name: getDisplayName(group, participant.name),
      gender: group,
      photo: resolveWinnerPhoto(participant.id, participant.photo),
      instagramHandle: resolveWinnerInstagram(participant.id, participant.instagram),
      totalScore: computedScoreMap.get(participant.id) ?? 0,
      rank,
    };

    if (group === "Encik") {
      const existing = draftEncikWinners.filter((entry) => entry.rank !== rank && entry.participantId !== participant.id);
      const nextEncik = [...existing, winner].sort((a, b) => a.rank - b.rank);
      setDraftEncikWinners(nextEncik);
      setJudgeEncikWinnerList(nextEncik);
      setJudgeWinnerList([...nextEncik, ...draftPuanWinners].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3));
      return;
    }

    const existing = draftPuanWinners.filter((entry) => entry.rank !== rank && entry.participantId !== participant.id);
    const nextPuan = [...existing, winner].sort((a, b) => a.rank - b.rank);
    setDraftPuanWinners(nextPuan);
    setJudgePuanWinnerList(nextPuan);
    setJudgeWinnerList([...draftEncikWinners, ...nextPuan].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3));
  };

  const clearWinnerByRank = (group: "Encik" | "Puan", rank: RankValue) => {
    if (group === "Encik") {
      const nextEncik = draftEncikWinners.filter((entry) => entry.rank !== rank);
      setDraftEncikWinners(nextEncik);
      setJudgeEncikWinnerList(nextEncik);
      setJudgeWinnerList([...nextEncik, ...draftPuanWinners].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3));
      return;
    }

    const nextPuan = draftPuanWinners.filter((entry) => entry.rank !== rank);
    setDraftPuanWinners(nextPuan);
    setJudgePuanWinnerList(nextPuan);
    setJudgeWinnerList([...draftEncikWinners, ...nextPuan].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3));
  };

  const saveEncik = async () => {
    await persistJurySettings(
      {
        judge_encik_winners: draftEncikWinners,
      },
      "Juara Encik tersimpan ke database."
    );
  };

  const savePuan = async () => {
    await persistJurySettings(
      {
        judge_puan_winners: draftPuanWinners,
      },
      "Juara Puan tersimpan ke database."
    );
  };

  const handleSaveAdjustment = async () => {
    if (!token) {
      setError("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }
    const participantUserId = parseParticipantUserId(adjustParticipantId);
    if (!participantUserId) {
      setError("Pilih peserta final terlebih dahulu.");
      return;
    }

    const parsedAdjustment = Number.parseFloat(adjustmentValue || "0");
    if (!Number.isFinite(parsedAdjustment)) {
      setError("Nilai tambahan admin tidak valid.");
      return;
    }

    try {
      setAdjustmentSaving(true);
      setError("");
      const response = await updateJudgeScoreAdjustment(token, {
        participant_user_id: participantUserId,
        admin_score_adjustment: parsedAdjustment,
        admin_score_adjustment_note: adjustmentNote.trim() || null,
      });
      setNotice(response.message || "Nilai tambahan admin berhasil disimpan.");
      const recap = await fetchJudgeScoreRecap(token, { force: true, maxAgeMs: 0 });
      setRecapRows(
        recap.data.map((row) => ({
          participant_id: row.participant_id,
          participant_number: row.participant_number,
          grand_final_average: Number(row.grand_final_average ?? 0),
          final_score: Number(row.final_score ?? 0),
          final_score_base: Number(row.final_score_base ?? row.final_score ?? 0),
          admin_score_adjustment: Number(row.admin_score_adjustment ?? 0),
          admin_score_adjustment_note: row.admin_score_adjustment_note ?? null,
        }))
      );
    } catch (err) {
      setError(getReadableApiError(err));
    } finally {
      setAdjustmentSaving(false);
    }
  };

  const syncLegacyAggregateSettings = (
    nextEncikPublished: boolean,
    nextPuanPublished: boolean
  ) => {
    const nextAnyPublished = nextEncikPublished || nextPuanPublished;
    setJudgeWinnersPublished(nextAnyPublished);
    setJudgeWinnerDisplayMode(
      judgeEncikDisplayMode === "name_with_score" || judgePuanDisplayMode === "name_with_score"
        ? "name_with_score"
        : "name_only"
    );
  };

  const togglePublishEncik = async () => {
    const nextPublished = !judgeEncikPublished;
    if (!judgeEncikPublished) {
      setJudgeEncikWinnerList(draftEncikWinners);
      setJudgeEncikPublished(true);
      syncLegacyAggregateSettings(true, judgePuanPublished);
    } else {
      setJudgeEncikPublished(false);
      syncLegacyAggregateSettings(false, judgePuanPublished);
    }

    await persistJurySettings(
      {
        judge_encik_published: nextPublished,
        judge_encik_winners: draftEncikWinners,
      },
      nextPublished
        ? "Publikasi Juara Encik diaktifkan."
        : "Publikasi Juara Encik dinonaktifkan."
    );
  };

  const togglePublishPuan = async () => {
    const nextPublished = !judgePuanPublished;
    if (!judgePuanPublished) {
      setJudgePuanWinnerList(draftPuanWinners);
      setJudgePuanPublished(true);
      syncLegacyAggregateSettings(judgeEncikPublished, true);
    } else {
      setJudgePuanPublished(false);
      syncLegacyAggregateSettings(judgeEncikPublished, false);
    }

    await persistJurySettings(
      {
        judge_puan_published: nextPublished,
        judge_puan_winners: draftPuanWinners,
      },
      nextPublished
        ? "Publikasi Juara Puan diaktifkan."
        : "Publikasi Juara Puan dinonaktifkan."
    );
  };

  const getWinner = (group: "Encik" | "Puan", rank: RankValue) => {
    const source = group === "Encik" ? draftEncikWinners : draftPuanWinners;
    return source.find((winner) => winner.rank === rank);
  };

  const renderRankingPanel = (
    title: string,
    rows: RankedCandidate[],
    group: "Encik" | "Puan",
    onSave: () => void | Promise<void>
  ) => {
    const sourceCandidates = group === "Encik" ? finalEncikCandidates : finalPuanCandidates;
    const selectedByGroup = group === "Encik" ? draftEncikWinners : draftPuanWinners;
    const selectedMap = new Map(selectedByGroup.map((item) => [item.rank, item.participantId] as const));
    const selectedIds = new Set(selectedByGroup.map((item) => item.participantId));

    const getAvailableCandidates = (rank: RankValue) => {
      const currentId = selectedMap.get(rank);
      return sourceCandidates.filter((candidate) => {
        if (currentId && candidate.id === currentId) return true;
        return !selectedIds.has(candidate.id);
      });
    };

    return (
      <GoldCard className="mb-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          {title}
        </h3>
        {rows.length === 0 ? (
          <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-poppins)" }}>
            Belum ada nilai resmi Grand Final untuk kategori {group}.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {rows.slice(0, 10).map((row, index) => (
              <div key={`${group}-${row.participantId}`} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.15)" }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(212,175,55,0.18)", color: "#D4AF37" }}>{index + 1}</span>
                <img
                  src={resolveDisplayPhoto(row.photo)}
                  alt={row.name}
                  className="w-10 h-10 rounded-full object-cover object-top"
                  style={{ border: "1px solid rgba(212,175,55,0.25)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>{row.number} - {row.name}</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>Nilai: {row.totalScore.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {([1, 2, 3] as RankValue[]).map((rank) => {
            const winner = getWinner(group, rank);
            return (
              <div key={`${group}-${rank}`} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.16)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}><Medal size={14} /></div>
                  <div className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>Juara {rank}</div>
                  <select value={winner?.participantId ?? ""} onChange={(event) => setWinnerByRank(group, rank, event.target.value)} className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}>
                    <option value="">Pilih Peserta</option>
                    {getAvailableCandidates(rank).map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>{candidate.number} - {getDisplayName(group, candidate.name)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => clearWinnerByRank(group, rank)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.35)",
                      color: "#ef4444",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    Hapus
                  </button>
                </div>
                {winner ? (
                  <p className="text-xs mt-2" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>Nilai akumulasi: {winner.totalScore.toFixed(2)}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <GoldButton variant="primary" size="sm" onClick={onSave} disabled={saving}>
            <Save size={14} /> Simpan Juara {group}
          </GoldButton>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
          Perubahan pilihan juga tersimpan otomatis dan langsung sinkron ke landing.
        </p>
      </GoldCard>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>Juara Versi Juri</h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>Publish juara 1, 2, 3 berdasarkan nilai resmi Grand Final dari juri utama.</p>
      </div>

      <GoldCard glow className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>Status Publikasi Juara Juri</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
              Publikasi dibuat terpisah: Encik dan Puan.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={togglePublishEncik} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: judgeEncikPublished ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${judgeEncikPublished ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`, color: judgeEncikPublished ? "#22c55e" : "#ef4444", fontFamily: "var(--font-poppins)", cursor: "pointer" }}>
              {judgeEncikPublished ? "Encik: Dipublikasikan" : "Encik: Nonaktif"}
            </button>
            <button type="button" onClick={togglePublishPuan} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: judgePuanPublished ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${judgePuanPublished ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`, color: judgePuanPublished ? "#22c55e" : "#ef4444", fontFamily: "var(--font-poppins)", cursor: "pointer" }}>
              {judgePuanPublished ? "Puan: Dipublikasikan" : "Puan: Nonaktif"}
            </button>
          </div>
        </div>
      </GoldCard>

      <GoldCard className="mb-6">
        <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          Nilai Tambahan Admin
        </h3>
        <p className="text-xs mt-2" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
          Tambahkan atau kurangi nilai akhir peserta setelah nilai juri dinyatakan fix.
        </p>
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <select
            value={adjustParticipantId}
            onChange={(event) => setAdjustParticipantId(event.target.value)}
            className="md:col-span-2 px-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
          >
            <option value="">Pilih peserta final</option>
            {computedRanking.map((row) => (
              <option key={row.participantId} value={row.participantId}>
                {row.number} - {row.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={adjustmentValue}
            onChange={(event) => setAdjustmentValue(event.target.value)}
            className="px-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
            placeholder="Contoh: 2.50"
          />
          <GoldButton variant="primary" size="sm" onClick={handleSaveAdjustment} disabled={adjustmentSaving || !adjustParticipantId}>
            <PlusCircle size={14} />
            {adjustmentSaving ? "Menyimpan..." : "Simpan"}
          </GoldButton>
        </div>
        <textarea
          rows={3}
          value={adjustmentNote}
          onChange={(event) => setAdjustmentNote(event.target.value)}
          className="w-full mt-3 px-3 py-2 rounded-lg text-xs outline-none"
          style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
          placeholder="Catatan alasan penambahan/pengurangan nilai (opsional)"
        />
        {adjustParticipantId && recapByParticipant.get(adjustParticipantId) ? (
          <p className="text-xs mt-2" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
            Nilai dasar: {Number(recapByParticipant.get(adjustParticipantId)?.final_score_base ?? 0).toFixed(2)} | Tambahan admin: {Number(recapByParticipant.get(adjustParticipantId)?.admin_score_adjustment ?? 0).toFixed(2)} | Nilai akhir: {Number(recapByParticipant.get(adjustParticipantId)?.final_score ?? 0).toFixed(2)}
          </p>
        ) : null}
      </GoldCard>

      <GoldCard className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>Akumulasi Nilai Grand Final</h3>
          <div className="flex items-center gap-2">
            <select
              value={judgeEncikDisplayMode}
              onChange={async (e) => {
                const nextMode = e.target.value as "name_only" | "name_with_score";
                setJudgeEncikDisplayMode(nextMode);
                await persistJurySettings(
                  { judge_encik_display_mode: nextMode },
                  "Mode tampilan juara Encik tersimpan."
                );
              }}
              className="px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
            >
              <option value="name_only">Landing Encik: Nama saja</option>
              <option value="name_with_score">Landing Encik: Nama + Nilai</option>
            </select>
            <select
              value={judgePuanDisplayMode}
              onChange={async (e) => {
                const nextMode = e.target.value as "name_only" | "name_with_score";
                setJudgePuanDisplayMode(nextMode);
                await persistJurySettings(
                  { judge_puan_display_mode: nextMode },
                  "Mode tampilan juara Puan tersimpan."
                );
              }}
              className="px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
            >
              <option value="name_only">Landing Puan: Nama saja</option>
              <option value="name_with_score">Landing Puan: Nama + Nilai</option>
            </select>
            <GoldButton variant="primary" size="sm" onClick={applyAutoWinners} disabled={saving || loading}>
              <Trophy size={14} /> Isi Juara Otomatis
            </GoldButton>
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
          Otomatis diambil dari nilai resmi Grand Final di database. Auto-fill hanya mengisi slot kosong, tidak menghapus manual.
        </p>
        {loading ? <p className="text-xs mt-2" style={{ color: "#BDBDBD" }}>Memuat rekap nilai...</p> : null}
        {error ? <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{error}</p> : null}
      </GoldCard>

      {renderRankingPanel("Penetapan Juara Encik 1, 2, 3", computedEncikRanking, "Encik", saveEncik)}
      {renderRankingPanel("Penetapan Juara Puan 1, 2, 3", computedPuanRanking, "Puan", savePuan)}

      {saving ? <p className="text-xs mt-4" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>Menyimpan ke database...</p> : null}
      {notice ? <p className="text-xs mt-4" style={{ color: "#22c55e", fontFamily: "var(--font-poppins)" }}>{notice}</p> : null}
    </div>
  );
}

