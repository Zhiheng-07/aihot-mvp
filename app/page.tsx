import Link from "next/link";
import { listItems, hotTopics, sameEventCounts } from "@/lib/queries";
import { ItemCard } from "@/components/ItemCard";
import { CATEGORIES, CATEGORY_LABELS, isCategory } from "@/lib/categories";
import { bjDateStr, bjDateLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { category, q } = await searchParams;
  const activeCategory = category && isCategory(category) ? category : undefined;

  const [{ items }, top5] = await Promise.all([
    listItems({ mode: "selected", category: activeCategory, q, take: 60 }),
    hotTopics(5),
  ]);
  const eventCounts = await sameEventCounts(items);

  // 按北京日分组
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = bjDateStr(item.publishedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        {/* 分类 Tab + 搜索 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className={`rounded-full px-3 py-1 text-sm ${!activeCategory ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}
          >
            精选
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/?category=${c}`}
              className={`rounded-full px-3 py-1 text-sm ${activeCategory === c ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
          <form action="/" className="ml-auto">
            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="搜索标题 / 摘要…"
              className="w-48 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm outline-none focus:border-neutral-400"
            />
          </form>
        </div>

        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
            暂无精选内容。请先运行 <code>npm run ingest</code>（需配置 LLM_API_KEY 以生成精选分）。
          </p>
        )}

        {[...groups.entries()].map(([date, group]) => (
          <section key={date} className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-neutral-500">{bjDateLabel(date)}</h2>
            <div className="flex flex-col gap-3">
              {group.map((item) => (
                <ItemCard
                  key={item.id}
                  item={{
                    ...item,
                    sourceName: item.source.name,
                    sameEventCount: item.eventKey ? eventCounts.get(item.eventKey) : undefined,
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 今日 TOP 5 */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:sticky lg:top-20">
          <h2 className="mb-3 text-sm font-bold">🔥 今日 TOP 5</h2>
          <ol className="flex flex-col gap-3">
            {top5.map((item, i) => (
              <li key={item.id} className="flex gap-2 text-sm">
                <span className={`font-bold ${i < 3 ? "text-orange-600" : "text-neutral-400"}`}>{i + 1}</span>
                <div className="min-w-0">
                  <Link href={`/items/${item.id}`} className="line-clamp-2 leading-snug hover:text-orange-700">
                    {item.title}
                  </Link>
                  <span className="text-xs text-neutral-400">{item.score} 分 · {item.source.name}</span>
                </div>
              </li>
            ))}
            {top5.length === 0 && <li className="text-xs text-neutral-400">暂无数据</li>}
          </ol>
        </div>
      </aside>
    </div>
  );
}
