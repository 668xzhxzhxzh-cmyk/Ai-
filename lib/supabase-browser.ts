"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL。请检查 .env.local，并重启 npm run dev。");
  }

  if (!anonKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY。请检查 .env.local，并重启 npm run dev。");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 不是有效 URL。应类似 https://xxxx.supabase.co。");
  }

  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 格式异常。请从 Supabase Project Settings > API 复制 Project URL。");
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
