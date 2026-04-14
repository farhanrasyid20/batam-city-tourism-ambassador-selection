"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown, Heart, Instagram, Radio } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GoldButton } from "../ui/GoldButton";
import { resolveApiAssetUrl } from "../../lib/api";

function modulo(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

type HighlightParticipant = {
  id: string;
  name: string;
  number: string;
  gender: "Encik" | "Puan";
  photo: string;
  instagram: string;
  likes?: number;
  status: string;
};

type RankedParticipant = {
  participant: HighlightParticipant;
  avg: number | null;
};

const OFFICIAL_ACCOUNT = "@dutawisatakotabatam";
const OFFICIAL_ACCOUNT_URL = "https://instagram.com/dutawisatakotabatam";

function formatLikes(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatWibDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatted} WIB`;
}

function extractCodeOrder(value: string) {
  const match = value.match(/(\d{1,4})$/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function interleaveByCode<T extends { gender: "Encik" | "Puan"; number: string }>(items: T[]) {
  const encik = items
    .filter((item) => item.gender === "Encik")
    .sort((a, b) => extractCodeOrder(a.number) - extractCodeOrder(b.number));
  const puan = items
    .filter((item) => item.gender === "Puan")
    .sort((a, b) => extractCodeOrder(a.number) - extractCodeOrder(b.number));

  const max = Math.max(encik.length, puan.length);
  const result: T[] = [];
  for (let index = 0; index < max; index += 1) {
    if (encik[index]) result.push(encik[index]);
    if (puan[index]) result.push(puan[index]);
  }
  return result;
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

function buildRankEntries(
  participants: HighlightParticipant[],
  averageMap: Map<string, number | null>,
  mode: "jury" | "vote",
  officialLikesMap?: Record<string, number>
): RankedParticipant[] {
  return participants
    .map((participant) => ({
      participant,
      avg: averageMap.get(participant.id) ?? null,
    }))
    .sort((a, b) => {
      if (mode === "jury") {
        const aScore = a.avg ?? -1;
        const bScore = b.avg ?? -1;
        if (bScore !== aScore) return bScore - aScore;
      } else {
        const aLikes = officialLikesMap?.[a.participant.id] ?? a.participant.likes ?? 0;
        const bLikes = officialLikesMap?.[b.participant.id] ?? b.participant.likes ?? 0;
        const voteDiff = bLikes - aLikes;
        if (voteDiff !== 0) return voteDiff;
      }

      if (a.participant.status !== b.participant.status) {
        return a.participant.status === "Winner" ? -1 : 1;
      }

      const aLikes = officialLikesMap?.[a.participant.id] ?? a.participant.likes ?? 0;
      const bLikes = officialLikesMap?.[b.participant.id] ?? b.participant.likes ?? 0;
      return bLikes - aLikes;
    });
}

function RankingColumn({
  title,
  entries,
  mode,
  officialLikesMap,
  lastSyncedAt,
  showJuryScore = false,
  isPublished = true,
  unpublishedMessage = "Belum dipublikasikan oleh admin.",
}: {
  title: string;
  entries: RankedParticipant[];
  mode: "jury" | "vote";
  officialLikesMap?: Record<string, number>;
  lastSyncedAt?: string;
  showJuryScore?: boolean;
  isPublished?: boolean;
  unpublishedMessage?: string;
}) {
  return (
    <div
      className="rounded-[28px] p-5 sm:p-6 h-full"
      style={{
        background: "#111111",
        border: "1px solid rgba(200,162,77,0.26)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.32)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.28em] mb-2"
            style={{ color: "rgba(200,162,77,0.78)", fontFamily: "var(--font-poppins)" }}
          >
            {mode === "jury" ? "Pilihan Juri" : "Vote Instagram Resmi"}
          </p>
          <h3
            className="text-lg sm:text-xl leading-tight"
            style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
          >
            {title}
          </h3>
          {mode === "vote" && lastSyncedAt ? (
            <p
              className="text-[11px] mt-2"
              style={{ color: "#A9A9A9", fontFamily: "var(--font-poppins)" }}
            >
              Pembaruan data terakhir: {lastSyncedAt}
            </p>
          ) : null}
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "rgba(200,162,77,0.14)",
            border: "1px solid rgba(200,162,77,0.24)",
            color: "#F5D06F",
          }}
        >
          {mode === "vote" ? <Heart size={18} /> : <Crown size={18} />}
        </div>
      </div>

      <div className="grid gap-3">
        {!isPublished ? (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "#1A1A1A",
              border: "1px dashed rgba(200,162,77,0.22)",
            }}
          >
            <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              {unpublishedMessage}
            </p>
          </div>
        ) : entries.length > 0 ? (
          entries.map((entry, index) => {
            const winner = entry.participant;
            const voteCount = officialLikesMap?.[winner.id] ?? winner.likes ?? 0;
            const subtitle =
              mode === "jury"
                ? `${winner.number} | ${showJuryScore && entry.avg !== null ? `Nilai ${entry.avg.toFixed(2)}` : "Peringkat pilihan juri"}`
                : `${winner.number} | ${formatLikes(voteCount)} like posting resmi`;

            return (
              <div
                key={`${mode}-${title}-${winner.id}-${index + 1}`}
                className="rounded-2xl p-3 sm:p-4 flex items-center gap-3"
                style={{
                  background: "#1A1A1A",
                  border:
                    index === 0
                      ? "1px solid rgba(200,162,77,0.34)"
                      : "1px solid rgba(200,162,77,0.14)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #F7DF95, #C8A24D)"
                        : "rgba(200,162,77,0.16)",
                    color: index === 0 ? "#0F0F0F" : "#F5D06F",
                    fontFamily: "var(--font-cinzel)",
                  }}
                >
                  {index + 1}
                </div>

                <img
                  src={winner.photo}
                  alt={winner.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover object-top shrink-0"
                  style={{ border: "1px solid rgba(200,162,77,0.28)" }}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm sm:text-[15px]"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
                  >
                    {winner.name}
                  </p>
                  <p
                    className="text-[11px] sm:text-xs mt-1"
                    style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
                  >
                    {subtitle}
                  </p>
                  <p
                    className="text-[11px] sm:text-xs mt-2"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
                  >
                    <Instagram size={12} className="inline mr-1" />
                    {mode === "vote" ? OFFICIAL_ACCOUNT : winner.instagram}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "#1A1A1A",
              border: "1px dashed rgba(200,162,77,0.22)",
            }}
          >
            <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Data belum tersedia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Section highlight voting publik di landing page.
 * Menampilkan kandidat teratas dan ajakan menuju halaman vote utama.
 */
export default function VoteHighlightSection() {
  const {
    scoreList,
    participantList,
    voteCandidateList,
    voteTopPublished,
    voteRankingPublished,
    judgeEncikWinnerList,
    judgePuanWinnerList,
    judgeEncikPublished,
    judgePuanPublished,
    judgeEncikDisplayMode,
    judgePuanDisplayMode,
    judgeWinnersPublished,
    judgeWinnerDisplayMode,
  } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbsPerPage, setThumbsPerPage] = useState(10);

  const finalists = useMemo(
    () =>
      interleaveByCode(
        voteCandidateList
          .filter((candidate) => candidate.enabled)
          .map((candidate) => ({
            id: candidate.participantId,
            name: candidate.name,
            number: candidate.number,
            gender: candidate.gender,
            photo: resolveDisplayPhoto(candidate.photo),
            instagram: candidate.instagramHandle || "@-",
            likes: candidate.officialLikeCount,
            status: "GrandFinal",
          }))
      ),
    [voteCandidateList]
  );

  const juryParticipantPool = useMemo(
    () =>
      voteCandidateList.map((candidate) => ({
        id: candidate.participantId,
        name: candidate.name,
        number: candidate.number,
        gender: candidate.gender,
        photo: resolveDisplayPhoto(candidate.photo),
        instagram: candidate.instagramHandle || "@-",
        likes: candidate.officialLikeCount,
        status: "GrandFinal",
      })),
    [voteCandidateList]
  );

  const ranking = finalists;
  const hasVoteData = ranking.length > 0;
  const showVoteSection = voteTopPublished && hasVoteData;
  const showVoteRankingSection = voteRankingPublished;
  const hasStoredEncikWinners = judgeEncikWinnerList.length > 0;
  const hasStoredPuanWinners = judgePuanWinnerList.length > 0;
  // Backward compatibility with legacy single publish flag.
  const showLegacyJurySection =
    judgeWinnersPublished &&
    (hasStoredEncikWinners || hasStoredPuanWinners) &&
    !judgeEncikPublished &&
    !judgePuanPublished;
  const showJuryEncikSection =
    hasStoredEncikWinners && (judgeEncikPublished || showLegacyJurySection);
  const showJuryPuanSection =
    hasStoredPuanWinners && (judgePuanPublished || showLegacyJurySection);
  const safeActive = modulo(activeIndex, ranking.length);
  const totalThumbPages = Math.max(1, Math.ceil(ranking.length / thumbsPerPage));
  const safeThumbPage = Math.floor(safeActive / thumbsPerPage);
  const thumbStart = safeThumbPage * thumbsPerPage;
  const visibleThumbs = ranking.slice(thumbStart, thumbStart + thumbsPerPage);

  const showcaseItems = useMemo(() => {
    if (ranking.length === 0) return [];
    if (ranking.length === 1) return [ranking[safeActive]];
    if (ranking.length === 2) {
      return [ranking[safeActive], ranking[modulo(safeActive + 1, ranking.length)]];
    }
    return [
      ranking[modulo(safeActive - 1, ranking.length)],
      ranking[safeActive],
      ranking[modulo(safeActive + 1, ranking.length)],
    ];
  }, [ranking, safeActive]);

  const voteMetaByParticipantId = useMemo(() => {
    return new Map(voteCandidateList.map((candidate) => [candidate.participantId, candidate] as const));
  }, [voteCandidateList]);

  const officialLikesMap = useMemo(() => {
    return Object.fromEntries(
      finalists.map((participant) => {
        const candidate = voteMetaByParticipantId.get(participant.id);
        return [participant.id, candidate?.officialLikeCount ?? participant.likes ?? 0];
      })
    ) as Record<string, number>;
  }, [finalists, voteMetaByParticipantId]);

  const lastSyncedAt = useMemo(() => {
    const latest = finalists
      .map((participant) => voteMetaByParticipantId.get(participant.id)?.likeUpdatedAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

    return formatWibDateTime(latest);
  }, [finalists, voteMetaByParticipantId]);

  const juryAverageMap = useMemo(() => {
    const finalistsById = new Set(juryParticipantPool.map((p) => p.id));
    const aggregateMap = new Map<string, { total: number; count: number }>();

    scoreList.forEach((record) => {
      if (!finalistsById.has(record.participantId)) return;
      const existing = aggregateMap.get(record.participantId) ?? { total: 0, count: 0 };
      aggregateMap.set(record.participantId, {
        total: existing.total + record.totalScore,
        count: existing.count + 1,
      });
    });

    return new Map(
      juryParticipantPool.map((participant) => {
        const aggregate = aggregateMap.get(participant.id);
        const avg = aggregate ? aggregate.total / aggregate.count : null;
        return [participant.id, avg] as const;
      })
    );
  }, [juryParticipantPool, scoreList]);

  const juryParticipantsById = useMemo(
    () => new Map(juryParticipantPool.map((participant) => [participant.id, participant] as const)),
    [juryParticipantPool]
  );

  const juryWinnerFallbackById = useMemo(() => {
    const map = new Map<string, HighlightParticipant>();
    const allWinners = [...judgeEncikWinnerList, ...judgePuanWinnerList];

    allWinners.forEach((winner) => {
      const participantFromDb = participantList.find((item) => item.id === winner.participantId);
      const fallbackGender = winner.gender ?? participantFromDb?.gender ?? "Encik";
      const fallbackNumber = winner.number || participantFromDb?.participantCode || participantFromDb?.number || "-";
      const fallbackName = winner.name || participantFromDb?.name || "Peserta";
      const fallbackPhoto = resolveDisplayPhoto(
        winner.photo || participantFromDb?.photo || "/default-avatar.svg"
      );
      const fallbackInstagram =
        winner.instagramHandle || participantFromDb?.instagram || "@-";

      map.set(winner.participantId, {
        id: winner.participantId,
        name: fallbackName,
        number: fallbackNumber,
        gender: fallbackGender,
        photo: fallbackPhoto,
        instagram: fallbackInstagram,
        likes: voteMetaByParticipantId.get(winner.participantId)?.officialLikeCount ?? 0,
        status: "Winner",
      });
    });

    return map;
  }, [judgeEncikWinnerList, judgePuanWinnerList, participantList, voteMetaByParticipantId]);

  const toRankedEntryById = useMemo(() => {
    return (participantId?: string, fallbackAvg?: number | null) => {
      if (!participantId) return undefined;
      const participant =
        juryParticipantsById.get(participantId) ?? juryWinnerFallbackById.get(participantId);
      if (!participant) return undefined;
      return {
        participant,
        avg: juryAverageMap.get(participantId) ?? fallbackAvg ?? null,
      } satisfies RankedParticipant;
    };
  }, [juryParticipantsById, juryWinnerFallbackById, juryAverageMap]);

  const juryEncikRanking = useMemo(() => {
    return [...judgeEncikWinnerList]
      .sort((a, b) => a.rank - b.rank)
      .map((winner) => toRankedEntryById(winner.participantId, winner.totalScore))
      .filter(Boolean) as RankedParticipant[];
  }, [judgeEncikWinnerList, toRankedEntryById]);

  const juryPuanRanking = useMemo(() => {
    return [...judgePuanWinnerList]
      .sort((a, b) => a.rank - b.rank)
      .map((winner) => toRankedEntryById(winner.participantId, winner.totalScore))
      .filter(Boolean) as RankedParticipant[];
  }, [judgePuanWinnerList, toRankedEntryById]);

  const voteEncikRanking = useMemo(
    () =>
      buildRankEntries(finalists.filter((p) => p.gender === "Encik"), juryAverageMap, "vote", officialLikesMap).slice(0, 1),
    [finalists, juryAverageMap, officialLikesMap]
  );

  const votePuanRanking = useMemo(
    () =>
      buildRankEntries(finalists.filter((p) => p.gender === "Puan"), juryAverageMap, "vote", officialLikesMap).slice(0, 1),
    [finalists, juryAverageMap, officialLikesMap]
  );

  const goPrev = () => setActiveIndex((prev) => prev - 1);
  const goNext = () => setActiveIndex((prev) => prev + 1);
  const goPrevThumbPage = () => {
    if (ranking.length === 0) return;
    const prevPage = modulo(safeThumbPage - 1, totalThumbPages);
    setActiveIndex(prevPage * thumbsPerPage);
  };
  const goNextThumbPage = () => {
    if (ranking.length === 0) return;
    const nextPage = modulo(safeThumbPage + 1, totalThumbPages);
    setActiveIndex(nextPage * thumbsPerPage);
  };

  useEffect(() => {
    if (ranking.length <= 1) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((prev) => prev + 1);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [ranking.length]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setThumbsPerPage(5);
      else if (w < 1024) setThumbsPerPage(8);
      else setThumbsPerPage(10);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showcaseCardStyle: React.CSSProperties = {
    background: "#1A1A1A",
    border: "1px solid rgba(200,162,77,0.28)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
  };

  return (
    <section id="vote" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p
            className="text-sm tracking-widest uppercase mb-3"
            style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            Duta Wisata Batam 2026
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cinzel)",
              background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 700,
            }}
          >
            HIGHLIGHT FINALIS DAN JUARA
          </h2>
        </div>

        <>
          {showVoteSection ? (
            <>
                <div className="max-w-4xl mx-auto mb-8 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-4"
                  style={{
                    background: "rgba(200,162,77,0.08)",
                    border: "1px solid rgba(200,162,77,0.2)",
                  }}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Radio size={16} style={{ color: "#C8A24D", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#D6D6D6", fontFamily: "var(--font-poppins)" }}>
                        Vote favorit pada section ini dipusatkan ke postingan resmi Instagram <strong style={{ color: "#F5D06F" }}>{OFFICIAL_ACCOUNT}</strong>. Jumlah like favorit Encik dan Puan di bawah diupdate manual oleh admin.
                      </p>
                      <p className="text-[11px] sm:text-xs mt-2" style={{ color: "#A9A9A9", fontFamily: "var(--font-poppins)" }}>
                        Pembaruan data terakhir: {lastSyncedAt}
                      </p>
                    </div>
                  </div>

                  <a
                    href={OFFICIAL_ACCOUNT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                      color: "#0F0F0F",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    <Instagram size={15} /> Buka IG Resmi
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-7">
                  {showcaseItems.map((item, idx) => {
                    const isCenter =
                      showcaseItems.length === 3
                        ? idx === 1
                        : idx === 0;
                    const officialPostUrl =
                      voteMetaByParticipantId.get(item.id)?.instagramPostUrl ||
                      `${OFFICIAL_ACCOUNT_URL}/p/${item.id.toLowerCase()}-demo/`;
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className="relative overflow-hidden rounded-[28px] text-left transition-transform duration-300"
                        style={{
                          ...showcaseCardStyle,
                          transform: isCenter ? "scale(1)" : "scale(0.94)",
                          opacity: isCenter ? 1 : 0.8,
                        }}
                      >
                        <div className={isCenter ? "h-[420px]" : "h-[360px]"}>
                          <img src={item.photo} alt={item.name} className="w-full h-full object-cover object-top" />
                        </div>
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.78) 86%, rgba(0,0,0,0.92) 100%)",
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p style={{ color: "#F5E6C8", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>
                            {item.name}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
                          >
                            {item.number} | {item.gender}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <a
                              href={officialPostUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                              style={{
                                background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                                color: "#0F0F0F",
                                fontFamily: "var(--font-poppins)",
                                fontWeight: 600,
                              }}
                            >
                              <Instagram size={12} />
                              Vote IG Resmi
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-3 mb-7">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(200,162,77,0.12)", color: "#C8A24D" }}
                    aria-label="Sebelumnya"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <GoldButton variant="primary" size="sm" onClick={() => window.location.assign("/vote")}>
                    Selengkapnya
                  </GoldButton>

                  <button
                    type="button"
                    onClick={goNext}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(200,162,77,0.12)", color: "#C8A24D" }}
                    aria-label="Berikutnya"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="mb-12">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={goPrevThumbPage}
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(200,162,77,0.12)", color: "#C8A24D" }}
                      aria-label="Slide foto sebelumnya"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div
                      className="grid gap-3 flex-1"
                      style={{
                        gridTemplateColumns: `repeat(${thumbsPerPage}, minmax(0, 1fr))`,
                      }}
                    >
                      {visibleThumbs.map((item, indexOnPage) => {
                        const realIndex = thumbStart + indexOnPage;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveIndex(realIndex)}
                            className="relative overflow-hidden rounded-xl border transition-all duration-200"
                            style={{
                              borderColor:
                                realIndex === safeActive
                                  ? "rgba(200,162,77,0.8)"
                                  : "rgba(200,162,77,0.25)",
                              opacity: realIndex === safeActive ? 1 : 0.55,
                            }}
                            aria-label={`Pilih ${item.name}`}
                          >
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="w-full h-28 object-cover object-top"
                            />
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={goNextThumbPage}
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(200,162,77,0.12)", color: "#C8A24D" }}
                      aria-label="Slide foto berikutnya"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <p
                    className="text-xs mt-3 text-center"
                    style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
                  >
                    Slide {safeThumbPage + 1} dari {totalThumbPages}
                  </p>
                </div>
            </>
          ) : (
            <div className="text-center py-14 rounded-2xl mb-8" style={showcaseCardStyle}>
              <Crown size={42} style={{ color: "#C8A24D", margin: "0 auto 12px", opacity: 0.7 }} />
              <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
                Vote favorit belum dipublikasikan oleh admin.
              </p>
            </div>
          )}

          <div className="grid xl:grid-cols-2 gap-5 mb-5">
            <RankingColumn
              title="Juara Encik Versi Juri"
              entries={showJuryEncikSection || showLegacyJurySection ? juryEncikRanking : []}
              mode="jury"
              isPublished={showJuryEncikSection || showLegacyJurySection}
              unpublishedMessage="Juara Encik versi juri belum dipublikasikan oleh admin."
              showJuryScore={
                showLegacyJurySection
                  ? judgeWinnerDisplayMode === "name_with_score"
                  : judgeEncikDisplayMode === "name_with_score"
              }
            />
            <RankingColumn
              title="Juara Puan Versi Juri"
              entries={showJuryPuanSection || showLegacyJurySection ? juryPuanRanking : []}
              mode="jury"
              isPublished={showJuryPuanSection || showLegacyJurySection}
              unpublishedMessage="Juara Puan versi juri belum dipublikasikan oleh admin."
              showJuryScore={
                showLegacyJurySection
                  ? judgeWinnerDisplayMode === "name_with_score"
                  : judgePuanDisplayMode === "name_with_score"
              }
            />
          </div>

          <div className="grid xl:grid-cols-2 gap-5">
            <RankingColumn
              title="Juara Vote Terbanyak Encik"
              entries={showVoteRankingSection && hasVoteData ? voteEncikRanking : []}
              mode="vote"
              isPublished={showVoteRankingSection}
              unpublishedMessage="Ranking vote Encik belum dipublikasikan oleh admin."
              officialLikesMap={officialLikesMap}
              lastSyncedAt={lastSyncedAt}
            />
            <RankingColumn
              title="Juara Vote Terbanyak Puan"
              entries={showVoteRankingSection && hasVoteData ? votePuanRanking : []}
              mode="vote"
              isPublished={showVoteRankingSection}
              unpublishedMessage="Ranking vote Puan belum dipublikasikan oleh admin."
              officialLikesMap={officialLikesMap}
              lastSyncedAt={lastSyncedAt}
            />
          </div>

          <div className="mt-5 text-center xl:text-left">
            <Link
              href="/vote"
              className="text-sm"
              style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
            >
              Lihat semua finalis di halaman Vote
            </Link>
          </div>
        </>
      </div>
    </section>
  );
}


