import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 首批信源。均免费可用；Anthropic 官方无 RSS，暂缺（二期可走第三方镜像或爬虫）
const SOURCES: Array<{ name: string; type: string; url: string; categoryHint?: string }> = [
  // ── 官方博客 ──
  { name: "OpenAI News", type: "rss", url: "https://openai.com/news/rss.xml", categoryHint: "product" },
  { name: "Google DeepMind Blog", type: "rss", url: "https://deepmind.google/blog/rss.xml", categoryHint: "model" },
  { name: "Hugging Face Blog", type: "rss", url: "https://huggingface.co/blog/feed.xml", categoryHint: "model" },
  { name: "Meta AI Blog", type: "rss", url: "https://ai.meta.com/blog/rss/", categoryHint: "industry" },
  { name: "Cloudflare Blog", type: "rss", url: "https://blog.cloudflare.com/rss/", categoryHint: "product" },

  // ── 媒体 / 社区 ──
  { name: "TechCrunch AI", type: "rss", url: "https://techcrunch.com/category/artificial-intelligence/feed/", categoryHint: "industry" },
  { name: "MarkTechPost", type: "rss", url: "https://www.marktechpost.com/feed/", categoryHint: "model" },
  { name: "Simon Willison's Weblog", type: "rss", url: "https://simonwillison.net/atom/everything/", categoryHint: "tip" },
  { name: "Hacker News 前排", type: "rss", url: "https://hnrss.org/frontpage?points=150", categoryHint: "industry" },
  { name: "IT之家", type: "rss", url: "https://www.ithome.com/rss/", categoryHint: "industry" },

  // ── 代码 / 学术 ──
  { name: "GitHub: vllm-project/vllm", type: "github", url: "vllm-project/vllm", categoryHint: "product" },
  { name: "GitHub: ollama/ollama", type: "github", url: "ollama/ollama", categoryHint: "product" },
  { name: "GitHub: langchain-ai/langchain", type: "github", url: "langchain-ai/langchain", categoryHint: "product" },
  { name: "GitHub: ggml-org/llama.cpp", type: "github", url: "ggml-org/llama.cpp", categoryHint: "product" },
  { name: "GitHub: comfyanonymous/ComfyUI", type: "github", url: "comfyanonymous/ComfyUI", categoryHint: "product" },
  { name: "HuggingFace Daily Papers", type: "hf-papers", url: "https://huggingface.co/api/daily_papers", categoryHint: "paper" },
];

async function main() {
  let created = 0;
  for (const s of SOURCES) {
    await prisma.source.upsert({
      where: { type_url: { type: s.type, url: s.url } },
      update: { name: s.name, categoryHint: s.categoryHint ?? null },
      create: { ...s, categoryHint: s.categoryHint ?? null },
    });
    created++;
  }
  console.log(`已写入/更新 ${created} 个信源`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
