"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingsMenu from "@/components/SettingsMenu";

function SwitchIcon() {
  return (
    <svg
      className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
      viewBox="0 0 1024 1024"
      fill="currentColor"
      aria-hidden
    >
      <path d="M310.72 489.28a32 32 0 0 1-45.44 45.44l-128-128a32 32 0 0 1 0-45.44l128-128a32 32 0 1 1 45.44 45.44L205.12 384z" />
      <path d="M160 416a32 32 0 0 1 0-64h384a32 32 0 0 1 0 64z m553.28 118.72a32 32 0 0 1 45.44-45.44l128 128a32 32 0 0 1 0 45.44l-128 128a32 32 0 0 1-45.44-45.44L818.88 640z" />
      <path d="M864 608a32 32 0 0 1 0 64H480a32 32 0 0 1 0-64z" />
    </svg>
  );
}

export default function AppHeader() {
  const pathname = usePathname() || "";
  const inFeedback = pathname.startsWith("/dashboard/feedback");

  const leftTitle = inFeedback ? "User Feedback" : "Filo Roadmap";
  const leftSubtitle = inFeedback
    ? "收集与管理用户反馈（包括需求、Bug、夸赞）"
    : "板块化管理 Filo 功能排期与优先级";

  const switchHref = inFeedback ? "/dashboard/roadmap" : "/dashboard/feedback";
  const switchLabel = inFeedback ? "Filo Roadmap" : "User Feedback";

  return (
    <header className="mb-8 flex items-center justify-between gap-4">
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

      <div className="flex items-center gap-3">
        <Link
          href={switchHref}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
        >
          <SwitchIcon />
          {switchLabel}
        </Link>
        <SettingsMenu />
      </div>
    </header>
  );
}

