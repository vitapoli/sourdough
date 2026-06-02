import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Получить все закваски текущего пользователя
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const starters = await prisma.starter.findMany({
    where: { userId: session.user.id },
    include: {
      feedings: {
        orderBy: { fedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(starters);
}

// Создать новую закваску
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const starter = await prisma.starter.create({
    data: {
      name: body.name,
      flour: body.flour,
      notes: body.notes,
      userId: session.user.id,
    },
  });
  return NextResponse.json(starter, { status: 201 });
}
