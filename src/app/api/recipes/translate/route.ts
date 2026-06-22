import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Определение роли ингредиента (копия логики из RecipesTab).
// Нужно, чтобы после перевода названий расчёт гидратации не сломался:
// роль (мука/жидкость/закваска) фиксируется по ОРИГИНАЛЬНОМУ названию.
const FLOUR_KW = ["мука", "солод"];
const LIQUID_KW = ["вода", "кипяток", "молоко", "кефир", "пахта", "сыворотка", "сок", "йогурт", "какао", "чай", "квас", "газировка", "чайный гриб"];
const STARTER_KW = ["закваска", "стартер", "левен", "leaven", "материнская", "культура"];
const IS_DRY = (n: string) => /сух[оиейая]/i.test(n);

type IngRole = "flour" | "liquid" | "starter" | "none";

function detectRole(name: string): IngRole {
  const n = name.toLowerCase();
  if (STARTER_KW.some((k) => n.includes(k))) return "starter";
  if (FLOUR_KW.some((k) => n.includes(k))) return "flour";
  if (!IS_DRY(name) && LIQUID_KW.some((k) => n.includes(k))) return "liquid";
  return "none";
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  phase?: string;
  hydration?: number;
  pinned?: boolean;
  pinnedUnit?: "g" | "%";
  role?: IngRole;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY не настроен" }, { status: 500 });
  }

  try {
    const { id, targetLang } = await request.json();
    const langKey = targetLang === "ru" ? "ru" : "en";
    const targetName = langKey === "ru" ? "русский" : "английский";

    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return NextResponse.json({ error: "Рецепт не найден" }, { status: 404 });
    // Переводить можно свои рецепты и любые ПУБЛИЧНЫЕ (например, со страницы пекаря).
    // Чужой приватный рецепт переводить нельзя. Перевод кэшируется в самом рецепте,
    // поэтому каждый публичный рецепт переводится на язык один раз — это общий кэш.
    if (recipe.userId !== session.user.id && !recipe.isPublic) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    // Если перевод уже есть — отдаём его, не тратя запрос к нейросети
    const existing: Record<string, unknown> = recipe.translations ? JSON.parse(recipe.translations) : {};
    if (existing[langKey]) return NextResponse.json(existing[langKey]);

    // Собираем все строки рецепта в один массив (один запрос — дешевле и быстрее)
    const ings: Ingredient[] = recipe.ingredients ? JSON.parse(recipe.ingredients) : [];
    const steps: string[] = recipe.steps ? JSON.parse(recipe.steps) : [];
    const phases = [...new Set(ings.map((i) => i.phase).filter(Boolean))] as string[];

    const texts: string[] = [];
    const idx = { title: -1, description: -1, flour: -1, ings: [] as number[], phases: [] as number[], steps: [] as number[] };
    idx.title = texts.push(recipe.title) - 1;
    if (recipe.description) idx.description = texts.push(recipe.description) - 1;
    if (recipe.flour) idx.flour = texts.push(recipe.flour) - 1;
    ings.forEach((i) => idx.ings.push(texts.push(i.name) - 1));
    phases.forEach((p) => idx.phases.push(texts.push(p) - 1));
    steps.forEach((s) => idx.steps.push(texts.push(s) - 1));

    // Перевод через Gemini (тот же сервис, что и сканирование рецептов)
    const prompt = `Переведи на ${targetName} язык каждую строку из этого JSON-массива. Это названия, ингредиенты и шаги рецепта хлеба на закваске — используй естественную и правильную пекарскую терминологию.
Верни ТОЛЬКО JSON-массив строк ТОЙ ЖЕ длины и в ТОМ ЖЕ порядке, без markdown-обёртки и без пояснений. Не объединяй и не разбивай элементы. Числа и единицы измерения оставляй как есть.
Если строка уже на нужном языке — верни её без изменений.
Массив для перевода:
${JSON.stringify(texts)}`;

    // На сервере в РФ Gemini блокируется — ходим через прокси (GEMINI_BASE_URL).
    // Локально переменной нет → идём напрямую.
    const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
    const geminiUrl = `${base}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json({ error: "Ошибка Gemini API", details: err }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    // Gemini 2.5 Flash может включать "размышления" — берём последний part без thought:true
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    const responsePart = parts.filter((p: { thought?: boolean }) => !p.thought).pop();
    const text = responsePart?.text || "";

    // Извлекаем JSON-массив (может быть обёрнут в ```json ... ```)
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return NextResponse.json({ error: "Не удалось разобрать перевод", raw: text }, { status: 422 });
    }
    const out: string[] = JSON.parse(match[0]);
    if (!Array.isArray(out) || out.length !== texts.length) {
      return NextResponse.json({ error: "Перевод вернулся в неверном формате" }, { status: 502 });
    }

    // Перевод названий фаз
    const phaseMap: Record<string, string> = {};
    phases.forEach((p, k) => { phaseMap[p] = out[idx.phases[k]]; });

    // Перевод ингредиентов: меняем только название и фазу, роль фиксируем по оригиналу
    const trIngs = ings.map((ing, k) => ({
      ...ing,
      name: out[idx.ings[k]],
      phase: ing.phase ? phaseMap[ing.phase] : ing.phase,
      role: ing.role ?? detectRole(ing.name),
    }));
    const trSteps = steps.map((_, k) => out[idx.steps[k]]);

    const translation = {
      title: out[idx.title],
      description: idx.description >= 0 ? out[idx.description] : null,
      flour: idx.flour >= 0 ? out[idx.flour] : recipe.flour,
      ingredients: ings.length ? JSON.stringify(trIngs) : null,
      steps: JSON.stringify(trSteps),
    };

    // Сохраняем перевод, чтобы в следующий раз показать мгновенно и без запроса
    existing[langKey] = translation;
    await prisma.recipe.update({ where: { id }, data: { translations: JSON.stringify(existing) } });

    return NextResponse.json(translation);
  } catch (error) {
    console.error("Recipe translate error:", error);
    return NextResponse.json({ error: "Ошибка перевода", details: String(error) }, { status: 500 });
  }
}
