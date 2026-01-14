"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
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

type Kind = "FEEDBACK" | "PRAISE";
type Device = "IOS" | "MAC" | "WIN" | "ANDROID" | "PC" | "-";
type FeedbackType = "REQUEST" | "SUGGESTION" | "BUG";
type PraiseSource = "EMAIL" | "STORE" | "SOCIAL";
type Language = "ZH_CN" | "ZH_TW" | "EN" | "JA" | "FR";

type FeedbackImage = { id: string; url: string };

type TodoItem = {
  text: string;
  done: boolean;
};

type FeedbackItem = {
  id: string;
  kind: Kind;
  userName: string;
  email: string;
  device: Device;
  feedbackType: string;
  source?: string;
  language?: string;
  content: string;
  todo: string; // JSON string of TodoItem[]
  todoDone?: boolean; // 保留用于向后兼容，但主要使用todo字段中的done状态
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  images: FeedbackImage[];
};

const DEVICES: Array<{ value: Device; label: string }> = [
  { value: "IOS", label: "iOS" },
  { value: "MAC", label: "Mac" },
  { value: "WIN", label: "Win" },
  { value: "ANDROID", label: "Android" },
  { value: "PC", label: "PC" },
  { value: "-", label: "-" }
];

const TYPES: Array<{ value: FeedbackType; label: string }> = [
  { value: "REQUEST", label: "需求" },
  { value: "SUGGESTION", label: "建议" },
  { value: "BUG", label: "Bug" }
];

const SOURCES: Array<{ value: PraiseSource; label: string }> = [
  { value: "EMAIL", label: "邮件反馈" },
  { value: "STORE", label: "商店评分" },
  { value: "SOCIAL", label: "社交平台" }
];

const LANGUAGES: Array<{ value: Language; label: string }> = [
  { value: "ZH_CN", label: "简体中文" },
  { value: "ZH_TW", label: "繁体中文" },
  { value: "EN", label: "英语" },
  { value: "JA", label: "日语" },
  { value: "FR", label: "法语" }
];

function languageLabel(v: string) {
  const hit = LANGUAGES.find((x) => x.value === v);
  return hit?.label ?? v ?? "-";
}

// 解析todo字符串为TodoItem数组
function parseTodos(todoStr: string): TodoItem[] {
  if (!todoStr || todoStr.trim() === "") return [];
  try {
    const parsed = JSON.parse(todoStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        text: item.text || String(item),
        done: item.done || false
      }));
    }
  } catch {
    // 如果不是JSON，尝试按旧格式处理（单个字符串或逗号分隔）
    if (todoStr.includes(",")) {
      return todoStr.split(",").map((t) => ({ text: t.trim(), done: false }));
    }
    return [{ text: todoStr.trim(), done: false }];
  }
  return [];
}

// 序列化TodoItem数组为JSON字符串
function serializeTodos(todos: TodoItem[]): string {
  if (todos.length === 0) return "";
  return JSON.stringify(todos);
}

function typeLabel(v: string) {
  const hit = TYPES.find((x) => x.value === v);
  return hit?.label ?? v ?? "";
}

function sourceLabel(v: string) {
  const hit = SOURCES.find((x) => x.value === v);
  return hit?.label ?? v ?? "-";
}

function SortableRow({
  item,
  tab,
  onEdit,
  onDelete,
  onToggleTodoDone
}: {
  item: FeedbackItem;
  tab: Kind;
  onEdit: (item: FeedbackItem) => void;
  onDelete: (id: string) => void;
  onToggleTodoDone: (id: string, todoJson: string) => void;
}) {
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
    <tr
      ref={setNodeRef}
      style={style}
      className={[
        "border-t border-zinc-200 align-top hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-950/30",
        isDragging ? "opacity-50 z-50" : ""
      ].join(" ")}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1.5 -ml-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            title="拖拽排序（点击并拖动）"
            style={{ touchAction: "none" }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </button>
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {item.userName || "-"}
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {item.email ? (
                <a className="underline" href={`mailto:${item.email}`}>
                  {item.email}
                </a>
              ) : (
                "-"
              )}
            </div>
          </div>
        </div>
      </td>
      {tab === "FEEDBACK" ? (
        <>
          <td className="px-3 py-3 text-sm text-zinc-800 dark:text-zinc-200">
            {DEVICES.find((d) => d.value === (item.device as Device))?.label ??
              item.device ??
              "-"}
          </td>
          <td className="px-3 py-3 text-sm text-zinc-800 dark:text-zinc-200 min-w-[80px]">
            {typeLabel(item.feedbackType)}
          </td>
        </>
      ) : (
        <>
          <td className="px-3 py-3 text-sm text-zinc-800 dark:text-zinc-200">
            {sourceLabel(item.source ?? "")}
          </td>
          <td className="px-3 py-3 text-sm text-zinc-800 dark:text-zinc-200">
            {languageLabel(item.language ?? "")}
          </td>
        </>
      )}
      <td className="px-3 py-3">
        <div className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
          {item.content}
        </div>
      </td>
      {tab === "PRAISE" ? (
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {(item.images ?? []).slice(0, 6).map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="block"
                title="点击新窗口查看"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-12 w-12 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                />
              </a>
            ))}
            {(item.images ?? []).length > 6 ? (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                +{(item.images ?? []).length - 6}
              </div>
            ) : null}
          </div>
        </td>
      ) : null}
      {tab === "FEEDBACK" ? (
        <td className="px-3 py-3">
          {(() => {
            const todos = parseTodos(item.todo ?? "");
            if (todos.length === 0) {
              return <div className="text-sm text-zinc-500 dark:text-zinc-400">-</div>;
            }
            return (
              <div className="space-y-1.5">
                {todos.map((todo, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={(e) => {
                        const updated = [...todos];
                        updated[idx].done = e.target.checked;
                        onToggleTodoDone(item.id, serializeTodos(updated));
                      }}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-300 text-sky-600 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-600 dark:bg-zinc-800"
                    />
                    <div
                      className={`flex-1 text-sm ${
                        todo.done
                          ? "text-zinc-400 line-through dark:text-zinc-600"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {todo.text}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </td>
      ) : null}
      <td className="px-3 py-3">
        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
            onClick={() => onEdit(item)}
            title="编辑"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200"
            onClick={() => void onDelete(item.id)}
            title="删除"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function UserFeedbackBoard() {
  const [tab, setTab] = useState<Kind>("FEEDBACK");
  const [tabDropdownOpen, setTabDropdownOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hasUnfinishedTodos, setHasUnfinishedTodos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formUserName, setFormUserName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDevice, setFormDevice] = useState<Device>("-");
  const [formType, setFormType] = useState<FeedbackType>("REQUEST");
  const [formSource, setFormSource] = useState<PraiseSource>("EMAIL");
  const [formLanguage, setFormLanguage] = useState<Language>("ZH_CN");
  const [formContent, setFormContent] = useState("");
  const [formTodos, setFormTodos] = useState<TodoItem[]>([]);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // drag & drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const fileRef = useRef<HTMLInputElement | null>(null);

  const title = tab === "FEEDBACK" ? "用户反馈" : "夸赞";

  const canSubmit = (() => {
    const hasAny =
      formUserName.trim().length > 0 ||
      formEmail.trim().length > 0 ||
      formContent.trim().length > 0 ||
      (tab === "FEEDBACK" && formTodos.length > 0 && formTodos.some((t) => t.text.trim().length > 0)) ||
      (tab === "PRAISE" && formImages.length > 0);
    return hasAny;
  })();

  const debouncedQ = useDebouncedValue(q, 250);

  // 按 sortOrder 排序，然后按 createdAt 降序（新创建的在前面）
  // 如果启用了"有未完成待办"筛选，只显示有未完成待办的项
  const sortedItems = useMemo(() => {
    let filtered = [...items];
    
    // 筛选：只显示有未完成待办的项
    if (tab === "FEEDBACK" && hasUnfinishedTodos) {
      filtered = filtered.filter((item) => {
        const todos = parseTodos(item.todo ?? "");
        return todos.length > 0 && todos.some((t) => !t.done && t.text.trim().length > 0);
      });
    }
    
    return filtered.sort((a, b) => {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, tab, hasUnfinishedTodos]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      params.set("kind", tab);
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      const res = await fetch(`/api/feedback?${params.toString()}`, {
        cache: "no-store"
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { items: FeedbackItem[] };
      // 确保每个 item 都有 sortOrder（默认 0）
      const normalized = data.items.map((it) => ({
        ...it,
        sortOrder: it.sortOrder ?? 0
      }));
      setItems(normalized);
    } catch (e: any) {
      const errorMsg = e?.message ?? "加载失败";
      setErr(errorMsg);
      console.error("加载反馈数据失败:", e);
      // 即使加载失败，也设置 loading 为 false，以便显示错误信息
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedQ]);

  // 点击外部或按ESC键关闭下拉菜单
  useEffect(() => {
    if (!tabDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const dropdown = document.querySelector('[data-tab-dropdown]');
      if (dropdown && !dropdown.contains(target)) {
        setTabDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTabDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tabDropdownOpen]);

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    setErr(null);
    setFormUserName("");
    setFormEmail("");
    setFormDevice("-");
    setFormType("REQUEST");
    setFormSource("EMAIL");
    setFormLanguage("ZH_CN");
    setFormContent("");
    setFormTodos([]);
    setFormImages([]);
    setModalOpen(true);
  }

  function openEdit(it: FeedbackItem) {
    setModalMode("edit");
    setEditingId(it.id);
    setErr(null);
    setFormUserName(it.userName ?? "");
    setFormEmail(it.email ?? "");
    setFormDevice((it.device as Device) ?? "-");
    setFormType((it.feedbackType as FeedbackType) || "REQUEST");
    setFormSource((it.source as PraiseSource) || "EMAIL");
    setFormLanguage((it.language as Language) || "ZH_CN");
    setFormContent(it.content ?? "");
    setFormTodos(parseTodos(it.todo ?? ""));
    setFormImages((it.images ?? []).map((x) => x.url));
    setModalOpen(true);
  }

  async function toggleTodoDone(id: string, todoJson: string) {
    // 立即更新本地状态（乐观更新）
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, todo: todoJson } : it))
    );
    // 调用API更新
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: todoJson })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    } catch (err: any) {
      console.error("更新待办状态失败:", err);
      // 回滚：重新加载数据
      await load();
      setErr(err?.message ?? "更新待办状态失败，请重试");
    }
  }

  async function removeItem(id: string) {
    if (!confirm("确定删除这条记录吗？")) return;
    setErr(null);
    const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    await load();
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = sortedItems.findIndex((it) => it.id === active.id);
    const newIndex = sortedItems.findIndex((it) => it.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedItems, oldIndex, newIndex);
    // 先更新 UI，然后保存到服务器
    setItems(reordered);
    // 异步保存，不阻塞 UI
    persistReorder(reordered).catch((e) => {
      console.error("保存排序失败:", e);
      setErr(e?.message ?? "保存排序失败，请刷新页面重试");
    });
  }

  async function persistReorder(reordered: FeedbackItem[]) {
    setErr(null);
    try {
      const updates = reordered.map((it, idx) => ({
        id: it.id,
        sortOrder: idx
      }));
      const res = await fetch("/api/feedback/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      // 更新本地 items 的 sortOrder，保持新顺序
      setItems((prev) => {
        const updated = prev.map((it) => {
          const update = updates.find((u) => u.id === it.id);
          return update ? { ...it, sortOrder: update.sortOrder } : it;
        });
        // 按新的 sortOrder 排序
        return updated.sort((a, b) => {
          const aOrder = a.sortOrder ?? 0;
          const bOrder = b.sortOrder ?? 0;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    } catch (e: any) {
      const msg = e?.message ?? "保存排序失败";
      setErr(msg);
      console.error("拖拽排序保存失败:", e);
      // 不立即 reload，让用户看到错误信息
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setErr(null);

    const payload: any = {
      kind: tab,
      userName: formUserName,
      email: formEmail,
      content: formContent
    };
    if (tab === "FEEDBACK") {
      payload.feedbackType = formType;
      payload.device = formDevice;
      payload.todo = serializeTodos(formTodos);
    }
    if (tab === "PRAISE") {
      payload.images = formImages;
      payload.source = formSource;
      payload.language = formLanguage;
    }

    const url =
      modalMode === "create" ? `/api/feedback` : `/api/feedback/${editingId}`;
    const method = modalMode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    setModalOpen(false);
    await load();
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const form = new FormData();
        form.set("file", f);
        const res = await fetch("/api/feedback/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { url: string };
        urls.push(data.url);
      }
      setFormImages((prev) => [...prev, ...urls].slice(0, 12));
    } catch (e: any) {
      setErr(e?.message ?? "上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!modalOpen || tab !== "PRAISE") return;

    async function onPasteImage(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        const dt = new DataTransfer();
        imageFiles.forEach((f) => dt.items.add(f));
        await onPickFiles(dt.files);
      }
    }

    window.addEventListener("paste", onPasteImage);
    return () => window.removeEventListener("paste", onPasteImage);
  }, [modalOpen, tab]);

  const hasActiveSearch = q.trim().length > 0;

  const tableHead = useMemo(() => {
    if (tab === "FEEDBACK") {
      return (
        <tr className="text-left text-xs text-zinc-600 dark:text-zinc-400">
          <th className="px-3 py-2">用户名（邮件地址）</th>
          <th className="px-3 py-2">设备</th>
          <th className="px-3 py-2 min-w-[80px]">类型</th>
          <th className="px-3 py-2">反馈内容</th>
          <th className="px-3 py-2">待办任务</th>
          <th className="px-3 py-2 text-right">操作</th>
        </tr>
      );
    }
    return (
      <tr className="text-left text-xs text-zinc-600 dark:text-zinc-400">
        <th className="px-3 py-2">用户名（邮件地址）</th>
        <th className="px-3 py-2">来源</th>
        <th className="px-3 py-2">语言</th>
        <th className="px-3 py-2">夸赞内容</th>
        <th className="px-3 py-2">图片</th>
        <th className="px-3 py-2 text-right">操作</th>
      </tr>
    );
  }, [tab]);

  // 错误边界：如果组件有错误，至少显示错误信息
  if (err && !loading) {
    return (
      <main className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/20">
        <div className="text-red-500">错误: {err}</div>
      </main>
    );
  }

  return (
    <main className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="relative inline-block" data-tab-dropdown>
            <button
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-base font-semibold transition-colors",
                "border-sky-500/40 bg-sky-50 text-sky-900 hover:border-sky-500/60 dark:border-zinc-600 dark:bg-white dark:text-zinc-950 dark:hover:border-zinc-500"
              ].join(" ")}
              onClick={() => setTabDropdownOpen(!tabDropdownOpen)}
            >
              <span>{tab === "FEEDBACK" ? "反馈" : "夸赞"}</span>
              <svg
                className={`h-4 w-4 transition-transform ${tabDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {tabDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    tab === "FEEDBACK"
                      ? "bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                  onClick={() => {
                    setTab("FEEDBACK");
                    setTabDropdownOpen(false);
                  }}
                >
                  反馈
                </button>
                <button
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    tab === "PRAISE"
                      ? "bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-200"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                  onClick={() => {
                    setTab("PRAISE");
                    setTabDropdownOpen(false);
                  }}
                >
                  夸赞
                </button>
              </div>
            )}
          </div>
          <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {tab === "FEEDBACK"
              ? "收集需求/建议/Bug，并沉淀待办任务"
              : "收集用户夸赞，支持上传截图"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
            onClick={() => openCreate()}
          >
            ＋ 新增
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            placeholder="搜索用户名 / 邮箱 / 内容 / 待办…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {tab === "FEEDBACK" ? (
          <button
            className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
              hasUnfinishedTodos
                ? "border-sky-500/40 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/30 dark:text-sky-200"
                : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
            }`}
            onClick={() => setHasUnfinishedTodos(!hasUnfinishedTodos)}
            title="只显示有未完成待办的反馈"
          >
            {hasUnfinishedTodos ? "✓ 有未完成待办" : "有未完成待办"}
          </button>
        ) : null}
        {(hasActiveSearch || (tab === "FEEDBACK" && hasUnfinishedTodos)) ? (
          <button
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
            onClick={() => {
              setQ("");
              setHasUnfinishedTodos(false);
            }}
            title="清空筛选"
          >
            重置
          </button>
        ) : null}
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          {loading ? "加载中…" : `展示 ${sortedItems.length}`}
        </div>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {loading && items.length === 0 ? (
        <div className="mt-4 flex items-center justify-center py-12">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">加载中…</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="max-h-[640px] overflow-y-auto">
            <table className="min-w-[980px] w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950/40">
                {tableHead}
              </thead>
            <tbody>
              <SortableContext
                items={sortedItems.map((it) => it.id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedItems.map((it) => (
                  <SortableRow
                    key={it.id}
                    item={it}
                    tab={tab}
                    onEdit={openEdit}
                    onDelete={removeItem}
                    onToggleTodoDone={toggleTodoDone}
                  />
                ))}
              </SortableContext>
              {sortedItems.length === 0 && !loading ? (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    colSpan={tab === "FEEDBACK" ? 6 : 6}
                  >
                    暂无数据，点击右上角 “＋ 新增” 新建。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500">拖拽中…</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === "create" ? "新增" : "编辑"}
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 cursor-default bg-black/60"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="text-sm font-semibold">
                {modalMode === "create" ? `新增${title}` : `编辑${title}`}
              </div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {tab === "FEEDBACK"
                  ? "支持新增、编辑、删除、搜索。"
                  : "夸赞支持上传图片（最多 12 张）。"}
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-xs text-zinc-500">用户名</div>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formUserName}
                    onChange={(e) => setFormUserName(e.target.value)}
                    placeholder="例如：Jason Hanson"
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs text-zinc-500">
                    邮件地址{tab === "PRAISE" ? "（可选）" : ""}
                  </div>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="例如：user@gmail.com"
                  />
                </label>
                {tab === "FEEDBACK" ? (
                  <>
                    <label className="block">
                      <div className="mb-1 text-xs text-zinc-500">设备</div>
                      <select
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                        value={formDevice}
                        onChange={(e) => setFormDevice(e.target.value as Device)}
                      >
                        {DEVICES.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <div className="mb-1 text-xs text-zinc-500">类型</div>
                      <select
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as FeedbackType)}
                      >
                        {TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block">
                      <div className="mb-1 text-xs text-zinc-500">来源</div>
                      <select
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                        value={formSource}
                        onChange={(e) => setFormSource(e.target.value as PraiseSource)}
                      >
                        {SOURCES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <div className="mb-1 text-xs text-zinc-500">语言</div>
                      <select
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                        value={formLanguage}
                        onChange={(e) => setFormLanguage(e.target.value as Language)}
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>

              <div className="mt-3 grid gap-3">
                <label className="block">
                  <div className="mb-1 text-xs text-zinc-500">
                    {tab === "FEEDBACK" ? "反馈内容" : "夸赞内容"}
                  </div>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder={
                      tab === "FEEDBACK"
                        ? "请描述需求/建议/Bug…"
                        : "请描述夸赞内容…"
                    }
                  />
                </label>

                {tab === "FEEDBACK" ? (
                  <div className="block">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs text-zinc-500">待办任务</div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormTodos([...formTodos, { text: "", done: false }]);
                        }}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
                      >
                        ＋ 添加任务
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formTodos.map((todo, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={todo.done}
                            onChange={(e) => {
                              const updated = [...formTodos];
                              updated[idx].done = e.target.checked;
                              setFormTodos(updated);
                            }}
                            className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-sky-600 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-600 dark:bg-zinc-800"
                          />
                          <input
                            type="text"
                            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500/60 dark:border-zinc-800 dark:bg-zinc-950"
                            value={todo.text}
                            onChange={(e) => {
                              const updated = [...formTodos];
                              updated[idx].text = e.target.value;
                              setFormTodos(updated);
                            }}
                            placeholder="输入待办任务…"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormTodos(formTodos.filter((_, i) => i !== idx));
                            }}
                            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:border-red-300 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-red-600 dark:hover:text-red-400"
                            title="删除"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {formTodos.length === 0 && (
                        <div className="text-xs text-zinc-400 dark:text-zinc-500">
                          点击"添加任务"按钮添加待办任务
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {tab === "PRAISE" ? (
                  <div>
                    <div className="mb-1 text-xs text-zinc-500">图片（可选）</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        {uploading ? "上传中…" : "上传图片"}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => void onPickFiles(e.target.files)}
                      />
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        最多 12 张，单张 ≤ 5MB。支持复制粘贴图片。
                      </div>
                    </div>

                    {formImages.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formImages.map((url) => (
                          <div
                            key={url}
                            className="group relative h-16 w-16 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute right-1 top-1 hidden rounded-md bg-black/60 px-1 py-0.5 text-xs text-white group-hover:block"
                              onClick={() =>
                                setFormImages((prev) => prev.filter((x) => x !== url))
                              }
                              title="移除"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600"
                  onClick={() => setModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
                  disabled={!canSubmit || uploading}
                  onClick={() => void submit()}
                >
                  {modalMode === "create" ? "创建" : "保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function useDebouncedValue<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

