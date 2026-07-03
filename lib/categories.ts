// 分类枚举与中文名映射（对齐原站五分类）
export const CATEGORIES = ["model", "product", "industry", "paper", "tip"] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  model: "模型",
  product: "产品",
  industry: "行业",
  paper: "论文",
  tip: "技巧",
};

export function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}

// 日报展示顺序
export const DAILY_CATEGORY_ORDER: Category[] = ["model", "product", "industry", "paper", "tip"];
