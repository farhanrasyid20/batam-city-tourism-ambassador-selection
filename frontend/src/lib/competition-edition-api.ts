"use client";

import { apiRequest } from "./api";

export type EditionStatus = "draft" | "registration_open" | "registration_closed" | "ongoing" | "completed" | "archived";

export type CompetitionEdition = {
  id: number;
  year: number;
  name: string;
  status: EditionStatus;
  is_active: boolean;
  registration_is_open: boolean;
  registration_start_at?: string | null;
  registration_end_at?: string | null;
  registration_reopened_at?: string | null;
  registration_reopen_reason?: string | null;
  counts?: { total: number; submitted: number; draft: number; encik: number; puan: number };
};

export type ParticipantEditionRegistration = {
  id: number;
  edition_id: number;
  user_id: number;
  status: "draft" | "submitted";
  submitted_at?: string | null;
};

export const fetchEditions = (token: string) =>
  apiRequest<{ data: CompetitionEdition[] }>("/super-admin/competition-editions", { token });

export const createEdition = (token: string, body: { year: number; name?: string }) =>
  apiRequest<{ message: string; data: CompetitionEdition }>("/super-admin/competition-editions", { method: "POST", token, body });

export const updateEdition = (token: string, id: number, body: Partial<CompetitionEdition>) =>
  apiRequest<{ message: string; data: CompetitionEdition }>(`/super-admin/competition-editions/${id}`, { method: "PATCH", token, body });

export type EditionRegistrationRow = {
  id: number; user_id: number; name: string; email: string; gender?: "Encik" | "Puan" | null;
  status: "draft" | "submitted"; selection_status?: string | null; audition_number?: string | null;
  participant_code?: string | null; submitted_at?: string | null;
};

export const fetchEditionRegistrations = (token: string, id: number) =>
  apiRequest<{ edition: CompetitionEdition; data: EditionRegistrationRow[] }>(`/super-admin/competition-editions/${id}/registrations`, { token });

export const fetchParticipantRegistration = (token: string) =>
  apiRequest<{ edition: CompetitionEdition | null; registration: ParticipantEditionRegistration | null }>("/participant/registration", { token });

export const startParticipantRegistration = (token: string) =>
  apiRequest<{ message: string; edition: CompetitionEdition; registration: ParticipantEditionRegistration }>("/participant/registration/start", { method: "POST", token });
