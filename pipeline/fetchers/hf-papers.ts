import type { FetchedItem } from "./types";

// HuggingFace Daily Papers 官方 API
export async function fetchHfPapers(apiUrl: string): Promise<FetchedItem[]> {
  const res = await fetch(apiUrl, {
    headers: { "User-Agent": "aihot-mvp/0.1" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HF Papers API ${res.status}`);

  const entries = (await res.json()) as Array<{
    paper?: {
      id: string;
      title: string;
      summary?: string;
      publishedAt?: string;
      thumbnail?: string;
    };
    publishedAt?: string;
  }>;

  const items: FetchedItem[] = [];
  for (const entry of entries) {
    const paper = entry.paper;
    if (!paper?.id || !paper.title) continue;
    const published = entry.publishedAt || paper.publishedAt;
    items.push({
      title: paper.title.replace(/\s+/g, " ").trim(),
      url: `https://huggingface.co/papers/${paper.id}`,
      publishedAt: published ? new Date(published) : new Date(),
      rawExcerpt: paper.summary?.replace(/\s+/g, " ").trim().slice(0, 1500),
      imageUrl: paper.thumbnail,
    });
  }
  return items;
}
