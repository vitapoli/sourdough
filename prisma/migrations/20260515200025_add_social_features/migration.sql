/*
  Warnings:

  - You are about to drop the `RiseObservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `photoUrl` on the `Feeding` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RiseObservation";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feeding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "starterId" TEXT NOT NULL,
    "fedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "starterAmount" REAL,
    "flourAmount" REAL,
    "waterAmount" REAL,
    "flourType" TEXT,
    "temperature" REAL,
    "notes" TEXT,
    "photos" TEXT,
    "peakTimeHours" REAL,
    "readyTimeHours" REAL,
    "peakMultiplier" REAL,
    CONSTRAINT "Feeding_starterId_fkey" FOREIGN KEY ("starterId") REFERENCES "Starter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Feeding" ("fedAt", "flourAmount", "flourType", "id", "notes", "starterId", "temperature", "waterAmount") SELECT "fedAt", "flourAmount", "flourType", "id", "notes", "starterId", "temperature", "waterAmount" FROM "Feeding";
DROP TABLE "Feeding";
ALTER TABLE "new_Feeding" RENAME TO "Feeding";
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "flour" TEXT NOT NULL,
    "hydration" INTEGER NOT NULL,
    "starterPct" INTEGER NOT NULL,
    "salt" REAL,
    "ingredients" TEXT,
    "hydrationCalc" TEXT,
    "steps" TEXT NOT NULL,
    "photos" TEXT,
    "previewHidden" TEXT,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recipe_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("createdAt", "description", "flour", "hydration", "id", "isBuiltIn", "salt", "starterPct", "steps", "title") SELECT "createdAt", "description", "flour", "hydration", "id", "isBuiltIn", "salt", "starterPct", "steps", "title" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE TABLE "new_Starter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "flour" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "Starter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Starter" ("createdAt", "flour", "id", "name", "notes") SELECT "createdAt", "flour", "id", "name", "notes" FROM "Starter";
DROP TABLE "Starter";
ALTER TABLE "new_Starter" RENAME TO "Starter";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Like_recipeId_userId_key" ON "Like"("recipeId", "userId");
