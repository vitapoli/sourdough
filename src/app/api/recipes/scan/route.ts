import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY не настроен" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("photo") as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: "Нет фото" }, { status: 400 });
    }

    const imageParts = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        return {
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: Buffer.from(bytes).toString("base64"),
          },
        };
      })
    );

    const prompt = `Ты помощник пекаря. Распознай рецепт с фото (может быть несколько фото одного рецепта — объедини их в один).
Верни ТОЛЬКО JSON (без markdown-обёртки) в формате:
{
  "title": "название рецепта",
  "description": "краткое описание (1 предложение) или null",
  "flour": "перечисли все виды муки через запятую (например: Пшеничная, Ржаная, Цельнозерновая)",
  "hydration": число (процент гидратации = ЖИДКОСТИ НА ВОДНОЙ ОСНОВЕ / СУММАРНОЕ количество ВСЕЙ муки * 100. К жидкостям относятся ТОЛЬКО: вода, молоко, кефир, пахта, сыворотка, сок, йогурт. ИСКЛЮЧЕНИЕ: сухое молоко, сухие сливки и прочие сухие формы — это НЕ жидкость! НЕ считай за жидкость: масло (любое), яйца, мёд, сироп — это НЕ вода! К муке относятся: все виды муки + солод (любой: ржаной, ячменный, красный и т.д.). Считай от общего веса ВСЕЙ муки + солода. ВАЖНО про закваску: закваска по умолчанию считается 100% гидратации (т.е. 50% мука + 50% вода). Если в рецепте явно указана другая гидратация закваски — используй её. Муку и воду из закваски тоже включай в общий расчёт!),
  "hydrationCalc": {"totalFlour": число_г, "flourItems": ["мука пшеничная 300г", "мука из закваски 50г", ...], "totalLiquid": число_г, "liquidItems": ["вода 200г", "вода из закваски 50г", ...], "formula": "300 / 400 * 100 = 75%"},
  "starterPct": число (процент закваски от общего количества муки, если можно определить, иначе 20),
  "salt": число в граммах или null,
  "ingredients": [
    {"name": "название ингредиента", "amount": "количество (число или текст)", "unit": "единица (г, мл, шт, ст.л. и т.д.)", "phase": "название фазы или null"}
  ],
  "steps": ["шаг 1", "шаг 2", ...]
}
В ingredients перечисли ВСЕ ингредиенты рецепта (все виды муки отдельно С УКАЗАНИЕМ ВИДА — например "Мука пшеничная", "Мука ржаная", "Мука цельнозерновая", а НЕ просто "Мука"). Также вода, закваска, соль, масло, семечки, специи — всё что есть.
Если рецепт имеет фазы/этапы (заварка, опара, основное тесто, добавки и т.д.) — укажи phase для каждого ингредиента. Если рецепт простой и фаз нет — ставь phase: null.
ВАЖНО: гидратация = (сумма ВСЕХ жидкостей) / (сумма ВСЕЙ муки) * 100. Жидкости: вода, кипяток, молоко, кефир, сливки, пахта, сыворотка, сок, йогурт, какао (жидкое), чай, квас, газировка, газированная вода, чайный гриб (комбуча). Сухое молоко, сухие сливки, сухое какао — НЕ жидкость!
Если на фото нет рецепта, верни: {"error": "Не удалось распознать рецепт"}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...imageParts,
            ],
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json(
        { error: "Ошибка Gemini API", details: err },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    // Gemini 2.5 Flash может включать thinking — parts[0] будет "размышления",
    // а реальный ответ — в последнем part без thought:true
    const parts = geminiData.candidates?.[0]?.content?.parts || [];
    const responsePart = parts.filter((p: { thought?: boolean }) => !p.thought).pop();
    const text = responsePart?.text || "";

    // Извлекаем JSON из ответа (может быть обёрнут в ```json...```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Не удалось разобрать ответ", raw: text },
        { status: 422 }
      );
    }

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe scan error:", error);
    return NextResponse.json(
      { error: "Ошибка при распознавании", details: String(error) },
      { status: 500 }
    );
  }
}
