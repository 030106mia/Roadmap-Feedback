import { prisma } from "@/lib/db";
import { ensureUnifiedRoadmap } from "@/lib/migrate";
import { NextResponse } from "next/server";

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

export async function GET() {
  // ensure tags exist for legacy boards before listing
  await ensureUnifiedRoadmap();

  // ensure default tags exist
  await Promise.all(
    DEFAULT_TAGS.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  const tags = await prisma.tag.findMany({
    orderBy: [{ name: "asc" }]
  });
  return NextResponse.json({ tags });
}

