import { prisma } from "@/lib/db";
import { clearSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
