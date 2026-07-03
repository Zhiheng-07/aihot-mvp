import { NextResponse } from "next/server";
import { hotTopics } from "@/lib/queries";

export const dynamic = "force-dynamic";

// 近 24h 高分 TOP 10
export async function GET() {
  const items = await hotTopics(10);
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  return NextResponse.json({
    count: items.length,
    items: items.map((i, rank) => ({
      rank: rank + 1,
      id: i.id,
      title: i.title,
      url: i.url,
      permalink: `${siteUrl}/items/${i.id}`,
      source: i.source.name,
      publishedAt: i.publishedAt.toISOString(),
      score: i.score,
      category: i.category,
    })),
  });
}
