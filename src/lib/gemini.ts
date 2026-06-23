// Один запрос к Gemini для всех ИИ-функций (перевод рецептов, сканирование фото).
//
// На сервере в РФ Gemini блокируется Google по IP — ходим через прокси (GEMINI_BASE_URL),
// который ведёт на домашний ПК. Локально переменной нет → идём к Google напрямую.
//
// Автоповтор: бесплатная модель иногда отвечает 503 «перегружена» или 429 «слишком много
// запросов» — это временно. Тогда ждём пару секунд и пробуем снова, чтобы пользователю
// не приходилось жать кнопку вручную.

const MODEL = "gemini-2.5-flash";

export async function geminiGenerate(
  apiKey: string,
  body: unknown,
  retries = 3
): Promise<Response> {
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const url = `${base}/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const payload = JSON.stringify(body);

  let res!: Response;
  for (let attempt = 0; attempt <= retries; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    // Успех или «настоящая» ошибка (неверный запрос, нет ключа и т.п.) — отдаём как есть.
    if (res.status !== 503 && res.status !== 429) return res;
    // Перегрузка — ждём и пробуем снова: 1.5с, 3с, 4.5с.
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  // Повторы кончились, всё ещё перегрузка — вернём последний ответ, вызывающий обработает.
  return res;
}
