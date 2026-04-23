"use client";

import { apiRequest } from "./api";

/**
 * Modul kontrak dan helper API autentikasi, profil peserta, konten publik,
 * serta endpoint admin/super-admin.
 */
export type BackendAuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  account_status?: string;
  email_verified_at?: string | null;
  judge_assigned_stages?: Array<"Audition" | "Pre Camp" | "Camp" | "Grand Final"> | null;
  judge_type?: "judge" | "committee" | "mentor" | "camp_team" | null;
  judge_title?: string | null;
  judge_organization?: string | null;
  judge_avatar?: string | null;
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
  religion?: string | null;
  national_id?: string | null;
  current_status?: string | null;
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
  father_name?: string | null;
  mother_name?: string | null;
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
  religion: string;
  national_id: string;
  current_status: string;
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
  father_name: string;
  mother_name: string;
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
  gender: "Encik" | "Puan";
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

export type JudgeParticipantListItem = {
  id: number;
  name: string;
  nickname?: string | null;
  religion?: string | null;
  email: string;
  phone?: string | null;
  national_id?: string | null;
  current_status?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  domicile_address?: string | null;
  ktp_address?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  parent_phone?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  registered_at?: string | null;
  participant_number?: string | null;
  audition_number?: string | null;
  participant_code?: string | null;
  gender?: "Encik" | "Puan" | null;
  height_cm?: number | null;
  weight_kg?: string | number | null;
  shirt_size?: string | null;
  chest_circumference_cm?: string | number | null;
  waist_circumference_cm?: string | number | null;
  hip_circumference_cm?: string | number | null;
  pants_size?: string | null;
  shoe_size?: string | null;
  photo?: string | null;
  education_category?: "SMA" | "SMK" | "MA" | "Kuliah" | null;
  education_institution?: string | null;
  education_degree?: string | null;
  education_major?: string | null;
  occupation?: string | null;
  skills?: string | null;
  hobbies?: string | null;
  languages?: string | null;
  vision?: string | null;
  mission?: string | null;
  experience?: string | null;
  achievement?: string | null;
  agreement_no_agency?: "yes" | "no" | null;
  agency_name?: string | null;
  agreement_parent_permission?: "yes" | "no" | null;
  agreement_all_stages?: "yes" | "no" | null;
  motivation_statement?: string | null;
  contribution_idea?: string | null;
  public_speaking_experience?: string | null;
  documents?: ParticipantDocumentMeta[];
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
  selection_stage?:
    | "Verification"
    | "Technical Meeting"
    | "Audition"
    | "Pre Camp"
    | "Camp"
    | "Grand Final"
    | "Final Result"
    | null;
  eliminated_in_audition?: boolean;
  eliminated_at?: string | null;
  submitted_to_admin?: boolean;
  submitted_to_admin_at?: string | null;
};

export type JudgeParticipantsResponse = {
  message: string;
  data: JudgeParticipantListItem[];
  total: number;
};

export type PublicFinalistListItem = {
  id: number;
  name: string;
  participant_number?: string | null;
  audition_number?: string | null;
  participant_code?: string | null;
  gender?: "Encik" | "Puan" | null;
  photo?: string | null;
  instagram?: string | null;
  education_category?: "SMA" | "SMK" | "MA" | "Kuliah" | null;
  education_institution?: string | null;
  education_degree?: string | null;
  education_major?: string | null;
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
  vote_instagram_profile_url?: string | null;
  vote_instagram_post_url?: string | null;
  vote_official_like_count?: number | null;
  vote_like_updated_at?: string | null;
  vote_is_enabled?: boolean | null;
};

export type PublicFinalistsResponse = {
  message: string;
  data: PublicFinalistListItem[];
  total: number;
  vote_top_published?: boolean;
  vote_ranking_published?: boolean;
  judge_encik_published?: boolean;
  judge_puan_published?: boolean;
  judge_pair_published?: boolean;
  judge_encik_display_mode?: "name_only" | "name_with_score";
  judge_puan_display_mode?: "name_only" | "name_with_score";
  judge_encik_winners?: Array<Record<string, unknown>>;
  judge_puan_winners?: Array<Record<string, unknown>>;
  judge_pair_rankings?: Array<Record<string, unknown>>;
};

export type UpdateVotePublicationPayload = {
  vote_top_published?: boolean;
  vote_ranking_published?: boolean;
};

export type UpdateVotePublicationResponse = {
  message: string;
  data: {
    vote_top_published: boolean;
    vote_ranking_published: boolean;
  };
};

export type UpdateVoteCandidatePayload = Partial<{
  instagram_profile_url: string;
  instagram_post_url: string;
  official_like_count: number;
  is_enabled: boolean;
}>;

export type UpdateVoteCandidateResponse = {
  message: string;
  data: {
    participant_user_id: number;
    publication_photo?: string | null;
    instagram_profile_url?: string | null;
    instagram_post_url?: string | null;
    official_like_count?: number;
    like_updated_at?: string | null;
    is_enabled?: boolean;
  };
};

export type UpdateJuryWinnersPayload = Partial<{
  judge_encik_display_mode: "name_only" | "name_with_score";
  judge_puan_display_mode: "name_only" | "name_with_score";
  judge_encik_winners: Array<Record<string, unknown>>;
  judge_puan_winners: Array<Record<string, unknown>>;
  judge_pair_rankings: Array<Record<string, unknown>>;
  judge_encik_published: boolean;
  judge_puan_published: boolean;
  judge_pair_published: boolean;
}>;

export type UpdateJuryWinnersResponse = {
  message: string;
  data: {
    judge_encik_display_mode: "name_only" | "name_with_score";
    judge_puan_display_mode: "name_only" | "name_with_score";
    judge_encik_winners: Array<Record<string, unknown>>;
    judge_puan_winners: Array<Record<string, unknown>>;
    judge_pair_rankings: Array<Record<string, unknown>>;
    judge_encik_published: boolean;
    judge_puan_published: boolean;
    judge_pair_published: boolean;
  };
};

export type UpdateParticipantDocumentReviewsPayload = {
  documents: Array<{
    key: string;
    status: "submitted" | "revision_required" | "verified" | "missing";
    note?: string | null;
  }>;
};

export type UpdateParticipantDocumentReviewsResponse = {
  message: string;
  data: {
    user_id: number;
    documents: ParticipantDocumentMeta[];
  };
};

export type UpdateParticipantSelectionStatusPayload = {
  selection_status:
    | "Pending"
    | "Verified"
    | "TechnicalMeeting"
    | "Rejected"
    | "Audition"
    | "Top20"
    | "PreCamp"
    | "Camp"
    | "GrandFinal"
    | "Winner";
  selection_status_note?: string | null;
};

export type UpdateParticipantSelectionStatusResponse = {
  message: string;
  data: {
    user_id: number;
    selection_status: NonNullable<UpdateParticipantSelectionStatusPayload["selection_status"]>;
    selection_status_note?: string | null;
    selection_status_updated_at?: string | null;
    participant_code?: string | null;
    eliminated_in_audition?: boolean;
    eliminated_at?: string | null;
  };
};

export type UpdateParticipantProfilePhotoPayload = {
  photo: string;
};

export type UpdateParticipantProfilePhotoResponse = {
  message: string;
  data: {
    user_id: number;
    photo?: string | null;
  };
};

export type AuditionTop20Candidate = {
  rank?: number;
  user_id: number;
  participant_id: string;
  name: string;
  nickname?: string | null;
  gender?: "Encik" | "Puan" | null;
  participant_code?: string | null;
  audition_number?: string | null;
  selection_status?: string | null;
  judges_count: number;
  audition_total: number;
  audition_average: number;
};

export type AuditionTop20PreviewResponse = {
  message: string;
  data: {
    meta: {
      stage: "Audition";
      score_type: "official";
      candidate_total: number;
      candidate_scored: number;
      encik_scored: number;
      puan_scored: number;
      encik_promoted_target: number;
      puan_promoted_target: number;
    };
    top_encik: AuditionTop20Candidate[];
    top_puan: AuditionTop20Candidate[];
    all_candidates: AuditionTop20Candidate[];
  };
};

export type AuditionTop20ApplyResponse = {
  message: string;
  data: {
    applied_by?: {
      id?: number;
      name?: string;
    };
    applied_at: string;
    promoted_total: number;
    rejected_total: number;
    promoted_user_ids: number[];
    rejected_user_ids: number[];
    top_encik: AuditionTop20Candidate[];
    top_puan: AuditionTop20Candidate[];
  };
};

export type UpdateAuthProfilePayload = Partial<{
  name: string;
  email: string;
  phone: string;
  judge_title: string;
  judge_organization: string;
  judge_avatar: string;
}>;

export type UpdateAuthProfileResponse = {
  message: string;
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

export type ParticipantResourceDocument = {
  linkUrl: string;
  fileName: string;
  fileDataUrl: string;
  fileMimeType: string;
};

export type ParticipantResourceImage = {
  imageUrl: string;
  imageName: string;
  caption: string;
};

export type ParticipantResourcesPayload = {
  guideDocument: ParticipantResourceDocument;
  submissionDocument: ParticipantResourceDocument;
  formS1Document: ParticipantResourceDocument;
  formS2Document: ParticipantResourceDocument;
  formS3Document: ParticipantResourceDocument;
  formS4Document: ParticipantResourceDocument;
  hardcopyGuide: string;
  closeUpPhotoGuide: string;
  fullBodyPhotoGuide: string;
  twibbonDocument: ParticipantResourceDocument;
  twibbonOpenLink: string;
  whatsappGroupLink: string;
  twibbonThumbnail: ParticipantResourceImage;
  whatsappThumbnail: ParticipantResourceImage;
  closeUpExamples: ParticipantResourceImage[];
  fullBodyExamples: ParticipantResourceImage[];
  instagramMentions: string;
  hashtagList: string;
  postingInstruction: string;
  additionalNote: string;
};

export type PublicParticipantResourcesResponse = {
  message: string;
  data: ParticipantResourcesPayload;
  updated_at?: string | null;
};

export type UpdateParticipantResourcesResponse = PublicParticipantResourcesResponse;

export type UpdateParticipantResourcesFiles = Partial<{
  guideDocumentFile: File;
  submissionDocumentFile: File;
  formS1DocumentFile: File;
  formS2DocumentFile: File;
  formS3DocumentFile: File;
  formS4DocumentFile: File;
  twibbonDocumentFile: File;
  twibbonThumbnailFile: File;
  whatsappThumbnailFile: File;
  closeUpExample1File: File;
  closeUpExample2File: File;
  closeUpExample3File: File;
  fullBodyExample1File: File;
  fullBodyExample2File: File;
  fullBodyExample3File: File;
}>;

export type FeedbackCategory = "Saran" | "Kritik" | "Pertanyaan" | "Lainnya";

export type FeedbackEntry = {
  id: string;
  name: string;
  email: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
  status: "baru" | "ditinjau" | "selesai";
};

export type FeedbackListResponse = {
  message: string;
  data: FeedbackEntry[];
};

export type SubmitFeedbackPayload = {
  name: string;
  email: string;
  category: FeedbackCategory;
  message: string;
};

export type SubmitFeedbackResponse = {
  message: string;
  data: FeedbackEntry;
};

export type UpdateFeedbackStatusPayload = {
  status: "baru" | "ditinjau" | "selesai";
};

export type UpdateFeedbackStatusResponse = {
  message: string;
  data: FeedbackEntry;
};

export type FaqCategory = "Pendaftaran" | "Berkas" | "Tahapan" | "Akun" | "Penilaian";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
};

export type FaqListResponse = {
  message: string;
  data: FaqItem[];
};

export type SaveFaqPayload = {
  question: string;
  answer: string;
  category: FaqCategory;
};

export type SaveFaqResponse = {
  message: string;
  data: FaqItem;
};

export type DeleteFaqResponse = {
  message: string;
};

export type NewsItem = {
  id: string;
  title: string;
  image: string;
  date: string;
  category: string;
  excerpt: string;
  contentHtml?: string;
  body: Array<
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "quote"; text: string; author?: string }
    | { type: "list"; items: string[] }
    | { type: "image"; src: string; alt?: string; caption?: string }
  >;
};

export type NewsListResponse = {
  message: string;
  data: NewsItem[];
};

export type SaveNewsPayload = {
  title: string;
  image: string;
  date: string;
  category: string;
  excerpt: string;
  contentHtml: string;
};

export type SaveNewsResponse = {
  message: string;
  data: NewsItem;
};

export type DeleteNewsResponse = {
  message: string;
};

type CacheEnvelope<T> = {
  ts: number;
  data: T;
};

const BIODATA_CACHE_KEY = "participant:biodata:v1";
const DOCUMENTS_CACHE_KEY = "participant:documents:v1";
const DEFAULT_PARTICIPANT_CACHE_MAX_AGE_MS = 8000;
const PUBLIC_FINALISTS_CACHE_KEY = "public:finalists:v1";
const DEFAULT_PUBLIC_FINALISTS_CACHE_MAX_AGE_MS = 30000;
const JUDGE_PARTICIPANTS_CACHE_KEY_PREFIX = "judge:participants:v1";
const DEFAULT_JUDGE_PARTICIPANTS_CACHE_MAX_AGE_MS = 10000;

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

/**
 * Helper cache request in-memory untuk menghindari fetch berulang pada interval singkat.
 */
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

/**
 * Endpoint registrasi akun peserta.
 */
export function registerParticipant(payload: RegisterParticipantPayload) {
  return apiRequest<RegisterParticipantResponse>("/register", {
    method: "POST",
    body: payload,
  });
}

/**
 * Endpoint verifikasi OTP setelah registrasi.
 */
export function verifyParticipantOtp(payload: VerifyOtpPayload) {
  return apiRequest<VerifyOtpResponse>("/verify-otp", {
    method: "POST",
    body: payload,
  });
}

/**
 * Endpoint kirim ulang OTP registrasi.
 */
export function resendParticipantOtp(payload: ResendOtpPayload) {
  return apiRequest<ResendOtpResponse>("/resend-otp", {
    method: "POST",
    body: payload,
  });
}

/**
 * Endpoint login peserta/admin/juri via kredensial email-password.
 */
export function loginParticipant(payload: LoginParticipantPayload) {
  return apiRequest<LoginParticipantResponse>("/login", {
    method: "POST",
    body: payload,
  });
}

/**
 * Mengambil profil user login saat ini (`/auth/me`).
 */
export function fetchAuthenticatedParticipant(token: string) {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    token,
  });
}

/**
 * Mengambil daftar peserta untuk panel juri dengan cache.
 */
export function fetchJudgeParticipants(
  token: string,
  options?: { force?: boolean; maxAgeMs?: number }
) {
  return fetchWithCache<JudgeParticipantsResponse>(
    `${JUDGE_PARTICIPANTS_CACHE_KEY_PREFIX}:${token}`,
    () =>
      apiRequest<JudgeParticipantsResponse>("/judge/participants", {
        method: "GET",
        token,
      }),
    {
      force: options?.force,
      maxAgeMs: options?.maxAgeMs ?? DEFAULT_JUDGE_PARTICIPANTS_CACHE_MAX_AGE_MS,
    }
  );
}

/**
 * Mengambil daftar finalis publik dengan cache.
 */
export function fetchPublicFinalists(options?: { force?: boolean; maxAgeMs?: number }) {
  return fetchWithCache<PublicFinalistsResponse>(
    PUBLIC_FINALISTS_CACHE_KEY,
    () =>
      apiRequest<PublicFinalistsResponse>("/public/finalists", {
        method: "GET",
      }),
    {
      force: options?.force,
      maxAgeMs: options?.maxAgeMs ?? DEFAULT_PUBLIC_FINALISTS_CACHE_MAX_AGE_MS,
    }
  );
}

/**
 * Mengambil resource publik peserta (dokumen, link, panduan).
 */
export function fetchPublicParticipantResources() {
  return apiRequest<PublicParticipantResourcesResponse>("/public/participant-resources", {
    method: "GET",
  });
}

/**
 * Mengirim feedback publik dari pengunjung.
 */
export function submitFeedback(payload: SubmitFeedbackPayload) {
  return apiRequest<SubmitFeedbackResponse>("/feedback", {
    method: "POST",
    body: payload,
  });
}

/**
 * Mengambil daftar feedback untuk panel super admin.
 */
export function fetchFeedbackList(token: string) {
  return apiRequest<FeedbackListResponse>("/super-admin/feedback", {
    method: "GET",
    token,
  });
}

/**
 * Memperbarui status feedback pada panel super admin.
 */
export function updateFeedbackStatus(
  token: string,
  feedbackId: string,
  payload: UpdateFeedbackStatusPayload
) {
  return apiRequest<UpdateFeedbackStatusResponse>(`/super-admin/feedback/${feedbackId}/status`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

/**
 * Mengambil FAQ publik.
 */
export function fetchPublicFaqs() {
  return apiRequest<FaqListResponse>("/public/faqs", {
    method: "GET",
  });
}

/**
 * Mengambil FAQ untuk panel admin/super admin.
 */
export function fetchAdminFaqs(token: string) {
  return apiRequest<FaqListResponse>("/super-admin/faqs", {
    method: "GET",
    token,
  });
}

/**
 * Menambahkan item FAQ baru.
 */
export function createFaq(token: string, payload: SaveFaqPayload) {
  return apiRequest<SaveFaqResponse>("/super-admin/faqs", {
    method: "POST",
    token,
    body: payload,
  });
}

/**
 * Memperbarui item FAQ berdasarkan id.
 */
export function updateFaq(token: string, id: string, payload: SaveFaqPayload) {
  return apiRequest<SaveFaqResponse>(`/super-admin/faqs/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

/**
 * Menghapus item FAQ berdasarkan id.
 */
export function deleteFaq(token: string, id: string) {
  return apiRequest<DeleteFaqResponse>(`/super-admin/faqs/${id}`, {
    method: "DELETE",
    token,
  });
}

/**
 * Mengambil daftar berita publik.
 */
export function fetchPublicNews() {
  return apiRequest<NewsListResponse>("/public/news", {
    method: "GET",
  });
}

/**
 * Mengambil daftar berita untuk panel admin/super admin.
 */
export function fetchAdminNews(token: string) {
  return apiRequest<NewsListResponse>("/super-admin/news", {
    method: "GET",
    token,
  });
}

/**
 * Menambahkan berita baru.
 */
export function createNews(token: string, payload: SaveNewsPayload) {
  return apiRequest<SaveNewsResponse>("/super-admin/news", {
    method: "POST",
    token,
    body: payload,
  });
}

/**
 * Memperbarui berita berdasarkan id.
 */
export function updateNews(token: string, id: string, payload: SaveNewsPayload) {
  return apiRequest<SaveNewsResponse>(`/super-admin/news/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

/**
 * Menghapus berita berdasarkan id.
 */
export function deleteNews(token: string, id: string) {
  return apiRequest<DeleteNewsResponse>(`/super-admin/news/${id}`, {
    method: "DELETE",
    token,
  });
}

/**
 * Menyimpan resource peserta beserta upload file pendukung opsional.
 */
export function updateParticipantResources(
  token: string,
  payload: ParticipantResourcesPayload,
  files: UpdateParticipantResourcesFiles = {}
) {
  const body = new FormData();
  body.append("payload", JSON.stringify(payload));

  const fileFieldMap: Array<[keyof UpdateParticipantResourcesFiles, string]> = [
    ["guideDocumentFile", "guide_document_file"],
    ["submissionDocumentFile", "submission_document_file"],
    ["formS1DocumentFile", "form_s1_document_file"],
    ["formS2DocumentFile", "form_s2_document_file"],
    ["formS3DocumentFile", "form_s3_document_file"],
    ["formS4DocumentFile", "form_s4_document_file"],
    ["twibbonDocumentFile", "twibbon_document_file"],
    ["twibbonThumbnailFile", "twibbon_thumbnail_file"],
    ["whatsappThumbnailFile", "whatsapp_thumbnail_file"],
    ["closeUpExample1File", "close_up_example_1_file"],
    ["closeUpExample2File", "close_up_example_2_file"],
    ["closeUpExample3File", "close_up_example_3_file"],
    ["fullBodyExample1File", "full_body_example_1_file"],
    ["fullBodyExample2File", "full_body_example_2_file"],
    ["fullBodyExample3File", "full_body_example_3_file"],
  ];

  fileFieldMap.forEach(([localKey, backendKey]) => {
    const file = files[localKey];
    if (file instanceof File) {
      body.append(backendKey, file);
    }
  });

  return apiRequest<UpdateParticipantResourcesResponse>("/super-admin/participant-resources", {
    method: "POST",
    token,
    body,
  });
}

/**
 * Mengatur status publikasi halaman vote.
 */
export function updateVotePublication(token: string, payload: UpdateVotePublicationPayload) {
  return apiRequest<UpdateVotePublicationResponse>("/super-admin/vote/publication", {
    method: "PATCH",
    token,
    body: payload,
  });
}

/**
 * Memperbarui data kandidat vote tertentu.
 */
export function updateVoteCandidate(
  token: string,
  participantUserId: number,
  payload: UpdateVoteCandidatePayload
) {
  return apiRequest<UpdateVoteCandidateResponse>(`/super-admin/vote/candidates/${participantUserId}`, {
    method: "POST",
    token,
    body: payload,
  });
}

/**
 * Upload foto kandidat vote.
 */
export function uploadVoteCandidatePhoto(token: string, participantUserId: number, file: File) {
  const body = new FormData();
  body.append("photo", file);

  return apiRequest<UpdateVoteCandidateResponse>(`/super-admin/vote/candidates/${participantUserId}`, {
    method: "POST",
    token,
    body,
  });
}

/**
 * Menyimpan konfigurasi pemenang versi penilaian juri.
 */
export function updateJuryWinners(token: string, payload: UpdateJuryWinnersPayload) {
  return apiRequest<UpdateJuryWinnersResponse>("/super-admin/vote/jury", {
    method: "PATCH",
    token,
    body: payload,
  });
}

/**
 * Menyimpan hasil review dokumen peserta oleh admin.
 */
export function updateParticipantDocumentReviews(
  token: string,
  participantUserId: number,
  payload: UpdateParticipantDocumentReviewsPayload
) {
  return apiRequest<UpdateParticipantDocumentReviewsResponse>(
    `/super-admin/participants/${participantUserId}/document-reviews`,
    {
      method: "PATCH",
      token,
      body: payload,
    }
  );
}

/**
 * Memperbarui status seleksi peserta (verified, top20, dst).
 */
export function updateParticipantSelectionStatus(
  token: string,
  participantUserId: number,
  payload: UpdateParticipantSelectionStatusPayload
) {
  return apiRequest<UpdateParticipantSelectionStatusResponse>(
    `/super-admin/participants/${participantUserId}/selection-status`,
    {
      method: "PATCH",
      token,
      body: payload,
    }
  );
}

/**
 * Memperbarui foto profil peserta dari panel admin/super admin.
 */
export function updateParticipantProfilePhoto(
  token: string,
  participantUserId: number,
  payload: UpdateParticipantProfilePhotoPayload
) {
  return apiRequest<UpdateParticipantProfilePhotoResponse>(
    `/super-admin/participants/${participantUserId}/profile-photo`,
    {
      method: "PATCH",
      token,
      body: payload,
    }
  );
}

/**
 * Mengambil preview kandidat Top 20 hasil stage Audition.
 */
export function fetchAuditionTop20Preview(token: string) {
  return apiRequest<AuditionTop20PreviewResponse>(
    "/super-admin/scoring/audition/top20-preview",
    {
      method: "GET",
      token,
    }
  );
}

/**
 * Menerapkan hasil Top 20 Audition ke status seleksi peserta.
 */
export function applyAuditionTop20(token: string) {
  return apiRequest<AuditionTop20ApplyResponse>(
    "/super-admin/scoring/audition/top20-apply",
    {
      method: "POST",
      token,
    }
  );
}

/**
 * Memperbarui profil akun terautentikasi.
 */
export function updateAuthenticatedProfile(token: string, payload: UpdateAuthProfilePayload) {
  return apiRequest<UpdateAuthProfileResponse>("/auth/profile", {
    method: "PATCH",
    token,
    body: payload,
  });
}

/**
 * Mengambil biodata peserta login dengan dukungan cache.
 */
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

/**
 * Memperbarui biodata peserta login.
 */
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

/**
 * Mengambil daftar dokumen peserta login dengan dukungan cache.
 */
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

/**
 * Mengunggah satu dokumen peserta berdasarkan `document_key`.
 */
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

/**
 * Menandai dokumen peserta telah disubmit ke admin untuk verifikasi.
 */
export function submitParticipantDocuments(token: string) {
  return apiRequest<ParticipantDocumentsResponse>("/participant/documents/submit", {
    method: "POST",
    token,
  }).then((response) => {
    writeCached(DOCUMENTS_CACHE_KEY, response);
    return response;
  });
}

/**
 * Mengubah password akun terautentikasi.
 */
export function changeAuthenticatedPassword(token: string, payload: ChangePasswordPayload) {
  return apiRequest<ChangePasswordResponse>("/auth/change-password", {
    method: "POST",
    token,
    body: payload,
  });
}

/**
 * Meminta OTP untuk alur lupa password.
 */
export function requestForgotPasswordOtp(payload: ForgotPasswordRequestOtpPayload) {
  return apiRequest<ForgotPasswordRequestOtpResponse>("/forgot-password/request-otp", {
    method: "POST",
    body: payload,
  });
}

/**
 * Verifikasi OTP pada alur lupa password.
 */
export function verifyForgotPasswordOtp(payload: ForgotPasswordVerifyOtpPayload) {
  return apiRequest<ForgotPasswordVerifyOtpResponse>("/forgot-password/verify-otp", {
    method: "POST",
    body: payload,
  });
}

/**
 * Menyimpan password baru pada alur lupa password.
 */
export function resetForgotPassword(payload: ForgotPasswordResetPayload) {
  return apiRequest<ForgotPasswordResetResponse>("/forgot-password/reset", {
    method: "POST",
    body: payload,
  });
}
