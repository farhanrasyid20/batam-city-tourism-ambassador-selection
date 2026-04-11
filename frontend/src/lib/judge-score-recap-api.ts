"use client";

import { apiRequest } from "./api";

/**
 * API helper rekap skor juri dengan cache in-memory ringan.
 */
type StageSummary = {
  judges_count: number;
  judge_scores: number[];
  total: number;
  average: number;
};

type StageCriteriaAverage = Record<string, number>;

export type JudgeScoreRecapItem = {
  participant_id: string;
  participant_number: string;
  participant_name: string;
  gender?: "Encik" | "Puan" | null;
  audition: StageSummary;
  audition_criteria_average?: StageCriteriaAverage;
  camp: StageSummary;
  camp_criteria_average?: StageCriteriaAverage;
  grand_final: StageSummary;
  grand_final_criteria_average?: StageCriteriaAverage;
  audition_total: number;
  audition_average: number;
  camp_total: number;
  camp_average: number;
  grand_final_total: number;
  grand_final_average: number;
  camp_weighted_30: number;
  grand_final_weighted_70: number;
  final_score: number;
  audition_rank?: number | null;
  camp_rank?: number | null;
  grand_final_rank?: number | null;
  final_rank?: number | null;
};

export type JudgeScoreRecapResponse = {
  message: string;
  meta: {
    weights: {
      camp: number;
      grand_final: number;
    };
    max_judges: {
      audition: number;
      camp: number;
      grand_final: number;
    };
    criteria_keys?: {
      Audition?: string[];
      Camp?: string[];
      "Grand Final"?: string[];
    };
  };
  data: JudgeScoreRecapItem[];
  total: number;
};

type RecapCacheEnvelope = {
  ts: number;
  data: JudgeScoreRecapResponse;
};

const recapMemoryCache = new Map<string, RecapCacheEnvelope>();
const recapInFlight = new Map<string, Promise<JudgeScoreRecapResponse>>();
const DEFAULT_RECAP_CACHE_MAX_AGE_MS = 10000;

function isFresh(ts: number, maxAgeMs: number) {
  return Date.now() - ts <= maxAgeMs;
}

/**
 * Mengambil rekap skor juri per peserta dengan dukungan cache dan filter gender.
 */
export function fetchJudgeScoreRecap(
  token: string,
  params?: { gender?: "Encik" | "Puan"; force?: boolean; maxAgeMs?: number }
) {
  const query = new URLSearchParams();
  if (params?.gender) query.set("gender", params.gender);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const cacheKey = `${token}:${params?.gender ?? "all"}`;
  const maxAgeMs = params?.maxAgeMs ?? DEFAULT_RECAP_CACHE_MAX_AGE_MS;

  if (!params?.force) {
    const cached = recapMemoryCache.get(cacheKey);
    if (cached && isFresh(cached.ts, maxAgeMs)) {
      return Promise.resolve(cached.data);
    }
  }

  const inflight = recapInFlight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = apiRequest<JudgeScoreRecapResponse>(`/judge/scores/recap${suffix}`, {
    method: "GET",
    token,
  })
    .then((response) => {
      recapMemoryCache.set(cacheKey, { ts: Date.now(), data: response });
      return response;
    })
    .finally(() => {
      recapInFlight.delete(cacheKey);
    });

  recapInFlight.set(cacheKey, request);
  return request;
}
