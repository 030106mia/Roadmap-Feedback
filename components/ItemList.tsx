"use client";

import { useEffect, useMemo, useState } from "react";

type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "BACKLOG" | "NEXT_UP" | "IN_PROGRESS" | "DONE" | "PLANNED";

type ItemImage = {
  id: string;
  url: string;
  caption: string;
};

type Item = {
  id: string;
  boardId: string;
  title: string;
  description: string;
  source: string;
  priority: Priority;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  images: ItemImage[];
  createdAt: string;
  updatedAt: string;
};

type Board = {
  id: string;
  name: string;
  description: string;
};

const PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
const STATUSES: Exclude<Status, "PLANNED">[] = [
  "BACKLOG",
  "NEXT_UP",
  "IN_PROGRESS",
  "DONE"
];

function statusLabel(s: Status) {
  if (s === "BACKLOG") return "Backlog";
  if (s === "NEXT_UP") return "Next up";
  if (s === "IN_PROGRESS") return "进行中";
  return "已完成";
}

function normalizeStatus(s: Status): Exclude<Status, "PLANNED"> {
  return s === "PLANNED" ? "BACKLOG" : s;
}

function priorityClass(p: Priority) {
  if (p === "P0") return "text-red-200 border-red-900/60 bg-red-950/40";
  if (p === "P1") return "text-amber-200 border-amber-900/60 bg-amber-950/40";
  if (p === "P2") return "text-zinc-200 border-zinc-800 bg-zinc-950";
  return "text-zinc-400 border-zinc-800 bg-zinc-950";
}

export default function ItemList({ boardId }: { boardId: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  // create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [status, setStatus] = useState<Status>("PLANNED");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageCaption, setImageCaption] = useState<string>("");
  const [createStatus, setCreateStatus] =
    useState<Exclude<Status, "PLANNED">>("BACKLOG");

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [bRes, iRes] = await Promise.all([
        fetch(`/api/boards/${boardId}`, { cache: "no-store" }),
        fetch(`/api/items?boardId=${encodeURIComponent(boardId)}`, {
          cache: "no-store"
        })
      ]);
      if (!bRes.ok) throw new Error(await bRes.text());
      if (!iRes.ok) throw new Error(await iRes.text());
      const bData = (await bRes.json()) as { board: Board };
      const iData = (await iRes.json()) as { items: Item[] };
      setBoard(bData.board);
      setItems(iData.items);
    } catch (e: any) {
      setErr(e?.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [boardId]);

  async function createItem() {
    if (!canSubmit) return;
    setErr(null);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        boardId,
        title,
        description,
        source,
        priority,
        status: createStatus,
        startDate: startDate || null,
        endDate: endDate || null,
        image: imageUrl
          ? {
              url: imageUrl,
              caption: imageCaption
            }
          : null
      })
    });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    setTitle("");
    setDescription("");
    setSource("");
    setPriority("P2");
    setStatus("BACKLOG");
    setCreateStatus("BACKLOG");
    setStartDate("");
    setEndDate("");
    setImageUrl("");
    setImageCaption("");
    await load();
  }

  async function updateItem(
    id: string,
    patch: Partial<Pick<Item, "status" | "priority">>
  ) {
    setErr(null);
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...patch,
        status: patch.status ? normalizeStatus(patch.status as Status) : undefined
      })
    });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    await load();
  }

  async function deleteItem(id: string) {
    if (!confirm("确定删除这个条目吗？")) return;
    setErr(null);
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">
              {board?.name ?? "（加载中）"}
            </div>
            <div className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {board?.description || "（无描述）"}
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            {loading ? "加载中…" : `条目数：${items.length}`}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">添加条目</div>
          <div className="text-xs text-zinc-500">
            {loading ? "加载中…" : "看板上的变动会自动持久化到数据库"}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <div className="mb-1 text-xs text-zinc-400">短标题</div>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Integration with Popular Task Apps"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">放入列</div>
            <select
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={createStatus}
              onChange={(e) =>
                setCreateStatus(e.target.value as Exclude<Status, "PLANNED">)
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">优先级</div>
            <select
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <div className="mb-1 text-xs text-zinc-400">描述</div>
            <textarea
              className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="目标、范围、验收标准、风险点等"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">需求来源</div>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="例如：Feature Request / 客户A / Jira链接"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">开始日期</div>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs text-zinc-400">结束日期</div>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label className="block sm:col-span-2">
            <div className="mb-1 text-xs text-zinc-400">描述图（URL，可选）</div>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="例如：https://.../mock.png"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void createItem()}
          >
            添加到看板
          </button>
          {err ? <div className="text-sm text-red-400">{err}</div> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {STATUSES.map((col) => {
          const colItems = items
            .map((it) => ({
              ...it,
              status: normalizeStatus(it.status as Status)
            }))
            .filter((it) => it.status === col)
            .sort((a, b) => {
              // P0 最靠前
              const pa = PRIORITIES.indexOf(a.priority);
              const pb = PRIORITIES.indexOf(b.priority);
              return pa - pb;
            });

          return (
            <div
              key={col}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{statusLabel(col)}</div>
                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-400">
                    {colItems.length}
                  </span>
                </div>
                <button
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-600"
                  onClick={() => setCreateStatus(col)}
                  title="快速新增：预设放入该列"
                >
                  ＋
                </button>
              </div>

              <div className="space-y-3">
                {colItems.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 hover:border-zinc-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] ${priorityClass(
                              it.priority
                            )}`}
                          >
                            {it.priority}
                          </span>
                          {it.source ? (
                            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300">
                              {it.source}
                            </span>
                          ) : null}
                          {it.startDate || it.endDate ? (
                            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-400">
                              {it.startDate?.slice(0, 10) ?? "?"} →{" "}
                              {it.endDate?.slice(0, 10) ?? "?"}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 truncate text-sm font-semibold">
                          {it.title}
                        </div>
                        {it.description ? (
                          <div className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-zinc-300">
                            {it.description}
                          </div>
                        ) : null}
                      </div>

                      <button
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-600"
                        onClick={() => void deleteItem(it.id)}
                      >
                        删除
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-400">
                        状态
                        <select
                          className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                          value={normalizeStatus(it.status as Status)}
                          onChange={(e) =>
                            void updateItem(it.id, {
                              status: e.target.value as Status
                            })
                          }
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-zinc-400">
                        优先级
                        <select
                          className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-zinc-600"
                          value={it.priority}
                          onChange={(e) =>
                            void updateItem(it.id, {
                              priority: e.target.value as Priority
                            })
                          }
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

