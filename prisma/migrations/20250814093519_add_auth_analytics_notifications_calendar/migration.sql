/*
  Warnings:

  - Added the required column `passwordHash` to the `admin_user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "analytics_event" ADD COLUMN "action" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "browserName" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "category" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "deviceType" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "label" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "leadId" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "pageUrl" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "referrer" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "screenHeight" INTEGER;
ALTER TABLE "analytics_event" ADD COLUMN "screenWidth" INTEGER;
ALTER TABLE "analytics_event" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "analytics_event" ADD COLUMN "value" REAL;

-- CreateTable
CREATE TABLE "login_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "loginType" TEXT NOT NULL,
    "failureReason" TEXT,
    "sessionId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_activity_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "externalId" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "calendar_integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" DATETIME,
    "calendarId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calendar_integration_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_admin_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_admin_user" ("createdAt", "email", "firstName", "id", "isActive", "lastName", "role", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "isActive", "lastName", "role", "updatedAt" FROM "admin_user";
DROP TABLE "admin_user";
ALTER TABLE "new_admin_user" RENAME TO "admin_user";
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "analytics_event_event_idx" ON "analytics_event"("event");

-- CreateIndex
CREATE INDEX "analytics_event_category_idx" ON "analytics_event"("category");

-- CreateIndex
CREATE INDEX "analytics_event_leadId_idx" ON "analytics_event"("leadId");

-- CreateIndex
CREATE INDEX "analytics_event_sessionId_idx" ON "analytics_event"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_event_timestamp_idx" ON "analytics_event"("timestamp");
