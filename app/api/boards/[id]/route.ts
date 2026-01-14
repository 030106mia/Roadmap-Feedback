import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { boardUpdateSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const board = await prisma.board.findUnique({
    where: { id: params.id }
  });
  if (!board) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ board });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const json = await req.json().catch(() => null);
  const parsed = boardUpdateSchema.safeParse({ ...json, id: params.id });
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const board = await prisma.board.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      sortOrder: parsed.data.sortOrder
    }
  });

  await writeAudit({
    entity: "Board",
    entityId: board.id,
    action: "UPDATE",
    payload: { board }
  });

  return NextResponse.json({ board });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const board = await prisma.board.findUnique({ where: { id: params.id } });
  if (!board) return new NextResponse("Not found", { status: 404 });

  await prisma.board.delete({ where: { id: params.id } });
  await writeAudit({
    entity: "Board",
    entityId: params.id,
    action: "DELETE",
    payload: { board }
  });
  return new NextResponse(null, { status: 204 });
}

