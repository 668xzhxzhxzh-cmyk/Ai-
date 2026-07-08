import { callDeepSeek } from "@/lib/deepseek";
import { generateNutritionPlanPrompt } from "@/lib/prompts";
import { createAdminTask, detectProfileRisk } from "@/lib/risk";
import { apiError, getMemberProfile, getUserLanguage } from "@/lib/server-data";
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
    const nutrition = await callDeepSeek(generateNutritionPlanPrompt(profile, language));
    const { data, error } = await supabase
      .from("nutrition_plans")
      .insert({
        user_id: user.id,
        plan_content: nutrition,
        need_human_review: risk.need_human_review,
        review_reason: risk.review_reason
      })
      .select()
      .single();
    if (error) throw error;

    if (risk.need_human_review) {
      await createAdminTask(
        supabase,
        user.id,
        "nutrition_plan_risk",
        "饮食建议需要人工审核",
        risk.review_reason || "Nutrition plan requires human review."
      );
    }

    return Response.json({ nutritionPlan: data, risk });
  } catch (error) {
    return apiError(error);
  }
}
