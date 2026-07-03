"use client";

import { useState } from "react";

export function CopyMarkdown({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
    >
      {copied ? "已复制 ✓" : "复制 Markdown"}
    </button>
  );
}
