import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Получить одну закваску с историей кормлений
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const starter = await prisma.starter.findUnique({
    where: { id },
    include: {
      feedings: {
        orderBy: { fedAt: "desc" },
      },
    },
  });

  if (!starter || starter.userId !== session.user.id) {
    return NextResponse.json({ error: "Закваска не найдена" }, { status: 404 });
  }

  return NextResponse.json(starter);
}

// Удалить закваску
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const starter = await prisma.starter.findUnique({ where: { id } });
  if (!starter || starter.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.starter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
