// 游标分页：base64({ a: publishedAt 毫秒, i: id })，对齐原站格式
export interface Cursor {
  a: number; // publishedAt (ms)
  i: string; // item id
}

export function encodeCursor(publishedAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ a: publishedAt.getTime(), i: id })).toString("base64url");
}

export function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.a === "number" && typeof parsed?.i === "string") {
      return { a: parsed.a, i: parsed.i };
    }
    return null;
  } catch {
    return null;
  }
}
