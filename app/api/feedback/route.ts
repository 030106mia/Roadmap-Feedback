import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { feedbackCreateSchema, feedbackKindSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

function normalizeKind(input: string | null) {
  const parsed = feedbackKindSchema.safeParse(input ?? "FEEDBACK");
  return parsed.success ? parsed.data : "FEEDBACK";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = normalizeKind(searchParams.get("kind"));
  const q = (searchParams.get("q") ?? "").trim();

  const where =
    q.length > 0
      ? {
          kind,
          OR: [
            { userName: { contains: q } },
            { email: { contains: q } },
            { content: { contains: q } },
            { todo: { contains: q } }
          ]
        }
      : { kind };

  const items = await prisma.userFeedback.findMany({
    where,
    include: { images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } } }
  });
  
  // 客户端排序：如果有 sortOrder 就按它排序，否则保持 createdAt 降序
  items.sort((a, b) => {
    const aOrder = (a as any).sortOrder ?? 0;
    const bOrder = (b as any).sortOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = feedbackCreateSchema.parse(body);

    const created = await prisma.$transaction(async (tx) => {
      // 新创建的记录排在最后：获取当前最大 sortOrder，然后 +1
      let nextOrder = 0;
      const all = await tx.userFeedback.findMany({
        where: { kind: parsed.kind }
      });
      if (all.length > 0) {
        const max = Math.max(...all.map((x) => (x as any).sortOrder ?? 0));
        nextOrder = max + 1;
      }

      const fb = await tx.userFeedback.create({
        data: {
          kind: parsed.kind,
          userName: parsed.userName,
          email: parsed.email,
          device: parsed.kind === "FEEDBACK" ? parsed.device ?? "-" : "-",
          feedbackType:
            parsed.kind === "FEEDBACK" ? parsed.feedbackType ?? "REQUEST" : "",
          source: parsed.kind === "PRAISE" ? parsed.source ?? "EMAIL" : "",
          language: parsed.kind === "PRAISE" ? parsed.language ?? "ZH_CN" : "",
          content: parsed.content,
          todo: parsed.todo,
          todoDone: parsed.todoDone ?? false,
          sortOrder: nextOrder
        }
      });

      const urls = parsed.kind === "PRAISE" ? parsed.images : [];
      if (urls.length) {
        await tx.feedbackImage.createMany({
          data: urls.map((url) => ({ feedbackId: fb.id, url }))
        });
      }

      const full = await tx.userFeedback.findUnique({
        where: { id: fb.id },
        include: {
          images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } }
        }
      });
      return full!;
    });

    await writeAudit({
      entity: "UserFeedback",
      entityId: created.id,
      action: "CREATE",
      payload: created
    });

    return NextResponse.json({ item: created });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Bad Request", { status: 400 });
  }
}

