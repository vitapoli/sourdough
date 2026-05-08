-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "flour" TEXT NOT NULL,
    "hydration" INTEGER NOT NULL,
    "starterPct" INTEGER NOT NULL,
    "salt" REAL,
    "steps" TEXT NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
