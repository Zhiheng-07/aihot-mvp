// 各 fetcher 输出的统一条目结构
export interface FetchedItem {
  title: string;
  url: string;
  publishedAt: Date;
  rawExcerpt?: string;
  imageUrl?: string;
}
