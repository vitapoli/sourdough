import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  // Свои рецепты + встроенные (без владельца)
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { userId: null, isBuiltIn: true },
      ],
    },
    orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { isBuiltIn: "desc" }, { createdAt: "desc" }],
    include: { variants: true },
  });
  return NextResponse.json(recipes);
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
    return NextResponse.json({ error: String(error) }, { status: 500 });
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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const body = await request.json();

    // Массовое обновление порядка
    if (body.reorder) {
      const ids: string[] = body.reorder;
      await Promise.all(
        ids.map((id, i) => prisma.recipe.update({ where: { id }, data: { sortOrder: i } }))
      );
      return NextResponse.json({ ok: true });
    }

    const data: Record<string, boolean | number> = {};
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body.hidden === "boolean") data.hidden = body.hidden;
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    const recipe = await prisma.recipe.update({
      where: { id: body.id },
      data,
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe patch error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
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
