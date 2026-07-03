import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// 图片代理：绕过外链防盗链。仅允许代理 DB 中已记录的图片地址，防止开放代理被滥用。
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("缺少 u 参数", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new Response("非法 URL", { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new Response("非法协议", { status: 400 });
  }

  const known = await prisma.item.findFirst({ where: { imageUrl: u }, select: { id: true } });
  if (!known) return new Response("未知图片地址", { status: 403 });

  try {
    const upstream = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; aihot-mvp/0.1)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) return new Response("上游获取失败", { status: 502 });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return new Response("非图片内容", { status: 415 });

    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("上游超时", { status: 504 });
  }
}
