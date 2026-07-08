"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Moon, Scale, Sparkles, TrendingUp } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { useLanguage } from "@/components/language-provider";
import { ProgressCharts } from "@/components/progress-charts";
import { ErrorState, InsightCard, LoadingState, Notice, PageHeader, PageShell, RecoveryScore, SectionCard, SectionTitle, StatCard, TextBlock } from "@/components/ui";
import { apiFetch } from "@/lib/client-api";
import type { DailyCheckin, WeeklyReport } from "@/lib/types";

export default function ProgressPage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ checkins: DailyCheckin[]; reports: WeeklyReport[] }>("/api/me")
      .then((payload) => {
        setCheckins(payload.checkins || []);
        setReports(payload.reports || []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    const recent = [...sorted].slice(-7);
    const avg = (key: keyof DailyCheckin, rows = sorted) =>
      rows.length ? Math.round(rows.reduce((sum, item) => sum + Number(item[key] || 0), 0) / rows.length) : 0;
    const sleep = recent.length ? Number((recent.reduce((sum, item) => sum + Number(item.sleep_hours || 0), 0) / recent.length).toFixed(1)) : 0;
    const recovery = Math.max(0, Math.min(100, Math.round(sleep * 10 + avg("diet_completion_rate", recent) * 0.2 + avg("training_completion_rate", recent) * 0.15 - avg("fatigue_level", recent) * 4 - avg("pain_level", recent) * 5)));
    return {
      count: sorted.length,
      checkinRate: Math.min(100, Math.round((recent.length / 7) * 100)),
      weightChange: latest?.weight && first?.weight ? (Number(latest.weight) - Number(first.weight)).toFixed(1) : "-",
      training: avg("training_completion_rate", recent),
      diet: avg("diet_completion_rate", recent),
      sleep: sleep || "-",
      recovery
    };
  }, [checkins]);

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "进度追踪" : "Progress"}
          title={zh ? "看趋势，不只看单天表现。" : "Track trends, not isolated days."}
          subtitle={zh ? "体重、训练完成率、打卡率、睡眠和疼痛会一起解释你的恢复与进步。" : "Weight, completion, check-in rate, sleep, and pain explain recovery and progress together."}
        />
        {loading ? <LoadingState title={zh ? "正在读取进度数据" : "Loading progress data"} description={zh ? "整理体重、训练、睡眠和恢复趋势。" : "Preparing weight, training, sleep, and recovery trends."} /> : error ? <ErrorState title={zh ? "进度加载失败" : "Progress failed to load"} description={error} /> : (
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
              <SectionCard className="grid place-items-center gap-4">
                <RecoveryScore
                  value={summary.recovery}
                  label={zh ? "近期恢复" : "Recovery"}
                  tone={summary.recovery >= 70 ? "lime" : "amber"}
                  status={summary.recovery >= 70 ? (zh ? "恢复趋势不错" : "Recovery trend is strong") : (zh ? "恢复需要更多关注" : "Recovery needs attention")}
                  description={zh ? "评分来自最近 7 次打卡的睡眠、疲劳、疼痛和执行情况。" : "Score is inferred from the latest 7 check-ins: sleep, fatigue, pain, and adherence."}
                />
              </SectionCard>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label={zh ? "打卡天数" : "Check-ins"} value={summary.count} hint={`${summary.checkinRate}% ${zh ? "近 7 日记录率" : "last 7 days"}`} tone="lime" icon={Activity} />
                <StatCard label={zh ? "体重变化" : "Weight change"} value={`${summary.weightChange} kg`} hint={zh ? "首条到最新记录" : "First to latest"} icon={Scale} />
                <StatCard label={zh ? "训练完成" : "Training"} value={`${summary.training}%`} hint={zh ? "最近 7 次平均" : "Latest 7 avg"} tone="sky" icon={TrendingUp} />
                <StatCard label={zh ? "平均睡眠" : "Avg sleep"} value={`${summary.sleep}h`} hint={zh ? "恢复建议依据" : "Recovery input"} icon={Moon} />
              </div>
            </div>

            <SectionCard>
              <SectionTitle title={zh ? "趋势图表" : "Trend charts"} subtitle={zh ? "图表使用真实打卡数据生成。" : "Charts are generated from real check-in data."} />
              <ProgressCharts checkins={checkins} />
            </SectionCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
                {[
                  [zh ? "记录连续性" : "Consistency", `${summary.checkinRate}%`, zh ? "近 7 日打卡率" : "Last 7 days"],
                  [zh ? "训练执行" : "Training", `${summary.training}%`, zh ? "看容量能否递增" : "Volume readiness"],
                  [zh ? "饮食执行" : "Nutrition", `${summary.diet}%`, zh ? "影响恢复和体重" : "Recovery input"],
                  [zh ? "睡眠底盘" : "Sleep base", `${summary.sleep}h`, zh ? "恢复解释核心" : "Core signal"]
                ].map(([label, value, hint]) => (
                  <div key={label} className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className="mt-3 text-2xl font-semibold text-zinc-50">{value}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">{hint}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <InsightCard title={zh ? "恢复建议" : "Recovery guidance"} icon={Sparkles} tone={summary.recovery >= 70 ? "success" : "warning"}>
                {summary.recovery >= 70
                  ? (zh ? "近期恢复稳定，可以在动作标准的前提下尝试小幅递增重量、次数或训练容量。" : "Recovery is stable. Consider small increases in load, reps, or volume while keeping form clean.")
                  : (zh ? "近期恢复一般，建议先稳定睡眠和饮食执行，训练上减少冲刺感。" : "Recovery is mixed. Stabilize sleep and nutrition first, and reduce aggressive training pushes.")}
              </InsightCard>
              <SectionCard>
                <SectionTitle title={t("weeklyReport")} subtitle={zh ? "AI 周总结会把近期数据解释成可执行建议。" : "AI weekly reviews translate recent data into practical adjustments."} action={<BarChart3 className="h-5 w-5 text-sky-300" aria-hidden />} />
                <TextBlock>{reports[0]?.report_content}</TextBlock>
              </SectionCard>
            </div>
          </div>
        )}
      </PageShell>
    </>
  );
}
