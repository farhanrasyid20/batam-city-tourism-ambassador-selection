"use client";

import { apiRequest } from "./api";

type StageSummary = {
  judges_count: number;
  judge_scores: number[];
  total: number;
  average: number;
};

export type JudgeScoreRecapItem = {
  participant_id: string;
  participant_number: string;
  participant_name: string;
  gender?: "Encik" | "Puan" | null;
  audition: StageSummary;
  camp: StageSummary;
  grand_final: StageSummary;
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
  };
  data: JudgeScoreRecapItem[];
  total: number;
};

export function fetchJudgeScoreRecap(
  token: string,
  params?: { gender?: "Encik" | "Puan" }
) {
  const query = new URLSearchParams();
  if (params?.gender) query.set("gender", params.gender);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<JudgeScoreRecapResponse>(`/judge/scores/recap${suffix}`, {
    method: "GET",
    token,
  });
}

