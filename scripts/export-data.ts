import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// 全量导出 Source/Item/Daily 为 JSON（用于 SQLite → Postgres 迁移）
const prisma = new PrismaClient();

async function main() {
  const [sources, items, dailies] = await Promise.all([
    prisma.source.findMany(),
    prisma.item.findMany(),
    prisma.daily.findMany(),
  ]);
  const out = join(process.cwd(), "dist", "data-export.json");
  mkdirSync(join(process.cwd(), "dist"), { recursive: true });
  writeFileSync(out, JSON.stringify({ sources, items, dailies }, null, 1));
  console.log(`已导出 ${sources.length} 个信源、${items.length} 条内容、${dailies.length} 期日报 → ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
