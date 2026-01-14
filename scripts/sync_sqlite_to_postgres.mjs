import { PrismaClient as PgClient } from "@prisma/client";
import { PrismaClient as SqliteClient } from "../node_modules/.prisma/sqlite-client/index.js";

/**
 * One-time sync: SQLite (prisma/dev.db) -> Postgres (POSTGRES_PRISMA_URL).
 *
 * Requirements:
 * - Local sqlite file exists at prisma/dev.db
 * - Target Postgres URL is available in env: POSTGRES_PRISMA_URL
 *
 * Usage:
 *   POSTGRES_PRISMA_URL="..." node scripts/sync_sqlite_to_postgres.mjs
 *
 * Optional destructive mode (empty target tables first):
 *   SYNC_MODE=replace POSTGRES_PRISMA_URL="..." node scripts/sync_sqlite_to_postgres.mjs
 */

const pg = new PgClient({ log: ["error"] });
const sqlite = new SqliteClient({ log: ["error"] });

const mode = process.env.SYNC_MODE || "merge";

async function createManyBestEffort(model, rows, label) {
  if (!rows.length) return;
  // Try fast path first.
  try {
    await model.createMany({ data: rows, skipDuplicates: true });
    return;
  } catch (e) {
    const msg = String(e?.message ?? e);
    // Some Prisma builds (or adapters) don't support skipDuplicates.
    if (!msg.includes("Unknown argument `skipDuplicates`")) {
      throw e;
    }
    console.log(`[sync] ${label}: skipDuplicates unsupported, fallback to row-by-row`);
  }

  // Slow fallback: insert row-by-row and ignore duplicates.
  for (const row of rows) {
    try {
      await model.create({ data: row });
    } catch {
      // ignore duplicates / constraint errors (best-effort)
    }
  }
}

async function main() {
  if (!process.env.POSTGRES_PRISMA_URL) {
    throw new Error("Missing env POSTGRES_PRISMA_URL");
  }

  console.log(`[sync] mode=${mode}`);

  // Read everything from sqlite
  const [
    boards,
    tags,
    items,
    itemTags,
    itemImages,
    feedback,
    feedbackImages,
    auditLogs
  ] = await Promise.all([
    sqlite.board.findMany(),
    sqlite.tag.findMany(),
    sqlite.roadmapItem.findMany(),
    sqlite.itemTag.findMany(),
    sqlite.itemImage.findMany(),
    sqlite.userFeedback.findMany(),
    sqlite.feedbackImage.findMany(),
    sqlite.auditLog.findMany()
  ]);

  console.log(
    `[sqlite] boards=${boards.length} tags=${tags.length} items=${items.length} itemTags=${itemTags.length} itemImages=${itemImages.length} feedback=${feedback.length} feedbackImages=${feedbackImages.length} auditLogs=${auditLogs.length}`
  );

  if (mode === "replace") {
    console.log("[sync] clearing target tables (replace mode)...");
    await pg.$transaction([
      pg.feedbackImage.deleteMany({}),
      pg.userFeedback.deleteMany({}),
      pg.itemImage.deleteMany({}),
      pg.itemTag.deleteMany({}),
      pg.tag.deleteMany({}),
      pg.roadmapItem.deleteMany({}),
      pg.board.deleteMany({}),
      pg.auditLog.deleteMany({})
    ]);
  }

  // Insert into Postgres (keep ids)
  // Use createMany for speed; skipDuplicates makes re-runs safe.
  await createManyBestEffort(pg.board, boards, "board");
  await createManyBestEffort(pg.tag, tags, "tag");
  await createManyBestEffort(pg.roadmapItem, items, "roadmapItem");
  await createManyBestEffort(pg.itemTag, itemTags, "itemTag");
  await createManyBestEffort(pg.itemImage, itemImages, "itemImage");
  await createManyBestEffort(pg.userFeedback, feedback, "userFeedback");
  await createManyBestEffort(pg.feedbackImage, feedbackImages, "feedbackImage");
  await createManyBestEffort(pg.auditLog, auditLogs, "auditLog");

  console.log("[sync] done");
}

await main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await pg.$disconnect();
  });

