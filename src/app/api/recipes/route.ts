import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    orderBy: [{ isBuiltIn: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(recipes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const recipe = await prisma.recipe.create({
    data: {
      title: body.title,
      description: body.description,
      flour: body.flour,
      hydration: body.hydration,
      starterPct: body.starterPct,
      salt: body.salt,
      steps: body.steps,
      isBuiltIn: false,
    },
  });
  return NextResponse.json(recipe, { status: 201 });
}
