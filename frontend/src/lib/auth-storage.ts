"use client";

import type { BackendAuthUser } from "./auth-api";

const PARTICIPANT_AUTH_STORAGE_KEY = "participant-auth-session";

export type ParticipantAuthSession = {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  savedAt: string;
  user: BackendAuthUser;
};

export function saveParticipantAuthSession(session: ParticipantAuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PARTICIPANT_AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getParticipantAuthSession(): ParticipantAuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PARTICIPANT_AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ParticipantAuthSession;
  } catch {
    window.localStorage.removeItem(PARTICIPANT_AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearParticipantAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PARTICIPANT_AUTH_STORAGE_KEY);
}
