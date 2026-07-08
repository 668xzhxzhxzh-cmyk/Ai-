"use client";

import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button, ErrorState } from "@/components/ui";

export function AuthRequiredState({ area }: { area?: string }) {
  const { language } = useLanguage();
  const zh = language === "zh";

  return (
    <ErrorState
      title={zh ? "请先登录" : "Please log in"}
      description={
        zh
          ? `${area || "这个页面"}需要会员账号登录后才能读取你的训练、打卡和进度数据。`
          : `${area || "This page"} needs a member account before it can load your training, check-in, and progress data.`
      }
      action={
        <Link href="/auth">
          <Button>
            <LockKeyhole className="h-4 w-4" aria-hidden />
            {zh ? "去登录" : "Log in"}
          </Button>
        </Link>
      }
    />
  );
}

export function ForbiddenState({ admin = false }: { admin?: boolean }) {
  const { language } = useLanguage();
  const zh = language === "zh";

  return (
    <ErrorState
      title={zh ? "权限不足" : "Access denied"}
      description={
        admin
          ? zh
            ? "当前账号不是管理员，无法打开教练后台。请使用管理员账号登录。"
            : "This account is not an admin, so it cannot open the coach console."
          : zh
            ? "当前账号没有权限访问这个页面。"
            : "This account does not have permission to view this page."
      }
      action={
        <Link href="/auth">
          <Button variant="secondary">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            {zh ? "切换账号" : "Switch account"}
          </Button>
        </Link>
      }
    />
  );
}
