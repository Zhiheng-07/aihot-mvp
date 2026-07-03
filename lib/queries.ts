import { prisma } from "./db";
import { decodeCursor, encodeCursor } from "./cursor";
import type { Prisma } from "@prisma/client";

export interface ListParams {
  mode?: "selected" | "all";
  category?: string;
  since?: Date;
  take?: number;
  cursor?: string;
  q?: string;
}

export type ItemWithSource = Prisma.ItemGetPayload<{ include: { source: { select: { name: true } } } }>;

export interface ListResult {
  items: ItemWithSource[];
  hasNext: boolean;
  nextCursor: string | null;
}

const MAX_TAKE = 100;

// 精选流 / 全部流的统一查询：稳定游标分页（publishedAt desc, id desc）
export async function listItems(params: ListParams): Promise<ListResult> {
  const take = Math.min(Math.max(params.take ?? 30, 1), MAX_TAKE);
  const where: Prisma.ItemWhereInput = {};

  if ((params.mode ?? "selected") === "selected") where.selected = true;
  if (params.category) where.category = params.category;
  if (params.since) where.publishedAt = { gte: params.since };
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { summary: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const cursorFilter: Prisma.ItemWhereInput[] = [];
  if (params.cursor) {
    const c = decodeCursor(params.cursor);
    if (c) {
      const at = new Date(c.a);
      cursorFilter.push({
        OR: [{ publishedAt: { lt: at } }, { publishedAt: at, id: { lt: c.i } }],
      });
    }
  }

  const items = await prisma.item.findMany({
    where: cursorFilter.length ? { AND: [where, ...cursorFilter] } : where,
    include: { source: { select: { name: true } } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: take + 1, // 多取一条判断 hasNext
  });

  const hasNext = items.length > take;
  const page = hasNext ? items.slice(0, take) : items;
  const last = page[page.length - 1];

  return {
    items: page,
    hasNext,
    nextCursor: hasNext && last ? encodeCursor(last.publishedAt, last.id) : null,
  };
}

// 批量统计同事件条目数（eventKey 相同 ± 72h 窗口）
export async function sameEventCounts(items: Array<{ eventKey: string | null }>): Promise<Map<string, number>> {
  const keys = [...new Set(items.map((i) => i.eventKey).filter((k): k is string => !!k))];
  if (!keys.length) return new Map();
  const grouped = await prisma.item.groupBy({
    by: ["eventKey"],
    where: { eventKey: { in: keys } },
    _count: { _all: true },
  });
  return new Map(grouped.map((g) => [g.eventKey as string, g._count._all]));
}

// 同事件其他报道（详情页用）
export async function sameEventItems(eventKey: string, excludeId: string, around: Date) {
  const windowMs = 72 * 60 * 60 * 1000;
  return prisma.item.findMany({
    where: {
      eventKey,
      id: { not: excludeId },
      publishedAt: { gte: new Date(around.getTime() - windowMs), lte: new Date(around.getTime() + windowMs) },
    },
    include: { source: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
}

// 近 24h 高分 TOP N（热点排行）
export async function hotTopics(limit = 5) {
  return prisma.item.findMany({
    where: {
      publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      score: { not: null },
    },
    include: { source: { select: { name: true } } },
    orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}
