import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeDaily } from "@/lib/daily-api";

export const dynamic = "force-dynamic";

// 最新一期日报
export async function GET() {
  const daily = await prisma.daily.findFirst({ orderBy: { date: "desc" } });
  if (!daily) return NextResponse.json({ error: "暂无日报" }, { status: 404 });
  return NextResponse.json(await serializeDaily(daily));
}
