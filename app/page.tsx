"use client";

import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CheckCircle2, Dumbbell, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { Button, InsightCard, PageShell, SectionCard, StatusBadge, TrainingPlanCard } from "@/components/ui";
import { useLanguage } from "@/components/language-provider";

export default function HomePage() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const pillars = [
    {
      title: zh ? "训练计划不是一张表" : "Plans beyond a spreadsheet",
      text: zh ? "每周训练、动作替代、疼痛反馈和下周调整放在同一条会员路径里。" : "Weekly training, substitutions, pain feedback, and next adjustments stay in one member path.",
      icon: Dumbbell
    },
    {
      title: zh ? "数据帮教练看见变化" : "Data that guides coaching",
      text: zh ? "体重、完成率、睡眠、疲劳和疼痛趋势，让判断更像复盘，而不是猜。" : "Weight, completion, sleep, fatigue, and pain trends turn coaching into review, not guesswork.",
      icon: BarChart3
    },
    {
      title: zh ? "AI 先整理，真人把关" : "AI prepares, humans supervise",
      text: zh ? "高风险内容会进入人工跟进，会员得到更稳、更保守的训练建议。" : "Risk signals are routed to human follow-up so advice stays conservative and useful.",
      icon: ShieldCheck
    }
  ];

  return (
    <>
      <AppNav />
      <PageShell className="pt-4 sm:pt-6">
        <section className="grid min-h-[calc(100vh-8rem)] items-center gap-10 py-10 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div className="max-w-[660px] lg:pb-8">
            <div className="mb-7 flex flex-wrap gap-2">
              <StatusBadge tone="success">{zh ? "高端 AI 私教会员系统" : "Private AI coaching OS"}</StatusBadge>
            </div>
            <h1 className="max-w-[640px] text-[clamp(34px,9.8vw,42px)] font-bold leading-[1.08] text-zinc-50 sm:text-[clamp(42px,5vw,64px)] sm:leading-[1.07]">
              {zh ? (
                <>
                  为私教会员打造的
                  <br />
                  AI 训练管理系统
                </>
              ) : (
                <>
                  AI training management
                  <br />
                  for private coaching
                </>
              )}
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-[1.7] text-zinc-400 sm:text-[18px]">
              {zh
                ? "把训练安排、饮食建议、打卡反馈和风险提醒整理在一个工作台里，让每位会员的状态持续清晰。"
                : "Organize training schedules, nutrition guidance, check-in feedback, and risk alerts in one workspace so every member's status stays clear."}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  {t("startTrial")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  {zh ? "查看会员工作台" : "View dashboard"}
                </Button>
              </Link>
            </div>
            <div className="mt-12 grid max-w-[560px] gap-4 sm:grid-cols-3">
              {[
                zh ? "训练计划" : "Training plans",
                zh ? "饮食建议" : "Nutrition guidance",
                zh ? "打卡追踪" : "Check-in tracking"
              ].map((item) => (
                <div key={item} className="border-t border-white/12 pt-4">
                  <p className="text-sm font-semibold text-zinc-100">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pb-3">
            <div className="hero-field min-h-[430px] rounded-xl border border-white/12 p-3 shadow-[0_28px_100px_rgba(0,0,0,0.44)] sm:min-h-[500px] sm:p-4 lg:min-h-[520px]">
              <div className="relative z-10 flex min-h-[404px] flex-col gap-3 rounded-lg border border-white/10 bg-zinc-950/62 p-3 backdrop-blur-xl sm:min-h-[468px] sm:p-4 lg:min-h-[488px]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-lime-300 text-black">
                      <Activity className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-50">{zh ? "会员实时工作台" : "Live member workspace"}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{zh ? "训练 · 营养 · 风险 · 复盘" : "Training · Nutrition · Risk · Review"}</p>
                    </div>
                  </div>
                  <StatusBadge tone="success">{zh ? "在线" : "Online"}</StatusBadge>
                </div>

                <div className="grid flex-1 gap-3 lg:grid-cols-[0.72fr_1.28fr]">
                  <aside className="grid gap-2 rounded-lg border border-white/10 bg-black/24 p-2.5">
                    {[
                      [zh ? "王同学" : "Member W", zh ? "恢复 82" : "Recovery 82", "bg-lime-300"],
                      [zh ? "李同学" : "Member L", zh ? "膝痛跟进" : "Knee follow-up", "bg-amber-300"],
                      [zh ? "陈同学" : "Member C", zh ? "已完成" : "Completed", "bg-cyan-300"]
                    ].map(([name, meta, dot]) => (
                      <div key={name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                          <div>
                            <p className="text-sm font-semibold text-zinc-100">{name}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>
                          </div>
                        </div>
                        <span className="h-6 w-6 rounded-lg border border-white/10 bg-white/[0.05]" />
                      </div>
                    ))}
                  </aside>

                  <div className="grid gap-3">
                    <div className="data-strip rounded-lg border border-lime-300/18 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-100/70">{zh ? "今日训练" : "Today"}</p>
                          <h2 className="mt-2 text-xl font-semibold leading-tight text-zinc-50 sm:text-2xl">
                            {zh ? "下肢力量 + 核心稳定" : "Lower strength + core stability"}
                          </h2>
                        </div>
                        <StatusBadge tone="info">AI CHECKED</StatusBadge>
                      </div>
                      <div className="mt-4 grid gap-2">
                        {[
                          [zh ? "深蹲" : "Squat", "4 x 8", "RPE 7"],
                          [zh ? "罗马尼亚硬拉" : "RDL", "3 x 10", "RPE 6"],
                          [zh ? "平板支撑" : "Plank", "3 x 45s", zh ? "控制" : "Control"]
                        ].map(([name, volume, effort]) => (
                          <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-black/28 p-2.5">
                            <p className="text-sm font-semibold text-zinc-100">{name}</p>
                            <span className="text-xs text-zinc-500">{volume}</span>
                            <span className="rounded-md bg-lime-300/12 px-2 py-1 text-xs font-semibold text-lime-100">{effort}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        [zh ? "恢复" : "Recovery", "82", zh ? "可以训练" : "Trainable", "text-lime-100"],
                        [zh ? "睡眠" : "Sleep", "7.4h", zh ? "稳定" : "Stable", "text-cyan-100"],
                        [zh ? "压力" : "Strain", "12.8", zh ? "中等负荷" : "Moderate", "text-amber-100"]
                      ].map(([label, value, hint, tone]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-black/30 p-3">
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}>{label}</p>
                          <p className="mt-2 text-2xl font-semibold leading-none text-zinc-50">{value}</p>
                          <p className="mt-2 text-xs text-zinc-500">{hint}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-100">{zh ? "AI 今日判断" : "AI daily read"}</p>
                        <span className="text-xs font-semibold text-lime-200">92%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[92%] rounded-full bg-lime-300" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {zh ? "维持训练强度，膝关节无痛时再递增负重；晚餐蛋白补足。" : "Keep intensity steady, increase load only if the knee stays pain-free, and add protein at dinner."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-8 lg:grid-cols-3">
          {pillars.map(({ title, text, icon: Icon }) => (
            <InsightCard key={title} title={title} icon={Icon} tone="neutral">
              {text}
            </InsightCard>
          ))}
        </section>

        <section className="grid gap-4 py-8 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionCard>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{zh ? "会员闭环" : "Member loop"}</p>
                <h2 className="mt-3 text-3xl font-semibold text-zinc-50">{zh ? "从问卷到复盘，一条线带到底。" : "From intake to review, one connected workflow."}</h2>
              </div>
              <UsersRound className="h-8 w-8 text-lime-200" aria-hidden />
            </div>
            <div className="grid gap-3">
              {(zh
                ? ["填写资料与目标", "生成训练和饮食计划", "每日打卡与 AI 分析", "风险提示和真人跟进", "根据结果调整下周计划"]
                : ["Intake and goals", "Training and nutrition plans", "Daily check-ins and AI review", "Risk alerts and human follow-up", "Adjust next week from results"]
              ).map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-bold text-black">{index + 1}</span>
                  <span className="text-sm font-medium text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <TrainingPlanCard
            title={zh ? "专业训练计划结构" : "Professional plan structure"}
            subtitle={zh ? "动作、组数、次数、RPE、器械和反馈逻辑清晰呈现。" : "Exercises, sets, reps, RPE, equipment, and feedback stay visible."}
            items={[
              { name: zh ? "主项力量" : "Primary strength", meta: "4 x 6-8", detail: zh ? "根据疼痛和疲劳决定是否递增重量。" : "Load progression depends on pain and fatigue." },
              { name: zh ? "辅助动作" : "Accessory work", meta: "3 x 10-12", detail: zh ? "围绕薄弱肌群和动作稳定性安排。" : "Targets weak links and movement control.", tone: "info" },
              { name: zh ? "下次调整" : "Next adjustment", meta: zh ? "自动建议" : "AI guided", detail: zh ? "完成率高且恢复稳定时，进入渐进超负荷。" : "High completion and stable recovery trigger progressive overload.", tone: "warning" }
            ]}
            footer={
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lime-200" aria-hidden />
                {zh ? "强调可执行、可反馈、可调整。" : "Built to be executed, reviewed, and adjusted."}
              </div>
            }
          />
        </section>

        <section className="py-8">
          <SectionCard className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-200">{zh ? "开始使用" : "Start now"}</p>
              <h2 className="mt-3 text-3xl font-semibold text-zinc-50">{zh ? "把你的会员管理，升级成真正的私教系统。" : "Upgrade member management into a real coaching system."}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                {zh ? "登录后即可填写会员资料、生成计划、提交打卡并查看进度。" : "Log in to complete a profile, generate plans, submit check-ins, and track progress."}
              </p>
            </div>
            <Link href="/auth">
              <Button className="w-full md:w-auto">
                {zh ? "进入会员入口" : "Enter member access"}
                <MessageCircle className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </SectionCard>
        </section>
      </PageShell>
    </>
  );
}
