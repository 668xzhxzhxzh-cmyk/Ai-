import { apiError } from "@/lib/server-data";
import { requireAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin(request.headers.get("authorization"));
    const [profiles, memberProfiles, checkins, trainingPlans, nutritionPlans, reviews, reports, chats, tasks] =
      await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("member_profiles").select("*").order("updated_at", { ascending: false }),
        supabase.from("daily_checkins").select("*").order("date", { ascending: false }).limit(500),
        supabase.from("training_plans").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("nutrition_plans").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("ai_daily_reviews").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("weekly_reports").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("ai_chat_messages").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("admin_tasks").select("*").order("created_at", { ascending: false })
      ]);

    for (const result of [profiles, memberProfiles, checkins, trainingPlans, nutritionPlans, reviews, reports, chats, tasks]) {
      if (result.error) throw result.error;
    }

    return Response.json({
      profiles: profiles.data,
      memberProfiles: memberProfiles.data,
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
