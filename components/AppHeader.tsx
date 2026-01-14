"use client";

import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname() || "";
  const inFeedback = pathname.startsWith("/dashboard/feedback");
  const inPraise = pathname.startsWith("/dashboard/praise");
  const inPreRelease = pathname.startsWith("/dashboard/pre-release-updates");

  const leftTitle = inFeedback
    ? "Feedback"
    : inPraise
      ? "Praise"
      : inPreRelease
        ? "Pre-release updates"
      : "Filo Roadmap";
  const leftSubtitle = inFeedback
    ? "收集与管理用户反馈（需求/建议/Bug）"
    : inPraise
      ? "收集用户夸赞与截图（Praise）"
      : inPreRelease
        ? "发布前更新与变更记录（预览）"
      : "板块化管理 Filo 功能排期与优先级";

  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="text-xl font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-sky-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-sky-300 dark:via-violet-300 dark:to-fuchsia-300">
            {leftTitle}
          </span>
        </div>
        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {leftSubtitle}
        </div>
      </div>
    </header>
  );
}

