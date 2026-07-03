import { NextRequest, NextResponse } from "next/server";
import { listItems } from "@/lib/queries";
import { isCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

// 对齐原站：GET /api/public/items?mode=selected|all&category=&since=&take=&cursor=&q=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const mode = sp.get("mode") === "all" ? "all" : "selected";
  const categoryRaw = sp.get("category") ?? undefined;
  const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined;
  const takeRaw = Number(sp.get("take"));
  const take = Number.isFinite(takeRaw) && takeRaw > 0 ? takeRaw : 30;
  const sinceRaw = sp.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : undefined;
  const q = sp.get("q") ?? undefined;
  const cursor = sp.get("cursor") ?? undefined;

  if (since && isNaN(since.getTime())) {
    return NextResponse.json({ error: "since 参数无法解析为时间" }, { status: 400 });
  }

  const { items, hasNext, nextCursor } = await listItems({ mode, category, since, take, cursor, q });
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  return NextResponse.json({
    count: items.length,
    hasNext,
    nextCursor,
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      title_en: i.titleEn,
      url: i.url,
      permalink: `${siteUrl}/items/${i.id}`,
      source: i.source.name,
      publishedAt: i.publishedAt.toISOString(),
      summary: i.summary,
      category: i.category,
      score: i.score,
      selected: i.selected,
      tags: i.tags ? JSON.parse(i.tags) : [],
    })),
  });
}
