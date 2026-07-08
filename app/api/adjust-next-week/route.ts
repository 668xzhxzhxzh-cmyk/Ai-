import { callDeepSeek } from "@/lib/deepseek";
import { adjustNextWeekPlanPrompt } from "@/lib/prompts";
import { createAdminTask, detectCheckinRisk } from "@/lib/risk";
import { apiError, getMemberProfile, getUserLanguage, weekStartIso } from "@/lib/server-data";
import { requireUser } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.userId || user.id;
    const requesterProfile = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
    if (targetUserId !== user.id && requesterProfile.data?.role !== "admin") {
      throw new Error("Forbidden");
    }

    const [memberProfile, language, checkins, latestTraining, latestNutrition] = await Promise.all([
      getMemberProfile(supabase, targetUserId),
      getUserLanguage(supabase, targetUserId),
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", targetUserId)
        .order("date", { ascending: false })
        .limit(14),
      supabase.from("training_plans").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }).limit(1),
      supabase.from("nutrition_plans").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }).limit(1)
    ]);
    if (checkins.error) throw checkins.error;
    if (latestTraining.error) throw latestTraining.error;
    if (latestNutrition.error) throw latestNutrition.error;
    if (!checkins.data?.length) throw new Error("Need check-in data before adjusting next week.");

    const risk = checkins.data.map(detectCheckinRisk).find((item) => item.need_human_review);
    const adjusted = await callDeepSeek(
      adjustNextWeekPlanPrompt(
        {
          memberProfile,
          recentCheckins: checkins.data,
          latestTraining: latestTraining.data?.[0],
          latestNutrition: latestNutrition.data?.[0]
        },
        language
      )
    );

    const { data, error } = await supabase
      .from("training_plans")
      .insert({
        user_id: targetUserId,
        plan_content: adjusted,
        week_start: weekStartIso(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        need_human_review: Boolean(risk),
        review_reason: risk?.review_reason || null
      })
      .select()
      .single();
    if (error) throw error;

    if (risk) {
      await createAdminTask(
        supabase,
        targetUserId,
        "next_week_adjustment_risk",
        "下周计划调整需要人工审核",
        risk.review_reason || "Next week adjustment requires human review."
      );
    }

    return Response.json({ trainingPlan: data });
  } catch (error) {
    return apiError(error);
  }
}
