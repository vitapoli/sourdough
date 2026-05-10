import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    orderBy: [{ isBuiltIn: "desc" }, { createdAt: "desc" }],
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
        isBuiltIn: false,
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
      },
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe update error:", error);
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
