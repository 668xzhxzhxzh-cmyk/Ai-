"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Activity, BarChart3, ClipboardList, Dumbbell, Home, Languages, LogOut, MessageCircle, Shield, UserRound } from "lucide-react";
import { clsx } from "clsx";
import { useLanguage } from "./language-provider";
import { clearLocalSession } from "@/lib/local-session";

const links = [
  { href: "/", key: "home", label: { zh: "首页", en: "Home" }, icon: Home },
  { href: "/dashboard", key: "dashboard", label: { zh: "仪表盘", en: "Dashboard" }, icon: Activity },
  { href: "/profile", key: "profile", label: { zh: "资料", en: "Profile" }, icon: UserRound },
  { href: "/plans", key: "plans", label: { zh: "计划", en: "Plans" }, icon: Dumbbell },
  { href: "/checkin", key: "checkin", label: { zh: "打卡", en: "Check-in" }, icon: ClipboardList },
  { href: "/progress", key: "progress", label: { zh: "进度", en: "Progress" }, icon: BarChart3 },
  { href: "/chat", key: "chat", label: { zh: "问答", en: "Coach" }, icon: MessageCircle },
  { href: "/admin", key: "admin", label: { zh: "后台", en: "Admin" }, icon: Shield }
];

const mobileLinks = links.filter((item) => ["/dashboard", "/plans", "/checkin", "/progress", "/chat", "/admin"].includes(item.href));

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();

  async function logout() {
    clearLocalSession();
    router.push("/");
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 font-semibold text-zinc-50">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-zinc-50 text-xs font-bold tracking-wide text-black">SF</span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap">AI邵峰健身</span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 sm:block">Private Coaching OS</span>
            </span>
          </Link>
          <nav className="hidden flex-1 items-center justify-end gap-1 lg:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm transition-colors",
                    active ? "bg-zinc-50 text-black" : "text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-50"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{label[language]}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-200 hover:bg-white/[0.08]"
            >
              <Languages className="h-4 w-4" aria-hidden />
              {language === "zh" ? "EN" : "中文"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-200 hover:bg-white/[0.08]"
              title={language === "zh" ? "退出登录" : "Log out"}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{language === "zh" ? "退出" : "Log out"}</span>
            </button>
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/92 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-6">
          {mobileLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium",
                  active ? "text-lime-300" : "text-zinc-500"
                )}
              >
                <Icon className={clsx("h-5 w-5", active && "stroke-[2.4]")} aria-hidden />
                <span className="max-w-full truncate">{label[language]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
