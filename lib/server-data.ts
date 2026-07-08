import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language, MemberProfileInput } from "./types";

export function apiError(error: unknown, fallback = "Request failed") {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : message === "DeepSeek API 未配置" ? 503 : 400;
  return Response.json({ error: message }, { status });
}

export async function getAppProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMemberProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as (MemberProfileInput & { id: string; user_id: string }) | null;
}

export async function getUserLanguage(supabase: SupabaseClient, userId: string): Promise<Language> {
  const profile = await getAppProfile(supabase, userId);
  return profile?.language === "en" ? "en" : "zh";
}

export function weekStartIso(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export function weekEndIso(date = new Date()) {
  const start = new Date(weekStartIso(date));
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
}
