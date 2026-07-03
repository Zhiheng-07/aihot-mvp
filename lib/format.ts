// 时间格式化：北京时间 + 相对时间表述
const BJT = "Asia/Shanghai";

export function bjDateStr(d: Date): string {
  // "2026-07-02"（北京时间日）
  return new Intl.DateTimeFormat("sv-SE", { timeZone: BJT, dateStyle: "short" }).format(d);
}

export function bjTimeStr(d: Date): string {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: BJT, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

export function bjDateLabel(dateStr: string): string {
  // "2026-07-02" -> "7月2日 · 周四"，今天/昨天特殊标注
  const today = bjDateStr(new Date());
  const yesterday = bjDateStr(new Date(Date.now() - 86400_000));
  const d = new Date(`${dateStr}T12:00:00+08:00`);
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: BJT, month: "numeric", day: "numeric", weekday: "short" }).formatToParts(d);
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const base = `${month}月${day}日 · ${weekday}`;
  if (dateStr === today) return `今天 · ${base}`;
  if (dateStr === yesterday) return `昨天 · ${base}`;
  return base;
}

export function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return bjDateStr(d);
}

export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const arr = JSON.parse(tags);
    return Array.isArray(arr) ? arr.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}
