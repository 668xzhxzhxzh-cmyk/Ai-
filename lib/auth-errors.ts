"use client";

import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./supabase-browser";

export function describeAuthError(error: unknown, action: "login" | "signup") {
  const actionText = action === "signup" ? "注册" : "登录";

  if (error instanceof AuthApiError) {
    return `${actionText}失败：Supabase 返回 ${error.status}。${error.message}`;
  }

  if (error instanceof AuthRetryableFetchError) {
    return `${actionText}失败：无法连接 Supabase Auth。请检查网络、代理/VPN、防火墙，或 Supabase Project URL 是否正确。原始错误：${error.message}`;
  }

  if (error instanceof AuthUnknownError) {
    return `${actionText}失败：Supabase Auth 返回未知错误。${error.message}`;
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return `${actionText}失败：浏览器无法请求 Supabase。常见原因是网络/代理/VPN 阻断、HTTPS 证书拦截、Project URL 填错，或 anon key 不是当前项目的 key。`;
  }

  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return `${actionText}失败：网络请求失败。请确认当前网络可以访问 Supabase，并检查 .env.local 的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。`;
    }
    return `${actionText}失败：${error.message}`;
  }

  return `${actionText}失败：未知错误。`;
}

export function getAuthErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : error.constructor?.name || "UnknownError",
    message: typeof record.message === "string" ? record.message : "",
    status: typeof record.status === "number" || typeof record.status === "string" ? String(record.status) : null
  };
}

export async function testSupabaseGetSession() {
  const { createBrowserSupabase } = await import("./supabase-browser");

  try {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.getSession();
    if (error) {
      const details = getAuthErrorDetails(error);
      return {
        ok: false,
        message: details?.message || error.message,
        details
      };
    }
    return { ok: true, message: "getSession ok", details: null };
  } catch (error) {
    const details = getAuthErrorDetails(error);
    return {
      ok: false,
      message: details?.message || "getSession failed",
      details
    };
  }
}

export function getPublicSupabaseEnvStatus() {
  try {
    const { url, anonKey } = getPublicSupabaseConfig();
    return {
      urlExists: Boolean(url),
      anonKeyExists: Boolean(anonKey),
      configError: null as string | null
    };
  } catch (error) {
    return {
      urlExists: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKeyExists: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      configError: error instanceof Error ? error.message : "Supabase public env error"
    };
  }
}
