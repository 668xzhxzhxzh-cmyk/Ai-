"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Search, UsersRound } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { useLanguage } from "@/components/language-provider";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  MemberRiskBadge,
  PageHeader,
  PageShell,
  SectionCard,
  SectionTitle,
  StatCard,
  StatusBadge,
  TextBlock,
  inputClass
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
type AdminPayload = {
  profiles: AppProfile[];
  memberProfiles: MemberProfileRow[];
  checkins: DailyCheckin[];
  trainingPlans: TrainingPlan[];
  nutritionPlans: NutritionPlan[];
  reviews: AiDailyReview[];
  reports: WeeklyReport[];
  chats: AiChatMessage[];
  tasks: AdminTask[];
};

export default function AdminPage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [data, setData] = useState<AdminPayload | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "risk" | "stale">("all");

  async function load() {
    setError("");
    try {
      const payload = await apiFetch<AdminPayload>("/api/admin/overview");
      setData(payload);
      setSelectedUserId((current) => current || payload.profiles.find((item) => item.role === "member")?.user_id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => {
    if (!data || !selectedUserId) return null;
    return {
      profile: data.profiles.find((item) => item.user_id === selectedUserId),
      memberProfile: data.memberProfiles.find((item) => item.user_id === selectedUserId),
      checkins: data.checkins.filter((item) => item.user_id === selectedUserId),
      trainingPlan: data.trainingPlans.find((item) => item.user_id === selectedUserId),
      nutritionPlan: data.nutritionPlans.find((item) => item.user_id === selectedUserId),
      reviews: data.reviews.filter((item) => item.user_id === selectedUserId),
      reports: data.reports.filter((item) => item.user_id === selectedUserId),
      chats: data.chats.filter((item) => item.user_id === selectedUserId),
      tasks: data.tasks.filter((item) => item.user_id === selectedUserId)
    };
  }, [data, selectedUserId]);

  async function resolveTask(id: string) {
    await apiFetch("/api/admin/tasks", { method: "PATCH", body: JSON.stringify({ id, status: "resolved" }) });
    await load();
  }

  async function adjustNextWeek(userId: string) {
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/adjust-next-week", { method: "POST", body: JSON.stringify({ userId }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const members = data?.profiles.filter((item) => item.role === "member") || [];
  const openTasks = data?.tasks.filter((item) => item.status === "open") || [];
  const now = Date.now();
  const latestCheckinFor = (userId: string) => data?.checkins.find((item) => item.user_id === userId);
  const staleMembers = members.filter((profile) => {
    const latest = latestCheckinFor(profile.user_id);
    if (!latest) return true;
    return now - new Date(latest.date).getTime() > 2 * 24 * 60 * 60 * 1000;
  });
  const visibleMembers = members.filter((profile) => {
    const keyword = query.trim().toLowerCase();
    const memberProfile = data?.memberProfiles.find((item) => item.user_id === profile.user_id);
    const hasRisk = openTasks.some((task) => task.user_id === profile.user_id);
    const isStale = staleMembers.some((item) => item.user_id === profile.user_id);
    const matchesKeyword = !keyword || [profile.name, profile.user_id, memberProfile?.goal].some((value) => String(value || "").toLowerCase().includes(keyword));
    const matchesStatus = statusFilter === "all" || (statusFilter === "risk" && hasRisk) || (statusFilter === "stale" && isStale);
    return matchesKeyword && matchesStatus;
  });

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "教练工作台" : "Coach console"}
          title={zh ? "会员状态、风险和跟进任务集中处理。" : "Manage member status, risks, and follow-ups in one console."}
          subtitle={zh ? "快速查看谁需要人工关注、谁连续未打卡、谁可以进入下周计划调整。" : "Quickly see who needs human attention, who missed check-ins, and who is ready for next-week adjustments."}
          meta={
            <>
              <StatusBadge tone="success">{members.length} {zh ? "位会员" : "members"}</StatusBadge>
              <StatusBadge tone={openTasks.length ? "warning" : "success"}>{openTasks.length} {zh ? "个风险" : "risks"}</StatusBadge>
            </>
          }
        />
        {error ? <ErrorState title={zh ? "后台加载失败" : "Admin failed to load"} description={error} /> : null}
        {!data && !error ? <LoadingState title={zh ? "正在读取教练工作台" : "Loading coach console"} description={zh ? "整理会员列表、风险任务、打卡和计划状态。" : "Preparing members, risk tasks, check-ins, and plan status."} /> : null}
        {data ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label={zh ? "会员总数" : "Members"} value={members.length} hint={zh ? "当前会员账号" : "Active member records"} tone="lime" icon={UsersRound} />
              <StatCard label={zh ? "待跟进风险" : "Open risks"} value={openTasks.length} hint={zh ? "需要人工处理" : "Needs human review"} tone={openTasks.length ? "amber" : "neutral"} icon={AlertTriangle} />
              <StatCard label={zh ? "未打卡提醒" : "Missed check-ins"} value={staleMembers.length} hint={zh ? "超过 2 天未记录" : "No record for 2+ days"} tone="sky" icon={Clock3} />
            </div>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
                {[
                  [zh ? "队列" : "Queue", zh ? "筛选会员" : "Filter members"],
                  [zh ? "风险" : "Risk", openTasks.length ? `${openTasks.length} open` : "Clear"],
                  [zh ? "跟进" : "Follow-up", staleMembers.length ? `${staleMembers.length}` : "0"],
                  [zh ? "计划" : "Plans", zh ? "下周调整" : "Next week"]
                ].map(([label, value]) => (
                  <div key={label} className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-50">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <SectionCard>
                <SectionTitle
                  title={t("memberList")}
                  subtitle={zh ? "按姓名、目标或状态快速定位需要跟进的人。" : "Find members by name, goal, or follow-up status."}
                />
                <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                    <input
                      className={`${inputClass} pl-9`}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={zh ? "搜索会员、目标或 ID" : "Search member, goal, or ID"}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:flex">
                    {[
                      ["all", zh ? "全部" : "All"],
                      ["risk", zh ? "风险" : "Risk"],
                      ["stale", zh ? "未打卡" : "Stale"]
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatusFilter(value as "all" | "risk" | "stale")}
                        className={`min-h-11 rounded-full border px-3 text-sm font-semibold transition-colors ${
                          statusFilter === value ? "border-lime-300 bg-lime-300 text-black" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-zinc-500">
                      <tr>
                        <th className="py-3">Name</th>
                        <th>Goal</th>
                        <th>Weight</th>
                        <th>Last check-in</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMembers.map((profile) => {
                        const memberProfile = data.memberProfiles.find((item) => item.user_id === profile.user_id);
                        const latest = latestCheckinFor(profile.user_id);
                        const hasRisk = openTasks.some((task) => task.user_id === profile.user_id);
                        const isStale = staleMembers.some((item) => item.user_id === profile.user_id);
                        return (
                          <tr key={profile.user_id} className="border-b border-white/8 text-zinc-300">
                            <td className="py-4">
                              <button type="button" onClick={() => setSelectedUserId(profile.user_id)} className="text-left font-semibold text-zinc-50 hover:text-lime-200">
                                {profile.name || profile.user_id.slice(0, 8)}
                              </button>
                              <p className="mt-1 text-xs text-zinc-600">{profile.user_id.slice(0, 12)}</p>
                            </td>
                            <td>{memberProfile?.goal || "-"}</td>
                            <td>{latest?.weight || memberProfile?.weight || "-"}</td>
                            <td>{latest?.date || "-"}</td>
                            <td><MemberRiskBadge hasRisk={hasRisk} stale={isStale} label={hasRisk ? t("needReview") : undefined} /></td>
                            <td>
                              <Link href={`/admin/members/${profile.user_id}`}>
                                <Button variant="secondary" className="min-h-9 px-3">
                                  {zh ? "详情" : "Details"}
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!visibleMembers.length ? <EmptyState title={zh ? "没有匹配会员" : "No matching members"} description={zh ? "调整搜索或筛选条件。" : "Adjust search or filters."} /> : null}
                </div>

                <div className="grid gap-3 md:hidden">
                  {visibleMembers.map((profile) => {
                    const memberProfile = data.memberProfiles.find((item) => item.user_id === profile.user_id);
                    const latest = latestCheckinFor(profile.user_id);
                    const hasRisk = openTasks.some((task) => task.user_id === profile.user_id);
                    const isStale = staleMembers.some((item) => item.user_id === profile.user_id);
                    return (
                      <div key={profile.user_id} className="rounded-[1.15rem] border border-white/10 bg-black/25 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <button type="button" onClick={() => setSelectedUserId(profile.user_id)} className="text-left">
                            <h3 className="font-semibold text-zinc-50">{profile.name || profile.user_id.slice(0, 8)}</h3>
                            <p className="mt-1 text-sm text-zinc-500">{memberProfile?.goal || "-"} · {latest?.date || (zh ? "暂无打卡" : "No check-in")}</p>
                          </button>
                          <MemberRiskBadge hasRisk={hasRisk} stale={isStale} label={hasRisk ? t("needReview") : undefined} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-400">
                          <span>{zh ? "体重" : "Weight"}: {latest?.weight || memberProfile?.weight || "-"}</span>
                          <span>{zh ? "目标" : "Goal"}: {memberProfile?.target_weight || "-"}</span>
                        </div>
                        <Link href={`/admin/members/${profile.user_id}`} className="mt-3 block">
                          <Button variant="secondary" className="w-full">
                            {zh ? "查看详情" : "Details"}
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <div className="grid gap-4">
                <SectionCard accent={openTasks.length ? "amber" : "neutral"}>
                  <SectionTitle title={t("risk")} subtitle={`${openTasks.length} open`} />
                  <div className="grid max-h-96 gap-3 overflow-y-auto">
                    {openTasks.length ? openTasks.map((task) => (
                      <div key={task.id} className="rounded-[1.1rem] border border-amber-300/25 bg-amber-300/10 p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-amber-100">{task.title}</div>
                          <StatusBadge tone="warning">{task.status}</StatusBadge>
                        </div>
                        <p className="mt-2 leading-6 text-amber-100/78">{task.description}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Link className="text-xs font-semibold text-zinc-200 hover:text-lime-200" href={`/admin/members/${task.user_id}`}>
                            {zh ? "查看会员" : "View member"}
                          </Link>
                          <Button variant="secondary" className="min-h-8 px-3 text-xs" onClick={() => resolveTask(task.id)}>
                            {zh ? "已处理" : "Resolve"}
                          </Button>
                        </div>
                      </div>
                    )) : <EmptyState title={zh ? "暂无未处理风险" : "No open risk alerts"} description={zh ? "会员风险信号会显示在这里。" : "Member risk signals appear here."} />}
                  </div>
                </SectionCard>

                <SectionCard>
                  <SectionTitle title={zh ? "未打卡提醒" : "Missed check-ins"} subtitle={`${staleMembers.length}`} />
                  <div className="flex flex-wrap gap-2">
                    {staleMembers.length ? staleMembers.map((profile) => (
                      <button
                        key={profile.user_id}
                        type="button"
                        className="min-h-10 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-zinc-300 hover:bg-white/[0.08]"
                        onClick={() => setSelectedUserId(profile.user_id)}
                      >
                        {profile.name || profile.user_id.slice(0, 8)}
                      </button>
                    )) : <p className="text-sm text-zinc-500">{zh ? "暂无连续未打卡会员。" : "No stale members."}</p>}
                  </div>
                </SectionCard>
              </div>
            </div>

            {selected ? (
              <SectionCard>
                <SectionTitle
                  title={selected.profile?.name || (zh ? "会员快照" : "Member snapshot")}
                  subtitle={selected.profile?.user_id}
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" disabled={loading} onClick={() => adjustNextWeek(selectedUserId)}>
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        {zh ? "制定下周计划" : "Adjust next week"}
                      </Button>
                      <Link href={`/admin/members/${selectedUserId}`}>
                        <Button>{zh ? "打开详情" : "Open detail"}</Button>
                      </Link>
                    </div>
                  }
                />
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="grid gap-3 sm:grid-cols-3 lg:col-span-3">
                    <StatCard label={zh ? "目标" : "Goal"} value={selected.memberProfile?.goal || "-"} hint={selected.memberProfile ? `${selected.memberProfile.training_days_per_week}${zh ? " 天/周" : " d/w"}` : undefined} tone="lime" />
                    <StatCard label={zh ? "最近打卡" : "Last check-in"} value={selected.checkins[0]?.date || "-"} hint={selected.checkins[0] ? `${zh ? "训练" : "Training"} ${selected.checkins[0].training_completion_rate}%` : undefined} tone="sky" />
                    <StatCard label={zh ? "任务" : "Tasks"} value={selected.tasks.filter((task) => task.status === "open").length} hint={zh ? "待处理" : "Open"} tone={selected.tasks.some((task) => task.status === "open") ? "amber" : "neutral"} />
                  </div>
                  <div className="lg:col-span-2">
                    <SectionTitle title={t("trainingPlan")} />
                    <TextBlock>{selected.trainingPlan?.plan_content}</TextBlock>
                  </div>
                  <div>
                    <SectionTitle title={t("latestAdvice")} />
                    <TextBlock>{selected.reviews[0]?.review_content}</TextBlock>
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>
        ) : null}
      </PageShell>
    </>
  );
}
