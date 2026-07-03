import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeDaily } from "@/lib/daily-api";

export const dynamic = "force-dynamic";

// 指定日期日报：/api/public/daily/2026-07-01
export async function GET(_req: NextRequest, ctx: { params: Promise<{ date: string }> }) {
  const { date } = await ctx.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式应为 YYYY-MM-DD" }, { status: 400 });
  }
  const daily = await prisma.daily.findUnique({ where: { date } });
  if (!daily) return NextResponse.json({ error: `${date} 无日报` }, { status: 404 });
  return NextResponse.json(await serializeDaily(daily));
}
