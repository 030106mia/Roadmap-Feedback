-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'FEEDBACK',
    "userName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "device" TEXT NOT NULL DEFAULT '-',
    "feedbackType" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "todo" TEXT NOT NULL DEFAULT '',
    "todoDone" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserFeedback" ("content", "createdAt", "device", "email", "feedbackType", "id", "kind", "sortOrder", "source", "todo", "todoDone", "updatedAt", "userName") SELECT "content", "createdAt", "device", "email", "feedbackType", "id", "kind", "sortOrder", "source", "todo", "todoDone", "updatedAt", "userName" FROM "UserFeedback";
DROP TABLE "UserFeedback";
ALTER TABLE "new_UserFeedback" RENAME TO "UserFeedback";
CREATE INDEX "UserFeedback_kind_idx" ON "UserFeedback"("kind");
CREATE INDEX "UserFeedback_device_idx" ON "UserFeedback"("device");
CREATE INDEX "UserFeedback_feedbackType_idx" ON "UserFeedback"("feedbackType");
CREATE INDEX "UserFeedback_email_idx" ON "UserFeedback"("email");
CREATE INDEX "UserFeedback_createdAt_idx" ON "UserFeedback"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
