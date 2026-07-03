"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const router = useRouter();

  async function refresh() {
    if (state === "running") return;
    setState("running");
    try {
      const res = await fetch("/api/admin/refresh", { method: "POST" });
      if (!res.ok) throw new Error();
      setState("done");
      router.refresh();
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const label = {
    idle: "↻ 更新数据",
    running: "更新中，约需 1-3 分钟…",
    done: "✓ 已更新",
    error: "更新失败，稍后再试",
  }[state];

  return (
    <button
      onClick={refresh}
      disabled={state === "running"}
      className="ml-auto rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100 disabled:opacity-60"
      title="抓取最新 AI 资讯并进行 AI 加工，完成后自动刷新"
    >
      {label}
    </button>
  );
}
