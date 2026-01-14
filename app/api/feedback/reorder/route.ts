import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string().min(1),
  sortOrder: z.number().int()
});

const bodySchema = z.object({
  updates: z.array(updateSchema).min(1).max(500)
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

    const updates = parsed.data.updates;

    try {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.userFeedback.update({
            where: { id: u.id },
            data: {
              sortOrder: u.sortOrder
            }
          })
        )
      );
    } catch (e: any) {
      // 如果 sortOrder 字段还不存在，尝试使用原始 SQL 更新
      if (e?.message?.includes("sortOrder") || e?.code === "P2009") {
        // SQLite 直接执行 SQL
        for (const u of updates) {
          await prisma.$executeRawUnsafe(
            `UPDATE UserFeedback SET sortOrder = ? WHERE id = ?`,
            u.sortOrder,
            u.id
          );
        }
      } else {
        throw e;
      }
    }

    await writeAudit({
      entity: "UserFeedback",
      entityId: "*",
      action: "UPDATE",
      payload: { reorder: true, count: updates.length }
    });

    return NextResponse.json({ updated: updates.length });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Internal Server Error", { status: 500 });
  }
}
