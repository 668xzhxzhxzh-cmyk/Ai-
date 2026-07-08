"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, BarChart3, ClipboardList, Dumbbell, LineChart, MessageCircle, Moon, ShieldCheck, UserRound, Zap } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { AuthRequiredState, ForbiddenState } from "@/components/auth-required-state";
import { useLanguage } from "@/components/language-provider";
import {
  Button,
  ErrorState,
  InsightCard,
  LoadingState,
  Notice,
  PageHeader,
  PageShell,
  RecoveryScore,
  SectionCard,
  SectionTitle,
  StatCard,
  StatusBadge,
  TextBlock,
  TrainingPlanCard
} from "@/components/ui";
import { apiFetch, getErrorMessage, isForbiddenError, isUnauthorizedError } from "@/lib/client-api";
import type { AiDailyReview, AppProfile, DailyCheckin, MemberProfileInput, NutritionPlan, TrainingPlan, WeeklyReport } from "@/lib/types";

type MePayload = {
  profile: AppProfile | null;
  memberProfile: (MemberProfileInput & { user_id: string }) | null;
  trainingPlans: TrainingPlan[];
  nutritionPlans: NutritionPlan[];
  checkins: DailyCheckin[];
  reviews: AiDailyReview[];
  reports: WeeklyReport[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [data, setData] = useState<MePayload | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    apiFetch<MePayload>("/api/me")
      .then((payload) => {
        setData(payload);
        if (!payload.memberProfile) router.replace("/onboarding");
      })
      .catch((err: Error) => setError(err));
  }, [router]);

  const weekStats = useMemo(() => {
    const recent = [...(data?.checkins || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    const avg = (key: keyof DailyCheckin) =>
      recent.length ? Math.round(recent.reduce((sum, item) => sum + Number(item[key] || 0), 0) / recent.length) : 0;
    const sleep = recent.length ? Number((recent.reduce((sum, item) => sum + Number(item.sleep_hours || 0), 0) / recent.length).toFixed(1)) : 0;
    const fatigue = avg("fatigue_level");
    const pain = avg("pain_level");
    const recovery = Math.max(0, Math.min(100, Math.round(sleep * 10 + avg("diet_completion_rate") * 0.25 + avg("training_completion_rate") * 0.15 - fatigue * 4 - pain * 5)));
    return {
      days: recent.length,
      training: avg("training_completion_rate"),
      diet: avg("diet_completion_rate"),
      sleep,
      fatigue,
      pain,
      recovery
    };
  }, [data]);

  async function generateReport() {
    setLoadingReport(true);
    setError(null);
    try {
      const result = await apiFetch<{ report: WeeklyReport }>("/api/weekly-report", { method: "POST", body: "{}" });
      setData((current) => current ? { ...current, reports: [result.report, ...(current.reports || [])] } : current);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error"));
    } finally {
      setLoadingReport(false);
    }
  }

  const memberName = data?.profile?.name || data?.memberProfile?.name || (zh ? "会员" : "Member");
  const hasRisk = Boolean(data?.reviews?.[0]?.need_human_review || data?.trainingPlans?.[0]?.need_human_review || data?.nutritionPlans?.[0]?.need_human_review);
  const authRequired = isUnauthorizedError(error);
  const forbidden = isForbiddenError(error);

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "会员仪表盘" : "Member dashboard"}
          title={zh ? `${memberName}，今天按状态训练。` : `${memberName}, train to today's readiness.`}
          subtitle={zh ? "把今日训练、恢复状态、饮食执行、打卡反馈和 AI 提醒放在同一屏，方便你知道下一步该做什么。" : "Training, recovery, nutrition, check-ins, and AI reminders stay on one screen so the next move is clear."}
          meta={
            <>
              <StatusBadge tone={data?.trainingPlans?.[0] ? "success" : "warning"}>{data?.trainingPlans?.[0] ? (zh ? "训练计划已就绪" : "Plan ready") : (zh ? "等待计划" : "Plan pending")}</StatusBadge>
              <StatusBadge tone={hasRisk ? "warning" : "success"}>{hasRisk ? (zh ? "有风险提示" : "Risk flagged") : (zh ? "状态稳定" : "Stable")}</StatusBadge>
            </>
          }
          action={
            <Link href="/checkin">
              <Button>
                <ClipboardList className="h-4 w-4" aria-hidden />
                {zh ? "提交今日打卡" : "Submit check-in"}
              </Button>
            </Link>
          }
        />

        {error && !authRequired && !forbidden ? <Notice className="mb-4" tone="danger">{getErrorMessage(error)}</Notice> : null}
        {!data && !error ? <LoadingState title={zh ? "正在整理会员状态" : "Preparing member status"} description={zh ? "读取你的资料、计划、打卡和最近反馈。" : "Loading profile, plans, check-ins, and recent feedback."} /> : null}
        {!data && authRequired ? <AuthRequiredState area={zh ? "会员仪表盘" : "Member dashboard"} /> : null}
        {!data && forbidden ? <ForbiddenState /> : null}
        {!data && error && !authRequired && !forbidden ? <ErrorState title={zh ? "仪表盘加载失败" : "Dashboard failed to load"} description={getErrorMessage(error)} /> : null}

        {data ? (
          <div className="grid gap-4">
            {!data.memberProfile ? (
              <SectionCard accent="lime" className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-lime-100">{t("profileRequired")}</p>
                <Link href="/onboarding">
                  <Button>
                    <UserRound className="h-4 w-4" aria-hidden />
                    {zh ? "填写资料" : "Complete profile"}
                  </Button>
                </Link>
              </SectionCard>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <SectionCard className="grid place-items-center gap-4">
                <RecoveryScore
                  value={weekStats.recovery}
                  label={zh ? "恢复评分" : "Recovery"}
                  tone={weekStats.recovery >= 70 ? "lime" : weekStats.recovery >= 45 ? "amber" : "sky"}
                  status={weekStats.recovery >= 70 ? (zh ? "今天适合正常训练" : "Ready for regular training") : weekStats.recovery >= 45 ? (zh ? "今天控制训练强度" : "Keep intensity controlled") : (zh ? "今天更适合恢复" : "Prioritize recovery today")}
                  description={zh ? "评分来自最近打卡中的睡眠、疲劳、疼痛、训练和饮食执行情况。" : "Score is inferred from recent sleep, fatigue, pain, training, and nutrition check-ins."}
                />
              </SectionCard>

              <TrainingPlanCard
                title={zh ? "今日训练重点" : "Today training focus"}
                subtitle={data.trainingPlans[0]?.created_at ? `${zh ? "最近计划" : "Latest plan"} · ${new Date(data.trainingPlans[0].created_at).toLocaleDateString()}` : (zh ? "先生成训练计划，再按恢复状态执行。" : "Generate a plan first, then execute by readiness.")}
                items={[
                  { name: data.memberProfile?.goal || (zh ? "训练目标" : "Training goal"), meta: data.memberProfile ? `${data.memberProfile.training_days_per_week}${zh ? " 天/周" : " d/w"}` : "-", detail: zh ? "按目标和每周频率安排主训练。" : "Main sessions follow goal and weekly frequency." },
                  { name: zh ? "器械与场地" : "Equipment", meta: data.memberProfile?.equipment || "-", detail: zh ? "动作选择优先匹配你能稳定使用的器械。" : "Exercise choices prioritize equipment you can use consistently.", tone: "info" },
                  { name: zh ? "强度建议" : "Intensity guidance", meta: weekStats.pain >= 4 || weekStats.fatigue >= 7 ? (zh ? "降低" : "Reduce") : "RPE 6-8", detail: zh ? "疼痛或疲劳升高时，减少负荷、组数或动作幅度。" : "If pain or fatigue rises, reduce load, volume, or range.", tone: weekStats.pain >= 4 || weekStats.fatigue >= 7 ? "warning" : "neutral" }
                ]}
                action={
                  <Link href="/plans">
                    <Button variant="secondary">{zh ? "查看计划" : "View plans"}</Button>
                  </Link>
                }
                footer={zh ? "完成训练后提交打卡，AI 会整理当天反馈并为下次调整提供依据。" : "Submit a check-in after training so AI can prepare feedback for the next adjustment."}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={zh ? "本周打卡" : "Check-ins"} value={`${weekStats.days}/7`} hint={zh ? "连续记录越完整，建议越准确" : "More records improve guidance"} tone="lime" icon={ClipboardList} />
              <StatCard label={zh ? "训练完成率" : "Training"} value={`${weekStats.training}%`} hint={zh ? "最近 7 次平均" : "Recent 7 avg"} icon={Zap} />
              <StatCard label={zh ? "饮食执行率" : "Nutrition"} value={`${weekStats.diet}%`} hint={zh ? "影响恢复和体重趋势" : "Impacts recovery and weight"} tone="sky" icon={Apple} />
              <StatCard label={zh ? "平均睡眠" : "Avg sleep"} value={`${weekStats.sleep}h`} hint={zh ? "恢复的底盘" : "Base of recovery"} icon={Moon} />
            </div>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid border-b border-white/10 md:grid-cols-[0.7fr_1.3fr]">
                <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{zh ? "今日决策" : "Today decision"}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-zinc-50">{zh ? "先看恢复，再决定训练负荷。" : "Read recovery before choosing load."}</h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {zh ? "这不是普通后台首页，而是会员每天打开后能直接判断“今天该怎么练”的控制台。" : "This dashboard is built to answer the daily question: how should I train today?"}
                  </p>
                </div>
                <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    [zh ? "1. 恢复" : "1. Recovery", weekStats.recovery >= 70 ? (zh ? "推进" : "Push") : (zh ? "保守" : "Conservative")],
                    [zh ? "2. 训练" : "2. Training", `${weekStats.training}%`],
                    [zh ? "3. 饮食" : "3. Nutrition", `${weekStats.diet}%`]
                  ].map(([label, value]) => (
                    <div key={label} className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                      <p className="mt-3 text-2xl font-semibold text-zinc-50">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <SectionCard>
                <SectionTitle title={zh ? "AI 今日提醒" : "AI insight today"} subtitle={zh ? "基于资料、计划和最近打卡生成，不替代真人教练判断。" : "Based on profile, plans, and recent check-ins. Human coaching still supervises."} />
                <TextBlock className="min-h-40">{data.reviews[0]?.review_content || (zh ? "完成今日打卡后，这里会出现更具体的训练、饮食和恢复反馈。" : "Submit today's check-in to see more specific training, nutrition, and recovery feedback.")}</TextBlock>
              </SectionCard>
              <div className="grid gap-4">
                <InsightCard title={zh ? "饮食建议" : "Nutrition cue"} icon={Apple} tone="info">
                  {data.nutritionPlans[0]?.created_at
                    ? (zh ? "已有饮食建议。今天重点看执行率、饥饿感和睡眠变化。" : "Nutrition guidance is ready. Watch adherence, hunger, and sleep today.")
                    : (zh ? "还没有饮食建议，建议先在计划页生成，再结合打卡执行。" : "No nutrition guidance yet. Generate it from the plans page first.")}
                </InsightCard>
                <InsightCard title={zh ? "风险提示" : "Risk watch"} icon={ShieldCheck} tone={hasRisk || weekStats.pain >= 4 ? "warning" : "success"}>
                  {hasRisk || weekStats.pain >= 4
                    ? (zh ? "最近存在疼痛、疲劳或高风险关键词，训练建议以保守调整为主。" : "Recent pain, fatigue, or risk signals suggest conservative adjustments.")
                    : (zh ? "目前没有明显高风险提醒，继续保持稳定记录。" : "No major risk alert. Keep recording consistently.")}
                </InsightCard>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <QuickLink href="/plans" icon={Dumbbell} title={zh ? "训练与饮食" : "Plans"} text={zh ? "生成或查看当前计划。" : "Build or review plans."} />
              <QuickLink href="/checkin" icon={ClipboardList} title={zh ? "每日打卡" : "Check-in"} text={zh ? "记录执行和恢复。" : "Record execution and recovery."} />
              <QuickLink href="/progress" icon={LineChart} title={t("progress")} text={zh ? "查看趋势和周总结。" : "View trends and weekly review."} tone="sky" />
              <QuickLink href="/chat" icon={MessageCircle} title={t("chat")} text={zh ? "询问训练、饮食和调整。" : "Ask training and nutrition questions."} tone="sky" />
            </div>

            <SectionCard>
              <SectionTitle
                title={t("weeklyReport")}
                subtitle={zh ? "把近期打卡整理成周复盘，用于下周计划调整。" : "Turn recent check-ins into a weekly review for next week's adjustment."}
                action={
                  <Button variant="secondary" disabled={loadingReport} onClick={generateReport}>
                    <BarChart3 className="h-4 w-4" aria-hidden />
                    {loadingReport ? t("loading") : zh ? "整理本周周报" : "Prepare weekly report"}
                  </Button>
                }
              />
              <TextBlock>{data.reports?.[0]?.report_content}</TextBlock>
            </SectionCard>
          </div>
        ) : null}
      </PageShell>
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  text,
  tone = "lime"
}: {
  href: string;
  icon: typeof Dumbbell;
  title: string;
  text: string;
  tone?: "lime" | "sky";
}) {
  return (
    <Link href={href}>
      <SectionCard className={tone === "lime" ? "h-full transition-colors hover:border-lime-300/40" : "h-full transition-colors hover:border-sky-300/40"}>
        <Icon className={tone === "lime" ? "mb-3 h-6 w-6 text-lime-300" : "mb-3 h-6 w-6 text-sky-300"} aria-hidden />
        <h2 className="font-semibold text-zinc-50">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
      </SectionCard>
    </Link>
  );
}
