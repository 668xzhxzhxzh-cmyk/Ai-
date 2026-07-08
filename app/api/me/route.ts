import { requireUser } from "@/lib/supabase-admin";
import { apiError, getAppProfile, getMemberProfile } from "@/lib/server-data";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const [profile, memberProfile, trainingPlans, nutritionPlans, checkins, reviews, reports, chats, tasks] =
      await Promise.all([
        getAppProfile(supabase, user.id),
        getMemberProfile(supabase, user.id),
        supabase.from("training_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("nutrition_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("daily_checkins").select("*").eq("user_id", user.id).order("date", { ascending: false }),
        supabase.from("ai_daily_reviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("weekly_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("ai_chat_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("admin_tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      ]);

    for (const result of [trainingPlans, nutritionPlans, checkins, reviews, reports, chats, tasks]) {
      if (result.error) throw result.error;
    }

    return Response.json({
      user: { id: user.id, email: user.email },
      profile,
      memberProfile,
      trainingPlans: trainingPlans.data,
      nutritionPlans: nutritionPlans.data,
      checkins: checkins.data,
      reviews: reviews.data,
      reports: reports.data,
      chats: chats.data,
      tasks: tasks.data
    });
  } catch (error) {
    return apiError(error);
  }
}
