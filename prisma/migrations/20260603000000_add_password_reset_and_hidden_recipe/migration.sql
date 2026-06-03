-- CreateTable
CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateTable (заменяет HiddenRecipe)
CREATE TABLE IF NOT EXISTS "UserRecipePrefs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserRecipePrefs_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRecipePrefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserRecipePrefs_recipeId_userId_key" ON "UserRecipePrefs"("recipeId", "userId");

-- Сбросить глобальные флаги у встроенных рецептов
UPDATE "Recipe" SET "hidden" = 0, "pinned" = 0 WHERE "isBuiltIn" = 1;
