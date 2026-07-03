import type { FetchedItem } from "./types";

// 抓取 GitHub 仓库最新 Releases（repo 形如 "owner/name"）
export async function fetchGithubReleases(repo: string): Promise<FetchedItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aihot-mvp/0.1",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=10`, {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${repo}`);

  const releases = (await res.json()) as Array<{
    name: string | null;
    tag_name: string;
    html_url: string;
    published_at: string | null;
    draft: boolean;
    prerelease: boolean;
    body: string | null;
  }>;

  return releases
    .filter((r) => !r.draft && r.published_at)
    .map((r) => ({
      title: `${repo} ${r.name || r.tag_name}${r.prerelease ? "（预发布）" : ""}`,
      url: r.html_url,
      publishedAt: new Date(r.published_at!),
      rawExcerpt: r.body?.replace(/\s+/g, " ").trim().slice(0, 1500) || undefined,
    }));
}
