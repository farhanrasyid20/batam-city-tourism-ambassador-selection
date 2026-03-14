"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown, Heart, Instagram, Radio } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { GoldButton } from "../ui/GoldButton";

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

type JuryPairConfig = {
  rank: number;
  encikId: string;
  puanId: string;
};

const OFFICIAL_ACCOUNT = "@dutawisatakotabatam";
const OFFICIAL_ACCOUNT_URL = "https://instagram.com/dutawisatakotabatam";
const syncSeedDelays = [0, 1, 0, 2, 1, 0, 3, 1, 0, 2, 1, 0];

const juryPairRankingConfig: JuryPairConfig[] = [
  { rank: 1, encikId: "P011", puanId: "P008" },
  { rank: 2, encikId: "P001", puanId: "P002" },
  { rank: 3, encikId: "P007", puanId: "P004" },
];

function formatLikes(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getOfficialPostUrl(participantId: string) {
  return `${OFFICIAL_ACCOUNT_URL}/p/${participantId.toLowerCase()}-demo/`;
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
}: {
  title: string;
  entries: RankedParticipant[];
  mode: "jury" | "vote";
  officialLikesMap?: Record<string, number>;
  lastSyncedAt?: string;
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
              Pembaruan data terakhir: {lastSyncedAt} WIB
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
        {entries.length > 0 ? (
          entries.map((entry, index) => {
            const winner = entry.participant;
            const voteCount = officialLikesMap?.[winner.id] ?? winner.likes ?? 0;
            const subtitle =
              mode === "jury"
                ? `${winner.number} | Peringkat pilihan juri`
                : `${winner.number} | ${formatLikes(voteCount)} like posting resmi`;

            return (
              <div
                key={`${mode}-${title}-${winner.id}`}
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

function PairParticipantCard({
  label,
  entry,
}: {
  label: "Encik" | "Puan";
  entry?: RankedParticipant;
}) {
  if (!entry) {
    return (
      <div
        className="rounded-2xl p-3"
        style={{
          background: "#1A1A1A",
          border: "1px dashed rgba(200,162,77,0.22)",
        }}
      >
        <p className="text-xs mb-2" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
          {label}
        </p>
        <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>Data belum tersedia.</p>
      </div>
    );
  }

  const winner = entry.participant;

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{
        background: "#1A1A1A",
        border: "1px solid rgba(200,162,77,0.16)",
      }}
    >
      <img
        src={winner.photo}
        alt={winner.name}
        className="w-12 h-12 rounded-xl object-cover object-top shrink-0"
        style={{ border: "1px solid rgba(200,162,77,0.28)" }}
      />

      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] uppercase tracking-[0.2em] mb-1"
          style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
        >
          {label}
        </p>
        <p
          className="truncate text-sm"
          style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
        >
          {winner.name}
        </p>
        <p
          className="text-[11px] mt-1"
          style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}
        >
          {winner.number} | Peringkat pilihan juri
        </p>
        <p
          className="text-[11px] mt-2"
          style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}
        >
          <Instagram size={12} className="inline mr-1" />
          {winner.instagram}
        </p>
      </div>
    </div>
  );
}

function JuryPairTable({
  pairRows,
}: {
  pairRows: Array<{ rank: number; encik?: RankedParticipant; puan?: RankedParticipant }>;
}) {
  return (
    <div
      className="rounded-[28px] p-5 sm:p-6"
      style={{
        background: "#111111",
        border: "1px solid rgba(200,162,77,0.36)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.34)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.28em] mb-2"
            style={{ color: "rgba(200,162,77,0.78)", fontFamily: "var(--font-poppins)" }}
          >
            Pasangan Pilihan Juri
          </p>
          <h3
            className="text-lg sm:text-xl leading-tight"
            style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
          >
            Juara Encik dan Puan Versi Juri
          </h3>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "rgba(200,162,77,0.14)",
            border: "1px solid rgba(200,162,77,0.24)",
            color: "#F5D06F",
          }}
        >
          <Crown size={18} />
        </div>
      </div>

      <div className="grid gap-3">
        {pairRows.map((row) => (
          <div
            key={row.rank}
            className="rounded-[24px] p-3 sm:p-4"
            style={{
              background: "#141414",
              border:
                row.rank === 1
                  ? "1px solid rgba(200,162,77,0.32)"
                  : "1px solid rgba(200,162,77,0.14)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background:
                    row.rank === 1
                      ? "linear-gradient(135deg, #F7DF95, #C8A24D)"
                      : "rgba(200,162,77,0.16)",
                  color: row.rank === 1 ? "#0F0F0F" : "#F5D06F",
                  fontFamily: "var(--font-cinzel)",
                }}
              >
                {row.rank}
              </div>
              <p
                className="text-sm"
                style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
              >
                Pasangan Peringkat {row.rank}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <PairParticipantCard label="Encik" entry={row.encik} />
              <PairParticipantCard label="Puan" entry={row.puan} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VoteHighlightSection() {
  const { participantList, scoreList } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbPage, setThumbPage] = useState(0);
  const [thumbsPerPage, setThumbsPerPage] = useState(10);

  const finalists = useMemo(() => {
    const getDisplayOrder = (photoPath: string, fallbackNumber: string) => {
      const photoMatch = photoPath.match(/\/(\d+)\.(jpg|jpeg|png|webp)$/i);
      if (photoMatch) return Number.parseInt(photoMatch[1], 10);

      const numberMatch = fallbackNumber.match(/(\d+)$/);
      if (numberMatch) return Number.parseInt(numberMatch[1], 10);

      return Number.MAX_SAFE_INTEGER;
    };

    return participantList
      .filter((p) => p.status === "GrandFinal" || p.status === "Winner")
      .sort((a, b) => getDisplayOrder(a.photo, a.number) - getDisplayOrder(b.photo, b.number));
  }, [participantList]);

  const ranking = finalists;
  const hasData = ranking.length > 0;
  const safeActive = modulo(activeIndex, ranking.length);
  const totalThumbPages = Math.max(1, Math.ceil(ranking.length / thumbsPerPage));
  const safeThumbPage = modulo(thumbPage, totalThumbPages);
  const thumbStart = safeThumbPage * thumbsPerPage;
  const visibleThumbs = ranking.slice(thumbStart, thumbStart + thumbsPerPage);

  const center = ranking[safeActive];
  const left = ranking[modulo(safeActive - 1, ranking.length)];
  const right = ranking[modulo(safeActive + 1, ranking.length)];

  const initialLikeMap = useMemo(() => {
    return Object.fromEntries(
      finalists.map((participant, index) => {
        const baseLikes = participant.likes ?? 0;
        const seededLikes = baseLikes + (syncSeedDelays[index % syncSeedDelays.length] ?? 0);
        return [participant.id, seededLikes];
      })
    ) as Record<string, number>;
  }, [finalists]);

  const [officialLikesMap, setOfficialLikesMap] = useState<Record<string, number>>(initialLikeMap);
  const [lastSyncedAt, setLastSyncedAt] = useState(() =>
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  useEffect(() => {
    setOfficialLikesMap(initialLikeMap);
    setLastSyncedAt(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [initialLikeMap]);

  useEffect(() => {
    if (finalists.length === 0) return;

    const intervalId = window.setInterval(() => {
      setOfficialLikesMap((prev) => {
        const next = { ...prev };
        const candidate = finalists[Math.floor(Math.random() * finalists.length)];
        const increment = Math.floor(Math.random() * 4) + 1;
        next[candidate.id] = (next[candidate.id] ?? 0) + increment;
        return next;
      });

      setLastSyncedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [finalists]);

  const juryAverageMap = useMemo(() => {
    const finalistsById = new Set(finalists.map((p) => p.id));
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
      finalists.map((participant) => {
        const aggregate = aggregateMap.get(participant.id);
        const avg = aggregate ? aggregate.total / aggregate.count : null;
        return [participant.id, avg] as const;
      })
    );
  }, [finalists, scoreList]);

  const rankedById = useMemo(() => {
    return new Map(
      buildRankEntries(finalists, juryAverageMap, "jury").map((entry) => [entry.participant.id, entry] as const)
    );
  }, [finalists, juryAverageMap]);

  const juryEncikRanking = useMemo(
    () => buildRankEntries(finalists.filter((p) => p.gender === "Encik"), juryAverageMap, "jury").slice(0, 3),
    [finalists, juryAverageMap]
  );

  const juryPuanRanking = useMemo(
    () => buildRankEntries(finalists.filter((p) => p.gender === "Puan"), juryAverageMap, "jury").slice(0, 3),
    [finalists, juryAverageMap]
  );

  const juryPairRows = useMemo(() => {
    return juryPairRankingConfig.map((row) => ({
      rank: row.rank,
      encik: rankedById.get(row.encikId),
      puan: rankedById.get(row.puanId),
    }));
  }, [rankedById]);

  const voteEncikRanking = useMemo(
    () =>
      buildRankEntries(finalists.filter((p) => p.gender === "Encik"), juryAverageMap, "vote", officialLikesMap).slice(0, 3),
    [finalists, juryAverageMap, officialLikesMap]
  );

  const votePuanRanking = useMemo(
    () =>
      buildRankEntries(finalists.filter((p) => p.gender === "Puan"), juryAverageMap, "vote", officialLikesMap).slice(0, 3),
    [finalists, juryAverageMap, officialLikesMap]
  );

  const goPrev = () => setActiveIndex((prev) => prev - 1);
  const goNext = () => setActiveIndex((prev) => prev + 1);
  const goPrevThumbPage = () => setThumbPage((prev) => prev - 1);
  const goNextThumbPage = () => setThumbPage((prev) => prev + 1);

  useEffect(() => {
    if (ranking.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 3000);

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

  useEffect(() => {
    if (ranking.length === 0) return;
    const targetPage = Math.floor(safeActive / thumbsPerPage);
    setThumbPage(targetPage);
  }, [safeActive, ranking.length, thumbsPerPage]);

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

        {!hasData ? (
          <div className="text-center py-14 rounded-2xl" style={showcaseCardStyle}>
            <Crown size={42} style={{ color: "#C8A24D", margin: "0 auto 12px", opacity: 0.7 }} />
            <p style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
              Data finalis belum tersedia.
            </p>
          </div>
        ) : (
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
                    Vote favorit pada section ini dipusatkan ke postingan resmi Instagram <strong style={{ color: "#F5D06F" }}>{OFFICIAL_ACCOUNT}</strong>. Jumlah like favorit Encik dan Puan di bawah ditampilkan sebagai pembaruan otomatis pada tampilan frontend.
                  </p>
                  <p className="text-[11px] sm:text-xs mt-2" style={{ color: "#A9A9A9", fontFamily: "var(--font-poppins)" }}>
                    Pembaruan data terakhir: {lastSyncedAt} WIB
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
              {[left, center, right].map((item, idx) => {
                const isCenter = idx === 1;
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
                          href={getOfficialPostUrl(item.id)}
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

            <div className="grid xl:grid-cols-2 gap-5 mb-5">
              <RankingColumn title="Juara Encik Versi Juri" entries={juryEncikRanking} mode="jury" />
              <RankingColumn title="Juara Puan Versi Juri" entries={juryPuanRanking} mode="jury" />
            </div>

            <div className="mb-5">
              <JuryPairTable pairRows={juryPairRows} />
            </div>

            <div className="grid xl:grid-cols-2 gap-5">
              <RankingColumn
                title="Juara Vote Terbanyak Encik"
                entries={voteEncikRanking}
                mode="vote"
                officialLikesMap={officialLikesMap}
                lastSyncedAt={lastSyncedAt}
              />
              <RankingColumn
                title="Juara Vote Terbanyak Puan"
                entries={votePuanRanking}
                mode="vote"
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
        )}
      </div>
    </section>
  );
}


