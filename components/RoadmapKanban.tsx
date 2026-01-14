"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "BACKLOG" | "NEXT_UP" | "IN_PROGRESS" | "DONE" | "PLANNED";

type Tag = {
  id: string;
  name: string;
};

type ItemImage = {
  id: string;
  url: string;
  caption: string;
};

type Item = {
  id: string;
  title: string;
  description: string;
  source: string;
  jiraKey: string;
  priority: Priority;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  images: ItemImage[];
  tags: Tag[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
const STATUSES: Exclude<Status, "PLANNED">[] = [
  "BACKLOG",
  "NEXT_UP",
  "IN_PROGRESS",
  "DONE"
];

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
  // A small, consistent color palette for the 8 default tags.
  if (name === "Writing") return { border: "border-indigo-200 dark:border-indigo-500/30", bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-800 dark:text-indigo-200" };
  if (name === "Inbox & Read") return { border: "border-amber-200 dark:border-amber-500/30", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-900 dark:text-amber-200" };
  if (name === "Search") return { border: "border-sky-200 dark:border-sky-500/30", bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-800 dark:text-sky-200" };
  if (name === "AI chat") return { border: "border-violet-200 dark:border-violet-500/30", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-800 dark:text-violet-200" };
  if (name === "Summary") return { border: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-800 dark:text-emerald-200" };
  if (name === "Todos") return { border: "border-orange-200 dark:border-orange-500/30", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-900 dark:text-orange-200" };
  if (name === "Label") return { border: "border-rose-200 dark:border-rose-500/30", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-800 dark:text-rose-200" };
  if (name === "Setting") return { border: "border-slate-200 dark:border-slate-500/30", bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-800 dark:text-slate-200" };
  // fallback
  return { border: "border-zinc-200 dark:border-zinc-700", bg: "bg-zinc-50 dark:bg-zinc-950", text: "text-zinc-700 dark:text-zinc-300" };
}

function tagChipClass(name: string, active?: boolean) {
  const tone = tagTone(name);
  if (active) {
    return [
      "border",
      tone.border,
      tone.bg,
      tone.text
    ].join(" ");
  }
  // inactive: lighter, still colored
  return [
    "border",
    tone.border,
    "bg-white dark:bg-zinc-950",
    "text-zinc-700 dark:text-zinc-300"
  ].join(" ");
}

function statusLabel(s: Exclude<Status, "PLANNED">) {
  if (s === "BACKLOG") return "Backlog";
  if (s === "NEXT_UP") return "Next up";
  if (s === "IN_PROGRESS") return "In Progress";
  return "Done";
}

function StatusIcon({
  status,
  className
}: {
  status: Exclude<Status, "PLANNED">;
  className?: string;
}) {
  // Inline SVGs to avoid extra dependencies.
  if (status === "BACKLOG") {
    // inbox / tray
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M4 4h16v9a2 2 0 0 1-2 2h-3l-2 3h-2l-2-3H6a2 2 0 0 1-2-2V4z" />
      </svg>
    );
  }
  if (status === "NEXT_UP") {
    // fast-forward
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M11 17V7l-7 5 7 5z" />
        <path d="M20 17V7l-7 5 7 5z" />
      </svg>
    );
  }
  if (status === "IN_PROGRESS") {
    // bolt
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    );
  }
  // DONE: check circle
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

function statusTone(s: Exclude<Status, "PLANNED">) {
  if (s === "NEXT_UP") {
    return {
      dot: "bg-amber-500 dark:bg-amber-400",
      title: "text-amber-800 dark:text-amber-200",
      top: "border-t-amber-500/60 dark:border-t-amber-400/70",
      pill:
        "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-zinc-950 dark:text-amber-200",
      buttonHover: "hover:border-amber-400/50"
    };
  }
  if (s === "IN_PROGRESS") {
    return {
      dot: "bg-sky-500 dark:bg-sky-400",
      title: "text-sky-800 dark:text-sky-200",
      top: "border-t-sky-500/60 dark:border-t-sky-400/70",
      pill:
        "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-zinc-950 dark:text-sky-200",
      buttonHover: "hover:border-sky-400/50"
    };
  }
  if (s === "DONE") {
    return {
      dot: "bg-emerald-500 dark:bg-emerald-400",
      title: "text-emerald-800 dark:text-emerald-200",
      top: "border-t-emerald-500/60 dark:border-t-emerald-400/70",
      pill:
        "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-zinc-950 dark:text-emerald-200",
      buttonHover: "hover:border-emerald-400/50"
    };
  }
  // BACKLOG
  return {
    dot: "bg-zinc-500 dark:bg-zinc-400",
    title: "text-zinc-800 dark:text-zinc-200",
    top: "border-t-zinc-400/60 dark:border-t-zinc-500/70",
    pill:
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300",
    buttonHover: "hover:border-zinc-500/60"
  };
}

function normalizeStatus(s: Status): Exclude<Status, "PLANNED"> {
  return s === "PLANNED" ? "BACKLOG" : s;
}

function priorityClass(p: Priority) {
  if (p === "P0")
    return "text-red-700 border-red-200 bg-red-50 dark:text-red-200 dark:border-red-900/60 dark:bg-red-950/40";
  if (p === "P1")
    return "text-amber-800 border-amber-200 bg-amber-50 dark:text-amber-200 dark:border-amber-900/60 dark:bg-amber-950/40";
  if (p === "P2")
    return "text-zinc-700 border-zinc-200 bg-zinc-50 dark:text-zinc-200 dark:border-zinc-800 dark:bg-zinc-950";
  return "text-zinc-500 border-zinc-200 bg-white dark:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950";
}

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

function matchesQuery(item: Item, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    item.title.toLowerCase().includes(s) ||
    item.description.toLowerCase().includes(s) ||
    item.source.toLowerCase().includes(s) ||
    item.tags.some((t) => t.name.toLowerCase().includes(s))
  );
}

export default function RoadmapKanban() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // toolbar
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(
    () => new Set()
  );
  const [tagFilter, setTagFilter] = useState<Set<string>>(() => new Set());

  const hasActiveFilters =
    query.trim().length > 0 || priorityFilter.size > 0 || tagFilter.size > 0;

  function resetFilters() {
    setQuery("");
    setPriorityFilter(new Set());
    setTagFilter(new Set());
    setShowFilters(false);
  }

  // create/edit modal (reuse one dialog)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>("P2");
  const [formStatus, setFormStatus] =
    useState<Exclude<Status, "PLANNED">>("BACKLOG");
  const [formSource, setFormSource] = useState("");
  const [formJiraKey, setFormJiraKey] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formSelectedTags, setFormSelectedTags] = useState<Set<string>>(
    () => new Set()
  );

  // drag & drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [iRes, tRes] = await Promise.all([
        fetch(`/api/items`, { cache: "no-store" }),
        fetch(`/api/tags`, { cache: "no-store" })
      ]);
      if (!iRes.ok) throw new Error(await iRes.text());
      if (!tRes.ok) throw new Error(await tRes.text());
      const iData = (await iRes.json()) as { items: Item[] };
      const tData = (await tRes.json()) as { tags: Tag[] };
      setItems(iData.items);
      setAllTags(tData.tags);
    } catch (e: any) {
      setErr(e?.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const onReload = () => void load();
    window.addEventListener("roadmap:reload", onReload);
    return () => window.removeEventListener("roadmap:reload", onReload);
  }, []);

  function openCreate(preset?: { status?: Exclude<Status, "PLANNED"> }) {
    setModalMode("create");
    setEditingId(null);
    setErr(null);
    setFormTitle("");
    setFormSource("");
    setFormJiraKey("");
    setFormPriority("P2");
    setFormStatus(preset?.status ?? "BACKLOG");
    setFormStartDate("");
    setFormEndDate("");
    setFormSelectedTags(new Set());
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setModalMode("edit");
    setEditingId(item.id);
    setErr(null);
    setFormTitle(item.title ?? "");
    setFormSource(item.source ?? "");
    setFormJiraKey(item.jiraKey ?? "");
    setFormPriority(item.priority);
    setFormStatus(normalizeStatus(item.status));
    setFormStartDate(item.startDate ? item.startDate.slice(0, 10) : "");
    setFormEndDate(item.endDate ? item.endDate.slice(0, 10) : "");
    setFormSelectedTags(new Set(item.tags.map((t) => t.name)));
    setModalOpen(true);
  }

  async function submitModal() {
    if (!formTitle.trim()) return;
    setErr(null);
    const payload = {
      title: formTitle,
      source: formSource,
      jiraKey: formJiraKey,
      priority: formPriority,
      status: formStatus,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
      tags: Array.from(formSelectedTags)
    };

    const res =
      modalMode === "create"
        ? await fetch("/api/items", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...payload, description: "", image: null })
          })
        : await fetch(`/api/items/${editingId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload)
          });

    if (!res.ok) {
      setErr(await res.text());
      return;
    }

    setModalOpen(false);
    await load();
  }

  async function deleteFromModal() {
    if (!editingId) return;
    if (!confirm("确定删除这个卡片吗？")) return;
    setErr(null);
    const res = await fetch(`/api/items/${editingId}`, { method: "DELETE" });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    setModalOpen(false);
    await load();
  }

  const filtered = useMemo(() => {
    const q = query;
    const pf = priorityFilter;
    const tf = tagFilter;
    return items
      .map((it) => ({ ...it, status: normalizeStatus(it.status) }))
      .filter((it) => matchesQuery(it, q))
      .filter((it) => (pf.size ? pf.has(it.priority) : true))
      .filter((it) =>
        tf.size ? Array.from(tf).every((name) => it.tags.some((t) => t.name === name)) : true
      );
  }, [items, query, priorityFilter, tagFilter]);

  const byStatus = useMemo(() => {
    const groups = new Map<Exclude<Status, "PLANNED">, Item[]>();
    STATUSES.forEach((s) => groups.set(s, []));
    for (const it of filtered) {
      groups.get(it.status)?.push(it);
    }
    for (const s of STATUSES) {
      const arr = groups.get(s)!;
      // persisted order within column
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return groups;
  }, [filtered]);

  const itemById = useMemo(() => {
    const m = new Map<string, Item>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  function containerIdForStatus(s: Exclude<Status, "PLANNED">) {
    return `col:${s}`;
  }
  function statusFromContainerId(id: string): Exclude<Status, "PLANNED"> | null {
    if (!id.startsWith("col:")) return null;
    const raw = id.slice("col:".length);
    if (
      raw === "BACKLOG" ||
      raw === "NEXT_UP" ||
      raw === "IN_PROGRESS" ||
      raw === "DONE"
    ) {
      return raw;
    }
    return null;
  }
  function findStatusForItemId(itemId: string): Exclude<Status, "PLANNED"> | null {
    const it = itemById.get(itemId);
    if (!it) return null;
    return normalizeStatus(it.status);
  }

  async function persistReorder(
    updates: Array<{ id: string; status: Exclude<Status, "PLANNED">; sortOrder: number }>
  ) {
    const res = await fetch("/api/items/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ updates })
    });
    if (!res.ok) {
      setErr(await res.text());
      await load();
    }
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    const fromStatus = findStatusForItemId(activeItemId);
    if (!fromStatus) return;

    const toStatus =
      statusFromContainerId(overId) ?? findStatusForItemId(overId);
    if (!toStatus) return;

    const fromItems = (byStatus.get(fromStatus) ?? []).map((it) => it.id);
    const toItems = (byStatus.get(toStatus) ?? []).map((it) => it.id);

    const fromIndex = fromItems.indexOf(activeItemId);
    if (fromIndex === -1) return;

    const sameColumn = fromStatus === toStatus;
    let nextFrom = fromItems.slice();
    let nextTo = toItems.slice();

    if (sameColumn) {
      const overIndex = nextTo.indexOf(overId);
      if (overIndex === -1) return;
      nextTo = arrayMove(nextTo, fromIndex, overIndex);
    } else {
      nextFrom.splice(fromIndex, 1);
      const overIndex = nextTo.indexOf(overId);
      const insertAt = overIndex === -1 ? nextTo.length : overIndex;
      nextTo.splice(insertAt, 0, activeItemId);
    }

    const updates: Array<{ id: string; status: Exclude<Status, "PLANNED">; sortOrder: number }> = [];
    const assign = (status: Exclude<Status, "PLANNED">, ids: string[]) => {
      ids.forEach((id, idx) => updates.push({ id, status, sortOrder: idx * 1000 }));
    };
    if (sameColumn) assign(toStatus, nextTo);
    else {
      assign(fromStatus, nextFrom);
      assign(toStatus, nextTo);
    }

    setItems((prev) => {
      const map = new Map(prev.map((it) => [it.id, { ...it }]));
      for (const u of updates) {
        const it = map.get(u.id);
        if (!it) continue;
        it.status = u.status;
        it.sortOrder = u.sortOrder;
      }
      return Array.from(map.values());
    });

    await persistReorder(updates);
  }

  function SortableCard({ item }: { item: Item }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: item.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition
    };

    return (
      <div ref={setNodeRef} style={style} className={isDragging ? "opacity-60" : ""}>
        <button
          type="button"
          onClick={() => openEdit(item)}
          className="block w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-zinc-600"
          title="点击编辑"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {normalizeStatus(item.status) !== "DONE" ? (
                  <span
                    className="inline-flex items-center"
                    title={`优先级：${priorityMeta(item.priority).label}`}
                  >
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full ring-2",
                        priorityMeta(item.priority).dot,
                        priorityMeta(item.priority).ring
                      ].join(" ")}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {priorityMeta(item.priority).label}
                    </span>
                  </span>
                ) : null}
                {item.tags.slice(0, 4).map((t) => (
                  <span
                    key={t.id}
                    className={[
                      "rounded-full px-2 py-0.5 text-[11px]",
                      tagChipClass(t.name, true)
                    ].join(" ")}
                  >
                    {t.name}
                  </span>
                ))}
                {item.jiraKey ? (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                    {item.jiraKey}
                  </span>
                ) : null}
                {item.tags.length > 4 ? (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    +{item.tags.length - 4}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 truncate text-sm font-semibold">{item.title}</div>
            </div>

            <span
              className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
              onClick={(ev) => ev.stopPropagation()}
              {...attributes}
              {...listeners}
              title="拖拽排序/移动"
            >
              ⋮⋮
            </span>
          </div>
        </button>
      </div>
    );
  }

  function ColumnDrop({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });
    return <div ref={setNodeRef}>{children}</div>;
  }

  function togglePriority(p: Priority) {
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }
  function toggleTag(name: string) {
    setTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <main className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/20">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">Roadmap</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
            onClick={() => openCreate()}
          >
            ＋ New task
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            placeholder="搜索标题/类型…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
          onClick={() => {
            if (hasActiveFilters) {
              resetFilters();
              return;
            }
            setShowFilters((v) => !v);
          }}
          title={hasActiveFilters ? "重置筛选" : "筛选"}
        >
          {hasActiveFilters ? "重置" : "筛选"}
        </button>
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          {loading ? "加载中…" : `展示 ${filtered.length} / ${items.length}`}
        </div>
      </div>

      {showFilters ? (
        <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                优先级
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRIORITIES.map((p) => {
                  const active = priorityFilter.has(p);
                  const meta = priorityMeta(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className={[
                        "rounded-full border px-3 py-1 text-xs",
                        active
                          ? "border-sky-500/40 bg-sky-50 text-sky-900 dark:border-zinc-600 dark:bg-white dark:text-zinc-950"
                          : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                      ].join(" ")}
                      title={`优先级：${meta.label}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={[
                            "h-2.5 w-2.5 rounded-full ring-2",
                            meta.dot,
                            meta.ring
                          ].join(" ")}
                          aria-hidden
                        />
                        <span>{meta.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                类型
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {allTags.length ? (
                  allTags.map((t) => {
                    const active = tagFilter.has(t.name);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTag(t.name)}
                        className={[
                          "rounded-full px-3 py-1 text-xs",
                          active
                            ? tagChipClass(t.name, true)
                            : [
                                tagChipClass(t.name, false),
                                "hover:opacity-90"
                              ].join(" ")
                        ].join(" ")}
                      >
                        {t.name}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-zinc-500">暂无类型</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === "create" ? "新卡片" : "编辑卡片"}
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 cursor-default bg-black/60"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-sm font-semibold">
                {modalMode === "create" ? "新卡片" : "编辑卡片"}
              </div>
              <div className="flex items-center gap-2">
                {modalMode === "edit" ? (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:border-red-300 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
                    onClick={() => void deleteFromModal()}
                    disabled={!editingId}
                  >
                    删除
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                  onClick={() => setModalOpen(false)}
                >
                  关闭
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-white px-5 py-4 dark:bg-zinc-950">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block sm:col-span-2">
                  <div className="mb-1 text-xs text-zinc-400">标题</div>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="短标题（必填）"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs text-zinc-400">状态列</div>
                  <select
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(
                        e.target.value as Exclude<Status, "PLANNED">
                      )
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
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formPriority}
                    onChange={(e) =>
                      setFormPriority(e.target.value as Priority)
                    }
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
                        priorityMeta(formPriority).dot,
                        priorityMeta(formPriority).ring
                      ].join(" ")}
                      aria-hidden
                    />
                    <span>当前：{priorityMeta(formPriority).label}</span>
                  </div>
                </label>
                <label className="block sm:col-span-1">
                  <div className="mb-1 text-xs text-zinc-400">Jira 单号（可选）</div>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formJiraKey}
                    onChange={(e) => setFormJiraKey(e.target.value)}
                    placeholder="例如：FILO-123"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <div className="mb-1 text-xs text-zinc-400">需求来源（可选）</div>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="Feature Request / 客户 / 链接"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <div className="mb-1 text-xs text-zinc-400">
                    类型（多选）
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEFAULT_TAGS.map((name) => {
                      const active = formSelectedTags.has(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() =>
                            setFormSelectedTags((prev) => {
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
                          title="点击多选"
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </label>
                <label className="block">
                  <div className="mb-1 text-xs text-zinc-400">开始日期</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs text-zinc-400">结束日期</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                  onClick={() => setModalOpen(false)}
                >
                  取消
                </button>
                <button
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
                  disabled={!formTitle.trim()}
                  onClick={() => void submitModal()}
                >
                  {modalMode === "create" ? "创建" : "保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {err ? <div className="mt-3 text-sm text-red-400">{err}</div> : null}

      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((col) => {
            const colItems = byStatus.get(col) ?? [];
            const tone = statusTone(col);
            const ids = colItems.map((it) => it.id);
            return (
              <ColumnDrop key={col} id={containerIdForStatus(col)}>
                <div
                  className={[
                    "rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/20",
                    "border-t-2",
                    tone.top
                  ].join(" ")}
                >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={col} className={["h-4 w-4", tone.title].join(" ")} />
                    <div className={["text-sm font-semibold", tone.title].join(" ")}>
                      {statusLabel(col)}
                    </div>
                    <span
                      className={[
                        // NOTE: avoid hardcoded bg-* here; Tailwind utility order can override tone backgrounds
                        "rounded-full border px-2 py-0.5 text-xs",
                        tone.pill
                      ].join(" ")}
                    >
                      {colItems.length}
                    </span>
                  </div>
                  <button
                    className={[
                      "rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600",
                      tone.buttonHover
                    ].join(" ")}
                    onClick={() => {
                      openCreate({ status: col });
                    }}
                    title="快速新增：预设放入该列"
                  >
                    ＋
                  </button>
                </div>

                <div className="max-h-[580px] overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:dark:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    {colItems.map((it) => (
                      <SortableCard key={it.id} item={it} />
                    ))}
                  </SortableContext>

                  {colItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-800">
                      暂无卡片，点击右上角 “＋” 新建。
                    </div>
                  ) : null}
                </div>
                </div>
              </ColumnDrop>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeId ? (
          (() => {
            const it = itemById.get(activeId);
            if (!it) return null;
            return (
              <div className="w-[320px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-sm font-semibold">{it.title}</div>
              </div>
            );
          })()
        ) : null}
      </DragOverlay>
      </DndContext>
    </main>
  );
}

