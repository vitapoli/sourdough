import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const builtInRecipes = [
  {
    title: "Классический белый на закваске",
    description: "Простой белый хлеб с хрустящей корочкой и мягким мякишем",
    flour: "Пшеничная",
    hydration: 70,
    starterPct: 20,
    salt: 10,
    ingredients: JSON.stringify([
      { name: "Пшеничная мука", amount: "500", unit: "г" },
      { name: "Вода", amount: "350", unit: "г" },
      { name: "Закваска", amount: "100", unit: "г" },
      { name: "Соль", amount: "10", unit: "г" },
    ]),
    steps: JSON.stringify([
      "Смешать муку и воду, оставить на 30 мин (автолиз)",
      "Добавить закваску и соль, вымесить тесто",
      "Складывания каждые 30 мин, 3-4 раза",
      "Брожение 4-6 часов при комнатной температуре",
      "Формовка и расстойка в холодильнике 8-12 часов",
      "Выпекать в разогретой духовке 250°C с паром 20 мин",
      "Снизить до 220°C, выпекать ещё 20-25 мин",
    ]),
  },
  {
    title: "Ржаной хлеб",
    description: "Тёмный ржаной хлеб с насыщенным вкусом",
    flour: "Ржаная",
    hydration: 75,
    starterPct: 30,
    salt: 10,
    ingredients: JSON.stringify([
      { name: "Ржаная мука", amount: "500", unit: "г" },
      { name: "Вода", amount: "375", unit: "г" },
      { name: "Закваска", amount: "150", unit: "г" },
      { name: "Соль", amount: "10", unit: "г" },
    ]),
    steps: JSON.stringify([
      "Смешать ржаную муку, воду и закваску",
      "Добавить соль, хорошо перемешать",
      "Оставить на брожение 3-4 часа",
      "Переложить в форму, разровнять мокрыми руками",
      "Расстойка 1-2 часа до увеличения в объёме",
      "Выпекать при 230°C 10 мин, затем 200°C 40-50 мин",
    ]),
  },
  {
    title: "Чиабатта",
    description: "Итальянский хлеб с большими дырками и хрустящей коркой",
    flour: "Пшеничная",
    hydration: 80,
    starterPct: 20,
    salt: 10,
    ingredients: JSON.stringify([
      { name: "Пшеничная мука", amount: "500", unit: "г" },
      { name: "Вода", amount: "400", unit: "г" },
      { name: "Закваска", amount: "100", unit: "г" },
      { name: "Соль", amount: "10", unit: "г" },
    ]),
    steps: JSON.stringify([
      "Смешать муку, воду и закваску (тесто будет очень влажным)",
      "Добавить соль через 30 мин",
      "Складывания каждые 30 мин, 4-5 раз",
      "Брожение 5-7 часов до увеличения вдвое",
      "Аккуратно выложить на муку, разделить на 2 части",
      "Минимальная расстойка 30 мин",
      "Выпекать при 250°C с паром 20-25 мин",
    ]),
  },
  {
    title: "Цельнозерновой хлеб",
    description: "Полезный хлеб из цельнозерновой муки",
    flour: "Цельнозерновая",
    hydration: 75,
    starterPct: 25,
    salt: 10,
    ingredients: JSON.stringify([
      { name: "Цельнозерновая мука", amount: "500", unit: "г" },
      { name: "Вода", amount: "375", unit: "г" },
      { name: "Закваска", amount: "125", unit: "г" },
      { name: "Соль", amount: "10", unit: "г" },
    ]),
    steps: JSON.stringify([
      "Смешать муку и воду, оставить на аутолиз на 1 час",
      "Добавить закваску и соль, вымесить",
      "Складывания каждые 30 мин, 3 раза",
      "Брожение 4-5 часов",
      "Формовка, расстойка в холодильнике 8-10 часов",
      "Выпекать при 240°C с паром 20 мин",
      "Снизить до 210°C, ещё 25-30 мин",
    ]),
  },
];

async function main() {
  const existing = await prisma.recipe.findMany({ where: { isBuiltIn: true } });

  if (existing.length === 0) {
    for (const recipe of builtInRecipes) {
      await prisma.recipe.create({
        data: { ...recipe, isBuiltIn: true },
      });
    }
    console.log(`Добавлено ${builtInRecipes.length} встроенных рецептов`);
    return;
  }

  // Обновить существующие встроенные рецепты (добавить ингредиенты если нет)
  let updated = 0;
  for (const recipe of builtInRecipes) {
    const found = existing.find((e) => e.title === recipe.title);
    if (found && !found.ingredients) {
      await prisma.recipe.update({
        where: { id: found.id },
        data: { ingredients: recipe.ingredients },
      });
      updated++;
    }
  }
  if (updated > 0) {
    console.log(`Обновлено ${updated} встроенных рецептов (добавлены ингредиенты)`);
  } else {
    console.log("Встроенные рецепты актуальны");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
