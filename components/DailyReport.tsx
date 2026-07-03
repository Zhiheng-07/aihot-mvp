import Link from "next/link";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS, DAILY_CATEGORY_ORDER, isCategory } from "@/lib/categories";
import { bjDateLabel } from "@/lib/format";
import type { Daily } from "@prisma/client";

// 渲染一期日报（服务端组件，负责联表取条目）
export async function DailyReport({ daily }: { daily: Daily }) {
  const grouped = JSON.parse(daily.itemIds) as Record<string, string[]>;
  const allIds = Object.values(grouped).flat();
  const items = await prisma.item.findMany({
    where: { id: { in: allIds } },
    include: { source: { select: { name: true } } },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const total = allIds.filter((id) => byId.has(id)).length;

  return (
    <article>
      <h1 className="text-2xl font-bold">AI 日报 · {bjDateLabel(daily.date)}</h1>
      <p className="mt-1 text-sm text-neutral-400">共 {total} 条精选</p>

      {daily.intro && (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/50 p-4 text-[15px] leading-relaxed">
          {daily.intro}
        </div>
      )}

      {total === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          当日暂无精选内容
        </p>
      )}

      {DAILY_CATEGORY_ORDER.map((cat) => {
        const ids = grouped[cat] ?? [];
        const catItems = ids.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => !!i);
        if (!catItems.length) return null;
        return (
          <section key={cat} className="mt-6">
            <h2 className="mb-2 border-l-4 border-orange-500 pl-2 text-base font-bold">
              {isCategory(cat) ? CATEGORY_LABELS[cat] : cat}（{catItems.length}）
            </h2>
            <ul className="flex flex-col gap-2">
              {catItems.map((item) => (
                <li key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <Link href={`/items/${item.id}`} className="font-medium hover:text-orange-700">
                    {item.title}
                  </Link>
                  {item.summary && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{item.summary}</p>}
                  <span className="mt-1 block text-xs text-neutral-400">
                    {item.source.name} · {item.score} 分
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}
