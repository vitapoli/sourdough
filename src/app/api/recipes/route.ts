import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    // Свои рецепты + встроенные (без владельца)
    const recipes = await prisma.recipe.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null, isBuiltIn: true },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { isBuiltIn: "desc" }, { createdAt: "desc" }],
      include: {
        variants: {
          where: { userId: session.user.id },
        },
        userPrefs: {
          where: { userId: session.user.id },
        },
        parent: {
          select: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // Для встроенных рецептов hidden/pinned берётся из персональных настроек
    // Для сохранённых из ленты — добавляем инфо об авторе
    const result = recipes.map(({ userPrefs, parent, ...recipe }) => {
      const prefs = userPrefs[0];
      const savedFrom = (!recipe.isBuiltIn && parent?.user) ? { id: parent.user.id, name: parent.user.name } : undefined;
      if (recipe.isBuiltIn) {
        return { ...recipe, hidden: prefs?.hidden ?? false, pinned: prefs?.pinned ?? false, savedFrom };
      }
      return { ...recipe, savedFrom };
    });

    // Сортировка: закреплённые сверху
    result.sort((a, b) => Number(b.pinned) - Number(a.pinned));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Recipes GET error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const body = await request.json();
    const recipe = await prisma.recipe.create({
      data: {
        title: body.title,
        description: body.description || null,
        flour: body.flour || "Пшеничная",
        hydration: parseInt(body.hydration) || 70,
        starterPct: parseInt(body.starterPct) || 20,
        salt: body.salt ? parseFloat(body.salt) : null,
        ingredients: body.ingredients || null,
        hydrationCalc: body.hydrationCalc || null,
        steps: body.steps || "[]",
        photos: body.photos || null,
        previewHidden: body.previewHidden || null,
        isBuiltIn: false,
        isPublic: body.isPublic ?? false,
        parentId: body.parentId || null,
        userId: session.user.id,
      },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Recipe save error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const body = await request.json();
    const existing = await prisma.recipe.findUnique({ where: { id: body.id } });
    if (!existing || (existing.userId && existing.userId !== session.user.id)) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const recipe = await prisma.recipe.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description || null,
        flour: body.flour || "Пшеничная",
        hydration: parseInt(body.hydration) || 70,
        starterPct: parseInt(body.starterPct) || 20,
        salt: body.salt ? parseFloat(body.salt) : null,
        ingredients: body.ingredients || null,
        hydrationCalc: body.hydrationCalc || null,
        steps: body.steps || "[]",
        photos: body.photos || null,
        previewHidden: body.previewHidden || null,
        ...(typeof body.isPublic === "boolean" ? { isPublic: body.isPublic } : {}),
      },
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe update error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const body = await request.json();

    // Массовое обновление порядка — только свои рецепты
    if (body.reorder) {
      const ids: string[] = body.reorder;
      const owned = await prisma.recipe.findMany({ where: { id: { in: ids }, OR: [{ userId: session.user.id }, { userId: null, isBuiltIn: true }] }, select: { id: true } });
      const ownedIds = new Set(owned.map(r => r.id));
      await Promise.all(
        ids.filter(id => ownedIds.has(id)).map((id, i) => prisma.recipe.update({ where: { id }, data: { sortOrder: i } }))
      );
      return NextResponse.json({ ok: true });
    }

    const recipe = await prisma.recipe.findUnique({ where: { id: body.id } });
    if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Встроенные рецепты: hidden/pinned через персональную таблицу UserRecipePrefs
    if (recipe.isBuiltIn && (typeof body.hidden === "boolean" || typeof body.pinned === "boolean")) {
      const prefs = await prisma.userRecipePrefs.upsert({
        where: { recipeId_userId: { recipeId: body.id, userId: session.user.id } },
        create: {
          recipeId: body.id,
          userId: session.user.id,
          hidden: body.hidden ?? false,
          pinned: body.pinned ?? false,
        },
        update: {
          ...(typeof body.hidden === "boolean" ? { hidden: body.hidden } : {}),
          ...(typeof body.pinned === "boolean" ? { pinned: body.pinned } : {}),
        },
      });
      return NextResponse.json({ ...recipe, hidden: prefs.hidden, pinned: prefs.pinned });
    }

    // Свои рецепты: проверка владельца
    if (recipe.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const data: Record<string, boolean | number> = {};
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body.hidden === "boolean") data.hidden = body.hidden;
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    const updated = await prisma.recipe.update({
      where: { id: body.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Recipe patch error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await request.json();
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (recipe.isBuiltIn) return NextResponse.json({ error: "Cannot delete built-in recipe" }, { status: 403 });
  if (recipe.userId && recipe.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
