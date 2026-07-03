import Parser from "rss-parser";
import type { FetchedItem } from "./types";

const parser = new Parser({
  timeout: 20_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; aihot-mvp/0.1; +https://github.com)",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

// 从条目里尽力提取一张配图
function extractImage(item: Record<string, unknown>): string | undefined {
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && (enclosure.type?.startsWith("image/") ?? true)) return enclosure.url;

  const media = item.mediaContent as { $?: { url?: string } } | undefined;
  if (media?.$?.url) return media.$.url;

  const thumb = item.mediaThumbnail as { $?: { url?: string } } | undefined;
  if (thumb?.$?.url) return thumb.$.url;

  const html = (item["content:encoded"] as string) || (item.content as string) || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

// 去 HTML 标签、压缩空白，截取正文节选
function toExcerpt(item: Record<string, unknown>, max = 1500): string | undefined {
  const raw =
    (item.contentSnippet as string) ||
    (item["content:encoded"] as string) ||
    (item.content as string) ||
    (item.summary as string) ||
    "";
  const text = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.slice(0, max) : undefined;
}

export async function fetchRss(feedUrl: string): Promise<FetchedItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: FetchedItem[] = [];
  for (const entry of feed.items ?? []) {
    const url = entry.link?.trim();
    const title = entry.title?.trim();
    if (!url || !title) continue;
    const published = entry.isoDate || entry.pubDate;
    items.push({
      title,
      url,
      publishedAt: published ? new Date(published) : new Date(),
      rawExcerpt: toExcerpt(entry as unknown as Record<string, unknown>),
      imageUrl: extractImage(entry as unknown as Record<string, unknown>),
    });
  }
  return items;
}
