// Отправка «целей» (событий) в Яндекс.Метрику.
// Номер счётчика должен совпадать с тем, что подключён в src/app/layout.tsx.
export const YM_COUNTER = 109856355;

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...rest: unknown[]) => void;
  }
}

/**
 * Отметить достижение цели в Яндекс.Метрике.
 * Безопасно: если Метрика ещё не загрузилась (или отключена), просто ничего не делает.
 *
 * @param goal — идентификатор цели (тот же, что задаётся в интерфейсе Метрики)
 * @param params — необязательные параметры события
 */
export function track(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.ym !== "function") return;
  window.ym(YM_COUNTER, "reachGoal", goal, params);
}
