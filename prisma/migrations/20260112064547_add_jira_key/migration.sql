-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoadmapItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "jiraKey" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'P2',
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadmapItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoadmapItem" ("boardId", "createdAt", "description", "endDate", "id", "priority", "sortOrder", "source", "startDate", "status", "title", "updatedAt") SELECT "boardId", "createdAt", "description", "endDate", "id", "priority", "sortOrder", "source", "startDate", "status", "title", "updatedAt" FROM "RoadmapItem";
DROP TABLE "RoadmapItem";
ALTER TABLE "new_RoadmapItem" RENAME TO "RoadmapItem";
CREATE INDEX "RoadmapItem_boardId_idx" ON "RoadmapItem"("boardId");
CREATE INDEX "RoadmapItem_priority_idx" ON "RoadmapItem"("priority");
CREATE INDEX "RoadmapItem_status_idx" ON "RoadmapItem"("status");
CREATE INDEX "RoadmapItem_jiraKey_idx" ON "RoadmapItem"("jiraKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
