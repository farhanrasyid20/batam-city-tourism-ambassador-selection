"use client";

import { apiRequest } from "./api";
import type { Score } from "../data/mockData";

/**
 * Kontrak API skor juri untuk fetch dan submit nilai per stage.
 */
export type BackendJudgeScoreStage = "Audition" | "Camp" | "Grand Final";
export type BackendJudgeScoreType = "official" | "mentor_observation";

export type BackendJudgeScore = {
  id: number;
  participant_id: string;
  participant_name?: string | null;
  judge_user_id: number;
  judge_name?: string | null;
  stage: BackendJudgeScoreStage;
  score_type: BackendJudgeScoreType;
  score: Score;
  total_score: number;
  note?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BackendJudgeScoresResponse = {
  message: string;
  data: BackendJudgeScore[];
  total: number;
};

export type SubmitJudgeScorePayload = {
  participant_id: string;
  participant_name?: string;
  stage: BackendJudgeScoreStage;
  score_type?: BackendJudgeScoreType;
  judge_user_id?: number;
  score: Score;
  note?: string;
};

export type SubmitJudgeScoreResponse = {
  message: string;
  data: BackendJudgeScore;
};

/**
 * Mengambil daftar skor juri dengan filter opsional (stage/peserta/juri).
 */
export function fetchJudgeScores(
  token: string,
  params?: {
    stage?: BackendJudgeScoreStage;
    participant_id?: string;
    judge_user_id?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.stage) query.set("stage", params.stage);
  if (params?.participant_id) query.set("participant_id", params.participant_id);
  if (typeof params?.judge_user_id === "number") {
    query.set("judge_user_id", String(params.judge_user_id));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<BackendJudgeScoresResponse>(`/judge/scores${suffix}`, {
    method: "GET",
    token,
  });
}

/**
 * Mengirim skor juri untuk seorang peserta pada stage tertentu.
 */
export function submitJudgeScore(token: string, payload: SubmitJudgeScorePayload) {
  return apiRequest<SubmitJudgeScoreResponse>("/judge/scores", {
    method: "POST",
    token,
    body: payload,
  });
}
