import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const userId = session?.user.id ?? null;

  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "new";
  const q = searchParams.get("q")?.trim() || "";
  const cursor = searchParams.get("cursor") || null;
  const limit = 20;

  const where: Record<string, unknown> = { isPublic: true };

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { flour: { contains: q } },
      { description: { contains: q } },
    ];
  }

  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const orderBy =
    sort === "popular"
      ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy,
    take: limit + 1,
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? { likes: { where: { userId }, select: { id: true } } }
        : {}),
    },
  });

  const hasMore = recipes.length > limit;
  const items = hasMore ? recipes.slice(0, limit) : recipes;

  const result = items.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    flour: r.flour,
    hydration: r.hydration,
    starterPct: r.starterPct,
    salt: r.salt,
    ingredients: r.ingredients,
    steps: r.steps,
    photos: r.photos,
    createdAt: r.createdAt,
    user: r.user,
    likesCount: r._count.likes,
    commentsCount: r._count.comments,
    isLikedByMe: userId ? ((r as Record<string, unknown>).likes as unknown[]).length > 0 : false,
  }));

  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

  return NextResponse.json({ recipes: result, nextCursor });
}
