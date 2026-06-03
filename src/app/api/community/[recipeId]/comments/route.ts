import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = await params;

  // Только для публичных рецептов
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { isPublic: true } });
  if (!recipe?.isPublic) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { recipeId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { recipeId } = await params;
  const { text } = await req.json();

  const trimmed = (text || "").trim();
  if (!trimmed || trimmed.length > 500) {
    return NextResponse.json({ error: "Комментарий должен быть от 1 до 500 символов" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { recipeId, userId: session.user.id, text: trimmed },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { commentId } = await req.json();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
