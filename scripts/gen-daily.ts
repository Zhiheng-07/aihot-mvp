import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateDaily } from "../pipeline/daily";

const prisma = new PrismaClient();

// 用法：npm run gen-daily [-- 2026-07-01]（默认生成今天的北京日日报）
async function main() {
  const dateArg = process.argv[2];
  if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    throw new Error(`日期格式应为 YYYY-MM-DD，收到: ${dateArg}`);
  }
  const { date, count } = await generateDaily(prisma, dateArg);
  console.log(`日报已生成：${date}，收录 ${count} 条精选`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
