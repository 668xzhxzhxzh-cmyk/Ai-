"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, CheckCircle2, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { useLanguage } from "@/components/language-provider";
import { Button, Field, InsightCard, Notice, PageShell, SectionCard, StatCard, StatusBadge, inputClass } from "@/components/ui";
import { describeAuthError, getAuthErrorDetails } from "@/lib/auth-errors";
import { saveLocalSession } from "@/lib/local-session";

type AuthDebug = {
  apiStatus: "未检测" | "成功" | "失败";
  supabaseReady: boolean;
  deepseekReady: boolean;
  message: string | null;
};

export default function AuthPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const zh = language === "zh";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<{ name: string; message: string; status: string | null } | null>(null);
  const [debug, setDebug] = useState<AuthDebug>({
    apiStatus: "未检测",
    supabaseReady: false,
    deepseekReady: false,
    message: null
  });
  const [loading, setLoading] = useState(false);

  async function runDiagnostics() {
    setDebug({
      apiStatus: "未检测",
      supabaseReady: false,
      deepseekReady: false,
      message: null
    });

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      setDebug({
        apiStatus: response.ok ? "成功" : "失败",
        supabaseReady: Boolean(payload?.checks?.supabase),
        deepseekReady: Boolean(payload?.checks?.deepseek),
        message: response.ok
          ? (zh ? "本站 API 可以连接数据库和 AI 服务。" : "The site API can reach database and AI services.")
          : payload?.diagnostics?.supabase || payload?.error || (zh ? "本站 API 健康检查失败。" : "Site API health check failed.")
      });
    } catch (error) {
      setDebug({
        apiStatus: "失败",
        supabaseReady: false,
        deepseekReady: false,
        message: error instanceof Error ? error.message : (zh ? "本站 API 健康检查失败。" : "Site API health check failed.")
      });
    }
  }

  useEffect(() => {
    runDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorDetails(null);
    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const details = payload?.details || {
            name: "SignupApiError",
            message: payload?.error || "本地注册 API 请求失败",
            status: String(response.status)
          };
          setErrorDetails(details);
          setMessage(`注册失败：${details.message}`);
          return;
        }

        setMessage(payload?.message || (zh ? "注册成功。请登录。" : "Sign-up succeeded. Please log in."));
        setMode("login");
        return;
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const loginPayload = await loginResponse.json().catch(() => null);

      if (!loginResponse.ok) {
        const details = loginPayload?.details || {
          name: "LoginApiError",
          message: loginPayload?.error || "本地登录 API 请求失败",
          status: String(loginResponse.status)
        };
        setErrorDetails(details);
        setMessage(`登录失败：${details.message}`);
        return;
      }

      if (!loginPayload?.session?.access_token) {
        setMessage(zh ? "登录成功但没有返回 session。" : "Logged in, but no session was returned.");
        return;
      }

      saveLocalSession({
        access_token: loginPayload.session.access_token,
        refresh_token: loginPayload.session.refresh_token
      });

      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${loginPayload.session.access_token}` }
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error || (zh ? "登录成功，但读取用户资料失败。" : "Logged in, but failed to load user profile."));
        return;
      }
      if (payload?.profile?.role === "admin") {
        router.push("/admin");
        return;
      }
      router.push(payload?.memberProfile ? "/dashboard" : "/onboarding");
    } catch (error) {
      setErrorDetails(getAuthErrorDetails(error));
      setMessage(describeAuthError(error, mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppNav />
      <PageShell>
        <div className="grid min-h-[calc(100vh-8rem)] items-center gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <StatusBadge tone="success">{zh ? "会员专属入口" : "Member access"}</StatusBadge>
              <StatusBadge tone="info">{zh ? "资料 · 计划 · 打卡 · 反馈" : "Profile · Plans · Feedback"}</StatusBadge>
            </div>
            <h1 className="max-w-3xl text-[clamp(34px,10.2vw,44px)] font-semibold leading-[1.06] text-zinc-50 sm:text-6xl sm:leading-[0.96]">
              {zh ? "登录后，继续你的私教管理路径。" : "Sign in and continue your coaching path."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              {zh ? "你的身体资料、训练计划、饮食建议、每日反馈和进度趋势会保存在会员账号里，方便持续调整。" : "Your profile, plans, nutrition guidance, daily feedback, and progress trends stay connected to your member account."}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard label={zh ? "训练" : "Training"} value="Plan" hint={zh ? "按周执行" : "Weekly"} tone="lime" icon={Activity} />
              <StatCard label={zh ? "安全" : "Safety"} value="Review" hint={zh ? "风险提示" : "Risk-aware"} icon={ShieldCheck} />
              <StatCard label={zh ? "隐私" : "Privacy"} value="Auth" hint={zh ? "会员账号" : "Member account"} tone="sky" icon={LockKeyhole} />
            </div>
            <div className="mt-4 grid gap-3">
              <InsightCard title={zh ? "你会看到什么" : "What you get"} icon={CheckCircle2} tone="neutral">
                {zh ? "今日训练建议、恢复状态、饮食执行、AI 今日提醒、周复盘和教练后台跟进。" : "Today training guidance, recovery status, nutrition adherence, AI insights, weekly reviews, and coach follow-up."}
              </InsightCard>
            </div>
          </div>

          <SectionCard className="mx-auto w-full max-w-md">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-lime-300 text-black">
                  <LogIn className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-50">
                    {mode === "login" ? (zh ? "登录" : "Log in") : zh ? "注册" : "Sign up"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">{zh ? "进入 AI邵峰健身会员系统" : "Enter AI Shaofeng Fitness"}</p>
                </div>
              </div>
              <StatusBadge tone={debug.apiStatus === "失败" ? "warning" : "success"}>{debug.apiStatus}</StatusBadge>
            </div>

            <form className="grid gap-4" onSubmit={submit}>
              <Field label={zh ? "邮箱" : "Email"}>
                <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label={zh ? "密码" : "Password"} hint={zh ? "至少 6 位，用于会员账号登录。" : "At least 6 characters for member access."}>
                <input
                  className={inputClass}
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Button disabled={loading}>
                {loading ? (zh ? "处理中..." : "Working...") : mode === "login" ? (zh ? "进入会员系统" : "Log in") : zh ? "创建会员账号" : "Create account"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </form>

            {message ? (
              <Notice className="mt-4" tone={message.includes("失败") || message.toLowerCase().includes("failed") ? "danger" : "warning"}>
                {message}
              </Notice>
            ) : null}

            {errorDetails ? (
              <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                <p>error.name: {errorDetails.name || "-"}</p>
                <p>error.status: {errorDetails.status || "-"}</p>
                <p>error.message: {errorDetails.message || "-"}</p>
              </div>
            ) : null}

            <button
              type="button"
              className="mt-5 min-h-11 text-sm font-semibold text-lime-200 hover:text-lime-100"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? (zh ? "没有账号？申请内测会员" : "No account? Join the beta") : zh ? "已有账号？去登录" : "Already have an account? Log in"}
            </button>

            <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-3 text-xs leading-5 text-zinc-400">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-zinc-200">{zh ? "连接状态" : "Connection status"}</p>
                <button type="button" className="min-h-9 font-semibold text-lime-200 hover:text-lime-100" onClick={runDiagnostics}>
                  {zh ? "重新检测" : "Retest"}
                </button>
              </div>
              <p>API: {debug.apiStatus}</p>
              <p>Supabase: {debug.supabaseReady ? (zh ? "服务端已连接" : "Server connected") : (zh ? "未就绪" : "Not ready")}</p>
              <p>DeepSeek: {debug.deepseekReady ? (zh ? "已配置" : "Configured") : (zh ? "未配置" : "Missing")}</p>
              {debug.message ? <p className="mt-1">{debug.message}</p> : null}
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </>
  );
}
