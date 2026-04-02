"use client";

import { apiRequest } from "./api";

export type BackendAuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  account_status?: string;
  email_verified_at?: string | null;
};

export type ParticipantBiodata = {
  id: number;
  participant_number?: string | null;
  audition_number?: string | null;
  participant_code?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  gender?: "Encik" | "Puan" | null;
  nickname?: string | null;
  national_id?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  domicile_address?: string | null;
  ktp_address?: string | null;
  height_cm?: number | null;
  weight_kg?: string | null;
  shirt_size?: string | null;
  chest_circumference_cm?: string | null;
  waist_circumference_cm?: string | null;
  hip_circumference_cm?: string | null;
  pants_size?: string | null;
  shoe_size?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  parent_phone?: string | null;
  photo?: string | null;
  education_category?: "SMA" | "SMK" | "MA" | "Kuliah" | null;
  education_institution?: string | null;
  education_major?: string | null;
  education_degree?: string | null;
  occupation?: string | null;
  skills?: string | null;
  hobbies?: string | null;
  languages?: string | null;
  vision?: string | null;
  mission?: string | null;
  experience?: string | null;
  achievement?: string | null;
  intro_video_url?: string | null;
  agreement_no_agency?: "yes" | "no" | null;
  agency_name?: string | null;
  agreement_parent_permission?: "yes" | "no" | null;
  agreement_all_stages?: "yes" | "no" | null;
  motivation_statement?: string | null;
  contribution_idea?: string | null;
  public_speaking_experience?: string | null;
  account_status?: string;
  documents?: ParticipantDocumentMeta[] | null;
  submitted_to_admin?: boolean;
  submitted_to_admin_at?: string | null;
  selection_status?:
    | "Pending"
    | "Verified"
    | "TechnicalMeeting"
    | "Rejected"
    | "Audition"
    | "Top20"
    | "PreCamp"
    | "Camp"
    | "GrandFinal"
    | "Winner"
    | null;
  selection_status_note?: string | null;
  selection_status_updated_at?: string | null;
  eliminated_in_audition?: boolean;
  eliminated_at?: string | null;
};

export type ParticipantDocumentMeta = {
  key: string;
  label: string;
  required: boolean;
  status: "submitted" | "verified" | "revision_required" | "missing";
  original_name?: string;
  size_bytes?: number;
  mime_type?: string;
  path?: string;
  url?: string;
  uploaded_at?: string;
  note?: string | null;
};

export type ParticipantBiodataResponse = {
  message: string;
  data: ParticipantBiodata;
};

export type UpdateParticipantBiodataPayload = Partial<{
  name: string;
  phone: string;
  gender: "Encik" | "Puan";
  nickname: string;
  national_id: string;
  birth_place: string;
  birth_date: string;
  domicile_address: string;
  ktp_address: string;
  height_cm: number;
  weight_kg: string;
  shirt_size: string;
  chest_circumference_cm: string;
  waist_circumference_cm: string;
  hip_circumference_cm: string;
  pants_size: string;
  shoe_size: string;
  instagram: string;
  tiktok: string;
  parent_phone: string;
  photo: string;
  education_category: "SMA" | "SMK" | "MA" | "Kuliah";
  education_institution: string;
  education_major: string;
  education_degree: string;
  occupation: string;
  skills: string;
  hobbies: string;
  languages: string;
  vision: string;
  mission: string;
  experience: string;
  achievement: string;
  intro_video_url: string;
  agreement_no_agency: "yes" | "no";
  agency_name: string;
  agreement_parent_permission: "yes" | "no";
  agreement_all_stages: "yes" | "no";
  motivation_statement: string;
  contribution_idea: string;
  public_speaking_experience: string;
}>;

export type ParticipantDocumentsResponse = {
  message: string;
  data: {
    id: number;
    participant_number?: string | null;
    audition_number?: string | null;
    participant_code?: string | null;
    submitted_to_admin: boolean;
    submitted_to_admin_at?: string | null;
    eliminated_in_audition?: boolean;
    eliminated_at?: string | null;
    documents: ParticipantDocumentMeta[];
  };
};

export type RegisterParticipantPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

export type RegisterParticipantResponse = {
  message: string;
  user: BackendAuthUser;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export type VerifyOtpResponse = {
  message: string;
  user: BackendAuthUser;
};

export type ResendOtpPayload = {
  email: string;
};

export type ResendOtpResponse = {
  message: string;
  otp_expires_in_minutes: number;
  resend_available_in_seconds: number;
};

export type LoginParticipantPayload = {
  email: string;
  password: string;
};

export type LoginParticipantResponse = {
  message: string;
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: BackendAuthUser;
};

export type MeResponse = {
  user: BackendAuthUser;
};

export type ChangePasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export type ForgotPasswordRequestOtpPayload = {
  email: string;
};

export type ForgotPasswordRequestOtpResponse = {
  message: string;
  otp_expires_in_minutes: number;
  resend_available_in_seconds: number;
  retry_after_seconds?: number;
};

export type ForgotPasswordVerifyOtpPayload = {
  email: string;
  otp: string;
};

export type ForgotPasswordVerifyOtpResponse = {
  message: string;
  otp_expires_in_minutes: number;
};

export type ForgotPasswordResetPayload = {
  email: string;
  password: string;
  password_confirmation: string;
};

export type ForgotPasswordResetResponse = {
  message: string;
};

type CacheEnvelope<T> = {
  ts: number;
  data: T;
};

const BIODATA_CACHE_KEY = "participant:biodata:v1";
const DOCUMENTS_CACHE_KEY = "participant:documents:v1";
const DEFAULT_PARTICIPANT_CACHE_MAX_AGE_MS = 8000;

const memoryCache = new Map<string, CacheEnvelope<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function readCached<T>(key: string): CacheEnvelope<T> | null {
  const memoryHit = memoryCache.get(key) as CacheEnvelope<T> | undefined;
  if (memoryHit) return memoryHit;

  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.ts !== "number" || parsed.data === undefined) return null;
    memoryCache.set(key, parsed as CacheEnvelope<unknown>);
    return parsed;
  } catch {
    return null;
  }
}

function writeCached<T>(key: string, data: T): void {
  const envelope: CacheEnvelope<T> = {
    ts: Date.now(),
    data,
  };
  memoryCache.set(key, envelope as CacheEnvelope<unknown>);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // ignore storage quota / private mode failure
  }
}

function isFresh(envelope: CacheEnvelope<unknown>, maxAgeMs: number): boolean {
  return Date.now() - envelope.ts <= maxAgeMs;
}

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean; maxAgeMs?: number }
): Promise<T> {
  const force = Boolean(options?.force);
  const maxAgeMs = options?.maxAgeMs ?? DEFAULT_PARTICIPANT_CACHE_MAX_AGE_MS;

  if (!force) {
    const cached = readCached<T>(key);
    if (cached && isFresh(cached as CacheEnvelope<unknown>, maxAgeMs)) {
      return cached.data;
    }
  }

  const inflight = inFlightRequests.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const request = fetcher()
    .then((result) => {
      writeCached(key, result);
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request as Promise<unknown>);
  return request;
}

export function registerParticipant(payload: RegisterParticipantPayload) {
  return apiRequest<RegisterParticipantResponse>("/register", {
    method: "POST",
    body: payload,
  });
}

export function verifyParticipantOtp(payload: VerifyOtpPayload) {
  return apiRequest<VerifyOtpResponse>("/verify-otp", {
    method: "POST",
    body: payload,
  });
}

export function resendParticipantOtp(payload: ResendOtpPayload) {
  return apiRequest<ResendOtpResponse>("/resend-otp", {
    method: "POST",
    body: payload,
  });
}

export function loginParticipant(payload: LoginParticipantPayload) {
  return apiRequest<LoginParticipantResponse>("/login", {
    method: "POST",
    body: payload,
  });
}

export function fetchAuthenticatedParticipant(token: string) {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    token,
  });
}

export function fetchParticipantBiodata(
  token: string,
  options?: { force?: boolean; maxAgeMs?: number }
) {
  return fetchWithCache<ParticipantBiodataResponse>(
    BIODATA_CACHE_KEY,
    () =>
      apiRequest<ParticipantBiodataResponse>("/participant/biodata", {
        method: "GET",
        token,
      }),
    options
  );
}

export function updateParticipantBiodata(token: string, payload: UpdateParticipantBiodataPayload) {
  return apiRequest<ParticipantBiodataResponse>("/participant/biodata", {
    method: "PUT",
    token,
    body: payload,
  }).then((response) => {
    writeCached(BIODATA_CACHE_KEY, response);
    return response;
  });
}

export function fetchParticipantDocuments(
  token: string,
  options?: { force?: boolean; maxAgeMs?: number }
) {
  return fetchWithCache<ParticipantDocumentsResponse>(
    DOCUMENTS_CACHE_KEY,
    () =>
      apiRequest<ParticipantDocumentsResponse>("/participant/documents", {
        method: "GET",
        token,
      }),
    options
  );
}

export function uploadParticipantDocument(token: string, documentKey: string, file: File) {
  const body = new FormData();
  body.append("document_key", documentKey);
  body.append("file", file);

  return apiRequest<ParticipantDocumentsResponse>("/participant/documents/upload", {
    method: "POST",
    token,
    body,
  }).then((response) => {
    writeCached(DOCUMENTS_CACHE_KEY, response);
    return response;
  });
}

export function submitParticipantDocuments(token: string) {
  return apiRequest<ParticipantDocumentsResponse>("/participant/documents/submit", {
    method: "POST",
    token,
  }).then((response) => {
    writeCached(DOCUMENTS_CACHE_KEY, response);
    return response;
  });
}

export function changeAuthenticatedPassword(token: string, payload: ChangePasswordPayload) {
  return apiRequest<ChangePasswordResponse>("/auth/change-password", {
    method: "POST",
    token,
    body: payload,
  });
}

export function requestForgotPasswordOtp(payload: ForgotPasswordRequestOtpPayload) {
  return apiRequest<ForgotPasswordRequestOtpResponse>("/forgot-password/request-otp", {
    method: "POST",
    body: payload,
  });
}

export function verifyForgotPasswordOtp(payload: ForgotPasswordVerifyOtpPayload) {
  return apiRequest<ForgotPasswordVerifyOtpResponse>("/forgot-password/verify-otp", {
    method: "POST",
    body: payload,
  });
}

export function resetForgotPassword(payload: ForgotPasswordResetPayload) {
  return apiRequest<ForgotPasswordResetResponse>("/forgot-password/reset", {
    method: "POST",
    body: payload,
  });
}
