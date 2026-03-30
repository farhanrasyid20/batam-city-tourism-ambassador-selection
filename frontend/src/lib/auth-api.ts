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
  name: string;
  email: string;
  phone?: string | null;
  gender?: "Encik" | "Puan" | null;
  national_id?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  height_cm?: number | null;
  instagram?: string | null;
  photo?: string | null;
  education_category?: "SMA" | "SMK" | "MA" | "Kuliah" | null;
  education_institution?: string | null;
  education_major?: string | null;
  education_degree?: string | null;
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
  national_id: string;
  birth_place: string;
  birth_date: string;
  height_cm: number;
  instagram: string;
  photo: string;
  education_category: "SMA" | "SMK" | "MA" | "Kuliah";
  education_institution: string;
  education_major: string;
  education_degree: string;
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
    submitted_to_admin: boolean;
    submitted_to_admin_at?: string | null;
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
  otp_expires_in_minutes: number;
  resend_available_in_seconds: number;
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
  otp: string;
  password: string;
  password_confirmation: string;
};

export type ForgotPasswordResetResponse = {
  message: string;
};

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

export function fetchParticipantBiodata(token: string) {
  return apiRequest<ParticipantBiodataResponse>("/participant/biodata", {
    method: "GET",
    token,
  });
}

export function updateParticipantBiodata(token: string, payload: UpdateParticipantBiodataPayload) {
  return apiRequest<ParticipantBiodataResponse>("/participant/biodata", {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchParticipantDocuments(token: string) {
  return apiRequest<ParticipantDocumentsResponse>("/participant/documents", {
    method: "GET",
    token,
  });
}

export function uploadParticipantDocument(token: string, documentKey: string, file: File) {
  const body = new FormData();
  body.append("document_key", documentKey);
  body.append("file", file);

  return apiRequest<ParticipantDocumentsResponse>("/participant/documents/upload", {
    method: "POST",
    token,
    body,
  });
}

export function submitParticipantDocuments(token: string) {
  return apiRequest<ParticipantDocumentsResponse>("/participant/documents/submit", {
    method: "POST",
    token,
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
