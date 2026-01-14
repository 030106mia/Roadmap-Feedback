"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type Appearance = "system" | "dark" | "light";

export default function AppearanceSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  const value = (mounted ? (theme as Appearance) : "system") satisfies Appearance;

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      <span className="hidden sm:inline">外观</span>
      <select
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        value={value}
        onChange={(e) => setTheme(e.target.value as Appearance)}
      >
        <option value="system">System</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </label>
  );
}

