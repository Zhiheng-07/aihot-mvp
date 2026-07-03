/* 明树数据横排组合标：树形图案 + BRIdata/明树数据 文字块（均裁剪自 public/brand/mingshu.svg） */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.svg" alt="" className="h-8 w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-text.svg" alt="BRIdata 明树数据" className="h-7 w-auto" />
    </span>
  );
}
