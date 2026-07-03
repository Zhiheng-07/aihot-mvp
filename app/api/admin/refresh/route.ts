import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingest } from "@/pipeline/ingest";
import { processPending } from "@/pipeline/process";
import { generateDaily } from "@/pipeline/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Hobby 上限；大批量抓取由 GitHub Actions 定时承担

// 进程内防并发：同一时间只允许一次刷新
let refreshing = false;

// 一键更新：抓取 → LLM 加工 → 重新生成今日日报（供网页按钮调用，本地使用无鉴权）
export async function POST() {
  if (refreshing) {
    return NextResponse.json({ error: "已有更新任务在进行中，请稍候" }, { status: 409 });
  }
  refreshing = true;
  try {
    const { created } = await ingest(prisma);

    let processed = 0;
    if (process.env.LLM_API_KEY && process.env.LLM_API_KEY !== "sk-...") {
      // 多轮直到没有待加工条目（每轮上限 60）
      for (let round = 0; round < 2; round++) {
        const r = await processPending(prisma);
        processed += r.processed;
        const remaining = await prisma.item.count({ where: { processedAt: null } });
        if (remaining === 0) break;
      }
    }

    const daily = await generateDaily(prisma);

    return NextResponse.json({
      created,
      processed,
      daily: { date: daily.date, count: daily.count },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    refreshing = false;
  }
}
