"use client";

import { clearLocalSession, getLocalAccessToken, getLocalRefreshToken, saveLocalSession } from "./local-session";

const cache = new Map<string, { expiresAt: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const ME_CACHE_MS = 15_000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error";
}

async function refreshAccessToken() {
  const refreshToken = getLocalRefreshToken();
  if (!refreshToken) {
    clearLocalSession();
    throw new ApiError("Please log in first.", 401);
  }

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.session?.access_token) {
    clearLocalSession();
    throw new ApiError(payload?.error || "Please log in first.", response.status || 401);
  }

  saveLocalSession({
    access_token: payload.session.access_token,
    refresh_token: payload.session.refresh_token || refreshToken
  });

  return String(payload.session.access_token);
}

export async function getAccessToken({ allowRefresh = true }: { allowRefresh?: boolean } = {}) {
  const token = getLocalAccessToken();
  if (token) return token;
  if (allowRefresh) return refreshAccessToken();
  throw new ApiError("Please log in first.", 401);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const canCache = method === "GET" && path === "/api/me";
  const now = Date.now();

  if (canCache) {
    const cached = cache.get(path);
    if (cached && cached.expiresAt > now) return cached.value as T;

    const pending = inflight.get(path);
    if (pending) return pending as Promise<T>;
  } else if (method !== "GET") {
    cache.delete("/api/me");
  }

  const requestWithToken = async (token: string) => fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {})
    }
  });

  const request = (async () => {
    let token = await getAccessToken();
    let response = await requestWithToken(token);

    if (response.status === 401 && getLocalRefreshToken()) {
      cache.delete("/api/me");
      token = await refreshAccessToken();
      response = await requestWithToken(token);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(payload.error || "Request failed", response.status);
    }
    if (canCache) {
      cache.set(path, { expiresAt: Date.now() + ME_CACHE_MS, value: payload });
    }
    return payload as T;
  })();

  if (canCache) {
    inflight.set(path, request);
    request.finally(() => inflight.delete(path));
  }

  return request;
}
