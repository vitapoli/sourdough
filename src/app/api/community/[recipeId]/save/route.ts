import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { recipeId } = await params;

  // Нельзя сохранять свой же рецепт
  const original = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!original || !original.isPublic) {
    return NextResponse.json({ error: "Рецепт не найден" }, { status: 404 });
  }
  if (original.userId === session.user.id) {
    return NextResponse.json({ error: "Это ваш рецепт" }, { status: 400 });
  }

  // Проверка — уже сохранён?
  const existing = await prisma.recipe.findFirst({
    where: { userId: session.user.id, parentId: recipeId },
  });
  if (existing) {
    return NextResponse.json({ error: "Уже сохранён" }, { status: 409 });
  }

  const saved = await prisma.recipe.create({
    data: {
      userId: session.user.id,
      title: original.title,
      description: original.description,
      flour: original.flour,
      hydration: original.hydration,
      starterPct: original.starterPct,
      salt: original.salt,
      ingredients: original.ingredients,
      hydrationCalc: original.hydrationCalc,
      steps: original.steps,
      photos: original.photos,
      previewHidden: original.previewHidden,
      parentId: original.id,
      isBuiltIn: false,
      isPublic: false,
    },
  });

  return NextResponse.json(saved, { status: 201 });
}
