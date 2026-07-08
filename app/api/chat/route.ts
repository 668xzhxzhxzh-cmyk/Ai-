import { z } from "zod";
import { callDeepSeek } from "@/lib/deepseek";
import { answerMemberQuestionPrompt } from "@/lib/prompts";
import { createAdminTask, detectRiskFromText } from "@/lib/risk";
import { apiError, getMemberProfile, getUserLanguage } from "@/lib/server-data";
import { requireUser } from "@/lib/supabase-admin";

const schema = z.object({
  question: z.string().min(1).max(4000)
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const { question } = schema.parse(await request.json());
    const [memberProfile, language, recentCheckins, plans] = await Promise.all([
      getMemberProfile(supabase, user.id),
      getUserLanguage(supabase, user.id),
      supabase.from("daily_checkins").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
      supabase.from("training_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
    ]);
    if (recentCheckins.error) throw recentCheckins.error;
    if (plans.error) throw plans.error;

    const risk = detectRiskFromText(question);
    await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: question,
      need_human_review: risk.need_human_review,
      review_reason: risk.review_reason
    });

    const answer = await callDeepSeek(
      answerMemberQuestionPrompt(
        question,
        { memberProfile, recentCheckins: recentCheckins.data, latestPlan: plans.data?.[0], risk },
        language
      )
    );

    const { data, error } = await supabase
      .from("ai_chat_messages")
      .insert({
        user_id: user.id,
        role: "assistant",
        content: answer,
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
        "chat_risk",
        "AI 问答风险提醒",
        risk.review_reason || "Member question requires human review."
      );
    }

    return Response.json({ answer: data, risk });
  } catch (error) {
    return apiError(error);
  }
}
