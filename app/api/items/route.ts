import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { itemCreateSchema } from "@/lib/validators";
import { ensureUnifiedRoadmap } from "@/lib/migrate";
import { NextResponse } from "next/server";
import { z } from "zod";

const DEFAULT_BOARD_NAME = "All";

function dateStringToDateOrNull(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v); // YYYY-MM-DD -> Date
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeStatus(s: string) {
  return s === "PLANNED" ? "BACKLOG" : s;
}

async function getDefaultBoardId() {
  const existing = await prisma.board.findFirst({
    where: { name: DEFAULT_BOARD_NAME },
    select: { id: true }
  });
  if (existing) return existing.id;
  const created = await prisma.board.create({
    data: { name: DEFAULT_BOARD_NAME, description: "默认聚合板块（UI 不再展示）" },
    select: { id: true }
  });
  return created.id;
}

async function normalizeTags(tagNames: string[]) {
  const names = Array.from(
    new Set(
      (tagNames ?? [])
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.slice(0, 40))
    )
  ).slice(0, 12);

  if (!names.length) return [];

  const tags = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true, name: true }
      })
    )
  );
  return tags;
}

export async function GET(req: Request) {
  // best-effort migration for old "board-based" data
  await ensureUnifiedRoadmap();

  const url = new URL(req.url);
  const boardId = url.searchParams.get("boardId");

  const items = await prisma.roadmapItem.findMany({
    where: boardId ? { boardId } : undefined,
    include: { images: true, tags: { include: { tag: true } } },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });
  const mapped = items.map((it) => ({
    ...it,
    tags: it.tags.map((t) => t.tag)
  }));
  return NextResponse.json({ items: mapped });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const schema = itemCreateSchema.extend({
    image: z
      .object({
        url: z.string().url(),
        caption: z.string().optional().default("")
      })
      .nullable()
      .optional()
  });

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const boardId = parsed.data.boardId ?? (await getDefaultBoardId());
  const tags = await normalizeTags(parsed.data.tags ?? []);

  const created = await prisma.roadmapItem.create({
    data: {
      boardId,
      title: parsed.data.title,
      description: parsed.data.description,
      source: parsed.data.source,
      jiraKey: parsed.data.jiraKey ?? "",
      priority: parsed.data.priority,
      status: normalizeStatus(parsed.data.status),
      startDate: dateStringToDateOrNull(parsed.data.startDate),
      endDate: dateStringToDateOrNull(parsed.data.endDate),
      sortOrder: parsed.data.sortOrder ?? 0,
      tags: tags.length
        ? {
            create: tags.map((t) => ({
              tagId: t.id
            }))
          }
        : undefined,
      images: parsed.data.image
        ? {
            create: {
              url: parsed.data.image.url,
              caption: parsed.data.image.caption ?? ""
            }
          }
        : undefined
    },
    include: { images: true, tags: { include: { tag: true } } }
  });
  const payloadItem = {
    ...created,
    tags: created.tags.map((t) => t.tag)
  };

  await writeAudit({
    entity: "RoadmapItem",
    entityId: created.id,
    action: "CREATE",
    payload: { item: payloadItem }
  });

  return NextResponse.json({ item: payloadItem }, { status: 201 });
}

export async function DELETE() {
  // Delete all roadmap items (dangerous).
  const res = await prisma.roadmapItem.deleteMany({});
  await writeAudit({
    entity: "RoadmapItem",
    entityId: "*",
    action: "DELETE",
    payload: { all: true, count: res.count }
  });
  return NextResponse.json({ deleted: res.count });
}

