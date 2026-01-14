-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'FEEDBACK',
    "userName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "device" TEXT NOT NULL DEFAULT '-',
    "feedbackType" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "todo" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeedbackImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedbackId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackImage_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "UserFeedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserFeedback_kind_idx" ON "UserFeedback"("kind");

-- CreateIndex
CREATE INDEX "UserFeedback_device_idx" ON "UserFeedback"("device");

-- CreateIndex
CREATE INDEX "UserFeedback_feedbackType_idx" ON "UserFeedback"("feedbackType");

-- CreateIndex
CREATE INDEX "UserFeedback_email_idx" ON "UserFeedback"("email");

-- CreateIndex
CREATE INDEX "UserFeedback_createdAt_idx" ON "UserFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "FeedbackImage_feedbackId_idx" ON "FeedbackImage"("feedbackId");
