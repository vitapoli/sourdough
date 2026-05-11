import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
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

  const subdir = recipeUpload ? "recipes" : `feedings/${starterId}`;
  if (!recipeUpload && !starterId) {
    return NextResponse.json({ error: "No starterId" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);
    urls.push(`/uploads/${subdir}/${filename}`);
  }

  return NextResponse.json({ urls });
}
