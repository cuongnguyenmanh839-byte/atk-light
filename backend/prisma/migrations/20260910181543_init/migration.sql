-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "avatar" TEXT,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemState" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "power" BOOLEAN NOT NULL DEFAULT true,
    "brightness" INTEGER NOT NULL DEFAULT 70,
    "colorTemperature" INTEGER NOT NULL DEFAULT 4000,
    "mode" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'mountain',
    "mapX" REAL NOT NULL DEFAULT 0,
    "mapY" REAL NOT NULL DEFAULT 0,
    "power" BOOLEAN NOT NULL DEFAULT true,
    "brightness" INTEGER NOT NULL DEFAULT 70,
    "colorTemperature" INTEGER NOT NULL DEFAULT 4000,
    "totalLights" INTEGER NOT NULL DEFAULT 0,
    "activeLights" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LightDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "power" BOOLEAN NOT NULL DEFAULT false,
    "brightness" INTEGER NOT NULL DEFAULT 70,
    "colorTemperature" INTEGER NOT NULL DEFAULT 4000,
    "powerConsumption" REAL,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LightDevice_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LightingScene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brightness" INTEGER NOT NULL,
    "colorTemperature" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "areaId" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "daysOfWeek" TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
    "sceneCode" TEXT,
    "brightness" INTEGER,
    "colorTemperature" INTEGER,
    "power" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastExecutedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnergyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "areaId" TEXT,
    "deviceId" TEXT,
    "power" REAL NOT NULL DEFAULT 0,
    "energy" REAL NOT NULL DEFAULT 0,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnergyRecord_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EnergyRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "LightDevice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "areaId" TEXT,
    "deviceId" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Alert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "LightDevice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "siteName" TEXT NOT NULL DEFAULT 'ATK Định Hóa',
    "location" TEXT NOT NULL DEFAULT 'Định Hóa, Thái Nguyên',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "mqttUrl" TEXT,
    "mqttPort" INTEGER NOT NULL DEFAULT 1883,
    "simulationMode" BOOLEAN NOT NULL DEFAULT true,
    "offlineThresholdSecs" INTEGER NOT NULL DEFAULT 300,
    "energyUnit" TEXT NOT NULL DEFAULT 'kWh',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Area_code_key" ON "Area"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LightDevice_deviceCode_key" ON "LightDevice"("deviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "LightingScene_code_key" ON "LightingScene"("code");

-- CreateIndex
CREATE INDEX "EnergyRecord_recordedAt_idx" ON "EnergyRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "EnergyRecord_areaId_recordedAt_idx" ON "EnergyRecord"("areaId", "recordedAt");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "Alert_acknowledged_idx" ON "Alert"("acknowledged");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
