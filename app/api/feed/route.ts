import { listItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 精选流 RSS 2.0 输出
export async function GET() {
  const { items } = await listItems({ mode: "selected", take: 50 });
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const entries = items
    .map(
      (i) => `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${escapeXml(i.url)}</link>
      <guid isPermaLink="false">${i.id}</guid>
      <pubDate>${i.publishedAt.toUTCString()}</pubDate>
      <description>${escapeXml(i.summary ?? i.rawExcerpt ?? "")}</description>
      <source url="${escapeXml(`${siteUrl}/items/${i.id}`)}">${escapeXml(i.source.name)}</source>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AI HOT MVP · 精选</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>AI 行业动态聚合 · 每日精选</description>
    <language>zh-cn</language>
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
