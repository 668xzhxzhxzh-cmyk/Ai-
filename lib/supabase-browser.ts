"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

function looksLikeKey(value: string) {
  return value.startsWith("eyJ") || value.startsWith("sb_") || value.length > 120;
}

function describeSupabaseUrlError(rawUrl: string) {
  const value = rawUrl.trim();

  if (looksLikeKey(value)) {
    return "NEXT_PUBLIC_SUPABASE_URL 当前看起来像 API Key。它必须填写 Supabase Project URL，例如 https://xxxx.supabase.co。anon key 应填写到 NEXT_PUBLIC_SUPABASE_ANON_KEY，service_role key 应填写到 SUPABASE_SERVICE_ROLE_KEY。";
  }

  if (!value.startsWith("https://")) {
    return "NEXT_PUBLIC_SUPABASE_URL 必须以 https:// 开头，例如 https://xxxx.supabase.co。请不要填写 anon key、service_role key 或项目 ref。";
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL 不是有效 URL。请从 Supabase Project Settings > API 复制 Project URL，例如 https://xxxx.supabase.co。";
  }

  if (parsed.hostname !== parsed.hostname.toLowerCase()) {
    return "NEXT_PUBLIC_SUPABASE_URL 的域名建议使用小写。请从 Supabase Project Settings > API 复制 Project URL。";
  }

  if (!parsed.hostname.endsWith(".supabase.co")) {
    return "NEXT_PUBLIC_SUPABASE_URL 的域名必须类似 xxxx.supabase.co。请填写 Project URL，不是 anon key、service_role key、REST endpoint 或 Vercel 域名。";
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    return "NEXT_PUBLIC_SUPABASE_URL 只需要项目根 URL，例如 https://xxxx.supabase.co，不要带 /auth/v1、/rest/v1、查询参数或 #fragment。";
  }

  return null;
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL。Vercel 里应填写 Supabase Project URL，例如 https://xxxx.supabase.co。");
  }

  if (!anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY。Vercel 里应填写 Supabase anon public key 或 publishable key。");
  }

  const urlError = describeSupabaseUrlError(url);
  if (urlError) {
    throw new Error(urlError);
  }

  if (!anonKey.startsWith("eyJ") && !anonKey.startsWith("sb_publishable_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY 格式异常。请复制 Supabase 的 anon public key 或 publishable key，不要复制服务端密钥。"
    );
  }

  return { url, anonKey };
}

let browserSupabase: SupabaseClient | null = null;

export function createBrowserSupabase() {
  if (browserSupabase) return browserSupabase;

  const { url, anonKey } = getPublicSupabaseConfig();

  browserSupabase = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return browserSupabase;
}
