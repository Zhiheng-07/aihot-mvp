import { prisma } from "./db";
import type { Daily } from "@prisma/client";
import { DAILY_CATEGORY_ORDER } from "./categories";

// Daily 记录 → API 响应结构（联表补全条目字段）
export async function serializeDaily(daily: Daily) {
  const grouped = JSON.parse(daily.itemIds) as Record<string, string[]>;
  const allIds = Object.values(grouped).flat();
  const items = await prisma.item.findMany({
    where: { id: { in: allIds } },
    include: { source: { select: { name: true } } },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const sections = DAILY_CATEGORY_ORDER.filter((cat) => (grouped[cat] ?? []).length > 0).map((cat) => ({
    category: cat,
    items: (grouped[cat] ?? [])
      .map((id) => byId.get(id))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .map((i) => ({
        id: i.id,
        title: i.title,
        title_en: i.titleEn,
        url: i.url,
        permalink: `${siteUrl}/items/${i.id}`,
        source: i.source.name,
        publishedAt: i.publishedAt.toISOString(),
        summary: i.summary,
        score: i.score,
        tags: i.tags ? JSON.parse(i.tags) : [],
      })),
  }));

  return {
    date: daily.date,
    intro: daily.intro,
    count: sections.reduce((n, s) => n + s.items.length, 0),
    sections,
  };
}
