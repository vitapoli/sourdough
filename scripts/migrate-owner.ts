/**
 * Скрипт миграции: привязывает существующие закваски и рецепты к первому пользователю.
 * Запускать ОДИН РАЗ после деплоя с авторизацией.
 *
 * Использование:
 *   npx tsx scripts/migrate-owner.ts <email>
 *
 * Пример:
 *   npx tsx scripts/migrate-owner.ts violetta@example.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Использование: npx tsx scripts/migrate-owner.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Пользователь с email ${email} не найден. Сначала зарегистрируйся.`);
    process.exit(1);
  }

  // Привязать все закваски без владельца
  const starters = await prisma.starter.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });
  console.log(`Закваски привязаны: ${starters.count}`);

  // Привязать все пользовательские рецепты без владельца (не встроенные)
  const recipes = await prisma.recipe.updateMany({
    where: { userId: null, isBuiltIn: false },
    data: { userId: user.id },
  });
  console.log(`Рецепты привязаны: ${recipes.count}`);

  console.log(`\nГотово! Все данные закреплены за ${user.name} (${user.email})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
