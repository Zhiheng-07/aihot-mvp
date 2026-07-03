export default function AboutPage() {
  return (
    <article className="prose mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">关于</h1>
      <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-neutral-700">
        <p>
          <strong>AI HOT MVP</strong> 是一个 AI 行业动态聚合平台：每天从官方博客、媒体社区、GitHub
          Releases、HuggingFace 论文等信源抓取新动静，由 LLM
          过滤信息噪声——摘要、翻译、分类、打分，把真正值得看的几条留下来。
        </p>
        <p>
          核心功能：<strong>精选流</strong>（编辑分 ≥ 70 的内容）、<strong>全部 AI 动态</strong>
          （完整时间线）、<strong>AI 日报</strong>（每日定时快照）、<strong>公开 API 与 RSS</strong>
          （见 Agent 接入页）。
        </p>
        <p className="text-sm text-neutral-500">
          内容摘要由 LLM 生成，可能存在偏差，请以原文为准。原文版权归各来源所有；如需更正或下架，请通过反馈渠道联系。
        </p>
      </div>
    </article>
  );
}
