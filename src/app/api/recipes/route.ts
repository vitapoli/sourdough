import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { isBuiltIn: "desc" }, { createdAt: "desc" }],
    include: { variants: true },
  });
  return NextResponse.json(recipes);
}

export async function POST(request: Request) {
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
        parentId: body.parentId || null,
      },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Recipe save error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
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
      },
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe update error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
  const { id } = await request.json();
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (recipe.isBuiltIn) {
    return NextResponse.json({ error: "Cannot delete built-in recipe" }, { status: 403 });
  }
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
