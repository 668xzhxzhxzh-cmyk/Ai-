"use client";

import { useEffect, useState } from "react";
import { Brain, ClipboardList, Dumbbell, FileText, Send, ShieldAlert, Sparkles, Target } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { useLanguage } from "@/components/language-provider";
import { Button, EmptyState, ErrorState, InsightCard, LoadingState, PageHeader, PageShell, SectionCard, SectionTitle, StatCard, StatusBadge, inputClass } from "@/components/ui";
import { apiFetch } from "@/lib/client-api";
import type { AiChatMessage, DailyCheckin, MemberProfileInput, NutritionPlan, TrainingPlan } from "@/lib/types";

type ChatPayload = {
  chats: AiChatMessage[];
  memberProfile: (MemberProfileInput & { user_id: string }) | null;
  trainingPlans: TrainingPlan[];
  nutritionPlans: NutritionPlan[];
  checkins: DailyCheckin[];
};

export default function ChatPage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [context, setContext] = useState<Omit<ChatPayload, "chats"> | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<ChatPayload>("/api/me")
      .then((payload) => {
        setMessages(payload.chats || []);
        setContext({
          memberProfile: payload.memberProfile,
          trainingPlans: payload.trainingPlans || [],
          nutritionPlans: payload.nutritionPlans || [],
          checkins: payload.checkins || []
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setInitialLoading(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    const text = question;
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          user_id: "",
          role: "user",
          content: text,
          need_human_review: false,
          review_reason: null,
          created_at: new Date().toISOString()
        }
      ]);
      const result = await apiFetch<{ answer: AiChatMessage }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ question: text })
      });
      setMessages((current) => [...current, result.answer]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const profile = context?.memberProfile;
  const latestCheckin = context?.checkins?.[0];

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "AI 教练问答" : "AI coach"}
          title={zh ? "基于你的记录回答，而不是泛泛聊天。" : "Advice based on your records, not generic chat."}
          subtitle={zh ? "AI 会结合你的会员资料、训练计划、饮食建议、每日打卡和目标来整理建议；高风险内容会提示人工跟进。" : "AI uses your profile, training plan, nutrition guidance, check-ins, and goals. Risky topics are flagged for human follow-up."}
          meta={
            <>
              <StatusBadge tone="info">{zh ? "资料上下文" : "Profile context"}</StatusBadge>
              <StatusBadge tone="success">{zh ? "风险感知" : "Risk-aware"}</StatusBadge>
            </>
          }
        />
        {initialLoading ? <LoadingState title={zh ? "正在读取个人上下文" : "Loading personal context"} description={zh ? "整理会员资料、训练计划、饮食建议和最近打卡。" : "Preparing profile, plans, nutrition guidance, and recent check-ins."} /> : null}
        {error && !initialLoading ? <ErrorState title={zh ? "问答加载失败" : "Coach chat failed to load"} description={error} /> : null}
        <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="grid gap-4">
            <SectionCard>
              <SectionTitle title={zh ? "建议基于这些信息" : "Advice uses this context"} />
              <div className="grid gap-3">
                <StatCard label={zh ? "目标" : "Goal"} value={profile?.goal || "-"} hint={profile ? `${profile.training_days_per_week}${zh ? " 天/周" : " d/w"}` : (zh ? "先填写资料" : "Complete profile")} tone="lime" icon={Target} />
                <StatCard label={zh ? "训练计划" : "Training plan"} value={context?.trainingPlans?.[0] ? (zh ? "已生成" : "Ready") : "-"} hint={context?.trainingPlans?.[0]?.created_at ? new Date(context.trainingPlans[0].created_at).toLocaleDateString() : undefined} icon={Dumbbell} />
                <StatCard label={zh ? "最近打卡" : "Latest check-in"} value={latestCheckin?.date || "-"} hint={latestCheckin ? `${zh ? "训练" : "Training"} ${latestCheckin.training_completion_rate}%` : (zh ? "暂无记录" : "No records")} tone="sky" icon={ClipboardList} />
              </div>
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="border-b border-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{zh ? "回答依据" : "Evidence sources"}</p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-50">{zh ? "每次建议都应该有数据来源。" : "Every answer should have a data trail."}</h2>
              </div>
              <div className="grid divide-y divide-white/10">
                {[
                  { icon: Target, label: zh ? "目标与资料" : "Goals and profile", value: profile ? profile.goal : (zh ? "待完善" : "Missing") },
                  { icon: Dumbbell, label: zh ? "训练计划" : "Training plan", value: context?.trainingPlans?.[0] ? (zh ? "已连接" : "Connected") : (zh ? "未生成" : "Missing") },
                  { icon: ClipboardList, label: zh ? "最近打卡" : "Recent check-ins", value: `${context?.checkins?.length || 0}` },
                  { icon: FileText, label: zh ? "饮食建议" : "Nutrition guidance", value: context?.nutritionPlans?.[0] ? (zh ? "已连接" : "Connected") : (zh ? "未生成" : "Missing") }
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm font-medium text-zinc-300">{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-50">{value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <InsightCard title={zh ? "适合提问" : "Good questions"} icon={Brain} tone="neutral">
              <div className="grid gap-2">
                {(zh
                  ? ["今天疲劳高，训练怎么降强度？", "饮食没执行好，下一餐怎么补救？", "膝盖不舒服，有哪些动作替代？"]
                  : ["Fatigue is high. How should I reduce intensity?", "Nutrition slipped. How should I adjust the next meal?", "My knee hurts. What substitutions are safer?"]
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuestion(item)}
                    className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:border-lime-300/30 hover:bg-white/[0.06]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </InsightCard>

            <InsightCard title={zh ? "安全边界" : "Safety boundary"} icon={ShieldAlert} tone="warning">
              {zh ? "涉及胸痛、头晕、呕吐、明显伤病、极端节食等内容时，系统会提示人工跟进，建议以医生或真人教练判断为准。" : "Chest pain, dizziness, vomiting, injuries, and extreme dieting are flagged for human follow-up. Medical or human coaching judgment comes first."}
            </InsightCard>
          </div>

          <SectionCard>
            <SectionTitle title={zh ? "教练反馈流" : "Coach feedback"} subtitle={zh ? "围绕训练执行、饮食结构、恢复状态和动作替代提问。" : "Ask about execution, nutrition, recovery, and substitutions."} action={<StatusBadge tone="info">AI Insight</StatusBadge>} />
            <div className="touch-scroll grid max-h-[58vh] min-h-80 gap-3 overflow-y-auto pr-1">
              {messages.length ? messages.map((item) => (
                <div
                  key={item.id}
                  className={`max-w-[92%] rounded-[1.1rem] border p-3 text-sm leading-6 ${
                    item.role === "user"
                      ? "ml-auto border-lime-300/25 bg-lime-300 text-black"
                      : "border-white/10 bg-black/30 text-zinc-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{item.content}</div>
                  {item.need_human_review ? <p className="mt-2 text-xs font-semibold text-amber-200">{t("needReview")}</p> : null}
                </div>
              )) : initialLoading ? null : (
                <EmptyState
                  title={zh ? "暂无问答记录" : "No messages yet"}
                  description={zh ? "输入训练、饮食或恢复问题，AI 会结合你的会员记录整理建议。" : "Ask about training, nutrition, or recovery. AI will use your member context."}
                />
              )}
              {loading ? (
                <div className="max-w-[92%] rounded-[1.1rem] border border-white/10 bg-black/30 p-3 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-lime-200" aria-hidden />
                    {zh ? "正在结合你的记录整理建议..." : "Preparing advice from your records..."}
                  </div>
                </div>
              ) : null}
            </div>
            <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={submit}>
              <input
                className={`${inputClass} flex-1`}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={zh ? "输入你的训练、饮食或恢复问题..." : "Ask about training, nutrition, or recovery..."}
              />
              <Button disabled={loading} className="w-full sm:w-auto">
                <Send className="h-4 w-4" aria-hidden />
                {loading ? t("loading") : t("submit")}
              </Button>
            </form>
          </SectionCard>
        </div>
      </PageShell>
    </>
  );
}
