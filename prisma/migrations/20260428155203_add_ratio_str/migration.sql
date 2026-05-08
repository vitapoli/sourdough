-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RiseObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "starterId" TEXT NOT NULL,
    "flourType" TEXT NOT NULL,
    "ratio" REAL NOT NULL,
    "ratioStr" TEXT NOT NULL DEFAULT '',
    "temperature" REAL NOT NULL,
    "peakTimeHours" REAL NOT NULL,
    "readyTimeHours" REAL NOT NULL,
    "peakMultiplier" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiseObservation_starterId_fkey" FOREIGN KEY ("starterId") REFERENCES "Starter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RiseObservation" ("createdAt", "flourType", "id", "notes", "peakMultiplier", "peakTimeHours", "ratio", "readyTimeHours", "starterId", "temperature") SELECT "createdAt", "flourType", "id", "notes", "peakMultiplier", "peakTimeHours", "ratio", "readyTimeHours", "starterId", "temperature" FROM "RiseObservation";
DROP TABLE "RiseObservation";
ALTER TABLE "new_RiseObservation" RENAME TO "RiseObservation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
