// Простой rate-limiter в памяти
const attempts = new Map<string, { count: number; resetAt: number }>();

// Очистка старых записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of attempts) {
    if (val.resetAt < now) attempts.delete(key);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true; // разрешено
  }

  if (entry.count >= maxAttempts) {
    return false; // заблокировано
  }

  entry.count++;
  return true; // разрешено
}
