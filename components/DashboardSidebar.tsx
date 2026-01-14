"use client";

import { useEffect, useMemo, useState } from "react";

type Board = {
  id: string;
  name: string;
  description: string;
};

export default function DashboardSidebar({
  selectedBoardId
}: {
  selectedBoardId: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

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
    if (!canCreate) return;
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
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Roadmap</div>
          <div className="text-xs text-zinc-500">
            {loading ? "加载中…" : `${boards.length} 个板块`}
          </div>
        </div>
        <a
          href="/"
          className="text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-white"
        >
          Home
        </a>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-medium text-zinc-500">Roadmaps</div>
        <div className="mt-2 space-y-1">
          {boards.map((b) => {
            const active = selectedBoardId === b.id;
            return (
              <a
                key={b.id}
                href={`/dashboard/roadmap/${b.id}`}
                className={[
                  "block rounded-xl border px-3 py-2 text-sm",
                  active
                    ? "border-sky-500/40 bg-zinc-950 text-white"
                    : "border-transparent bg-transparent text-zinc-300 hover:border-zinc-800 hover:bg-zinc-950/40"
                ].join(" ")}
              >
                <div className="truncate font-medium">{b.name}</div>
                <div className="truncate text-xs text-zinc-500">
                  {b.description || "（无描述）"}
                </div>
              </a>
            );
          })}
          {boards.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
              还没有板块。先在下方创建一个。
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-medium text-zinc-500">Actions</div>
        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-xs font-semibold text-zinc-300">
            Create & Edit Roadmaps
          </div>
          <div className="mt-3 grid gap-2">
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
              placeholder="板块名称（必填）"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
              placeholder="板块描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="rounded-lg border border-sky-500/40 bg-transparent px-3 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/10 disabled:opacity-50"
              disabled={!canCreate}
              onClick={() => void createBoard()}
            >
              新建板块
            </button>
          </div>
          {err ? (
            <div className="mt-2 text-xs text-red-400">{err}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-medium text-zinc-500">Resources</div>
        <div className="mt-2 space-y-1 text-xs text-zinc-400">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            数据库：SQLite（本地）
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            变更记录：自动写入 AuditLog
          </div>
        </div>
      </div>
    </aside>
  );
}

