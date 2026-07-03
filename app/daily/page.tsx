import Link from "next/link";
import { prisma } from "@/lib/db";
import { DailyReport } from "@/components/DailyReport";
import { bjDateLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const [latest, archive] = await Promise.all([
    prisma.daily.findFirst({ orderBy: { date: "desc" } }),
    prisma.daily.findMany({ orderBy: { date: "desc" }, take: 30, select: { date: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        {latest ? (
          <DailyReport daily={latest} />
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
            还没有日报。运行 <code>npm run gen-daily</code> 生成第一期。
          </p>
        )}
      </div>
      <aside className="w-full shrink-0 lg:w-56">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:sticky lg:top-20">
          <h2 className="mb-3 text-sm font-bold">历史日报</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {archive.map((d) => (
              <li key={d.date}>
                <Link href={`/daily/${d.date}`} className="text-neutral-600 hover:text-orange-700">
                  {bjDateLabel(d.date)}
                </Link>
              </li>
            ))}
            {archive.length === 0 && <li className="text-xs text-neutral-400">暂无</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}
