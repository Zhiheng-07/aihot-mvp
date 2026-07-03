import Link from "next/link";
import { bjTimeStr, parseTags, relativeTime } from "@/lib/format";
import { CATEGORY_LABELS, isCategory } from "@/lib/categories";

export interface ItemCardData {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  category: string | null;
  score: number | null;
  tags: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  sourceName: string;
  sameEventCount?: number; // 同事件条目数（含自身）
}

export function ItemCard({ item }: { item: ItemCardData }) {
  const tags = parseTags(item.tags);
  return (
    <article className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
          <span title={item.publishedAt.toISOString()}>{bjTimeStr(item.publishedAt)}</span>
          <span>·</span>
          <span className="truncate">{item.sourceName}</span>
          <span>·</span>
          <span>{relativeTime(item.publishedAt)}</span>
          {item.category && isCategory(item.category) && (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-500">
              {CATEGORY_LABELS[item.category]}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold leading-snug">
          <Link href={`/items/${item.id}`} className="hover:text-orange-700">
            {item.title}
          </Link>
        </h3>
        {item.summary && <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{item.summary}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {tags.map((t) => (
            <span key={t} className="text-orange-700/80">
              #{t}
            </span>
          ))}
          {item.sameEventCount && item.sameEventCount > 1 && (
            <span className="text-neutral-400">同一事件 · {item.sameEventCount} 个信源</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {item.score != null && (
          <span
            className={`rounded-md px-2 py-1 text-sm font-bold ${
              item.score >= 70 ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-500"
            }`}
            title="精选分"
          >
            {item.score}
          </span>
        )}
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/img-proxy?u=${encodeURIComponent(item.imageUrl)}`}
            alt=""
            className="hidden h-16 w-24 rounded object-cover sm:block"
            loading="lazy"
          />
        )}
      </div>
    </article>
  );
}
