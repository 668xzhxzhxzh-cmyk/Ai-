import { z } from "zod";
import { callDeepSeek } from "@/lib/deepseek";
import { analyzeDailyCheckinPrompt } from "@/lib/prompts";
import { createAdminTask, detectCheckinRisk } from "@/lib/risk";
import { apiError, getMemberProfile, getUserLanguage } from "@/lib/server-data";
import { requireUser } from "@/lib/supabase-admin";

const schema = z.object({
  date: z.string().min(1),
  weight: z.coerce.number().optional(),
  training_completed: z.coerce.boolean(),
  training_completion_rate: z.coerce.number().min(0).max(100),
  diet_completion_rate: z.coerce.number().min(0).max(100),
  sleep_hours: z.coerce.number().min(0).max(24),
  fatigue_level: z.coerce.number().min(0).max(10),
  pain_level: z.coerce.number().min(0).max(10),
  mood: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  image_urls: z.array(z.string()).optional().default([])
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const payload = schema.parse(await request.json());
    const [memberProfile, language, recent] = await Promise.all([
      getMemberProfile(supabase, user.id),
      getUserLanguage(supabase, user.id),
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7)
    ]);

    if (recent.error) throw recent.error;
    const risk = detectCheckinRisk(payload);
    const { data: checkin, error: checkinError } = await supabase
      .from("daily_checkins")
      .upsert({ user_id: user.id, ...payload }, { onConflict: "user_id,date" })
      .select()
      .single();
    if (checkinError) throw checkinError;

    const prompt = analyzeDailyCheckinPrompt(memberProfile, payload, language);
    const reviewText = await callDeepSeek(prompt);
    const consecutiveLow = (recent.data || []).filter(
      (item) => item.training_completion_rate < 50 || item.diet_completion_rate < 50
    ).length;
    const finalRisk = {
      ...risk,
      need_human_review: risk.need_human_review || consecutiveLow >= 3,
      review_reason:
        risk.review_reason || (consecutiveLow >= 3 ? "连续多次训练或饮食执行率偏低" : null)
    };

    const { data: review, error: reviewError } = await supabase
      .from("ai_daily_reviews")
      .insert({
        user_id: user.id,
        checkin_id: checkin.id,
        review_content: reviewText,
        need_human_review: finalRisk.need_human_review,
        review_reason: finalRisk.review_reason
      })
      .select()
      .single();
    if (reviewError) throw reviewError;

    if (finalRisk.need_human_review) {
      await createAdminTask(
        supabase,
        user.id,
        "checkin_risk",
        "每日打卡风险提醒",
        finalRisk.review_reason || "Check-in requires human follow-up."
      );
    }

    return Response.json({ checkin, review, risk: finalRisk });
  } catch (error) {
    return apiError(error);
  }
}
