"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Appearance = "system" | "dark" | "light";

const LS_OPENAI_KEY = "openai_api_key";

function EyeIcon({ off, className }: { off?: boolean; className?: string }) {
  if (off) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.61-1.49 1.62-3.18 3.04-4.64" />
        <path d="M9.9 4.24A10.83 10.83 0 0 1 12 4c5 0 9.27 3.89 11 8-0.55 1.34-1.42 2.85-2.62 4.25" />
        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
        <path d="M1 1l22 22" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SettingsMenu({
  compact,
  align = "right",
  placement = "bottom"
}: {
  compact?: boolean;
  align?: "left" | "right";
  placement?: "top" | "bottom";
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // API key
  const [apiKey, setApiKey] = useState("");
  const [apiSaved, setApiSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Load persisted key when mounted (client-only).
    try {
      const v = window.localStorage.getItem(LS_OPENAI_KEY) ?? "";
      setApiKey(v);
    } catch {
      // ignore
    }
  }, []);

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

  const appearanceValue = useMemo(() => {
    // Avoid hydration mismatch: render a stable placeholder until mounted.
    return (mounted ? (theme as Appearance) : "system") satisfies Appearance;
  }, [mounted, theme]);

  return (
    <>
      <div className="relative z-50" ref={wrapRef}>
        <button
          type="button"
          className={
            compact
              ? "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
              : "inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
          }
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
          {compact ? <span className="sr-only">设置</span> : "设置"}
        </button>

        {open ? (
          <div
            role="menu"
            className={[
              "absolute z-50 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950",
              align === "left" ? "left-0" : "right-0",
              placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
            ].join(" ")}
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
                API key
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiSaved(false);
                  }}
                  placeholder="sk-..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white"
                  onClick={() => setShowKey((v) => !v)}
                  title={showKey ? "隐藏" : "显示"}
                  aria-label={showKey ? "隐藏" : "显示"}
                >
                  <EyeIcon off={!showKey} className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                  onClick={() => {
                    setApiKey("");
                    setApiSaved(false);
                    try {
                      window.localStorage.removeItem(LS_OPENAI_KEY);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  清除
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
                  onClick={() => {
                    try {
                      window.localStorage.setItem(LS_OPENAI_KEY, apiKey.trim());
                      setApiSaved(true);
                    } catch {
                      setApiSaved(false);
                    }
                  }}
                  disabled={!apiKey.trim()}
                >
                  {apiSaved ? "已保存" : "保存"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

