import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { sameEventItems } from "@/lib/queries";
import { CATEGORY_LABELS, isCategory } from "@/lib/categories";
import { parseTags, relativeTime, bjDateStr } from "@/lib/format";
import { CopyMarkdown } from "@/components/CopyMarkdown";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: Props) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: { source: { select: { name: true } } },
  });
  if (!item) notFound();

  const related = item.eventKey ? await sameEventItems(item.eventKey, item.id, item.publishedAt) : [];
  const tags = parseTags(item.tags);

  const markdown = [
    `## ${item.title}`,
    "",
    item.summary ?? "",
    "",
    `- 来源：${item.source.name}`,
    `- 时间：${bjDateStr(item.publishedAt)}`,
    `- 原文：${item.url}`,
    tags.length ? `- 标签：${tags.map((t) => `#${t}`).join(" ")}` : "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-2 flex items-center gap-2 text-sm text-neutral-400">
        <span>{item.source.name}</span>
        <span>·</span>
        <span>{bjDateStr(item.publishedAt)}（{relativeTime(item.publishedAt)}）</span>
        {item.category && isCategory(item.category) && (
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
            {CATEGORY_LABELS[item.category]}
          </span>
        )}
        {item.score != null && (
          <span className="ml-auto rounded-md bg-orange-100 px-2 py-0.5 font-bold text-orange-700">
            精选分 {item.score}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold leading-snug">{item.title}</h1>
      {item.titleEn && item.titleEn !== item.title && (
        <p className="mt-1 text-sm text-neutral-400">{item.titleEn}</p>
      )}

      {item.summary && (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
          <div className="mb-1 text-xs font-semibold text-orange-600">AI 摘要（LLM 生成，请以原文为准）</div>
          <p className="text-[15px] leading-relaxed text-neutral-800">{item.summary}</p>
        </div>
      )}

      {item.rawExcerpt && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold text-neutral-400">原文节选</div>
          <p className="text-sm leading-relaxed text-neutral-600">{item.rawExcerpt}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm text-white hover:bg-neutral-700"
        >
          阅读原文 ↗
        </a>
        <CopyMarkdown markdown={markdown} />
        <div className="flex flex-wrap gap-2 text-sm text-orange-700/80">
          {tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-neutral-500">
            同一事件 · {related.length + 1} 篇报道
          </h2>
          <ul className="flex flex-col gap-2">
            {related.map((r) => (
              <li key={r.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <Link href={`/items/${r.id}`} className="font-medium hover:text-orange-700">
                  {r.title}
                </Link>
                <span className="ml-2 text-xs text-neutral-400">
                  {r.source.name} · {relativeTime(r.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
