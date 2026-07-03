import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ingest } from "../pipeline/ingest";
import { processPending } from "../pipeline/process";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 抓取 ===");
  const { fetched, created } = await ingest(prisma);
  console.log(`抓取 ${fetched} 条，新入库 ${created} 条`);

  if (!process.env.LLM_API_KEY || process.env.LLM_API_KEY === "sk-...") {
    console.log("=== 跳过 LLM 加工（未配置 LLM_API_KEY）===");
    return;
  }

  console.log("=== LLM 加工 ===");
  const { processed, failed } = await processPending(prisma);
  console.log(`加工完成 ${processed} 条，失败 ${failed} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
