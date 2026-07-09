import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDot, Dumbbell, Loader2, Sparkles } from "lucide-react";
import { clsx } from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "lime" | "sky" | "amber";

const toneClasses: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[0.045] text-zinc-300",
  success: "border-lime-300/25 bg-lime-300/12 text-lime-100",
  warning: "border-amber-300/25 bg-amber-300/12 text-amber-100",
  danger: "border-red-300/25 bg-red-400/12 text-red-100",
  info: "border-cyan-300/25 bg-cyan-300/12 text-cyan-100",
  lime: "border-lime-300/25 bg-lime-300/12 text-lime-100",
  sky: "border-cyan-300/25 bg-cyan-300/12 text-cyan-100",
  amber: "border-amber-300/25 bg-amber-300/12 text-amber-100"
};

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="app-shell min-h-screen">{children}</div>;
}

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={clsx("mx-auto w-full max-w-7xl px-4 pb-28 pt-6 text-zinc-100 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8", className)}>
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  meta,
  className = ""
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={clsx("mb-6 grid gap-5 border-b border-white/10 pb-6 md:grid-cols-[1fr_auto] md:items-end", className)}>
      <div>
        {eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-lime-200/90">{eyebrow}</p> : null}
        <h1 className="max-w-4xl text-3xl font-semibold leading-[1.02] text-zinc-50 sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">{subtitle}</p> : null}
        {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2 md:justify-end">{action}</div> : null}
    </header>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal text-zinc-50 sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
  accent = "neutral"
}: {
  children: ReactNode;
  className?: string;
  accent?: "neutral" | "lime" | "sky" | "amber";
}) {
  return (
    <section
      className={clsx(
        "soft-card rounded-xl border p-4 backdrop-blur-xl transition-colors sm:p-5",
        accent === "neutral" && "border-white/10",
        accent === "lime" && "border-lime-300/20 metric-glow",
        accent === "sky" && "border-cyan-300/20",
        accent === "amber" && "border-amber-300/20 shadow-amber-950/10",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Panel(props: { children: ReactNode; className?: string }) {
  return <SectionCard {...props} />;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      {...props}
      className={clsx(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-lime-300 text-black shadow-[0_14px_36px_rgba(184,255,77,0.2)] hover:bg-lime-200",
        variant === "secondary" && "border border-white/12 bg-white/[0.065] text-zinc-100 hover:border-white/20 hover:bg-white/[0.11]",
        variant === "danger" && "bg-red-500 text-white hover:bg-red-400",
        variant === "ghost" && "text-zinc-300 hover:bg-white/[0.07] hover:text-zinc-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TextBlock({ children, className = "" }: { children?: string | null; className?: string }) {
  return (
    <div className={clsx("min-h-32 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/35 p-4 text-sm leading-7 text-zinc-300", className)}>
      {children || "暂无内容"}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-300">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "focus-ring min-h-11 w-full rounded-[0.95rem] border border-white/10 bg-black/35 px-3.5 text-sm text-zinc-50 placeholder:text-zinc-600 transition-colors hover:border-white/20";

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <StatCard label={label} value={value} />;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
  trend
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  trend?: ReactNode;
}) {
  return (
    <div className={clsx("rounded-lg border p-4", toneClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-current/65">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-current/70" aria-hidden /> : null}
      </div>
      <div className="mt-3 text-2xl font-semibold leading-none text-zinc-50">{value}</div>
      <div className="mt-3 flex min-h-5 items-center justify-between gap-2 text-xs leading-5 text-current/70">
        <span>{hint}</span>
        {trend ? <span className="font-semibold text-current">{trend}</span> : null}
      </div>
    </div>
  );
}

export function MetricCard(props: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "lime" | "sky" | "amber";
}) {
  return <StatCard {...props} tone={props.tone || "neutral"} />;
}

export function ScoreRing({
  value,
  label,
  tone = "lime",
  size = "lg"
}: {
  value: number;
  label: string;
  tone?: "lime" | "sky" | "amber";
  size?: "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  const color = tone === "lime" ? "#b8ff4d" : tone === "sky" ? "#72e4ff" : "#ffd166";
  return (
    <div
      className={clsx(
        "grid place-items-center rounded-full border border-white/10 bg-black/35 shadow-[0_0_60px_rgba(184,255,77,0.09)]",
        size === "lg" ? "h-36 w-36" : "h-28 w-28"
      )}
      style={{ background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
    >
      <div className={clsx("grid place-items-center rounded-full bg-zinc-950 text-center", size === "lg" ? "h-[7.25rem] w-[7.25rem]" : "h-[5.5rem] w-[5.5rem]")}>
        <div className="text-3xl font-semibold text-zinc-50">{clamped}</div>
        <div className="mt-1 max-w-20 text-xs leading-4 text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

export function RecoveryScore({
  value,
  label,
  status,
  description,
  tone = value >= 70 ? "lime" : value >= 45 ? "amber" : "sky"
}: {
  value: number;
  label: string;
  status: string;
  description?: string;
  tone?: "lime" | "sky" | "amber";
}) {
  return (
    <div className="grid place-items-center gap-4 text-center">
      <ScoreRing value={value} label={label} tone={tone} />
      <div>
        <h2 className="text-2xl font-semibold text-zinc-50">{status}</h2>
        {description ? <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">{description}</p> : null}
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
  className = ""
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
        tone === "neutral" && toneClasses.neutral,
        tone === "success" && toneClasses.success,
        tone === "warning" && toneClasses.warning,
        tone === "info" && toneClasses.info,
        tone === "danger" && toneClasses.danger,
        className
      )}
    >
      {children}
    </span>
  );
}

export function MemberRiskBadge({ hasRisk, stale = false, label }: { hasRisk: boolean; stale?: boolean; label?: string }) {
  if (hasRisk) {
    return (
      <StatusBadge tone="warning">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        {label || "需跟进"}
      </StatusBadge>
    );
  }
  if (stale) {
    return (
      <StatusBadge tone="info">
        <CircleDot className="h-3 w-3" aria-hidden />
        {label || "未打卡"}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="success">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      {label || "稳定"}
    </StatusBadge>
  );
}

export function InsightCard({
  title,
  children,
  tone = "info",
  icon: Icon = Sparkles
}: {
  title: string;
  children: ReactNode;
  tone?: Tone;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className={clsx("rounded-lg border p-4", toneClasses[tone])}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" aria-hidden />
        <h3 className="text-sm font-semibold text-zinc-50">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-6 text-current/78">{children}</div>
    </div>
  );
}

export function TrainingPlanCard({
  title,
  subtitle,
  items,
  footer,
  action
}: {
  title: string;
  subtitle?: string;
  items: Array<{ name: string; meta: string; detail?: string; tone?: Tone }>;
  footer?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <SectionCard accent="lime">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[0.95rem] bg-lime-300 text-black">
            <Dumbbell className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-zinc-400">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={`${item.name}-${item.meta}`} className="rounded-[0.95rem] border border-white/10 bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
              <StatusBadge tone={item.tone === "warning" ? "warning" : item.tone === "info" || item.tone === "sky" ? "info" : "neutral"}>{item.meta}</StatusBadge>
            </div>
            {item.detail ? <p className="mt-2 text-sm leading-6 text-zinc-400">{item.detail}</p> : null}
          </div>
        ))}
      </div>
      {footer ? <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-zinc-400">{footer}</div> : null}
    </SectionCard>
  );
}

export function LoadingPanel({ rows = 4 }: { rows?: number }) {
  return (
    <SectionCard>
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={clsx("skeleton h-4 rounded-full", index === 0 ? "w-2/5" : index % 2 ? "w-4/5" : "w-full")} />
        ))}
      </div>
    </SectionCard>
  );
}

export function LoadingState({ title = "正在加载", description }: { title?: string; description?: string }) {
  return (
    <SectionCard>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-lime-200">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="skeleton h-4 w-2/5 rounded-full" />
        <div className="skeleton h-4 w-full rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
      </div>
    </SectionCard>
  );
}

export function ErrorState({ title = "请求失败", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <SectionCard accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-amber-300/25 bg-amber-300/10 text-amber-100">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{title}</p>
            {description ? <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
    </SectionCard>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Notice({
  children,
  tone = "neutral",
  className = ""
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-3.5 text-sm leading-6",
        tone === "neutral" && toneClasses.neutral,
        tone === "success" && toneClasses.success,
        tone === "warning" && toneClasses.warning,
        tone === "danger" && toneClasses.danger,
        className
      )}
    >
      {children}
    </div>
  );
}
