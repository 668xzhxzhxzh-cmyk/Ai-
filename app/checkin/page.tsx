"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Apple, ClipboardCheck, Moon, Scale, Zap } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { useLanguage } from "@/components/language-provider";
import { Button, Field, InsightCard, Notice, PageHeader, PageShell, RecoveryScore, SectionCard, SectionTitle, StatCard, StatusBadge, TextBlock, inputClass } from "@/components/ui";
import { apiFetch } from "@/lib/client-api";
import type { AiDailyReview, DailyCheckinInput } from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);

const initial: DailyCheckinInput = {
  date: today,
  weight: 70,
  training_completed: true,
  training_completion_rate: 80,
  diet_completion_rate: 80,
  sleep_hours: 7,
  fatigue_level: 3,
  pain_level: 0,
  mood: "",
  notes: "",
  image_urls: []
};

export default function CheckinPage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [form, setForm] = useState<DailyCheckinInput>(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<AiDailyReview | null>(null);

  function setValue(key: keyof DailyCheckinInput, value: string | number | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const readiness = useMemo(() => {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(form.sleep_hours || 0) * 10 + form.diet_completion_rate * 0.2 + form.training_completion_rate * 0.15 - form.fatigue_level * 4 - form.pain_level * 6)
      )
    );
  }, [form]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await apiFetch<{ review: AiDailyReview; risk: { need_human_review: boolean; review_reason: string | null } }>(
        "/api/checkins",
        { method: "POST", body: JSON.stringify(form) }
      );
      setReview(result.review);
      setMessage(result.risk.need_human_review ? `${t("needReview")}: ${result.risk.review_reason}` : zh ? "打卡已提交。" : "Check-in submitted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const needsAttention = form.pain_level >= 4 || form.fatigue_level >= 8;

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "每日打卡" : "Daily check-in"}
          title={zh ? "记录今天的执行，决定明天怎么调整。" : "Record today so tomorrow can be adjusted."}
          subtitle={zh ? "训练完成率、饮食执行、睡眠、疲劳和疼痛会一起进入 AI 反馈和教练后台。" : "Training, nutrition, sleep, fatigue, and pain feed AI feedback and the coach console."}
          meta={
            <>
              <StatusBadge tone={needsAttention ? "warning" : "success"}>{needsAttention ? (zh ? "需关注" : "Watch") : (zh ? "状态可提交" : "Ready")}</StatusBadge>
              <StatusBadge tone="info">{form.date}</StatusBadge>
            </>
          }
        />

        <form className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]" onSubmit={submit}>
          <div className="grid gap-4">
            <SectionCard className="grid place-items-center gap-4 text-center" accent={needsAttention ? "amber" : "lime"}>
              <RecoveryScore
                value={readiness}
                label={zh ? "今日状态" : "Readiness"}
                tone={needsAttention ? "amber" : "lime"}
                status={needsAttention ? (zh ? "今天建议保守一点" : "Keep today conservative") : readiness >= 70 ? (zh ? "今天可以正常推进" : "Good day to progress") : (zh ? "今天以稳定完成为主" : "Focus on steady completion")}
                description={zh ? "这个评分只用于帮助判断训练强度，最终以身体反馈和教练判断为准。" : "This score helps guide intensity. Body feedback and coach judgment come first."}
              />
            </SectionCard>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <StatCard label={zh ? "训练完成" : "Training"} value={`${form.training_completion_rate}%`} hint={form.training_completed ? (zh ? "已完成训练" : "Completed") : (zh ? "未完成训练" : "Not completed")} tone="lime" icon={Zap} />
              <StatCard label={zh ? "饮食执行" : "Nutrition"} value={`${form.diet_completion_rate}%`} hint={zh ? "影响恢复和体重趋势" : "Impacts recovery and weight"} tone="sky" icon={Apple} />
              <StatCard label={zh ? "睡眠" : "Sleep"} value={`${form.sleep_hours}h`} hint={zh ? "恢复基础" : "Recovery base"} icon={Moon} />
              <StatCard label={zh ? "疲劳 / 疼痛" : "Fatigue / Pain"} value={`${form.fatigue_level}/${form.pain_level}`} hint={needsAttention ? (zh ? "建议人工关注" : "Coach attention") : "OK"} tone={needsAttention ? "amber" : "neutral"} icon={AlertTriangle} />
            </div>
          </div>

          <div className="grid gap-4">
            <SectionCard>
              <SectionTitle title={zh ? "今日记录" : "Today record"} subtitle={zh ? "用真实数据记录，不需要追求完美。" : "Record honestly; perfect numbers are not the goal."} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={zh ? "日期" : "Date"}><input className={inputClass} type="date" value={form.date} onChange={(e) => setValue("date", e.target.value)} /></Field>
                <Field label={zh ? "今日体重 kg" : "Weight kg"}><input className={inputClass} type="number" value={form.weight ?? ""} onChange={(e) => setValue("weight", Number(e.target.value))} /></Field>
                <Field label={zh ? "是否完成训练" : "Training completed"}>
                  <select className={inputClass} value={String(form.training_completed)} onChange={(e) => setValue("training_completed", e.target.value === "true")}>
                    <option value="true">{zh ? "是" : "Yes"}</option>
                    <option value="false">{zh ? "否" : "No"}</option>
                  </select>
                </Field>
                <Field label={zh ? "训练完成度 0-100%" : "Training completion 0-100%"}>
                  <input className={inputClass} type="number" min={0} max={100} value={form.training_completion_rate} onChange={(e) => setValue("training_completion_rate", Number(e.target.value))} />
                </Field>
                <Field label={zh ? "饮食执行情况 0-100%" : "Diet completion 0-100%"}>
                  <input className={inputClass} type="number" min={0} max={100} value={form.diet_completion_rate} onChange={(e) => setValue("diet_completion_rate", Number(e.target.value))} />
                </Field>
                <Field label={zh ? "睡眠小时数" : "Sleep hours"}><input className={inputClass} type="number" min={0} max={24} step="0.5" value={form.sleep_hours} onChange={(e) => setValue("sleep_hours", Number(e.target.value))} /></Field>
                <Field label={zh ? "疲劳程度 0-10" : "Fatigue 0-10"}><input className={inputClass} type="number" min={0} max={10} value={form.fatigue_level} onChange={(e) => setValue("fatigue_level", Number(e.target.value))} /></Field>
                <Field label={zh ? "疼痛程度 0-10" : "Pain 0-10"}><input className={inputClass} type="number" min={0} max={10} value={form.pain_level} onChange={(e) => setValue("pain_level", Number(e.target.value))} /></Field>
                <Field label={zh ? "心情状态" : "Mood"}><input className={inputClass} value={form.mood} onChange={(e) => setValue("mood", e.target.value)} /></Field>
                <Field label={zh ? "今日备注" : "Notes"}><textarea className={`${inputClass} min-h-24 py-3`} value={form.notes} onChange={(e) => setValue("notes", e.target.value)} /></Field>
              </div>
            </SectionCard>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button disabled={loading} className="w-full sm:w-auto">
                <ClipboardCheck className="h-4 w-4" aria-hidden />
                {loading ? (zh ? "正在提交并整理反馈..." : "Submitting and preparing feedback...") : t("submit")}
              </Button>
              {loading ? <Notice className="flex-1">{zh ? "提交后会保存打卡，并整理当天反馈。请保持页面打开。" : "Your check-in is being saved and daily feedback is being prepared."}</Notice> : null}
            </div>
            {message ? <Notice tone={message.includes(t("needReview")) ? "warning" : "success"}>{message}</Notice> : null}
            <InsightCard title={zh ? "为什么要打卡" : "Why this matters"} icon={Scale} tone="neutral">
              {zh ? "打卡不是考核，而是给下次训练提供依据。连续记录会让计划更像真人教练的持续调整。" : "Check-ins are not a test. They give the next session better context and make planning feel more coach-led."}
            </InsightCard>

            <SectionCard className="overflow-hidden p-0">
              <div className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  [zh ? "执行" : "Execution", `${Math.round((form.training_completion_rate + form.diet_completion_rate) / 2)}%`],
                  [zh ? "恢复" : "Recovery", `${form.sleep_hours}h`],
                  [zh ? "风险" : "Risk", needsAttention ? (zh ? "需关注" : "Watch") : "OK"]
                ].map(([label, value]) => (
                  <div key={label} className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-zinc-50">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </form>

        {review ? (
          <SectionCard className="mt-4" accent={review.need_human_review ? "amber" : "sky"}>
            <SectionTitle title={t("dailyReview")} action={review.need_human_review ? <StatusBadge tone="warning">{t("needReview")}</StatusBadge> : <StatusBadge tone="success">AI Insight</StatusBadge>} />
            <TextBlock>{review.review_content}</TextBlock>
          </SectionCard>
        ) : null}
      </PageShell>
    </>
  );
}
