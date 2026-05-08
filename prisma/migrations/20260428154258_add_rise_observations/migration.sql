-- CreateTable
CREATE TABLE "RiseObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "starterId" TEXT NOT NULL,
    "flourType" TEXT NOT NULL,
    "ratio" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "peakTimeHours" REAL NOT NULL,
    "readyTimeHours" REAL NOT NULL,
    "peakMultiplier" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiseObservation_starterId_fkey" FOREIGN KEY ("starterId") REFERENCES "Starter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
