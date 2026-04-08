"use client";

import { clearParticipantAuthSession } from "./auth-storage";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL;
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");

export function resolveApiAssetUrl(url?: string | null): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return value.startsWith("/") ? `${API_ORIGIN}${value}` : `${API_ORIGIN}/${value}`;
}

function looksLikeImageAsset(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/\s/.test(v) && !v.startsWith("data:image/")) return false;

  const lower = v.toLowerCase();
  if (lower === "null" || lower === "undefined") return false;
  if (v.startsWith("data:image/") || v.startsWith("blob:")) return true;
  if (v.startsWith("http://") || v.startsWith("https://")) return true;
  if (v.startsWith("/")) return true;
  if (v.includes("/")) return true;
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(v)) return true;

  return false;
}

export function resolveAvatarUrl(url?: string | null): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;
  if (!looksLikeImageAsset(value)) return undefined;
  return resolveApiAssetUrl(value);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, token, ...rest } = options;
  const isFormDataBody = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormDataBody
        ? (body as FormData)
        : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (
      typeof window !== "undefined" &&
      (response.status === 401 || response.status === 419)
    ) {
      clearParticipantAuthSession();
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/auth/login")) {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.replace(`/auth/login?next=${next}`);
      }
    }

    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String(payload.message)
        : "Terjadi kesalahan saat menghubungi server.";
    const errors =
      typeof payload === "object" && payload !== null && "errors" in payload
        ? (payload.errors as Record<string, string[]>)
        : undefined;

    throw new ApiError(message, response.status, errors);
  }

  return payload as T;
}

export function getReadableApiError(error: unknown) {
  if (error instanceof ApiError) {
    const firstFieldErrors = error.errors ? Object.values(error.errors)[0] : undefined;
    return firstFieldErrors?.[0] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak dikenal.";
}
