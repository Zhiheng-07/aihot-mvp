import { PrismaClient } from "@prisma/client";
import { chat, extractJson } from "../lib/llm";
import { CATEGORIES, isCategory } from "../lib/categories";

const SELECTED_THRESHOLD = 70;
const BATCH_LIMIT = 60; // 每轮最多加工条数，控制耗时与费用

interface ProcessResult {
  title_zh: string;
  summary_zh: string;
  category: string;
  score: number;
  tags: string[];
  event_key: string;
}

const SYSTEM_PROMPT = `你是 AI 行业资讯编辑。对给定的一条 AI 相关内容，输出严格的 JSON（不要输出任何其他文字）：
{
  "title_zh": "简洁准确的中文标题（若原文即中文可微调润色）",
  "summary_zh": "2-3 句中文摘要，说清发生了什么、为什么重要",
  "category": "${CATEGORIES.join(" | ")} 之一（model=模型发布/更新，product=产品/工具，industry=行业/公司动态，paper=论文/研究，tip=技巧/实践经验）",
  "score": 0 到 100 的整数（对 AI 从业者的价值：重大模型/产品发布 80+，值得关注 65-79，一般 40-64，噪声 <40。注意：与 AI 无直接关系的内容——汽车、游戏、普通消费电子、航天、疫苗等——无论本身多重要，一律 <40）,
  "tags": ["2-4 个中文话题标签"],
  "event_key": "事件归一键：小写英文短横线连接，如 claude-sonnet-5-release；同一事件的不同报道必须生成相同的 key；孤立内容用其主题生成"
}`;

export async function processPending(prisma: PrismaClient): Promise<{ processed: number; failed: number }> {
  const pending = await prisma.item.findMany({
    where: { processedAt: null },
    include: { source: { select: { name: true, categoryHint: true } } },
    orderBy: { publishedAt: "desc" },
    take: BATCH_LIMIT,
  });

  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    const userPrompt = [
      `来源：${item.source.name}`,
      item.source.categoryHint ? `来源默认分类倾向：${item.source.categoryHint}` : "",
      `标题：${item.titleEn ?? item.title}`,
      `发布时间：${item.publishedAt.toISOString()}`,
      item.rawExcerpt ? `内容节选：${item.rawExcerpt.slice(0, 1200)}` : "（无正文节选，仅凭标题判断）",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await callWithRetry(userPrompt);
      const category = isCategory(result.category) ? result.category : (item.source.categoryHint ?? "industry");
      const score = Math.max(0, Math.min(100, Math.round(result.score)));

      await prisma.item.update({
        where: { id: item.id },
        data: {
          title: result.title_zh || item.title,
          summary: result.summary_zh || null,
          category,
          score,
          selected: score >= SELECTED_THRESHOLD,
          tags: JSON.stringify(Array.isArray(result.tags) ? result.tags.slice(0, 4) : []),
          eventKey: normalizeEventKey(result.event_key),
          processedAt: new Date(),
        },
      });
      processed++;
      console.log(`[加工] ${score} ${result.title_zh.slice(0, 50)}`);
    } catch (e) {
      failed++;
      console.error(`[加工失败] ${item.title.slice(0, 60)}: ${(e as Error).message}`);
    }
  }

  return { processed, failed };
}

// 解析失败重试一次；仍失败则抛出，条目留待下轮
async function callWithRetry(userPrompt: string): Promise<ProcessResult> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const reply = await chat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        { jsonMode: true, maxTokens: 800 },
      );
      const parsed = extractJson<ProcessResult>(reply);
      if (!parsed.title_zh || typeof parsed.score !== "number") throw new Error("JSON 字段缺失");
      return parsed;
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error("未知错误");
}

function normalizeEventKey(key: unknown): string | null {
  if (typeof key !== "string" || !key.trim()) return null;
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || null;
}
