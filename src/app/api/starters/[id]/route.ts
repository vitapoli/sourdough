import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Получить одну закваску с историей кормлений
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const starter = await prisma.starter.findUnique({
    where: { id },
    include: {
      feedings: {
        orderBy: { fedAt: "desc" },
      },
    },
  });

  if (!starter) {
    return NextResponse.json({ error: "Закваска не найдена" }, { status: 404 });
  }

  return NextResponse.json(starter);
}

// Удалить закваску
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.starter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
