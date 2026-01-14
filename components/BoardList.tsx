"use client";

import { useEffect, useMemo, useState } from "react";

type Board = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export default function BoardList() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/boards", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { boards: Board[] };
      setBoards(data.boards);
    } catch (e: any) {
      setErr(e?.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createBoard() {
    if (!canSubmit) return;
    setErr(null);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    setName("");
    setDescription("");
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-sm font-semibold">创建板块</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">板块名称</div>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：增长、支付、基础设施"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">板块描述（可选）</div>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="该板块的范围、目标等"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void createBoard()}
          >
            新建板块
          </button>
          <div className="text-xs text-zinc-500">
            {loading ? "加载中…" : `共 ${boards.length} 个板块`}
          </div>
        </div>
        {err ? (
          <div className="mt-3 text-sm text-red-400">{err}</div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => (
          <a
            key={b.id}
            href={`/boards/${b.id}`}
            className="block rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-600"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{b.name}</div>
                <div className="mt-1 line-clamp-2 text-sm text-zinc-400">
                  {b.description || "（无描述）"}
                </div>
              </div>
              <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-400">
                进入
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

