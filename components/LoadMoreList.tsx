"use client";

import { useState } from "react";
import { ItemCard, type ItemCardData } from "./ItemCard";

interface ApiItem {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  category: string | null;
  score: number | null;
  tags: string[];
  publishedAt: string;
  source: string;
}

interface Props {
  initialItems: ItemCardData[];
  initialCursor: string | null;
  query: string; // 追加到 API 的查询串，如 "mode=all"
}

export function LoadMoreList({ initialItems, initialCursor, query }: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/public/items?${query}&cursor=${encodeURIComponent(cursor)}&take=30`);
      const data = (await res.json()) as { items: ApiItem[]; nextCursor: string | null; hasNext: boolean };
      setItems((prev) => [
        ...prev,
        ...data.items.map((i) => ({
          id: i.id,
          title: i.title,
          url: i.url,
          summary: i.summary,
          category: i.category,
          score: i.score,
          tags: JSON.stringify(i.tags),
          imageUrl: null,
          publishedAt: new Date(i.publishedAt),
          sourceName: i.source,
        })),
      ]);
      setCursor(data.hasNext ? data.nextCursor : null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
      {cursor ? (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mx-auto mt-2 rounded-full border border-neutral-300 bg-white px-6 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
        >
          {loading ? "加载中…" : "加载更多"}
        </button>
      ) : (
        <p className="py-4 text-center text-xs text-neutral-400">没有更多了</p>
      )}
    </div>
  );
}
