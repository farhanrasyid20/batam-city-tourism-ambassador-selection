"use client";

import { apiRequest } from "./api";

export type BackendJudgeNoteStage =
  | "Technical Meeting"
  | "Audition"
  | "Pre Camp"
  | "Camp"
  | "Grand Final";

export type BackendJudgeNote = {
  id: number;
  participant_id: string;
  participant_name?: string | null;
  stage: BackendJudgeNoteStage;
  author_user_id: number;
  author_name?: string | null;
  author_avatar?: string | null;
  author_role: "judge" | "admin" | "committee";
  content: string;
  created_at: string;
};

export type BackendJudgeNotesResponse = {
  message: string;
  data: BackendJudgeNote[];
  total: number;
};

export type SubmitJudgeNotePayload = {
  participant_id: string;
  participant_name?: string;
  stage: BackendJudgeNoteStage;
  content: string;
  author_role?: "judge";
};

export type SubmitJudgeNoteResponse = {
  message: string;
  data: BackendJudgeNote;
};

export function fetchJudgeNotes(token: string, params?: { participant_id?: string; stage?: BackendJudgeNoteStage }) {
  const query = new URLSearchParams();
  if (params?.participant_id) query.set("participant_id", params.participant_id);
  if (params?.stage) query.set("stage", params.stage);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<BackendJudgeNotesResponse>(`/judge/notes${suffix}`, {
    method: "GET",
    token,
  });
}

export function submitJudgeNote(token: string, payload: SubmitJudgeNotePayload) {
  return apiRequest<SubmitJudgeNoteResponse>("/judge/notes", {
    method: "POST",
    token,
    body: payload,
  });
}
