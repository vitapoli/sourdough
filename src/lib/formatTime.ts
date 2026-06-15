import type { Lang } from "@/lib/i18n";

export function formatTime(hours: number, lang: Lang = "ru"): string {
  const clamped = Math.max(0, hours);
  const h = Math.floor(clamped);
  const m = Math.round((clamped - h) * 60);
  const hUnit = lang === "en" ? "h" : "ч";
  const mUnit = lang === "en" ? "min" : "мин";
  if (h === 0) return `${m} ${mUnit}`;
  if (m === 0) return `${h} ${hUnit}`;
  return `${h} ${hUnit} ${m} ${mUnit}`;
}
