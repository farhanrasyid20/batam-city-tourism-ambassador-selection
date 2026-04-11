"use client";

/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */


import React from "react";
import Image from "next/image";
import { AlertTriangle, Clock3, Heart, Globe, Link as LinkIcon } from "lucide-react";
import GoldCard from "../../../../../components/dashboard/GoldCard";
import { useApp } from "../../../../../context/AppContext";
import type { Participant, StageStatus } from "../../../../../data/mockData";
import { getReadableApiError } from "../../../../../lib/api";
import {
  updateVoteCandidate,
  updateVotePublication,
  uploadVoteCandidatePhoto,
} from "../../../../../lib/auth-api";
import { getParticipantAuthSession } from "../../../../../lib/auth-storage";
import { resolveApiAssetUrl } from "../../../../../lib/api";
const LIKE_UPDATE_MIN_INTERVAL_HOURS = 24;

function parseNonNegativeIntInput(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
  return Number(normalized || "0");
}

function normalizeInstagram(raw: string) {
  const value = raw.trim();
  if (!value) {
    return {
      handle: "",
      profileUrl: "",
    };
  }

  const normalizedValue = value.replace(/^https?:\/\/www\./i, "https://");
  const isUrl = /^https?:\/\//i.test(normalizedValue);

  if (isUrl) {
    const withoutQuery = normalizedValue.split("?")[0].replace(/\/+$/, "");
    const handleSegment = withoutQuery.split("/").filter(Boolean).pop() ?? "";
    const handle = handleSegment.replace("@", "").trim();

    return {
      handle: handle ? `@${handle}` : "",
      profileUrl: normalizedValue,
    };
  }

  const handle = value.replace("@", "").trim();
  return {
    handle: handle ? `@${handle}` : "",
    profileUrl: handle ? `https://instagram.com/${handle}` : "",
  };
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getNickname(name: string) {
  const firstToken = name.trim().split(/\s+/)[0] ?? "";
  return toTitleCase(firstToken || name || "Peserta");
}

function getDisplayVoteName(gender: "Encik" | "Puan", fullName: string) {
  return `${gender} ${getNickname(fullName)}`.trim();
}

function normalizeParticipantCode(
  number: string,
  gender: "Encik" | "Puan",
  participantId: string
) {
  const cleanNumber = number.trim().toUpperCase();
  const explicitMatch = cleanNumber.match(/^(ECK|PUA)-(\d{1,4})$/i);
  if (explicitMatch) {
    let value = Number.parseInt(explicitMatch[2], 10);
    if (gender === "Encik" && value % 2 === 0) {
      value = value > 1 ? value - 1 : 1;
    }
    if (gender === "Puan" && value % 2 === 1) {
      value += 1;
    }
    const prefix = gender === "Encik" ? "ECK" : "PUA";
    return `${prefix}-${String(value).padStart(3, "0")}`;
  }

  const fallbackDigits = participantId.match(/(\d{1,4})$/)?.[1] ?? "0";
  let value = Number.parseInt(fallbackDigits, 10);
  if (!Number.isFinite(value) || value < 1) value = 1;
  if (gender === "Encik" && value % 2 === 0) value = value > 1 ? value - 1 : 1;
  if (gender === "Puan" && value % 2 === 1) value += 1;
  const padded = String(value).padStart(3, "0");
  return gender === "Encik" ? `ECK-${padded}` : `PUA-${padded}`;
}

function isManualUploadedPhoto(value?: string | null) {
  return Boolean((value ?? "").trim().startsWith("data:image"));
}

function isNonDefaultPhoto(value?: string | null) {
  const normalized = (value ?? "").trim();
  return Boolean(normalized) && normalized !== "/default-avatar.svg";
}

function mapParticipantToVoteCandidate(participant: Participant) {
  const instagram = normalizeInstagram(participant.instagram ?? "");
  const normalizedNumber = normalizeParticipantCode(participant.number, participant.gender, participant.id);
  const displayName = getDisplayVoteName(participant.gender, participant.name);
  return {
    id: `vc-${participant.id}`,
    participantId: participant.id,
    number: normalizedNumber,
    name: displayName,
    gender: participant.gender,
    education: participant.education,
    photo: participant.photo,
    instagramHandle: instagram.handle,
    instagramProfileUrl: instagram.profileUrl,
    instagramPostUrl: "",
    officialLikeCount: participant.likes ?? 0,
    likeUpdatedAt: null,
    enabled: false,
  };
}

function isPostAuditionStage(status?: StageStatus) {
  return ["Top20", "PreCamp", "Camp", "GrandFinal", "Winner"].includes(status ?? "Pending");
}

function sortByPriorityAndNumber(participants: Participant[]) {
  return [...participants].sort((a, b) => {
    const aPriority = isPostAuditionStage(a.status) ? 0 : 1;
    const bPriority = isPostAuditionStage(b.status) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.number.localeCompare(b.number, "id-ID");
  });
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

function pickTop20ByGender(participants: Participant[]) {
  const eligible = participants.filter((item) => isPostAuditionStage(item.status));
  const encik = sortByPriorityAndNumber(eligible.filter((item) => item.gender === "Encik")).slice(0, 10);
  const puan = sortByPriorityAndNumber(eligible.filter((item) => item.gender === "Puan")).slice(0, 10);
  return interleaveByCode([...encik, ...puan]);
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

export default function AdminVoteTopPage() {
  const {
    participantList,
    voteCandidateList,
    setVoteCandidateList,
    setVoteTopList,
    voteTopPublished,
    setVoteTopPublished,
    voteRankingPublished,
    setVoteRankingPublished,
  } = useApp();
  const [likeDraftById, setLikeDraftById] = React.useState<Record<string, string>>({});
  const [savingById, setSavingById] = React.useState<Record<string, boolean>>({});
  const [infoMessage, setInfoMessage] = React.useState<string>("");
  const token = React.useMemo(() => getParticipantAuthSession()?.token ?? "", []);
  const markNeedRepublish = React.useCallback(() => {
    setVoteTopPublished(false);
    setVoteRankingPublished(false);
  }, [setVoteTopPublished, setVoteRankingPublished]);
  const setSaving = React.useCallback((id: string, saving: boolean) => {
    setSavingById((prev) => ({ ...prev, [id]: saving }));
  }, []);

  const saveCandidateToBackend = React.useCallback(
    async (
      candidateId: string,
      participantId: string,
      payload: {
        instagram_profile_url?: string;
        instagram_post_url?: string;
        official_like_count?: number;
        is_enabled?: boolean;
      }
    ) => {
      if (!token) {
        throw new Error("Sesi admin tidak ditemukan. Silakan login ulang.");
      }
      const participantUserId = Number(participantId.replace("P_API_", ""));
      if (!Number.isFinite(participantUserId) || participantUserId <= 0) {
        throw new Error("ID peserta tidak valid.");
      }
      setSaving(candidateId, true);
      try {
        const response = await updateVoteCandidate(token, participantUserId, payload);
        setVoteCandidateList((prev) =>
          prev.map((item) =>
            item.id === candidateId
              ? {
                  ...item,
                  photo: response.data.publication_photo || item.photo,
                  instagramProfileUrl: response.data.instagram_profile_url ?? item.instagramProfileUrl,
                  instagramPostUrl: response.data.instagram_post_url ?? item.instagramPostUrl,
                  officialLikeCount:
                    typeof response.data.official_like_count === "number"
                      ? response.data.official_like_count
                      : item.officialLikeCount,
                  likeUpdatedAt: response.data.like_updated_at ?? item.likeUpdatedAt,
                  enabled:
                    typeof response.data.is_enabled === "boolean"
                      ? response.data.is_enabled
                      : item.enabled,
                }
              : item
          )
        );
        markNeedRepublish();
      } finally {
        setSaving(candidateId, false);
      }
    },
    [markNeedRepublish, setSaving, setVoteCandidateList, token]
  );

  React.useEffect(() => {
    setLikeDraftById((prev) => {
      const next: Record<string, string> = { ...prev };
      const ids = new Set(voteCandidateList.map((item) => item.id));
      let changed = false;

      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      });

      voteCandidateList.forEach((candidate) => {
        if (next[candidate.id] === undefined) {
          next[candidate.id] = String(
            parseNonNegativeIntInput(String(candidate.officialLikeCount ?? 0))
          );
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [voteCandidateList]);

  React.useEffect(() => {
    if (!participantList.length) return;

    setVoteCandidateList((prev) => {
      const selectedPool = pickTop20ByGender(participantList);
      const existingByParticipantId = new Map(prev.map((item) => [item.participantId, item] as const));
      const next = selectedPool.map((participant) => {
        const existing = existingByParticipantId.get(participant.id);
        if (!existing) {
          return mapParticipantToVoteCandidate(participant);
        }

        const normalizedInstagramHandle = existing.instagramHandle?.trim();
        const normalizedInstagramProfileUrl = existing.instagramProfileUrl?.trim();
        const fallbackInstagram = normalizeInstagram(participant.instagram ?? "");
        const normalizedNumber = normalizeParticipantCode(participant.number, participant.gender, participant.id);
        const displayName = getDisplayVoteName(participant.gender, participant.name);

        return {
          ...existing,
          number: normalizedNumber,
          name: displayName,
          gender: participant.gender,
          education: participant.education,
          photo:
            isManualUploadedPhoto(existing.photo) || isNonDefaultPhoto(existing.photo)
              ? existing.photo
              : participant.photo || existing.photo || "/default-avatar.svg",
          instagramHandle: normalizedInstagramHandle || fallbackInstagram.handle,
          instagramProfileUrl: normalizedInstagramProfileUrl || fallbackInstagram.profileUrl,
        };
      });

      const changed =
        prev.length !== next.length ||
        prev.some((item, index) => {
          const target = next[index];
          if (!target) return true;
          return (
            item.participantId !== target.participantId ||
            item.number !== target.number ||
            item.name !== target.name ||
            item.gender !== target.gender
          );
        });

      return changed ? next : prev;
    });
  }, [participantList, setVoteCandidateList]);

  const sortedCandidates = React.useMemo(
    () => interleaveByCode(voteCandidateList),
    [voteCandidateList]
  );

  const [now] = React.useState(() => Date.now());
  const staleCandidates = voteCandidateList.filter((candidate) => {
    if (!candidate.enabled) return false;
    if (!candidate.likeUpdatedAt) return true;
    const updatedAt = new Date(candidate.likeUpdatedAt).getTime();
    if (Number.isNaN(updatedAt)) return true;
    return now - updatedAt >= LIKE_UPDATE_MIN_INTERVAL_HOURS * 60 * 60 * 1000;
  });

  const updateCandidateField = (
    id: string,
    key: "instagramProfileUrl" | "instagramPostUrl" | "instagramHandle",
    value: string
  ) => {
    setVoteCandidateList((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const updateCandidatePhoto = async (id: string, file: File | null) => {
    if (!file) return;
    const candidate = voteCandidateList.find((item) => item.id === id);
    if (!candidate) return;
    if (!token) {
      setInfoMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }
    const participantUserId = Number(candidate.participantId.replace("P_API_", ""));
    if (!Number.isFinite(participantUserId) || participantUserId <= 0) {
      setInfoMessage("ID peserta tidak valid.");
      return;
    }
    setSaving(id, true);
    try {
      const response = await uploadVoteCandidatePhoto(token, participantUserId, file);
      setVoteCandidateList((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                photo: response.data.publication_photo || item.photo,
              }
            : item
        )
      );
      markNeedRepublish();
      setInfoMessage(`Foto ${candidate.name} berhasil disimpan.`);
    } catch (error) {
      setInfoMessage(getReadableApiError(error));
    } finally {
      setSaving(id, false);
    }
  };

  const autoTopThree = React.useMemo(
    () =>
      voteCandidateList
      .filter((item) => item.enabled)
      .sort((a, b) => b.officialLikeCount - a.officialLikeCount)
      .slice(0, 3)
      .map((candidate, index) => ({
        id: `vt-${index + 1}`,
        participantId: candidate.participantId,
        number: candidate.number,
        name: candidate.name,
        gender: candidate.gender,
        photo: candidate.photo,
        instagramHandle: candidate.instagramHandle,
        instagramProfileUrl: candidate.instagramProfileUrl,
        instagramPostUrl: candidate.instagramPostUrl,
        voteCount: candidate.officialLikeCount,
        rank: (index + 1) as 1 | 2 | 3,
      })),
    [voteCandidateList]
  );

  const autoTopEncik = React.useMemo(
    () =>
      voteCandidateList
        .filter((item) => item.enabled && item.gender === "Encik")
        .sort((a, b) => b.officialLikeCount - a.officialLikeCount)
        .slice(0, 3),
    [voteCandidateList]
  );

  const autoTopPuan = React.useMemo(
    () =>
      voteCandidateList
        .filter((item) => item.enabled && item.gender === "Puan")
        .sort((a, b) => b.officialLikeCount - a.officialLikeCount)
        .slice(0, 3),
    [voteCandidateList]
  );

  React.useEffect(() => {
    setVoteTopList((prev) => {
      const changed =
        prev.length !== autoTopThree.length ||
        prev.some((item, index) => {
          const target = autoTopThree[index];
          if (!target) return true;
          return (
            item.participantId !== target.participantId ||
            item.voteCount !== target.voteCount ||
            item.rank !== target.rank
          );
        });

      return changed ? autoTopThree : prev;
    });
  }, [autoTopThree, setVoteTopList]);

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-cinzel)", color: "#D4AF37", fontSize: "1.5rem", fontWeight: 700 }}>
          Vote Terbanyak
        </h1>
        <p className="text-sm mt-1" style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}>
          Input manual vote Instagram dan publikasi ranking vote terbanyak.
        </p>
      </div>

      <GoldCard glow className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Status Publikasi
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
              Aktifkan jika blok &quot;Vote Terbanyak&quot; ingin tampil di halaman publik.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!token) {
                setInfoMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
                return;
              }
              try {
                const next = !voteTopPublished;
                const response = await updateVotePublication(token, {
                  vote_top_published: next,
                  vote_ranking_published: voteRankingPublished,
                });
                setVoteTopPublished(response.data.vote_top_published);
                setVoteRankingPublished(response.data.vote_ranking_published);
                setInfoMessage(
                  response.data.vote_top_published
                    ? "Vote publik berhasil dipublikasikan."
                    : "Vote publik dinonaktifkan."
                );
              } catch (error) {
                setInfoMessage(getReadableApiError(error));
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: voteTopPublished ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${voteTopPublished ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
              color: voteTopPublished ? "#22c55e" : "#ef4444",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {voteTopPublished ? "Dipublikasikan" : "Belum Dipublikasikan"}
          </button>
        </div>
        {infoMessage ? (
          <p className="mt-2 text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
            {infoMessage}
          </p>
        ) : null}
      </GoldCard>

      <GoldCard glow className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Status Publikasi Ranking Vote
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
              Aktifkan jika blok &quot;Juara Vote Terbanyak&quot; ingin tampil di landing page publik.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!token) {
                setInfoMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
                return;
              }
              try {
                const next = !voteRankingPublished;
                const response = await updateVotePublication(token, {
                  vote_top_published: voteTopPublished,
                  vote_ranking_published: next,
                });
                setVoteTopPublished(response.data.vote_top_published);
                setVoteRankingPublished(response.data.vote_ranking_published);
                setInfoMessage(
                  response.data.vote_ranking_published
                    ? "Ranking vote berhasil dipublikasikan."
                    : "Ranking vote dinonaktifkan."
                );
              } catch (error) {
                setInfoMessage(getReadableApiError(error));
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: voteRankingPublished ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${voteRankingPublished ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
              color: voteRankingPublished ? "#22c55e" : "#ef4444",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {voteRankingPublished ? "Ranking Dipublikasikan" : "Ranking Belum Dipublikasikan"}
          </button>
        </div>
      </GoldCard>

      <GoldCard glow className="mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} style={{ color: "#f59e0b", marginTop: 2 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Reminder Update Like Instagram
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
              Minimal update like manual <strong>1x per hari</strong> (setiap {LIKE_UPDATE_MIN_INTERVAL_HOURS} jam).
              Kandidat yang belum update akan ditandai di bawah.
            </p>
            <p className="text-xs mt-2" style={{ color: staleCandidates.length > 0 ? "#f59e0b" : "#22c55e", fontFamily: "var(--font-poppins)" }}>
              {staleCandidates.length > 0
                ? `${staleCandidates.length} kandidat perlu update like hari ini.`
                : "Semua kandidat sudah di-update dalam 24 jam terakhir."}
            </p>
          </div>
        </div>
      </GoldCard>

      <GoldCard className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
            Kandidat Voting Instagram
          </h3>
          <p className="text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
            Top 3 vote otomatis dihitung dari Like IG Resmi tertinggi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sortedCandidates.map((candidate) => {
            const candidatePhoto = resolveDisplayPhoto(candidate.photo);

            return (
            <div key={candidate.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.16)" }}>
              <div className="flex items-start gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(212,175,55,0.28)" }}>
                  <Image src={candidatePhoto} alt={candidate.name} fill unoptimized className="object-cover object-top" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                    {candidate.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                    {candidate.number} - {candidate.gender}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-[11px]" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                  Ubah Foto Publikasi
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-xs px-3 py-2 rounded-lg"
                  style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#D1D5DB" }}
                  onChange={(event) => updateCandidatePhoto(candidate.id, event.target.files?.[0] ?? null)}
                />
                <p className="text-[11px]" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                  {savingById[candidate.id] ? "Menyimpan foto..." : "Foto tersimpan ke backend. Publish ulang untuk tampil di publik."}
                </p>
              </div>

              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-[11px] flex items-center gap-1" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                    <Globe size={11} /> Link IG Peserta
                  </label>
                  <input
                    type="text"
                    value={candidate.instagramProfileUrl}
                    onChange={(event) => updateCandidateField(candidate.id, "instagramProfileUrl", event.target.value)}
                    placeholder="https://instagram.com/username"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
                  />
                </div>
                <div>
                  <label className="text-[11px] flex items-center gap-1" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                    <LinkIcon size={11} /> Link Postingan Vote Duta Wisata
                  </label>
                  <input
                    type="text"
                    value={candidate.instagramPostUrl}
                    onChange={(event) => updateCandidateField(candidate.id, "instagramPostUrl", event.target.value)}
                    placeholder="https://instagram.com/p/xxxx"
                    className="w-full mt-1 px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    saveCandidateToBackend(candidate.id, candidate.participantId, {
                      instagram_profile_url: candidate.instagramProfileUrl,
                      instagram_post_url: candidate.instagramPostUrl,
                    })
                      .then(() => {
                        setInfoMessage(`Data ${candidate.name} berhasil disimpan.`);
                      })
                      .catch((error) => {
                        setInfoMessage(getReadableApiError(error));
                      });
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: "rgba(212,175,55,0.15)",
                    color: "#F5E6C8",
                    border: "1px solid rgba(212,175,55,0.35)",
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {savingById[candidate.id] ? "Menyimpan..." : "Simpan Data Kandidat"}
                </button>
              </div>

              <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.16)" }}>
                <label className="text-[11px] flex items-center gap-1" style={{ color: "#D4AF37", fontFamily: "var(--font-poppins)" }}>
                  <Heart size={11} /> Like IG Resmi (Manual)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={likeDraftById[candidate.id] ?? String(parseNonNegativeIntInput(String(candidate.officialLikeCount ?? 0)))}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/[^\d]/g, "");
                      const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
                      setLikeDraftById((prev) => ({ ...prev, [candidate.id]: normalized }));
                    }}
                    onWheel={(event) => event.currentTarget.blur()}
                    onFocus={(event) => event.currentTarget.select()}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "#111", border: "1px solid rgba(212,175,55,0.2)", color: "#F5E6C8" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsedLike = parseNonNegativeIntInput(likeDraftById[candidate.id] ?? "");
                      saveCandidateToBackend(candidate.id, candidate.participantId, {
                        official_like_count: parsedLike,
                      })
                        .then(() => {
                          setLikeDraftById((prev) => ({ ...prev, [candidate.id]: String(parsedLike) }));
                          setInfoMessage(`Like ${candidate.name} berhasil diupdate.`);
                        })
                        .catch((error) => {
                          setInfoMessage(getReadableApiError(error));
                        });
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      color: "#22c55e",
                      border: "1px solid rgba(34,197,94,0.35)",
                      fontFamily: "var(--font-poppins)",
                    }}
                  >
                    Simpan Update Like
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Clock3 size={12} style={{ color: "#9CA3AF" }} />
                  <p className="text-[11px]" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                    Terakhir update: {formatWibDateTime(candidate.likeUpdatedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <label className="text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                  Tampilkan di halaman vote
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextEnabled = !candidate.enabled;
                    saveCandidateToBackend(candidate.id, candidate.participantId, {
                      is_enabled: nextEnabled,
                    })
                      .then(() => {
                        setInfoMessage(
                          `${candidate.name} ${nextEnabled ? "ditampilkan" : "disembunyikan"} di halaman vote.`
                        );
                      })
                      .catch((error) => {
                        setInfoMessage(getReadableApiError(error));
                      });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: candidate.enabled ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: candidate.enabled ? "#22c55e" : "#ef4444",
                    border: `1px solid ${candidate.enabled ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                    fontFamily: "var(--font-poppins)",
                  }}
                >
                  {candidate.enabled ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </GoldCard>

      <GoldCard>
        <h3 className="text-sm font-bold mb-4" style={{ color: "#D4AF37", fontFamily: "var(--font-cinzel)" }}>
          Ranking Otomatis Vote Terbanyak
        </h3>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Juara Vote Terbanyak Encik
            </p>
            {autoTopEncik.map((item, index) => (
              <div key={`encik-${item.id}`} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.16)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                      {item.number} - {item.name}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                      Instagram: {item.instagramHandle || "@-"}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                    {item.officialLikeCount.toLocaleString("id-ID")} like
                  </div>
                </div>
              </div>
            ))}
            {autoTopEncik.length === 0 ? (
              <p className="text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Belum ada kandidat Encik yang aktif.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
              Juara Vote Terbanyak Puan
            </p>
            {autoTopPuan.map((item, index) => (
              <div key={`puan-${item.id}`} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.16)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                      {item.number} - {item.name}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                      Instagram: {item.instagramHandle || "@-"}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>
                    {item.officialLikeCount.toLocaleString("id-ID")} like
                  </div>
                </div>
              </div>
            ))}
            {autoTopPuan.length === 0 ? (
              <p className="text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
                Belum ada kandidat Puan yang aktif.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs" style={{ color: "#9CA3AF", fontFamily: "var(--font-poppins)" }}>
            Ranking ini update otomatis setelah admin menekan tombol <strong>Simpan Update Like</strong> pada kandidat.
          </p>
        </div>
      </GoldCard>
    </div>
  );
}

