-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "sellMethod" TEXT NOT NULL,
    "pickupFee" REAL,
    "distance" REAL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "damages" TEXT NOT NULL,
    "hasBox" BOOLEAN NOT NULL DEFAULT true,
    "hasCharger" BOOLEAN NOT NULL DEFAULT true,
    "isActivationLocked" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" REAL NOT NULL,
    "damageDeduction" REAL NOT NULL,
    "margin" REAL NOT NULL,
    "finalQuote" REAL NOT NULL,
    "pickupFee" REAL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quote_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "street" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NSW',
    "latitude" REAL,
    "longitude" REAL,
    "formattedAddress" TEXT
);

-- CreateTable
CREATE TABLE "schedule_slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "addressId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "isSameDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "schedule_slot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "address" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "state_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT NOT NULL,
    "reason" TEXT,
    "adminUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "state_log_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "state_log_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phoneNumber" TEXT,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "analytics_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "properties" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "price_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "repair_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "damageType" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "legacy_id_map" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oldId" TEXT NOT NULL,
    "newId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_leadId_key" ON "verification"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_key" ON "verification"("token");

-- CreateIndex
CREATE UNIQUE INDEX "quote_leadId_key" ON "quote"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_slot_date_startTime_key" ON "schedule_slot"("date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_leadId_key" ON "appointment"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_email_key" ON "blacklist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_phoneNumber_key" ON "blacklist"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "price_catalog_model_storage_key" ON "price_catalog"("model", "storage");

-- CreateIndex
CREATE UNIQUE INDEX "repair_catalog_damageType_key" ON "repair_catalog"("damageType");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_id_map_oldId_key" ON "legacy_id_map"("oldId");
