import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

// 把 export-data.ts 导出的 JSON 导入当前 DATABASE_URL 指向的数据库（保留原 id/时间戳）
const prisma = new PrismaClient();

interface Dump {
  sources: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
  dailies: Array<Record<string, unknown>>;
}

function reviveDates<T extends Record<string, unknown>>(row: T, keys: string[]): T {
  for (const k of keys) {
    if (row[k] != null) (row as Record<string, unknown>)[k] = new Date(row[k] as string);
  }
  return row;
}

async function main() {
  const file = process.argv[2] ?? join(process.cwd(), "dist", "data-export.json");
  const dump = JSON.parse(readFileSync(file, "utf8")) as Dump;

  const sources = dump.sources.map((s) => reviveDates(s, ["lastFetchedAt", "createdAt"]));
  const items = dump.items.map((i) => reviveDates(i, ["publishedAt", "processedAt", "createdAt"]));
  const dailies = dump.dailies.map((d) => reviveDates(d, ["createdAt"]));

  const r1 = await prisma.source.createMany({ data: sources as never[], skipDuplicates: true });
  const r2 = await prisma.item.createMany({ data: items as never[], skipDuplicates: true });
  const r3 = await prisma.daily.createMany({ data: dailies as never[], skipDuplicates: true });
  console.log(`导入完成：信源 ${r1.count}、内容 ${r2.count}、日报 ${r3.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
