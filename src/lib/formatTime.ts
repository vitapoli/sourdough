export function formatTime(hours: number): string {
  const clamped = Math.max(0, hours);
  const h = Math.floor(clamped);
  const m = Math.round((clamped - h) * 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
