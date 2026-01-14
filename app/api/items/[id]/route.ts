import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { itemUpdateSchema } from "@/lib/validators";

function dateStringToDateOrNull(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeStatus(s: string | null | undefined) {
  if (!s) return undefined;
  return s === "PLANNED" ? "BACKLOG" : s;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const item = await prisma.roadmapItem.findUnique({
    where: { id: params.id },
    include: { images: true, tags: { include: { tag: true } } }
  });
  if (!item) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({
    item: { ...item, tags: item.tags.map((t) => t.tag) }
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const json = await req.json().catch(() => null);
  const parsed = itemUpdateSchema.safeParse({ ...(json ?? {}), id: params.id });
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const tags =
    parsed.data.tags === undefined
      ? undefined
      : await Promise.all(
          (parsed.data.tags ?? [])
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 12)
            .map((name) =>
              prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
                select: { id: true, name: true }
              })
            )
        );

  const item = await prisma.roadmapItem.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      source: parsed.data.source,
      jiraKey: parsed.data.jiraKey,
      priority: parsed.data.priority,
      status: parsed.data.status ? normalizeStatus(parsed.data.status) : undefined,
      startDate:
        parsed.data.startDate === undefined
          ? undefined
          : dateStringToDateOrNull(parsed.data.startDate),
      endDate:
        parsed.data.endDate === undefined
          ? undefined
          : dateStringToDateOrNull(parsed.data.endDate),
      sortOrder: parsed.data.sortOrder,
      tags:
        tags === undefined
          ? undefined
          : {
              deleteMany: {},
              create: tags.map((t) => ({ tagId: t.id }))
            }
    },
    include: { images: true, tags: { include: { tag: true } } }
  });
  const payloadItem = {
    ...item,
    tags: item.tags.map((t) => t.tag)
  };

  await writeAudit({
    entity: "RoadmapItem",
    entityId: item.id,
    action: "UPDATE",
    payload: { item: payloadItem }
  });

  return NextResponse.json({ item: payloadItem });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const item = await prisma.roadmapItem.findUnique({
    where: { id: params.id },
    include: { images: true, tags: { include: { tag: true } } }
  });
  if (!item) return new NextResponse("Not found", { status: 404 });

  await prisma.roadmapItem.delete({ where: { id: params.id } });
  await writeAudit({
    entity: "RoadmapItem",
    entityId: params.id,
    action: "DELETE",
    payload: {
      item: {
        ...item,
        tags: item.tags.map((t) => t.tag)
      }
    }
  });
  return new NextResponse(null, { status: 204 });
}

