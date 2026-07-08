"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Apple, ClipboardCheck, Dumbbell, RefreshCw, ShieldCheck, Utensils } from "lucide-react";
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
  SectionCard,
  SectionTitle,
  StatCard,
  StatusBadge,
  TextBlock,
  TrainingPlanCard
} from "@/components/ui";
import { apiFetch, getErrorMessage, isForbiddenError, isUnauthorizedError } from "@/lib/client-api";
import type { MemberProfileInput, NutritionPlan, TrainingPlan } from "@/lib/types";

type PlansPayload = {
  memberProfile: (MemberProfileInput & { user_id: string }) | null;
  trainingPlans: TrainingPlan[];
  nutritionPlans: NutritionPlan[];
};

export default function PlansPage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [data, setData] = useState<PlansPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<"training" | "nutrition" | null>(null);

  async function load() {
    setMessage("");
    setLoadError(null);
    try {
      setData(await apiFetch<PlansPayload>("/api/me"));
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error("Error"));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function generateTraining() {
    setLoading("training");
    setMessage("");
    try {
      const result = await apiFetch<{ trainingPlan: TrainingPlan; risk: { need_human_review: boolean; review_reason: string | null } }>(
        "/api/generate-training-plan",
        { method: "POST", body: "{}" }
      );
      setData((current) => current ? { ...current, trainingPlans: [result.trainingPlan, ...current.trainingPlans] } : current);
      setMessage(result.risk.need_human_review ? `${t("needReview")}: ${result.risk.review_reason}` : zh ? "训练计划已制定并保存。" : "Training plan built and saved.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  async function generateNutrition() {
    setLoading("nutrition");
    setMessage("");
    try {
      const result = await apiFetch<{ nutritionPlan: NutritionPlan; risk: { need_human_review: boolean; review_reason: string | null } }>(
        "/api/generate-nutrition-plan",
        { method: "POST", body: "{}" }
      );
      setData((current) => current ? { ...current, nutritionPlans: [result.nutritionPlan, ...current.nutritionPlans] } : current);
      setMessage(result.risk.need_human_review ? `${t("needReview")}: ${result.risk.review_reason}` : zh ? "饮食建议已制定并保存。" : "Nutrition guidance built and saved.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  const profile = data?.memberProfile;
  const riskTone = profile && (profile.pain_level >= 4 || profile.has_injury) ? "warning" : "success";
  const authRequired = isUnauthorizedError(loadError);
  const forbidden = isForbiddenError(loadError);

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "训练与饮食计划" : "Plans"}
          title={zh ? "把 AI 计划变成可执行的训练处方。" : "Turn AI output into an executable coaching prescription."}
          subtitle={zh ? "训练计划强调动作、组数、次数、RPE、器械和下次调整；饮食建议强调执行结构和恢复支持。" : "Training plans emphasize exercises, sets, reps, RPE, equipment, and next adjustments. Nutrition supports execution and recovery."}
          meta={
            <>
              <StatusBadge tone={data?.trainingPlans?.[0] ? "success" : "warning"}>{data?.trainingPlans?.[0] ? (zh ? "训练已生成" : "Training ready") : (zh ? "待生成训练" : "Training pending")}</StatusBadge>
              <StatusBadge tone={data?.nutritionPlans?.[0] ? "success" : "info"}>{data?.nutritionPlans?.[0] ? (zh ? "饮食已生成" : "Nutrition ready") : (zh ? "待生成饮食" : "Nutrition pending")}</StatusBadge>
            </>
          }
        />
        {message ? <Notice className="mb-4" tone={message === "DeepSeek API 未配置" ? "danger" : message.includes(t("needReview")) ? "warning" : "success"}>{message}</Notice> : null}
        {!data && !loadError ? <LoadingState title={zh ? "正在读取计划档案" : "Loading plan profile"} description={zh ? "整理会员资料、训练计划和饮食建议。" : "Preparing profile, training plans, and nutrition guidance."} /> : null}
        {!data && authRequired ? <AuthRequiredState area={zh ? "训练与饮食计划" : "Plans"} /> : null}
        {!data && forbidden ? <ForbiddenState /> : null}
        {!data && loadError && !authRequired && !forbidden ? <ErrorState title={zh ? "计划加载失败" : "Plans failed to load"} description={getErrorMessage(loadError)} /> : null}
        {data && !profile ? (
          <SectionCard className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-300">{t("profileRequired")}</p>
            <Link href="/onboarding">
              <Button>{zh ? "先填写资料" : "Complete onboarding"}</Button>
            </Link>
          </SectionCard>
        ) : null}
        {profile ? (
          <div className="grid gap-4">
            <SectionCard accent="lime">
              <SectionTitle
                title={zh ? "计划档案" : "Plan profile"}
                subtitle={zh ? "系统会围绕这些信息制定训练和饮食建议。" : "The system builds training and nutrition around these signals."}
                action={<StatusBadge tone={riskTone}>{riskTone === "warning" ? (zh ? "需保守调整" : "Conservative") : profile.goal}</StatusBadge>}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label={zh ? "每周训练" : "Days/week"} value={`${profile.training_days_per_week}D`} hint={`${profile.training_time_per_session}m ${zh ? "每次" : "session"}`} tone="lime" icon={Activity} />
                <StatCard label={zh ? "器械" : "Equipment"} value={profile.equipment || "-"} hint={zh ? "动作选择依据" : "Exercise selection"} icon={Dumbbell} />
                <StatCard label={zh ? "训练经验" : "Experience"} value={profile.experience || "-"} hint={zh ? "影响动作复杂度" : "Affects complexity"} tone="sky" icon={ClipboardCheck} />
                <StatCard label={zh ? "疼痛等级" : "Pain"} value={`${profile.pain_level}/10`} hint={profile.has_injury ? (zh ? "有伤病" : "Injury noted") : (zh ? "无伤病" : "No injury")} tone={profile.pain_level >= 4 ? "amber" : "neutral"} icon={ShieldCheck} />
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <TrainingPlanCard
                title={t("trainingPlan")}
                subtitle={data.trainingPlans[0]?.created_at ? `${zh ? "最近制定" : "Latest"} · ${new Date(data.trainingPlans[0].created_at).toLocaleString()}` : (zh ? "还没有训练计划。" : "No training plan yet.")}
                action={
                  <Button disabled={loading !== null} onClick={generateTraining}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    {loading === "training" ? t("loading") : zh ? "制定训练计划" : "Build training"}
                  </Button>
                }
                items={[
                  { name: zh ? "动作选择" : "Exercise selection", meta: profile.equipment || "-", detail: zh ? "优先使用你能稳定执行和记录的器械。" : "Prioritizes equipment you can execute and track consistently." },
                  { name: zh ? "组数 / 次数" : "Sets / reps", meta: "3-5 x 6-12", detail: zh ? "主项偏力量，辅助项偏肌肉控制和容量。" : "Primary lifts bias strength; accessories bias control and volume.", tone: "info" },
                  { name: "RPE", meta: profile.pain_level >= 4 ? "5-6" : "6-8", detail: zh ? "根据疼痛、疲劳和完成率决定是否进入渐进超负荷。" : "Progression depends on pain, fatigue, and completion.", tone: profile.pain_level >= 4 ? "warning" : "neutral" }
                ]}
                footer={zh ? "训练反馈重点：是否完成、哪组最吃力、是否有疼痛、下次是否能加重量或加次数。" : "Feedback focus: completion, hardest set, pain, and whether load or reps can increase next time."}
              />

              <SectionCard>
                <SectionTitle
                  title={t("nutritionPlan")}
                  subtitle={data.nutritionPlans[0]?.created_at ? `${zh ? "最近制定" : "Latest"} · ${new Date(data.nutritionPlans[0].created_at).toLocaleString()}` : (zh ? "还没有饮食建议。" : "No nutrition guidance yet.")}
                  action={
                    <Button disabled={loading !== null} onClick={generateNutrition}>
                      <Utensils className="h-4 w-4" aria-hidden />
                      {loading === "nutrition" ? t("loading") : zh ? "制定饮食建议" : "Build nutrition"}
                    </Button>
                  }
                />
                <div className="grid gap-3">
                  <InsightCard title={zh ? "执行重点" : "Execution focus"} icon={Apple} tone="info">
                    {zh ? "饮食建议要服务训练恢复：稳定蛋白质、控制总热量、记录饥饿感和睡眠变化。" : "Nutrition should support recovery: stable protein, controlled calories, hunger and sleep tracking."}
                  </InsightCard>
                  <TextBlock>{data.nutritionPlans[0]?.plan_content}</TextBlock>
                </div>
              </SectionCard>
            </div>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-200">{zh ? "训练周期" : "Training cycle"}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-zinc-50">{zh ? "不是一次计划，而是一周一调整。" : "Not one plan. A weekly adjustment loop."}</h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {zh ? "参考 Fitbod、Tonal、JuggernautAI 的逻辑，把动作处方、恢复反馈和下次调整放在同一条周期里。" : "Inspired by Fitbod, Tonal, and JuggernautAI: exercise prescription, recovery feedback, and next adjustment sit in one cycle."}
                  </p>
                </div>
                <div className="grid divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
                  {[
                    [zh ? "动作" : "Exercise", zh ? "匹配器械" : "Equipment"],
                    [zh ? "容量" : "Volume", "3-5 x 6-12"],
                    [zh ? "强度" : "Intensity", profile.pain_level >= 4 ? "RPE 5-6" : "RPE 6-8"],
                    [zh ? "调整" : "Adjust", zh ? "看反馈" : "By feedback"]
                  ].map(([label, value]) => (
                    <div key={label} className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                      <p className="mt-3 text-lg font-semibold text-zinc-50">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <SectionTitle title={zh ? "训练计划原文" : "Training plan details"} subtitle={zh ? "保留完整 AI 输出，便于你按原文执行或发给教练复盘。" : "Full AI output is preserved for execution and coach review."} />
              <TextBlock>{data.trainingPlans[0]?.plan_content}</TextBlock>
            </SectionCard>
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
