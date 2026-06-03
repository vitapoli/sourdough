import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const formData = await request.formData();
  const files = formData.getAll("photos") as File[];
  const starterId = formData.get("starterId") as string;
  const recipeUpload = formData.get("type") === "recipe";

  if (!files.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const maxFiles = recipeUpload ? 3 : 4;
  if (files.length > maxFiles) {
    return NextResponse.json({ error: `Максимум ${maxFiles} фото` }, { status: 400 });
  }

  // Валидация файлов
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Допустимы только изображения (JPEG, PNG, WebP, GIF)" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Максимальный размер файла — 5 МБ" }, { status: 400 });
    }
  }

  // Проверка владельца закваски
  if (!recipeUpload) {
    if (!starterId || !/^[a-z0-9]+$/i.test(starterId)) {
      return NextResponse.json({ error: "Некорректный starterId" }, { status: 400 });
    }
    const starter = await prisma.starter.findUnique({ where: { id: starterId }, select: { userId: true } });
    if (!starter || starter.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
  }

  const subdir = recipeUpload ? "recipes" : `feedings/${starterId}`;
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  const urls: string[] = [];
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = EXT_MAP[file.type] || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    urls.push(`/uploads/${subdir}/${filename}`);
  }

  return NextResponse.json({ urls });
}
