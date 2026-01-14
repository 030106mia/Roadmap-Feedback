import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["BACKLOG", "NEXT_UP", "IN_PROGRESS", "DONE"]).optional(),
  sortOrder: z.number().int()
});

const bodySchema = z.object({
  updates: z.array(updateSchema).min(1).max(500)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

  const updates = parsed.data.updates;

  await prisma.$transaction(
    updates.map((u) =>
      prisma.roadmapItem.update({
        where: { id: u.id },
        data: {
          status: u.status,
          sortOrder: u.sortOrder
        }
      })
    )
  );

  await writeAudit({
    entity: "RoadmapItem",
    entityId: "*",
    action: "UPDATE",
    payload: { reorder: true, count: updates.length }
  });

  return NextResponse.json({ updated: updates.length });
}

