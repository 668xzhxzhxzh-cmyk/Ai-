import { apiError } from "@/lib/server-data";
import { requireAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireAdmin(request.headers.get("authorization"));

    const [profile, memberProfile, checkins, trainingPlans, nutritionPlans, reviews, reports, chats, tasks] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("member_profiles").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("daily_checkins").select("*").eq("user_id", id).order("date", { ascending: false }),
        supabase.from("training_plans").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("nutrition_plans").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("ai_daily_reviews").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("weekly_reports").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("ai_chat_messages").select("*").eq("user_id", id).order("created_at", { ascending: true }),
        supabase.from("admin_tasks").select("*").eq("user_id", id).order("created_at", { ascending: false })
      ]);

    for (const result of [profile, memberProfile, checkins, trainingPlans, nutritionPlans, reviews, reports, chats, tasks]) {
      if (result.error) throw result.error;
    }

    return Response.json({
      profile: profile.data,
      memberProfile: memberProfile.data,
      checkins: checkins.data,
      trainingPlans: trainingPlans.data,
      nutritionPlans: nutritionPlans.data,
      reviews: reviews.data,
      reports: reports.data,
      chats: chats.data,
      tasks: tasks.data
    });
  } catch (error) {
    return apiError(error);
  }
}
