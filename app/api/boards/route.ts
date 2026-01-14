import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { boardCreateSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET() {
  const boards = await prisma.board.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });
  return NextResponse.json({ boards });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = boardCreateSchema.safeParse(json);
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const board = await prisma.board.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      sortOrder: parsed.data.sortOrder ?? 0
    }
  });

  await writeAudit({
    entity: "Board",
    entityId: board.id,
    action: "CREATE",
    payload: { board }
  });

  return NextResponse.json({ board }, { status: 201 });
}

