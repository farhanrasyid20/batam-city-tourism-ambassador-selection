"use client";

import type { BackendAuthUser } from "./auth-api";

const PARTICIPANT_AUTH_STORAGE_KEY = "participant-auth-session";
const PARTICIPANT_PROFILE_SNAPSHOT_KEY = "participant-profile-snapshot";

/**
 * Struktur sesi autentikasi peserta yang disimpan pada localStorage.
 */
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

/**
 * Menyimpan sesi login peserta ke localStorage.
 */
export function saveParticipantAuthSession(session: ParticipantAuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PARTICIPANT_AUTH_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Membaca sesi login peserta dari localStorage dan memvalidasi masa berlakunya.
 */
export function getParticipantAuthSession(): ParticipantAuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PARTICIPANT_AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ParticipantAuthSession;
    const savedAt = new Date(parsed.savedAt).getTime();
    const ttlMinutes = Number(parsed.expiresInMinutes ?? 0);

    if (!Number.isFinite(savedAt) || !Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
      window.localStorage.removeItem(PARTICIPANT_AUTH_STORAGE_KEY);
      return null;
    }

    const expiresAt = savedAt + ttlMinutes * 60 * 1000;
    if (Date.now() >= expiresAt) {
      clearParticipantAuthSession();
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(PARTICIPANT_AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * Menghapus data sesi autentikasi peserta beserta snapshot profil terkait.
 */
export function clearParticipantAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PARTICIPANT_AUTH_STORAGE_KEY);
  window.localStorage.removeItem(PARTICIPANT_PROFILE_SNAPSHOT_KEY);
}

/**
 * Menyimpan snapshot profil peserta untuk fallback tampilan cepat.
 */
export function saveParticipantProfileSnapshot(snapshot: ParticipantProfileSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PARTICIPANT_PROFILE_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/**
 * Membaca snapshot profil peserta dari localStorage.
 */
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
