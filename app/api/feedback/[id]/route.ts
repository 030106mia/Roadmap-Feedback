import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { feedbackUpdateSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const item = await prisma.userFeedback.findUnique({
    where: { id },
    include: { images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } } }
  });
  if (!item) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = feedbackUpdateSchema.parse({ ...body, id });

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = {};
      if (Object.prototype.hasOwnProperty.call(body, "kind")) data.kind = parsed.kind;
      if (Object.prototype.hasOwnProperty.call(body, "userName")) data.userName = parsed.userName;
      if (Object.prototype.hasOwnProperty.call(body, "email")) data.email = parsed.email;
      if (Object.prototype.hasOwnProperty.call(body, "content")) data.content = parsed.content;
      if (Object.prototype.hasOwnProperty.call(body, "todo")) data.todo = parsed.todo;
      if (Object.prototype.hasOwnProperty.call(body, "todoDone")) data.todoDone = parsed.todoDone ?? false;

      // device：仅 FEEDBACK 需要
      if (Object.prototype.hasOwnProperty.call(body, "device")) {
        data.device = parsed.device ?? "-";
      }

      // source：仅 PRAISE 需要
      if (Object.prototype.hasOwnProperty.call(body, "source")) {
        data.source = parsed.source ?? "";
      } else if (Object.prototype.hasOwnProperty.call(body, "kind") && parsed.kind === "FEEDBACK") {
        data.source = "";
      }

      // language：仅 PRAISE 需要
      if (Object.prototype.hasOwnProperty.call(body, "language")) {
        data.language = parsed.language ?? "";
      } else if (Object.prototype.hasOwnProperty.call(body, "kind") && parsed.kind === "FEEDBACK") {
        data.language = "";
      }

      // feedbackType：两种情况会更新：
      // 1) 显式传 feedbackType
      // 2) 显式把 kind 切到 PRAISE（清空 feedbackType）
      if (Object.prototype.hasOwnProperty.call(body, "feedbackType")) {
        data.feedbackType = parsed.feedbackType ?? "";
      } else if (Object.prototype.hasOwnProperty.call(body, "kind") && parsed.kind === "PRAISE") {
        data.feedbackType = "";
      }

      await tx.userFeedback.update({
        where: { id },
        data
      });

      // 如果传了 images，就按传入值覆盖（主要用于 PRAISE）
      if (Object.prototype.hasOwnProperty.call(body, "images")) {
        await tx.feedbackImage.deleteMany({ where: { feedbackId: id } });
        if (parsed.images && parsed.images.length) {
          await tx.feedbackImage.createMany({
            data: parsed.images.map((url) => ({ feedbackId: id, url }))
          });
        }
      }

      const full = await tx.userFeedback.findUnique({
        where: { id },
        include: { images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } } }
      });
      return full!;
    });

    await writeAudit({
      entity: "UserFeedback",
      entityId: id,
      action: "UPDATE",
      payload: updated
    });

    return NextResponse.json({ item: updated });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Bad Request", { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const existing = await prisma.userFeedback.findUnique({
    where: { id },
    include: { images: true }
  });
  if (!existing) return new NextResponse("Not Found", { status: 404 });

  await prisma.userFeedback.delete({ where: { id } });
  await writeAudit({
    entity: "UserFeedback",
    entityId: id,
    action: "DELETE",
    payload: existing
  });
  return NextResponse.json({ ok: true });
}

