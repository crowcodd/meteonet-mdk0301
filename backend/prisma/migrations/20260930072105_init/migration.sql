-- CreateTable
CREATE TABLE "District" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "areaKm2" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Station" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "districtId" INTEGER NOT NULL,
    CONSTRAINT "Station_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "contacts" TEXT,
    "stationId" INTEGER,
    "refreshTokenHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parameter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "minValue" REAL NOT NULL,
    "maxValue" REAL NOT NULL,
    "precision" INTEGER NOT NULL,
    "neighborTolerance" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "stationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "commissionedAt" DATETIME NOT NULL,
    "nextVerificationAt" DATETIME NOT NULL,
    CONSTRAINT "Instrument_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstrumentParameter" (
    "instrumentId" INTEGER NOT NULL,
    "parameterId" INTEGER NOT NULL,

    PRIMARY KEY ("instrumentId", "parameterId"),
    CONSTRAINT "InstrumentParameter_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentParameter_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stationId" INTEGER NOT NULL,
    "parameterId" INTEGER NOT NULL,
    "instrumentId" INTEGER NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delayed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "currentRevision" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Measurement_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Measurement_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "Parameter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Measurement_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeasurementRevision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "measurementId" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "reason" TEXT,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeasurementRevision_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeasurementRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "measurementId" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "deviation" REAL,
    "referenceValue" REAL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckResult_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FailureLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "instrumentId" INTEGER NOT NULL,
    "stationId" INTEGER NOT NULL,
    "reportedById" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "reserveInstrumentId" INTEGER,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "FailureLog_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FailureLog_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FailureLog_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FailureLog_reserveInstrumentId_fkey" FOREIGN KEY ("reserveInstrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "fromState" TEXT,
    "toState" TEXT NOT NULL,
    "actorId" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "District_name_key" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Parameter_code_key" ON "Parameter"("code");

-- CreateIndex
CREATE INDEX "Measurement_parameterId_observedAt_idx" ON "Measurement"("parameterId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_stationId_parameterId_observedAt_key" ON "Measurement"("stationId", "parameterId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementRevision_measurementId_revision_key" ON "MeasurementRevision"("measurementId", "revision");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
