import { callDeepSeek } from "@/lib/deepseek";
import { generateWeeklyReportPrompt } from "@/lib/prompts";
import { createAdminTask, detectCheckinRisk } from "@/lib/risk";
import { apiError, getUserLanguage, weekEndIso, weekStartIso } from "@/lib/server-data";
import { requireUser } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const language = await getUserLanguage(supabase, user.id);
    const start = weekStartIso();
    const end = weekEndIso();
    const { data: checkins, error } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });
    if (error) throw error;
    if (!checkins?.length) throw new Error("No check-ins available for this week.");

    const reportText = await callDeepSeek(generateWeeklyReportPrompt(checkins, language));
    const risky = checkins.map(detectCheckinRisk).find((risk) => risk.need_human_review);
    const { data, error: insertError } = await supabase
      .from("weekly_reports")
      .insert({
        user_id: user.id,
        week_start: start,
        week_end: end,
        report_content: reportText,
        need_human_review: Boolean(risky),
        review_reason: risky?.review_reason || null
      })
      .select()
      .single();
    if (insertError) throw insertError;

    if (risky) {
      await createAdminTask(
        supabase,
        user.id,
        "weekly_report_risk",
        "周报需要人工审核",
        risky.review_reason || "Weekly report requires human review."
      );
    }

    return Response.json({ report: data });
  } catch (error) {
    return apiError(error);
  }
}
