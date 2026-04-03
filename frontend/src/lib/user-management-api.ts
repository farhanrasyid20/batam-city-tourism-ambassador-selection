"use client";

import { apiRequest } from "./api";

export type InternalUserRole = "admin" | "judge";
export type InternalUserStatus = "active" | "suspended";

export type InternalUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: InternalUserRole;
  account_status: InternalUserStatus;
  judge_assigned_stages?: Array<"Audition" | "Pre Camp" | "Camp" | "Grand Final"> | null;
  judge_type?: "judge" | "committee" | "mentor" | "camp_team" | null;
  judge_title?: string | null;
  judge_organization?: string | null;
  judge_avatar?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InternalUsersResponse = {
  message: string;
  data: InternalUser[];
  total: number;
};

export type CreateInternalUserPayload = {
  name: string;
  email: string;
  phone?: string;
  role: InternalUserRole;
  password: string;
  password_confirmation: string;
  account_status?: InternalUserStatus;
  judge_assigned_stages?: Array<"Audition" | "Pre Camp" | "Camp" | "Grand Final">;
  judge_type?: "judge" | "committee" | "mentor" | "camp_team";
  judge_title?: string;
  judge_organization?: string;
  judge_avatar?: string;
};

export type UpdateInternalUserPayload = Partial<CreateInternalUserPayload>;

export function fetchInternalUsers(token: string, role?: InternalUserRole) {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiRequest<InternalUsersResponse>(`/super-admin/users${query}`, {
    method: "GET",
    token,
  });
}

export function createInternalUser(token: string, payload: CreateInternalUserPayload) {
  return apiRequest<{ message: string; user: InternalUser }>("/super-admin/users", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateInternalUser(token: string, id: number, payload: UpdateInternalUserPayload) {
  return apiRequest<{ message: string; user: InternalUser }>(`/super-admin/users/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export function suspendInternalUser(token: string, id: number) {
  return apiRequest<{ message: string }>(`/super-admin/users/${id}/suspend`, {
    method: "PATCH",
    token,
  });
}

export function activateInternalUser(token: string, id: number) {
  return apiRequest<{ message: string }>(`/super-admin/users/${id}/activate`, {
    method: "PATCH",
    token,
  });
}

export function deleteInternalUser(token: string, id: number) {
  return apiRequest<{ message: string }>(`/super-admin/users/${id}`, {
    method: "DELETE",
    token,
  });
}
