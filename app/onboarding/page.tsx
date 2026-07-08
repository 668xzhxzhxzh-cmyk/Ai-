"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Apple, ShieldAlert, UserRound } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { AuthRequiredState, ForbiddenState } from "@/components/auth-required-state";
import { useLanguage } from "@/components/language-provider";
import { Button, Field, InsightCard, Notice, PageHeader, PageShell, SectionCard, SectionTitle, StatCard, StatusBadge, inputClass } from "@/components/ui";
import { apiFetch, getErrorMessage, isForbiddenError, isUnauthorizedError } from "@/lib/client-api";
import type { MemberProfileInput } from "@/lib/types";

type ProfileForm = MemberProfileInput & { language: "zh" | "en" };

const initialForm: ProfileForm = {
  name: "",
  language: "zh",
  age: 30,
  gender: "男",
  height: 170,
  weight: 70,
  target_weight: 65,
  goal: "减脂",
  experience: "新手",
  training_days_per_week: 3,
  training_time_per_session: 45,
  equipment: "徒手",
  diet_preference: "",
  food_restrictions: "",
  schedule: "",
  has_injury: false,
  injury_area: "",
  pain_level: 0,
  discomfort: "",
  notes: ""
};

export default function OnboardingPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const zh = language === "zh";
  const [form, setForm] = useState<ProfileForm>({ ...initialForm, language });
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ memberProfile: (MemberProfileInput & { user_id: string }) | null; profile: { name?: string; language?: "zh" | "en" } | null }>("/api/me")
      .then((payload) => {
        if (payload.profile?.language) setLanguage(payload.profile.language);
        if (payload.memberProfile) {
          setForm({
            ...initialForm,
            ...payload.memberProfile,
            name: payload.profile?.name || payload.memberProfile.name || "",
            language: payload.profile?.language || "zh"
          });
        }
      })
      .catch((err: Error) => setLoadError(err))
      .finally(() => setCheckingAuth(false));
  }, [setLanguage]);

  function setValue(key: keyof ProfileForm, value: string | number | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await apiFetch<{ risk: { need_human_review: boolean; review_reason: string | null } }>("/api/member-profile", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setLanguage(form.language);
      if (result.risk.need_human_review) {
        setMessage(`${t("needReview")}: ${result.risk.review_reason}`);
      }
      router.push("/dashboard");
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const authRequired = isUnauthorizedError(loadError);
  const forbidden = isForbiddenError(loadError);

  return (
    <>
      <AppNav />
      <PageShell>
        <PageHeader
          eyebrow={zh ? "会员资料" : "Member profile"}
          title={zh ? "把训练建议建立在真实身体情况上。" : "Build coaching from real personal context."}
          subtitle={zh ? "这些资料会用于训练计划、饮食建议、每日反馈和风险提醒。填写越具体，后续调整越准确。" : "This profile powers training plans, nutrition guidance, daily feedback, and risk alerts. More detail means better adjustments."}
          meta={
            <>
              <StatusBadge tone="success">{zh ? "用于计划生成" : "Used for plans"}</StatusBadge>
              <StatusBadge tone={form.has_injury || form.pain_level >= 4 ? "warning" : "info"}>{form.has_injury || form.pain_level >= 4 ? (zh ? "需关注风险" : "Risk watch") : (zh ? "状态记录" : "Baseline")}</StatusBadge>
            </>
          }
        />

        {checkingAuth ? null : authRequired ? <AuthRequiredState area={zh ? "会员资料" : "Member profile"} /> : null}
        {checkingAuth ? null : forbidden ? <ForbiddenState /> : null}
        {checkingAuth ? null : loadError && !authRequired && !forbidden ? <Notice className="mb-4" tone="danger">{getErrorMessage(loadError)}</Notice> : null}

        {!checkingAuth && !loadError ? <form className="grid gap-4" onSubmit={save}>
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-4">
              <SectionCard accent="lime">
                <SectionTitle title={zh ? "会员快照" : "Member snapshot"} subtitle={zh ? "核心目标和训练条件会影响计划强度。" : "Goal and training capacity shape the plan."} />
                <div className="grid gap-3">
                  <StatCard label={zh ? "目标" : "Goal"} value={form.goal} hint={zh ? "当前主线" : "Primary focus"} tone="lime" icon={Activity} />
                  <StatCard label={zh ? "训练频率" : "Frequency"} value={`${form.training_days_per_week}${zh ? " 天/周" : " d/w"}`} hint={`${form.training_time_per_session}${zh ? " 分钟/次" : " min/session"}`} icon={UserRound} />
                  <StatCard label={zh ? "疼痛等级" : "Pain"} value={`${form.pain_level}/10`} hint={form.has_injury ? (zh ? "有伤病记录" : "Injury noted") : (zh ? "无伤病记录" : "No injury noted")} tone={form.pain_level >= 4 ? "amber" : "sky"} icon={ShieldAlert} />
                </div>
              </SectionCard>
              <InsightCard title={zh ? "填写建议" : "How to fill this"} icon={Apple} tone="neutral">
                {zh ? "不要只写“减脂”或“增肌”。把训练时间、可用器械、饮食限制和不适位置写清楚，计划才更像私教方案。" : "Go beyond generic goals. Training time, equipment, diet limits, and discomfort details make the plan more coach-grade."}
              </InsightCard>
            </div>

            <div className="grid gap-4">
              <SectionCard>
                <SectionTitle title={zh ? "基础信息" : "Basics"} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={zh ? "姓名" : "Name"}><input className={inputClass} value={form.name || ""} onChange={(e) => setValue("name", e.target.value)} required /></Field>
                  <Field label={zh ? "语言" : "Language"}>
                    <select className={inputClass} value={form.language} onChange={(e) => setValue("language", e.target.value)}>
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                    </select>
                  </Field>
                  <Field label={zh ? "年龄" : "Age"}><input className={inputClass} type="number" value={form.age} onChange={(e) => setValue("age", Number(e.target.value))} /></Field>
                  <Field label={zh ? "性别" : "Gender"}><input className={inputClass} value={form.gender} onChange={(e) => setValue("gender", e.target.value)} /></Field>
                  <Field label={zh ? "身高 cm" : "Height cm"}><input className={inputClass} type="number" value={form.height} onChange={(e) => setValue("height", Number(e.target.value))} /></Field>
                  <Field label={zh ? "当前体重 kg" : "Current weight kg"}><input className={inputClass} type="number" value={form.weight} onChange={(e) => setValue("weight", Number(e.target.value))} /></Field>
                </div>
              </SectionCard>

              <SectionCard>
                <SectionTitle title={zh ? "目标与训练条件" : "Goal and training setup"} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={zh ? "目标体重 kg" : "Target weight kg"}><input className={inputClass} type="number" value={form.target_weight} onChange={(e) => setValue("target_weight", Number(e.target.value))} /></Field>
                  <Field label={zh ? "健身目标" : "Goal"}>
                    <select className={inputClass} value={form.goal} onChange={(e) => setValue("goal", e.target.value)}>
                      {(zh ? ["减脂", "增肌", "塑形", "康复恢复"] : ["Fat loss", "Muscle gain", "Body shaping", "Rehab recovery"]).map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label={zh ? "训练经验" : "Experience"}><input className={inputClass} value={form.experience} onChange={(e) => setValue("experience", e.target.value)} /></Field>
                  <Field label={zh ? "每周训练天数" : "Training days/week"}><input className={inputClass} type="number" min={1} max={7} value={form.training_days_per_week} onChange={(e) => setValue("training_days_per_week", Number(e.target.value))} /></Field>
                  <Field label={zh ? "每次训练时长 分钟" : "Minutes/session"}><input className={inputClass} type="number" value={form.training_time_per_session} onChange={(e) => setValue("training_time_per_session", Number(e.target.value))} /></Field>
                  <Field label={zh ? "可用器械" : "Equipment"}><input className={inputClass} value={form.equipment} onChange={(e) => setValue("equipment", e.target.value)} /></Field>
                </div>
              </SectionCard>

              <SectionCard>
                <SectionTitle title={zh ? "饮食与作息" : "Nutrition and schedule"} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={zh ? "饮食偏好" : "Diet preference"}><textarea className={`${inputClass} min-h-24 py-3`} value={form.diet_preference} onChange={(e) => setValue("diet_preference", e.target.value)} /></Field>
                  <Field label={zh ? "忌口食物" : "Food restrictions"}><textarea className={`${inputClass} min-h-24 py-3`} value={form.food_restrictions} onChange={(e) => setValue("food_restrictions", e.target.value)} /></Field>
                  <Field label={zh ? "每日大概作息" : "Daily schedule"}><textarea className={`${inputClass} min-h-24 py-3`} value={form.schedule} onChange={(e) => setValue("schedule", e.target.value)} /></Field>
                  <Field label={zh ? "备注" : "Notes"}><textarea className={`${inputClass} min-h-24 py-3`} value={form.notes} onChange={(e) => setValue("notes", e.target.value)} /></Field>
                </div>
              </SectionCard>

              <SectionCard accent={form.has_injury || form.pain_level >= 4 ? "amber" : "neutral"}>
                <SectionTitle title={zh ? "伤病与风险信号" : "Injury and risk signals"} subtitle={zh ? "疼痛、伤病和不适会影响动作选择和训练强度。" : "Pain, injury, and discomfort affect exercise selection and intensity."} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={zh ? "是否有伤病" : "Any injury"}>
                    <select className={inputClass} value={String(form.has_injury)} onChange={(e) => setValue("has_injury", e.target.value === "true")}>
                      <option value="false">{zh ? "否" : "No"}</option>
                      <option value="true">{zh ? "是" : "Yes"}</option>
                    </select>
                  </Field>
                  <Field label={zh ? "疼痛程度 0-10" : "Pain level 0-10"}><input className={inputClass} type="number" min={0} max={10} value={form.pain_level} onChange={(e) => setValue("pain_level", Number(e.target.value))} /></Field>
                  <Field label={zh ? "伤病部位" : "Injury area"}><input className={inputClass} value={form.injury_area} onChange={(e) => setValue("injury_area", e.target.value)} /></Field>
                  <Field label={zh ? "当前身体不适" : "Current discomfort"}><textarea className={`${inputClass} min-h-24 py-3`} value={form.discomfort} onChange={(e) => setValue("discomfort", e.target.value)} /></Field>
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button disabled={loading} className="w-full sm:w-auto">{loading ? t("loading") : zh ? "保存并进入仪表盘" : "Save and go to dashboard"}</Button>
            {message ? <Notice className="flex-1" tone={message.includes(t("needReview")) ? "warning" : "danger"}>{message}</Notice> : null}
          </div>
        </form> : null}
      </PageShell>
    </>
  );
}
