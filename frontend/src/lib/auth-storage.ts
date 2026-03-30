"use client";

import type { BackendAuthUser } from "./auth-api";

const PARTICIPANT_AUTH_STORAGE_KEY = "participant-auth-session";
const PARTICIPANT_PROFILE_SNAPSHOT_KEY = "participant-profile-snapshot";

export type ParticipantAuthSession = {
  token: string;
  tokenType: string;
  expiresInMinutes: number;
  savedAt: string;
  user: BackendAuthUser;
};

export type ParticipantProfileSnapshot = {
  id: string;
  email: string;
  name: string;
  number?: string;
  gender?: "Encik" | "Puan";
  phone?: string;
  photo?: string;
  updatedAt: string;
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
  window.localStorage.removeItem(PARTICIPANT_PROFILE_SNAPSHOT_KEY);
}

export function saveParticipantProfileSnapshot(snapshot: ParticipantProfileSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PARTICIPANT_PROFILE_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function getParticipantProfileSnapshot(): ParticipantProfileSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PARTICIPANT_PROFILE_SNAPSHOT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ParticipantProfileSnapshot;
  } catch {
    window.localStorage.removeItem(PARTICIPANT_PROFILE_SNAPSHOT_KEY);
    return null;
  }
}
