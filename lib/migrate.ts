import { prisma } from "@/lib/db";

const DEFAULT_BOARD_NAME = "All";

declare global {
  // eslint-disable-next-line no-var
  var __unifiedRoadmapMigrated: boolean | undefined;
}

/**
 * One-time best-effort migration:
 * - Ensure a default "All" board exists
 * - Convert existing boards to tags
 * - Move all items to the default board and attach the former board name as a tag
 */
export async function ensureUnifiedRoadmap() {
  if (global.__unifiedRoadmapMigrated) return;

  try {
    // Create default board if needed.
    // NOTE: Board.name is NOT unique in schema, so we can't use upsert({ where: { name } }).
    // Use findFirst + create instead to keep this migration compatible with existing DBs.
    const defaultBoard =
      (await prisma.board.findFirst({
        where: { name: DEFAULT_BOARD_NAME },
        select: { id: true }
      })) ??
      (await prisma.board.create({
        data: {
          name: DEFAULT_BOARD_NAME,
          description: "默认聚合板块（UI 不再展示）"
        },
        select: { id: true }
      }));

    // Fast check: if no item is outside the default board, we're done.
    const pending = await prisma.roadmapItem.findFirst({
      where: { boardId: { not: defaultBoard.id } },
      select: { id: true }
    });
    if (!pending) {
      global.__unifiedRoadmapMigrated = true;
      return;
    }

    const boards = await prisma.board.findMany({
      where: { id: { not: defaultBoard.id } },
      select: { id: true, name: true }
    });
    if (!boards.length) {
      global.__unifiedRoadmapMigrated = true;
      return;
    }

    // Upsert tags for every legacy board.
    const tagByBoardId = new Map<string, { id: string; name: string }>();
    for (const b of boards) {
      const tag = await prisma.tag.upsert({
        where: { name: b.name },
        update: {},
        create: { name: b.name },
        select: { id: true, name: true }
      });
      tagByBoardId.set(b.id, tag);
    }

    const legacyBoardIds = boards.map((b) => b.id);

    const items = await prisma.roadmapItem.findMany({
      where: { boardId: { in: legacyBoardIds } },
      select: { id: true, boardId: true }
    });

    if (!items.length) {
      global.__unifiedRoadmapMigrated = true;
      return;
    }

    // Single transaction: move items + create item-tag links.
    await prisma.$transaction(async (tx) => {
      await tx.roadmapItem.updateMany({
        where: { boardId: { in: legacyBoardIds } },
        data: { boardId: defaultBoard.id }
      });

      const rows = items
        .map((it) => {
          const tag = tagByBoardId.get(it.boardId);
          if (!tag) return null;
          return { itemId: it.id, tagId: tag.id };
        })
        .filter(Boolean) as Array<{ itemId: string; tagId: string }>;

      if (rows.length) {
        // Prisma + SQLite in some environments doesn't support createMany(skipDuplicates),
        // so we insert row-by-row and ignore duplicate composite ids.
        for (const row of rows) {
          try {
            await tx.itemTag.create({ data: row });
          } catch {
            // ignore duplicates / best-effort migration
          }
        }
      }
    });

    global.__unifiedRoadmapMigrated = true;
  } catch {
    // best-effort: never block requests because of migration
    global.__unifiedRoadmapMigrated = true;
  }
}

