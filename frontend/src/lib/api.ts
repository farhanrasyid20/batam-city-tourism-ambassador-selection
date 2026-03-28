"use client";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL;

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
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
