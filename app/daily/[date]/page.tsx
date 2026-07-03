import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DailyReport } from "@/components/DailyReport";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function DailyByDatePage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const daily = await prisma.daily.findUnique({ where: { date } });
  if (!daily) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/daily" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 返回最新日报
      </Link>
      <div className="mt-3">
        <DailyReport daily={daily} />
      </div>
    </div>
  );
}
