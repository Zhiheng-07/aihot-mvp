import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// 日报归档索引：/api/public/dailies?take=30（1-180）
export async function GET(req: NextRequest) {
  const takeRaw = Number(req.nextUrl.searchParams.get("take"));
  const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 180) : 30;
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const dailies = await prisma.daily.findMany({
    orderBy: { date: "desc" },
    take,
    select: { date: true, intro: true },
  });

  return NextResponse.json({
    count: dailies.length,
    dailies: dailies.map((d) => ({
      date: d.date,
      intro: d.intro,
      permalink: `${siteUrl}/daily/${d.date}`,
      api: `${siteUrl}/api/public/daily/${d.date}`,
    })),
  });
}
