// Одноразовая/идемпотентная оптимизация уже загруженных фото в public/uploads.
// Уменьшает большие фото до макс. 1280px и пережимает их, сохраняя имя файла
// (чтобы не ломать ссылки в базе). Уже маленькие файлы пропускает.
//
// Запуск:   node scripts/optimize-uploads.mjs
// Проверка: node scripts/optimize-uploads.mjs --dry   (ничего не меняет, только показывает)

import { readdir, stat, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry");
const ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_DIM = 1280;          // максимальная сторона
const SKIP_IF_SMALLER = 300 * 1024; // если файл уже < 300 КБ и не широкий — не трогаем
const SKIP_IF_NARROWER = 1400;      // ширина, ниже которой считаем фото уже нормальным

// Как пережимать в зависимости от формата (формат сохраняем, чтобы не менять ссылки)
function encode(pipeline, ext) {
  if (ext === ".png") return pipeline.png({ compressionLevel: 9 });
  if (ext === ".webp") return pipeline.webp({ quality: 80 });
  return pipeline.jpeg({ quality: 80, mozjpeg: true }); // jpg/jpeg и всё остальное
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // папки может не быть — это ок
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let processed = 0, skipped = 0, saved = 0, failed = 0;

for await (const file of walk(ROOT)) {
  const ext = path.extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue; // gif/прочее не трогаем

  try {
    const sizeBefore = (await stat(file)).size;
    const input = await readFile(file);
    const meta = await sharp(input).metadata();

    // Уже компактный — пропускаем
    if (sizeBefore <= SKIP_IF_SMALLER && (meta.width || 0) <= SKIP_IF_NARROWER) {
      skipped++;
      continue;
    }

    const output = await encode(
      sharp(input).rotate().resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true }),
      ext
    ).toBuffer();

    // Перезаписываем только если реально стало меньше
    if (output.length < sizeBefore) {
      if (!DRY) await writeFile(file, output);
      saved += sizeBefore - output.length;
      processed++;
      console.log(`${(sizeBefore / 1024 | 0)} КБ -> ${(output.length / 1024 | 0)} КБ  ${path.relative(ROOT, file)}`);
    } else {
      skipped++;
    }
  } catch (e) {
    failed++;
    console.error(`Пропуск (ошибка): ${path.relative(ROOT, file)} — ${e.message}`);
  }
}

console.log(
  `\nГотово${DRY ? " (пробный прогон, файлы не менялись)" : ""}: ` +
  `сжато ${processed}, пропущено ${skipped}, ошибок ${failed}, ` +
  `сэкономлено ${(saved / 1024 / 1024).toFixed(1)} МБ`
);
