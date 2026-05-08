import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Получить все закваски
export async function GET() {
  const starters = await prisma.starter.findMany({
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
  const body = await request.json();
  const starter = await prisma.starter.create({
    data: {
      name: body.name,
      flour: body.flour,
      notes: body.notes,
    },
  });
  return NextResponse.json(starter, { status: 201 });
}
