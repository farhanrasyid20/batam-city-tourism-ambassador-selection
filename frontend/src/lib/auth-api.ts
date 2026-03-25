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
  debug_otp?: string;
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
  debug_otp?: string;
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
