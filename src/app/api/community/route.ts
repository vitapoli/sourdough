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

  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const orderBy =
    sort === "popular"
      ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  // SQLite-поиск через LIKE для кириллицы регистрозависим. Поэтому при
  // поиске берём все публичные рецепты и фильтруем в JS через toLowerCase()
  // — он корректно понижает регистр кириллицы.
  const recipes = await prisma.recipe.findMany({
    where,
    orderBy,
    take: q ? undefined : limit + 1,
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
      ...(userId
        ? { likes: { where: { userId }, select: { id: true } } }
        : {}),
    },
  });

  let filtered = recipes;
  if (q) {
    const ql = q.toLowerCase();
    filtered = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(ql) ||
        r.flour.toLowerCase().includes(ql) ||
        (r.description ?? "").toLowerCase().includes(ql)
    );
  }

  const hasMore = filtered.length > limit;
  const items = hasMore ? filtered.slice(0, limit) : filtered;

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
    translations: r.translations,
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
