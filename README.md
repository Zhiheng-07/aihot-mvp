# AI HOT MVP — AI 行业动态聚合

产品架构对齐 aihot.virxact.com：**多源抓取 → LLM 加工（摘要/翻译/分类/打分）→ 精选流 + AI 日报 → Web / RSS / API 分发**。

## 快速开始

```bash
npm install
cp .env.example .env        # 填入 LLM_API_KEY（DeepSeek / 智谱 / 通义，OpenAI 兼容接口）
npx prisma migrate dev      # 建表
npm run db:seed             # 写入 16 个信源
npm run ingest              # 抓取 + LLM 加工（未配 key 时只抓取）
npm run gen-daily           # 生成今日日报
npm run dev                 # http://localhost:3000
```

## 功能结构

| 页面 | 说明 |
|------|------|
| `/` | 精选流（score ≥ 70），按日期分组 + 今日 TOP 5 + 分类 Tab + 搜索 |
| `/all` | 全部 AI 动态，游标分页加载更多 |
| `/daily`、`/daily/[date]` | AI 日报（北京时间日切割的快照）+ 历史归档 |
| `/items/[id]` | 详情：AI 摘要、原文链接、标签、同一事件多信源、Markdown 复制 |
| `/agent` | 公开 API 文档 |

## 公开 API

- `GET /api/public/items?mode=selected|all&category=&since=&take=&cursor=&q=` — 游标分页
- `GET /api/public/daily`、`/api/public/daily/2026-07-01`、`/api/public/dailies?take=30`
- `GET /api/public/hot-topics` — 近 24h TOP 10
- `GET /api/feed` — 精选流 RSS 2.0
- `GET /api/img-proxy?u=` — 图片代理（仅限库内已记录地址）

## 内容管道

- **抓取**（`pipeline/fetchers/`）：RSS（rss-parser）、GitHub Releases、HuggingFace Daily Papers；按 `url` 去重，只收 7 天内内容，幂等可重复跑
- **LLM 加工**（`pipeline/process.ts`）：每条生成 `{中文标题, 摘要, 分类, 0-100 分, 标签, event_key}`；score ≥ 70 进精选；`event_key` 相同 ±72h 即"同一事件"
- **日报**（`pipeline/daily.ts`）：取当日精选按分类分组，LLM 写导语，upsert 快照

信源存在 `Source` 表里，增删直接改 `scripts/seed-sources.ts` 后重跑 `npm run db:seed`。

## 定时任务（crontab）

```cron
# 每小时抓取 + 加工
0 * * * * cd /Users/linran/Coding/AI信息聚合MVP && /usr/local/bin/npm run ingest >> /tmp/aihot-ingest.log 2>&1
# 每天早上 8 点生成日报
0 8 * * * cd /Users/linran/Coding/AI信息聚合MVP && /usr/local/bin/npm run gen-daily >> /tmp/aihot-daily.log 2>&1
```

> `crontab -e` 添加；npm 路径以 `which npm` 为准。

## 技术栈

Next.js 15（App Router）· Prisma + SQLite（改 `datasource` 即可迁 Postgres）· Tailwind CSS 4 · LLM 走 OpenAI 兼容接口（`LLM_BASE_URL`/`LLM_MODEL` 可切换供应商）

## 二期候选（本期未做）

用户登录/收藏、人工精选后台、X/公众号抓取、正文全文翻译、向量搜索、Agent Skill 安装页、部署上线
