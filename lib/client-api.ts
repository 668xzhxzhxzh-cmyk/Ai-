"use client";

import { createBrowserSupabase } from "./supabase-browser";
import { getLocalAccessToken } from "./local-session";

const cache = new Map<string, { expiresAt: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const ME_CACHE_MS = 15_000;

export async function getAccessToken() {
  const supabase = createBrowserSupabase();
  const { data, error } = await supabase.auth.getSession();
  const fallbackToken = getLocalAccessToken();
  if (error && !fallbackToken) {
    throw new Error("Please log in first.");
  }
  return data.session?.access_token || fallbackToken || "";
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

  const token = await getAccessToken();
  const request = fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {})
    }
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Request failed");
    }
    if (canCache) {
      cache.set(path, { expiresAt: Date.now() + ME_CACHE_MS, value: payload });
    }
    return payload as T;
  });

  if (canCache) {
    inflight.set(path, request);
    request.finally(() => inflight.delete(path));
  }

  return request;
}
