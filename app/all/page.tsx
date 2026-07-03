import Link from "next/link";
import { listItems } from "@/lib/queries";
import { LoadMoreList } from "@/components/LoadMoreList";
import { CATEGORIES, CATEGORY_LABELS, isCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function AllPage({ searchParams }: Props) {
  const { category, q } = await searchParams;
  const activeCategory = category && isCategory(category) ? category : undefined;

  const { items, nextCursor, hasNext } = await listItems({
    mode: "all",
    category: activeCategory,
    q,
    take: 30,
  });

  const apiQuery = new URLSearchParams({ mode: "all" });
  if (activeCategory) apiQuery.set("category", activeCategory);
  if (q) apiQuery.set("q", q);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-lg font-bold">全部 AI 动态</h1>
        <Link
          href="/all"
          className={`rounded-full px-3 py-1 text-sm ${!activeCategory ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}
        >
          全部
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/all?category=${c}`}
            className={`rounded-full px-3 py-1 text-sm ${activeCategory === c ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 border border-neutral-200"}`}
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
        <form action="/all" className="ml-auto">
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

      <LoadMoreList
        initialItems={items.map((i) => ({
          id: i.id,
          title: i.title,
          url: i.url,
          summary: i.summary,
          category: i.category,
          score: i.score,
          tags: i.tags,
          imageUrl: i.imageUrl,
          publishedAt: i.publishedAt,
          sourceName: i.source.name,
        }))}
        initialCursor={hasNext ? nextCursor : null}
        query={apiQuery.toString()}
      />
    </div>
  );
}
