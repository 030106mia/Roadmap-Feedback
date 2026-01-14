"use client";

import { useEffect, useMemo, useState } from "react";

type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "BACKLOG" | "NEXT_UP" | "IN_PROGRESS" | "DONE" | "PLANNED";

type Tag = { id: string; name: string };
type ItemImage = { id: string; url: string; caption: string };
type Item = {
  id: string;
  title: string;
  description: string;
  source: string;
  priority: Priority;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  tags: Tag[];
  images: ItemImage[];
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_TAGS = [
  "Writing",
  "Inbox & Read",
  "Search",
  "AI chat",
  "Summary",
  "Todos",
  "Label",
  "Setting"
] as const;

function tagTone(name: string) {
  if (name === "Writing") return { border: "border-indigo-200 dark:border-indigo-500/30", bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-800 dark:text-indigo-200" };
  if (name === "Inbox & Read") return { border: "border-amber-200 dark:border-amber-500/30", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-900 dark:text-amber-200" };
  if (name === "Search") return { border: "border-sky-200 dark:border-sky-500/30", bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-800 dark:text-sky-200" };
  if (name === "AI chat") return { border: "border-violet-200 dark:border-violet-500/30", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-800 dark:text-violet-200" };
  if (name === "Summary") return { border: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-800 dark:text-emerald-200" };
  if (name === "Todos") return { border: "border-orange-200 dark:border-orange-500/30", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-900 dark:text-orange-200" };
  if (name === "Label") return { border: "border-rose-200 dark:border-rose-500/30", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-800 dark:text-rose-200" };
  if (name === "Setting") return { border: "border-slate-200 dark:border-slate-500/30", bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-800 dark:text-slate-200" };
  return { border: "border-zinc-200 dark:border-zinc-700", bg: "bg-zinc-50 dark:bg-zinc-950", text: "text-zinc-700 dark:text-zinc-300" };
}

function tagChipClass(name: string, active?: boolean) {
  const tone = tagTone(name);
  if (active) return ["border", tone.border, tone.bg, tone.text].join(" ");
  return ["border", tone.border, "bg-white dark:bg-zinc-950", "text-zinc-700 dark:text-zinc-300"].join(" ");
}

const PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
const STATUSES: Exclude<Status, "PLANNED">[] = [
  "BACKLOG",
  "NEXT_UP",
  "IN_PROGRESS",
  "DONE"
];

function priorityMeta(p: Priority) {
  if (p === "P0")
    return {
      label: "紧急",
      dot: "bg-red-500 dark:bg-red-400",
      ring: "ring-red-200 dark:ring-red-900/40"
    };
  if (p === "P1")
    return {
      label: "高",
      dot: "bg-amber-500 dark:bg-amber-400",
      ring: "ring-amber-200 dark:ring-amber-900/40"
    };
  if (p === "P2")
    return {
      label: "中",
      dot: "bg-sky-500 dark:bg-sky-400",
      ring: "ring-sky-200 dark:ring-sky-900/40"
    };
  return {
    label: "低",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    ring: "ring-zinc-200 dark:ring-zinc-800/60"
  };
}

function statusLabel(s: Exclude<Status, "PLANNED">) {
  if (s === "BACKLOG") return "Backlog";
  if (s === "NEXT_UP") return "Next up";
  if (s === "IN_PROGRESS") return "In Progress";
  return "Done";
}

function normalizeStatus(s: Status): Exclude<Status, "PLANNED"> {
  return s === "PLANNED" ? "BACKLOG" : s;
}

export default function ItemDetail({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [item, setItem] = useState<Item | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Exclude<Status, "PLANNED">>("BACKLOG");
  const [priority, setPriority] = useState<Priority>("P2");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set());

  const canSave = useMemo(() => title.trim().length > 0 && !saving, [title, saving]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/items/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { item: Item };
      const it = data.item;
      setItem(it);
      setTitle(it.title);
      setSource(it.source ?? "");
      setDescription(it.description ?? "");
      setStatus(normalizeStatus(it.status));
      setPriority(it.priority);
      setStartDate(it.startDate ? it.startDate.slice(0, 10) : "");
      setEndDate(it.endDate ? it.endDate.slice(0, 10) : "");
      setSelectedTags(new Set(it.tags.map((t) => t.name)));
    } catch (e: any) {
      setErr(e?.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          source,
          description,
          status,
          priority,
          startDate: startDate || null,
          endDate: endDate || null,
          tags: Array.from(selectedTags)
        })
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm("确定删除这个卡片吗？")) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/dashboard/roadmap";
    } catch (e: any) {
      setErr(e?.message ?? "删除失败");
      setSaving(false);
    }
  }

  return (
    <main className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">详情</div>
          <div className="mt-1 truncate text-lg font-semibold">
            {loading ? "加载中…" : item?.title || "（未命名）"}
          </div>
          <a
            href="/dashboard/roadmap"
            className="mt-2 inline-block text-sm text-sky-700 underline decoration-sky-500/30 underline-offset-4 hover:text-sky-900 dark:text-sky-200 dark:hover:text-white"
          >
            返回 Roadmap
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
            disabled={!canSave}
            onClick={() => void save()}
          >
            {saving ? "保存中…" : "保存"}
          </button>
          <button
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:border-red-300 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
            disabled={saving}
            onClick={() => void del()}
          >
            删除
          </button>
        </div>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500 dark:text-red-400">{err}</div> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">短标题</div>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="必填"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">状态</div>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">优先级</div>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="P0">紧急</option>
            <option value="P1">高</option>
            <option value="P2">中</option>
            <option value="P3">低</option>
          </select>
          <div className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span
              className={[
                "h-2.5 w-2.5 rounded-full ring-2",
                priorityMeta(priority).dot,
                priorityMeta(priority).ring
              ].join(" ")}
              aria-hidden
            />
            <span>当前：{priorityMeta(priority).label}</span>
          </div>
        </label>

        <label className="block lg:col-span-2">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            需求来源（可选）
          </div>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Feature Request / 客户 / 链接"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">开始日期</div>
          <input
            type="date"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">结束日期</div>
          <input
            type="date"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <div className="lg:col-span-2">
          <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">类型</div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TAGS.map((name) => {
              const active = selectedTags.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setSelectedTags((prev) => {
                      const next = new Set(prev);
                      if (next.has(name)) next.delete(name);
                      else next.add(name);
                      return next;
                    })
                  }
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px]",
                    active ? tagChipClass(name, true) : tagChipClass(name, false)
                  ].join(" ")}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block lg:col-span-2">
          <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">描述</div>
          <textarea
            className="min-h-40 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="目标、范围、验收标准、风险点等"
          />
        </label>
      </div>
    </main>
  );
}

