import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await getSession();
  const currentUserId = session?.user.id ?? null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Пекарь не найден" }, { status: 404 });
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId, isPublic: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { likes: true, comments: true } },
      ...(currentUserId
        ? { likes: { where: { userId: currentUserId }, select: { id: true } } }
        : {}),
    },
  });

  const result = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    flour: r.flour,
    hydration: r.hydration,
    starterPct: r.starterPct,
    photos: r.photos,
    ingredients: r.ingredients,
    steps: r.steps,
    salt: r.salt,
    translations: r.translations,
    createdAt: r.createdAt,
    likesCount: r._count.likes,
    commentsCount: r._count.comments,
    isLikedByMe: currentUserId ? ((r as Record<string, unknown>).likes as unknown[]).length > 0 : false,
  }));

  return NextResponse.json({ user, recipes: result });
}
