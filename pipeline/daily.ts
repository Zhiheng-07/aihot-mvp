import { PrismaClient } from "@prisma/client";
import { chat } from "../lib/llm";
import { DAILY_CATEGORY_ORDER } from "../lib/categories";
import { bjDateStr } from "../lib/format";

// 生成指定北京日的日报（默认：今天）。快照式：重复生成会覆盖。
export async function generateDaily(prisma: PrismaClient, dateStr?: string): Promise<{ date: string; count: number }> {
  const date = dateStr ?? bjDateStr(new Date());

  // 北京日 [00:00, 24:00) 对应的 UTC 区间
  const start = new Date(`${date}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86400_000);

  const items = await prisma.item.findMany({
    where: { selected: true, publishedAt: { gte: start, lt: end } },
    orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
    take: 40,
  });

  // 按分类分组，保持类内分数序
  const grouped: Record<string, string[]> = {};
  for (const cat of DAILY_CATEGORY_ORDER) grouped[cat] = [];
  for (const item of items) {
    const cat = item.category && grouped[item.category] ? item.category : "industry";
    grouped[cat].push(item.id);
  }

  // LLM 写 2-3 句导语（未配置 key 或失败则留空，不阻塞日报生成）
  let intro: string | null = null;
  if (items.length && process.env.LLM_API_KEY && process.env.LLM_API_KEY !== "sk-...") {
    try {
      const headlines = items.slice(0, 15).map((i) => `- ${i.title}`).join("\n");
      intro = (
        await chat(
          [
            {
              role: "user",
              content: `以下是 ${date} 的 AI 行业精选标题，请写 2-3 句中文日报导语，概括当日最重要的动向，不要罗列，直接输出导语正文：\n${headlines}`,
            },
          ],
          { maxTokens: 300 },
        )
      ).trim();
    } catch (e) {
      console.error(`[日报导语失败] ${(e as Error).message}`);
    }
  }

  await prisma.daily.upsert({
    where: { date },
    update: { intro, itemIds: JSON.stringify(grouped) },
    create: { date, intro, itemIds: JSON.stringify(grouped) },
  });

  return { date, count: items.length };
}
