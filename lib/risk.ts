import type { DailyCheckinInput, MemberProfileInput, RiskResult } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const riskKeywords = [
  "胸痛",
  "头晕",
  "昏厥",
  "呕吐",
  "严重腹泻",
  "受伤",
  "疼痛",
  "暴食",
  "断食",
  "极端节食",
  "不吃饭",
  "膝盖痛",
  "脚踝痛",
  "肩膀痛",
  "腰痛",
  "心悸",
  "呼吸困难",
  "过度疲劳",
  "chest pain",
  "dizzy",
  "faint",
  "vomit",
  "injury",
  "pain",
  "fasting",
  "starving",
  "palpitation",
  "shortness of breath"
];

function fromText(text: string): string[] {
  const lower = text.toLowerCase();
  return riskKeywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

export function detectRiskFromText(text: string, extraReasons: string[] = []): RiskResult {
  const matched = fromText(text);
  const reasons = [...matched.map((item) => `risk keyword: ${item}`), ...extraReasons].filter(Boolean);
  return {
    need_human_review: reasons.length > 0,
    review_reason: reasons.length ? reasons.join("; ") : null,
    matched_keywords: matched
  };
}

export function detectProfileRisk(profile: MemberProfileInput): RiskResult {
  const text = [
    profile.injury_area,
    profile.discomfort,
    profile.notes,
    profile.diet_preference,
    profile.food_restrictions
  ]
    .filter(Boolean)
    .join(" ");
  const extra: string[] = [];
  if (profile.has_injury) extra.push("member has injury");
  if (profile.pain_level >= 4) extra.push(`pain level ${profile.pain_level}`);
  return detectRiskFromText(text, extra);
}

export function detectCheckinRisk(checkin: DailyCheckinInput): RiskResult {
  const extra: string[] = [];
  if (checkin.pain_level >= 4) extra.push(`pain level ${checkin.pain_level}`);
  if (checkin.fatigue_level >= 8) extra.push(`fatigue level ${checkin.fatigue_level}`);
  if (checkin.sleep_hours > 0 && checkin.sleep_hours < 5) extra.push(`low sleep ${checkin.sleep_hours}h`);
  return detectRiskFromText([checkin.mood, checkin.notes].filter(Boolean).join(" "), extra);
}

export async function createAdminTask(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  title: string,
  description: string
) {
  await supabase.from("admin_tasks").insert({
    user_id: userId,
    type,
    title,
    description,
    status: "open"
  });
}
