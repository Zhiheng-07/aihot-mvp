import type { Metadata } from "next";
import Link from "next/link";
import { RefreshButton } from "@/components/RefreshButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI HOT MVP — AI 行业动态聚合",
  description: "AI 行业动态聚合 · 每日精选与 AI 日报",
};

const NAV = [
  { href: "/", label: "精选" },
  { href: "/all", label: "全部AI动态" },
  { href: "/daily", label: "AI日报" },
  { href: "/agent", label: "Agent接入" },
  { href: "/about", label: "关于" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              AI<span className="text-orange-600">HOT</span>
              <span className="ml-1 text-xs font-normal text-neutral-400">MVP</span>
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-600">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-neutral-900">
                  {n.label}
                </Link>
              ))}
            </nav>
            <RefreshButton />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-neutral-400">
          AI HOT MVP · 内容摘要由 LLM 生成，原文版权归各来源所有
        </footer>
      </body>
    </html>
  );
}
