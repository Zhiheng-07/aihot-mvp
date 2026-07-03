const ENDPOINTS = [
  { intent: "默认 / 宽问题", api: "GET /api/public/items?mode=selected&since=<ISO时间>" },
  { intent: "明确说“日报”", api: "GET /api/public/daily" },
  { intent: "指定日期的日报", api: "GET /api/public/daily/2026-07-01" },
  { intent: "日报归档索引", api: "GET /api/public/dailies?take=30" },
  { intent: "“全部 / 完整”", api: "GET /api/public/items?mode=all" },
  { intent: "分类查询", api: "GET /api/public/items?mode=selected&category=model" },
  { intent: "关键词搜索", api: "GET /api/public/items?q=OpenAI" },
  { intent: "当前热点", api: "GET /api/public/hot-topics" },
  { intent: "RSS 订阅", api: "GET /api/feed" },
];

export default function AgentPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Agent 接入</h1>
      <p className="mt-2 text-[15px] text-neutral-600">
        本站数据通过公开 REST API 与 RSS 对外开放，无需 API Key。适合接入 Claude Code、Cursor
        等 Agent，或任意 RSS 阅读器与自定义集成。
      </p>

      <h2 className="mt-6 text-lg font-bold">API 端点</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <th className="p-3 font-medium">用户意图</th>
              <th className="p-3 font-medium">调用端点</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={e.api} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 text-neutral-600">{e.intent}</td>
                <td className="p-3 font-mono text-xs">{e.api}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 text-lg font-bold">items 返回结构</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-100">
{`{
  "count": 30,
  "hasNext": true,
  "nextCursor": "eyJhIjoxNz...",   // 传回 cursor 参数翻下一页
  "items": [{
    "id": "cmr...",
    "title": "中文标题",
    "title_en": "原文标题",
    "url": "原文链接",
    "permalink": "本站详情页",
    "source": "OpenAI News",
    "publishedAt": "2026-07-02T00:56:56.000Z",
    "summary": "LLM 中文摘要",
    "category": "model | product | industry | paper | tip",
    "score": 77,
    "selected": true,
    "tags": ["智能体", "产品更新"]
  }]
}`}
      </pre>

      <h2 className="mt-6 text-lg font-bold">使用须知</h2>
      <ul className="mt-2 list-disc pl-5 text-[15px] leading-relaxed text-neutral-600">
        <li>摘要由 LLM 生成，请通过 <code className="text-xs">url</code> 字段核对原文。</li>
        <li>日报按北京时间零点切割，是定时快照；实时内容请用 items 接口。</li>
        <li>宽问题优先 <code className="text-xs">mode=selected</code>，仅在明确要求完整时用 <code className="text-xs">mode=all</code>。</li>
      </ul>
    </article>
  );
}
