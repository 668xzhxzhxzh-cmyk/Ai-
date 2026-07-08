"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Dumbbell, MessageCircle, RefreshCw, ShieldAlert, Utensils } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { useLanguage } from "@/components/language-provider";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  MemberRiskBadge,
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
import { apiFetch } from "@/lib/client-api";
import type {
  AdminTask,
  AiChatMessage,
  AiDailyReview,
  AppProfile,
  DailyCheckin,
  MemberProfileInput,
  NutritionPlan,
  TrainingPlan,
  WeeklyReport
} from "@/lib/types";

type MemberProfileRow = MemberProfileInput & { id: string; user_id: string; updated_at: string };
type DetailPayload = {
  profile: AppProfile | null;
  memberProfile: MemberProfileRow | null;
  checkins: DailyCheckin[];
  trainingPlans: TrainingPlan[];
  nutritionPlans: NutritionPlan[];
  reviews: AiDailyReview[];
  reports: WeeklyReport[];
  chats: AiChatMessage[];
  tasks: AdminTask[];
};

export default function AdminMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [data, setData] = useState<DetailPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setMessage("");
    try {
      setData(await apiFetch<DetailPayload>(`/api/admin/members/${params.id}`));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function adjustNextWeek() {
    setLoading(true);
    setMessage("");
    try {
      await apiFetch("/api/adjust-next-week", { method: "POST", body: JSON.stringify({ userId: params.id }) });
      await load();
      setMessage(zh ? "下周计划已制定。" : "Next week plan prepared.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const latest = data?.checkins?.[0];
  const openTasks = data?.tasks.filter((task) => task.status === "open") || [];
  const hasRisk = openTasks.length > 0 || Boolean(data?.reviews?.[0]?.need_human_review);
  const profileRows = useMemo(() => {
    if (!data?.memberProfile) return [];
    return [
      [zh ? "姓名" : "Name", data.profile?.name || data.memberProfile.name || "-"],
      [zh ? "目标" : "Goal", data.memberProfile.goal],
      [zh ? "年龄 / 性别" : "Age / gender", `${data.memberProfile.age} / ${data.memberProfile.gender}`],
      [zh ? "身高 / 体重" : "Height / weight", `${data.memberProfile.height} cm / ${data.memberProfile.weight} kg`],
      [zh ? "目标体重" : "Target weight", `${data.memberProfile.target_weight} kg`],
      [zh ? "训练经验" : "Experience", data.memberProfile.experience],
      [zh ? "训练频率" : "Frequency", `${data.memberProfile.training_days_per_week}${zh ? " 天/周" : " d/w"} · ${data.memberProfile.training_time_per_session}m`],
      [zh ? "器械" : "Equipment", data.memberProfile.equipment],
      [zh ? "饮食偏好" : "Diet preference", data.memberProfile.diet_preference || "-"],
      [zh ? "忌口" : "Restrictions", data.memberProfile.food_restrictions || "-"],
      [zh ? "作息" : "Schedule", data.memberProfile.schedule || "-"],
      [zh ? "伤病 / 疼痛" : "Injury / pain", `${data.memberProfile.has_injury ? (zh ? "有" : "Yes") : (zh ? "无" : "No")} · ${data.memberProfile.pain_level}/10`]
    ];
  }, [data, zh]);

  return (
    <>
      <AppNav />
      <PageShell>
        <div className="mb-4">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-lime-200">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {zh ? "返回管理员后台" : "Back to admin"}
          </Link>
        </div>

        <PageHeader
          eyebrow={zh ? "会员详情" : "Member detail"}
          title={data?.profile?.name || (zh ? "会员详情" : "Member detail")}
          subtitle={data?.profile?.user_id || params.id}
          meta={
            <>
              <MemberRiskBadge hasRisk={hasRisk} label={hasRisk ? t("needReview") : undefined} />
              <StatusBadge tone={latest ? "info" : "warning"}>{latest ? `${zh ? "最近打卡" : "Last check-in"} ${latest.date}` : (zh ? "暂无打卡" : "No check-in")}</StatusBadge>
            </>
          }
          action={
            <Button variant="secondary" disabled={loading} onClick={adjustNextWeek}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              {loading ? t("loading") : zh ? "制定下周计划" : "Adjust next week"}
            </Button>
          }
        />

        {message ? <Notice className="mb-4" tone={message.includes("Error") ? "danger" : "success"}>{message}</Notice> : null}
        {!data && !message ? <LoadingState title={zh ? "正在读取会员档案" : "Loading member record"} description={zh ? "整理会员资料、计划、打卡、AI 分析和风险任务。" : "Preparing profile, plans, check-ins, AI reviews, and risk tasks."} /> : null}
        {!data && message ? <ErrorState title={zh ? "会员详情加载失败" : "Member detail failed to load"} description={message} /> : null}

        {data ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={zh ? "目标" : "Goal"} value={data.memberProfile?.goal || "-"} hint={zh ? "会员主线" : "Member focus"} tone="lime" />
              <StatCard label={zh ? "最近训练" : "Latest training"} value={latest ? `${latest.training_completion_rate}%` : "-"} hint={latest?.date} />
              <StatCard label={zh ? "睡眠" : "Sleep"} value={latest ? `${latest.sleep_hours}h` : "-"} hint={zh ? "最近打卡" : "Latest check-in"} tone="sky" />
              <StatCard label={zh ? "风险任务" : "Risk tasks"} value={openTasks.length} hint={zh ? "待处理" : "Open"} tone={openTasks.length ? "amber" : "neutral"} />
            </div>

            <SectionCard className="overflow-hidden p-0">
              <div className="border-b border-white/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{zh ? "教练复盘线" : "Coach review trail"}</p>
                <h2 className="mt-2 text-xl font-semibold text-zinc-50">{zh ? "从资料到下周调整，一眼看清会员状态。" : "From profile to next adjustment, the member state stays visible."}</h2>
              </div>
              <div className="grid divide-y divide-white/10 md:grid-cols-5 md:divide-x md:divide-y-0">
                {[
                  [zh ? "资料" : "Profile", data.memberProfile ? (zh ? "完整" : "Ready") : (zh ? "缺失" : "Missing")],
                  [zh ? "计划" : "Plan", data.trainingPlans[0] ? (zh ? "已生成" : "Ready") : (zh ? "未生成" : "Missing")],
                  [zh ? "打卡" : "Check-in", latest?.date || "-"],
                  [zh ? "风险" : "Risk", hasRisk ? (zh ? "需跟进" : "Watch") : "OK"],
                  [zh ? "下步" : "Next", zh ? "调整计划" : "Adjust"]
                ].map(([label, value]) => (
                  <div key={label} className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-50">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="grid gap-4">
                <SectionCard>
                  <SectionTitle title={zh ? "会员画像" : "Member profile"} subtitle={zh ? "用于训练、饮食和风险判断的核心资料。" : "Core context for training, nutrition, and risk decisions."} />
                  {profileRows.length ? (
                    <dl className="grid gap-2 text-sm text-zinc-300">
                      {profileRows.map(([key, value]) => (
                        <div key={key} className="grid gap-1 border-b border-white/10 py-2 sm:grid-cols-[130px_1fr] sm:gap-2">
                          <dt className="font-medium text-zinc-500">{key}</dt>
                          <dd className="break-words">{String(value ?? "-")}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : <EmptyState title={zh ? "暂无会员资料" : "No profile"} />}
                </SectionCard>

                <SectionCard accent={openTasks.length ? "amber" : "neutral"}>
                  <SectionTitle title={t("adminTasks")} action={<ShieldAlert className="h-5 w-5 text-amber-200" aria-hidden />} />
                  <div className="grid gap-2">
                    {data.tasks.length ? data.tasks.map((task) => (
                      <div key={task.id} className={`rounded-[1.1rem] border p-3 text-sm ${task.status === "open" ? "border-amber-300/25 bg-amber-300/10" : "border-white/10 bg-black/25"}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="font-semibold text-zinc-50">{task.title}</div>
                          <StatusBadge tone={task.status === "open" ? "warning" : "success"}>{task.status}</StatusBadge>
                        </div>
                        <p className="mt-2 leading-6 text-zinc-400">{task.description}</p>
                        <p className="mt-2 text-xs text-zinc-600">{new Date(task.created_at).toLocaleString()}</p>
                      </div>
                    )) : <EmptyState title={zh ? "暂无风险提醒" : "No risk alerts"} />}
                  </div>
                </SectionCard>
              </div>

              <div className="grid gap-4">
                <TrainingPlanCard
                  title={t("trainingPlan")}
                  subtitle={data.trainingPlans[0]?.created_at ? new Date(data.trainingPlans[0].created_at).toLocaleString() : (zh ? "暂无训练计划" : "No training plan")}
                  items={[
                    { name: zh ? "当前目标" : "Current goal", meta: data.memberProfile?.goal || "-", detail: zh ? "计划应围绕目标、疼痛和可用器械调整。" : "Plan should adapt to goal, pain, and available equipment." },
                    { name: zh ? "执行反馈" : "Execution feedback", meta: latest ? `${latest.training_completion_rate}%` : "-", detail: zh ? "结合最近打卡判断是否递增或降负荷。" : "Use latest check-ins to decide progression or deload.", tone: "info" },
                    { name: zh ? "风险约束" : "Risk constraint", meta: hasRisk ? (zh ? "需关注" : "Watch") : "OK", detail: zh ? "疼痛、疲劳和高风险关键词会影响训练建议。" : "Pain, fatigue, and risk keywords affect guidance.", tone: hasRisk ? "warning" : "neutral" }
                  ]}
                />

                <SectionCard>
                  <SectionTitle title={zh ? "完整训练计划" : "Full training plan"} action={<Dumbbell className="h-5 w-5 text-lime-200" aria-hidden />} />
                  <TextBlock>{data.trainingPlans[0]?.plan_content}</TextBlock>
                </SectionCard>

                <SectionCard>
                  <SectionTitle title={t("nutritionPlan")} action={<Utensils className="h-5 w-5 text-sky-200" aria-hidden />} />
                  <TextBlock>{data.nutritionPlans[0]?.plan_content}</TextBlock>
                </SectionCard>

                <SectionCard>
                  <SectionTitle title={zh ? "每日打卡记录" : "Daily check-ins"} action={<ClipboardList className="h-5 w-5 text-zinc-300" aria-hidden />} />
                  <div className="grid gap-2">
                    {data.checkins.length ? data.checkins.slice(0, 14).map((item) => (
                      <div key={item.id} className="rounded-[1.1rem] border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-zinc-50">{item.date}</span>
                          <StatusBadge tone={item.pain_level >= 4 || item.fatigue_level >= 8 ? "warning" : "success"}>
                            {item.pain_level >= 4 || item.fatigue_level >= 8 ? (zh ? "需关注" : "Watch") : "OK"}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 leading-6">
                          weight {item.weight || "-"} · train {item.training_completion_rate}% · diet {item.diet_completion_rate}% · sleep {item.sleep_hours}h · fatigue {item.fatigue_level} · pain {item.pain_level}
                        </p>
                      </div>
                    )) : <EmptyState title={zh ? "暂无打卡" : "No check-ins"} />}
                  </div>
                </SectionCard>

                <div className="grid gap-4 lg:grid-cols-2">
                  <SectionCard><SectionTitle title={t("dailyReview")} /><TextBlock>{data.reviews[0]?.review_content}</TextBlock></SectionCard>
                  <SectionCard><SectionTitle title={t("weeklyReport")} /><TextBlock>{data.reports[0]?.report_content}</TextBlock></SectionCard>
                </div>

                <SectionCard>
                  <SectionTitle title={zh ? "聊天记录" : "Chat records"} action={<MessageCircle className="h-5 w-5 text-sky-200" aria-hidden />} />
                  <div className="grid gap-2">
                    {data.chats.length ? data.chats.slice(0, 24).map((item) => (
                      <div key={item.id} className={`rounded-[1.1rem] border p-3 text-sm leading-6 ${item.role === "user" ? "border-lime-300/20 bg-lime-300/10 text-lime-50" : "border-white/10 bg-black/25 text-zinc-300"}`}>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{item.role}</div>
                        <div className="whitespace-pre-wrap">{item.content}</div>
                      </div>
                    )) : <EmptyState title={zh ? "暂无聊天" : "No chat records"} />}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
