import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { recipeId } = await params;

  try {
    await prisma.like.create({
      data: { recipeId, userId: session.user.id },
    });
  } catch {
    // Уже лайкнут — игнорируем
  }

  const count = await prisma.like.count({ where: { recipeId } });
  return NextResponse.json({ likesCount: count });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ recipeId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { recipeId } = await params;

  await prisma.like.deleteMany({
    where: { recipeId, userId: session.user.id },
  });

  const count = await prisma.like.count({ where: { recipeId } });
  return NextResponse.json({ likesCount: count });
}
