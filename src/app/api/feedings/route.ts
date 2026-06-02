import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Добавить кормление
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  // Проверяем что закваска принадлежит пользователю
  const starter = await prisma.starter.findUnique({ where: { id: body.starterId } });
  if (!starter || starter.userId !== session.user.id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  const feeding = await prisma.feeding.create({
    data: {
      starterId: body.starterId,
      starterAmount: body.starterAmount,
      flourAmount: body.flourAmount,
      waterAmount: body.waterAmount,
      flourType: body.flourType,
      temperature: body.temperature,
      notes: body.notes,
      ...(body.fedAt ? { fedAt: new Date(body.fedAt) } : {}),
      ...(body.photos ? { photos: body.photos } : {}),
    },
  });
  return NextResponse.json(feeding, { status: 201 });
}

// Обновить кормление (включая данные наблюдения)
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  // Обычные поля кормления
  if ("flourAmount" in body) data.flourAmount = body.flourAmount;
  if ("waterAmount" in body) data.waterAmount = body.waterAmount;
  if ("starterAmount" in body) data.starterAmount = body.starterAmount;
  if ("flourType" in body) data.flourType = body.flourType;
  if ("temperature" in body) data.temperature = body.temperature;
  if ("notes" in body) data.notes = body.notes;
  if ("photos" in body) data.photos = body.photos;

  // Поля наблюдения
  if ("peakTimeHours" in body) data.peakTimeHours = body.peakTimeHours;
  if ("readyTimeHours" in body) data.readyTimeHours = body.readyTimeHours;
  if ("peakMultiplier" in body) data.peakMultiplier = body.peakMultiplier;

  const feeding = await prisma.feeding.update({
    where: { id: body.id },
    data,
  });
  return NextResponse.json(feeding);
}

// Удалить кормление
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await prisma.feeding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
