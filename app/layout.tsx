import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "AI邵峰健身",
  description: "训练、饮食、打卡和教练监督的会员管理平台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="app-shell">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
