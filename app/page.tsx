"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Dumbbell, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
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
        <section className="home-hero relative overflow-hidden border-y border-white/10 px-4 py-8 sm:rounded-lg sm:border sm:px-7 sm:py-10 lg:px-10 lg:py-12">
          <Image
            src="/images/ai-coaching-workspace.png"
            alt={zh ? "AI邵峰健身会员训练工作台界面预览" : "AI Shaofeng Fitness member coaching workspace preview"}
            fill
            priority
            sizes="(min-width: 1280px) 1180px, 100vw"
            className="home-hero-image object-cover"
          />
          <div className="relative z-10 flex flex-col justify-between gap-8">
            <div className="max-w-[680px]">
              <div className="mb-6 flex flex-wrap gap-2">
                <StatusBadge tone="success">{zh ? "高端 AI 私教会员系统" : "Private AI coaching OS"}</StatusBadge>
                <StatusBadge tone="info">{zh ? "EdgeOne 健康检查通过" : "EdgeOne health verified"}</StatusBadge>
              </div>
              <h1 className="max-w-[720px] text-[clamp(36px,10vw,52px)] font-bold leading-[1.04] text-zinc-50 sm:text-[clamp(52px,6.2vw,80px)] sm:leading-[0.98]">
                {zh ? (
                  <>
                    AI 私教会员系统，
                    <br />
                    每天知道怎么练。
                  </>
                ) : (
                  <>
                    AI coaching OS
                    <br />
                    for daily training decisions.
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-[600px] text-[17px] leading-[1.7] text-zinc-300 sm:text-[18px]">
                {zh
                  ? "把训练安排、饮食建议、打卡反馈、恢复评分和风险提醒整理在一个工作台里，让会员打开手机就能判断今天该怎么练。"
                  : "Training, nutrition, check-ins, recovery, and risk alerts live in one workspace so each member knows what to do today."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            </div>

            <div className="hidden max-w-3xl gap-3 sm:grid sm:grid-cols-3">
              {[
                [zh ? "训练计划" : "Training plans", zh ? "动作、组数、RPE 和下次调整" : "Exercises, volume, RPE, adjustments"],
                [zh ? "饮食建议" : "Nutrition guidance", zh ? "围绕恢复和执行率设计" : "Built around recovery and adherence"],
                [zh ? "风险跟进" : "Risk follow-up", zh ? "疼痛疲劳自动进入人工提醒" : "Pain and fatigue route to coach review"]
              ].map(([item, detail]) => (
                <div key={item} className="rounded-lg border border-white/12 bg-black/35 p-4 backdrop-blur-md">
                  <p className="text-sm font-semibold text-zinc-50">{item}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{detail}</p>
                </div>
              ))}
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
