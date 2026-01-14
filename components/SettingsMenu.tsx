"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Appearance = "system" | "dark" | "light";

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // clear-data confirm modal
  const [clearOpen, setClearOpen] = useState(false);
  const [clearText, setClearText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [clearErr, setClearErr] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  useEffect(() => {
    if (!clearOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClearOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [clearOpen]);

  const appearanceValue = useMemo(() => {
    // Avoid hydration mismatch: render a stable placeholder until mounted.
    return (mounted ? (theme as Appearance) : "system") satisfies Appearance;
  }, [mounted, theme]);

  async function clearAllRoadmap() {
    if (clearing) return;
    setClearing(true);
    try {
      const res = await fetch(`/api/items`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setClearOpen(false);
      setClearText("");
      setClearErr(null);
      setOpen(false);
      // Notify board to refresh
      window.dispatchEvent(new Event("roadmap:reload"));
    } catch (e: any) {
      setClearErr(e?.message ?? "清空失败");
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <svg
            className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          设置
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="px-4 py-3">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                外观
              </div>
              <div className="mt-2">
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  value={appearanceValue}
                  onChange={(e) => setTheme(e.target.value as Appearance)}
                >
                  <option value="system">System</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>

            <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                数据
              </div>
              <button
                type="button"
                className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-medium text-red-700 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200"
                onClick={() => {
                  setClearText("");
                  setClearErr(null);
                  setClearOpen(true);
                }}
              >
                清空数据
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {clearOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="清空确认"
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 cursor-default bg-black/60"
            onClick={() => setClearOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="text-sm font-semibold text-red-700 dark:text-red-200">
                清空数据
              </div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                该操作会删除所有卡片，且不可恢复。
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                请输入 <span className="font-semibold">清空所有Roadmap</span> 以确认：
              </div>
              <input
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 dark:border-zinc-800 dark:bg-zinc-950"
                value={clearText}
                onChange={(e) => setClearText(e.target.value)}
                placeholder="清空所有Roadmap"
              />
              {clearErr ? (
                <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                  {clearErr}
                </div>
              ) : null}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                  onClick={() => setClearOpen(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={clearText !== "清空所有Roadmap" || clearing}
                  onClick={() => void clearAllRoadmap()}
                >
                  确认清空
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

