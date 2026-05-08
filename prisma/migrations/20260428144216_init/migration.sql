-- CreateTable
CREATE TABLE "Starter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "flour" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Feeding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "starterId" TEXT NOT NULL,
    "fedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flourAmount" REAL,
    "waterAmount" REAL,
    "flourType" TEXT,
    "temperature" REAL,
    "notes" TEXT,
    "photoUrl" TEXT,
    CONSTRAINT "Feeding_starterId_fkey" FOREIGN KEY ("starterId") REFERENCES "Starter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
