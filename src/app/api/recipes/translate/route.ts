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

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPL_API_KEY не настроен" }, { status: 500 });
  }

  try {
    const { id, targetLang } = await request.json();
    const langKey = targetLang === "ru" ? "ru" : "en";
    const target = langKey === "ru" ? "RU" : "EN-US";

    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return NextResponse.json({ error: "Рецепт не найден" }, { status: 404 });
    // Переводить можно только свои рецепты (встроенные уже переведены вручную)
    if (recipe.userId !== session.user.id) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    // Если перевод уже есть — отдаём его, не тратя запрос к DeepL
    const existing: Record<string, unknown> = recipe.translations ? JSON.parse(recipe.translations) : {};
    if (existing[langKey]) return NextResponse.json(existing[langKey]);

    // Собираем все строки рецепта в один запрос (так дешевле и быстрее)
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

    // DeepL: бесплатные ключи оканчиваются на ":fx" и используют другой домен
    const host = apiKey.trim().endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
    const dRes = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: texts, target_lang: target }),
    });

    if (!dRes.ok) {
      const err = await dRes.text();
      return NextResponse.json({ error: "Ошибка DeepL", details: err }, { status: 502 });
    }

    const dData = await dRes.json();
    const out: string[] = (dData.translations || []).map((t: { text: string }) => t.text);

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
