"use client";

import { apiRequest } from "./api";
import type { Score } from "../data/mockData";

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
  score: Score;
  note?: string;
};

export type SubmitJudgeScoreResponse = {
  message: string;
  data: BackendJudgeScore;
};

export function fetchJudgeScores(
  token: string,
  params?: { stage?: BackendJudgeScoreStage; participant_id?: string }
) {
  const query = new URLSearchParams();
  if (params?.stage) query.set("stage", params.stage);
  if (params?.participant_id) query.set("participant_id", params.participant_id);

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<BackendJudgeScoresResponse>(`/judge/scores${suffix}`, {
    method: "GET",
    token,
  });
}

export function submitJudgeScore(token: string, payload: SubmitJudgeScorePayload) {
  return apiRequest<SubmitJudgeScoreResponse>("/judge/scores", {
    method: "POST",
    token,
    body: payload,
  });
}

