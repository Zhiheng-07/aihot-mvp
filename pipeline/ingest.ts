import { PrismaClient } from "@prisma/client";
import { fetchRss } from "./fetchers/rss";
import { fetchGithubReleases } from "./fetchers/github";
import { fetchHfPapers } from "./fetchers/hf-papers";
import type { FetchedItem } from "./fetchers/types";

// 只收最近 7 天的内容，避免首次抓取灌入大量陈年旧文
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchBySource(type: string, url: string): Promise<FetchedItem[]> {
  switch (type) {
    case "rss":
      return fetchRss(url);
    case "github":
      return fetchGithubReleases(url);
    case "hf-papers":
      return fetchHfPapers(url);
    default:
      throw new Error(`未知信源类型: ${type}`);
  }
}

export async function ingest(prisma: PrismaClient): Promise<{ fetched: number; created: number }> {
  const sources = await prisma.source.findMany({ where: { enabled: true } });
  let fetched = 0;
  let created = 0;
  const cutoff = Date.now() - MAX_AGE_MS;

  for (const source of sources) {
    try {
      const items = await fetchBySource(source.type, source.url);
      fetched += items.length;

      for (const item of items) {
        if (item.publishedAt.getTime() < cutoff) continue;
        if (item.publishedAt.getTime() > Date.now() + 60_000) item.publishedAt = new Date();

        // url 唯一约束去重；已存在则跳过
        const existing = await prisma.item.findUnique({ where: { url: item.url }, select: { id: true } });
        if (existing) continue;

        await prisma.item.create({
          data: {
            sourceId: source.id,
            title: item.title,
            titleEn: item.title,
            url: item.url,
            imageUrl: item.imageUrl ?? null,
            rawExcerpt: item.rawExcerpt ?? null,
            publishedAt: item.publishedAt,
          },
        });
        created++;
      }

      await prisma.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date() },
      });
      console.log(`[抓取] ${source.name}: ${items.length} 条`);
    } catch (e) {
      console.error(`[抓取失败] ${source.name}: ${(e as Error).message}`);
    }
  }

  return { fetched, created };
}
