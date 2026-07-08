import { callDeepSeek } from "@/lib/deepseek";
import { generateNutritionPlanPrompt, generateTrainingPlanPrompt } from "@/lib/prompts";
import { createAdminTask, detectProfileRisk } from "@/lib/risk";
import { apiError, getMemberProfile, getUserLanguage, weekStartIso } from "@/lib/server-data";
import { requireUser } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const [profile, language] = await Promise.all([
      getMemberProfile(supabase, user.id),
      getUserLanguage(supabase, user.id)
    ]);

    if (!profile) throw new Error("Please complete member profile first.");

    const risk = detectProfileRisk(profile);
    const training = await callDeepSeek(generateTrainingPlanPrompt(profile, language));
    const nutrition = await callDeepSeek(generateNutritionPlanPrompt(profile, language));

    const [trainingInsert, nutritionInsert] = await Promise.all([
      supabase
        .from("training_plans")
        .insert({
          user_id: user.id,
          plan_content: training,
          week_start: weekStartIso(),
          need_human_review: risk.need_human_review,
          review_reason: risk.review_reason
        })
        .select()
        .single(),
      supabase
        .from("nutrition_plans")
        .insert({
          user_id: user.id,
          plan_content: nutrition,
          need_human_review: risk.need_human_review,
          review_reason: risk.review_reason
        })
        .select()
        .single()
    ]);

    if (trainingInsert.error) throw trainingInsert.error;
    if (nutritionInsert.error) throw nutritionInsert.error;

    if (risk.need_human_review) {
      await createAdminTask(
        supabase,
        user.id,
        "plan_risk",
        "计划生成需要人工审核",
        risk.review_reason || "Generated plan requires human review."
      );
    }

    return Response.json({ trainingPlan: trainingInsert.data, nutritionPlan: nutritionInsert.data, risk });
  } catch (error) {
    return apiError(error);
  }
}
